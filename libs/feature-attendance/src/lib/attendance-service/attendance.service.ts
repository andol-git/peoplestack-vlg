import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AttendanceLog } from '@ps/shared-ui';
import { APP_CONFIG } from '@ps/shared/data-access';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private http = inject(HttpClient);
  private config = inject(APP_CONFIG);
  private get base(): string { return `${this.config.apiBaseUrl}/api/attendance`; }
  getLogs(empId:string, from:string, to:string): Observable<AttendanceLog[]> {
    return this.http.get<AttendanceLog[]>(`${this.base}/logs?employeeId=${empId}&from=${from}&to=${to}`);
  }
  getAllToday(): Observable<AttendanceLog[]> {
    return this.http.get<AttendanceLog[]>(`${this.base}/today`);
  }
  getSummary(): Observable<{present:number;absent:number;total:number}> {
    return this.http.get<any>(`${this.base}/summary/today`);
  }
}
