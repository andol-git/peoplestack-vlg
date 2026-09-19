import { http } from '../lib/http';
import type { Employee } from '../types/models';

function listParams(customerId?: number, search?: string) {
  const params: Record<string, unknown> = {};
  if (customerId != null) params.customerId = customerId;
  if (search) params.search = search;
  return Object.keys(params).length ? { params } : undefined;
}

export const employeeApi = {
  getAll(customerId?: number, search?: string) {
    return http.get<Employee[]>('/api/employees', listParams(customerId, search)).then((r) => r.data);
  },
  getAllInactive(customerId?: number, search?: string) {
    return http.get<Employee[]>('/api/employees/inactive', listParams(customerId, search)).then((r) => r.data);
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
