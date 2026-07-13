import { http } from '../lib/http';
import type { Employee } from '../types/models';

export const employeeApi = {
  getAll() {
    return http.get<Employee[]>('/api/employees').then((r) => r.data);
  },
  getAllInactive() {
    return http.get<Employee[]>('/api/employees/inactive').then((r) => r.data);
  },
  getById(id: number) {
    return http.get<Employee>(`/api/employees/${id}`).then((r) => r.data);
  },
  create(employee: Employee) {
    return http.post<Employee>('/api/employees', employee).then((r) => r.data);
  },
  update(id: number, employee: Employee) {
    return http.put<Employee>(`/api/employees/${id}`, employee).then((r) => r.data);
  },
  inactivate(id: number) {
    return http.patch<void>(`/api/employees/${id}/status`, null).then((r) => r.data);
  },
  delete(id: number) {
    return http.delete<void>(`/api/employees/${id}`).then((r) => r.data);
  },
  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return http
      .post<string>('/api/files/upload', formData, { responseType: 'text' as const })
      .then((r) => r.data);
  },
};
