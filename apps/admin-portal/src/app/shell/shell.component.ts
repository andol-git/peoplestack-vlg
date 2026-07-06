import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { AuthFacade } from '@ps/auth';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: string[];
}

const ROLE_LABELS: Record<string, string> = {
  ROLE_SUPER_ADMIN: 'Super Admin',
  ROLE_ADMIN: 'Admin',
  ROLE_MANAGER: 'Manager',
  ROLE_AGENT: 'Supervisor',
  ROLE_EMPLOYEE: 'User',
};

@Component({
  selector: 'ps-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgSwitch, NgSwitchCase, NgSwitchDefault],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  protected auth = inject(AuthFacade);
  collapsed   = signal(false);
  mobileOpen  = signal(false);

  private readonly nav: NavItem[] = [
    { label: 'Dashboard',   route: '/dashboard',   icon: 'grid' },
    { label: 'Employees',   route: '/employees',   icon: 'users',     roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AGENT'] },
    { label: 'Customers',   route: '/customers',   icon: 'briefcase', roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_MANAGER'] },
    { label: 'Assignments', route: '/assignments', icon: 'link',      roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_MANAGER'] },
    { label: 'Attendance',  route: '/attendance',  icon: 'clock' },
    { label: 'Reports',     route: '/reports',     icon: 'bar-chart', roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'] },
    { label: 'Settings',    route: '/settings',    icon: 'settings',  roles: ['ROLE_SUPER_ADMIN'] },
  ];

  readonly visibleNav = computed(() =>
    this.nav.filter(item => !item.roles || this.auth.hasAnyRole(...item.roles))
  );

  logout(): void { this.auth.logout(); }
  toggleCollapsed(): void { this.collapsed.update(v => !v); }
  toggleMobileOpen(): void { this.mobileOpen.update(v => !v); }

  roleLabel(): string {
    const role = this.auth.role();
    return (role && ROLE_LABELS[role]) || 'User';
  }
}
