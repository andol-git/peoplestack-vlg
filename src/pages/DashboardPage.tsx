import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Col, Row } from 'antd';
import {
  BankOutlined,
  LinkOutlined,
  PlusOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEmployeesQuery } from '../hooks/useEmployees';

const STAT_CONFIG = [
  {
    label: 'Active Employees',
    icon: TeamOutlined,
    iconBg: '#eef2ff',
    iconColor: '#6366f1',
    trend: '+12%',
    trendBg: '#dcfce7',
    trendColor: '#16a34a',
  },
  {
    label: 'Inactive Staff',
    icon: UserDeleteOutlined,
    iconBg: '#f1f5f9',
    iconColor: '#64748b',
    trend: '0 total',
    trendBg: '#f1f5f9',
    trendColor: '#64748b',
  },
  {
    label: 'Sites Managed',
    icon: BankOutlined,
    iconBg: '#d1fae5',
    iconColor: '#10b981',
    trend: '+2 new',
    trendBg: '#dcfce7',
    trendColor: '#16a34a',
  },
  {
    label: 'Pending AEPs',
    icon: SafetyCertificateOutlined,
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    trend: '5 due',
    trendBg: '#fef3c7',
    trendColor: '#b45309',
  },
];

const QUICK_ACTIONS = [
  { to: '/employees/new', icon: PlusOutlined, label: 'Add New Employee', iconBg: '#eef2ff', iconColor: '#6366f1' },
  { to: '/assignments', icon: LinkOutlined, label: 'Assign Staff', iconBg: '#f5f3ff', iconColor: '#8b5cf6' },
  { to: '/attendance/today', icon: TeamOutlined, label: 'View Attendance', iconBg: '#d1fae5', iconColor: '#10b981' },
];

const RECENT_ACTIVITY = [
  { action: 'New employee added', name: 'BOLEDDULA SUNDAR', time: '2 hrs ago' },
  { action: 'AEP updated', name: 'RAVI KUMAR', time: '4 hrs ago' },
  { action: 'Employee deactivated', name: 'SURESH BABU', time: '1 day ago' },
  { action: 'Bank details added', name: 'MAHESH YADAV', time: '2 days ago' },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const { data: activeEmployees = [] } = useEmployeesQuery(true);
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(id);
  }, []);

  // Sites Managed / Pending AEPs have no backing endpoint yet — placeholders until they do.
  const statValues = [activeEmployees.length, 0, 4, 12];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>{greeting()} 👋</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>{now.format('dddd, D MMMM YYYY')} · {now.format('h:mm a')}</p>
        </div>
        <Link to="/employees/new">
          <Button type="primary" icon={<PlusOutlined />}>Add Employee</Button>
        </Link>
      </div>

      <Row gutter={16}>
        {STAT_CONFIG.map((s, i) => {
          const Icon = s.icon;
          return (
            <Col xs={12} md={6} key={s.label}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: s.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon style={{ fontSize: 18, color: s.iconColor }} />
                  </div>
                  <span
                    style={{
                      background: s.trendBg,
                      color: s.trendColor,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '2px 10px',
                      borderRadius: 999,
                    }}
                  >
                    {s.trend}
                  </span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{statValues[i]}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>{s.label}</div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card title="Quick Actions" styles={{ body: { padding: '4px 20px' } }}>
            {QUICK_ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 0',
                    color: 'inherit',
                    borderBottom: i < QUICK_ACTIONS.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: action.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon style={{ color: action.iconColor, fontSize: 14 }} />
                    </span>
                    {action.label}
                  </span>
                  <RightOutlined style={{ color: '#cbd5e1', fontSize: 12 }} />
                </Link>
              );
            })}
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Recent Activity" extra={<Link to="/employees">View all</Link>} styles={{ body: { padding: '4px 20px' } }}>
            {RECENT_ACTIVITY.map((a, i) => (
              <div
                key={a.name + a.time}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 0',
                  borderBottom: i < RECENT_ACTIVITY.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.action}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>{a.name}</div>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{a.time}</div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
