import { useId } from 'react'
import type { Dispatch } from 'react'
import type { PostIt } from '../model/mcd'
import type { McdAction } from '../model/mcdReducer'
import { Button } from './ui/Button'
import { t } from '../i18n/runtime'
import { useLanguage } from '../lib/useLanguage'

interface PostItFormProps {
  postit: PostIt
  dispatch: Dispatch<McdAction>
}

export function PostItForm({ postit, dispatch }: PostItFormProps) {
  useLanguage()
  const titleId = useId()
  const modeId = useId()
  const colorId = useId()

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3 text-xs">
      <div>
        <h2 className="text-sm font-semibold text-ink">{t("Post-it")}</h2>
        <p className="mt-0.5 text-micro text-ink-soft">
          Personnalisez la carte mémo ou l'affichage MLD interactif.
        </p>
      </div>

      <div>
        <label htmlFor={titleId} className="block font-medium text-ink-soft">
          Titre
        </label>
        <input
          id={titleId}
          type="text"
          value={postit.title || ''}
          onChange={(e) => dispatch({ type: 'UPDATE_POSTIT', id: postit.id, patch: { title: e.target.value } })}
          className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-2.5 py-1 text-xs text-ink"
        />
      </div>

      <div>
        <label htmlFor={modeId} className="block font-medium text-ink-soft">
          Mode d'affichage
        </label>
        <select
          id={modeId}
          value={postit.mode}
          onChange={(e) => dispatch({ type: 'UPDATE_POSTIT', id: postit.id, patch: { mode: e.target.value as 'text' | 'mld' } })}
          className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-2.5 py-1 text-xs text-ink"
        >
          <option value="text">Note libre / Consignes</option>
          <option value="mld">MLD relationnel textuel dynamique</option>
        </select>
      </div>

      <div>
        <label htmlFor={colorId} className="block font-medium text-ink-soft">
          Couleur
        </label>
        <select
          id={colorId}
          value={postit.color || 'yellow'}
          onChange={(e) => dispatch({ type: 'UPDATE_POSTIT', id: postit.id, patch: { color: e.target.value as any } })}
          className="mt-1 w-full rounded-lg border border-line-strong bg-surface px-2.5 py-1 text-xs text-ink"
        >
          <option value="yellow">Jaune classique</option>
          <option value="blue">Bleu pastel</option>
          <option value="green">Vert sauge</option>
        </select>
      </div>

      <div className="pt-2 border-t border-line">
        <Button
          variant="danger"
          size="sm"
          onClick={() => dispatch({ type: 'DELETE_POSTIT', id: postit.id })}
          className="w-full"
        >
          Supprimer ce post-it
        </Button>
      </div>
    </form>
  )
}
