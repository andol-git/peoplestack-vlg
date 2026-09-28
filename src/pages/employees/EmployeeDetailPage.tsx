import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, Button, Card, Col, DatePicker, Descriptions, Form, Input, Row, Select, Skeleton, Tag, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEmployeeQuery, useUpdateEmployee } from '../../hooks/useEmployees';
import type { Employee } from '../../types/models';
import { GENDER_OPTIONS, MARITAL_OPTIONS, BLOOD_GROUP_OPTIONS, SHIFT_OPTIONS, OPTED_OPTIONS, STATE_OPTIONS } from '../../constants/employeeOptions';

type Section = 'basic' | 'personal' | 'work' | 'addresses';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const { data: employee, isLoading } = useEmployeeQuery(id ? +id : undefined);
  const updateMutation = useUpdateEmployee();

  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [basicForm] = Form.useForm();
  const [personalForm] = Form.useForm();
  const [workForm] = Form.useForm();
  const [addressesForm] = Form.useForm();

  function initials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }

  if (isLoading || !employee) {
    return <Skeleton active />;
  }

  function startEdit(section: Section) {
    if (section === 'basic') {
      basicForm.setFieldsValue({
        emailId: employee!.emailId,
        phoneNo: employee!.phoneNo,
        serialNumberAssigned: employee!.serialNumberAssigned,
      });
    }
    if (section === 'personal') {
      personalForm.setFieldsValue({
        ...employee!.personalDetails,
        dateOfBirth: employee!.personalDetails?.dateOfBirth ? dayjs(employee!.personalDetails.dateOfBirth) : undefined,
      });
    }
    if (section === 'work') {
      workForm.setFieldsValue({ ...employee!.workDetails });
    }
    if (section === 'addresses') {
      addressesForm.setFieldsValue({
        addresses: employee!.addresses?.length ? employee!.addresses : [{ addressType: 'PERMANENT' }, { addressType: 'TEMPORARY' }],
      });
    }
    setEditingSection(section);
  }

  async function saveSection(payload: Employee) {
    try {
      await updateMutation.mutateAsync({ id: employee!.id!, employee: payload });
      message.success('Updated successfully.');
      setEditingSection(null);
    } catch (err: any) {
      if (err?.errorFields) return; // antd validation error, already shown inline
      message.error(err?.response?.data?.message ?? 'Update failed.');
    }
  }

  async function handleSaveBasic() {
    const values = await basicForm.validateFields().catch(() => null);
    if (!values) return;
    await saveSection({ ...employee!, ...values });
  }

  async function handleSavePersonal() {
    const values = await personalForm.validateFields().catch(() => null);
    if (!values) return;
    await saveSection({
      ...employee!,
      personalDetails: {
        ...employee!.personalDetails,
        ...values,
        dateOfBirth: values.dateOfBirth?.format('YYYY-MM-DD'),
      },
    });
  }

  async function handleSaveWork() {
    const values = await workForm.validateFields().catch(() => null);
    if (!values) return;
    await saveSection({ ...employee!, workDetails: { ...employee!.workDetails, ...values } });
  }

  async function handleSaveAddresses() {
    const values = await addressesForm.validateFields().catch(() => null);
    if (!values) return;
    await saveSection({ ...employee!, addresses: values.addresses });
  }

  function sectionExtra(section: Section, onSave: () => void) {
    if (editingSection === section) {
      return (
        <>
          <Button size="small" onClick={() => setEditingSection(null)} style={{ marginRight: 8 }}>
            Cancel
          </Button>
          <Button size="small" type="primary" loading={updateMutation.isPending} onClick={onSave}>
            Save
          </Button>
        </>
      );
    }
    return (
      <Button size="small" icon={<EditOutlined />} onClick={() => startEdit(section)}>
        Edit
      </Button>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={48} className="ps-avatar">
            {initials(employee.personalDetails?.name)}
          </Avatar>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
              {employee.personalDetails?.name ?? '—'}
            </h1>
            <div style={{ color: '#9ca3af' }}>
              {employee.isActive ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>}
            </div>
          </div>
        </div>
      </div>

      <Card title="Basic Info" style={{ marginBottom: 16 }} extra={sectionExtra('basic', handleSaveBasic)}>
        {editingSection === 'basic' ? (
          <Form form={basicForm} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Email" name="emailId" rules={[{ type: 'email', message: 'Invalid email' }]}>
                  <Input placeholder="Enter email" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Phone" name="phoneNo" rules={[{ required: true, message: 'Phone is required' }]}>
                  <Input placeholder="Enter phone" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Serial Number" name="serialNumberAssigned">
                  <Input placeholder="Enter serial number" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions column={2}>
            <Descriptions.Item label="Email">{employee.emailId}</Descriptions.Item>
            <Descriptions.Item label="Phone">{employee.phoneNo}</Descriptions.Item>
            <Descriptions.Item label="Serial Number">{employee.serialNumberAssigned ?? '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Personal Details" style={{ marginBottom: 16 }} extra={sectionExtra('personal', handleSavePersonal)}>
        {editingSection === 'personal' ? (
          <Form form={personalForm} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Gender" name="gender" rules={[{ required: true, message: 'Gender is required' }]}>
                  <Select placeholder="Select gender" options={GENDER_OPTIONS.map((g) => ({ value: g, label: g }))} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Date of Birth" name="dateOfBirth" rules={[{ required: true, message: 'Date of birth is required' }]}>
                  <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" placeholder="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Marital Status" name="maritalStatus">
                  <Select allowClear placeholder="Select marital status" options={MARITAL_OPTIONS.map((m) => ({ value: m, label: m }))} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Blood Group" name="bloodGroup">
                  <Select allowClear placeholder="Select blood group" options={BLOOD_GROUP_OPTIONS.map((b) => ({ value: b, label: b }))} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Nationality" name="nationality">
                  <Input placeholder="Enter nationality" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions column={2}>
            <Descriptions.Item label="Gender">{employee.personalDetails?.gender ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Date of Birth">{employee.personalDetails?.dateOfBirth ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Marital Status">{employee.personalDetails?.maritalStatus ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Blood Group">{employee.personalDetails?.bloodGroup ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Nationality">{employee.personalDetails?.nationality ?? '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Work Details" style={{ marginBottom: 16 }} extra={sectionExtra('work', handleSaveWork)}>
        {editingSection === 'work' ? (
          <Form form={workForm} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Site" name="site">
                  <Input placeholder="Enter site" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Shift" name="shift">
                  <Select placeholder="Select shift" options={SHIFT_OPTIONS.map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Category" name="category">
                  <Select placeholder="Select category" options={OPTED_OPTIONS.map((o) => ({ value: o, label: o }))} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions column={2}>
            <Descriptions.Item label="Site">{employee.workDetails?.site ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Shift">{employee.workDetails?.shift ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Category">{employee.workDetails?.category ?? '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Addresses" extra={sectionExtra('addresses', handleSaveAddresses)}>
        {editingSection === 'addresses' ? (
          <Form form={addressesForm} layout="vertical">
            <Form.List name="addresses">
              {(fields) => (
                <>
                  {fields.map((field, idx) => (
                    <Row gutter={16} key={field.key} style={{ marginBottom: 8 }}>
                      <Col span={24}>
                        <strong>{idx === 0 ? 'Permanent' : 'Temporary'}</strong>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="Address Line 1" name={[field.name, 'line1']}>
                          <Input placeholder="Enter address line 1" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="District" name={[field.name, 'district']}>
                          <Input placeholder="Enter district" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="State" name={[field.name, 'state']}>
                          <Select placeholder="Select state" showSearch={{ optionFilterProp: 'label' }} options={STATE_OPTIONS.map((s) => ({ value: s, label: s }))} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="Pincode" name={[field.name, 'pincode']} rules={[{ pattern: /^[0-9]{5,6}$/, message: 'Invalid format' }]}>
                          <Input placeholder="Enter pincode" />
                        </Form.Item>
                      </Col>
                    </Row>
                  ))}
                </>
              )}
            </Form.List>
          </Form>
        ) : (
          (employee.addresses ?? []).map((a) => (
            <div key={a.addressType} style={{ marginBottom: 12 }}>
              <strong>{a.addressType}</strong>
              <div>{[a.line1, a.district, a.state, a.pincode].filter(Boolean).join(', ')}</div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
