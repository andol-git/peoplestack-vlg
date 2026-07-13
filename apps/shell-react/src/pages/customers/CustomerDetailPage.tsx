import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Descriptions, Skeleton, Tag } from 'antd';
import { useCustomerQuery } from '../../hooks/useCustomers';

export function CustomerDetailPage() {
  const { id } = useParams();
  const { data: customer, isLoading } = useCustomerQuery(id ? +id : undefined);

  if (isLoading || !customer) {
    return <Skeleton active />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={48} className="ps-avatar">{customer.name?.charAt(0) ?? 'C'}</Avatar>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{customer.name}</h1>
            <div style={{ color: '#9ca3af' }}>
              {customer.code} {customer.isActive ? <Tag color="success">Active</Tag> : <Tag>Inactive</Tag>}
            </div>
          </div>
        </div>
        <Link to={`/customers/${customer.id}/edit`}>
          <Button type="primary">Edit</Button>
        </Link>
      </div>

      <Card title="Details">
        <Descriptions column={2}>
          <Descriptions.Item label="Site">{customer.site ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Contact Number">{customer.contactNumber ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Assigned Staff">{customer.assignedStaffCount ?? 0}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
