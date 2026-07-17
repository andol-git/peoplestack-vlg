import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Avatar, Button, Card, Input, Select, Table } from 'antd';
import { CheckCircleFilled, DownloadOutlined, MinusCircleFilled, SearchOutlined } from '@ant-design/icons';
import { useAttendanceQuery } from '../../hooks/useAttendance';
import { useCustomersQuery } from '../../hooks/useCustomers';

type DayStatus = 'P' | 'A' | 'W' | 'H' | 'N';

const YEARS = [2024, 2025, 2026, 2027];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Fixed-date national holidays. No holidays endpoint exists yet — replace with a real
// API once one is available; these are placeholders so holidays render distinctly from weekends.
const HOLIDAYS: Array<{ month: number; day: number; label: string }> = [
  { month: 0, day: 26, label: 'Republic Day' },
  { month: 7, day: 15, label: 'Independence Day' },
  { month: 9, day: 2, label: 'Gandhi Jayanti' },
];

function holidayLabel(month: number, day: number): string | undefined {
  return HOLIDAYS.find((h) => h.month === month && h.day === day)?.label;
}

const STATUS_COLOR: Record<DayStatus, string> = {
  P: '#3b82f6',
  A: '#ef4444',
  W: '#cbd5e1',
  H: '#a855f7',
  N: '#e2e8f0',
};

function statusIcon(status: DayStatus) {
  const color = STATUS_COLOR[status];
  if (status === 'P') return <CheckCircleFilled style={{ color, fontSize: 16 }} />;
  return <MinusCircleFilled style={{ color, fontSize: 16 }} />;
}

function LegendItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
      {icon} {label}
    </span>
  );
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
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
  const [search, setSearch] = useState('');

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

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => e.employeeName.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q));
  }, [employees, search]);

  function getStatus(emp: (typeof employees)[number], day: number): DayStatus {
    if (holidayLabel(month, day)) return 'H';
    if (isWeekend(day)) return 'W';
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const present = emp.byDate.get(dateStr);
    if (present === undefined) return 'N';
    return present ? 'P' : 'A';
  }

  function leaveDays(emp: (typeof employees)[number]) {
    let a = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (getStatus(emp, d) === 'A') a++;
    }
    return a;
  }

  function downloadReport() {
    const headers = ['Employee Name', 'Employee ID', ...daysArray.map(String), 'Leave Days'];
    const lines = filteredEmployees.map((emp) =>
      [
        emp.employeeName,
        emp.employeeId,
        ...daysArray.map((d) => getStatus(emp, d)),
        leaveDays(emp),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${year}-${String(month + 1).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const columns = [
    {
      title: 'Employee Name',
      key: 'name',
      fixed: 'left' as const,
      width: 200,
      render: (_: unknown, emp: (typeof employees)[number]) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar size={32} className="ps-avatar" style={{ flexShrink: 0 }}>{initials(emp.employeeName)}</Avatar>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{emp.employeeName}</span>
        </div>
      ),
    },
    ...daysArray.map((day) => {
      const holiday = holidayLabel(month, day);
      return {
        title: (
          <span style={{ fontWeight: 500, color: '#64748b' }} title={holiday}>
            {day}
          </span>
        ),
        key: `day-${day}`,
        width: 34,
        align: 'center' as const,
        render: (_: unknown, emp: (typeof employees)[number]) => (
          <span title={holiday}>{statusIcon(getStatus(emp, day))}</span>
        ),
      };
    }),
    {
      title: 'Leave',
      key: 'leave',
      fixed: 'right' as const,
      width: 70,
      align: 'center' as const,
      render: (_: unknown, emp: (typeof employees)[number]) => (
        <span style={{ color: '#f97316', fontWeight: 600, fontSize: 13 }}>{leaveDays(emp)} Day</span>
      ),
    },
  ];

  return (
    <div>
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Employee Attendance</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Input
              placeholder="Search employee..."
              prefix={<SearchOutlined style={{ color: '#cbd5e1' }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220, borderRadius: 20 }}
            />
            <Button icon={<DownloadOutlined />} onClick={downloadReport}>
              Download Report
            </Button>
            <Select
              value={pendingYear}
              onChange={(v) => {
                setPendingYear(v);
                setApplied((a) => ({ ...a, year: v }));
              }}
              style={{ width: 100 }}
              showSearch={{ optionFilterProp: 'label' }}
              options={YEARS.map((y) => ({ value: y, label: y }))}
            />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              value={pendingCompanyId || undefined}
              onChange={(v) => {
                setPendingCompanyId(v);
                setApplied((a) => ({ ...a, companyId: v }));
              }}
              placeholder="Select company"
              style={{ width: 160 }}
              showSearch={{ optionFilterProp: 'label' }}
              options={companyOptions}
            />
            <Select
              value={pendingMonth}
              onChange={(v) => {
                setPendingMonth(v);
                setApplied((a) => ({ ...a, month: v }));
              }}
              style={{ width: 140 }}
              showSearch={{ optionFilterProp: 'label' }}
              options={MONTHS.map((m, i) => ({ value: i, label: m }))}
            />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              Showing {filteredEmployees.length} employee(s) for {MONTHS[month]} {year}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <LegendItem icon={<CheckCircleFilled style={{ color: STATUS_COLOR.P, fontSize: 14 }} />} label="Present" />
            <LegendItem icon={<MinusCircleFilled style={{ color: STATUS_COLOR.A, fontSize: 14 }} />} label="Absent" />
            <LegendItem icon={<MinusCircleFilled style={{ color: STATUS_COLOR.W, fontSize: 14 }} />} label="Weekend" />
            <LegendItem icon={<MinusCircleFilled style={{ color: STATUS_COLOR.H, fontSize: 14 }} />} label="Holiday" />
            <LegendItem icon={<MinusCircleFilled style={{ color: STATUS_COLOR.N, fontSize: 14 }} />} label="No Record" />
          </div>
        </div>

        <Table
          rowKey="employeeId"
          loading={isLoading}
          dataSource={filteredEmployees}
          columns={columns}
          pagination={{ pageSize: 9, showSizeChanger: false }}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </Card>
    </div>
  );
}
