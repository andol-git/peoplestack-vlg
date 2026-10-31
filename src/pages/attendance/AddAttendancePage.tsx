import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, DatePicker, Dropdown, Input, Modal, Select, Table, Tooltip, message } from 'antd';
import { LeftOutlined, LockOutlined, MoreOutlined, RightOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useCustomersQuery } from '../../hooks/useCustomers';
import { useEmployeesByCustomerQuery } from '../../hooks/useEmployees';
import { useAttendanceLockedPeriodsQuery, useAttendanceQuery, useSaveBulkAttendance } from '../../hooks/useAttendance';
import type { BulkAttendanceEntry, Employee } from '../../types/models';

type Status = 'P' | 'A' | null;

const DATE_FORMAT = 'YYYY-MM-DD';

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  color: '#475569',
  marginBottom: 6,
};

const STATUS_STYLE: Record<'P' | 'A', { color: string; background: string }> = {
  P: { color: '#15803d', background: '#dcfce7' },
  A: { color: '#b91c1c', background: '#fee2e2' },
};

function cellKey(employeeId: number, date: string): string {
  return `${employeeId}|${date}`;
}

function startOfWeek(d: Dayjs): Dayjs {
  // Weeks run Monday–Sunday regardless of locale.
  return d.startOf('day').subtract((d.day() + 6) % 7, 'day');
}

function employeeName(e: Employee): string {
  return e.personalDetails?.name || `Employee ${e.id}`;
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function newIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function PresentAbsent({ p, a }: { p: number; a: number }) {
  return (
    <span style={{ fontSize: 12 }}>
      <span style={{ color: '#15803d', fontWeight: 600 }}>{p}</span>
      {' / '}
      <span style={{ color: '#b91c1c', fontWeight: 600 }}>{a}</span>
    </span>
  );
}

/**
 * Week grid (Mon–Sun) for marking attendance by hand, mainly for back-filling past
 * days. Single-day attendance is entered through the Excel upload instead.
 */
export function AddAttendancePage() {
  const today = dayjs().startOf('day');

  const [customerId, setCustomerId] = useState<number | undefined>();
  const [weekStart, setWeekStart] = useState<Dayjs>(startOfWeek(today));
  const [search, setSearch] = useState('');
  // Unsaved edits, keyed by "employeeId|date". Only keys the user touched are present.
  const [draft, setDraft] = useState<Record<string, Status>>({});
  // Per-cell errors from the last failed save, same keys.
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});

  const { data: customers = [] } = useCustomersQuery();
  const customerOptions = useMemo(
    () => customers.filter((c) => !!c.id).map((c) => ({ value: c.id as number, label: c.name })),
    [customers]
  );
  const effectiveCustomerId = customerId ?? customerOptions[0]?.value;

  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')), [weekStart]);
  const fromDate = dates[0].format(DATE_FORMAT);
  const toDate = dates[6].format(DATE_FORMAT);

  const { data: employees = [], isLoading: employeesLoading } = useEmployeesByCustomerQuery(effectiveCustomerId);
  const { data: records = [], isLoading: recordsLoading } = useAttendanceQuery({
    companyId: effectiveCustomerId !== undefined ? String(effectiveCustomerId) : '',
    dateFrom: fromDate,
    dateTo: toDate,
  });
  const { data: lockedPeriods = [] } = useAttendanceLockedPeriodsQuery(effectiveCustomerId, fromDate, toDate);
  const saveMutation = useSaveBulkAttendance();

  const saved = useMemo(() => {
    const map: Record<string, Status> = {};
    for (const r of records) map[cellKey(Number(r.employeeId), r.attendanceDate)] = r.present ? 'P' : 'A';
    return map;
  }, [records]);

  const valueOf = (key: string): Status => (key in draft ? draft[key] : saved[key] ?? null);
  const isChanged = (key: string) => key in draft && draft[key] !== (saved[key] ?? null);

  const changedKeys = useMemo(
    () => Object.keys(draft).filter((key) => draft[key] !== (saved[key] ?? null)),
    [draft, saved]
  );
  const dirty = changedKeys.length > 0;

  // Warn before closing/reloading the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Why each visible date can't be edited (future, or inside a payroll run), or null.
  const lockByDate = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const d of dates) {
      let reason: string | null = null;
      if (d.isAfter(today)) {
        reason = "Attendance can't be marked for a future date";
      } else {
        const period = lockedPeriods.find((p) => !d.isBefore(dayjs(p.fromDate)) && !d.isAfter(dayjs(p.toDate)));
        if (period) {
          reason = `Payroll already run for ${dayjs(period.fromDate).format('D MMM')} – ${dayjs(period.toDate).format('D MMM YYYY')}`;
        }
      }
      map[d.format(DATE_FORMAT)] = reason;
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates, lockedPeriods]);

  const visibleEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = employees.filter((e) => e.id !== undefined);
    if (!term) return list;
    return list.filter((e) => employeeName(e).toLowerCase().includes(term) || String(e.id).includes(term));
  }, [employees, search]);

  function setCells(updates: Record<string, Status>) {
    setDraft((prev) => ({ ...prev, ...updates }));
    setCellErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(updates)) delete next[key];
      return next;
    });
  }

  function cycleCell(employeeId: number, date: string) {
    if (lockByDate[date]) return;
    const current = valueOf(cellKey(employeeId, date));
    setCells({ [cellKey(employeeId, date)]: current === null ? 'P' : current === 'P' ? 'A' : null });
  }

  function markDate(date: string, status: Status) {
    if (lockByDate[date]) return;
    const updates: Record<string, Status> = {};
    for (const e of visibleEmployees) updates[cellKey(e.id as number, date)] = status;
    setCells(updates);
  }

  function markEmployeeWeek(employeeId: number, status: Status) {
    const updates: Record<string, Status> = {};
    for (const d of dates) {
      const date = d.format(DATE_FORMAT);
      if (!lockByDate[date]) updates[cellKey(employeeId, date)] = status;
    }
    setCells(updates);
  }

  // Runs `action` straight away, or after confirming that unsaved changes will be lost.
  function guardDiscard(action: () => void) {
    if (!dirty) {
      action();
      return;
    }
    Modal.confirm({
      title: 'Discard unsaved changes?',
      content: `You have ${changedKeys.length} unsaved change${changedKeys.length === 1 ? '' : 's'}.`,
      okText: 'Discard',
      okButtonProps: { danger: true },
      cancelText: 'Keep editing',
      onOk: () => {
        setDraft({});
        setCellErrors({});
        action();
      },
    });
  }

  function changeWeek(anyDayInWeek: Dayjs) {
    const next = startOfWeek(anyDayInWeek.isAfter(today) ? today : anyDayInWeek);
    if (!next.isSame(weekStart, 'day')) guardDiscard(() => setWeekStart(next));
  }

  const isCurrentWeek = weekStart.isSame(startOfWeek(today), 'day');

  async function handleSave() {
    if (effectiveCustomerId === undefined || !dirty) return;
    const entries: BulkAttendanceEntry[] = changedKeys.map((key) => {
      const [employeeId, date] = key.split('|');
      const status = draft[key];
      return { employeeId: Number(employeeId), date, present: status === null ? null : status === 'P' };
    });
    try {
      const result = await saveMutation.mutateAsync({
        customerId: effectiveCustomerId,
        entries,
        idempotencyKey: newIdempotencyKey(),
      });
      const parts = [
        result.created && `${result.created} added`,
        result.updated && `${result.updated} updated`,
        result.cleared && `${result.cleared} cleared`,
      ].filter(Boolean);
      message.success(`Attendance saved${parts.length ? ` (${parts.join(', ')})` : ''}.`);
      setDraft({});
      setCellErrors({});
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.fieldErrors && Object.keys(data.fieldErrors).length) setCellErrors(data.fieldErrors);
      message.error(data?.message ?? 'Failed to save attendance.');
    }
  }

  function handleDiscard() {
    setDraft({});
    setCellErrors({});
  }

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      fixed: 'left' as const,
      width: 240,
      render: (_: unknown, e: Employee) => {
        const name = employeeName(e);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar size={30} style={{ background: '#e0e7ff', color: '#4338ca', fontSize: 12, flexShrink: 0 }}>
              {initials(name)}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>ID {e.id}</div>
            </div>
            <Dropdown
              trigger={['click']}
              menu={{
                items: [
                  { key: 'P', label: 'Present all week' },
                  { key: 'A', label: 'Absent all week' },
                  { key: 'clear', label: 'Clear week' },
                ],
                onClick: ({ key }) => markEmployeeWeek(e.id as number, key === 'clear' ? null : (key as Status)),
              }}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} style={{ marginLeft: 'auto' }} />
            </Dropdown>
          </div>
        );
      },
    },
    ...dates.map((d) => {
      const date = d.format(DATE_FORMAT);
      const lock = lockByDate[date];
      const isToday = d.isSame(today, 'day');
      const isFuture = d.isAfter(today);
      return {
        key: date,
        align: 'center' as const,
        width: 92,
        title: (
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 700, color: isToday ? '#2563eb' : undefined }}>{d.format('ddd')}</div>
            <div style={{ fontSize: 12, color: isToday ? '#2563eb' : '#64748b' }}>{d.format('D MMM')}</div>
            {lock ? (
              <Tooltip title={lock}>
                <LockOutlined style={{ color: '#94a3b8', marginTop: 4 }} />
              </Tooltip>
            ) : (
              <Tooltip title="Mark everyone shown Present for this day">
                <Button size="small" type="link" style={{ padding: 0, height: 18, fontSize: 11 }} onClick={() => markDate(date, 'P')}>
                  All P
                </Button>
              </Tooltip>
            )}
          </div>
        ),
        render: (_: unknown, e: Employee) => {
          const key = cellKey(e.id as number, date);
          const value = valueOf(key);
          const error = cellErrors[key];
          const style = value ? STATUS_STYLE[value] : { color: '#cbd5e1', background: '#f8fafc' };
          return (
            <Tooltip title={error ?? lock ?? undefined}>
              <button
                type="button"
                disabled={!!lock}
                onClick={() => cycleCell(e.id as number, date)}
                style={{
                  width: 40,
                  height: 32,
                  borderRadius: 6,
                  border: error ? '2px solid #ef4444' : isChanged(key) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  fontWeight: 700,
                  cursor: lock ? 'not-allowed' : 'pointer',
                  opacity: lock ? 0.55 : 1,
                  ...style,
                }}
              >
                {value ?? (isFuture ? '' : '·')}
              </button>
            </Tooltip>
          );
        },
      };
    }),
    {
      title: 'P / A',
      key: 'totals',
      align: 'center' as const,
      width: 80,
      render: (_: unknown, e: Employee) => {
        let p = 0;
        let a = 0;
        for (const d of dates) {
          const v = valueOf(cellKey(e.id as number, d.format(DATE_FORMAT)));
          if (v === 'P') p++;
          else if (v === 'A') a++;
        }
        return <PresentAbsent p={p} a={a} />;
      },
    },
  ];

  function summary() {
    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Present / Absent</span>
          </Table.Summary.Cell>
          {dates.map((d, i) => {
            const date = d.format(DATE_FORMAT);
            let p = 0;
            let a = 0;
            for (const e of visibleEmployees) {
              const v = valueOf(cellKey(e.id as number, date));
              if (v === 'P') p++;
              else if (v === 'A') a++;
            }
            return (
              <Table.Summary.Cell key={date} index={i + 1} align="center">
                <PresentAbsent p={p} a={a} />
              </Table.Summary.Cell>
            );
          })}
          <Table.Summary.Cell index={dates.length + 1} />
        </Table.Summary.Row>
      </Table.Summary>
    );
  }

  const weekLabel = `${dates[0].format('D MMM')} – ${dates[6].format('D MMM YYYY')}`;

  return (
    <div style={{ paddingBottom: dirty ? 72 : 0 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Add Attendance</h1>
        <p style={{ margin: '4px 0 0', color: '#9ca3af' }}>
          Mark employees Present or Absent for a week at a time — click a cell to cycle P → A → empty
        </p>
      </div>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={labelStyle}>
              Customer <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <Select
              value={effectiveCustomerId}
              onChange={(v) => guardDiscard(() => setCustomerId(v))}
              style={{ width: 220 }}
              placeholder="Select a customer"
              showSearch={{ optionFilterProp: 'label' }}
              options={customerOptions}
            />
          </div>

          <div>
            <div style={labelStyle}>Week</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Button icon={<LeftOutlined />} onClick={() => changeWeek(weekStart.subtract(7, 'day'))} />
              <DatePicker
                value={weekStart}
                allowClear={false}
                disabledDate={(d) => d.isAfter(today, 'day')}
                format={() => weekLabel}
                onChange={(d) => d && changeWeek(d)}
                style={{ width: 200 }}
              />
              <Button icon={<RightOutlined />} disabled={isCurrentWeek} onClick={() => changeWeek(weekStart.add(7, 'day'))} />
              {!isCurrentWeek && (
                <Button type="link" onClick={() => changeWeek(today)}>
                  This week
                </Button>
              )}
            </div>
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <Input
              allowClear
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Search employee"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220 }}
            />
          </div>
        </div>

        <Table<Employee>
          rowKey={(e) => String(e.id)}
          loading={employeesLoading || recordsLoading}
          dataSource={visibleEmployees}
          columns={columns}
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          summary={summary}
          locale={{ emptyText: search ? 'No employees match.' : 'No active employees for this customer.' }}
        />
      </Card>

      {dirty && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: '#fff',
            borderTop: '1px solid #e2e8f0',
            boxShadow: '0 -4px 12px rgba(15, 23, 42, 0.06)',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <span style={{ color: '#475569', marginRight: 'auto' }}>
            <strong>{changedKeys.length}</strong> unsaved change{changedKeys.length === 1 ? '' : 's'}
          </span>
          <Button onClick={handleDiscard} disabled={saveMutation.isPending}>
            Discard
          </Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saveMutation.isPending} onClick={handleSave}>
            Save
          </Button>
        </div>
      )}
    </div>
  );
}
