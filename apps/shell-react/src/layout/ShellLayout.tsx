import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Layout, Menu, type MenuProps } from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { APP_CONFIG } from '../config/app-config';
import { UploadAttendanceDrawer } from '../components/UploadAttendanceDrawer';
import {
  ATTENDANCE_PLANNING_ROLES,
  CUSTOMERS_ROLES,
  EMPLOYEES_ROLES,
  ROLE_LABELS,
  USERS_ROLES,
} from '../constants/roles';

const { Header, Sider, Content } = Layout;

export function ShellLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const { username, role, hasAnyRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleLabel = (role && ROLE_LABELS[role]) || 'User';

  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    ];

    if (hasAnyRole(...EMPLOYEES_ROLES)) {
      items.push({ key: '/employees', icon: <TeamOutlined />, label: 'Employees' });
    }

    if (hasAnyRole(...CUSTOMERS_ROLES)) {
      items.push({
        key: 'customers-group',
        icon: <ShopOutlined />,
        label: 'Customers',
        children: [
          { key: '/customers', label: 'Customers' },
          { key: '/customers/new', label: 'Add Customer' },
          { key: '/assignments', label: 'Assign Staff' },
        ],
      });
    }

    if (hasAnyRole(...USERS_ROLES)) {
      items.push({ key: '/users', icon: <UserOutlined />, label: 'Users' });
    }

    const attendanceChildren: NonNullable<MenuProps['items']> = [
      { key: 'upload-attendance', label: 'Upload Attendance' },
      { type: 'divider' },
      { key: '/attendance/today', label: "Today's Attendance" },
      { key: '/attendance/sheet', label: 'Attendance Sheet' },
      { key: '/attendance/timesheets', label: 'Timesheets' },
    ];
    if (hasAnyRole(...ATTENDANCE_PLANNING_ROLES)) {
      attendanceChildren.push(
        { key: '/attendance/overtime', label: 'Overtime Requests' },
        { key: '/attendance/shifts', label: 'Shift Planning' }
      );
    }
    items.push({
      key: 'attendance-group',
      icon: <ClockCircleOutlined />,
      label: 'Attendance',
      children: attendanceChildren,
    });

    return items;
  }, [role]);

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith('/customers') || location.pathname.startsWith('/assignments')) {
      return location.pathname.startsWith('/customers/new') ? '/customers/new' : '/customers';
    }
    if (location.pathname.startsWith('/attendance')) return location.pathname;
    return `/${location.pathname.split('/')[1] || 'dashboard'}`;
  }, [location.pathname]);

  // Which submenu (if any) contains the currently active route.
  const activeGroupKey = useMemo(() => {
    if (location.pathname.startsWith('/customers') || location.pathname.startsWith('/assignments')) {
      return 'customers-group';
    }
    if (location.pathname.startsWith('/attendance')) return 'attendance-group';
    return null;
  }, [location.pathname]);

  // Submenus start closed; only the one containing the active route opens automatically.
  // Clicking a submenu header toggles it manually from there.
  const [openKeys, setOpenKeys] = useState<string[]>(activeGroupKey ? [activeGroupKey] : []);

  useEffect(() => {
    if (activeGroupKey) setOpenKeys((prev) => (prev.includes(activeGroupKey) ? prev : [...prev, activeGroupKey]));
  }, [activeGroupKey]);

  const profileMenu: MenuProps['items'] = [
    { key: 'profile', icon: <UserOutlined />, label: 'My Profile' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Sign Out', danger: true },
  ];

  async function handleProfileMenuClick({ key }: { key: string }): Promise<void> {
    if (key === 'logout') {
      await logout();
      navigate('/login');
    }
    // "My Profile" / "Settings" are inert, matching the current app.
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        width={240}
        style={{
          borderRight: '1px solid #e5e7eb',
          position: 'fixed',
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 20px',
            gap: 10,
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <img
            src="/vlg-logo.svg"
            alt={APP_CONFIG.appShortName}
            style={{ width: 48, height: 48, flexShrink: 0 }}
          />
          {!collapsed && (
            <span style={{ color: '#1e293b', fontWeight: 700, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
              {APP_CONFIG.appShortName}
            </span>
          )}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
          onClick={({ key }) => {
            if (key === 'upload-attendance') {
              setUploadDrawerOpen(true);
              return;
            }
            navigate(key);
          }}
          style={{ border: 'none', padding: '8px' }}
        />
      </Sider>
      <Layout style={{ marginInlineStart: collapsed ? 80 : 240, transition: 'margin-inline-start 0.2s' }}>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            height: 64,
            lineHeight: '64px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {collapsed ? (
              <MenuUnfoldOutlined onClick={() => setCollapsed(false)} />
            ) : (
              <MenuFoldOutlined onClick={() => setCollapsed(true)} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <BellOutlined style={{ fontSize: 16 }} />
            <Dropdown
              menu={{ items: profileMenu, onClick: handleProfileMenuClick }}
              trigger={['click']}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar className="ps-avatar">
                  {(username || 'A').charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{username || 'Admin'}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{roleLabel}</div>
                </div>
                <DownOutlined style={{ fontSize: 10, color: '#9ca3af' }} />
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>

      <UploadAttendanceDrawer open={uploadDrawerOpen} onClose={() => setUploadDrawerOpen(false)} />
    </Layout>
  );
}
