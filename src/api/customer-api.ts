import { http } from '../lib/http';
import type { Customer, StaffAssignment } from '../types/models';

export const customerApi = {
  getAll() {
    return http.get<Customer[]>('/api/customers').then((r) => r.data);
  },
  getById(id: number) {
    return http.get<Customer>(`/api/customers/${id}`).then((r) => r.data);
  },
  create(customer: Customer) {
    return http.post<Customer>('/api/customers', customer).then((r) => r.data);
  },
  update(id: number, customer: Customer) {
    return http.put<Customer>(`/api/customers/${id}`, customer).then((r) => r.data);
  },
  delete(id: number) {
    return http.delete<void>(`/api/customers/${id}`).then((r) => r.data);
  },
  getAssignments(customerId: number) {
    return http.get<StaffAssignment[]>(`/api/customers/${customerId}/assignments`).then((r) => r.data);
  },
  assignStaff(customerId: number, employeeId: number) {
    return http
      .post<StaffAssignment>(`/api/customers/${customerId}/assignments`, { employeeId })
      .then((r) => r.data);
  },
  unassignStaff(customerId: number, employeeId: number) {
    return http.delete<void>(`/api/customers/${customerId}/assignments/${employeeId}`).then((r) => r.data);
  },
};
