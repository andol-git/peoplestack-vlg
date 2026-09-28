import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, Button, Card, Col, DatePicker, Descriptions, Form, Input, InputNumber, Row, Select, Skeleton, Switch, Tag, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useEmployeeQuery, useUpdateEmployee } from '../../hooks/useEmployees';
import { useCustomersQuery } from '../../hooks/useCustomers';
import { useDesignationsQuery } from '../../hooks/useDesignations';
import type { Employee } from '../../types/models';
import {
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  SHIFT_OPTIONS,
  OPTED_OPTIONS,
  UNIFORM_OPTIONS,
  STATE_OPTIONS,
  STATUS_OPTIONS,
  EXIT_STATUS_OPTIONS,
  AEP_TYPE_OPTIONS,
} from '../../constants/employeeOptions';
import {
  CAREER_DATE_FIELDS,
  COMPLIANCE_DATE_FIELDS,
  WORK_DATE_FIELDS,
  LEGAL_BACKGROUND_FIELDS,
  LEGAL_BACKGROUND_DEFAULTS,
  toDayjsFields,
  toStringFields,
  blockNonDigits,
} from '../../utils/employeeFormFields';

type Section = 'basic' | 'personal' | 'nominee' | 'career' | 'work' | 'addresses' | 'legal' | 'compliance' | 'bank';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const { data: employee, isLoading } = useEmployeeQuery(id ? +id : undefined);
  const { data: customers = [] } = useCustomersQuery();
  const { data: designations = [] } = useDesignationsQuery(employee?.customerId);
  const updateMutation = useUpdateEmployee();

  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [basicForm] = Form.useForm();
  const [personalForm] = Form.useForm();
  const [nomineeForm] = Form.useForm();
  const [careerForm] = Form.useForm();
  const [workForm] = Form.useForm();
  const [addressesForm] = Form.useForm();
  const [legalForm] = Form.useForm();
  const [complianceForm] = Form.useForm();
  const [bankForm] = Form.useForm();

  const uniformOpted = Form.useWatch('uniform', workForm) === 'Opted';
  const shoesOpted = Form.useWatch('shoes', workForm) === 'Opted';
  const hostelOpted = Form.useWatch('category', workForm) === 'Opted';

  function initials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }

  if (isLoading || !employee) {
    return <Skeleton active />;
  }

  function startEdit(section: Section) {
    const e = employee!;
    if (section === 'basic') {
      basicForm.setFieldsValue({
        customerId: e.customerId,
        emailId: e.emailId,
        phoneNo: e.phoneNo,
        serialNumberAssigned: e.serialNumberAssigned,
      });
    }
    if (section === 'personal') {
      personalForm.setFieldsValue(toDayjsFields(e.personalDetails, ['dateOfBirth']));
    }
    if (section === 'nominee') {
      nomineeForm.setFieldsValue({ ...e.familyDetails });
    }
    if (section === 'career') {
      careerForm.setFieldsValue(toDayjsFields(e.careerDetails, CAREER_DATE_FIELDS));
    }
    if (section === 'work') {
      workForm.setFieldsValue(toDayjsFields(e.workDetails, WORK_DATE_FIELDS));
    }
    if (section === 'addresses') {
      addressesForm.setFieldsValue({
        addresses: e.addresses?.length ? e.addresses : [{ addressType: 'PERMANENT' }, { addressType: 'TEMPORARY' }],
      });
    }
    if (section === 'legal') {
      legalForm.setFieldsValue({ ...LEGAL_BACKGROUND_DEFAULTS, ...e.legalBackground });
    }
    if (section === 'compliance') {
      complianceForm.setFieldsValue(toDayjsFields(e.complianceDetails, COMPLIANCE_DATE_FIELDS));
    }
    if (section === 'bank') {
      bankForm.setFieldsValue({ ...e.complianceDetails });
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
      personalDetails: { ...employee!.personalDetails, ...toStringFields(values, ['dateOfBirth']) },
    });
  }

  async function handleSaveNominee() {
    const values = await nomineeForm.validateFields().catch(() => null);
    if (!values) return;
    await saveSection({ ...employee!, familyDetails: { ...employee!.familyDetails, ...values } });
  }

  async function handleSaveCareer() {
    const values = await careerForm.validateFields().catch(() => null);
    if (!values) return;
    await saveSection({
      ...employee!,
      careerDetails: { ...employee!.careerDetails, ...toStringFields(values, CAREER_DATE_FIELDS) },
    });
  }

  async function handleSaveWork() {
    const values = await workForm.validateFields().catch(() => null);
    if (!values) return;
    await saveSection({
      ...employee!,
      workDetails: { ...employee!.workDetails, ...toStringFields(values, WORK_DATE_FIELDS) },
    });
  }

  async function handleSaveAddresses() {
    const values = await addressesForm.validateFields().catch(() => null);
    if (!values) return;
    await saveSection({ ...employee!, addresses: values.addresses });
  }

  async function handleSaveLegal() {
    const values = await legalForm.validateFields().catch(() => null);
    if (!values) return;
    await saveSection({ ...employee!, legalBackground: { ...employee!.legalBackground, ...values } });
  }

  async function handleSaveCompliance() {
    const values = await complianceForm.validateFields().catch(() => null);
    if (!values) return;
    await saveSection({
      ...employee!,
      complianceDetails: { ...employee!.complianceDetails, ...toStringFields(values, COMPLIANCE_DATE_FIELDS) },
    });
  }

  async function handleSaveBank() {
    const values = await bankForm.validateFields().catch(() => null);
    if (!values) return;
    await saveSection({ ...employee!, complianceDetails: { ...employee!.complianceDetails, ...values } });
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
              <Col span={6}>
                <Form.Item label="Customer" name="customerId">
                  <Select
                    allowClear
                    placeholder="Select customer"
                    showSearch={{ optionFilterProp: 'label' }}
                    options={customers.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="ID" name="serialNumberAssigned" rules={[{ pattern: /^[0-9]*$/, message: 'ID must contain numbers only' }]}>
                  <Input placeholder="Enter ID" onKeyDown={blockNonDigits} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Email" name="emailId" rules={[{ type: 'email', message: 'Invalid email' }]}>
                  <Input placeholder="Enter email" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Phone" name="phoneNo" rules={[{ required: true, pattern: /^[0-9]{10}$/, message: 'Phone number must be exactly 10 digits' }]}>
                  <Input placeholder="Enter 10-digit phone number" maxLength={10} onKeyDown={blockNonDigits} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions column={2}>
            <Descriptions.Item label="Customer">{customers.find((c) => c.id === employee.customerId)?.name ?? '—'}</Descriptions.Item>
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
                <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
                  <Input placeholder="Enter full name" />
                </Form.Item>
              </Col>
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
              <Col span={8}>
                <Form.Item label="Height (ft)" name="height">
                  <InputNumber style={{ width: '100%' }} step={0.1} placeholder="Enter height" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Weight (kg)" name="weight">
                  <InputNumber style={{ width: '100%' }} placeholder="Enter weight" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Chest" name="chest">
                  <InputNumber style={{ width: '100%' }} placeholder="Enter chest measurement" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Identification Marks" name="identificationMarks">
                  <Input placeholder="Enter identification marks" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions column={2}>
            <Descriptions.Item label="Name">{employee.personalDetails?.name ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Gender">{employee.personalDetails?.gender ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Date of Birth">{employee.personalDetails?.dateOfBirth ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Marital Status">{employee.personalDetails?.maritalStatus ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Blood Group">{employee.personalDetails?.bloodGroup ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Nationality">{employee.personalDetails?.nationality ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Height (ft)">{employee.personalDetails?.height ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Weight (kg)">{employee.personalDetails?.weight ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Chest">{employee.personalDetails?.chest ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Identification Marks">{employee.personalDetails?.identificationMarks ?? '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Nominee Details" style={{ marginBottom: 16 }} extra={sectionExtra('nominee', handleSaveNominee)}>
        {editingSection === 'nominee' ? (
          <Form form={nomineeForm} layout="vertical">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Father's Name" name="fathersName">
                  <Input placeholder="Enter father's name" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Spouse Name" name="spouseName">
                  <Input placeholder="Enter spouse's name" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Alternate Mobile" name="alternativeMobileNumber" rules={[{ pattern: /^[0-9]{10}$/, message: 'Phone number must be exactly 10 digits' }]}>
                  <Input placeholder="Enter 10-digit mobile number" maxLength={10} onKeyDown={blockNonDigits} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Relation" name="relation">
                  <Input placeholder="Enter relation" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions column={2}>
            <Descriptions.Item label="Father's Name">{employee.familyDetails?.fathersName ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Spouse Name">{employee.familyDetails?.spouseName ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Alternate Mobile">{employee.familyDetails?.alternativeMobileNumber ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Relation">{employee.familyDetails?.relation ?? '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Career Details" style={{ marginBottom: 16 }} extra={sectionExtra('career', handleSaveCareer)}>
        {editingSection === 'career' ? (
          <Form form={careerForm} layout="vertical">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Date of Interview" name="dateOfInterview">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Joining Date" name="joiningDate" rules={[{ required: true, message: 'Joining date is required' }]}>
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Re-Joining Date" name="reJoiningDate">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Designation" name="designationId">
                  <Select
                    allowClear
                    placeholder={employee.customerId ? 'Select designation' : 'Select a customer first'}
                    showSearch={{ optionFilterProp: 'label' }}
                    disabled={!employee.customerId}
                    options={designations.map((d) => ({ value: d.id, label: d.name }))}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Organisation" name="organisation">
                  <Input placeholder="Enter organisation" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Nature of Employment" name="natureOfEmployment">
                  <Input placeholder="Enter nature of employment" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Reason for Leaving" name="reasonForLeaving">
                  <Input placeholder="Enter reason for leaving" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="From Date" name="fromDate">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Till Date" name="tillDate">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Age at Matriculation" name="ageAtMatriculation">
                  <Input placeholder="Enter age at matriculation" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Examination Passed" name="examinationPassed">
                  <Input placeholder="Enter examination passed" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Educational Qualifications" name="educationalQualifications">
                  <Input placeholder="Enter educational qualifications" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Staying From" name="stayingFrom">
                  <Input placeholder="Enter staying from" />
                </Form.Item>
              </Col>
              <Col span={18}>
                <Form.Item label="Name of School/College with Full Address" name="schoolCollegeName">
                  <Input placeholder="Enter school/college name & address" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Present Address" name="presentAddress">
                  <Input placeholder="Enter present address" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Present Address 2" name="presentAddress2">
                  <Input placeholder="Enter present address (line 2)" />
                </Form.Item>
              </Col>
              <Col span={18}>
                <Form.Item label="Reference with Full Address" name="referenceWithFullAddress">
                  <Input placeholder="Enter reference name & full address" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions column={2}>
            <Descriptions.Item label="Date of Interview">{employee.careerDetails?.dateOfInterview ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Joining Date">{employee.careerDetails?.joiningDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Re-Joining Date">{employee.careerDetails?.reJoiningDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Designation">{employee.careerDetails?.designation?.name ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Organisation">{employee.careerDetails?.organisation ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Nature of Employment">{employee.careerDetails?.natureOfEmployment ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Reason for Leaving">{employee.careerDetails?.reasonForLeaving ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="From Date">{employee.careerDetails?.fromDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Till Date">{employee.careerDetails?.tillDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Age at Matriculation">{employee.careerDetails?.ageAtMatriculation ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Examination Passed">{employee.careerDetails?.examinationPassed ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Educational Qualifications">{employee.careerDetails?.educationalQualifications ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Staying From">{employee.careerDetails?.stayingFrom ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="School/College Name" span={2}>{employee.careerDetails?.schoolCollegeName ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Present Address">{employee.careerDetails?.presentAddress ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Present Address 2">{employee.careerDetails?.presentAddress2 ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Reference with Full Address" span={2}>{employee.careerDetails?.referenceWithFullAddress ?? '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Addresses" style={{ marginBottom: 16 }} extra={sectionExtra('addresses', handleSaveAddresses)}>
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

      <Card title="Legal Background" style={{ marginBottom: 16 }} extra={sectionExtra('legal', handleSaveLegal)}>
        {editingSection === 'legal' ? (
          <Form form={legalForm} layout="vertical">
            <Row gutter={16}>
              {LEGAL_BACKGROUND_FIELDS.map(([field, label]) => (
                <Col span={6} key={field}>
                  <Form.Item label={label} name={field} valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              ))}
              <Col span={24}>
                <Form.Item label="Names & Address of Two Responsible Persons (other than relatives)" name="responsiblePersonsInfo">
                  <Input.TextArea rows={2} placeholder="Enter names & addresses" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions column={2}>
            {LEGAL_BACKGROUND_FIELDS.map(([field, label]) => (
              <Descriptions.Item label={label} key={field}>
                {employee.legalBackground?.[field] ? 'Yes' : 'No'}
              </Descriptions.Item>
            ))}
            <Descriptions.Item label="Names & Address of Two Responsible Persons" span={2}>
              {employee.legalBackground?.responsiblePersonsInfo ?? '—'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Compliance Details" style={{ marginBottom: 16 }} extra={sectionExtra('compliance', handleSaveCompliance)}>
        {editingSection === 'compliance' ? (
          <Form form={complianceForm} layout="vertical">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="PF No" name="pfNo">
                  <Input placeholder="Enter PF number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="ESIC No" name="esicNo">
                  <Input placeholder="Enter ESIC number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="PAN" name="pan">
                  <Input placeholder="Enter PAN" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Aadhar" name="aadhar" rules={[{ required: true, message: 'Aadhar is required' }]}>
                  <Input placeholder="Enter Aadhar number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Passport Number" name="passportNumber">
                  <Input placeholder="Enter passport number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Passport Submitted" name="passportSubmitted">
                  <Input placeholder="Enter passport submitted status" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Passport Valid From" name="passportValidFrom">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Passport Valid To" name="passportValidTo">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AEP Application Status" name="aepApplicationStatus">
                  <Select placeholder="Select status" options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AEP Type" name="aepType">
                  <Select placeholder="Select AEP type" options={AEP_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AEP Number" name="aepNumber">
                  <Input placeholder="Enter AEP number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AEP Validity" name="aepValidity">
                  <Input placeholder="Enter AEP validity" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AEP Date" name="aepDate">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AVSEC Status" name="avsecStatus">
                  <Select placeholder="Select status" options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AVSEC Valid From" name="avsecValidFrom">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AVSEC Valid To" name="avsecValidTo">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions column={2}>
            <Descriptions.Item label="PF No">{employee.complianceDetails?.pfNo ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="ESIC No">{employee.complianceDetails?.esicNo ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="PAN">{employee.complianceDetails?.pan ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Aadhar">{employee.complianceDetails?.aadhar ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Passport Number">{employee.complianceDetails?.passportNumber ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Passport Submitted">{employee.complianceDetails?.passportSubmitted ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Passport Valid From">{employee.complianceDetails?.passportValidFrom ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Passport Valid To">{employee.complianceDetails?.passportValidTo ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="AEP Application Status">{employee.complianceDetails?.aepApplicationStatus ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="AEP Type">{employee.complianceDetails?.aepType ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="AEP Number">{employee.complianceDetails?.aepNumber ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="AEP Validity">{employee.complianceDetails?.aepValidity ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="AEP Date">{employee.complianceDetails?.aepDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="AVSEC Status">{employee.complianceDetails?.avsecStatus ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="AVSEC Valid From">{employee.complianceDetails?.avsecValidFrom ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="AVSEC Valid To">{employee.complianceDetails?.avsecValidTo ?? '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Bank Details" style={{ marginBottom: 16 }} extra={sectionExtra('bank', handleSaveBank)}>
        {editingSection === 'bank' ? (
          <Form form={bankForm} layout="vertical">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Bank Account Number" name="bankAccountNumber">
                  <Input placeholder="Enter bank account number" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="IFSC Code" name="ifscCode">
                  <Input placeholder="Enter IFSC code" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions column={2}>
            <Descriptions.Item label="Bank Account Number">{employee.complianceDetails?.bankAccountNumber ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="IFSC Code">{employee.complianceDetails?.ifscCode ?? '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Work Details" extra={sectionExtra('work', handleSaveWork)}>
        {editingSection === 'work' ? (
          <Form form={workForm} layout="vertical">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Site" name="site">
                  <Input placeholder="Enter site" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Shift" name="shift">
                  <Select placeholder="Select shift" options={SHIFT_OPTIONS.map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Hostel" name="category">
                  <Select placeholder="Select hostel" options={OPTED_OPTIONS.map((o) => ({ value: o, label: o }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Uniform" name="uniform">
                  <Select placeholder="Select uniform" options={UNIFORM_OPTIONS.map((o) => ({ value: o, label: o }))} />
                </Form.Item>
              </Col>
              {uniformOpted && (
                <Col span={6}>
                  <Form.Item label="Uniform Size" name="uniformSize">
                    <Input placeholder="Enter uniform size" />
                  </Form.Item>
                </Col>
              )}
              <Col span={6}>
                <Form.Item label="Shoes" name="shoes">
                  <Select placeholder="Select shoes" options={OPTED_OPTIONS.map((o) => ({ value: o, label: o }))} />
                </Form.Item>
              </Col>
              {shoesOpted && (
                <Col span={6}>
                  <Form.Item label="Shoes Size" name="shoesSize">
                    <Input placeholder="Enter shoes size" />
                  </Form.Item>
                </Col>
              )}
              <Col span={6}>
                <Form.Item label="Transport" name="transport">
                  <Select placeholder="Select transport" options={OPTED_OPTIONS.map((o) => ({ value: o, label: o }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Previous Experience" name="previousExperience">
                  <Input placeholder="Enter previous experience" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Certificates" name="certificates">
                  <Input placeholder="Enter certificates" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Document Given" name="documentGiven">
                  <Input placeholder="Enter document given" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Broker Name" name="brokerName">
                  <Input placeholder="Enter broker name" />
                </Form.Item>
              </Col>
              {hostelOpted && (
                <Col span={6}>
                  <Form.Item label="Hostel Joining Date" name="hostelJoiningDate">
                    <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                  </Form.Item>
                </Col>
              )}
              <Col span={6}>
                <Form.Item label="PVC Status" name="pvcStatus">
                  <Select placeholder="Select status" options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Leave From Date" name="leaveFromDate">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Leave To Date" name="leaveToDate">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Notice Date" name="noticeDate">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Notice Reason" name="noticeReason">
                  <Input placeholder="Enter notice reason" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Exit Date" name="exitDate">
                  <DatePicker style={{ width: '100%' }} placeholder="DD-MM-YYYY" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Exit Status" name="exitStatus">
                  <Select placeholder="Select exit status" options={EXIT_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Full & Final Settlement" name="fullFinalSettlement">
                  <Input placeholder="Enter full & final settlement" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Remarks" name="remarks">
                  <Input placeholder="Enter remarks" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Descriptions column={2}>
            <Descriptions.Item label="Site">{employee.workDetails?.site ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Shift">{employee.workDetails?.shift ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Hostel">{employee.workDetails?.category ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Uniform">{employee.workDetails?.uniform ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Uniform Size">{employee.workDetails?.uniformSize ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Shoes">{employee.workDetails?.shoes ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Shoes Size">{employee.workDetails?.shoesSize ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Transport">{employee.workDetails?.transport ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Previous Experience">{employee.workDetails?.previousExperience ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Certificates">{employee.workDetails?.certificates ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Document Given">{employee.workDetails?.documentGiven ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Broker Name">{employee.workDetails?.brokerName ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Hostel Joining Date">{employee.workDetails?.hostelJoiningDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="PVC Status">{employee.workDetails?.pvcStatus ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Leave From Date">{employee.workDetails?.leaveFromDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Leave To Date">{employee.workDetails?.leaveToDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Notice Date">{employee.workDetails?.noticeDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Notice Reason">{employee.workDetails?.noticeReason ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Exit Date">{employee.workDetails?.exitDate ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Exit Status">{employee.workDetails?.exitStatus ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Full & Final Settlement">{employee.workDetails?.fullFinalSettlement ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Remarks" span={2}>{employee.workDetails?.remarks ?? '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );
}
