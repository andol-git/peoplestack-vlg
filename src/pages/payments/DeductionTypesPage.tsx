import { useState } from 'react';
import { Button, Card, Input, Popconfirm, Table, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCreateDeductionType, useDeductionTypesQuery, useDeleteDeductionType } from '../../hooks/useDeductionTypes';
import type { DeductionType } from '../../types/models';

export function DeductionTypesPage() {
  const [name, setName] = useState('');

  const { data: deductionTypes = [], isLoading } = useDeductionTypesQuery();
  const createMutation = useCreateDeductionType();
  const deleteMutation = useDeleteDeductionType();

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      message.error('Please enter a deduction type.');
      return;
    }
    try {
      await createMutation.mutateAsync(trimmed);
      message.success('Deduction type added.');
      setName('');
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Failed to add deduction type.');
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMutation.mutateAsync(id);
      message.success('Deduction type removed.');
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Failed to remove deduction type.');
    }
  }

  const columns = [
    { title: 'Deduction Type', dataIndex: 'name', key: 'name' },
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
      render: (_: unknown, row: DeductionType) => (
        <Popconfirm title="Remove this deduction type?" onConfirm={() => handleDelete(row.id)}>
          <Button type="text" size="small" icon={<DeleteOutlined />} style={{ color: '#ef4444' }} title="Delete" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Deduction Types</h1>
        <p style={{ margin: '4px 0 0', color: '#9ca3af' }}>Manage the deduction categories available across all customers</p>
      </div>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 20 }}>
          <div style={{ flex: 1, maxWidth: 320 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
              Deduction Type
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onPressEnter={handleAdd}
              placeholder="e.g. Uniform Deduction"
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} loading={createMutation.isPending} onClick={handleAdd}>
            Add
          </Button>
        </div>

        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={deductionTypes}
          columns={columns}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No deduction types added yet.' }}
        />
      </Card>
    </div>
  );
}
