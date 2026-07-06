import { Injectable, inject } from '@angular/core';
import { AttendanceService } from '../attendance-service/attendance.service';
import { AttendanceStore } from '../attendance-store/attendance.store';
@Injectable({ providedIn: 'root' })
export class AttendanceFacade {
  private svc   = inject(AttendanceService);
  private store = inject(AttendanceStore);
  readonly logs    = this.store.logs;
  readonly today   = this.store.today;
  readonly loading = this.store.loading;
  readonly present = this.store.present;
  readonly absent  = this.store.absent;
  readonly total   = this.store.total;
  loadToday(): void { this.svc.getAllToday().subscribe({next:l=>this.store.setToday(l)}); this.svc.getSummary().subscribe({next:s=>this.store.setSummary(s)}); }
  loadLogs(empId:string,from:string,to:string): void { this.store.setLoading(true); this.svc.getLogs(empId,from,to).subscribe({next:l=>this.store.setLogs(l),error:()=>this.store.setLoading(false)}); }
}
