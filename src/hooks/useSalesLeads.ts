import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { salesLeadsApi, type SalesLeadPayload } from '@/api/sales-leads.api'
import { getApiErrorMessage } from '@/lib/api-error'
import { toast } from 'sonner'

export const salesLeadKeys = {
  all: () => ['sales-leads'] as const,
}

export function useSalesLeads() {
  return useQuery({
    queryKey: salesLeadKeys.all(),
    queryFn: () => salesLeadsApi.list(),
    staleTime: 30_000,
  })
}

export function useCreateSalesLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SalesLeadPayload) => salesLeadsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesLeadKeys.all() })
      toast.success('Lead added')
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to add lead')),
  })
}

export function useUpdateSalesLead(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<SalesLeadPayload>) => salesLeadsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesLeadKeys.all() })
      toast.success('Lead updated')
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to update lead')),
  })
}

export function useUpdateAnySalesLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SalesLeadPayload> }) => salesLeadsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesLeadKeys.all() })
      toast.success('Lead updated')
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to update lead')),
  })
}

export function useDeleteSalesLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => salesLeadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesLeadKeys.all() })
      toast.success('Lead removed')
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error, 'Failed to remove lead')),
  })
}
