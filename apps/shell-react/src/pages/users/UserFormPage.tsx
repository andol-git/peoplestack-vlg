import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Col, Form, Input, Row, Select, message } from 'antd';
import { useAssignRole, useCreateUser, useUpdateUserStatus, useUserQuery } from '../../hooks/useUsers';

const ROLES = [
  { id: 1, name: 'ROLE_SUPER_ADMIN', label: 'Super Admin' },
  { id: 3, name: 'ROLE_ADMIN', label: 'Admin' },
  { id: 4, name: 'ROLE_MANAGER', label: 'Manager' },
  { id: 2, name: 'ROLE_AGENT', label: 'Agent' },
  { id: 5, name: 'ROLE_EMPLOYEE', label: 'Employee' },
];

const COMPANIES = ['VLG Services', 'SecureGuard Pvt Ltd', 'AirPort Security', 'Elite Force'];

export function UserFormPage() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { data: user } = useUserQuery(isEditMode ? +id! : undefined);
  const createMutation = useCreateUser();
  const updateStatusMutation = useUpdateUserStatus();
  const assignRoleMutation = useAssignRole();
  const saving = createMutation.isPending || updateStatusMutation.isPending || assignRoleMutation.isPending;

  useEffect(() => {
    if (user) {
      const existingRole = ROLES.find((r) => r.name === user.roles?.[0]?.name);
      form.setFieldsValue({
        name: user.username,
        email: user.email,
        role: existingRole?.id ?? 5,
        status: user.isActive ? 'Active' : 'Inactive',
        company: 'VLG Services',
      });
    } else {
      form.setFieldsValue({ role: 5, company: 'VLG Services', status: 'Active' });
    }
  }, [user, form]);

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      const roleId = +values.role;

      if (isEditMode) {
        await updateStatusMutation.mutateAsync({ id: +id!, payload: { isActive: values.status === 'Active' } });
        await assignRoleMutation.mutateAsync({ id: +id!, payload: { roleId } });
        message.success('User updated successfully.');
      } else {
        await createMutation.mutateAsync({
          username: values.name,
          email: values.email,
          password: values.password,
          roleIds: [roleId],
        });
        message.success('User created successfully.');
      }
      navigate('/users');
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('Failed to save user.');
    }
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700 }}>
        {isEditMode ? 'Edit User' : 'New User'}
      </h1>

      <Form form={form} layout="vertical">
        <Card>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Role" name="role" rules={[{ required: true }]}>
                <Select options={ROLES.map((r) => ({ value: r.id, label: r.label }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Company" name="company">
                <Select options={COMPANIES.map((c) => ({ value: c, label: c }))} />
              </Form.Item>
            </Col>
            {isEditMode && (
              <Col span={12}>
                <Form.Item label="Status" name="status">
                  <Select options={['Active', 'Inactive'].map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
            )}
            {!isEditMode && (
              <>
                <Col span={12}>
                  <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, min: 6, message: 'Minimum 6 characters' }]}
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Confirm Password"
                    name="confirmPassword"
                    dependencies={['password']}
                    rules={[
                      { required: true },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) return Promise.resolve();
                          return Promise.reject(new Error('Passwords do not match'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                </Col>
              </>
            )}
            <Col span={24}>
              <Form.Item label="Notes" name="notes">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <Button onClick={() => navigate('/users')}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={handleSubmit}>
            {isEditMode ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </Form>
    </div>
  );
}
