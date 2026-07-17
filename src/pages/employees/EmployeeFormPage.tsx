import { useEffect, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Col, DatePicker, Divider, Form, Input, InputNumber, Row, Select, Steps, Switch, message } from 'antd';
import dayjs from 'dayjs';
import { useCreateEmployee, useEmployeeQuery, useUpdateEmployee } from '../../hooks/useEmployees';
import { useCustomersQuery } from '../../hooks/useCustomers';
import type { Employee } from '../../types/models';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const MARITAL_OPTIONS = ['Married', 'Single'];
const STATUS_OPTIONS = ['Not Applied', 'Applied', 'Completed'];
const EXIT_STATUS_OPTIONS = ['Resigned', 'On Leave', 'Left', 'Not Joined'];
const STATE_OPTIONS = [
  'Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Delhi',
  'Uttar Pradesh', 'West Bengal', 'Bihar', 'Rajasthan', 'Gujarat', 'Odisha',
  'Madhya Pradesh', 'Assam', 'Kerala', 'Jharkhand', 'Other',
];
const DESIGNATION_OPTIONS = ['LOADER', 'SECURITY GUARD', 'UTILITY STAFF', 'SUPERVISOR', 'MANAGER', 'HOUSE KEEPING'];
const SITE_OPTIONS = ['GMR', 'BIAL', 'IGI', 'CSIA', 'MAA', 'TSGIRD', 'NOVOTEL', 'CBIT', 'MGIT'];
const AIRPORT_SITES = ['GMR', 'BIAL', 'IGI', 'CSIA', 'MAA'];
const OPTED_OPTIONS = ['Opted', 'Not Opted'];
const UNIFORM_OPTIONS = ['Shirt, Socks, ID Card', 'Not Opted'];
const AEP_TYPE_OPTIONS = ['TAEP', 'BAEP', 'NA'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// The backend requires every Legal Background flag on every submission, even for non-airport
// sites where the section is hidden — default them so a hidden section still submits valid data.
const LEGAL_BACKGROUND_DEFAULTS = {
  everDetained: false,
  everBoundDown: false,
  everFined: false,
  everConvicted: false,
  anyCasePending: false,
  everArrested: false,
  everProsecuted: false,
  dismissedOrRemoved: false,
  dischargedFromTraining: false,
  previousEmploymentUnderGovt: false,
  undertakingOwnedByGovt: false,
};

// Blocks any non-digit keystroke so phone-style fields can only ever contain digits.
function blockNonDigits(e: KeyboardEvent<HTMLInputElement>) {
  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
    e.preventDefault();
  }
}

// Nested date fields that need dayjs <-> 'YYYY-MM-DD' string conversion around the antd Form.
const CAREER_DATE_FIELDS = ['dateOfInterview', 'joiningDate', 'reJoiningDate', 'fromDate', 'tillDate'] as const;
const COMPLIANCE_DATE_FIELDS = ['passportValidFrom', 'passportValidTo', 'aepDate', 'avsecValidFrom', 'avsecValidTo'] as const;
const WORK_DATE_FIELDS = ['hostelJoiningDate', 'leaveFromDate', 'leaveToDate', 'noticeDate', 'exitDate'] as const;

function toDayjsFields(obj: Record<string, any> | undefined, fields: readonly string[]) {
  const result: Record<string, any> = { ...obj };
  for (const f of fields) {
    if (result[f]) result[f] = dayjs(result[f]);
  }
  return result;
}

function toStringFields(obj: Record<string, any> | undefined, fields: readonly string[]) {
  const result: Record<string, any> = { ...obj };
  for (const f of fields) {
    if (result[f] && typeof result[f].format === 'function') result[f] = result[f].format('YYYY-MM-DD');
  }
  return result;
}

export function EmployeeFormPage() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const site = Form.useWatch(['workDetails', 'site'], form);
  const isGmr = site === 'GMR';
  const isAirportSite = !!site && AIRPORT_SITES.includes(site);
  const hostelOpted = Form.useWatch(['workDetails', 'category'], form) === 'Opted';
  const uniformOpted = Form.useWatch(['workDetails', 'uniform'], form) === 'Opted';
  const shoesOpted = Form.useWatch(['workDetails', 'shoes'], form) === 'Opted';

  const { data: employee } = useEmployeeQuery(isEditMode ? +id! : undefined);
  const { data: customers = [] } = useCustomersQuery();
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
        careerDetails: toDayjsFields(employee.careerDetails, CAREER_DATE_FIELDS),
        complianceDetails: toDayjsFields(employee.complianceDetails, COMPLIANCE_DATE_FIELDS),
        workDetails: toDayjsFields(employee.workDetails, WORK_DATE_FIELDS),
        legalBackground: { ...LEGAL_BACKGROUND_DEFAULTS, ...employee.legalBackground },
        addresses: employee.addresses?.length
          ? employee.addresses
          : [{ addressType: 'PERMANENT' }, { addressType: 'TEMPORARY' }],
      });
    } else {
      form.setFieldsValue({
        addresses: [{ addressType: 'PERMANENT' }, { addressType: 'TEMPORARY' }],
        isActive: true,
        legalBackground: LEGAL_BACKGROUND_DEFAULTS,
      });
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
        careerDetails: toStringFields(values.careerDetails, CAREER_DATE_FIELDS),
        complianceDetails: toStringFields(values.complianceDetails, COMPLIANCE_DATE_FIELDS),
        workDetails: toStringFields(values.workDetails, WORK_DATE_FIELDS),
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

      <Form form={form} layout="vertical" initialValues={{ isActive: true, legalBackground: LEGAL_BACKGROUND_DEFAULTS }}>
        <div style={{ display: step === 0 ? 'block' : 'none' }}>
          <Card>
            <Divider titlePlacement="left" style={{ marginTop: 0 }}>Basic Info</Divider>
            <Row gutter={16}>
             
              <Col span={6}>
                <Form.Item label="Company" name="customerId">
                  <Select
                    allowClear
                    showSearch={{ optionFilterProp: 'label' }}
                    placeholder="Optional"
                    options={customers.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="ID No" name="idNo" rules={[{ required: true }]}>
                  <Input placeholder="Enter ID number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Serial Number Assigned" name="serialNumberAssigned">
                  <Input placeholder="Enter serial number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Email" name="emailId" rules={[{ type: 'email' }]}>
                  <Input placeholder="Enter email address" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="Phone"
                  name="phoneNo"
                  rules={[{ required: true, pattern: /^[0-9]{10}$/, message: 'Phone number must be exactly 10 digits' }]}
                >
                  <Input placeholder="Enter 10-digit phone number" maxLength={10} onKeyDown={blockNonDigits} />
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
                  <Input placeholder="Enter full name" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Gender" name={['personalDetails', 'gender']} rules={[{ required: true }]}>
                  <Select placeholder="Select gender" showSearch={{ optionFilterProp: 'label' }} options={GENDER_OPTIONS.map((g) => ({ value: g, label: g }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Date of Birth" name={['personalDetails', 'dateOfBirth']} rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Marital Status" name={['personalDetails', 'maritalStatus']}>
                  <Select placeholder="Select marital status" showSearch={{ optionFilterProp: 'label' }} options={MARITAL_OPTIONS.map((m) => ({ value: m, label: m }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Blood Group" name={['personalDetails', 'bloodGroup']}>
                  <Select placeholder="Select blood group" showSearch={{ optionFilterProp: 'label' }} options={BLOOD_GROUP_OPTIONS.map((b) => ({ value: b, label: b }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Nationality" name={['personalDetails', 'nationality']} rules={[{ required: true }]}>
                  <Input placeholder="Enter nationality" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Height (ft)" name={['personalDetails', 'height']}>
                  <InputNumber style={{ width: '100%' }} step={0.1} placeholder="Enter height" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Weight (kg)" name={['personalDetails', 'weight']}>
                  <InputNumber style={{ width: '100%' }} placeholder="Enter weight" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Chest" name={['personalDetails', 'chest']}>
                  <InputNumber style={{ width: '100%' }} placeholder="Enter chest measurement" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Identification Marks" name={['personalDetails', 'identificationMarks']}>
                  <Input placeholder="Enter identification marks" />
                </Form.Item>
              </Col>
            </Row>

            <Divider titlePlacement="left">Nominee Details</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Father's Name" name={['familyDetails', 'fathersName']} rules={[{ required: true }]}>
                  <Input placeholder="Enter father's name" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Mother's Name" name={['familyDetails', 'motherName']} rules={[{ required: true }]}>
                  <Input placeholder="Enter mother's name" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Wife Name" name={['familyDetails', 'wifeName']}>
                  <Input placeholder="Enter wife's name" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="Alternate Mobile"
                  name={['familyDetails', 'alternativeMobileNumber']}
                  rules={[{ pattern: /^[0-9]{10}$/, message: 'Phone number must be exactly 10 digits' }]}
                >
                  <Input placeholder="Enter 10-digit mobile number" maxLength={10} onKeyDown={blockNonDigits} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Relation" name={['familyDetails', 'relation']}>
                  <Input placeholder="Enter relation" />
                </Form.Item>
              </Col>
            </Row>

            <Divider titlePlacement="left">Career Details</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Date of Interview" name={['careerDetails', 'dateOfInterview']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Joining Date" name={['careerDetails', 'joiningDate']} rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Re-Joining Date" name={['careerDetails', 'reJoiningDate']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Designation" name={['careerDetails', 'designation']}>
                  <Select
                    mode="tags"
                    maxCount={1}
                    placeholder="Select or type a designation"
                    options={DESIGNATION_OPTIONS.map((d) => ({ value: d, label: d }))}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Organisation" name={['careerDetails', 'organisation']}>
                  <Input placeholder="Enter organisation" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Nature of Employment" name={['careerDetails', 'natureOfEmployment']}>
                  <Input placeholder="Enter nature of employment" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Reason for Leaving" name={['careerDetails', 'reasonForLeaving']}>
                  <Input placeholder="Enter reason for leaving" />
                </Form.Item>
              </Col>
             
              <Col span={6}>
                <Form.Item label="From Date" name={['careerDetails', 'fromDate']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Till Date" name={['careerDetails', 'tillDate']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Age at Matriculation" name={['careerDetails', 'ageAtMatriculation']}>
                  <Input placeholder="Enter age at matriculation" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Examination Passed" name={['careerDetails', 'examinationPassed']}>
                  <Input placeholder="Enter examination passed" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Educational Qualifications" name={['careerDetails', 'educationalQualifications']}>
                  <Input placeholder="Enter educational qualifications" />
                </Form.Item>
              </Col>
              <Col span={18}>
                <Form.Item label="Name of School/College with Full Address" name={['careerDetails', 'schoolCollegeName']}>
                  <Input placeholder="Enter school/college name & address" />
                </Form.Item>
              </Col>
             
              <Col span={18}>
                <Form.Item label="Reference with Full Address" name={['careerDetails', 'referenceWithFullAddress']}>
                  <Input placeholder="Enter reference name & full address" />
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
                          <Input placeholder="Enter address line 1" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="District" name={[field.name, 'district']}  rules={[{ required: true }]}>
                          <Input placeholder="Enter district" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="State" name={[field.name, 'state']} rules={[{ required: true }]}>
                          <Select
                            placeholder="Select state"
                            showSearch={{ optionFilterProp: 'label' }}
                            options={STATE_OPTIONS.map((s) => ({ value: s, label: s }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          label="Pincode"
                          name={[field.name, 'pincode']}
                          rules={[{ required: true, pattern: /^[0-9]{5,6}$/, message: 'Invalid format' }]}
                        >
                          <Input placeholder="Enter pincode" />
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
                  ['dischargedFromTraining', 'Discharged from Training'],
                  ['previousEmploymentUnderGovt', 'Previous Employment under Govt.'],
                  ['undertakingOwnedByGovt', 'Undertaking Owned/Controlled by Govt.'],
                ] as const
              ).map(([field, label]) => (
                <Col span={6} key={field}>
                  <Form.Item label={label} name={['legalBackground', field]} valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              ))}
              <Col span={24}>
                <Form.Item
                  label="Names & Address of Two Responsible Persons (other than relatives)"
                  name={['legalBackground', 'responsiblePersonsInfo']}
                >
                  <Input.TextArea rows={2} placeholder="Enter names & addresses" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </div>

        <div style={{ display: step === 1 ? 'block' : 'none' }}>
          <Card>
            <Divider titlePlacement="left" style={{ marginTop: 0 }}>Compliance Details</Divider>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="PF No" name={['complianceDetails', 'pfNo']}>
                  <Input placeholder="Enter PF number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="ESIC No" name={['complianceDetails', 'esicNo']}>
                  <Input placeholder="Enter ESIC number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="PAN" name={['complianceDetails', 'pan']}>
                  <Input placeholder="Enter PAN" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Bank Account Number" name={['complianceDetails', 'bankAccountNumber']}>
                  <Input placeholder="Enter bank account number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="IFSC Code" name={['complianceDetails', 'ifscCode']}>
                  <Input placeholder="Enter IFSC code" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Aadhar" name={['complianceDetails', 'aadhar']}>
                  <Input placeholder="Enter Aadhar number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Passport Number" name={['complianceDetails', 'passportNumber']}>
                  <Input placeholder="Enter passport number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Passport Submitted" name={['complianceDetails', 'passportSubmitted']}>
                  <Input placeholder="Enter passport submitted status" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Passport Valid From" name={['complianceDetails', 'passportValidFrom']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Passport Valid To" name={['complianceDetails', 'passportValidTo']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AEP Application Status" name={['complianceDetails', 'aepApplicationStatus']}>
                  <Select placeholder="Select status" showSearch={{ optionFilterProp: 'label' }} options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
              {isGmr && (
                <Col span={6}>
                  <Form.Item label="AEP Type" name={['complianceDetails', 'aepType']}>
                    <Select placeholder="Select AEP type" showSearch={{ optionFilterProp: 'label' }} options={AEP_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))} />
                  </Form.Item>
                </Col>
              )}
              <Col span={6}>
                <Form.Item label="AEP Number" name={['complianceDetails', 'aepNumber']}>
                  <Input placeholder="Enter AEP number" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AEP Validity" name={['complianceDetails', 'aepValidity']}>
                  <Input placeholder="Enter AEP validity" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AEP Date" name={['complianceDetails', 'aepDate']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AVSEC Status" name={['complianceDetails', 'avsecStatus']}>
                  <Select placeholder="Select status" showSearch={{ optionFilterProp: 'label' }} options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AVSEC Valid From" name={['complianceDetails', 'avsecValidFrom']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="AVSEC Valid To" name={['complianceDetails', 'avsecValidTo']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
            </Row>

            <Divider titlePlacement="left">Work Details</Divider>
            <Row gutter={16}>
              {isGmr && (
                <Col span={6}>
                  <Form.Item label="Shift" name={['workDetails', 'shift']}>
                    <Input placeholder="Enter shift" />
                  </Form.Item>
                </Col>
              )}
              <Col span={6}>
                <Form.Item label="Hostel" name={['workDetails', 'category']}>
                  <Select placeholder="Select hostel" showSearch={{ optionFilterProp: 'label' }} options={OPTED_OPTIONS.map((o) => ({ value: o, label: o }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Uniform" name={['workDetails', 'uniform']}>
                  <Select placeholder="Select uniform" showSearch={{ optionFilterProp: 'label' }} options={UNIFORM_OPTIONS.map((o) => ({ value: o, label: o }))} />
                </Form.Item>
              </Col>
              {uniformOpted && (
                <Col span={6}>
                  <Form.Item label="Uniform Size" name={['workDetails', 'uniformSize']}>
                    <Input placeholder="Enter uniform size" />
                  </Form.Item>
                </Col>
              )}
              <Col span={6}>
                <Form.Item label="Shoes" name={['workDetails', 'shoes']}>
                  <Select placeholder="Select shoes" showSearch={{ optionFilterProp: 'label' }} options={OPTED_OPTIONS.map((o) => ({ value: o, label: o }))} />
                </Form.Item>
              </Col>
              {shoesOpted && (
                <Col span={6}>
                  <Form.Item label="Shoes Size" name={['workDetails', 'shoesSize']}>
                    <Input placeholder="Enter shoes size" />
                  </Form.Item>
                </Col>
              )}
              <Col span={6}>
                <Form.Item label="Transport" name={['workDetails', 'transport']}>
                  <Select placeholder="Select transport" showSearch={{ optionFilterProp: 'label' }} options={OPTED_OPTIONS.map((o) => ({ value: o, label: o }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Previous Experience" name={['workDetails', 'previousExperience']}>
                  <Input placeholder="Enter previous experience" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Certificates" name={['workDetails', 'certificates']}>
                  <Input placeholder="Enter certificates" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Document Given" name={['workDetails', 'documentGiven']}>
                  <Input placeholder="Enter document given" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Broker Name" name={['workDetails', 'brokerName']}>
                  <Input placeholder="Enter broker name" />
                </Form.Item>
              </Col>
              {hostelOpted && (
                <Col span={6}>
                  <Form.Item label="Hostel Joining Date" name={['workDetails', 'hostelJoiningDate']}>
                    <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                  </Form.Item>
                </Col>
              )}
              {isAirportSite && (
                <Col span={6}>
                  <Form.Item label="PVC Status" name={['workDetails', 'pvcStatus']}>
                    <Select placeholder="Select status" showSearch={{ optionFilterProp: 'label' }} options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
                  </Form.Item>
                </Col>
              )}
              <Col span={6}>
                <Form.Item label="Leave From Date" name={['workDetails', 'leaveFromDate']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Leave To Date" name={['workDetails', 'leaveToDate']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Notice Date" name={['workDetails', 'noticeDate']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Notice Reason" name={['workDetails', 'noticeReason']}>
                  <Input placeholder="Enter notice reason" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Exit Date" name={['workDetails', 'exitDate']}>
                  <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Exit Status" name={['workDetails', 'exitStatus']}>
                  <Select placeholder="Select exit status" showSearch={{ optionFilterProp: 'label' }} options={EXIT_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Full & Final Settlement" name={['workDetails', 'fullFinalSettlement']}>
                  <Input placeholder="Enter full & final settlement" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Remarks" name={['workDetails', 'remarks']}>
                  <Input placeholder="Enter remarks" />
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
