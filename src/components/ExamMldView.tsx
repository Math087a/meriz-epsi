import type { Dispatch } from 'react'
import type { Mcd } from '../model/mcd'
import type { McdAction } from '../model/mcdReducer'
import type { ExamWork } from '../model/examWork'
import { EMPTY_EXAM_WORK } from '../model/examWork'
import { findProperty } from '../model/queries'
import { t } from '../i18n/runtime'
import { useLanguage } from '../lib/useLanguage'
import { copyText } from '../lib/clipboard'
import { saveFileAs } from '../lib/download'
import { Button } from './ui/Button'
import { useToast } from './ui/toastContext'

interface ExamMldViewProps {
  mcd: Mcd
  exam?: ExamWork
  dispatch: Dispatch<McdAction>
  readOnly?: boolean
}

/**
 * Vue MLD en Mode Contrôle :
 * 1) Affiche uniquement les entités déjà créées dans le MCD (sans clés étrangères
 *    ni tables de jonction générées automatiquement) comme rappel visuel.
 * 2) Offre une zone de texte libre pour rédiger manuellement la notation
 *    relationnelle (MLDR).
 */
export function ExamMldView({ mcd, exam, dispatch, readOnly = false }: ExamMldViewProps) {
  useLanguage()
  const toast = useToast()
  const value = exam?.mld ?? EMPTY_EXAM_WORK.mld

  const handleChange = (next: string) => {
    if (readOnly) return
    dispatch({ type: 'UPDATE_EXAM_WORK', patch: { mld: next } })
  }

  const handleCopy = async () => {
    const ok = await copyText(value)
    toast({ kind: ok ? 'info' : 'error', text: ok ? t('Contenu copié dans le presse-papiers.') : t('Erreur : copie impossible dans ce navigateur.') })
  }

  const handleExport = async () => {
    const res = await saveFileAs('mld.txt', new Blob([value], { type: 'text/plain;charset=utf-8' }), t('MLD (Modèle Logique de Données)'), {
      'text/plain': ['.txt'],
    })
    toast(res === 'cancelled' ? t('Export annulé.') : t('Module exporté ({0}).', ['mld.txt']))
  }

  return (
    <section aria-label={t('Vue MLD')} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-2">
        <Button size="sm" onClick={() => void handleCopy()} disabled={value.trim() === ''}>
          {t('Copier')}
        </Button>
        <Button size="sm" onClick={() => void handleExport()} disabled={value.trim() === ''}>
          {t('Exporter ce module (.txt)')}
        </Button>
        <p className="text-xs text-ink-soft">
          {readOnly
            ? t('Saisie manuelle remise par l’étudiant (Mode Contrôle).')
            : t('Entités du MCD affichées à titre indicatif. Rédigez manuellement le MLDR ci-dessous.')}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        {mcd.entities.length > 0 && (
          <div className="flex flex-wrap items-start gap-4">
            {mcd.entities.map((entity) => (
              <div key={entity.id} className="min-w-52 rounded-card border border-line-strong bg-surface shadow-soft">
                <h2 className="rounded-t-lg border-b border-line bg-shell px-3 py-1.5 text-center text-sm font-semibold tracking-tight">
                  {entity.name}
                </h2>
                <ul className="px-3 py-2 font-mono text-xs leading-6">
                  {entity.attributes.length === 0 ? (
                    <li className="italic text-ink-soft">{t('Aucun attribut')}</li>
                  ) : (
                    entity.attributes.map((ref) => {
                      const prop = findProperty(mcd, ref.propertyId)
                      if (!prop) return null
                      return (
                        <li key={ref.propertyId} className="flex items-baseline gap-2">
                          <span className={ref.isIdentifier ? 'font-medium underline decoration-accent-ink underline-offset-2' : ''}>
                            {prop.name}
                          </span>
                          <span className="text-ink-soft">
                            {prop.type}
                            {prop.size ? `(${prop.size})` : ''}
                          </span>
                          {ref.isIdentifier && (
                            <span className="rounded-sm border border-line bg-accent-soft px-1 text-nano font-medium text-accent-ink">
                              {t('PK')}
                            </span>
                          )}
                        </li>
                      )
                    })
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="flex min-h-56 flex-1 flex-col rounded-card border border-line bg-surface p-4 shadow-soft">
          <h2 className="mb-2 text-sm font-semibold tracking-tight">{t('Notation relationnelle (MLDR)')}</h2>
          <textarea
            value={value}
            readOnly={readOnly}
            placeholder={t('Rédigez votre MLD manuellement ici...\nExemple :\nCLIENT(id_client, nom, email)\nCOMMANDE(id_commande, date_cmd, #id_client)')}
            spellCheck={false}
            className="min-h-40 flex-1 resize-y rounded-lg border border-line-strong bg-shell/40 p-3 font-mono text-sm leading-6 text-ink focus:border-accent focus:outline-none"
            onChange={(e) => handleChange(e.target.value)}
          />
        </div>
      </div>
    </section>
  )
}
