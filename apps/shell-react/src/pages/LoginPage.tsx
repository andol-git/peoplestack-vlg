import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input } from 'antd';
import { LockOutlined, UserOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import './LoginPage.css';

const FEATURES = [
  { icon: '👥', label: 'Employee Management' },
  { icon: '🔐', label: 'AEP & Compliance' },
  { icon: '📊', label: 'Analytics Dashboard' },
  { icon: '🏢', label: 'Multi-Site Support' },
];

export function LoginPage() {
  const { login, error, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const currentYear = new Date().getFullYear();

  async function onFinish(values: { username: string; password: string }) {
    try {
      await login(values);
      navigate('/dashboard');
    } catch {
      // error state is surfaced via `error` from useAuth
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-glow auth-glow-1" />
        <div className="auth-glow auth-glow-2" />
        <div className="auth-dot auth-dot-1" />
        <div className="auth-dot auth-dot-2" />
      </div>

      <div className="auth-left">
        <div className="auth-logo-row">
          <PeopleStackLogo width={300} height={80} />
        </div>

        <div className="auth-copy-block">
          <div className="auth-badge">
            <span className="auth-badge-dot" />
            <span className="auth-badge-text">Enterprise Platform</span>
          </div>
          <h1 className="auth-heading">
            Manage Your
            <br />
            <span className="auth-heading-accent">Workforce</span>
            <br />
            Seamlessly
          </h1>
          <p className="auth-lede">
            Complete workforce management solution for security staff, loaders, and utility teams.
            Track employees, compliance, and operations — all in one place.
          </p>
          <div className="auth-features">
            {FEATURES.map((f) => (
              <div className="feature-chip" key={f.label}>
                <span>{f.icon}</span>
                <span className="feature-label">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="auth-copyright">© {currentYear} PeopleStack. All rights reserved.</p>
      </div>

      <div className="auth-right">
        <div className="auth-card-wrap">
          <div className="auth-card">
            <div className="auth-mobile-logo">
              <PeopleStackLogo width={160} height={48} />
            </div>

            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">Sign in to your PeopleStack portal</p>

            {error && (
              <div className="auth-alert">
                <span className="auth-alert-text">{error}</span>
              </div>
            )}

            <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
              <Form.Item
                label={<span className="auth-label">Username</span>}
                name="username"
                rules={[
                  { required: true, message: 'Username is required' },
                  { min: 3, message: 'At least 3 characters required' },
                ]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined />}
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                label={<span className="auth-label">Password</span>}
                name="password"
                rules={[
                  { required: true, message: 'Password is required' },
                  { min: 4, message: 'At least 4 characters required' },
                ]}
              >
                <Input
                  size="large"
                  type={showPassword ? 'text' : 'password'}
                  prefix={<LockOutlined />}
                  suffix={
                    <span onClick={() => setShowPassword((v) => !v)} style={{ cursor: 'pointer' }}>
                      {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </span>
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
                  Sign In
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

function PeopleStackLogo({ width, height }: { width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 360 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <rect x="8" y="4" width="16" height="82" rx="8" fill="url(#lg1)" />
      <path d="M16 4 H38 C62 4 80 20 80 44 C80 68 62 84 38 84 H16 Z" fill="url(#lg1)" />
      <path d="M28 18 H38 C52 18 64 30 64 44 C64 58 52 70 38 70 H28 Z" fill="white" />
      <path d="M8 72 L8 86 L22 78" fill="url(#lg1)" />
      <circle cx="37" cy="34" r="6" fill="url(#lg2)" opacity="0.85" />
      <path d="M28 58 C28 50 32 47 37 47 C42 47 46 50 46 58 Z" fill="url(#lg2)" opacity="0.85" />
      <circle cx="50" cy="30" r="8" fill="url(#lg1)" />
      <path d="M39 58 C39 48 44 44 50 44 C56 44 61 48 61 58 Z" fill="url(#lg1)" />
      <circle cx="63" cy="34" r="6" fill="#818cf8" opacity="0.85" />
      <path d="M54 58 C54 50 58 47 63 47 C68 47 72 50 72 58 Z" fill="#818cf8" opacity="0.85" />
      <text x="96" y="50" fontFamily="DM Sans,Arial,sans-serif" fontSize="30" fontWeight="300" fill="#94a3b8" letterSpacing="-1">
        People
      </text>
      <text x="193" y="50" fontFamily="DM Sans,Arial,sans-serif" fontSize="30" fontWeight="800" fill="#6366f1" letterSpacing="-1">
        Stack
      </text>
    </svg>
  );
}
