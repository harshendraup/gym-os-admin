import { useMemo, useState } from 'react'
import { Edit, Eye, Layers, Plus, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { useCreateMembershipPlan, useDeleteMembershipPlan, useMembershipPlans, useUpdateMembershipPlan } from '@/hooks/useMemberships'
import { useAuthStore } from '@/store/auth.store'
import { useQuery } from '@tanstack/react-query'
import { businessesApi } from '@/api/businesses.api'
import { useForm } from 'react-hook-form'
import type { MembershipPlan } from '@/api/memberships.api'

type PlanFormValues = {
  name: string
  description: string
  durationDays: number
  price: number
  currency: string
  billingCycle: 'monthly' | 'quarterly' | 'yearly'
  enrollmentFee: number
  trialDays: number
  taxEnabled: boolean
  taxRate: number
  taxInclusive: boolean
  visibility: 'public' | 'private'
}

const formDefaults: PlanFormValues = {
  name: '',
  description: '',
  durationDays: 30,
  price: 0,
  currency: 'INR',
  billingCycle: 'monthly',
  enrollmentFee: 0,
  trialDays: 0,
  taxEnabled: false,
  taxRate: 0,
  taxInclusive: false,
  visibility: 'public',
}

function toFormDefaults(plan?: MembershipPlan): PlanFormValues {
  if (!plan) return formDefaults
  return {
    name: plan.name,
    description: plan.description ?? '',
    durationDays: plan.durationDays,
    price: plan.price,
    currency: plan.currency,
    billingCycle: plan.billingCycle,
    enrollmentFee: plan.enrollmentFee,
    trialDays: plan.trialDays,
    taxEnabled: plan.taxEnabled,
    taxRate: plan.taxRate ?? 0,
    taxInclusive: plan.taxInclusive,
    visibility: plan.visibility,
  }
}

function PlanForm({
  selected,
  resolvedBusinessId,
  onClose,
}: {
  selected?: MembershipPlan
  resolvedBusinessId?: string
  onClose: () => void
}) {
  const createPlan = useCreateMembershipPlan(resolvedBusinessId)
  const updatePlan = useUpdateMembershipPlan(resolvedBusinessId)
  const form = useForm<PlanFormValues>({ defaultValues: toFormDefaults(selected) })
  const taxEnabled = form.watch('taxEnabled')

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      ...values,
      description: values.description.trim() || undefined,
      currency: values.currency.toUpperCase(),
      taxRate: values.taxEnabled ? values.taxRate : 0,
    }

    if (selected) {
      await updatePlan.mutateAsync({ planId: selected.id, data: payload })
    } else {
      await createPlan.mutateAsync({
        ...payload,
        planType: 'standard',
        includesPt: false,
        ptSessionsCount: 0,
        includesDiet: false,
        includesLocker: false,
        includesSupplements: false,
        inclusions: [],
        maxFreezeDays: 0,
        isActive: true,
        sortOrder: 0,
        discountPrice: null,
      } as any)
    }
    onClose()
  })

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Plan Name</Label>
          <Input id="name" {...form.register('name', { required: true })} placeholder="Pro Annual" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" {...form.register('description')} placeholder="Best value yearly plan" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price (in paise)</Label>
          <Input id="price" type="number" {...form.register('price', { valueAsNumber: true, min: 0 })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" maxLength={3} {...form.register('currency', { required: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="durationDays">Duration Days</Label>
          <Input id="durationDays" type="number" {...form.register('durationDays', { valueAsNumber: true, min: 1 })} />
        </div>
        <div className="space-y-2">
          <Label>Billing Cycle</Label>
          <Select
            defaultValue={form.getValues('billingCycle')}
            onValueChange={(v) => form.setValue('billingCycle', v as PlanFormValues['billingCycle'])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="enrollmentFee">Enrollment Fee (in paise)</Label>
          <Input id="enrollmentFee" type="number" {...form.register('enrollmentFee', { valueAsNumber: true, min: 0 })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trialDays">Trial Days</Label>
          <Input id="trialDays" type="number" {...form.register('trialDays', { valueAsNumber: true, min: 0 })} />
        </div>

        <div className="space-y-2">
          <Label>Tax Enabled</Label>
          <Select
            defaultValue={String(form.getValues('taxEnabled'))}
            onValueChange={(v) => form.setValue('taxEnabled', v === 'true')}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input
            id="taxRate"
            type="number"
            disabled={!taxEnabled}
            {...form.register('taxRate', { valueAsNumber: true, min: 0, max: 100 })}
          />
        </div>

        <div className="space-y-2">
          <Label>Tax Inclusive</Label>
          <Select
            defaultValue={String(form.getValues('taxInclusive'))}
            onValueChange={(v) => form.setValue('taxInclusive', v === 'true')}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select
            defaultValue={form.getValues('visibility')}
            onValueChange={(v) => form.setValue('visibility', v as PlanFormValues['visibility'])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="min-w-28" disabled={createPlan.isPending || updatePlan.isPending}>
          {selected ? 'Update Plan' : 'Create Plan'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function MembershipsPage() {
  const contextBusinessId = useAuthStore((s) => (s.gymContext as any)?.businessId ?? (s.gymContext as any)?.business_id ?? '')
  const userBusinessId = useAuthStore((s) => (s.user as any)?.businessId ?? (s.user as any)?.business_id ?? '')
  const fallbackOverview = useQuery({
    queryKey: ['business-admin', 'my-overview'],
    queryFn: () => businessesApi.myOverview(),
    enabled: !(contextBusinessId || userBusinessId),
    staleTime: 60_000,
  })

  const fallbackBusinessId = (fallbackOverview.data as any)?.business?.id ?? ''
  const resolvedBusinessId = (contextBusinessId || userBusinessId || fallbackBusinessId || '').trim()
  const { data, isLoading } = useMembershipPlans(resolvedBusinessId)
  const [isFormOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<MembershipPlan | undefined>(undefined)
  const [planToDelete, setPlanToDelete] = useState<MembershipPlan | undefined>(undefined)
  const [planToView, setPlanToView] = useState<MembershipPlan | undefined>(undefined)

  const plans = useMemo(() => (data ?? []) as MembershipPlan[], [data])

  const deletePlanMutation = useDeleteMembershipPlan(resolvedBusinessId)

  return (
    <div className="flex h-full flex-col">
      <Header title="Membership Plans" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Plan Builder</h2>
            <p className="text-sm text-muted-foreground">Create and manage membership plans.</p>
          </div>
          <Button onClick={() => { setSelected(undefined); setFormOpen(true) }} className="gap-2" disabled={!resolvedBusinessId}>
            <Plus className="h-4 w-4" /> New Plan
          </Button>
        </div>

        {!resolvedBusinessId && (
          <Card className="mb-4 border-amber-300">
            <CardContent className="py-4 text-sm">
              No business context found for this admin. Please login with a mapped business admin account.
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No membership plans yet</p>
              <p className="text-sm text-muted-foreground">Create your first plan to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >
                <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 via-white to-slate-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg text-slate-800">{plan.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">{plan.description || 'No description'}</CardDescription>
                    </div>
                    <Badge
                      variant={plan.visibility === 'public' ? 'success' : 'secondary'}
                      className="capitalize tracking-wide"
                    >
                      {plan.visibility}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <div className="text-xs font-medium uppercase tracking-wider text-blue-700/80">Plan Price</div>
                    <div className="mt-1 text-3xl font-semibold leading-none text-slate-900">{formatCurrency(plan.price)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-sm">
                    <MetaItem label="Cycle" value={capitalize(plan.billingCycle)} />
                    <MetaItem label="Duration" value={`${plan.durationDays} days`} />
                    <MetaItem label="Enrollment" value={formatCurrency(plan.enrollmentFee)} />
                    <MetaItem label="Trial" value={`${plan.trialDays} days`} />
                    <MetaItem label="Tax" value={plan.taxEnabled ? `${plan.taxRate ?? 0}%` : 'Disabled'} />
                    <MetaItem label="Currency" value={plan.currency} />
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-3">
                    <Button variant="outline" size="sm" className="gap-1.5 bg-white" onClick={() => setPlanToView(plan)}>
                      <Eye className="h-4 w-4" /> View
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 bg-white" onClick={() => { setSelected(plan); setFormOpen(true) }}>
                      <Edit className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" className="gap-1.5 shadow-sm" onClick={() => setPlanToDelete(plan)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setSelected(undefined) }}>
        <DialogContent className="max-w-3xl border-slate-200 bg-white/95 shadow-2xl backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-800">{selected ? 'Edit Membership Plan' : 'Create Membership Plan'}</DialogTitle>
            <DialogDescription>Configure pricing, billing, tax and visibility.</DialogDescription>
          </DialogHeader>
          <PlanForm
            selected={selected}
            resolvedBusinessId={resolvedBusinessId}
            onClose={() => { setFormOpen(false); setSelected(undefined) }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!planToDelete} onOpenChange={(v) => { if (!v) setPlanToDelete(undefined) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Delete <span className="font-semibold">{planToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanToDelete(undefined)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!planToDelete) return
                await deletePlanMutation.mutateAsync(planToDelete.id)
                setPlanToDelete(undefined)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!planToView} onOpenChange={(v) => { if (!v) setPlanToView(undefined) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{planToView?.name}</DialogTitle>
            <DialogDescription>{planToView?.description || 'No description'}</DialogDescription>
          </DialogHeader>
          {planToView && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>Price: <span className="font-semibold">{formatCurrency(planToView.price)}</span></div>
              <div>Currency: <span className="font-semibold">{planToView.currency}</span></div>
              <div>Billing: <span className="font-semibold capitalize">{planToView.billingCycle}</span></div>
              <div>Duration: <span className="font-semibold">{planToView.durationDays} days</span></div>
              <div>Enrollment Fee: <span className="font-semibold">{formatCurrency(planToView.enrollmentFee)}</span></div>
              <div>Trial Days: <span className="font-semibold">{planToView.trialDays}</span></div>
              <div>Tax Enabled: <span className="font-semibold">{planToView.taxEnabled ? 'Yes' : 'No'}</span></div>
              <div>Tax Rate: <span className="font-semibold">{planToView.taxRate ?? 0}%</span></div>
              <div>Tax Inclusive: <span className="font-semibold">{planToView.taxInclusive ? 'Yes' : 'No'}</span></div>
              <div>Visibility: <span className="font-semibold capitalize">{planToView.visibility}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setPlanToView(undefined)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 font-semibold text-slate-800">{value}</div>
    </div>
  )
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
