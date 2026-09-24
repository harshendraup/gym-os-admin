import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { metaLeadAdsApi } from '@/api/meta-lead-ads.api'

export function useMetaLeadAds() {
  return useQuery({ queryKey: ['meta-lead-ads'], queryFn: metaLeadAdsApi.get })
}

export function useMetaLeadAdsMutation() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['meta-lead-ads'] })
  return {
    connect: useMutation({ mutationFn: metaLeadAdsApi.connect }),
    selectPage: useMutation({ mutationFn: metaLeadAdsApi.selectPage, onSuccess: invalidate }),
    syncForms: useMutation({ mutationFn: metaLeadAdsApi.forms, onSuccess: invalidate }),
    sync: useMutation({ mutationFn: metaLeadAdsApi.sync, onSuccess: invalidate }),
    disconnect: useMutation({ mutationFn: metaLeadAdsApi.disconnect, onSuccess: invalidate }),
  }
}
