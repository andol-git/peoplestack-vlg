import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserFacade } from '@ps/shared/data-access';
import { User } from '@ps/shared/models';

export type UserStatus = 'Active' | 'Inactive';

export interface AppUser {
  id: number;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  role: string;
  status: UserStatus;
  lastLogin: string;
  createdAt: string;
  isActive: boolean;
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  private readonly facade = inject(UserFacade);

  public searchQuery  = signal('');
  public filterRole   = signal('All');
  public filterStatus = signal('All');
  public currentPage  = signal(1);
  public pageSize     = signal(10);

  public readonly roles     = ['All', 'Admin', 'Manager', 'HR', 'Supervisor', 'Viewer'];
  public readonly statuses  = ['All', 'Active', 'Inactive'];
  public readonly pageSizes = [5, 10, 20, 50];

  public readonly isLoading = this.facade.isLoading;
  public readonly error     = this.facade.error;

  private readonly mappedUsers = computed(() =>
    this.facade.users().map(u => this.mapUser(u))
  );

  public readonly filtered = computed(() => {
    let data = this.mappedUsers();
    const q = this.searchQuery().toLowerCase();
    if (q) data = data.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
    if (this.filterRole() !== 'All')   data = data.filter(u => u.role === this.filterRole());
    if (this.filterStatus() !== 'All') data = data.filter(u => u.status === this.filterStatus());
    return data;
  });

  public readonly paginated = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  public readonly totalPages = computed(() =>
    Math.ceil(this.filtered().length / this.pageSize())
  );

  public readonly rangeText = computed(() => {
    const total = this.filtered().length;
    if (total === 0) return '0 of 0';
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end   = Math.min(this.currentPage() * this.pageSize(), total);
    return `${start} – ${end} of ${total}`;
  });

  public readonly summary = computed(() => ({
    total:    this.facade.users().length,
    active:   this.facade.users().filter(u => u.isActive).length,
    inactive: this.facade.users().filter(u => !u.isActive).length,
    admins:   this.facade.users().filter(u => u.roles?.some(r => r.name === 'Admin')).length,
  }));

  ngOnInit(): void {
    this.facade.loadUsers();
  }

  private mapUser(u: User): AppUser {
    return {
      id:        u.id!,
      name:      u.username,
      avatar:    this.getInitials(u.username),
      email:     u.email,
      phone:     u.phone ?? '',
      role:      u.roles?.[0]?.name ?? 'Viewer',
      status:    u.isActive ? 'Active' : 'Inactive',
      lastLogin: u.updatedAt ? new Date(u.updatedAt).toLocaleString() : '—',
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—',
      isActive:  u.isActive ?? false,
    };
  }

  private getInitials(name: string): string {
    return name.split(/[\s._-]/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  public toggleStatus(id: number): void {
    const user = this.facade.users().find(u => u.id === id);
    if (!user) return;
    this.facade.updateUserStatus(id, { isActive: !user.isActive }).subscribe();
  }

  public deleteUser(id: number): void {
    this.facade.updateUserStatus(id, { isActive: false }).subscribe();
  }

  public prevPage(): void { if (this.currentPage() > 1) this.currentPage.update(p => p - 1); }
  public nextPage(): void { if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1); }
  public onPageSizeChange(val: number): void { this.pageSize.set(+val); this.currentPage.set(1); }

  public getRoleClass(role: string): string {
    switch (role) {
      case 'Admin':      return 'bg-purple-100 text-purple-700';
      case 'Manager':    return 'bg-blue-100 text-blue-700';
      case 'HR':         return 'bg-emerald-100 text-emerald-700';
      case 'Supervisor': return 'bg-amber-100 text-amber-700';
      default:           return 'bg-slate-100 text-slate-600';
    }
  }

  public getRoleIcon(role: string): string {
    switch (role) {
      case 'Admin':      return 'fa-crown';
      case 'Manager':    return 'fa-briefcase';
      case 'HR':         return 'fa-heart';
      case 'Supervisor': return 'fa-eye';
      default:           return 'fa-binoculars';
    }
  }

  public getAvatarBg(id: number): string {
    const colors = [
      'bg-indigo-100 text-indigo-700',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700',
      'bg-purple-100 text-purple-700',
      'bg-rose-100 text-rose-700',
      'bg-sky-100 text-sky-700',
    ];
    return colors[(id - 1) % colors.length];
  }
}
