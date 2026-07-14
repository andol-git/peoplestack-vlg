import { useState } from 'react';
import { Button, DatePicker, Drawer, Form, Select, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { useUploadAttendance } from '../hooks/useAttendance';
import { COMPANIES } from '../constants/companies';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UploadAttendanceDrawer({ open, onClose }: Props) {
  const [form] = Form.useForm();
  const [file, setFile] = useState<UploadFile | null>(null);
  const uploadMutation = useUploadAttendance();

  function handleClose() {
    form.resetFields();
    setFile(null);
    onClose();
  }

  async function handleUpload() {
    try {
      const values = await form.validateFields();
      if (!file) {
        message.error('Please select a file to upload.');
        return;
      }
      const date = values.date.format('YYYY-MM-DD');
      await uploadMutation.mutateAsync({ file: file as unknown as File, date, companyId: values.companyId });
      message.success('Attendance file uploaded successfully.');
      handleClose();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.message ?? 'Failed to upload attendance file.');
    }
  }

  return (
    <Drawer
      title="Upload Attendance"
      open={open}
      onClose={handleClose}
      size={420}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={uploadMutation.isPending} onClick={handleUpload}>
            Upload
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ date: dayjs(), companyId: COMPANIES[0]?.id }}>
        <Form.Item label="Company" name="companyId" rules={[{ required: true, message: 'Please select a company' }]}>
          <Select options={COMPANIES.map((c) => ({ value: c.id, label: c.label }))} />
        </Form.Item>

        <Form.Item label="Attendance Date" name="date" rules={[{ required: true, message: 'Please select a date' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Attendance File" required>
          <Upload
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            onRemove={() => setFile(null)}
            maxCount={1}
            fileList={file ? [file] : []}
          >
            <Button icon={<UploadOutlined />}>Browse</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Drawer>
  );
}
