import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, Sparkles } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  getCatalogCategories, getCatalogGroups, getCatalogEquipment, getCatalogExercises,
  getCategoryForGroup, resolveLibraryExercise,
} from '@/data/exerciseLibrary'
import { categoryIcon } from '@/data/exerciseLibraryIcons'
import { useSaveExerciseLibraryConfig } from '@/hooks/useExerciseLibraryConfig'
import type { ExerciseLibraryConfigRecord, GymLibraryCategory, GymLibraryGroup } from '@/api/exercise-library-config.api'
import type { ExerciseCategory, MuscleGroup } from '@/api/exercises.api'
import { EXERCISE_CATEGORIES as CATEGORIES, MUSCLE_GROUPS } from '../constants'

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

interface ConfigureExerciseLibraryDialogProps {
  open: boolean
  onClose: () => void
  existingConfig?: ExerciseLibraryConfigRecord | null
}

export function ConfigureExerciseLibraryDialog({ open, onClose, existingConfig }: ConfigureExerciseLibraryDialogProps) {
  const save = useSaveExerciseLibraryConfig()
  const [categories, setCategories] = useState<GymLibraryCategory[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      setCategories(existingConfig ? structuredClone(existingConfig.config.categories) : [])
      setExpandedCategories(new Set())
      setExpandedGroups(new Set())
    }
  }, [open, existingConfig])

  const findCategory = (catId: string) => categories.find((c) => c.id === catId)
  const findGroup = (catId: string, groupId: string) => findCategory(catId)?.groups.find((g) => g.id === groupId)

  function toggleExpanded(set: Set<string>, setSet: (s: Set<string>) => void, key: string) {
    const next = new Set(set)
    next.has(key) ? next.delete(key) : next.add(key)
    setSet(next)
  }

  // ─── System (master-catalog) toggles ────────────────────────────────────
  function toggleSystemGroup(catId: string, catName: string, groupId: string, groupName: string) {
    setCategories((prev) => {
      const existingGroup = prev.find((c) => c.id === catId)?.groups.find((g) => g.id === groupId)
      if (existingGroup) {
        return prev
          .map((c) => (c.id === catId ? { ...c, groups: c.groups.filter((g) => g.id !== groupId) } : c))
          .filter((c) => c.source !== 'system' || c.groups.length > 0)
      }
      const masterExercises = getCatalogExercises(catId, groupId)
      const masterEquipment = getCatalogEquipment(catId, groupId)
      const newGroup: GymLibraryGroup = {
        id: groupId,
        name: groupName,
        category: getCategoryForGroup(catId, groupId) as ExerciseCategory,
        source: 'system',
        exercises: masterExercises.map((ex) => ({
          name: ex.name,
          targetMuscle: ex.target_muscle,
          muscleGroup: resolveLibraryExercise(catId, groupId, ex.name)?.muscleGroup,
        })),
        equipment: [...masterEquipment],
      }
      const existingCat = prev.find((c) => c.id === catId)
      if (existingCat) {
        return prev.map((c) => (c.id === catId ? { ...c, groups: [...c.groups, newGroup] } : c))
      }
      return [...prev, { id: catId, name: catName, source: 'system', groups: [newGroup] }]
    })
  }

  function toggleSystemExercise(catId: string, groupId: string, name: string, targetMuscle: string) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id !== catId
          ? c
          : {
              ...c,
              groups: c.groups.map((g) => {
                if (g.id !== groupId) return g
                const has = g.exercises.some((e) => e.name === name)
                if (has) return { ...g, exercises: g.exercises.filter((e) => e.name !== name) }
                return {
                  ...g,
                  exercises: [
                    ...g.exercises,
                    { name, targetMuscle, muscleGroup: resolveLibraryExercise(catId, groupId, name)?.muscleGroup },
                  ],
                }
              }),
            }
      )
    )
  }

  function toggleSystemEquipment(catId: string, groupId: string, name: string) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id !== catId
          ? c
          : {
              ...c,
              groups: c.groups.map((g) =>
                g.id !== groupId
                  ? g
                  : { ...g, equipment: g.equipment.includes(name) ? g.equipment.filter((e) => e !== name) : [...g.equipment, name] }
              ),
            }
      )
    )
  }

  // ─── Custom entries ──────────────────────────────────────────────────────
  // A custom group can be added under EITHER a system category (browsed from
  // the master catalog) or a from-scratch custom category — either way the
  // group itself is source:'custom' and gets rendered/managed the same way.
  function addCustomCategory(name: string) {
    if (!name.trim()) return
    setCategories((prev) => [...prev, { id: newId('custom-cat'), name: name.trim(), source: 'custom', groups: [] }])
  }

  function removeCustomCategory(catId: string) {
    setCategories((prev) => prev.filter((c) => c.id !== catId))
  }

  function addGroup(catId: string, catName: string, catSource: 'system' | 'custom', name: string, category: ExerciseCategory) {
    if (!name.trim()) return
    const newGroup: GymLibraryGroup = { id: newId('custom-grp'), name: name.trim(), category, source: 'custom', exercises: [], equipment: [] }
    setCategories((prev) => {
      const exists = prev.find((c) => c.id === catId)
      if (exists) return prev.map((c) => (c.id === catId ? { ...c, groups: [...c.groups, newGroup] } : c))
      return [...prev, { id: catId, name: catName, source: catSource, groups: [newGroup] }]
    })
    setExpandedCategories((prev) => new Set(prev).add(catId))
  }

  // Only ever called on source:'custom' groups (system groups are removed by
  // unchecking them) — safe to always keep the parent category even if it's
  // now empty, since a system category re-derives its presence from
  // toggleSystemGroup and a custom category is user-owned either way.
  function removeGroup(catId: string, groupId: string) {
    setCategories((prev) =>
      prev
        .map((c) => (c.id === catId ? { ...c, groups: c.groups.filter((g) => g.id !== groupId) } : c))
        .filter((c) => c.groups.length > 0 || c.source === 'custom')
    )
  }

  function addExercise(catId: string, groupId: string, name: string, targetMuscle: string, muscleGroup?: MuscleGroup) {
    if (!name.trim() || !targetMuscle.trim()) return
    setCategories((prev) =>
      prev.map((c) =>
        c.id !== catId
          ? c
          : { ...c, groups: c.groups.map((g) => (g.id !== groupId ? g : { ...g, exercises: [...g.exercises, { name: name.trim(), targetMuscle: targetMuscle.trim(), muscleGroup }] })) }
      )
    )
  }

  function removeCustomExercise(catId: string, groupId: string, name: string) {
    setCategories((prev) =>
      prev.map((c) => (c.id !== catId ? c : { ...c, groups: c.groups.map((g) => (g.id !== groupId ? g : { ...g, exercises: g.exercises.filter((e) => e.name !== name) })) }))
    )
  }

  function addEquipment(catId: string, groupId: string, name: string) {
    if (!name.trim()) return
    setCategories((prev) =>
      prev.map((c) => (c.id !== catId ? c : { ...c, groups: c.groups.map((g) => (g.id !== groupId ? g : { ...g, equipment: [...g.equipment, name.trim()] })) }))
    )
  }

  function removeCustomEquipment(catId: string, groupId: string, name: string) {
    setCategories((prev) =>
      prev.map((c) => (c.id !== catId ? c : { ...c, groups: c.groups.map((g) => (g.id !== groupId ? g : { ...g, equipment: g.equipment.filter((e) => e !== name) })) }))
    )
  }

  function handleSave() {
    save.mutate(categories, { onSuccess: onClose })
  }

  const totalGroups = categories.reduce((sum, c) => sum + c.groups.length, 0)
  const customCategories = categories.filter((c) => c.source === 'custom')
// console.log("getCatalogCategories", getCatalogCategories())
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Up Exercise Library</DialogTitle>
        </DialogHeader>
        <p className="-mt-1 text-sm text-muted-foreground">
          Pick which exercise types your gym uses. Add Exercise and Create Training Program will only ever show what you choose here.
        </p>

        <div className="space-y-7">
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-900">Choose from our built-in list</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Check a group to include all of its exercises and equipment — expand it to fine-tune which ones, or add an exercise group of your own underneath.
            </p>
            <div className="space-y-2.5">
              {getCatalogCategories().map((cat) => {
                const catExpanded = expandedCategories.has(cat.id)
                const groups = getCatalogGroups(cat.id)
                const customGroupsHere = findCategory(cat.id)?.groups.filter((g) => g.source === 'custom') ?? []
                const includedCount = findCategory(cat.id)?.groups.length ?? 0
                const Icon = categoryIcon(cat.id)
                console.log("category", { cat, groups, customGroupsHere, includedCount })
                return (
                  <div key={cat.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                      onClick={() => toggleExpanded(expandedCategories, setExpandedCategories, cat.id)}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          includedCount > 0 ? 'bg-primary/15 text-primary' : 'bg-slate-100 text-slate-400'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 text-sm font-semibold text-slate-900">{cat.name}</span>
                      {includedCount > 0 ? (
                        <Badge variant="default">{includedCount} group{includedCount === 1 ? '' : 's'}</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Not added</span>
                      )}
                      {catExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                    </button>

                    {catExpanded && (
                      <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                        {groups.map((group) => {
                          const included = !!findGroup(cat.id, group.id)
                          const groupKey = `${cat.id}/${group.id}`
                          const groupExpanded = expandedGroups.has(groupKey)
                          const masterExercises = getCatalogExercises(cat.id, group.id)
                          const masterEquipment = getCatalogEquipment(cat.id, group.id)
                          return (
                            <div
                              key={group.id}
                              className={cn(
                                'overflow-hidden rounded-lg border transition-colors',
                                included ? 'border-primary/30 bg-primary/5' : 'border-slate-200 bg-white'
                              )}
                            >
                              <div className="flex items-center gap-2.5 px-3 py-2">
                                <label className="flex flex-1 cursor-pointer items-center gap-2.5 text-sm">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 accent-primary"
                                    checked={included}
                                    onChange={() => toggleSystemGroup(cat.id, cat.name, group.id, group.name)}
                                  />
                                  <span className={included ? 'font-medium text-slate-900' : 'text-slate-700'}>{group.name}</span>
                                </label>
                                {included && (
                                  <button
                                    type="button"
                                    className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                                    onClick={() => toggleExpanded(expandedGroups, setExpandedGroups, groupKey)}
                                  >
                                    {groupExpanded ? 'Hide details' : 'Fine-tune'}
                                    <ChevronDown className={cn('h-3 w-3 transition-transform', groupExpanded && 'rotate-180')} />
                                  </button>
                                )}
                              </div>

                              {included && groupExpanded && (
                                <div className="grid grid-cols-2 gap-4 border-t border-primary/15 bg-white px-3 py-3">
                                  <div>
                                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Exercises</p>
                                    <div className="space-y-0.5">
                                      {masterExercises.map((ex) => (
                                        <label key={ex.name} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs hover:bg-slate-50">
                                          <input
                                            type="checkbox"
                                            className="h-3.5 w-3.5 rounded border-slate-300 accent-primary"
                                            checked={findGroup(cat.id, group.id)?.exercises.some((e) => e.name === ex.name) ?? false}
                                            onChange={() => toggleSystemExercise(cat.id, group.id, ex.name, ex.target_muscle)}
                                          />
                                          {ex.name}
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Equipment</p>
                                    <div className="space-y-0.5">
                                      {masterEquipment.map((eq) => (
                                        <label key={eq} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-xs hover:bg-slate-50">
                                          <input
                                            type="checkbox"
                                            className="h-3.5 w-3.5 rounded border-slate-300 accent-primary"
                                            checked={findGroup(cat.id, group.id)?.equipment.includes(eq) ?? false}
                                            onChange={() => toggleSystemEquipment(cat.id, group.id, eq)}
                                          />
                                          {eq}
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {customGroupsHere.map((group) => (
                          <CustomGroupCard
                            key={group.id}
                            group={group}
                            onRemoveGroup={() => removeGroup(cat.id, group.id)}
                            onAddExercise={(name, targetMuscle, muscleGroup) => addExercise(cat.id, group.id, name, targetMuscle, muscleGroup)}
                            onRemoveExercise={(name) => removeCustomExercise(cat.id, group.id, name)}
                            onAddEquipment={(name) => addEquipment(cat.id, group.id, name)}
                            onRemoveEquipment={(name) => removeCustomEquipment(cat.id, group.id, name)}
                          />
                        ))}

                        <AddGroupForm onAdd={(name, category) => addGroup(cat.id, cat.name, 'system', name, category)} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-slate-900">Add your own</h3>
              </div>
              <Badge variant="default">{totalGroups} group{totalGroups === 1 ? '' : 's'} selected</Badge>
            </div>

            <div className="space-y-2.5">
              {customCategories.map((cat) => (
                <div key={cat.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> {cat.name}
                    </span>
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeCustomCategory(cat.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                    {cat.groups.map((group) => (
                      <CustomGroupCard
                        key={group.id}
                        group={group}
                        onRemoveGroup={() => removeGroup(cat.id, group.id)}
                        onAddExercise={(name, targetMuscle, muscleGroup) => addExercise(cat.id, group.id, name, targetMuscle, muscleGroup)}
                        onRemoveExercise={(name) => removeCustomExercise(cat.id, group.id, name)}
                        onAddEquipment={(name) => addEquipment(cat.id, group.id, name)}
                        onRemoveEquipment={(name) => removeCustomEquipment(cat.id, group.id, name)}
                      />
                    ))}
                    <AddGroupForm onAdd={(name, category) => addGroup(cat.id, cat.name, 'custom', name, category)} />
                  </div>
                </div>
              ))}
            </div>

            <AddCategoryForm onAdd={addCustomCategory} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={save.isPending || totalGroups === 0}>
            {save.isPending ? 'Saving...' : 'Save & Finish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CustomGroupCard({
  group,
  onRemoveGroup,
  onAddExercise,
  onRemoveExercise,
  onAddEquipment,
  onRemoveEquipment,
}: {
  group: GymLibraryGroup
  onRemoveGroup: () => void
  onAddExercise: (name: string, targetMuscle: string, muscleGroup?: MuscleGroup) => void
  onRemoveExercise: (name: string) => void
  onAddEquipment: (name: string) => void
  onRemoveEquipment: (name: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-primary/30 bg-primary/5">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-slate-900">
          {group.name} <span className="font-normal text-muted-foreground">· {group.category} · custom</span>
        </span>
        <Button type="button" size="icon" variant="ghost" onClick={onRemoveGroup}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-primary/15 bg-white px-3 py-3">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Exercises</p>
          {group.exercises.map((ex) => (
            <div key={ex.name} className="flex items-center justify-between rounded-md px-1 py-1 text-xs hover:bg-slate-50">
              <span>{ex.name}</span>
              <button type="button" onClick={() => onRemoveExercise(ex.name)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
          <AddExerciseForm onAdd={onAddExercise} />
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Equipment</p>
          {group.equipment.map((eq) => (
            <div key={eq} className="flex items-center justify-between rounded-md px-1 py-1 text-xs hover:bg-slate-50">
              <span>{eq}</span>
              <button type="button" onClick={() => onRemoveEquipment(eq)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
          <AddEquipmentForm onAdd={onAddEquipment} />
        </div>
      </div>
    </div>
  )
}

function AddCategoryForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="mt-3 flex gap-2">
      <Input placeholder="New custom category name" value={name} onChange={(e) => setName(e.target.value)} className="h-8 bg-white text-xs" />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          onAdd(name)
          setName('')
        }}
      >
        <Plus className="mr-1 h-3.5 w-3.5" /> Add Category
      </Button>
    </div>
  )
}

function AddGroupForm({ onAdd }: { onAdd: (name: string, category: ExerciseCategory) => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ExerciseCategory>('Strength')
  return (
    <div className="flex gap-2 pt-1">
      <Input placeholder="New custom group name" value={name} onChange={(e) => setName(e.target.value)} className="h-8 flex-1 bg-white text-xs" />
      <Select value={category} onValueChange={(v) => setCategory(v as ExerciseCategory)}>
        <SelectTrigger className="h-8 w-32 bg-white text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          onAdd(name, category)
          setName('')
        }}
      >
        <Plus className="mr-1 h-3.5 w-3.5" /> Add Group
      </Button>
    </div>
  )
}

function AddExerciseForm({ onAdd }: { onAdd: (name: string, targetMuscle: string, muscleGroup?: MuscleGroup) => void }) {
  const [name, setName] = useState('')
  const [targetMuscle, setTargetMuscle] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | ''>('')
  return (
    <div className="mt-1 space-y-1">
      <Input placeholder="Exercise name" value={name} onChange={(e) => setName(e.target.value)} className="h-7 text-xs" />
      <Input placeholder="Target muscle" value={targetMuscle} onChange={(e) => setTargetMuscle(e.target.value)} className="h-7 text-xs" />
      <div className="flex gap-1.5">
        <Select value={muscleGroup || undefined} onValueChange={(v) => setMuscleGroup(v as MuscleGroup)}>
          <SelectTrigger className="h-7 flex-1 text-xs"><SelectValue placeholder="Muscle group (optional)" /></SelectTrigger>
          <SelectContent>
            {MUSCLE_GROUPS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => {
            onAdd(name, targetMuscle, muscleGroup || undefined)
            setName('')
            setTargetMuscle('')
            setMuscleGroup('')
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

function AddEquipmentForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <div className="mt-1 flex gap-1.5">
      <Input placeholder="Equipment name" value={name} onChange={(e) => setName(e.target.value)} className="h-7 flex-1 text-xs" />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs"
        onClick={() => {
          onAdd(name)
          setName('')
        }}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}
