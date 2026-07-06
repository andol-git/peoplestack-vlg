import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceFacade } from '../attendance-facade/attendance.facade';
@Component({
  selector: 'ps-attendance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './attendance-dashboard.component.html',
  styleUrl: './attendance-dashboard.component.scss'
})
export class AttendanceDashboardComponent implements OnInit {
  protected facade = inject(AttendanceFacade);
  today = new Date().toISOString().split('T')[0];
  searchEmpId = '';
  fromDate = this.today;
  toDate   = this.today;
  ngOnInit(): void { this.facade.loadToday(); }
  onSearch(): void { if(this.searchEmpId) this.facade.loadLogs(this.searchEmpId, this.fromDate, this.toDate); }
}
