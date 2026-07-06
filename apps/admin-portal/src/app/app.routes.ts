import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
  {
    path: "login",
    loadComponent: () =>
      import("@ps/auth").then((m) => m.LoginComponent),
    title: "PeopleStack — Sign In",
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./shell/shell.component").then((m) => m.ShellComponent),
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("@ps/feature-dashboard").then(
            (m) => m.DashboardComponent,
          ),
        title: "Dashboard",
      },
      {
        path: "employees",
        loadComponent: () =>
          import("@ps/feature-employee").then(
            (m) => m.EmployeeListComponent,
          ),
        title: "Employees",
      },
      {
        path: "employees/new",
        loadComponent: () =>
          import("@ps/feature-employee").then(
            (m) => m.EmployeeFormComponent,
          ),
        title: "New Employee",
      },
      {
        path: "employees/:id",
        loadComponent: () =>
          import("@ps/feature-employee").then(
            (m) => m.EmployeeFormComponent,
          ),
        title: "Edit Employee",
      },
      {
        path: "customers",
        loadComponent: () =>
          import("@ps/feature-customer").then(
            (m) => m.CustomerListComponent,
          ),
        title: "Customers",
      },
      {
        path: "assignments",
        loadComponent: () =>
          import("@ps/feature-customer").then(
            (m) => m.AssignStaffPageComponent,
          ),
        title: "PeopleStack — Assign Staff",
      },
      {
        path: "attendance",
        loadComponent: () =>
          import("@ps/feature-attendance").then(
            (m) => m.AttendanceDashboardComponent,
          ),
        title: "Attendance",
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },
  { path: "**", redirectTo: "login" },
];
