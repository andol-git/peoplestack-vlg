import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee } from '@ps/shared/models';
import { APP_CONFIG } from '../tokens/app-config.token';

@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  private get base(): string {
    return `${this.config.apiBaseUrl}/api/employees`;
  }

  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.base);
  }

  getAllInactive(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.base}/inactive`);
  }

  getById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.base}/${id}`);
  }

  create(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.base, employee);
  }

  update(id: number, employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.base}/${id}`, employee);
  }

  inactivate(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/status`, null);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadFile(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.config.apiBaseUrl}/api/files/upload`,
      formData,
      { responseType: 'text' }
    );
  }
}
