import { http } from '../lib/http';
import type { Designation } from '../types/models';

export const designationApi = {
  getAll(customerId: number) {
    return http.get<Designation[]>('/api/designations', { params: { customerId } }).then((r) => r.data);
  },
  create(customerId: number, name: string) {
    return http.post<Designation>('/api/designations', { customerId, name }).then((r) => r.data);
  },
  update(id: number, customerId: number, name: string) {
    return http.put<Designation>(`/api/designations/${id}`, { customerId, name }).then((r) => r.data);
  },
};
