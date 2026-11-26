import { useContext, useState } from 'react'
import type { NodeProps } from '@xyflow/react'
import { McdDispatchContext } from './dispatchContext'
import type { PostItFlowNode } from './mcdToFlow'
import { mcdToMld } from '../model/mld'
import { EXAM_MODE } from '../lib/examMode'

export function PostItNode({ data, selected }: NodeProps<PostItFlowNode>) {
  const dispatch = useContext(McdDispatchContext)
  const { postit, mcd } = data
  const [content, setContent] = useState(postit.content)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const isMldMode = !EXAM_MODE && postit.mode === 'mld'
  const [title, setTitle] = useState(postit.title || (isMldMode ? 'MLD Dynamique' : 'Mémo'))

  const handleBlurContent = () => {
    dispatch?.({ type: 'UPDATE_POSTIT', id: postit.id, patch: { content } })
  }

  const handleBlurTitle = () => {
    setIsEditingTitle(false)
    dispatch?.({ type: 'UPDATE_POSTIT', id: postit.id, patch: { title } })
  }

  const toggleMode = () => {
    if (EXAM_MODE) return
    const nextMode = postit.mode === 'mld' ? 'text' : 'mld'
    dispatch?.({
      type: 'UPDATE_POSTIT',
      id: postit.id,
      patch: {
        mode: nextMode,
        title: nextMode === 'mld' ? 'MLD Dynamique' : (title === 'MLD Dynamique' ? 'Mémo' : title),
      },
    })
  }

  const handleDelete = () => {
    dispatch?.({ type: 'DELETE_POSTIT', id: postit.id })
  }

  const mldTables = isMldMode ? mcdToMld(mcd) : []

  return (
    <div
      className={`relative min-w-64 max-w-80 rounded-lg border p-3 font-sans shadow-md transition-shadow ${
        postit.color === 'blue'
          ? 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/80 dark:text-sky-100'
          : postit.color === 'green'
          ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-100'
          : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-100'
      } ${
        selected
          ? 'ring-2 ring-mark ring-offset-2 ring-offset-canvas'
          : ''
      }`}
    >
      <div className="mb-2 flex items-center justify-between border-b border-black/10 pb-1.5 dark:border-white/10">
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70">
            <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
            <path d="M15 3v5h5" />
          </svg>
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              autoFocus
              className="w-32 rounded bg-white/70 px-1 py-0.5 text-xs font-semibold text-ink dark:bg-black/40"
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlurTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBlurTitle()
                e.stopPropagation()
              }}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              className="cursor-pointer text-xs font-bold tracking-tight hover:underline"
              title="Cliquer pour renommer"
            >
              {title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!EXAM_MODE && (
            <button
              type="button"
              onClick={toggleMode}
              className="rounded px-1.5 py-0.5 text-nano font-medium opacity-75 transition-opacity hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
              title={isMldMode ? 'Passer en mode mémo libre' : 'Passer en mode MLD dynamique'}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {isMldMode ? 'Vue MLD' : 'Texte'}
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="rounded p-0.5 opacity-60 transition-opacity hover:bg-danger/20 hover:text-danger hover:opacity-100"
            title="Supprimer ce post-it"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!isMldMode ? (
        <textarea
          value={content}
          placeholder="Écrivez vos notes, consignes ou mémos ici..."
          rows={4}
          className="w-full resize-y rounded border-0 bg-transparent p-1 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlurContent}
          onKeyDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="max-h-60 overflow-y-auto pr-1 text-micro leading-5 font-mono">
          {mldTables.length === 0 ? (
            <p className="italic opacity-60">Aucune table MLD générée.</p>
          ) : (
            <div className="space-y-1.5">
              {mldTables.map((table) => (
                <div key={table.id} className="rounded bg-black/5 p-1 dark:bg-white/5">
                  <span className="font-bold">{table.name}</span> (
                  {table.columns.map((col, idx) => (
                    <span key={col.id || idx}>
                      {idx > 0 && ', '}
                      {col.references && <span className="opacity-80 font-semibold">#</span>}
                      <span className={col.isPrimaryKey ? 'font-semibold underline underline-offset-2' : ''}>
                        {col.name}
                      </span>
                    </span>
                  ))}
                  )
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
