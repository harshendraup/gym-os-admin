import { useState } from 'react'
import { Plus, Edit, Trash2, Snowflake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Header } from '@/components/layout/Header'
import { useMembershipPlans, useCreateMembershipPlan, useUpdateMembershipPlan } from '@/hooks/useMemberships'
import { formatCurrency } from '@/lib/utils'
import { useForm } from 'react-hook-form'

function PlanCard({ plan, onEdit }: { plan: any; onEdit: (p: any) => void }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{plan.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{plan.duration_months} month{plan.duration_months > 1 ? 's' : ''}</p>
          </div>
          <Badge variant={plan.is_active ? 'success' : 'secondary'}>
            {plan.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-2xl font-bold">{formatCurrency(plan.price)}</span>
          {plan.offer_price && (
            <span className="ml-2 text-sm text-muted-foreground line-through">{formatCurrency(plan.price)}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="capitalize">{plan.category}</Badge>
          {plan.includes_pt && <Badge variant="info">PT: {plan.pt_sessions_included} sessions</Badge>}
          {plan.freeze_days_allowed > 0 && (
            <Badge variant="outline" className="gap-1">
              <Snowflake className="h-3 w-3" />
              {plan.freeze_days_allowed}d freeze
            </Badge>
          )}
        </div>

        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => onEdit(plan)}>
          <Edit className="h-4 w-4" />
          Edit Plan
        </Button>
      </CardContent>
    </Card>
  )
}

function PlanForm({ plan, onClose }: { plan?: any; onClose: () => void }) {
  const { register, handleSubmit, setValue } = useForm({ defaultValues: plan ?? {} })
  const create = useCreateMembershipPlan()
  const update = useUpdateMembershipPlan()

  const onSubmit = async (data: any) => {
    if (plan) {
      await update.mutateAsync({ planId: plan.id, data })
    } else {
      await create.mutateAsync(data)
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Plan Name *</Label>
          <Input placeholder="Monthly Basic" {...register('name', { required: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Duration (months) *</Label>
          <Input type="number" {...register('durationMonths', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Price (₹) *</Label>
          <Input type="number" {...register('price', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select onValueChange={(v) => setValue('category', v)} defaultValue={plan?.category ?? 'standard'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Freeze Days Allowed</Label>
          <Input type="number" defaultValue={0} {...register('freezeDaysAllowed', { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>PT Sessions Included</Label>
          <Input type="number" defaultValue={0} {...register('ptSessionsIncluded', { valueAsNumber: true })} />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {plan ? 'Update Plan' : 'Create Plan'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function MembershipsPage() {
  const { data, isLoading } = useMembershipPlans()
  const [showForm, setShowForm] = useState(false)
  const [editPlan, setEditPlan] = useState<any>(null)

  const plans = (data as any[]) ?? []

  return (
    <div className="flex flex-col h-full">
      <Header title="Membership Plans" />

      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Plans</h2>
            <p className="text-sm text-muted-foreground">{plans.length} plan{plans.length !== 1 ? 's' : ''} configured</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Plan
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onEdit={(p) => { setEditPlan(p); setShowForm(true) }} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditPlan(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPlan ? 'Edit Plan' : 'New Membership Plan'}</DialogTitle>
          </DialogHeader>
          <PlanForm plan={editPlan} onClose={() => { setShowForm(false); setEditPlan(null) }} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
