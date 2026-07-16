import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Avatar, Button, Card, Select, Table } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, MinusCircleFilled, SearchOutlined } from '@ant-design/icons';
import { useAttendanceQuery } from '../../hooks/useAttendance';
import { useCustomersQuery } from '../../hooks/useCustomers';

type DayStatus = 'P' | 'A' | 'W' | 'N';

const YEARS = [2024, 2025, 2026, 2027];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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
  const now = new Date();
  const [pendingCompanyId, setPendingCompanyId] = useState('');
  const [pendingYear, setPendingYear] = useState(now.getFullYear());
  const [pendingMonth, setPendingMonth] = useState(now.getMonth());
  const [applied, setApplied] = useState({
    companyId: '',
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const { data: customers = [] } = useCustomersQuery();
  const companyOptions = useMemo(
    () => customers.filter((c) => !!c.code).map((c) => ({ value: c.code as string, label: c.name })),
    [customers]
  );

  useEffect(() => {
    if (!pendingCompanyId && companyOptions.length > 0) {
      const first = companyOptions[0].value;
      setPendingCompanyId(first);
      setApplied((a) => ({ ...a, companyId: first }));
    }
  }, [companyOptions, pendingCompanyId]);

  const { data: records = [], isLoading } = useAttendanceQuery({ companyId: applied.companyId });

  const { year, month } = applied;

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const daysArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  function isWeekend(day: number): boolean {
    const d = new Date(year, month, day).getDay();
    return d === 0 || d === 6;
  }

  // Group the flat record list into one row per employee, with a date -> present lookup.
  const employees = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const byEmployee = new Map<string, { employeeId: string; employeeName: string; byDate: Map<string, boolean> }>();

    for (const r of records) {
      if (!r.attendanceDate?.startsWith(monthPrefix)) continue;
      if (!byEmployee.has(r.employeeId)) {
        byEmployee.set(r.employeeId, { employeeId: r.employeeId, employeeName: r.employeeName, byDate: new Map() });
      }
      byEmployee.get(r.employeeId)!.byDate.set(r.attendanceDate, r.present);
    }

    return Array.from(byEmployee.values());
  }, [records, year, month]);

  function getStatus(emp: (typeof employees)[number], day: number): DayStatus {
    if (isWeekend(day)) return 'W';
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const present = emp.byDate.get(dateStr);
    if (present === undefined) return 'N';
    return present ? 'P' : 'A';
  }

  function summary(emp: (typeof employees)[number]) {
    let p = 0, a = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const s = getStatus(emp, d);
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
    ...daysArray.map((day) => {
      const weekend = isWeekend(day);
      const weekendCell = weekend ? { style: { background: '#eff6ff' } } : {};
      return {
        title: <span style={{ color: weekend ? '#3b82f6' : undefined }}>{day}</span>,
        key: `day-${day}`,
        width: 40,
        align: 'center' as const,
        onCell: () => weekendCell,
        onHeaderCell: () => weekendCell,
        render: (_: unknown, emp: (typeof employees)[number]) => STATUS_ICON[getStatus(emp, day)],
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
              value={pendingCompanyId || undefined}
              onChange={setPendingCompanyId}
              style={{ width: 160 }}
              options={companyOptions}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              Select Year <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <Select
              value={pendingYear}
              onChange={setPendingYear}
              style={{ width: 120 }}
              options={YEARS.map((y) => ({ value: y, label: y }))}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              Select Month <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <Select
              value={pendingMonth}
              onChange={setPendingMonth}
              style={{ width: 160 }}
              options={MONTHS.map((m, i) => ({ value: i, label: m }))}
            />
          </div>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => setApplied({ companyId: pendingCompanyId, year: pendingYear, month: pendingMonth })}
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
            Year: <strong>{year}</strong> | Month: <strong>{MONTHS[month]}</strong> | Showing{' '}
            <strong>{employees.length}</strong> employee(s)
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <LegendItem icon={<MinusCircleFilled style={{ color: '#94a3b8' }} />} label="Weekend" />
            <LegendItem icon={<CheckCircleFilled style={{ color: '#22c55e' }} />} label="Present" />
            <LegendItem icon={<CloseCircleFilled style={{ color: '#ef4444' }} />} label="Absent" />
            <LegendItem icon={<MinusCircleFilled style={{ color: '#e2e8f0' }} />} label="No Record" />
          </div>
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
