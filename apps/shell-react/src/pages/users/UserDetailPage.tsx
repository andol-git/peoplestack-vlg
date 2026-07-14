import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, Card, Descriptions, Skeleton, Tag } from 'antd';
import { useUserQuery } from '../../hooks/useUsers';

export function UserDetailPage() {
  const { id } = useParams();
  const { data: user, isLoading } = useUserQuery(id ? +id : undefined);

  if (isLoading || !user) {
    return <Skeleton active />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={48} className="ps-avatar">{user.username.charAt(0).toUpperCase()}</Avatar>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{user.username}</h1>
            <div style={{ color: '#9ca3af' }}>
              {user.email} {user.isActive ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>}
            </div>
          </div>
        </div>
        <Link to={`/users/${user.id}/edit`}>
          <Button type="primary">Edit</Button>
        </Link>
      </div>

      <Card title="Details">
        <Descriptions column={2}>
          <Descriptions.Item label="Phone">{user.phone ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Role">{user.roles?.[0]?.name?.replace('ROLE_', '') ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Created">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
