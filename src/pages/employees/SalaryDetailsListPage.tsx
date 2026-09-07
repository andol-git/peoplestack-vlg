import { useMemo, useState } from 'react';
import { Avatar, Button, Card, Select, Table, Tag } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useEmployeeSalaryDetailsQuery } from '../../hooks/useEmployeeSalaryDetails';
import { useCustomersQuery } from '../../hooks/useCustomers';
import { useEmployeesByCustomerQuery } from '../../hooks/useEmployees';
import { AddSalaryDetailDrawer } from '../../components/AddSalaryDetailDrawer';

function initials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// HRA/DA/Others are optional fields — null means "not set", distinct from an
// explicit 0, so render them as "—" rather than ₹0.00.
function formatOptionalCurrency(value: number | null | undefined): string {
  return value == null ? '—' : formatCurrency(value);
}

// One row per employee of the selected customer, left-joined against
// employee_salary_details: an employee with no salary row yet still shows
// up, with basic as 0 and no effective-from date.
interface SalaryRow {
  salaryDetailId?: number;
  employeeId: number;
  employeeIdNo: string;
  employeeName?: string;
  basic: number;
  hra: number | null;
  da: number | null;
  others: number | null;
  effectiveFrom?: string;
  hasRecord: boolean;
}

export function SalaryDetailsListPage() {
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [selectedForAdd, setSelectedForAdd] = useState<SalaryRow | null>(null);

  const { data: customers = [] } = useCustomersQuery();
  const customerOptions = useMemo(
    () => customers.filter((c) => !!c.id).map((c) => ({ value: c.id as number, label: c.name })),
    [customers]
  );

  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployeesByCustomerQuery(customerId);
  const { data: salaryDetails = [], isLoading: isLoadingSalaryDetails, refetch } =
    useEmployeeSalaryDetailsQuery(customerId);
  const isLoading = isLoadingEmployees || isLoadingSalaryDetails;

  // Salary details come back ordered latest-effective-first, so the first
  // match per employee is the current one.
  const rows: SalaryRow[] = useMemo(() => {
    const latestByEmployee = new Map<number, (typeof salaryDetails)[number]>();
    for (const detail of salaryDetails) {
      if (!latestByEmployee.has(detail.employeeId)) {
        latestByEmployee.set(detail.employeeId, detail);
      }
    }

    return employees
      .filter((e) => !!e.id)
      .map((e) => {
        const detail = latestByEmployee.get(e.id!);
        return {
          salaryDetailId: detail?.id,
          employeeId: e.id!,
          employeeIdNo: e.idNo,
          employeeName: e.personalDetails?.name,
          basic: detail?.basic ?? 0,
          hra: detail?.hra ?? null,
          da: detail?.da ?? null,
          others: detail?.others ?? null,
          effectiveFrom: detail?.effectiveFrom,
          hasRecord: !!detail,
        };
      });
  }, [employees, salaryDetails]);

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: unknown, row: SalaryRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar className="ps-avatar">{initials(row.employeeName)}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{row.employeeName ?? '—'}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{row.employeeIdNo}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Basic',
      dataIndex: 'basic',
      key: 'basic',
      align: 'right' as const,
      render: (v: number) => formatCurrency(v),
    },
    {
      title: 'HRA',
      dataIndex: 'hra',
      key: 'hra',
      align: 'right' as const,
      render: formatOptionalCurrency,
    },
    {
      title: 'DA',
      dataIndex: 'da',
      key: 'da',
      align: 'right' as const,
      render: formatOptionalCurrency,
    },
    {
      title: 'Others',
      dataIndex: 'others',
      key: 'others',
      align: 'right' as const,
      render: formatOptionalCurrency,
    },
    {
      title: 'Effective From',
      dataIndex: 'effectiveFrom',
      key: 'effectiveFrom',
      render: (v: string | undefined) => v ?? '—',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, row: SalaryRow) =>
        row.hasRecord ? <Tag color="success">Set</Tag> : <Tag color="default">Not set</Tag>,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right' as const,
      render: (_: unknown, row: SalaryRow) => (
        <Button
          size="small"
          icon={row.hasRecord ? <EditOutlined /> : <PlusOutlined />}
          onClick={() => setSelectedForAdd(row)}
        >
          {row.hasRecord ? 'Edit' : 'Add Salary'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Salary Details</h1>
        <p style={{ margin: '4px 0 0', color: '#9ca3af' }}>Fixed wage master (Basic, HRA, DA, Others), per employee</p>
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

        <Table
          rowKey="employeeId"
          loading={isLoading}
          dataSource={rows}
          columns={columns}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: customerId ? 'No employees found for this customer.' : 'Select a customer to view its employees.',
          }}
        />
      </Card>

      {selectedForAdd && (
        <AddSalaryDetailDrawer
          open={!!selectedForAdd}
          customerId={customerId!}
          employeeId={selectedForAdd.employeeId}
          employeeName={selectedForAdd.employeeName}
          employeeIdNo={selectedForAdd.employeeIdNo}
          existing={
            selectedForAdd.hasRecord && selectedForAdd.salaryDetailId && selectedForAdd.effectiveFrom
              ? {
                  id: selectedForAdd.salaryDetailId,
                  basic: selectedForAdd.basic,
                  hra: selectedForAdd.hra,
                  da: selectedForAdd.da,
                  others: selectedForAdd.others,
                  effectiveFrom: selectedForAdd.effectiveFrom,
                }
              : undefined
          }
          onClose={() => setSelectedForAdd(null)}
          onSaved={() => refetch()}
        />
      )}
    </div>
  );
}
