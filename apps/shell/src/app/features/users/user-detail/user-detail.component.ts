import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { UserFacade } from '@ps/shared/data-access';
import { AppUser } from '../user-list/user-list.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent implements OnInit {
  private readonly facade = inject(UserFacade);
  private readonly route  = inject(ActivatedRoute);

  public readonly isLoading = this.facade.isLoading;
  public readonly error     = this.facade.error;

  public readonly user = computed<AppUser | null>(() => {
    const u = this.facade.selectedUser();
    if (!u) return null;
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
  });

  public readonly permissions: Record<string, string[]> = {
    'Employee Management': ['View', 'Create', 'Edit', 'Delete', 'Activate/Deactivate'],
    'Attendance':          ['View', 'Edit', 'Export'],
    'Compliance':          ['View', 'Edit'],
    'Reports':             ['View', 'Export'],
    'User Management':     ['View', 'Create', 'Edit', 'Delete'],
    'Settings':            ['View', 'Edit'],
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.facade.loadUserById(+id).subscribe();
    }
  }

  public getRoleClass(role: string): string {
    switch (role) {
      case 'Admin':      return 'bg-purple-100 text-purple-700';
      case 'Manager':    return 'bg-blue-100 text-blue-700';
      case 'HR':         return 'bg-emerald-100 text-emerald-700';
      case 'Supervisor': return 'bg-amber-100 text-amber-700';
      default:           return 'bg-slate-100 text-slate-600';
    }
  }

  public getInitials(name: string): string {
    return name.split(/[\s._-]/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
