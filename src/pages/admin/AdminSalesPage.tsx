import { useMemo, useState } from 'react'
import { MessageCircle, Plus, Search, Target, UserPlus, Users, CalendarClock, Trash2, Pencil, LayoutGrid, List, Clock3, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBranches } from '@/hooks/useBranches'
import { useRoles } from '@/hooks/useRoles'
import { useUsersByRole } from '@/hooks/useUsers'
import { useAuthStore } from '@/store/auth.store'
import { useCreateSalesLead, useDeleteSalesLead, useSalesLeads, useUpdateAnySalesLead, useUpdateSalesLead } from '@/hooks/useSalesLeads'
import type { SalesLeadRecord, SalesLeadSource, SalesLeadStatus } from '@/api/sales-leads.api'
import { getRandomPageBackground } from '@/data/pageBackgrounds'

const STATUSES: SalesLeadStatus[] = ['New', 'Contacted', 'Qualified', 'Visit Booked', 'Won', 'Lost']
const SOURCES: SalesLeadSource[] = ['Instagram', 'WhatsApp', 'Website', 'Referral', 'Walk-in', 'Other']
const STATUS_STYLE: Record<SalesLeadStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  New: 'secondary', Contacted: 'default', Qualified: 'warning', 'Visit Booked': 'warning', Won: 'success', Lost: 'destructive',
}

type FormState = {
  name: string
  phone: string
  email: string
  branchId: string
  assignedTo: string
  source: SalesLeadSource
  status: SalesLeadStatus
  interest: string
  goal: string
  nextFollowUpAt: string
  notes: string
}

const emptyForm: FormState = {
  name: '', phone: '', email: '', branchId: '', assignedTo: '', source: 'Other', status: 'New',
  interest: '', goal: '', nextFollowUpAt: '', notes: '',
}

export default function AdminSalesPage() {
  const gymContext = useAuthStore((s) => s.gymContext)
  const [backgroundImage] = useState(getRandomPageBackground)
  const { subAdminRole, trainerRole } = useRoles()
  const { data: leads = [], isLoading, isError, refetch } = useSalesLeads()
  const { data: branches = [] } = useBranches(gymContext?.businessId)
  const { data: subAdmins = [] } = useUsersByRole(subAdminRole?.id)
  const { data: trainers = [] } = useUsersByRole(trainerRole?.id)
  const createLead = useCreateSalesLead()
  const deleteLead = useDeleteSalesLead()
  const [editing, setEditing] = useState<SalesLeadRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | SalesLeadStatus>('All')
  const [branchFilter, setBranchFilter] = useState('All')
  const [view, setView] = useState<'pipeline' | 'follow-ups' | 'table'>('pipeline')
  const updateLead = useUpdateSalesLead(editing?.id ?? 0)
  const updateAnyLead = useUpdateAnySalesLead()

  const staff = [...subAdmins, ...trainers].filter((user, index, list) => list.findIndex((item) => item.id === user.id) === index)
  const branchName = (id: number | null) => branches.find((branch) => branch.id === id)?.branchName ?? 'Unassigned'
  const staffName = (id: number | null) => staff.find((user) => Number(user.id) === id)?.fullName ?? 'Unassigned'

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [lead.name, lead.phone, lead.email, lead.interest].some((value) => value?.toLowerCase().includes(query))
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter
    const matchesBranch = branchFilter === 'All' || String(lead.branchId) === branchFilter
    return matchesSearch && matchesStatus && matchesBranch
  }), [leads, search, statusFilter, branchFilter])

  const counts = STATUSES.reduce<Record<string, number>>((result, status) => {
    result[status] = leads.filter((lead) => lead.status === status).length
    return result
  }, {})

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (lead: SalesLeadRecord) => {
    setEditing(lead)
    setForm({
      name: lead.name, phone: lead.phone, email: lead.email ?? '', branchId: lead.branchId ? String(lead.branchId) : '',
      assignedTo: lead.assignedTo ? String(lead.assignedTo) : '', source: lead.source, status: lead.status,
      interest: lead.interest ?? '', goal: lead.goal ?? '', nextFollowUpAt: lead.nextFollowUpAt ? lead.nextFollowUpAt.slice(0, 16) : '', notes: lead.notes ?? '',
    })
    setFormOpen(true)
  }

  const update = (key: keyof FormState, value: string) => setForm((previous) => ({ ...previous, [key]: value }))
  const submit = () => {
    if (!form.name.trim() || !form.phone.trim()) return
    const payload = {
      name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined,
      branchId: form.branchId ? Number(form.branchId) : undefined, assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
      source: form.source, status: form.status, interest: form.interest.trim() || undefined, goal: form.goal.trim() || undefined,
      nextFollowUpAt: form.nextFollowUpAt.trim() ? new Date(form.nextFollowUpAt).toISOString() : undefined, notes: form.notes.trim() || undefined,
    }
    const options = { onSuccess: () => { setFormOpen(false); setEditing(null) } }
    if (editing) updateLead.mutate(payload, options)
    else createLead.mutate(payload, options)
  }

  const today = new Date()
  const followUpsDue = leads.filter((lead) => lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) <= today && !['Won', 'Lost'].includes(lead.status)).length
  const followUps = filteredLeads
    .filter((lead) => lead.nextFollowUpAt && !['Won', 'Lost'].includes(lead.status))
    .sort((a, b) => new Date(a.nextFollowUpAt!).getTime() - new Date(b.nextFollowUpAt!).getTime())

  const advanceLead = (lead: SalesLeadRecord) => {
    const nextStatus: Partial<Record<SalesLeadStatus, SalesLeadStatus>> = {
      New: 'Contacted', Contacted: 'Qualified', Qualified: 'Visit Booked', 'Visit Booked': 'Won',
    }
    const next = nextStatus[lead.status]
    if (next) updateAnyLead.mutate({ id: lead.id, data: { status: next } })
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(248,250,252,0.78), rgba(248,250,252,0.86)), url('${backgroundImage}')` }} aria-hidden="true" />
      <div className="relative z-10 flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h1 className="text-2xl font-bold text-slate-900">Sales</h1><p className="mt-1 text-sm text-slate-600">Manage leads across every branch and keep follow-ups moving.</p></div>
            <Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> Add Lead</Button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric icon={Users} label="All leads" value={leads.length} />
            <Metric icon={Target} label="Qualified" value={counts.Qualified ?? 0} />
            <Metric icon={CalendarClock} label="Follow-ups due" value={followUpsDue} accent={followUpsDue > 0} />
            <Metric icon={UserPlus} label="Won" value={counts.Won ?? 0} />
          </div>

          <Card><CardContent className="p-4"><div className="flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="pl-9" placeholder="Search name, phone or interest..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'All' | SalesLeadStatus)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All statuses</SelectItem>{STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All branches</SelectItem>{branches.map((branch) => <SelectItem key={branch.id} value={String(branch.id)}>{branch.branchName}</SelectItem>)}</SelectContent></Select>
          </div></CardContent></Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/80 p-1 shadow-sm">
              <ViewButton active={view === 'pipeline'} icon={LayoutGrid} label="Pipeline" onClick={() => setView('pipeline')} />
              <ViewButton active={view === 'follow-ups'} icon={Clock3} label="Follow-ups" onClick={() => setView('follow-ups')} />
              <ViewButton active={view === 'table'} icon={List} label="Table" onClick={() => setView('table')} />
            </div>
            <p className="text-xs text-slate-500">{filteredLeads.length} lead{filteredLeads.length === 1 ? '' : 's'} in this view</p>
          </div>

          {view === 'pipeline' && !isLoading && !isError && (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {STATUSES.map((status) => {
                const statusLeads = filteredLeads.filter((lead) => lead.status === status)
                return <div key={status} className="rounded-xl border border-slate-200/80 bg-white/75 p-3">
                  <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold text-slate-700">{status}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{statusLeads.length}</span></div>
                  <div className="space-y-2">{statusLeads.length === 0 ? <p className="py-5 text-center text-xs text-slate-400">No leads</p> : statusLeads.map((lead) => <LeadMiniCard key={lead.id} lead={lead} branchName={branchName} onEdit={openEdit} onAdvance={advanceLead} />)}</div>
                </div>
              })}
            </div>
          )}

          {view === 'follow-ups' && !isLoading && !isError && (
            <Card><CardContent className="p-4"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-900">Follow-up queue</h2><p className="mt-0.5 text-xs text-slate-500">Prioritized by the next scheduled action.</p></div><Badge variant={followUpsDue > 0 ? 'warning' : 'success'}>{followUpsDue} due</Badge></div><div className="divide-y divide-slate-100">{followUps.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No active follow-ups scheduled.</p> : followUps.map((lead) => <div key={lead.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-slate-900">{lead.name}</p><p className={`text-xs ${new Date(lead.nextFollowUpAt!) <= today ? 'font-semibold text-amber-600' : 'text-slate-500'}`}>{new Date(lead.nextFollowUpAt!).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {branchName(lead.branchId)}</p></div><div className="flex items-center gap-2"><Badge variant={STATUS_STYLE[lead.status]}>{lead.status}</Badge><a className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50" href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="Open WhatsApp"><MessageCircle className="h-4 w-4" /></a><Button size="sm" variant="outline" onClick={() => openEdit(lead)}>Update</Button></div></div>)}</div></CardContent></Card>
          )}

          {view === 'table' && <Card className="overflow-hidden">
            <CardContent className="p-0">
              {isError ? <div className="p-12 text-center text-sm text-red-600"><p>Could not load sales leads.</p><Button className="mt-3" variant="outline" onClick={() => refetch()}>Retry</Button></div> : isLoading ? <div className="p-12 text-center text-sm text-slate-500">Loading sales pipeline...</div> : filteredLeads.length === 0 ? <div className="p-12 text-center"><Target className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-medium text-slate-700">No leads match this view</p><p className="mt-1 text-xs text-slate-500">Add your first enquiry or adjust the filters.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{['Lead', 'Source', 'Branch', 'Status', 'Next follow-up', 'Owner', ''].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredLeads.map((lead) => <tr key={lead.id} className="hover:bg-slate-50/70"><td className="px-4 py-3"><p className="font-medium text-slate-900">{lead.name}</p><p className="text-xs text-slate-500">{lead.phone}{lead.interest ? ` · ${lead.interest}` : ''}</p></td><td className="px-4 py-3 text-sm text-slate-600">{lead.source}</td><td className="px-4 py-3 text-sm text-slate-600">{branchName(lead.branchId)}</td><td className="px-4 py-3"><Badge variant={STATUS_STYLE[lead.status]}>{lead.status}</Badge></td><td className="px-4 py-3 text-sm text-slate-600">{lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Not scheduled'}</td><td className="px-4 py-3 text-sm text-slate-600">{staffName(lead.assignedTo)}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><a className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50" href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="Open WhatsApp"><MessageCircle className="h-4 w-4" /></a><Button size="sm" variant="ghost" onClick={() => openEdit(lead)} title="Edit lead"><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteLead.mutate(lead.id)} title="Delete lead"><Trash2 className="h-4 w-4" /></Button></div></td></tr>)}</tbody></table></div>}
            </CardContent>
          </Card>}
        </div>
      </div>

      <Dialog open={formOpen} onOpenChange={(open) => !open && setFormOpen(false)}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{editing ? 'Edit Lead' : 'Add Sales Lead'}</DialogTitle></DialogHeader><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Name"><Input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Alex Johnson" /></Field><Field label="Phone"><Input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="+91 98765 43210" /></Field><Field label="Email"><Input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="alex@example.com" /></Field><Field label="Interest"><Input value={form.interest} onChange={(event) => update('interest', event.target.value)} placeholder="Annual membership" /></Field><Field label="Branch"><Select value={form.branchId || 'none'} onValueChange={(value) => update('branchId', value === 'none' ? '' : value)}><SelectTrigger><SelectValue placeholder="Any branch" /></SelectTrigger><SelectContent><SelectItem value="none">Any branch</SelectItem>{branches.map((branch) => <SelectItem key={branch.id} value={String(branch.id)}>{branch.branchName}</SelectItem>)}</SelectContent></Select></Field><Field label="Assigned to"><Select value={form.assignedTo || 'none'} onValueChange={(value) => update('assignedTo', value === 'none' ? '' : value)}><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{staff.map((user) => <SelectItem key={user.id} value={user.id}>{user.fullName ?? user.firstName}</SelectItem>)}</SelectContent></Select></Field><Field label="Source"><Select value={form.source} onValueChange={(value) => update('source', value as SalesLeadSource)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map((source) => <SelectItem key={source} value={source}>{source}</SelectItem>)}</SelectContent></Select></Field><Field label="Status"><Select value={form.status} onValueChange={(value) => update('status', value as SalesLeadStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field><Field label="Goal"><Input value={form.goal} onChange={(event) => update('goal', event.target.value)} placeholder="Fat loss, strength, general fitness" /></Field><Field label="Next follow-up"><Input type="datetime-local" value={form.nextFollowUpAt} onChange={(event) => update('nextFollowUpAt', event.target.value)} /></Field><div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Conversation notes, objections, and next step..." /></div></div><DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={submit} disabled={!form.name.trim() || !form.phone.trim() || createLead.isPending || updateLead.isPending}>{createLead.isPending || updateLead.isPending ? 'Saving...' : editing ? 'Save Changes' : 'Add Lead'}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}

function Metric({ icon: Icon, label, value, accent = false }: { icon: typeof Users; label: string; value: number; accent?: boolean }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? 'bg-amber-100 text-amber-600' : 'bg-primary/10 text-primary'}`}><Icon className="h-5 w-5" /></div><div><p className="text-xs text-slate-500">{label}</p><p className="text-xl font-bold text-slate-900">{value}</p></div></CardContent></Card>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>
}

function ViewButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: typeof List; label: string; onClick: () => void }) {
  return <Button type="button" size="sm" variant={active ? 'default' : 'ghost'} className="gap-1.5" onClick={onClick}><Icon className="h-3.5 w-3.5" />{label}</Button>
}

function LeadMiniCard({ lead, branchName, onEdit, onAdvance }: { lead: SalesLeadRecord; branchName: (id: number | null) => string; onEdit: (lead: SalesLeadRecord) => void; onAdvance: (lead: SalesLeadRecord) => void }) {
  const canAdvance = !['Won', 'Lost'].includes(lead.status)
  return <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{lead.name}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">{branchName(lead.branchId)} · {lead.source}</p></div><Badge variant={STATUS_STYLE[lead.status]} className="shrink-0 text-[10px]">{lead.status}</Badge></div><p className="mt-2 truncate text-xs text-slate-500">{lead.interest || lead.phone}</p><div className="mt-3 flex items-center justify-between gap-1 border-t border-slate-100 pt-2"><Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onEdit(lead)}><Pencil className="mr-1 h-3 w-3" /> Edit</Button>{canAdvance && <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onAdvance(lead)}>Next <ArrowRight className="ml-1 h-3 w-3" /></Button>}</div></div>
}
