import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './components/ProtectedRoute';
import { ShellLayout } from './layout/ShellLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeeListPage } from './pages/employees/EmployeeListPage';
import { EmployeeFormPage } from './pages/employees/EmployeeFormPage';
import { EmployeeDetailPage } from './pages/employees/EmployeeDetailPage';
import { CustomerListPage } from './pages/customers/CustomerListPage';
import { CustomerFormPage } from './pages/customers/CustomerFormPage';
import { CustomerDetailPage } from './pages/customers/CustomerDetailPage';
import { AssignStaffPage } from './pages/customers/AssignStaffPage';
import { UserListPage } from './pages/users/UserListPage';
import { UserFormPage } from './pages/users/UserFormPage';
import { UserDetailPage } from './pages/users/UserDetailPage';
import { TodayAttendancePage } from './pages/attendance/TodayAttendancePage';
import { AttendanceSheetPage } from './pages/attendance/AttendanceSheetPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<ShellLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/employees" element={<EmployeeListPage />} />
          <Route path="/employees/new" element={<EmployeeFormPage />} />
          <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />

          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/customers/new" element={<CustomerFormPage />} />
          <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />

          <Route path="/assignments" element={<AssignStaffPage />} />

          <Route path="/users" element={<UserListPage />} />
          <Route path="/users/new" element={<UserFormPage />} />
          <Route path="/users/:id/edit" element={<UserFormPage />} />
          <Route path="/users/:id" element={<UserDetailPage />} />

          <Route path="/attendance" element={<Navigate to="/attendance/today" replace />} />
          <Route path="/attendance/today" element={<TodayAttendancePage />} />
          <Route path="/attendance/sheet" element={<AttendanceSheetPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
