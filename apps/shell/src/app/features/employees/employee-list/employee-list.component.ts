import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeFacade } from '@ps/shared/data-access';
import { Employee } from '@ps/shared/models';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './employee-list.component.html',
})
export class EmployeeListComponent implements OnInit {
  readonly facade = inject(EmployeeFacade);

  searchQuery   = signal('');
  activeTab     = signal<'active' | 'inactive'>('active');
  selectedIds   = signal<Set<number>>(new Set());
  deleteConfirm = signal<number | null>(null);
  currentPage   = signal(1);
  pageSize      = 10;

  readonly filteredEmployees = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.facade.employees().filter((e) => {
      if (!q) return true;
      return (
        e.idNo?.toLowerCase().includes(q) ||
        e.personalDetails?.name?.toLowerCase().includes(q) ||
        e.phoneNo?.includes(q) ||
        e.workDetails?.site?.toLowerCase()?.includes(q)
      );
    });
  });

  readonly paginatedEmployees = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredEmployees().slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.filteredEmployees().length / this.pageSize)
  );

  ngOnInit(): void {
    this.loadTab(this.activeTab());
  }

  loadTab(tab: 'active' | 'inactive'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.selectedIds.set(new Set());
    this.facade.loadEmployees(tab === 'active');
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  toggleSelect(id: number): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  confirmDelete(id: number): void {
    this.deleteConfirm.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirm.set(null);
  }

  doDelete(id: number): void {
    this.facade.deleteEmployee(id);
    this.deleteConfirm.set(null);
  }

  inactivate(id: number): void {
    this.facade.inactivateEmployee(id);
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }

  getStatusBadge(emp: Employee): string {
    return emp.isActive ? 'ps-badge-active' : 'ps-badge-inactive';
  }

  pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getPageEnd(): number {
    return Math.min(this.currentPage() * this.pageSize, this.filteredEmployees().length);
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  goToPage(p: number): void {
    this.currentPage.set(p);
  }
}
