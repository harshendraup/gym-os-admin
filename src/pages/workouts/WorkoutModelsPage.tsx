import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import { useAssignWorkoutModel, useCreateWorkoutModel, useDeleteWorkoutModel, useWorkoutAssignments, useWorkoutModels } from '@/hooks/useWorkoutModels'

export default function WorkoutModelsPage() {
  const { data: models = [], isLoading } = useWorkoutModels()
  const { data: assignments = [] } = useWorkoutAssignments()
  const createModel = useCreateWorkoutModel()
  const deleteModel = useDeleteWorkoutModel()
  const assignModel = useAssignWorkoutModel()

  const [open, setOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignModelId, setAssignModelId] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    goal: 'general_fitness',
    difficulty: 'beginner',
    durationWeeks: 8,
    sessionsPerWeek: 4,
    status: 'draft',
  })
  const [assignForm, setAssignForm] = useState({
    memberId: '',
    startDate: '',
    endDate: '',
    coachNote: '',
  })

  return (
    <div className="flex h-full flex-col">
      <Header title="Workout Models" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Business Workout Models</h2>
            <p className="text-sm text-muted-foreground">Create templates and assign to business members.</p>
          </div>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New Model
          </Button>
        </div>

        {isLoading ? <div className="h-44 rounded-xl bg-muted animate-pulse" /> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {models.map((model: any) => (
              <Card key={model.id} className="border-slate-200/80">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <Badge variant={model.status === 'active' ? 'success' : 'secondary'} className="capitalize">{model.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{model.description || 'No description'}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Goal: <b>{String(model.goal).replaceAll('_', ' ')}</b></div>
                    <div>Difficulty: <b>{model.difficulty}</b></div>
                    <div>Duration: <b>{model.duration_weeks} weeks</b></div>
                    <div>Sessions: <b>{model.sessions_per_week}/week</b></div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setAssignModelId(model.id); setAssignOpen(true) }}
                    >
                      Assign
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1" onClick={() => deleteModel.mutate(model.id)}>
                      <Trash2 className="h-4 w-4" /> Archive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(assignments as any[]).slice(0, 8).map((a: any) => (
              <div key={a.id} className="rounded-lg border px-3 py-2 text-sm flex items-center justify-between">
                <span>{a.member_name} - <b>{a.model_name}</b></span>
                <Badge variant="outline" className="capitalize">{a.status}</Badge>
              </div>
            ))}
            {(!(assignments as any[]).length) && <p className="text-sm text-muted-foreground">No assignments yet.</p>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Workout Model</DialogTitle></DialogHeader>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                await createModel.mutateAsync(form)
                setOpen(false)
                setForm({ ...form, name: '', description: '' })
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Workout Model</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Member Id</Label><Input value={assignForm.memberId} onChange={(e) => setAssignForm({ ...assignForm, memberId: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={assignForm.startDate} onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={assignForm.endDate} onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })} /></div>
            </div>
            <div><Label>Coach Note</Label><Input value={assignForm.coachNote} onChange={(e) => setAssignForm({ ...assignForm, coachNote: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                await assignModel.mutateAsync({ modelId: assignModelId, payload: assignForm })
                setAssignOpen(false)
              }}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
