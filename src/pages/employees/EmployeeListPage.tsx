import { useEffect, useMemo, useState } from 'react';
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
import { useCustomersQuery } from '../../hooks/useCustomers';
import type { Customer, Employee } from '../../types/models';

function initials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function exportCsv(rows: Employee[], customerNameById: Map<number | undefined, string>) {
  const headers = ['Employee', 'Email', 'Phone', 'Designation', 'Customer', 'Joining Date', 'Status'];
  const lines = rows.map((e) =>
    [
      e.personalDetails?.name ?? '',
      e.emailId ?? '',
      e.phoneNo ?? '',
      e.careerDetails?.designation?.name ?? '',
      customerNameById.get(e.customerId) ?? '',
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>('All');
  const [customerId, setCustomerId] = useState<number | 'All'>('All');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const customerIdParam = customerId === 'All' ? undefined : customerId;

  // Debounce the search box so each keystroke doesn't fire its own backend request.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Unfiltered counts, shown on the tab badges regardless of the customer/search filters.
  const { data: activeEmployees = [] } = useEmployeesQuery(true);
  const { data: inactiveEmployees = [] } = useEmployeesQuery(false);
  const { data: customers = [] } = useCustomersQuery();

  // The employees actually rendered in the table — fetched from the backend, scoped to the
  // selected customer and search text (name / phone). With neither set, this shares
  // its cache with the queries above.
  const { data: employees = [], isLoading } = useEmployeesQuery(tab === 'active', customerIdParam, debouncedSearch);

  const inactivateMutation = useInactivateEmployee();
  const deleteMutation = useDeleteEmployee();

  const customerNameById = useMemo(
    () => new Map<number | undefined, string>(customers.map((c: Customer) => [c.id, c.name])),
    [customers]
  );

  const filtered = useMemo(() => {
    if (category === 'All') return employees;
    return employees.filter((e) => e.workDetails?.exitStatus === category);
  }, [employees, category]);

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
    { title: 'Phone', dataIndex: 'phoneNo', key: 'phoneNo' },
    { title: 'Designation', key: 'designation', render: (_: unknown, e: Employee) => e.careerDetails?.designation?.name ?? '—' },
    { title: 'Customer', key: 'customer', render: (_: unknown, e: Employee) => customerNameById.get(e.customerId) ?? '—' },
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
            <Select
              value={customerId}
              onChange={setCustomerId}
              style={{ width: 180 }}
              showSearch={{ optionFilterProp: 'label' }}
              options={[
                { value: 'All', label: 'All Customers' },
                ...customers.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="Search by name, phone..."
              prefix={<SearchOutlined style={{ color: '#cbd5e1' }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260, borderRadius: 20 }}
            />
            <Select
              value={category}
              onChange={setCategory}
              style={{ width: 140 }}
              showSearch={{ optionFilterProp: 'label' }}
              options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }))}
            />
            <Button icon={<DownloadOutlined />} onClick={() => exportCsv(filtered, customerNameById)}>
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
