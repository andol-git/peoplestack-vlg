import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Avatar, Button, Card, DatePicker, Dropdown, Input, Modal, Popover, Select, Table, Tooltip, message } from 'antd';
import {
  DownOutlined,
  LeftOutlined,
  LockOutlined,
  MoreOutlined,
  RightOutlined,
  SaveOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useCustomersQuery } from '../../hooks/useCustomers';
import { useEmployeesByCustomerQuery } from '../../hooks/useEmployees';
import { useAttendanceLockedPeriodsQuery, useAttendanceQuery, useSaveBulkAttendance } from '../../hooks/useAttendance';
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_META } from '../../constants/attendance';
import type { AttendanceStatus, BulkAttendanceEntry, Employee } from '../../types/models';

type Status = AttendanceStatus | null;
type Counts = Record<AttendanceStatus, number>;

const DATE_FORMAT = 'YYYY-MM-DD';

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  color: '#475569',
  marginBottom: 6,
};

// Keyboard shortcut -> status, e.g. "w" -> WO.
const SHORTCUTS: Record<string, AttendanceStatus> = Object.fromEntries(
  ATTENDANCE_STATUSES.map((s) => [ATTENDANCE_STATUS_META[s].shortcut.toLowerCase(), s])
);

const STATUS_MENU_ITEMS = [
  ...ATTENDANCE_STATUSES.map((s) => ({ key: s, label: `${s} — ${ATTENDANCE_STATUS_META[s].label}` })),
  { type: 'divider' as const },
  { key: 'clear', label: 'Clear' },
];

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

function emptyCounts(): Counts {
  return { P: 0, A: 0, WO: 0, OT: 0 };
}

function StatusCounts({ counts }: { counts: Counts }) {
  return (
    <span style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
      {ATTENDANCE_STATUSES.map((s, i) => (
        <span key={s}>
          {i > 0 && <span style={{ color: '#cbd5e1' }}> · </span>}
          <Tooltip title={ATTENDANCE_STATUS_META[s].label}>
            <span style={{ color: ATTENDANCE_STATUS_META[s].color, fontWeight: 600 }}>{counts[s]}</span>
          </Tooltip>
        </span>
      ))}
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
  // Keyboard cursor (row = index into visibleEmployees, col = day 0–6) and the cell whose picker is open.
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);
  const [pickerKey, setPickerKey] = useState<string | null>(null);

  const { data: customers = [] } = useCustomersQuery();
  const customerOptions = useMemo(
    () => customers.filter((c) => !!c.id).map((c) => ({ value: c.id as number, label: c.name })),
    [customers]
  );
  const effectiveCustomerId = customerId ?? customerOptions[0]?.value;

  const dates = useMemo(() => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')), [weekStart]);
  const dateStrings = useMemo(() => dates.map((d) => d.format(DATE_FORMAT)), [dates]);
  const fromDate = dateStrings[0];
  const toDate = dateStrings[6];

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
    for (const r of records) map[cellKey(Number(r.employeeId), r.attendanceDate)] = r.status;
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

  function setCell(employeeId: number, date: string, status: Status) {
    if (lockByDate[date]) return;
    setCells({ [cellKey(employeeId, date)]: status });
  }

  function markDate(date: string, status: Status) {
    if (lockByDate[date]) return;
    const updates: Record<string, Status> = {};
    for (const e of visibleEmployees) updates[cellKey(e.id as number, date)] = status;
    setCells(updates);
  }

  function markEmployeeWeek(employeeId: number, status: Status) {
    const updates: Record<string, Status> = {};
    for (const date of dateStrings) {
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
    if (!next.isSame(weekStart, 'day')) {
      guardDiscard(() => {
        setWeekStart(next);
        setActive(null);
        setPickerKey(null);
      });
    }
  }

  const isCurrentWeek = weekStart.isSame(startOfWeek(today), 'day');

  // Grid keyboard: arrows move, P / A / W / O mark (then step to the next day), Delete clears, Enter opens the picker.
  function handleGridKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).tagName === 'INPUT' || visibleEmployees.length === 0) return;
    const key = e.key.toLowerCase();
    const cur = active ?? { row: 0, col: 0 };
    const move = (row: number, col: number) => {
      setActive({
        row: Math.max(0, Math.min(row, visibleEmployees.length - 1)),
        col: Math.max(0, Math.min(col, 6)),
      });
      setPickerKey(null);
    };
    const employeeId = visibleEmployees[cur.row]?.id as number | undefined;
    const date = dateStrings[cur.col];

    if (key === 'arrowright') { e.preventDefault(); move(cur.row, cur.col + 1); }
    else if (key === 'arrowleft') { e.preventDefault(); move(cur.row, cur.col - 1); }
    else if (key === 'arrowdown') { e.preventDefault(); move(cur.row + 1, cur.col); }
    else if (key === 'arrowup') { e.preventDefault(); move(cur.row - 1, cur.col); }
    else if (key === 'escape') { setPickerKey(null); }
    else if (employeeId !== undefined && key in SHORTCUTS) {
      e.preventDefault();
      setCell(employeeId, date, SHORTCUTS[key]);
      move(cur.row, cur.col + 1);
    } else if (employeeId !== undefined && (key === 'delete' || key === 'backspace')) {
      e.preventDefault();
      setCell(employeeId, date, null);
    } else if (employeeId !== undefined && key === 'enter' && !lockByDate[date]) {
      e.preventDefault();
      setActive(cur);
      setPickerKey(cellKey(employeeId, date));
    }
  }

  async function handleSave() {
    if (effectiveCustomerId === undefined || !dirty) return;
    const entries: BulkAttendanceEntry[] = changedKeys.map((key) => {
      const [employeeId, date] = key.split('|');
      return { employeeId: Number(employeeId), date, status: draft[key] };
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

  function picker(employeeId: number, date: string) {
    const current = valueOf(cellKey(employeeId, date));
    const choose = (status: Status) => {
      setCell(employeeId, date, status);
      setPickerKey(null);
    };
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {ATTENDANCE_STATUSES.map((s) => {
          const meta = ATTENDANCE_STATUS_META[s];
          const selected = current === s;
          return (
            <Tooltip key={s} title={`${meta.label} (${meta.shortcut})`}>
              <button
                type="button"
                onClick={() => choose(s)}
                style={{
                  minWidth: 40,
                  height: 32,
                  borderRadius: 6,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: meta.color,
                  background: meta.background,
                  border: selected ? `2px solid ${meta.color}` : '1px solid transparent',
                }}
              >
                {s}
              </button>
            </Tooltip>
          );
        })}
        <Button type="text" size="small" disabled={current === null} onClick={() => choose(null)}>
          Clear
        </Button>
      </div>
    );
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
                items: [{ key: 'title', label: 'Mark whole week as', disabled: true }, ...STATUS_MENU_ITEMS],
                onClick: ({ key }) => markEmployeeWeek(e.id as number, key === 'clear' ? null : (key as AttendanceStatus)),
              }}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} style={{ marginLeft: 'auto' }} />
            </Dropdown>
          </div>
        );
      },
    },
    ...dates.map((d, col) => {
      const date = dateStrings[col];
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
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [{ key: 'title', label: 'Mark everyone shown as', disabled: true }, ...STATUS_MENU_ITEMS],
                  onClick: ({ key }) => markDate(date, key === 'clear' ? null : (key as AttendanceStatus)),
                }}
              >
                <Button size="small" type="link" style={{ padding: 0, height: 18, fontSize: 11 }}>
                  Mark all <DownOutlined style={{ fontSize: 9 }} />
                </Button>
              </Dropdown>
            )}
          </div>
        ),
        render: (_: unknown, e: Employee, row: number) => {
          const employeeId = e.id as number;
          const key = cellKey(employeeId, date);
          const value = valueOf(key);
          const error = cellErrors[key];
          const isActive = active?.row === row && active?.col === col;
          const meta = value ? ATTENDANCE_STATUS_META[value] : null;
          const button = (
            <button
              type="button"
              disabled={!!lock}
              onClick={() => {
                setActive({ row, col });
                setPickerKey(pickerKey === key ? null : key);
              }}
              style={{
                width: 44,
                height: 32,
                borderRadius: 6,
                border: error ? '2px solid #ef4444' : isChanged(key) ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                boxShadow: isActive ? '0 0 0 2px #1d4ed8' : undefined,
                fontWeight: 700,
                fontSize: 12,
                cursor: lock ? 'not-allowed' : 'pointer',
                opacity: lock ? 0.55 : 1,
                color: meta?.color ?? '#cbd5e1',
                background: meta?.background ?? '#f8fafc',
              }}
            >
              {value ?? (isFuture ? '' : '·')}
            </button>
          );
          if (pickerKey === key) {
            return (
              <Popover
                open
                trigger="click"
                placement="bottom"
                content={picker(employeeId, date)}
                onOpenChange={(open) => !open && setPickerKey(null)}
              >
                {button}
              </Popover>
            );
          }
          return (
            <Tooltip title={error ?? lock ?? (meta ? meta.label : undefined)} mouseEnterDelay={0.4}>
              {button}
            </Tooltip>
          );
        },
      };
    }),
    {
      title: 'P · A · WO · OT',
      key: 'totals',
      align: 'center' as const,
      width: 110,
      render: (_: unknown, e: Employee) => {
        const counts = emptyCounts();
        for (const date of dateStrings) {
          const v = valueOf(cellKey(e.id as number, date));
          if (v) counts[v]++;
        }
        return <StatusCounts counts={counts} />;
      },
    },
  ];

  function summary() {
    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Totals (P · A · WO · OT)</span>
          </Table.Summary.Cell>
          {dateStrings.map((date, i) => {
            const counts = emptyCounts();
            for (const e of visibleEmployees) {
              const v = valueOf(cellKey(e.id as number, date));
              if (v) counts[v]++;
            }
            return (
              <Table.Summary.Cell key={date} index={i + 1} align="center">
                <StatusCounts counts={counts} />
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
        <p style={{ margin: '4px 0 0', color: '#9ca3af' }}>Mark employees' attendance for a week at a time</p>
      </div>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={labelStyle}>
              Customer <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <Select
              value={effectiveCustomerId}
              onChange={(v) =>
                guardDiscard(() => {
                  setCustomerId(v);
                  setActive(null);
                  setPickerKey(null);
                })
              }
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
              onChange={(e) => {
                setSearch(e.target.value);
                setActive(null);
                setPickerKey(null);
              }}
              style={{ width: 220 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 12, fontSize: 12, color: '#64748b' }}>
          {ATTENDANCE_STATUSES.map((s) => {
            const meta = ATTENDANCE_STATUS_META[s];
            return (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    display: 'inline-block',
                    minWidth: 26,
                    textAlign: 'center',
                    padding: '1px 4px',
                    borderRadius: 4,
                    fontWeight: 700,
                    color: meta.color,
                    background: meta.background,
                  }}
                >
                  {s}
                </span>
                {meta.label}
              </span>
            );
          })}
          <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>
            Click a cell to choose · Keys: ← → ↑ ↓ move, <strong>P</strong> / <strong>A</strong> / <strong>W</strong> /{' '}
            <strong>O</strong> mark, Delete clears
          </span>
        </div>

        <div tabIndex={0} onKeyDown={handleGridKeyDown} style={{ outline: 'none' }}>
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
        </div>
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
