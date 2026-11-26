import { useContext, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { McdDispatchContext } from './dispatchContext'
import type { InheritanceFlowNode } from './mcdToFlow'
import type { InheritanceConstraint } from '../model/mcd'

const CONSTRAINTS: { value: InheritanceConstraint; label: string; desc: string }[] = [
  { value: 'none', label: 'Aucune', desc: 'Héritage simple sans contrainte' },
  { value: 'X', label: 'X', desc: 'Exclusion / Disjonction (au plus 1 sous-type)' },
  { value: 'T', label: 'T', desc: 'Totalité (au moins 1 sous-type)' },
  { value: 'XT', label: 'XT', desc: 'Partition (exactement 1 sous-type)' },
]

export function InheritanceNode({ data, selected, isConnectable }: NodeProps<InheritanceFlowNode>) {
  const dispatch = useContext(McdDispatchContext)
  const { inheritance, parentName, childrenNames } = data
  const [showMenu, setShowMenu] = useState(false)

  const handleSelectConstraint = (c: InheritanceConstraint) => {
    dispatch?.({ type: 'UPDATE_INHERITANCE', id: inheritance.id, patch: { constraint: c } })
    setShowMenu(false)
  }

  const handleDelete = () => {
    dispatch?.({ type: 'DELETE_INHERITANCE', id: inheritance.id })
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-2 transition-all ${
        selected ? 'ring-2 ring-mark ring-offset-2 ring-offset-canvas' : ''
      }`}
    >
      {/* Top Handle vers l'entité mère */}
      <Handle
        type="source"
        id="top"
        position={Position.Top}
        className="meriz-handle !bg-accent-ink"
        isConnectable={isConnectable}
      />

      {/* Symbole Triangle Merise SVG */}
      <div
        className="relative cursor-pointer select-none"
        onClick={() => setShowMenu((prev) => !prev)}
        title="Cliquer pour changer la contrainte d'héritage (X, T, XT)"
      >
        <svg width="68" height="60" viewBox="0 0 68 60" className="overflow-visible filter drop-shadow-sm">
          {/* Triangle pointé vers le haut (vers l'entité mère) */}
          <polygon
            points="34,6 64,54 4,54"
            className="fill-surface stroke-line-strong transition-colors hover:stroke-accent-ink hover:fill-accent-soft/30"
            style={{ fill: 'var(--c-surface, #ffffff)', stroke: 'var(--c-line-strong, #8f6266)' }}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>

        {/* Badge Contrainte centré dans le triangle */}
        <div className="absolute inset-0 top-3 flex items-center justify-center pointer-events-none">
          <span className="font-mono text-xs font-bold text-accent-ink">
            {inheritance.constraint === 'none' ? '' : inheritance.constraint}
          </span>
        </div>
      </div>

      {/* Libellé sous le triangle */}
      <div className="mt-1 flex flex-col items-center text-center">
        <span className="text-micro font-medium text-ink-soft">
          {inheritance.name && inheritance.name.trim() !== '' ? inheritance.name : (parentName || 'Héritage')}
        </span>
        {childrenNames && childrenNames.length > 0 && (
          <span className="text-nano text-ink-soft/75 max-w-28 truncate" title={childrenNames.join(', ')}>
            ↳ {childrenNames.join(', ')}
          </span>
        )}
      </div>

      {/* Bouton de suppression rapide en sélection */}
      {selected && (
        <button
          type="button"
          onClick={handleDelete}
          className="absolute -right-2 -top-2 rounded-full border border-line-strong bg-surface p-1 text-danger shadow-soft hover:bg-danger-soft"
          title="Supprimer cet héritage"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Bottom Handle vers les entités filles */}
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className="meriz-handle !bg-accent-ink"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        id="left"
        position={Position.Left}
        className="meriz-handle"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="meriz-handle"
        isConnectable={isConnectable}
      />

      {/* Menu déroulant de contrainte */}
      {showMenu && (
        <div
          className="absolute top-16 z-50 min-w-36 rounded-lg border border-line-strong bg-surface p-1 shadow-lg text-xs"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-nano font-semibold text-ink-soft uppercase tracking-wider border-b border-line">
            Contrainte Merise
          </div>
          {CONSTRAINTS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => handleSelectConstraint(c.value)}
              className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left transition-colors hover:bg-accent-soft hover:text-accent-ink ${
                inheritance.constraint === c.value ? 'font-bold text-accent-ink bg-accent-soft/50' : 'text-ink'
              }`}
            >
              <span>{c.label}</span>
              <span className="text-micro text-ink-soft">{c.value === 'none' ? 'libre' : c.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
