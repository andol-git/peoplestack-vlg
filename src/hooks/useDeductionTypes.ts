import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deductionTypeApi } from '../api/deduction-type-api';

export function useDeductionTypesQuery() {
  const query = useQuery({
    queryKey: ['deduction-types'],
    queryFn: () => deductionTypeApi.getAll(),
  });
  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useCreateDeductionType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deductionTypeApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deduction-types'] }),
  });
}

export function useDeleteDeductionType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deductionTypeApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deduction-types'] }),
  });
}
