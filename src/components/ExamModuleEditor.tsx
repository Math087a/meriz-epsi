import type { Dispatch } from 'react'
import type { McdAction } from '../model/mcdReducer'
import type { ExamWork } from '../model/examWork'
import { EMPTY_EXAM_WORK } from '../model/examWork'
import { t } from '../i18n/runtime'
import { useLanguage } from '../lib/useLanguage'
import { copyText } from '../lib/clipboard'
import { saveFileAs } from '../lib/download'
import { Button } from './ui/Button'
import { useToast } from './ui/toastContext'

export type ExamTextModule = 'mld' | 'mpd' | 'sql' | 'code'

interface ExamModuleEditorProps {
  module: ExamTextModule
  exam?: ExamWork
  dispatch: Dispatch<McdAction>
  readOnly?: boolean
}

const MODULE_META: Record<ExamTextModule, { label: string; filename: string; ext: string; mime: string; placeholder: string }> = {
  mld: {
    label: 'MLD (Modèle Logique de Données)',
    filename: 'mld.txt',
    ext: '.txt',
    mime: 'text/plain',
    placeholder: 'Rédigez votre MLD manuellement ici...\nExemple :\nCLIENT(id_client, nom, email)\nCOMMANDE(id_commande, date_cmd, #id_client)',
  },
  mpd: {
    label: 'MPD (Modèle Physique de Données)',
    filename: 'mpd.txt',
    ext: '.txt',
    mime: 'text/plain',
    placeholder: 'Rédigez votre MPD manuellement ici (tables, types SQL, clés primaires et étrangères)...',
  },
  sql: {
    label: 'SQL (Script DDL)',
    filename: 'schema.sql',
    ext: '.sql',
    mime: 'application/sql',
    placeholder: 'Rédigez votre script SQL manuellement ici (CREATE TABLE, PRIMARY KEY, FOREIGN KEY...)...',
  },
  code: {
    label: 'Code (Entités / Migrations)',
    filename: 'code.txt',
    ext: '.txt',
    mime: 'text/plain',
    placeholder: 'Rédigez votre code ORM / entités / migrations manuellement ici...',
  },
}

/**
 * Éditeur manuel par module pour le Mode Contrôle : aucune génération
 * automatique ni vérification d'erreur, l'étudiant rédige comme sur copie.
 */
export function ExamModuleEditor({ module, exam, dispatch, readOnly = false }: ExamModuleEditorProps) {
  useLanguage()
  const toast = useToast()
  const meta = MODULE_META[module]
  const value = exam?.[module] ?? EMPTY_EXAM_WORK[module]

  const handleChange = (next: string) => {
    if (readOnly) return
    dispatch({ type: 'UPDATE_EXAM_WORK', patch: { [module]: next } })
  }

  const handleCopy = async () => {
    const ok = await copyText(value)
    toast({ kind: ok ? 'info' : 'error', text: ok ? t('Contenu copié dans le presse-papiers.') : t('Erreur : copie impossible dans ce navigateur.') })
  }

  const handleExport = async () => {
    const res = await saveFileAs(
      meta.filename,
      new Blob([value], { type: `${meta.mime};charset=utf-8` }),
      t(meta.label),
      { [meta.mime]: [meta.ext] },
    )
    toast(res === 'cancelled' ? t('Export annulé.') : t('Module exporté ({0}).', [meta.filename]))
  }

  return (
    <section aria-label={t(meta.label)} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-4 py-2">
        <Button size="sm" onClick={() => void handleCopy()} disabled={value.trim() === ''}>
          {t('Copier')}
        </Button>
        <Button size="sm" onClick={() => void handleExport()} disabled={value.trim() === ''}>
          {t('Exporter ce module ({0})', [meta.ext])}
        </Button>
        <p className="text-xs text-ink-soft">
          {readOnly
            ? t('Saisie manuelle remise par l’étudiant (Mode Contrôle).')
            : t('Saisie manuelle libre — aucune génération automatique ni vérification.')}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <textarea
          value={value}
          readOnly={readOnly}
          placeholder={t(meta.placeholder)}
          spellCheck={false}
          className="min-h-0 flex-1 resize-none rounded-card border border-line-strong bg-surface p-4 font-mono text-sm leading-6 text-ink shadow-soft focus:border-accent focus:outline-none"
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
    </section>
  )
}
