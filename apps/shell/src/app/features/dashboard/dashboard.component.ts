import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmployeeFacade } from '@ps/shared/data-access';
import { APP_CONFIG } from '@ps/shared/data-access';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  readonly employeeFacade = inject(EmployeeFacade);
  readonly config         = inject(APP_CONFIG);

  currentTime = signal(new Date());

  readonly statCards = [
    { label: 'Active Employees', valueKey: 'active',   icon: 'users',   color: 'brand',   trend: '+12%' },
    { label: 'Inactive Staff',   valueKey: 'inactive', icon: 'user-x',  color: 'slate',   trend: '-3%' },
    { label: 'Sites Managed',    valueKey: 'sites',    icon: 'building', color: 'emerald', trend: '+2' },
    { label: 'Pending AEPs',     valueKey: 'aeps',    icon: 'shield',   color: 'amber',   trend: '5 due' },
  ];

  readonly recentActivity = [
    { action: 'New employee added', name: 'BOLEDDULA SUNDAR', time: '2 hrs ago', type: 'create' },
    { action: 'AEP updated',        name: 'RAVI KUMAR',       time: '4 hrs ago', type: 'update' },
    { action: 'Employee deactivated', name: 'SURESH BABU',    time: '1 day ago', type: 'deactivate' },
    { action: 'Bank details added',  name: 'MAHESH YADAV',    time: '2 days ago', type: 'update' },
  ];

  ngOnInit(): void {
    this.employeeFacade.loadEmployees(true);
    setInterval(() => this.currentTime.set(new Date()), 1000);
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(d: Date): string {
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}
