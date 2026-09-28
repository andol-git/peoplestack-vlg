import { useRef, useState } from 'react';
import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Upload, message } from 'antd';
import { DownloadOutlined, PrinterOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { useReactToPrint } from 'react-to-print';
import { toPng } from 'html-to-image';
import { useEmployeesQuery } from '../../hooks/useEmployees';
import { BLOOD_GROUP_OPTIONS } from '../../constants/employeeOptions';
import { blockNonDigits } from '../../utils/employeeFormFields';
import { PhotoCropModal } from './PhotoCropModal';
import { IdCardPreview, CARD_WIDTH_CM, CARD_HEIGHT_CM, CARD_BASE_WIDTH_PX } from './IdCardPreview';
import type { IdCardData } from './idcard.types';

const PRINT_SCALE = (96 / 2.54) * (CARD_WIDTH_CM / CARD_BASE_WIDTH_PX);

export function IdCardGeneratorPage() {
  const [form] = Form.useForm();
  const { data: activeEmployees = [] } = useEmployeesQuery(true);
  const { data: inactiveEmployees = [] } = useEmployeesQuery(false);
  const employees = [...activeEmployees, ...inactiveEmployees];
  const [photo, setPhoto] = useState<string | undefined>();
  const [photoDraft, setPhotoDraft] = useState<string | undefined>();
  const cardRef = useRef<HTMLDivElement>(null);

  const formValues = Form.useWatch([], form) ?? {};
  const cardData: IdCardData = {
    idNumber: formValues.idNumber,
    employeeName: formValues.employeeName,
    designation: formValues.designation,
    dateOfBirth: formValues.dateOfBirth?.format?.('YYYY-MM-DD'),
    bloodGroup: formValues.bloodGroup,
    workLocation: formValues.workLocation,
    emergencyContact: formValues.emergencyContact,
    photo,
  };

  function handleEmployeeSelect(employeeId: number | undefined) {
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return;
    form.setFieldsValue({
      idNumber: employee.serialNumberAssigned,
      employeeName: employee.personalDetails?.name,
      designation: employee.careerDetails?.designation?.name,
      dateOfBirth: employee.personalDetails?.dateOfBirth ? dayjs(employee.personalDetails.dateOfBirth) : undefined,
      bloodGroup: employee.personalDetails?.bloodGroup,
      workLocation: employee.workDetails?.site,
    });
  }

  const uploadProps: UploadProps = {
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = () => setPhotoDraft(reader.result as string);
      reader.readAsDataURL(file);
      return false;
    },
  };

  async function handleDownload() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
    const link = document.createElement('a');
    link.download = `${cardData.employeeName || cardData.idNumber || 'id-card'}.png`;
    link.href = dataUrl;
    link.click();
  }

  const handlePrint = useReactToPrint({
    contentRef: cardRef,
    documentTitle: cardData.employeeName || 'id-card',
    pageStyle: `
      @page { size: ${CARD_WIDTH_CM}cm ${CARD_HEIGHT_CM}cm; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .id-card, .id-card * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .id-card { width: ${CARD_WIDTH_CM}cm !important; height: ${CARD_HEIGHT_CM}cm !important; }
      .id-card-inner { transform: scale(${PRINT_SCALE}); transform-origin: top left; }
    `,
  });

  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700 }}>ID Card Generator</h1>
      <Row gutter={24}>
        <Col span={10}>
          <Card title="Employee Details">
            <Form.Item label="Select Employee" style={{ marginBottom: 20 }}>
              <Select
                allowClear
                showSearch={{ optionFilterProp: 'label' }}
                placeholder="Search an employee to auto-fill, or leave blank to enter manually"
                options={employees.map((e) => ({
                  value: e.id,
                  label: `${e.personalDetails?.name ?? e.serialNumberAssigned ?? `Employee #${e.id}`}${e.isActive ? '' : ' (Inactive)'}`,
                }))}
                onChange={handleEmployeeSelect}
              />
            </Form.Item>

            <Form form={form} layout="vertical">
              <Form.Item
                label="ID Number"
                name="idNumber"
                rules={[
                  { required: true, message: 'ID number is required' },
                  { pattern: /^[A-Za-z0-9/-]+$/, message: 'Only letters, numbers, - and / are allowed' },
                ]}
              >
                <Input placeholder="Enter ID number" />
              </Form.Item>
              <Form.Item
                label="Employee Name"
                name="employeeName"
                rules={[
                  { required: true, message: 'Employee name is required' },
                  { min: 2, message: 'Name must be at least 2 characters' },
                  { pattern: /^[A-Za-z .'-]+$/, message: 'Enter a valid name' },
                ]}
              >
                <Input placeholder="Enter employee name" />
              </Form.Item>
              <Form.Item label="Designation" name="designation" rules={[{ required: true, message: 'Designation is required' }]}>
                <Input placeholder="Enter designation" />
              </Form.Item>
              <Form.Item label="Date of Birth" name="dateOfBirth" rules={[{ required: true, message: 'Date of birth is required' }]}>
                <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" placeholder="DD-MM-YYYY" disabledDate={(d) => d.isAfter(dayjs())} />
              </Form.Item>
              <Form.Item label="Blood Group" name="bloodGroup" rules={[{ required: true, message: 'Blood group is required' }]}>
                <Select placeholder="Select blood group" options={BLOOD_GROUP_OPTIONS.map((b) => ({ value: b, label: b }))} />
              </Form.Item>
              <Form.Item label="Work Location" name="workLocation" rules={[{ required: true, message: 'Work location is required' }]}>
                <Input placeholder="Enter work location" />
              </Form.Item>
              <Form.Item
                label="Emergency Contact No"
                name="emergencyContact"
                rules={[{ required: true, pattern: /^[0-9]{10}$/, message: 'Enter a valid 10-digit contact number' }]}
              >
                <Input placeholder="Enter 10-digit contact number" maxLength={10} onKeyDown={blockNonDigits} />
              </Form.Item>
              <Form.Item label="Photo">
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>Choose Photo</Button>
                </Upload>
                {photo && (
                  <Button type="link" onClick={() => setPhotoDraft(photo)}>
                    Adjust photo
                  </Button>
                )}
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={14}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Live Preview</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button icon={<DownloadOutlined />} onClick={() => void handleDownload().catch(() => message.error('Download failed.'))}>
                  Download
                </Button>
                <Button icon={<PrinterOutlined />} onClick={() => handlePrint()}>
                  Print
                </Button>
              </div>
            </div>
            <IdCardPreview ref={cardRef} data={cardData} />
          </Card>
        </Col>
      </Row>

      {photoDraft && (
        <PhotoCropModal
          imageSrc={photoDraft}
          open={!!photoDraft}
          onCancel={() => setPhotoDraft(undefined)}
          onSave={(cropped) => {
            setPhoto(cropped);
            setPhotoDraft(undefined);
          }}
        />
      )}
    </div>
  );
}
