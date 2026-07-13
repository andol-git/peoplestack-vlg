import { useMemo, useState } from 'react';
import { Avatar, Button, Card, DatePicker, Input, Select, Table, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useAttendanceQuery } from '../../hooks/useAttendance';
import { DEFAULT_COMPANY_ID, type AttendanceFilters } from '../../api/attendance-api';
import { COMPANIES } from '../../constants/companies';
import type { AttendanceRecord } from '../../types/models';

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

interface PendingFilters {
  companyId: string;
  employeeId: string;
  dateFrom: Dayjs;
  dateTo: Dayjs;
}

export function TodayAttendancePage() {
  const today = dayjs();
  const initial: PendingFilters = {
    companyId: DEFAULT_COMPANY_ID,
    employeeId: '',
    dateFrom: today,
    dateTo: today,
  };
  const [pending, setPending] = useState<PendingFilters>(initial);
  const [applied, setApplied] = useState<PendingFilters>(initial);
  const [status, setStatus] = useState<'All' | 'Present' | 'Absent'>('All');

  const filters: AttendanceFilters = {
    companyId: applied.companyId,
    employeeId: applied.employeeId || undefined,
    dateFrom: applied.dateFrom.format('YYYY-MM-DD'),
    dateTo: applied.dateTo.format('YYYY-MM-DD'),
  };

  const { data: records = [], isLoading } = useAttendanceQuery(filters);

  const filtered = useMemo(() => {
    if (status === 'Present') return records.filter((r) => r.present);
    if (status === 'Absent') return records.filter((r) => !r.present);
    return records;
  }, [records, status]);

  function handleSearch() {
    setApplied(pending);
  }

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: unknown, r: AttendanceRecord) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar className="ps-avatar">{initials(r.employeeName)}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{r.employeeName}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{r.employeeId}</div>
          </div>
        </div>
      ),
    },
    { title: 'Date', dataIndex: 'attendanceDate', key: 'attendanceDate' },
    {
      title: 'Status',
      key: 'present',
      render: (_: unknown, r: AttendanceRecord) =>
        r.present ? <Tag color="success">Present</Tag> : <Tag color="error">Absent</Tag>,
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (v?: string) => (v ? new Date(v).toLocaleString('en-IN') : '—'),
    },
  ];

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Today's Attendance</h1>
      <p style={{ margin: '0 0 20px', color: '#9ca3af' }}>{today.format('dddd, D MMMM YYYY')}</p>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              Company <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <Select
              value={pending.companyId}
              onChange={(v) => setPending((p) => ({ ...p, companyId: v }))}
              style={{ width: 160 }}
              options={COMPANIES.map((c) => ({ value: c.id, label: c.label }))}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              Employee ID
            </div>
            <Input
              placeholder="Optional"
              value={pending.employeeId}
              onChange={(e) => setPending((p) => ({ ...p, employeeId: e.target.value }))}
              style={{ width: 160 }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              Date From
            </div>
            <DatePicker
              value={pending.dateFrom}
              onChange={(v) => setPending((p) => ({ ...p, dateFrom: v ?? today }))}
              style={{ width: 160 }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              Date To
            </div>
            <DatePicker
              value={pending.dateTo}
              onChange={(v) => setPending((p) => ({ ...p, dateTo: v ?? today }))}
              style={{ width: 160 }}
            />
          </div>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Search
          </Button>
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Select
          value={status}
          onChange={setStatus}
          style={{ width: 160 }}
          options={['All', 'Present', 'Absent'].map((s) => ({ value: s, label: s }))}
        />
      </div>

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={filtered}
        columns={columns}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />
    </div>
  );
}
