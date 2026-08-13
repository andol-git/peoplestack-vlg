import { useMemo, useState, type ReactNode } from 'react';
import { Avatar, Button, Card, DatePicker, Select, Table } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, MinusCircleFilled, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useAttendanceQuery } from '../../hooks/useAttendance';
import { useCustomersQuery } from '../../hooks/useCustomers';

type DayStatus = 'P' | 'A' | 'W' | 'N';

const STATUS_ICON: Record<DayStatus, ReactNode> = {
  P: <CheckCircleFilled style={{ color: '#22c55e' }} />,
  A: <CloseCircleFilled style={{ color: '#ef4444' }} />,
  W: <MinusCircleFilled style={{ color: '#94a3b8' }} />,
  N: <MinusCircleFilled style={{ color: '#e2e8f0' }} />,
};

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function LegendItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
      {icon} {label}
    </span>
  );
}

export function AttendanceSheetPage() {
  const today = dayjs();
  const [pendingCompanyId, setPendingCompanyId] = useState('');
  const [pendingDateFrom, setPendingDateFrom] = useState<Dayjs>(today.startOf('month'));
  const [pendingDateTo, setPendingDateTo] = useState<Dayjs>(today);
  const [applied, setApplied] = useState({
    companyId: '',
    dateFrom: today.startOf('month'),
    dateTo: today,
  });

  const { data: customers = [] } = useCustomersQuery();
  const companyOptions = useMemo(
    () => customers.filter((c) => !!c.id).map((c) => ({ value: String(c.id), label: c.name })),
    [customers]
  );

  // Derived directly (not via an effect) so the very first fetch fires the moment customers
  // are available, instead of waiting on an effect + re-render round-trip.
  const effectiveCompanyId = applied.companyId || pendingCompanyId || companyOptions[0]?.value || '';

  const { data: records = [], isLoading } = useAttendanceQuery({
    companyId: effectiveCompanyId,
    dateFrom: applied.dateFrom.format('YYYY-MM-DD'),
    dateTo: applied.dateTo.format('YYYY-MM-DD'),
  });

  const daysArray = useMemo(() => {
    const days: Dayjs[] = [];
    let cursor = applied.dateFrom.startOf('day');
    const end = applied.dateTo.startOf('day');
    while (!cursor.isAfter(end)) {
      days.push(cursor);
      cursor = cursor.add(1, 'day');
    }
    return days;
  }, [applied.dateFrom, applied.dateTo]);

  function isWeekend(date: Dayjs): boolean {
    const d = date.day();
    return d === 0 || d === 6;
  }

  // Group the flat record list into one row per employee, with a date -> present lookup.
  const employees = useMemo(() => {
    const byEmployee = new Map<string, { employeeId: string; employeeName: string; byDate: Map<string, boolean> }>();

    for (const r of records) {
      if (!byEmployee.has(r.employeeId)) {
        byEmployee.set(r.employeeId, { employeeId: r.employeeId, employeeName: r.employeeName, byDate: new Map() });
      }
      byEmployee.get(r.employeeId)!.byDate.set(r.attendanceDate, r.present);
    }

    return Array.from(byEmployee.values());
  }, [records]);

  function getStatus(emp: (typeof employees)[number], date: Dayjs): DayStatus {
    if (isWeekend(date)) return 'W';
    const present = emp.byDate.get(date.format('YYYY-MM-DD'));
    if (present === undefined) return 'N';
    return present ? 'P' : 'A';
  }

  function summary(emp: (typeof employees)[number]) {
    let p = 0, a = 0;
    for (const date of daysArray) {
      const s = getStatus(emp, date);
      if (s === 'P') p++;
      else if (s === 'A') a++;
    }
    return { p, a };
  }

  const columns = [
    {
      title: 'Employee Name',
      key: 'name',
      fixed: 'left' as const,
      width: 220,
      render: (_: unknown, emp: (typeof employees)[number]) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={32} className="ps-avatar" style={{ flexShrink: 0 }}>{initials(emp.employeeName)}</Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.employeeName}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{emp.employeeId}</div>
          </div>
        </div>
      ),
    },
    ...daysArray.map((date) => {
      const weekend = isWeekend(date);
      const weekendCell = weekend ? { style: { background: '#eff6ff' } } : {};
      return {
        title: (
          <span style={{ color: weekend ? '#3b82f6' : undefined, whiteSpace: 'nowrap' as const }}>
            {date.format('D MMM')}
          </span>
        ),
        key: `day-${date.format('YYYY-MM-DD')}`,
        width: 56,
        align: 'center' as const,
        onCell: () => weekendCell,
        onHeaderCell: () => weekendCell,
        render: (_: unknown, emp: (typeof employees)[number]) => STATUS_ICON[getStatus(emp, date)],
      };
    }),
    {
      title: 'P',
      key: 'present',
      fixed: 'right' as const,
      width: 46,
      align: 'center' as const,
      render: (_: unknown, emp: (typeof employees)[number]) => (
        <span style={{ color: '#16a34a', fontWeight: 700 }}>{summary(emp).p}</span>
      ),
    },
    {
      title: 'A',
      key: 'absent',
      fixed: 'right' as const,
      width: 46,
      align: 'center' as const,
      render: (_: unknown, emp: (typeof employees)[number]) => (
        <span style={{ color: '#dc2626', fontWeight: 700 }}>{summary(emp).a}</span>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Attendance Sheet</h1>
      <p style={{ margin: '0 0 20px', color: '#9ca3af' }}>Track daily attendance for all employees</p>

      <Card
        title={<span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Attendance Sheet</span>}
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              Company <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <Select
              value={effectiveCompanyId || undefined}
              onChange={setPendingCompanyId}
              style={{ width: 160 }}
              showSearch={{ optionFilterProp: 'label' }}
              options={companyOptions}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              From Date <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <DatePicker
              value={pendingDateFrom}
              onChange={(v) => v && setPendingDateFrom(v)}
              style={{ width: 160 }}
              allowClear={false}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              To Date <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <DatePicker
              value={pendingDateTo}
              onChange={(v) => v && setPendingDateTo(v)}
              style={{ width: 160 }}
              allowClear={false}
            />
          </div>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() =>
              setApplied({ companyId: effectiveCompanyId, dateFrom: pendingDateFrom, dateTo: pendingDateTo })
            }
          >
            Search
          </Button>
        </div>
      </Card>

      <Card styles={{ body: { padding: 20 } }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, color: '#64748b' }}>
            From <strong>{applied.dateFrom.format('D MMM YYYY')}</strong> to{' '}
            <strong>{applied.dateTo.format('D MMM YYYY')}</strong> | Showing{' '}
            <strong>{employees.length}</strong> employee(s)
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <LegendItem icon={<MinusCircleFilled style={{ color: '#94a3b8' }} />} label="Weekend" />
            <LegendItem icon={<CheckCircleFilled style={{ color: '#22c55e' }} />} label="Present" />
            <LegendItem icon={<CloseCircleFilled style={{ color: '#ef4444' }} />} label="Absent" />
            <LegendItem icon={<MinusCircleFilled style={{ color: '#e2e8f0' }} />} label="No Record" />
          </div>
        </div>

        <div   style={{
            display: 'flex',
            justifyContent: 'end',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}>
           <Button
            type="primary"
           icon={<UploadOutlined />}
           
          >
            Export
          </Button>
        </div>

        <Table
          rowKey="employeeId"
          loading={isLoading}
          dataSource={employees}
          columns={columns}
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="small"
          bordered
        />
      </Card>
    </div>
  );
}
