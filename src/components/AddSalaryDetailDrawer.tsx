import { useEffect } from 'react';
import { Button, DatePicker, Drawer, Form, InputNumber, message } from 'antd';
import dayjs from 'dayjs';
import { useCreateEmployeeSalaryDetail, useUpdateEmployeeSalaryDetail } from '../hooks/useEmployeeSalaryDetails';

interface ExistingSalaryDetail {
  id: number;
  basic: number;
  hra?: number | null;
  da?: number | null;
  others?: number | null;
  effectiveFrom: string; // YYYY-MM-DD
}

interface Props {
  open: boolean;
  customerId: number;
  employeeId: number;
  employeeName?: string;
  existing?: ExistingSalaryDetail;
  onClose: () => void;
  onSaved: () => void;
}

interface FormValues {
  basic: number;
  hra?: number;
  da?: number;
  others?: number;
  effectiveFrom: dayjs.Dayjs;
}

export function AddSalaryDetailDrawer({
  open,
  employeeId,
  employeeName,
  existing,
  onClose,
  onSaved,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const isEditMode = !!existing;
  const createMutation = useCreateEmployeeSalaryDetail();
  const updateMutation = useUpdateEmployeeSalaryDetail();
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    if (existing) {
      form.setFieldsValue({
        basic: existing.basic,
        hra: existing.hra ?? undefined,
        da: existing.da ?? undefined,
        others: existing.others ?? undefined,
        effectiveFrom: dayjs(existing.effectiveFrom),
      });
    } else {
      form.setFieldsValue({ basic: undefined, hra: undefined, da: undefined, others: undefined, effectiveFrom: dayjs() });
    }
  }, [open, existing, form]);

  function handleClose() {
    form.resetFields();
    onClose();
  }

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      const payload = {
        employeeId,
        basic: values.basic,
        hra: values.hra,
        da: values.da,
        others: values.others,
        effectiveFrom: values.effectiveFrom.format('YYYY-MM-DD'),
      };

      if (isEditMode) {
        await updateMutation.mutateAsync({ id: existing!.id, payload });
        message.success('Salary detail updated successfully.');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Salary detail added successfully.');
      }

      handleClose();
      onSaved();
    } catch (err: any) {
      if (err?.errorFields) return; // antd form validation error, already shown inline
      const apiMessage = err?.response?.data?.message;
      message.error(apiMessage ?? `Failed to ${isEditMode ? 'update' : 'add'} salary detail.`);
    }
  }

  return (
    <Drawer
      title={isEditMode ? 'Edit Salary Detail' : 'Add Salary Detail'}
      placement="right"
      width={420}
      open={open}
      onClose={handleClose}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={handleSubmit}>
            Save
          </Button>
        </div>
      }
    >
      <div style={{ marginBottom: 20, padding: 12, borderRadius: 8, background: '#f8fafc' }}>
        <div style={{ fontWeight: 600 }}>{employeeName ?? '—'}</div>
      </div>

      <Form form={form} layout="vertical" initialValues={{ effectiveFrom: dayjs() }}>
        <Form.Item
          label="Basic"
          name="basic"
          rules={[{ required: true, message: 'Basic is required' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            precision={2}
            prefix="₹"
            placeholder="e.g. 18000"
          />
        </Form.Item>

        <Form.Item label="HRA (optional)" name="hra">
          <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="₹" placeholder="e.g. 3200" />
        </Form.Item>

        <Form.Item label="DA (optional)" name="da">
          <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="₹" placeholder="e.g. 1500" />
        </Form.Item>

        <Form.Item label="Others (optional)" name="others">
          <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="₹" placeholder="e.g. 500" />
        </Form.Item>

        <Form.Item
          label="Effective From"
          name="effectiveFrom"
          rules={[{ required: true, message: 'Effective from date is required' }]}
        >
          <DatePicker style={{ width: '100%' }} allowClear={false} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
