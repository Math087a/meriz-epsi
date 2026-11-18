import { useId } from 'react'
import type { Dispatch } from 'react'
import type { Inheritance, InheritanceConstraint, Mcd } from '../model/mcd'
import type { McdAction } from '../model/mcdReducer'
import { Button } from './ui/Button'
import { t } from '../i18n/runtime'
import { useLanguage } from '../lib/useLanguage'

interface InheritanceFormProps {
  mcd: Mcd
  inheritance: Inheritance
  dispatch: Dispatch<McdAction>
}

const CONSTRAINTS: { value: InheritanceConstraint; label: string; desc: string }[] = [
  { value: 'none', label: 'Aucune', desc: 'Héritage simple sans contrainte' },
  { value: 'X', label: 'X (Exclusion / Disjonction)', desc: 'Au plus un sous-type à la fois' },
  { value: 'T', label: 'T (Totalité)', desc: 'Au moins un sous-type obligatoire' },
  { value: 'XT', label: 'XT (Partition)', desc: 'Exactement un sous-type (X + T)' },
]

export function InheritanceForm({ mcd, inheritance, dispatch }: InheritanceFormProps) {
  useLanguage()
  const parentSelectId = useId()
  const constraintSelectId = useId()

  const parentEntity = mcd.entities.find((e) => e.id === inheritance.parentId)
  const candidateChildren = mcd.entities.filter((e) => e.id !== inheritance.parentId)

  const handleParentChange = (newParentId: string) => {
    // Si la nouvelle mère était parmi les filles, on la retire des filles
    const updatedChildren = inheritance.childIds.filter((id) => id !== newParentId)
    dispatch({
      type: 'UPDATE_INHERITANCE',
      id: inheritance.id,
      patch: { parentId: newParentId, childIds: updatedChildren },
    })
  }

  const handleToggleChild = (childId: string) => {
    const isSelected = inheritance.childIds.includes(childId)
    const nextChildren = isSelected
      ? inheritance.childIds.filter((id) => id !== childId)
      : [...inheritance.childIds, childId]

    dispatch({
      type: 'UPDATE_INHERITANCE',
      id: inheritance.id,
      patch: { childIds: nextChildren },
    })
  }

  const handleConstraintChange = (constraint: InheritanceConstraint) => {
    dispatch({
      type: 'UPDATE_INHERITANCE',
      id: inheritance.id,
      patch: { constraint },
    })
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 text-xs">
      <div>
        <h2 className="text-sm font-semibold text-ink">{t("Héritage & Spécialisation")}</h2>
        <p className="mt-0.5 text-micro text-ink-soft">
          Configurez l'entité mère et les sous-types reliés au triangle Merise.
        </p>
      </div>

      {/* Choix de l'entité mère (Sur-type) */}
      <div>
        <label htmlFor={parentSelectId} className="block font-medium text-ink-soft">
          Entité Mère (Sur-type)
        </label>
        <select
          id={parentSelectId}
          value={inheritance.parentId || ''}
          onChange={(e) => handleParentChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-xs text-ink"
        >
          <option value="">-- Sélectionner l'entité mère --</option>
          {mcd.entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name}
            </option>
          ))}
        </select>
      </div>

      {/* Choix de la contrainte Merise */}
      <div>
        <label htmlFor={constraintSelectId} className="block font-medium text-ink-soft">
          Contrainte Merise
        </label>
        <select
          id={constraintSelectId}
          value={inheritance.constraint}
          onChange={(e) => handleConstraintChange(e.target.value as InheritanceConstraint)}
          className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-xs text-ink"
        >
          {CONSTRAINTS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-nano text-ink-soft">
          {CONSTRAINTS.find((c) => c.value === inheritance.constraint)?.desc}
        </p>
      </div>

      {/* Sélection des entités filles (Sous-types) */}
      <div>
        <span className="block font-medium text-ink-soft">
          Entités Filles (Sous-types)
        </span>
        {candidateChildren.length === 0 ? (
          <p className="mt-1 italic text-nano text-ink-soft">
            Aucune autre entité disponible à lier comme sous-type.
          </p>
        ) : (
          <div className="mt-1.5 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
            {candidateChildren.map((entity) => {
              const isChecked = inheritance.childIds.includes(entity.id)
              return (
                <label
                  key={entity.id}
                  className="flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-accent-soft/40"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleChild(entity.id)}
                    className="rounded border-line-strong text-accent-ink"
                  />
                  <span className={`text-xs ${isChecked ? 'font-semibold text-accent-ink' : 'text-ink'}`}>
                    {entity.name}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Règle de passage MLD automatique */}
      <div className="rounded-lg bg-accent-soft/30 p-2.5 text-nano text-ink-soft leading-relaxed border border-accent-soft">
        <strong>Règle de passage MLD :</strong> La clé primaire de{' '}
        {parentEntity ? <strong>{parentEntity.name}</strong> : 'la mère'} est automatiquement
        propagée comme clé primaire et clé étrangère (#) dans toutes les tables filles.
      </div>

      {/* Bouton de suppression */}
      <div className="pt-2 border-t border-line">
        <Button
          variant="danger"
          size="sm"
          onClick={() => dispatch({ type: 'DELETE_INHERITANCE', id: inheritance.id })}
          className="w-full"
        >
          Supprimer cet héritage
        </Button>
      </div>
    </form>
  )
}
