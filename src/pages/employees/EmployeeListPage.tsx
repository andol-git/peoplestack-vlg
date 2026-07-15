import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Card, Input, Popconfirm, Select, Table, Tag } from 'antd';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useDeleteEmployee, useEmployeesQuery, useInactivateEmployee } from '../../hooks/useEmployees';
import type { Employee } from '../../types/models';

function initials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function exportCsv(rows: Employee[]) {
  const headers = ['Employee', 'Email', 'ID No', 'Phone', 'Designation', 'Site', 'Joining Date', 'Status'];
  const lines = rows.map((e) =>
    [
      e.personalDetails?.name ?? '',
      e.emailId ?? '',
      e.idNo ?? '',
      e.phoneNo ?? '',
      e.careerDetails?.designation ?? '',
      e.workDetails?.site ?? '',
      e.careerDetails?.joiningDate ?? '',
      e.isActive ? 'Active' : 'Inactive',
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const CATEGORY_OPTIONS = ['All', 'Resigned', 'On Leave', 'Left'] as const;

export function EmployeeListPage() {
  const [tab, setTab] = useState<'active' | 'inactive'>('active');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>('All');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { data: activeEmployees = [] } = useEmployeesQuery(true);
  const { data: inactiveEmployees = [], isLoading: isLoadingInactive } = useEmployeesQuery(false);
  const isLoading = tab === 'active' ? false : isLoadingInactive;
  const employees = tab === 'active' ? activeEmployees : inactiveEmployees;

  const inactivateMutation = useInactivateEmployee();
  const deleteMutation = useDeleteEmployee();

  const filtered = useMemo(() => {
    let data = employees;
    if (category !== 'All') {
      data = data.filter((e) => e.workDetails?.exitStatus === category);
    }
    const q = search.toLowerCase();
    if (q) {
      data = data.filter(
        (e) =>
          e.idNo?.toLowerCase().includes(q) ||
          e.personalDetails?.name?.toLowerCase().includes(q) ||
          e.phoneNo?.includes(q) ||
          e.workDetails?.site?.toLowerCase()?.includes(q)
      );
    }
    return data;
  }, [employees, search, category]);

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: unknown, e: Employee) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar className="ps-avatar">{initials(e.personalDetails?.name)}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{e.personalDetails?.name ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{e.emailId}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'ID No',
      key: 'idNo',
      render: (_: unknown, e: Employee) => (
        <span
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            color: '#475569',
          }}
        >
          {e.idNo}
        </span>
      ),
    },
    { title: 'Phone', dataIndex: 'phoneNo', key: 'phoneNo' },
    { title: 'Designation', key: 'designation', render: (_: unknown, e: Employee) => e.careerDetails?.designation ?? '—' },
    { title: 'Site', key: 'site', render: (_: unknown, e: Employee) => e.workDetails?.site ?? '—' },
    { title: 'Joining Date', key: 'joiningDate', render: (_: unknown, e: Employee) => e.careerDetails?.joiningDate ?? '—' },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, e: Employee) =>
        e.isActive ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, e: Employee) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <Link to={`/employees/${e.id}`}>
            <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: '#3b82f6' }} title="View" />
          </Link>
          <Link to={`/employees/${e.id}/edit`}>
            <Button type="text" size="small" icon={<EditOutlined />} style={{ color: '#22c55e' }} title="Edit" />
          </Link>
          {tab === 'active' && (
            <Popconfirm title="Deactivate this employee?" onConfirm={() => inactivateMutation.mutate(e.id!)}>
              <Button type="text" size="small" icon={<MinusCircleOutlined />} style={{ color: '#f59e0b' }} title="Deactivate" />
            </Popconfirm>
          )}
          <Popconfirm title="Permanently delete?" onConfirm={() => deleteMutation.mutate(e.id!)}>
            <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: '#ef4444' }} title="Delete" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Employees</h1>
          <p style={{ margin: '4px 0 0', color: '#9ca3af' }}>
            Manage all facility staff — loaders, security, utility teams
          </p>
        </div>
        <Link to="/employees/new">
          <Button type="primary" icon={<PlusOutlined />}>Add Employee</Button>
        </Link>
      </div>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(
              [
                ['active', 'Active', activeEmployees.length],
                ['inactive', 'Inactive', inactiveEmployees.length],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: tab === key ? '#eef2ff' : 'transparent',
                  color: tab === key ? '#4f46e5' : '#64748b',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {label}
                <span
                  style={{
                    background: tab === key ? '#4f46e5' : '#e2e8f0',
                    color: tab === key ? '#fff' : '#64748b',
                    borderRadius: 999,
                    padding: '0 8px',
                    fontSize: 12,
                    fontWeight: 700,
                    minWidth: 20,
                    textAlign: 'center',
                    lineHeight: '18px',
                  }}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="Search by name, ID, phone..."
              prefix={<SearchOutlined style={{ color: '#cbd5e1' }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260, borderRadius: 20 }}
            />
            <Select
              value={category}
              onChange={setCategory}
              style={{ width: 140 }}
              options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))}
            />
            <Button icon={<DownloadOutlined />} onClick={() => exportCsv(filtered)}>
              Export
            </Button>
          </div>
        </div>

        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={filtered}
          columns={columns}
          pagination={{ pageSize: 10 }}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        />
      </Card>
    </div>
  );
}
