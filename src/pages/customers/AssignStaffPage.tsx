import { useMemo, useState } from 'react';
import { Avatar, Button, Card, Input, Table, Tag } from 'antd';
import { SearchOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { useCustomersQuery } from '../../hooks/useCustomers';
import { AssignStaffModal } from '../../components/AssignStaffModal';
import type { Customer } from '../../types/models';

export function AssignStaffPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ id: number; name: string } | null>(null);
  const { data: customers = [], isLoading, refetch } = useCustomersQuery();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q));
  }, [customers, search]);

  const columns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_: unknown, c: Customer) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar className="ps-avatar">{c.name?.charAt(0) ?? 'C'}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.code}</div>
          </div>
        </div>
      ),
    },
    { title: 'Staff Count', dataIndex: 'assignedStaffCount', key: 'assignedStaffCount', render: (v: number) => v ?? 0 },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, c: Customer) => (c.isActive ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, c: Customer) => (
        <Button
          size="small"
          icon={<UsergroupAddOutlined />}
          onClick={() => setSelected({ id: c.id!, name: c.name! })}
        >
          Assign Staff
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Assign Staff</h1>
      <p style={{ margin: '0 0 16px', color: '#9ca3af' }}>Assign employees to customer sites</p>

      <Card>
        <Input
          placeholder="Search customers..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320, marginBottom: 16 }}
        />
        <Table rowKey="id" loading={isLoading} dataSource={filtered} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      {selected && (
        <AssignStaffModal
          customerId={selected.id}
          customerName={selected.name}
          open={!!selected}
          onClose={() => setSelected(null)}
          onAssigned={() => refetch()}
        />
      )}
    </div>
  );
}
