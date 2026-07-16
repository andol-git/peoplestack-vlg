import { useState } from 'react';
import { Modal, Select, Button, List, Popconfirm, message } from 'antd';
import { useAssignStaff, useAssignmentsQuery, useUnassignStaff } from '../hooks/useCustomers';
import { useEmployeesQuery } from '../hooks/useEmployees';

interface Props {
  customerId: number;
  customerName: string;
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignStaffModal({ customerId, customerName, open, onClose, onAssigned }: Props) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>();
  const { data: employees = [] } = useEmployeesQuery(true);
  const { data: assignments = [] } = useAssignmentsQuery(customerId);
  const assignMutation = useAssignStaff();
  const unassignMutation = useUnassignStaff();

  const assignedIds = new Set(assignments.map((a) => a.employeeId));
  const availableEmployees = employees.filter((e) => !assignedIds.has(e.id!));

  async function handleAssign() {
    if (!selectedEmployeeId) return;
    try {
      await assignMutation.mutateAsync({ customerId, employeeId: selectedEmployeeId });
      setSelectedEmployeeId(undefined);
      message.success('Staff assigned successfully.');
      onAssigned();
    } catch {
      message.error('Failed to assign staff.');
    }
  }

  async function handleUnassign(employeeId: number) {
    await unassignMutation.mutateAsync({ customerId, employeeId });
    onAssigned();
  }

  return (
    <Modal title={`Assign Staff — ${customerName}`} open={open} onCancel={onClose} footer={null}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Select
          style={{ flex: 1 }}
          placeholder="Select an employee"
          value={selectedEmployeeId}
          onChange={setSelectedEmployeeId}
          options={availableEmployees.map((e) => ({
            value: e.id,
            label: `${e.personalDetails?.name ?? e.idNo} (${e.idNo})`,
          }))}
          showSearch={{ optionFilterProp: 'label' }}
        />
        <Button type="primary" onClick={handleAssign} loading={assignMutation.isPending} disabled={!selectedEmployeeId}>
          Assign
        </Button>
      </div>

      <List
        header="Currently assigned"
        dataSource={assignments}
        renderItem={(a) => {
          const emp = employees.find((e) => e.id === a.employeeId);
          return (
            <List.Item
              actions={[
                <Popconfirm key="remove" title="Remove this assignment?" onConfirm={() => handleUnassign(a.employeeId)}>
                  <a style={{ color: '#ef4444' }}>Remove</a>
                </Popconfirm>,
              ]}
            >
              {emp?.personalDetails?.name ?? `Employee #${a.employeeId}`}
            </List.Item>
          );
        }}
      />
    </Modal>
  );
}
