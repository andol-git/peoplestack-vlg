import { useMemo, useState } from 'react';
import { Button, Card, Input, Popconfirm, Select, Table, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCustomersQuery } from '../../hooks/useCustomers';
import { useAdvanceTypesQuery, useCreateAdvanceType, useDeleteAdvanceType } from '../../hooks/useAdvanceTypes';
import type { AdvanceType } from '../../types/models';

export function AdvanceTypesPage() {
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [name, setName] = useState('');

  const { data: customers = [] } = useCustomersQuery();
  const customerOptions = useMemo(
    () => customers.filter((c) => !!c.id).map((c) => ({ value: c.id as number, label: c.name })),
    [customers]
  );

  const { data: advanceTypes = [], isLoading } = useAdvanceTypesQuery(customerId);
  const createMutation = useCreateAdvanceType();
  const deleteMutation = useDeleteAdvanceType();

  async function handleAdd() {
    if (!customerId) {
      message.error('Please select a customer.');
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      message.error('Please enter an advance type.');
      return;
    }
    try {
      await createMutation.mutateAsync({ customerId, name: trimmed });
      message.success('Advance type added.');
      setName('');
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Failed to add advance type.');
    }
  }

  async function handleDelete(id: number) {
    if (!customerId) return;
    try {
      await deleteMutation.mutateAsync({ id, customerId });
      message.success('Advance type removed.');
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Failed to remove advance type.');
    }
  }

  const columns = [
    { title: 'Advance Type', dataIndex: 'name', key: 'name' },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string | undefined) => (v ? dayjs(v).format('D MMM YYYY, h:mm a') : '—'),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: unknown, row: AdvanceType) => (
        <Popconfirm title="Remove this advance type?" onConfirm={() => handleDelete(row.id)}>
          <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: '#ef4444' }} title="Delete" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Advance Types</h1>
        <p style={{ margin: '4px 0 0', color: '#9ca3af' }}>Manage the advance categories available per customer</p>
      </div>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              Customer <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <Select
              value={customerId}
              onChange={setCustomerId}
              style={{ width: 220 }}
              placeholder="Select a customer"
              showSearch={{ optionFilterProp: 'label' }}
              options={customerOptions}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 20 }}>
          <div style={{ flex: 1, maxWidth: 320 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              Advance Type
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onPressEnter={handleAdd}
              placeholder="e.g. Medical Advance"
              disabled={!customerId}
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={createMutation.isPending}
            disabled={!customerId}
            onClick={handleAdd}
          >
            Add
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={advanceTypes}
          columns={columns}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: customerId ? 'No advance types added for this customer yet.' : 'Select a customer to view its advance types.',
          }}
        />
      </Card>
    </div>
  );
}
