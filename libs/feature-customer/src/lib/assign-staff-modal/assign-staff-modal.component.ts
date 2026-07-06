import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges,
  SimpleChanges, inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssignmentFacade } from '../assignment-facade/assignment.facade';
import { Employee } from '@ps/shared/models';

@Component({
  selector: 'ps-assign-staff-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ps-modal-backdrop" (click)="onBackdropClick($event)">
      <div class="ps-modal" role="dialog" aria-modal="true">

        <!-- Header -->
        <div class="ps-modal-header">
          <div>
            <h2 class="ps-modal-title">Assign Staff</h2>
            <p class="ps-modal-sub">{{ customerName }}</p>
          </div>
          <button class="ps-modal-close" (click)="onClose()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Search -->
        <div class="ps-modal-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search employees..."
            [value]="searchTerm()"
            (input)="searchTerm.set($any($event.target).value)" />
        </div>

        <!-- Body -->
        <div class="ps-modal-body">
          @if (facade.isLoading()) {
            <div class="ps-modal-loading">
              <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
              <span>Loading...</span>
            </div>
          } @else if (filteredEmployees().length === 0) {
            <div class="ps-modal-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              <p>No available employees to assign</p>
            </div>
          } @else {
            <ul class="ps-employee-list">
              @for (emp of filteredEmployees(); track emp.id) {
                <li class="ps-employee-row">
                  <div class="ps-emp-avatar">{{ getInitials(emp.personalDetails?.name) }}</div>
                  <div class="ps-emp-info">
                    <span class="ps-emp-name">{{ emp.personalDetails?.name ?? emp.idNo }}</span>
                    <span class="ps-emp-id">{{ emp.idNo }}</span>
                  </div>
                  <button class="ps-btn-assign-sm" [disabled]="facade.isSaving()"
                    (click)="assign(emp)">
                    @if (facade.isSaving()) { Assigning... } @else { Assign }
                  </button>
                </li>
              }
            </ul>
          }

          @if (facade.error()) {
            <div class="ps-modal-error">{{ facade.error() }}</div>
          }
        </div>

        <!-- Footer -->
        <div class="ps-modal-footer">
          <button class="ps-btn-secondary" (click)="onClose()">Close</button>
        </div>
      </div>
    </div>

    <style>
      .ps-modal-backdrop {
        position: fixed; inset: 0; background: rgba(0,0,0,0.45);
        display: flex; align-items: center; justify-content: center; z-index: 1050;
      }
      .ps-modal { background: #fff; border-radius: 16px; width: 100%; max-width: 480px;
        max-height: 80vh; display: flex; flex-direction: column;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25); overflow: hidden; }
      .ps-modal-header { display: flex; justify-content: space-between; align-items: flex-start;
        padding: 20px 20px 12px; border-bottom: 1px solid #f3f4f6; }
      .ps-modal-title { font-size: 16px; font-weight: 700; color: #111827; margin: 0; }
      .ps-modal-sub { font-size: 12px; color: #6b7280; margin: 2px 0 0; }
      .ps-modal-close { background: none; border: none; cursor: pointer; padding: 4px;
        color: #9ca3af; border-radius: 6px; display: flex; align-items: center; }
      .ps-modal-close:hover { background: #f3f4f6; color: #374151; }
      .ps-modal-search { padding: 12px 20px; border-bottom: 1px solid #f3f4f6;
        display: flex; align-items: center; gap: 8px; }
      .ps-modal-search svg { color: #9ca3af; flex-shrink: 0; }
      .ps-modal-search input { border: none; outline: none; font-size: 13px;
        color: #374151; width: 100%; background: transparent; }
      .ps-modal-body { flex: 1; overflow-y: auto; padding: 8px 0; }
      .ps-modal-loading, .ps-modal-empty { display: flex; flex-direction: column;
        align-items: center; gap: 8px; padding: 32px; color: #9ca3af; font-size: 13px; }
      .ps-modal-error { margin: 8px 20px; padding: 10px 14px; background: #fef2f2;
        color: #dc2626; border-radius: 8px; font-size: 12px; }
      .ps-employee-list { list-style: none; margin: 0; padding: 0; }
      .ps-employee-row { display: flex; align-items: center; gap: 12px;
        padding: 10px 20px; border-bottom: 1px solid #f9fafb; }
      .ps-employee-row:last-child { border-bottom: none; }
      .ps-employee-row:hover { background: #f9fafb; }
      .ps-emp-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
        background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 700; }
      .ps-emp-info { flex: 1; min-width: 0; }
      .ps-emp-name { display: block; font-size: 13px; font-weight: 600; color: #111827;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ps-emp-id { font-size: 11px; color: #9ca3af; }
      .ps-btn-assign-sm { padding: 5px 14px; background: linear-gradient(135deg,#4338ca,#6366f1);
        color: #fff; border: none; border-radius: 8px; font-size: 12px; font-weight: 600;
        cursor: pointer; white-space: nowrap; }
      .ps-btn-assign-sm:disabled { opacity: 0.6; cursor: not-allowed; }
      .ps-modal-footer { padding: 12px 20px; border-top: 1px solid #f3f4f6;
        display: flex; justify-content: flex-end; }
      .ps-btn-secondary { padding: 8px 18px; background: #f3f4f6; color: #374151;
        border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
      .ps-btn-secondary:hover { background: #e5e7eb; }
    </style>
  `,
})
export class AssignStaffModalComponent implements OnInit, OnChanges {
  @Input() customerId!: number;
  @Input() customerName?: string;
  @Input() visible = false;
  @Output() close    = new EventEmitter<void>();
  @Output() assigned = new EventEmitter<void>();

  readonly facade = inject(AssignmentFacade);

  searchTerm = signal('');

  readonly filteredEmployees = computed(() => {
    const q = this.searchTerm().toLowerCase();
    return this.facade.unassignedEmployees().filter((e) =>
      !q ||
      e.personalDetails?.name?.toLowerCase().includes(q) ||
      e.idNo?.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.facade.loadForCustomer(this.customerId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customerId'] && !changes['customerId'].firstChange) {
      this.facade.reset();
      this.facade.loadForCustomer(this.customerId);
      this.searchTerm.set('');
    }
  }

  assign(employee: Employee): void {
    this.facade.assignStaff(this.customerId, employee.id!);
    this.assigned.emit();
  }

  onClose(): void {
    this.facade.reset();
    this.searchTerm.set('');
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('ps-modal-backdrop')) {
      this.onClose();
    }
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
  }
}
