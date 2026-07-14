import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Descriptions, Skeleton, Tag } from 'antd';
import { useEmployeeQuery } from '../../hooks/useEmployees';

export function EmployeeDetailPage() {
  const { id } = useParams();
  const { data: employee, isLoading } = useEmployeeQuery(id ? +id : undefined);

  function initials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }

  if (isLoading || !employee) {
    return <Skeleton active />;
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
              {employee.idNo} {employee.isActive ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>}
            </div>
          </div>
        </div>
        <Link to={`/employees/${employee.id}/edit`}>
          <Button type="primary">Edit</Button>
        </Link>
      </div>

      <Card title="Basic Info" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="Email">{employee.emailId}</Descriptions.Item>
          <Descriptions.Item label="Phone">{employee.phoneNo}</Descriptions.Item>
          <Descriptions.Item label="Serial Number">{employee.serialNumberAssigned ?? '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Personal Details" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="Gender">{employee.personalDetails?.gender ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Date of Birth">{employee.personalDetails?.dateOfBirth ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Marital Status">{employee.personalDetails?.maritalStatus ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Blood Group">{employee.personalDetails?.bloodGroup ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Nationality">{employee.personalDetails?.nationality ?? '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Work Details" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="Site">{employee.workDetails?.site ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Shift">{employee.workDetails?.shift ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Category">{employee.workDetails?.category ?? '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Addresses">
        {(employee.addresses ?? []).map((a) => (
          <div key={a.addressType} style={{ marginBottom: 12 }}>
            <strong>{a.addressType}</strong>
            <div>{[a.line1, a.district, a.state, a.pincode].filter(Boolean).join(', ')}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
