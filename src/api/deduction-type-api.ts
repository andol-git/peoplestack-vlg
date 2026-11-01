import { http } from '../lib/http';
import type { DeductionType } from '../types/models';

export const deductionTypeApi = {
  getAll() {
    return http.get<DeductionType[]>('/api/deduction-types').then((r) => r.data);
  },
  create(name: string) {
    return http.post<DeductionType>('/api/deduction-types', { name }).then((r) => r.data);
  },
  delete(id: number) {
    return http.delete<void>(`/api/deduction-types/${id}`).then((r) => r.data);
  },
};
