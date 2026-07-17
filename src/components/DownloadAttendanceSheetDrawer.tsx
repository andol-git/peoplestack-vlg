import { useState } from 'react';
import { Drawer, Select, message } from 'antd';
import { useCustomersQuery } from '../hooks/useCustomers';
import { useEmployeesByCustomer } from '../hooks/useEmployees';
import type { Employee } from '../types/models';

interface Props {
  open: boolean;
  onClose: () => void;
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function downloadCsv(employees: Employee[], companyName: string) {
  const headers = ['Employee Id', 'Employee Name', 'Present'];
  const lines = employees.map((e) =>
    [e.id ?? '', e.personalDetails?.name ?? '', '']
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance-sheet-${slugify(companyName)}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DownloadAttendanceSheetDrawer({ open, onClose }: Props) {
  const { data: customers = [] } = useCustomersQuery();
  const fetchMutation = useEmployeesByCustomer();
  const [companyId, setCompanyId] = useState<number | undefined>();

  const companyOptions = customers
    .filter((c) => !!c.id)
    .map((c) => ({ value: c.id as number, label: c.name }));

  function handleClose() {
    setCompanyId(undefined);
    onClose();
  }

  async function handleCompanyChange(value: number) {
    setCompanyId(value);
    const company = customers.find((c) => c.id === value);
    try {
      const employees = await fetchMutation.mutateAsync(value);
      if (employees.length === 0) {
        message.warning('No employees found for this company.');
        return;
      }
      downloadCsv(employees, company?.name ?? String(value));
      message.success('Attendance sheet downloaded.');
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Failed to fetch employees.');
    }
  }

  return (
    <Drawer title="Download Attendance Sheet" open={open} onClose={handleClose} size={420}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 6 }}>
        Company
      </div>
      <Select
        value={companyId}
        onChange={handleCompanyChange}
        style={{ width: '100%' }}
        options={companyOptions}
        placeholder="Select a company"
        showSearch={{ optionFilterProp: 'label' }}
        loading={fetchMutation.isPending}
        disabled={fetchMutation.isPending}
      />
    </Drawer>
  );
}
