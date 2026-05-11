import { useMemo, useState } from 'react'
import { Dumbbell, Edit, Eye, Plus, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateWorkoutModel, useDeleteWorkoutModel, useUpdateWorkoutModel, useWorkoutModels } from '@/hooks/useWorkoutModels'
import type { WorkoutModel } from '@/api/workoutModels.api'

const defaults = {
  name: '',
  description: '',
  goal: 'general_fitness',
  difficulty: 'beginner',
  durationWeeks: 8,
  sessionsPerWeek: 4,
  status: 'draft',
}

const difficultyVariant = (d: string) => {
  if (d === 'beginner') return 'success' as const
  if (d === 'intermediate') return 'warning' as const
  return 'destructive' as const
}

export default function WorkoutsPage() {
  const { data = [], isLoading } = useWorkoutModels()
  const createModel = useCreateWorkoutModel()
  const updateModel = useUpdateWorkoutModel()
  const deleteModel = useDeleteWorkoutModel()

  const [open, setOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<WorkoutModel | null>(null)
  const [form, setForm] = useState<any>(defaults)

  const plans = useMemo(() => (data ?? []) as WorkoutModel[], [data])

  const openCreate = () => {
    setSelected(null)
    setForm(defaults)
    setOpen(true)
  }

  const openEdit = (m: WorkoutModel) => {
    setSelected(m)
    setForm({
      name: m.name,
      description: m.description ?? '',
      goal: m.goal,
      difficulty: m.difficulty,
      durationWeeks: m.duration_weeks,
      sessionsPerWeek: m.sessions_per_week,
      status: m.status,
    })
    setOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Workout Plans" />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Workout Plans</h2>
            <p className="text-sm text-muted-foreground">{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Create Workout Model
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Dumbbell className="h-10 w-10 mb-3" />
            <p className="text-base font-medium">No workout plans yet</p>
            <p className="text-sm mt-1">Create your first workout model for business members.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="border-slate-200/80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <Badge variant={difficultyVariant(plan.difficulty)} className="capitalize">{plan.difficulty}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{plan.description ?? 'No description'}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{plan.goal.replace(/_/g, ' ')}</span>
                    <span>{plan.duration_weeks} weeks</span>
                    <span>{plan.sessions_per_week}/week</span>
                    <span className="capitalize">{plan.status}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { setSelected(plan); setViewOpen(true) }}>
                      <Eye className="h-4 w-4" /> View
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(plan)}>
                      <Edit className="h-4 w-4" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => { setSelected(plan); setDeleteOpen(true) }}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? 'Edit Workout Model' : 'Create Workout Model'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Goal</Label>
                <Select value={form.goal} onValueChange={(v) => setForm({ ...form, goal: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_fitness">General Fitness</SelectItem>
                    <SelectItem value="fat_loss">Fat Loss</SelectItem>
                    <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                    <SelectItem value="rehab">Rehab</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duration Weeks</Label><Input type="number" value={form.durationWeeks} onChange={(e) => setForm({ ...form, durationWeeks: Number(e.target.value) })} /></div>
              <div><Label>Sessions/Week</Label><Input type="number" value={form.sessionsPerWeek} onChange={(e) => setForm({ ...form, sessionsPerWeek: Number(e.target.value) })} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (selected) await updateModel.mutateAsync({ id: selected.id, payload: form })
                else await createModel.mutateAsync(form)
                setOpen(false)
                setSelected(null)
                setForm(defaults)
              }}
            >
              {selected ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Goal: <b>{selected.goal.replace(/_/g, ' ')}</b></div>
              <div>Difficulty: <b>{selected.difficulty}</b></div>
              <div>Duration: <b>{selected.duration_weeks} weeks</b></div>
              <div>Sessions: <b>{selected.sessions_per_week}/week</b></div>
              <div>Status: <b className="capitalize">{selected.status}</b></div>
              <div>Version: <b>v{selected.version}</b></div>
              <div className="col-span-2">Description: <b>{selected.description || 'No description'}</b></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Workout Model</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Delete <b>{selected?.name}</b> ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (selected) await deleteModel.mutateAsync(selected.id)
                setDeleteOpen(false)
                setSelected(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
