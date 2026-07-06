import { Component, inject, signal, HostListener } from "@angular/core";
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
} from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthFacade, APP_CONFIG } from "@ps/shared/data-access";

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

const ROLE_LABELS: Record<string, string> = {
  ROLE_SUPER_ADMIN: "Super Admin",
  ROLE_ADMIN: "Admin",
  ROLE_MANAGER: "Manager",
  ROLE_AGENT: "Supervisor",
  ROLE_EMPLOYEE: "User",
};

@Component({
  selector: "app-shell-layout",
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: "./shell-layout.component.html",
})
export class ShellLayoutComponent {
  readonly auth = inject(AuthFacade);
  readonly config = inject(APP_CONFIG);
  readonly router = inject(Router);

  // ─── Role-based nav visibility ─────────────────────────────────────────
  readonly employeesRoles = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MANAGER", "ROLE_AGENT"];
  readonly customersRoles = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MANAGER"];
  readonly usersRoles = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"];
  readonly attendancePlanningRoles = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN", "ROLE_MANAGER", "ROLE_AGENT"];

  hasAccess(roles: string[]): boolean {
    return this.auth.hasAnyRole(...roles);
  }

  roleLabel(): string {
    const role = this.auth.role();
    return (role && ROLE_LABELS[role]) || "User";
  }

sidebarOpen = signal(true);
  profileOpen = signal(false);
  attendanceOpen = signal(false);
  customersOpen = signal(false);

  readonly navItems: NavItem[] = [
    { label: "Dashboard", route: "/dashboard", icon: "grid" },
    { label: "Employees", route: "/employees", icon: "users" },
    { label: "Customers", route: "/customers", icon: "briefcase" },
    { label: "Assignments", route: "/assignments", icon: "link" },
    { label: "Compliance", route: "/compliance", icon: "shield" },
    { label: "Sites", route: "/sites", icon: "building" },
    { label: "Reports", route: "/reports", icon: "bar-chart" },
    { label: "Settings", route: "/settings", icon: "settings" },
  ];

  readonly bottomNavItems: NavItem[] = [
    { label: "Help & Support", route: "/help", icon: "help-circle" },
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
  toggleAttendance(): void {
    this.attendanceOpen.update((v) => !v);
  }
  toggleCustomers(): void {
    this.customersOpen.update((v) => !v);
  }
  toggleProfile(): void {
    this.profileOpen.update((v) => !v);
  }

  logout(): void {
    this.profileOpen.set(false);
    this.auth.logout();
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      !target.closest("[data-profile-trigger]") &&
      !target.closest("[data-profile-menu]")
    ) {
      this.profileOpen.set(false);
    }
  }
}
