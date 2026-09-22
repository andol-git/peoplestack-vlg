import { http } from '../lib/http';
import type { DeductionType } from '../types/models';

export const deductionTypeApi = {
  getAll(customerId: number) {
    return http.get<DeductionType[]>('/api/deduction-types', { params: { customerId } }).then((r) => r.data);
  },
  create(customerId: number, name: string) {
    return http.post<DeductionType>('/api/deduction-types', { customerId, name }).then((r) => r.data);
  },
  delete(id: number) {
    return http.delete<void>(`/api/deduction-types/${id}`).then((r) => r.data);
  },
};
