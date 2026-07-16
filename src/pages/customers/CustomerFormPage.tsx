import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Col, Form, Input, Row, Switch, message } from 'antd';
import { useCreateCustomer, useCustomerQuery, useUpdateCustomer } from '../../hooks/useCustomers';
import type { Customer } from '../../types/models';

export function CustomerFormPage() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { data: customer } = useCustomerQuery(isEditMode ? +id! : undefined);
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (customer) form.setFieldsValue(customer);
    else form.setFieldsValue({ isActive: true });
  }, [customer, form]);

  async function handleSubmit() {
    try {
      const values: Customer = await form.validateFields();
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: +id!, customer: values });
        message.success(`Customer "${values.name}" updated successfully.`);
      } else {
        await createMutation.mutateAsync(values);
        message.success(`Customer "${values.name}" created successfully.`);
      }
      navigate('/customers');
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('Failed to save customer.');
    }
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, maxWidth: 640 }}>
        {isEditMode ? 'Edit Customer' : 'New Customer'}
      </h1>

      <Form form={form} layout="vertical" initialValues={{ isActive: true }} style={{ maxWidth: 640 }}>
        <Card>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                <Input placeholder="Enter customer name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Code" name="code">
                <Input placeholder="e.g. CUST001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Site" name="site">
                <Input placeholder="Enter site name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Contact Number" name="contactNumber">
                <Input placeholder="Enter contact number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Active" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <Button onClick={() => navigate('/customers')}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={handleSubmit}>
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </div>
      </Form>
    </div>
  );
}
