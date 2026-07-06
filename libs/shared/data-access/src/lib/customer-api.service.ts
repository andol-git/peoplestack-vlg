import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer, StaffAssignment } from '@ps/shared/models';
import { APP_CONFIG } from '../tokens/app-config.token';

@Injectable({ providedIn: 'root' })
export class CustomerApiService {
  private readonly http   = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  private get base(): string {
    return `${this.config.apiBaseUrl}/api/customers`;
  }

  getAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.base);
  }

  getById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.base}/${id}`);
  }

  create(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.base, customer);
  }

  update(id: number, customer: Customer): Observable<Customer> {
    return this.http.put<Customer>(`${this.base}/${id}`, customer);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getAssignments(customerId: number): Observable<StaffAssignment[]> {
    return this.http.get<StaffAssignment[]>(`${this.base}/${customerId}/assignments`);
  }

  assignStaff(customerId: number, employeeId: number): Observable<StaffAssignment> {
    return this.http.post<StaffAssignment>(`${this.base}/${customerId}/assignments`, { employeeId });
  }

  unassignStaff(customerId: number, employeeId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${customerId}/assignments/${employeeId}`);
  }
}
