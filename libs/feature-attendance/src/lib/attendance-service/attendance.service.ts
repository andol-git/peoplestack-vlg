import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AttendanceLog } from '@people-stack/shared-ui';
import { environment } from '../../../../../apps/admin-portal/src/environments/environment';
@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/attendance`;
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
