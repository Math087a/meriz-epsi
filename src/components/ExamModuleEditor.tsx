import { useRef } from 'react'
import type { Dispatch, ReactNode } from 'react'
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

const SQL_TOKENS =
  /(--[^\n]*|'(?:''|[^'])*'|\b(?:DROP TABLE IF EXISTS|CREATE TABLE|ALTER TABLE|ADD CONSTRAINT|FOREIGN KEY|PRIMARY KEY|REFERENCES|NOT NULL|AUTO_INCREMENT|SERIAL|IDENTITY|UNIQUE|DEFAULT|CHECK|INDEX|SELECT|FROM|WHERE|INSERT INTO|VALUES|UPDATE|SET|DELETE|JOIN|ON|AS|INT|INTEGER|BIGINT|SMALLINT|TINYINT|BIT|VARCHAR|CHAR|TEXT|DATE|DATETIME|DATETIME2|TIMESTAMP|BOOLEAN|DECIMAL|NUMERIC|FLOAT|DOUBLE|MONEY|UNIQUEIDENTIFIER|BLOB|IF NOT EXISTS|ENGINE|CHARSET|COLLATE|CASCADE|RESTRICT)\b|\b\d+\b)/gi

const CODE_TOKENS =
  /(\/\/[^\n]*|#[^\n]*|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\b(?:namespace|use|class|extends|implements|trait|interface|public|protected|private|static|readonly|function|fn|return|new|const|let|var|import|export|from|type|enum|async|await|if|else|for|foreach|while|match|switch|case|default|null|true|false|self|this|void|int|float|string|bool|array|iterable|mixed|Schema|Blueprint|Table|Column|Entity|Repository|ORM|Migration|HasMany|BelongsTo|ManyToMany|OneToMany|ManyToOne|JoinColumn|Id|GeneratedValue)\b|\b\d+\b)/g

function highlightTokens(text: string, module: ExamTextModule): ReactNode {
  if (module !== 'sql' && module !== 'code') return text
  const pattern = module === 'sql' ? SQL_TOKENS : CODE_TOKENS
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  pattern.lastIndex = 0
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    const isComment = token.startsWith('--') || token.startsWith('//') || token.startsWith('#')
    const isString = token.startsWith("'") || token.startsWith('"')
    const isNumber = /^\d+$/.test(token)
    const cls = isComment
      ? 'italic text-ink-faint'
      : isString || isNumber
        ? 'text-ink-soft'
        : 'font-semibold text-accent-ink'
    parts.push(
      <span key={match.index} className={cls}>
        {token}
      </span>,
    )
    lastIndex = pattern.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts
}

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
  const preRef = useRef<HTMLPreElement>(null)
  const meta = MODULE_META[module]
  const value = exam?.[module] ?? EMPTY_EXAM_WORK[module]
  const highlighted = module === 'sql' || module === 'code'

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop
      preRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }

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
        {highlighted ? (
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-card border border-line-strong bg-surface shadow-soft focus-within:border-accent">
            <pre
              ref={preRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap break-words p-4 font-mono text-sm leading-6 text-ink"
            >
              {value ? highlightTokens(value, module) : <span className="text-ink-faint">{t(meta.placeholder)}</span>}
              {'\n'}
            </pre>
            <textarea
              value={value}
              readOnly={readOnly}
              aria-label={t(meta.label)}
              spellCheck={false}
              onScroll={handleScroll}
              className="relative z-10 h-full w-full resize-none bg-transparent p-4 font-mono text-sm leading-6 text-transparent caret-ink focus:outline-none"
              onChange={(e) => handleChange(e.target.value)}
            />
          </div>
        ) : (
          <textarea
            value={value}
            readOnly={readOnly}
            placeholder={t(meta.placeholder)}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none rounded-card border border-line-strong bg-surface p-4 font-mono text-sm leading-6 text-ink shadow-soft focus:border-accent focus:outline-none"
            onChange={(e) => handleChange(e.target.value)}
          />
        )}
      </div>
    </section>
  )
}
