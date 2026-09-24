import { get, post } from './client'

export type MetaConnection = {
  id?: number
  status: string
  connectedAt?: string
  lastSyncAt?: string
  lastError?: string | null
  pages: Array<{ id: number; metaPageId: string; pageName: string; isActive?: boolean }>
  forms: Array<{ id: number; metaFormId: string; name: string; status?: string | null }>
}

export const metaLeadAdsApi = {
  get: () => get<MetaConnection>('/integrations/meta'),
  connect: () => get<{ url: string }>('/integrations/meta/connect'),
  selectPage: (metaPageId: string) => post('/integrations/meta/pages/select', { metaPageId }),
  forms: () => post('/integrations/meta/forms'),
  sync: (formId?: string) => post<{ imported: number }>('/integrations/meta/sync', formId ? { formId } : {}),
  disconnect: () => post('/integrations/meta/disconnect'),
}
