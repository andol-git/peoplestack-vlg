import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../api/customer-api';
import type { Customer } from '../types/models';

// Temporary demo data — remove once backend /api/customers is fixed (ported from customer.facade.ts)
const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: 'GMR Hyderabad Airport',
    code: 'CUST001',
    site: 'GMR',
    contactNumber: '9876543210',
    isActive: true,
    assignedStaffCount: 0,
  },
  {
    id: 2,
    name: 'BIAL Bangalore Airport',
    code: 'CUST002',
    site: 'BIAL',
    contactNumber: '9123456780',
    isActive: true,
    assignedStaffCount: 0,
  },
];

// Falls back to demo data on failure instead of surfacing an error, matching customer.facade.ts.
export function useCustomersQuery() {
  const query = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerApi.getAll(),
    retry: false,
  });
  return {
    ...query,
    data: query.isError ? DEMO_CUSTOMERS : query.data ?? [],
  };
}

export function useCustomerQuery(id: number | undefined) {
  const query = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.getById(id as number),
    enabled: id !== undefined,
    retry: false,
  });
  if (query.isError) {
    const demo = DEMO_CUSTOMERS.find((c) => c.id === id);
    return { ...query, data: demo };
  }
  return query;
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
