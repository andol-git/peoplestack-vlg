import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../api/customer-api';
import type { Customer } from '../types/models';

export function useCustomersQuery() {
  const query = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerApi.getAll(),
  });
  return {
    ...query,
    data: query.data ?? [],
  };
}

export function useCustomerQuery(id: number | undefined) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getById(id as number),
    enabled: id !== undefined,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (customer: Customer) => customerApi.create(customer),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, customer }: { id: number; customer: Customer }) => customerApi.update(id, customer),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['customer', vars.id] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => customerApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useAssignmentsQuery(customerId: number | undefined) {
  return useQuery({
    queryKey: ['assignments', customerId],
    queryFn: () => customerApi.getAssignments(customerId as number),
    enabled: customerId !== undefined,
  });
}

export function useAssignStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, employeeId }: { customerId: number; employeeId: number }) =>
      customerApi.assignStaff(customerId, employeeId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['assignments', vars.customerId] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUnassignStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, employeeId }: { customerId: number; employeeId: number }) =>
      customerApi.unassignStaff(customerId, employeeId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['assignments', vars.customerId] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
