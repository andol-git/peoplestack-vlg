import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Card, Input, Popconfirm, Select, Space, Table, Tag } from 'antd';
import {
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useUpdateUserStatus, useUsersQuery } from '../../hooks/useUsers';
import type { User } from '../../types/models';

const ROLE_TAG_COLOR: Record<string, string> = {
  ROLE_SUPER_ADMIN: 'purple',
  ROLE_ADMIN: 'blue',
  ROLE_MANAGER: 'green',
  ROLE_AGENT: 'gold',
  ROLE_EMPLOYEE: 'default',
};

export function UserListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const { data: users = [], isLoading } = useUsersQuery();
  const updateStatusMutation = useUpdateUserStatus();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (q && !u.username.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (statusFilter === 'Active' && !u.isActive) return false;
      if (statusFilter === 'Inactive' && u.isActive) return false;
      return true;
    });
  }, [users, search, statusFilter]);

  function initials(name: string): string {
    return name.split(/[\s._-]/).map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, u: User) => (
        <Space>
          <Avatar className="ps-avatar">{initials(u.username)}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{u.username}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{u.email}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (v: string) => v ?? '—' },
    {
      title: 'Role',
      key: 'role',
      render: (_: unknown, u: User) => {
        const role = u.roles?.[0];
        return role ? <Tag color={ROLE_TAG_COLOR[role.name] ?? 'default'}>{role.name.replace('ROLE_', '')}</Tag> : '—';
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, u: User) => (u.isActive ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, u: User) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <Link to={`/users/${u.id}`}>
            <Button type="text" size="small" icon={<EyeOutlined />} style={{ color: '#3b82f6' }} title="View" />
          </Link>
          <Link to={`/users/${u.id}/edit`}>
            <Button type="text" size="small" icon={<EditOutlined />} style={{ color: '#22c55e' }} title="Edit" />
          </Link>
          <Popconfirm
            title={u.isActive ? 'Deactivate this user?' : 'Activate this user?'}
            onConfirm={() => updateStatusMutation.mutate({ id: u.id!, payload: { isActive: !u.isActive } })}
          >
            <Button
              type="text"
              size="small"
              icon={u.isActive ? <MinusCircleOutlined /> : <CheckCircleOutlined />}
              style={{ color: u.isActive ? '#f59e0b' : '#22c55e' }}
              title={u.isActive ? 'Deactivate' : 'Activate'}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Users</h1>
          <p style={{ margin: '4px 0 0', color: '#9ca3af' }}>Manage system users and roles</p>
        </div>
        <Link to="/users/new">
          <Button type="primary" icon={<PlusOutlined />}>Add User</Button>
        </Link>
      </div>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
          <Input
            placeholder="Search name or email..."
            prefix={<SearchOutlined style={{ color: '#cbd5e1' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260, borderRadius: 20 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            options={['All', 'Active', 'Inactive'].map((s) => ({ value: s, label: s }))}
          />
        </div>

        <Table rowKey="id" loading={isLoading} dataSource={filtered} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
