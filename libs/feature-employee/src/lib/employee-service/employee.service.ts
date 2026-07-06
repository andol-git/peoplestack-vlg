import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '@people-stack/shared-ui';
import { environment } from '../../../../../apps/admin-portal/src/environments/environment';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/employees`;
  getAll():            Observable<Employee[]> { return this.http.get<Employee[]>(this.base); }
  getAllInactive():    Observable<Employee[]> { return this.http.get<Employee[]>(`${this.base}/inactive`); }
  getById(id:number): Observable<Employee>   { return this.http.get<Employee>(`${this.base}/${id}`); }
  create(e:Employee): Observable<Employee>   { return this.http.post<Employee>(this.base, e); }
  update(id:number, e:Employee): Observable<Employee> { return this.http.put<Employee>(`${this.base}/${id}`, e); }
  inactivate(id:number): Observable<void>    { return this.http.patch<void>(`${this.base}/${id}/status`, null); }
  delete(id:number):  Observable<void>       { return this.http.delete<void>(`${this.base}/${id}`); }
}
