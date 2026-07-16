import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Card, Col, Input, Popconfirm, Row, Space, Statistic, Table, Tag } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  ShopOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import { useCustomersQuery, useDeleteCustomer } from '../../hooks/useCustomers';
import type { Customer } from '../../types/models';

export function CustomerListPage() {
  const [search, setSearch] = useState('');
  const { data: customers = [], isLoading } = useCustomersQuery();
  const deleteMutation = useDeleteCustomer();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q));
  }, [customers, search]);

  const totalAssigned = customers.reduce((sum, c) => sum + (c.assignedStaffCount ?? 0), 0);

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, c: Customer) => (
        <Space>
          <Avatar className="ps-avatar">{c.name?.charAt(0) ?? 'C'}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.code}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Site', dataIndex: 'site', key: 'site', render: (v: string) => v ?? '—' },
    { title: 'Contact', dataIndex: 'contactNumber', key: 'contactNumber', render: (v: string) => v ?? '—' },
    { title: 'Staff Count', dataIndex: 'assignedStaffCount', key: 'assignedStaffCount', render: (v: number) => v ?? 0 },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, c: Customer) =>
        c.isActive ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, c: Customer) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <Link to={`/customers/${c.id}`}>
            <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: '#3b82f6' }} title="View" />
          </Link>
          <Link to={`/assignments?customerId=${c.id}`}>
            <Button type="text" size="small" icon={<UsergroupAddOutlined />} style={{ color: '#8b5cf6' }} title="Assign Staff" />
          </Link>
          <Link to={`/customers/${c.id}/edit`}>
            <Button type="text" size="small" icon={<EditOutlined />} style={{ color: '#22c55e' }} title="Edit" />
          </Link>
          <Popconfirm title="Delete this customer?" onConfirm={() => deleteMutation.mutate(c.id!)}>
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Customers</h1>
          <p style={{ margin: '4px 0 0', color: '#9ca3af' }}>Manage customers and assign staff to sites</p>
        </div>
        <Link to="/customers/new">
          <Button type="primary" icon={<PlusOutlined />}>Add Customer</Button>
        </Link>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <ShopOutlined style={{ fontSize: 20, color: '#3b82f6', marginBottom: 8 }} />
            <Statistic title="Total Customers" value={customers.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <TeamOutlined style={{ fontSize: 20, color: '#22c55e', marginBottom: 8 }} />
            <Statistic title="Staff Assigned" value={totalAssigned} />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Input
            placeholder="Search customers..."
            prefix={<SearchOutlined style={{ color: '#cbd5e1' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260, borderRadius: 20 }}
          />
        </div>

        <Table rowKey="id" loading={isLoading} dataSource={filtered} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
