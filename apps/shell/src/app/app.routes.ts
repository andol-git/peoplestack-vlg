import { Routes } from "@angular/router";
import { authGuard, guestGuard } from "./core/guards/auth.guard";

export const appRoutes: Routes = [
  {
    path: "login",
    canActivate: [guestGuard],
    loadComponent: () =>
      import("./features/auth/login/login.component").then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./layout/shell-layout/shell-layout.component").then(
        (m) => m.ShellLayoutComponent,
      ),
    children: [
      {
        path: "users",
        children: [
          {
            path: "",
            loadComponent: () =>
              import("./features/users/user-list/user-list.component").then(
                (m) => m.UserListComponent,
              ),
          },
          {
            path: "new",
            loadComponent: () =>
              import("./features/users/user-form/user-form.component").then(
                (m) => m.UserFormComponent,
              ),
          },
          {
            path: ":id",
            loadComponent: () =>
              import("./features/users/user-detail/user-detail.component").then(
                (m) => m.UserDetailComponent,
              ),
          },
          {
            path: ":id/edit",
            loadComponent: () =>
              import("./features/users/user-form/user-form.component").then(
                (m) => m.UserFormComponent,
              ),
          },
        ],
      },
      {
        path: "attendance",
        children: [
          {
            path: "",
            redirectTo: "today",
            pathMatch: "full",
          },
          {
            path: "today",
            loadComponent: () =>
              import("./features/attendance/today-attendance/today-attendance.component").then(
                (m) => m.TodayAttendanceComponent,
              ),
          },
          {
            path: "sheet",
            loadComponent: () =>
              import("./features/attendance/attendance.component").then(
                (m) => m.AttendanceComponent,
              ),
          },
        ],
      },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: "employees",
        children: [
          {
            path: "",
            loadComponent: () =>
              import("./features/employees/employee-list/employee-list.component").then(
                (m) => m.EmployeeListComponent,
              ),
          },
          {
            path: "new",
            loadComponent: () =>
              import("./features/employees/employee-form/employee-form.component").then(
                (m) => m.EmployeeFormComponent,
              ),
          },
          {
            path: ":id/edit",
            loadComponent: () =>
              import("./features/employees/employee-form/employee-form.component").then(
                (m) => m.EmployeeFormComponent,
              ),
          },
          {
            path: ":id",
            loadComponent: () =>
              import("./features/employees/employee-detail/employee-detail.component").then(
                (m) => m.EmployeeDetailComponent,
              ),
          },
        ],
      },
      {
        path: "customers",
        children: [
          {
            path: "",
            loadComponent: () =>
              import("./features/customers/customer-list/customer-list.component").then(
                (m) => m.CustomerListComponent,
              ),
          },
          {
            path: "new",
            loadComponent: () =>
              import("./features/customers/customer-form/customer-form.component").then(
                (m) => m.CustomerFormComponent,
              ),
          },
          {
            path: ":id",
            loadComponent: () =>
              import("./features/customers/customer-detail/customer-detail.component").then(
                (m) => m.CustomerDetailComponent,
              ),
          },
          {
            path: ":id/edit",
            loadComponent: () =>
              import("./features/customers/customer-form/customer-form.component").then(
                (m) => m.CustomerFormComponent,
              ),
          },
        ],
      },
      {
        path: "assignments",
        loadComponent: () =>
          import("./features/customers/assign-staff-page/assign-staff-page.component").then(
            (m) => m.AssignStaffPageComponent,
          ),
      },
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
    ],
  },
  { path: "**", redirectTo: "/dashboard" },
];
