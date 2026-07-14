import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Col, DatePicker, Divider, Form, Input, Row, Select, Steps, Switch, message } from 'antd';
import dayjs from 'dayjs';
import { useCreateEmployee, useEmployeeQuery, useUpdateEmployee } from '../../hooks/useEmployees';
import type { Employee } from '../../types/models';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const MARITAL_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed'];
const STATUS_OPTIONS = ['Not Applied', 'Applied', 'Completed'];

export function EmployeeFormPage() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);

  const { data: employee } = useEmployeeQuery(isEditMode ? +id! : undefined);
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (employee) {
      form.setFieldsValue({
        ...employee,
        personalDetails: {
          ...employee.personalDetails,
          dateOfBirth: employee.personalDetails?.dateOfBirth ? dayjs(employee.personalDetails.dateOfBirth) : undefined,
        },
        careerDetails: {
          ...employee.careerDetails,
          joiningDate: employee.careerDetails?.joiningDate ? dayjs(employee.careerDetails.joiningDate) : undefined,
        },
        addresses: employee.addresses?.length
          ? employee.addresses
          : [{ addressType: 'PERMANENT' }, { addressType: 'TEMPORARY' }],
      });
    } else {
      form.setFieldsValue({ addresses: [{ addressType: 'PERMANENT' }, { addressType: 'TEMPORARY' }], isActive: true });
    }
  }, [employee, form]);

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      const payload: Employee = {
        ...values,
        personalDetails: {
          ...values.personalDetails,
          dateOfBirth: values.personalDetails?.dateOfBirth?.format('YYYY-MM-DD'),
        },
        careerDetails: {
          ...values.careerDetails,
          joiningDate: values.careerDetails?.joiningDate?.format('YYYY-MM-DD'),
        },
      };

      if (isEditMode) {
        await updateMutation.mutateAsync({ id: +id!, employee: payload });
        message.success(`Employee ${payload.idNo} updated successfully.`);
      } else {
        await createMutation.mutateAsync(payload);
        message.success(`Employee ${payload.idNo} created successfully.`);
      }
      navigate('/employees');
    } catch (err: any) {
      if (err?.errorFields) return; // antd validation error, already shown inline
      message.error(err?.response?.status === 409 ? 'Duplicate entry.' : 'Save failed.');
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          {isEditMode ? 'Edit Employee' : 'New Employee'}
        </h1>
      </div>

      <Steps
        current={step}
        onChange={setStep}
        items={[
          { title: 'Employee Info', description: 'Personal, family, career & legal details' },
          { title: 'Compliance & Work', description: 'Compliance, documents & work details' },
        ]}
        style={{ marginBottom: 24, maxWidth: 600 }}
      />

      <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
        <div style={{ display: step === 0 ? 'block' : 'none' }}>
          <Card>
            <Divider titlePlacement="left" style={{ marginTop: 0 }}>Basic Info</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="ID No" name="idNo" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Serial Number" name="serialNumberAssigned">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Email" name="emailId" rules={[{ required: true, type: 'email' }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="Phone"
                  name="phoneNo"
                  rules={[{ required: true, pattern: /^[0-9]{10}$/, message: 'Phone number must be exactly 10 digits' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Active" name="isActive" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          <Divider titlePlacement="left">Personal Details</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Name" name={['personalDetails', 'name']} rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Gender" name={['personalDetails', 'gender']} rules={[{ required: true }]}>
                  <Select options={GENDER_OPTIONS.map((g) => ({ value: g, label: g }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Date of Birth" name={['personalDetails', 'dateOfBirth']} rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Marital Status" name={['personalDetails', 'maritalStatus']}>
                  <Select options={MARITAL_OPTIONS.map((m) => ({ value: m, label: m }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Blood Group" name={['personalDetails', 'bloodGroup']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Nationality" name={['personalDetails', 'nationality']} rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Identification Marks" name={['personalDetails', 'identificationMarks']}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          <Divider titlePlacement="left">Family Details</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Father's Name" name={['familyDetails', 'fathersName']} rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Mother's Name" name={['familyDetails', 'motherName']} rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Alternate Mobile" name={['familyDetails', 'alternativeMobileNumber']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Relation" name={['familyDetails', 'relation']}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          <Divider titlePlacement="left">Career Details</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Joining Date" name={['careerDetails', 'joiningDate']} rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Designation" name={['careerDetails', 'designation']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Organisation" name={['careerDetails', 'organisation']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Nature of Employment" name={['careerDetails', 'natureOfEmployment']}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          <Divider titlePlacement="left">Addresses</Divider>
            <Form.List name="addresses">
              {(fields) => (
                <>
                  {fields.map((field, idx) => (
                    <Row gutter={16} key={field.key} style={{ marginBottom: 8 }}>
                      <Col span={24}>
                        <strong>{idx === 0 ? 'Permanent' : 'Temporary'}</strong>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          label="Address Line 1"
                          name={[field.name, 'line1']}
                          rules={[{ required: true }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="District" name={[field.name, 'district']}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="State" name={[field.name, 'state']} rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          label="Pincode"
                          name={[field.name, 'pincode']}
                          rules={[{ required: true, pattern: /^[0-9]{5,6}$/, message: 'Invalid format' }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                  ))}
                </>
              )}
            </Form.List>
          <Divider titlePlacement="left">Legal Background</Divider>
            <Row gutter={16}>
              {(
                [
                  ['everDetained', 'Ever Detained'],
                  ['everBoundDown', 'Ever Bound Down'],
                  ['everFined', 'Ever Fined'],
                  ['everConvicted', 'Ever Convicted'],
                  ['anyCasePending', 'Any Case Pending'],
                  ['everArrested', 'Ever Arrested'],
                  ['everProsecuted', 'Ever Prosecuted'],
                  ['dismissedOrRemoved', 'Dismissed or Removed'],
                ] as const
              ).map(([field, label]) => (
                <Col span={6} key={field}>
                  <Form.Item label={label} name={['legalBackground', field]} valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              ))}
            </Row>
          </Card>
        </div>

        <div style={{ display: step === 1 ? 'block' : 'none' }}>
          <Card>
            <Divider titlePlacement="left" style={{ marginTop: 0 }}>Compliance Details</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="PF No" name={['complianceDetails', 'pfNo']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="PF Status" name={['complianceDetails', 'pfStatus']}>
                  <Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="ESIC No" name={['complianceDetails', 'esicNo']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="PAN" name={['complianceDetails', 'pan']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Bank Account Number" name={['complianceDetails', 'bankAccountNumber']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="IFSC Code" name={['complianceDetails', 'ifscCode']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Aadhar" name={['complianceDetails', 'aadhar']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Passport Number" name={['complianceDetails', 'passportNumber']}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          <Divider titlePlacement="left">Work Details</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Site" name={['workDetails', 'site']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Shift" name={['workDetails', 'shift']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Category" name={['workDetails', 'category']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Uniform" name={['workDetails', 'uniform']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Shoes" name={['workDetails', 'shoes']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Transport" name={['workDetails', 'transport']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Previous Experience" name={['workDetails', 'previousExperience']}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Remarks" name={['workDetails', 'remarks']}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          {step > 0 && <Button onClick={() => setStep(0)}>Back</Button>}
          {step === 0 && (
            <Button type="primary" onClick={() => setStep(1)}>
              Next
            </Button>
          )}
          {step === 1 && (
            <Button type="primary" loading={saving} onClick={handleSubmit}>
              {isEditMode ? 'Update Employee' : 'Create Employee'}
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
