import { http } from '../lib/http';
import type { EmployeeSalaryDetail } from '../types/models';

export interface CreateEmployeeSalaryDetailRequest {
  employeeId: number;
  basic: number;
  hra?: number;
  da?: number;
  others?: number;
  effectiveFrom: string; // YYYY-MM-DD
}

export const employeeSalaryDetailsApi = {
  getAll(customerId?: number) {
    return http
      .get<EmployeeSalaryDetail[]>('/api/employee-salary-details', customerId != null ? { params: { customerId } } : undefined)
      .then((r) => r.data);
  },
  create(payload: CreateEmployeeSalaryDetailRequest) {
    return http.post<EmployeeSalaryDetail>('/api/employee-salary-details', payload).then((r) => r.data);
  },
  update(id: number, payload: CreateEmployeeSalaryDetailRequest) {
    return http.put<EmployeeSalaryDetail>(`/api/employee-salary-details/${id}`, payload).then((r) => r.data);
  },
};
