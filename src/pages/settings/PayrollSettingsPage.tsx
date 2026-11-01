import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Select, Spin, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useCustomersQuery } from '../../hooks/useCustomers';
import { usePayrollSettingsQuery, useSavePayrollSettings } from '../../hooks/usePayrollSettings';
import type { EsiComponent } from '../../types/models';

const ESI_OPTIONS: { value: EsiComponent; label: string }[] = [
  { value: 'BASIC', label: 'Basic' },
  { value: 'DA', label: 'DA' },
  { value: 'HRA', label: 'HRA' },
];

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  color: '#475569',
  marginBottom: 6,
};

const innerCardStyle = { maxWidth: 480, marginBottom: 20 };

export function PayrollSettingsPage() {
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [esiComponents, setEsiComponents] = useState<EsiComponent[]>([]);
  const [bonusEnabled, setBonusEnabled] = useState(false);
  const [leaveWagesEnabled, setLeaveWagesEnabled] = useState(false);

  const { data: customers = [] } = useCustomersQuery();
  const customerOptions = useMemo(
    () => customers.filter((c) => !!c.id).map((c) => ({ value: c.id as number, label: c.name })),
    [customers]
  );

  const { data: settings, isLoading } = usePayrollSettingsQuery(customerId);
  const saveMutation = useSavePayrollSettings();

  // Reset the form to the saved values whenever the customer (or its settings) changes.
  // A customer with no saved settings yet starts with nothing checked.
  useEffect(() => {
    setEsiComponents(settings?.esiComponents ?? []);
    setBonusEnabled(settings?.bonusEnabled ?? false);
    setLeaveWagesEnabled(settings?.leaveWagesEnabled ?? false);
  }, [customerId, settings]);

  async function handleSave() {
    if (!customerId) {
      message.error('Please select a customer.');
      return;
    }
    try {
      await saveMutation.mutateAsync({ customerId, esiComponents, bonusEnabled, leaveWagesEnabled });
      message.success('Payroll settings saved.');
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Failed to save payroll settings.');
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Payroll</h1>
        <p style={{ margin: '4px 0 0', color: '#9ca3af' }}>Configure payroll settings per customer</p>
      </div>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ marginBottom: 20 }}>
          <div style={labelStyle}>
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

        {!customerId ? (
          <div style={{ color: '#9ca3af' }}>Select a customer to configure its payroll settings.</div>
        ) : (
          <Spin spinning={isLoading}>
            <Card type="inner" title="ESI" style={innerCardStyle}>
              <div style={{ ...labelStyle, marginBottom: 10 }}>Components applicable for ESI</div>
              <Checkbox.Group
                options={ESI_OPTIONS}
                value={esiComponents}
                onChange={(values) => setEsiComponents(values as EsiComponent[])}
              />
            </Card>

            <Card type="inner" title="Bonus" style={innerCardStyle}>
              <Checkbox checked={bonusEnabled} onChange={(e) => setBonusEnabled(e.target.checked)}>
                Enable
              </Checkbox>
            </Card>

            <Card type="inner" title="Leave Wages" style={innerCardStyle}>
              <Checkbox checked={leaveWagesEnabled} onChange={(e) => setLeaveWagesEnabled(e.target.checked)}>
                Enable
              </Checkbox>
            </Card>

            <Button type="primary" icon={<SaveOutlined />} loading={saveMutation.isPending} onClick={handleSave}>
              Save
            </Button>
          </Spin>
        )}
      </Card>
    </div>
  );
}
