import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Input, Popconfirm, Space, Table, Tabs, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useDeleteEmployee, useEmployeesQuery, useInactivateEmployee } from '../../hooks/useEmployees';
import type { Employee } from '../../types/models';

export function EmployeeListPage() {
  const [tab, setTab] = useState<'active' | 'inactive'>('active');
  const [search, setSearch] = useState('');
  const { data: employees = [], isLoading } = useEmployeesQuery(tab === 'active');
  const inactivateMutation = useInactivateEmployee();
  const deleteMutation = useDeleteEmployee();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.idNo?.toLowerCase().includes(q) ||
        e.personalDetails?.name?.toLowerCase().includes(q) ||
        e.phoneNo?.includes(q) ||
        e.workDetails?.site?.toLowerCase()?.includes(q)
    );
  }, [employees, search]);

  function initials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: unknown, e: Employee) => (
        <Space>
          <Avatar className="ps-avatar">{initials(e.personalDetails?.name)}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{e.personalDetails?.name ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{e.idNo}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Phone', dataIndex: 'phoneNo', key: 'phoneNo' },
    { title: 'Site', key: 'site', render: (_: unknown, e: Employee) => e.workDetails?.site ?? '—' },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, e: Employee) =>
        e.isActive ? <Tag color="success">Active</Tag> : <Tag color="default">Inactive</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, e: Employee) => (
        <Space>
          <Link to={`/employees/${e.id}/edit`}>Edit</Link>
          {tab === 'active' && (
            <Popconfirm title="Deactivate this employee?" onConfirm={() => inactivateMutation.mutate(e.id!)}>
              <a>Deactivate</a>
            </Popconfirm>
          )}
          <Popconfirm title="Permanently delete?" onConfirm={() => deleteMutation.mutate(e.id!)}>
            <a style={{ color: '#ef4444' }}>Delete</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Employees</h1>
          <p style={{ margin: '4px 0 0', color: '#9ca3af' }}>Manage all workforce records</p>
        </div>
        <Link to="/employees/new">
          <Button type="primary" icon={<PlusOutlined />}>Add Employee</Button>
        </Link>
      </div>

      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key as 'active' | 'inactive')}
        items={[
          { key: 'active', label: 'Active' },
          { key: 'inactive', label: 'Inactive' },
        ]}
      />

      <Input
        placeholder="Search name, ID, phone..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 16 }}
      />

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={filtered}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
