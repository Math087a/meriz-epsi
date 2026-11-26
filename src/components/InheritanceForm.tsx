import { EXAM_MODE } from '../lib/examMode'
import { Select } from './ui/Select'
import { t } from '../i18n/runtime'
import { useLanguage } from '../lib/useLanguage'
import { useId, useState } from 'react'
import type { Dispatch } from 'react'
import type { Inheritance, InheritanceConstraint, Mcd } from '../model/mcd'
import type { McdAction } from '../model/mcdReducer'
import { Button } from './ui/Button'

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
  const nameId = useId()
  const parentSelectId = useId()
  const childSelectId = useId()
  const constraintSelectId = useId()
  const [selectedChildToAdd, setSelectedChildToAdd] = useState('')

  const parentEntity = mcd.entities.find((e) => e.id === inheritance.parentId)
  // Entités candidates à relier comme sous-types (pas la mère, et pas déjà reliées)
  const candidateChildren = mcd.entities.filter(
    (e) => e.id !== inheritance.parentId && !inheritance.childIds.includes(e.id),
  )

  const handleParentChange = (newParentId: string) => {
    const updatedChildren = inheritance.childIds.filter((id) => id !== newParentId)
    dispatch({
      type: 'UPDATE_INHERITANCE',
      id: inheritance.id,
      patch: { parentId: newParentId, childIds: updatedChildren },
    })
  }

  const handleAddChild = () => {
    if (!selectedChildToAdd) return
    const nextChildren = [...inheritance.childIds, selectedChildToAdd]
    dispatch({
      type: 'UPDATE_INHERITANCE',
      id: inheritance.id,
      patch: { childIds: nextChildren },
    })
    setSelectedChildToAdd('')
  }

  const handleRemoveChild = (childId: string) => {
    const nextChildren = inheritance.childIds.filter((id) => id !== childId)
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

  const handleDelete = () => {
    dispatch({ type: 'DELETE_INHERITANCE', id: inheritance.id })
  }

  return (
    <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t("Héritage")}</h2>
      </div>

      {/* Nom / Libellé de l'héritage */}
      <div>
        <label htmlFor={nameId} className="block text-xs font-medium text-ink-soft">
          {t("Nom")}
        </label>
        <input
          id={nameId}
          type="text"
          value={inheritance.name ?? ''}
          placeholder={parentEntity ? t("Héritage {0}", [parentEntity.name]) : t("Héritage")}
          onChange={(event) =>
            dispatch({
              type: 'UPDATE_INHERITANCE',
              id: inheritance.id,
              patch: { name: event.target.value },
            })
          }
          className="mt-0.5 w-full rounded-lg border border-line-strong px-2 py-1 text-sm bg-surface text-ink"
        />
      </div>

      {/* Entité Mère (Sur-type) */}
      <fieldset className="flex min-w-0 flex-col gap-1.5">
        <legend className="text-xs font-medium text-ink-soft">{t("Entité Mère (Sur-type)")}</legend>
        <Select
          id={parentSelectId}
          value={inheritance.parentId || ''}
          onValueChange={handleParentChange}
          className="min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-1.5 py-1 text-xs text-ink"
        >
          <option value="">{t("Choisir l'entité mère")}</option>
          {mcd.entities.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.name}
            </option>
          ))}
        </Select>
      </fieldset>

      {/* Relier à une entité fille (Sous-type) - Design identique à LegConnector */}
      <fieldset className="flex min-w-0 flex-col gap-1.5">
        <legend className="text-xs font-medium text-ink-soft">{t("Relier à une entité")}</legend>
        {candidateChildren.length === 0 ? (
          <p className="text-xs text-ink-soft">
            {mcd.entities.length <= 1
              ? t("Ajoutez d'abord d'autres entités sur le schéma.")
              : t("Toutes les entités disponibles sont déjà reliées.")}
          </p>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <Select
              id={childSelectId}
              value={selectedChildToAdd}
              onValueChange={(value) => setSelectedChildToAdd(value)}
              className="min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-1.5 py-1 text-xs text-ink"
            >
              <option value="">{t("Choisir une entité")}</option>
              {candidateChildren.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </Select>
            <button
              type="button"
              onClick={handleAddChild}
              disabled={selectedChildToAdd === ''}
              className="shrink-0 rounded-lg border border-line-strong bg-surface px-2 py-1 text-xs hover:bg-shell disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("Relier")}
            </button>
          </div>
        )}
      </fieldset>

      {/* Liste des sous-types reliés */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-soft">
          {t("Sous-types reliés")} ({inheritance.childIds.length})
        </span>
        {inheritance.childIds.length === 0 ? (
          <p className="text-xs italic text-ink-soft">{t("Aucun sous-type relié.")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {inheritance.childIds.map((cid) => {
              const child = mcd.entities.find((e) => e.id === cid)
              return (
                <li
                  key={cid}
                  className="flex items-center justify-between rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-xs text-ink"
                >
                  <span className="font-medium">{child ? child.name : cid}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChild(cid)}
                    className="rounded p-1 text-danger hover:bg-danger-soft transition-colors"
                    title={t("Détacher ce sous-type")}
                    aria-label={t("Détacher le sous-type {0}", [child?.name ?? cid])}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Contrainte Merise */}
      <fieldset className="flex min-w-0 flex-col gap-1.5">
        <legend className="text-xs font-medium text-ink-soft">{t("Contrainte Merise")}</legend>
        <Select
          id={constraintSelectId}
          value={inheritance.constraint}
          onValueChange={(value) => handleConstraintChange(value as InheritanceConstraint)}
          className="min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-1.5 py-1 text-xs text-ink"
        >
          {CONSTRAINTS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <p className="text-nano text-ink-soft">
          {CONSTRAINTS.find((c) => c.value === inheritance.constraint)?.desc}
        </p>
      </fieldset>

      {/* Règle de passage MLD automatique (masquée en Mode Contrôle) */}
      {!EXAM_MODE && (
        <div className="rounded-lg bg-accent-soft/30 p-2.5 text-nano text-ink-soft leading-relaxed border border-accent-soft mt-1">
          <strong>{t("Règle de passage MLD :")}</strong> {t("La clé primaire de")} {parentEntity ? <strong>{parentEntity.name}</strong> : t("l'entité mère")} {t("est automatiquement propagée comme clé primaire et clé étrangère (#) dans chaque sous-type.")}
        </div>
      )}

      {/* Bouton de suppression de l'héritage */}
      <div className="pt-2 border-t border-line">
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          className="w-full"
        >
          {t("Supprimer l'héritage")}
        </Button>
      </div>
    </form>
  )
}
