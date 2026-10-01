import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  appConfigApi,
  type SectionMap,
} from '@/api/app-config.api'
import { type ConfigSection, type MediaKind } from '../components/constants'
import { getApiErrorMessage } from '@/lib/api-error'

/**
 * Discriminated pair of section name and its matching payload — a generic
 * `<K extends ConfigSection>` mutationFn would leave react-query unable to
 * infer the variables type, so the union is spelled out here instead.
 */
export type SaveSectionVars = {
  [K in ConfigSection]: { section: K; value: SectionMap[K] }
}[ConfigSection]

export const appConfigKeys = {
  detail: (businessId: number) => ['app-config', businessId] as const,
  versions: (businessId: number) => ['app-config', businessId, 'versions'] as const,
  preview: (businessId: number, platform: string) =>
    ['app-config', businessId, 'preview', platform] as const,
}

export function useAppConfig(businessId?: number) {
  return useQuery({
    queryKey: appConfigKeys.detail(businessId ?? 0),
    queryFn: () => appConfigApi.get(businessId!),
    enabled: Boolean(businessId),
    staleTime: 15_000,
  })
}

/**
 * Saves one tab. The whole record comes back, so the response seeds the cache
 * directly rather than triggering a refetch — the panel's forms re-derive
 * from it and would flicker through a loading state otherwise.
 */
export function useSaveAppConfigSection(businessId?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    // The cast re-pairs section and value: TS can't carry the discriminated
    // union through into the generic call signature on its own.
    mutationFn: (vars: SaveSectionVars) =>
      appConfigApi.saveSection(businessId!, vars.section, vars.value as never),
    // Async so react-query awaits the cancel: uploading media invalidates
    // this same query, and that refetch is still in flight when the section
    // save returns. Left running, it resolves *after* the write below and
    // puts the pre-save record back — which is why a freshly uploaded image
    // vanished and only reappeared on the next refetch.
    onSuccess: async (record, vars) => {
      await queryClient.cancelQueries({ queryKey: appConfigKeys.detail(businessId!) })
      queryClient.setQueryData(appConfigKeys.detail(businessId!), record)
      queryClient.invalidateQueries({ queryKey: appConfigKeys.versions(businessId!) })
      queryClient.invalidateQueries({ queryKey: ['app-config', businessId, 'preview'] })
      toast.success(`Saved — revision ${record.revision}`, {
        description: `${vars.section.replace(/_/g, ' ')} is live for this business.`,
      })
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to save configuration'))
    },
  })
}

export function useResetAppConfigSection(businessId?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (section: ConfigSection) => appConfigApi.resetSection(businessId!, section),
    onSuccess: async (record, section) => {
      await queryClient.cancelQueries({ queryKey: appConfigKeys.detail(businessId!) })
      queryClient.setQueryData(appConfigKeys.detail(businessId!), record)
      queryClient.invalidateQueries({ queryKey: appConfigKeys.versions(businessId!) })
      queryClient.invalidateQueries({ queryKey: ['app-config', businessId, 'preview'] })
      toast.success(`${section.replace(/_/g, ' ')} reset to defaults`)
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to reset section'))
    },
  })
}

export function useAppConfigVersions(businessId?: number) {
  return useQuery({
    queryKey: appConfigKeys.versions(businessId ?? 0),
    queryFn: () => appConfigApi.versions(businessId!),
    enabled: Boolean(businessId),
  })
}

export function useRestoreAppConfigVersion(businessId?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { revision: number; note?: string }) =>
      appConfigApi.restore(businessId!, vars.revision, vars.note),
    onSuccess: async (record, vars) => {
      await queryClient.cancelQueries({ queryKey: appConfigKeys.detail(businessId!) })
      queryClient.setQueryData(appConfigKeys.detail(businessId!), record)
      queryClient.invalidateQueries({ queryKey: appConfigKeys.versions(businessId!) })
      queryClient.invalidateQueries({ queryKey: ['app-config', businessId, 'preview'] })
      toast.success(`Restored revision ${vars.revision} as revision ${record.revision}`)
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to restore revision'))
    },
  })
}

/** The exact `/meta` payload the app would receive — not an approximation. */
export function useAppConfigPreview(businessId?: number, platform: 'android' | 'ios' = 'android') {
  return useQuery({
    queryKey: appConfigKeys.preview(businessId ?? 0, platform),
    queryFn: () => appConfigApi.preview(businessId!, platform),
    enabled: Boolean(businessId),
  })
}

export function useUploadAppConfigMedia(businessId?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { file: File; kind: MediaKind; slot?: string; title?: string }) =>
      appConfigApi.media.upload(businessId!, vars.file, vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appConfigKeys.detail(businessId!) })
      queryClient.invalidateQueries({ queryKey: ['app-config', businessId, 'preview'] })
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Upload failed'))
    },
  })
}

export function useUpdateAppConfigMedia(businessId?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: {
      mediaId: number
      data: { title?: string | null; is_active?: boolean; sort_order?: number }
    }) => appConfigApi.media.update(businessId!, vars.mediaId, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appConfigKeys.detail(businessId!) })
      queryClient.invalidateQueries({ queryKey: ['app-config', businessId, 'preview'] })
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to update media'))
    },
  })
}

export function useReorderAppConfigMedia(businessId?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { kind: MediaKind; ids: number[] }) =>
      appConfigApi.media.reorder(businessId!, vars.kind, vars.ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appConfigKeys.detail(businessId!) })
      queryClient.invalidateQueries({ queryKey: ['app-config', businessId, 'preview'] })
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to reorder media'))
    },
  })
}

export function useDeleteAppConfigMedia(businessId?: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mediaId: number) => appConfigApi.media.remove(businessId!, mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appConfigKeys.detail(businessId!) })
      queryClient.invalidateQueries({ queryKey: ['app-config', businessId, 'preview'] })
      toast.success('Asset deleted')
    },
    onError: (error: any) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete asset'))
    },
  })
}
