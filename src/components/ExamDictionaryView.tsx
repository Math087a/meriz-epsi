import type { Dispatch } from 'react'
import type { McdAction } from '../model/mcdReducer'
import type { ExamDictionaryEntry, ExamWork } from '../model/examWork'
import { EMPTY_EXAM_WORK } from '../model/examWork'
import { t } from '../i18n/runtime'
import { useLanguage } from '../lib/useLanguage'
import { newId } from '../lib/id'
import { copyText } from '../lib/clipboard'
import { saveFileAs } from '../lib/download'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'
import { useToast } from './ui/toastContext'

interface ExamDictionaryViewProps {
  exam?: ExamWork
  dispatch: Dispatch<McdAction>
  readOnly?: boolean
}

const inputClass =
  'min-h-8 w-full min-w-0 rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink focus:border-line-strong focus:outline-none'

/**
 * Dictionnaire des données autonome pour le Mode Contrôle :
 * l'étudiant saisit ses données manuellement sans aucun lien ni ajout
 * automatique dans le MCD.
 */
export function ExamDictionaryView({ exam, dispatch, readOnly = false }: ExamDictionaryViewProps) {
  useLanguage()
  const toast = useToast()
  const entries = exam?.dictionary ?? EMPTY_EXAM_WORK.dictionary

  const updateEntries = (next: ExamDictionaryEntry[]) => {
    dispatch({ type: 'UPDATE_EXAM_WORK', patch: { dictionary: next } })
  }

  const handleAdd = () => {
    if (readOnly) return
    updateEntries([
      ...entries,
      { id: newId(), name: '', type: '', size: '', comment: '' },
    ])
  }

  const handleChange = (id: string, field: keyof Omit<ExamDictionaryEntry, 'id'>, value: string) => {
    if (readOnly) return
    updateEntries(entries.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const handleDelete = (id: string) => {
    if (readOnly) return
    updateEntries(entries.filter((row) => row.id !== id))
  }

  const toCsv = () => {
    const header = ['Donnée', 'Type', 'Taille', 'Règle / Commentaire'].join(';')
    const lines = entries.map((e) =>
      [e.name, e.type, e.size, e.comment].map((v) => `"${v.replace(/"/g, '""')}"`).join(';'),
    )
    return [header, ...lines].join('\n')
  }

  const handleCopy = async () => {
    const ok = await copyText(toCsv())
    toast({ kind: ok ? 'info' : 'error', text: ok ? t('Dictionnaire copié.') : t('Erreur : copie impossible dans ce navigateur.') })
  }

  const handleExport = async () => {
    const res = await saveFileAs('dictionnaire.csv', new Blob([toCsv()], { type: 'text/csv;charset=utf-8' }), t('Dictionnaire des données'), {
      'text/csv': ['.csv'],
    })
    toast(res === 'cancelled' ? t('Export annulé.') : t('Dictionnaire exporté en .csv.'))
  }

  return (
    <section aria-label={t('Dictionnaire des données')} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-2">
        {!readOnly && (
          <Button size="sm" variant="primary" onClick={handleAdd}>
            <Icon name="plus" size={15} />
            {t('Ajouter une ligne')}
          </Button>
        )}
        <Button size="sm" onClick={() => void handleCopy()} disabled={entries.length === 0}>
          {t('Copier')}
        </Button>
        <Button size="sm" onClick={() => void handleExport()} disabled={entries.length === 0}>
          {t('Exporter ce module (.csv)')}
        </Button>
        <p className="text-xs text-ink-soft">
          {t('Saisie manuelle indépendante du MCD (aucun ajout automatique dans le schéma).')}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {entries.length === 0 ? (
          <div className="rounded-card border border-line bg-surface p-6 text-center text-sm text-ink-soft">
            {readOnly
              ? t('Aucune donnée saisie dans le dictionnaire par l’étudiant.')
              : t('Dictionnaire vide. Cliquez sur « Ajouter une ligne » pour saisir vos propriétés.')}
          </div>
        ) : (
          <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-card border border-line bg-surface text-sm">
            <thead>
              <tr>
                <th className="border-b border-line bg-shell px-3 py-2 text-left text-xs font-medium text-ink-soft">{t('Donnée / Propriété')}</th>
                <th className="border-b border-line bg-shell px-3 py-2 text-left text-xs font-medium text-ink-soft w-36">{t('Type')}</th>
                <th className="border-b border-line bg-shell px-3 py-2 text-left text-xs font-medium text-ink-soft w-28">{t('Taille')}</th>
                <th className="border-b border-line bg-shell px-3 py-2 text-left text-xs font-medium text-ink-soft">{t('Règle / Commentaire')}</th>
                {!readOnly && <th className="border-b border-line bg-shell px-2 py-2 w-12"><span className="sr-only">{t('Actions')}</span></th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => (
                <tr key={row.id} className="hover:bg-shell/40">
                  <td className="border-b border-line px-2 py-1.5">
                    <input
                      type="text"
                      value={row.name}
                      readOnly={readOnly}
                      placeholder={t('ex. nom_client')}
                      className={inputClass}
                      onChange={(e) => handleChange(row.id, 'name', e.target.value)}
                    />
                  </td>
                  <td className="border-b border-line px-2 py-1.5">
                    <input
                      type="text"
                      value={row.type}
                      readOnly={readOnly}
                      placeholder={t('ex. VARCHAR')}
                      className={inputClass}
                      onChange={(e) => handleChange(row.id, 'type', e.target.value)}
                    />
                  </td>
                  <td className="border-b border-line px-2 py-1.5">
                    <input
                      type="text"
                      value={row.size}
                      readOnly={readOnly}
                      placeholder={t('ex. 100')}
                      className={inputClass}
                      onChange={(e) => handleChange(row.id, 'size', e.target.value)}
                    />
                  </td>
                  <td className="border-b border-line px-2 py-1.5">
                    <input
                      type="text"
                      value={row.comment}
                      readOnly={readOnly}
                      placeholder={t('ex. Obligatoire, unique...')}
                      className={inputClass}
                      onChange={(e) => handleChange(row.id, 'comment', e.target.value)}
                    />
                  </td>
                  {!readOnly && (
                    <td className="border-b border-line px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        aria-label={t('Supprimer la ligne')}
                        title={t('Supprimer la ligne')}
                        className="rounded p-1 text-ink-soft hover:bg-danger-soft hover:text-danger"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
