import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { designationApi } from '../api/designation-api';

export function useDesignationsQuery(customerId: number | undefined) {
  const query = useQuery({
    queryKey: ['designations', customerId],
    queryFn: () => designationApi.getAll(customerId as number),
    enabled: customerId !== undefined,
  });
  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useCreateDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, name }: { customerId: number; name: string }) =>
      designationApi.create(customerId, name),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['designations', vars.customerId] }),
  });
}

export function useUpdateDesignation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, customerId, name }: { id: number; customerId: number; name: string }) =>
      designationApi.update(id, customerId, name),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['designations', vars.customerId] }),
  });
}
