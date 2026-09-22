import { useMemo, useState } from 'react';
import { Button, Card, Input, Select, Space, Table, message } from 'antd';
import { CloseOutlined, EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useCustomersQuery } from '../../hooks/useCustomers';
import { useCreateDesignation, useDesignationsQuery, useUpdateDesignation } from '../../hooks/useDesignations';
import type { Designation } from '../../types/models';

export function DesignationsPage() {
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const { data: customers = [] } = useCustomersQuery();
  const customerOptions = useMemo(
    () => customers.filter((c) => !!c.id).map((c) => ({ value: c.id as number, label: c.name })),
    [customers]
  );

  const { data: designations = [], isLoading } = useDesignationsQuery(customerId);
  const createMutation = useCreateDesignation();
  const updateMutation = useUpdateDesignation();

  async function handleAdd() {
    if (!customerId) {
      message.error('Please select a customer.');
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      message.error('Please enter a designation.');
      return;
    }
    try {
      await createMutation.mutateAsync({ customerId, name: trimmed });
      message.success('Designation added.');
      setName('');
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Failed to add designation.');
    }
  }

  function startEdit(row: Designation) {
    setEditingId(row.id);
    setEditingValue(row.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingValue('');
  }

  async function saveEdit(row: Designation) {
    if (!customerId) return;
    const trimmed = editingValue.trim();
    if (!trimmed) {
      message.error('Designation cannot be empty.');
      return;
    }
    try {
      await updateMutation.mutateAsync({ id: row.id, customerId, name: trimmed });
      message.success('Designation updated.');
      cancelEdit();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Failed to update designation.');
    }
  }

  const columns = [
    {
      title: 'Designation',
      key: 'name',
      render: (_: unknown, row: Designation) =>
        editingId === row.id ? (
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onPressEnter={() => saveEdit(row)}
            autoFocus
            style={{ maxWidth: 280 }}
          />
        ) : (
          row.name
        ),
    },
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
      render: (_: unknown, row: Designation) =>
        editingId === row.id ? (
          <Space>
            <Button
              type="text"
              size="small"
              icon={<SaveOutlined />}
              style={{ color: '#22c55e' }}
              loading={updateMutation.isPending}
              onClick={() => saveEdit(row)}
              title="Save"
            />
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={cancelEdit} title="Cancel" />
          </Space>
        ) : (
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            style={{ color: '#22c55e' }}
            onClick={() => startEdit(row)}
            title="Edit"
          />
        ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Designations</h1>
        <p style={{ margin: '4px 0 0', color: '#9ca3af' }}>Manage the designations available per customer</p>
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
              Designation
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onPressEnter={handleAdd}
              placeholder="e.g. TEAM LEAD"
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
          dataSource={designations}
          columns={columns}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: customerId ? 'No designations added for this customer yet.' : 'Select a customer to view its designations.',
          }}
        />
      </Card>
    </div>
  );
}
