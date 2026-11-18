import { useEffect, useId, useRef, useState } from 'react'
import type { InheritanceConstraint, Mcd } from '../model/mcd'
import type { McdLayout, Position } from '../model/layout'
import { dialogClass } from './ui/dialogClass'
import { Button } from './ui/Button'
import { t } from '../i18n/runtime'
import { useLanguage } from '../lib/useLanguage'

interface InheritanceDialogProps {
  open: boolean
  mcd: Mcd
  layout: McdLayout
  onConfirm: (data: {
    parentId: string
    childIds: string[]
    constraint: InheritanceConstraint
    position: Position
  }) => void
  onCancel: () => void
}

const CONSTRAINTS: { value: InheritanceConstraint; label: string; desc: string }[] = [
  { value: 'none', label: 'Aucune', desc: 'Héritage simple sans contrainte' },
  { value: 'X', label: 'X (Exclusion / Disjonction)', desc: 'Au plus un sous-type à la fois' },
  { value: 'T', label: 'T (Totalité)', desc: 'Au moins un sous-type obligatoire' },
  { value: 'XT', label: 'XT (Partition)', desc: 'Exactement un sous-type (X + T)' },
]

export function InheritanceDialog({
  open,
  mcd,
  layout,
  onConfirm,
  onCancel,
}: InheritanceDialogProps) {
  useLanguage()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const parentSelectId = useId()
  const constraintSelectId = useId()

  const [parentId, setParentId] = useState<string>('')
  const [childIds, setChildIds] = useState<string[]>([])
  const [constraint, setConstraint] = useState<InheritanceConstraint>('none')

  // Initialisation à l'ouverture avec des valeurs par défaut intelligentes
  useEffect(() => {
    if (open && mcd.entities.length >= 2) {
      const defaultParent = mcd.entities[0].id
      const defaultChild = mcd.entities[1].id
      setParentId(defaultParent)
      setChildIds([defaultChild])
      setConstraint('none')
    }
  }, [open, mcd.entities])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const handleParentChange = (newParentId: string) => {
    setParentId(newParentId)
    // Retirer la nouvelle mère des filles si elle y était
    setChildIds((prev) => prev.filter((id) => id !== newParentId))
  }

  const handleToggleChild = (childId: string) => {
    setChildIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId],
    )
  }

  const handleValidate = () => {
    if (!parentId || childIds.length === 0) return

    // Calcul de la position optimale à mi-chemin entre la mère et les filles
    const parentPos = layout[parentId] ?? { x: 250, y: 150 }
    let avgChildX = 0
    let avgChildY = 0

    for (const cid of childIds) {
      const cpos = layout[cid] ?? { x: parentPos.x, y: parentPos.y + 160 }
      avgChildX += cpos.x
      avgChildY += cpos.y
    }
    avgChildX = Math.round(avgChildX / childIds.length)
    avgChildY = Math.round(avgChildY / childIds.length)

    let posX = Math.round((parentPos.x + avgChildX) / 2)
    let posY = Math.round((parentPos.y + avgChildY) / 2)

    // Si les nœuds sont quasiment alignés horizontalement, décaler vers le bas
    if (Math.abs(posY - parentPos.y) < 40) {
      posY = parentPos.y + 90
    }

    onConfirm({
      parentId,
      childIds,
      constraint,
      position: { x: posX, y: posY },
    })
  }

  const candidateChildren = mcd.entities.filter((e) => e.id !== parentId)
  const canSubmit = parentId !== '' && childIds.length > 0

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      className={dialogClass('md')}
    >
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h2 id={titleId} className="text-base font-bold text-ink">
            {t("Créer un héritage / spécialisation Merise")}
          </h2>
          <p className="mt-1 text-xs text-ink-soft">
            Reliez une entité mère (sur-type) à une ou plusieurs entités filles (sous-types).
          </p>
        </div>

        {/* Choix de l'entité mère */}
        <div>
          <label htmlFor={parentSelectId} className="block text-xs font-semibold text-ink">
            Entité Mère (Sur-type)
          </label>
          <select
            id={parentSelectId}
            value={parentId}
            onChange={(e) => handleParentChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs text-ink"
          >
            {mcd.entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        {/* Choix des entités filles */}
        <div>
          <span className="block text-xs font-semibold text-ink">
            Entités Filles (Sous-types) à relier
          </span>
          <div className="mt-1.5 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
            {candidateChildren.map((e) => {
              const checked = childIds.includes(e.id)
              return (
                <label
                  key={e.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 hover:bg-accent-soft/40"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleChild(e.id)}
                    className="rounded border-line-strong text-accent-ink"
                  />
                  <span className={`text-xs ${checked ? 'font-bold text-accent-ink' : 'text-ink'}`}>
                    {e.name}
                  </span>
                </label>
              )
            })}
          </div>
          {childIds.length === 0 && (
            <p className="mt-1 text-nano text-danger">
              Cochez au moins une entité fille.
            </p>
          )}
        </div>

        {/* Choix de la contrainte Merise */}
        <div>
          <label htmlFor={constraintSelectId} className="block text-xs font-semibold text-ink">
            Contrainte Merise
          </label>
          <select
            id={constraintSelectId}
            value={constraint}
            onChange={(e) => setConstraint(e.target.value as InheritanceConstraint)}
            className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs text-ink"
          >
            {CONSTRAINTS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-nano text-ink-soft">
            {CONSTRAINTS.find((c) => c.value === constraint)?.desc}
          </p>
        </div>

        {/* Note pédagogique */}
        <div className="rounded-lg border border-accent-soft bg-accent-soft/30 p-2.5 text-nano leading-relaxed text-ink-soft">
          <strong>Règle de passage :</strong> Le triangle Merise sera placé automatiquement entre
          les entités. La clé primaire de l'entité mère sera propagée comme clé primaire et
          étrangère (#) dans chaque table fille du MLD.
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!canSubmit}
            onClick={handleValidate}
          >
            Créer l'héritage
          </Button>
        </div>
      </div>
    </dialog>
  )
}
