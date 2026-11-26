import { Fragment, useState } from 'react'
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
import { Segmented } from './ui/Segmented'
import { Select } from './ui/Select'
import { useToast } from './ui/toastContext'

interface ExamDictionaryViewProps {
  exam?: ExamWork
  dispatch: Dispatch<McdAction>
  readOnly?: boolean
}

type DictionaryTab = 'tables' | 'associations' | 'unplaced'

const inputClass =
  'min-h-8 w-full min-w-0 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-xs text-ink hover:border-line-strong focus:border-line-strong focus:bg-surface focus:outline-none'

/**
 * Dictionnaire des données autonome pour le Mode Contrôle :
 * reprend l'ergonomie Tables / Associations / Non affectées tout en
 * restant 100 % indépendant du MCD (aucun ajout automatique dans le schéma).
 */
export function ExamDictionaryView({ exam, dispatch, readOnly = false }: ExamDictionaryViewProps) {
  useLanguage()
  const toast = useToast()
  const [tab, setTab] = useState<DictionaryTab>('tables')
  const [search, setSearch] = useState('')

  const entries = exam?.dictionary ?? EMPTY_EXAM_WORK.dictionary
  const dictTables = exam?.dictTables ?? []
  const dictAssociations = exam?.dictAssociations ?? []

  const updateExam = (patch: Partial<ExamWork>) => {
    dispatch({ type: 'UPDATE_EXAM_WORK', patch })
  }

  const handleAddTable = () => {
    if (readOnly) return
    let idx = dictTables.length + 1
    while (dictTables.includes(`Entite ${idx}`)) idx += 1
    updateExam({ dictTables: [...dictTables, `Entite ${idx}`] })
    setTab('tables')
  }

  const handleAddAssociation = () => {
    if (readOnly) return
    let idx = dictAssociations.length + 1
    while (dictAssociations.includes(`Association ${idx}`)) idx += 1
    updateExam({ dictAssociations: [...dictAssociations, `Association ${idx}`] })
    setTab('associations')
  }

  const handleAddProperty = (ownerKind?: 'table' | 'association', ownerName?: string) => {
    if (readOnly) return
    const next: ExamDictionaryEntry = {
      id: newId(),
      name: '',
      type: '',
      size: '',
      comment: '',
      ...(ownerKind && ownerName ? { ownerKind, ownerName } : {}),
    }
    updateExam({ dictionary: [...entries, next] })
    if (!ownerKind) setTab('unplaced')
  }

  const handleChangeEntry = (id: string, patch: Partial<ExamDictionaryEntry>) => {
    if (readOnly) return
    updateExam({
      dictionary: entries.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    })
  }

  const handleDeleteEntry = (id: string) => {
    if (readOnly) return
    updateExam({ dictionary: entries.filter((row) => row.id !== id) })
  }

  const handleRenameGroup = (kind: 'table' | 'association', oldName: string, newName: string) => {
    const trimmed = newName.trim()
    if (readOnly || !trimmed || trimmed === oldName) return
    const list = kind === 'table' ? dictTables : dictAssociations
    if (list.includes(trimmed)) return
    const nextList = list.map((n) => (n === oldName ? trimmed : n))
    const nextEntries = entries.map((e) =>
      e.ownerKind === kind && e.ownerName === oldName ? { ...e, ownerName: trimmed } : e,
    )
    updateExam({
      ...(kind === 'table' ? { dictTables: nextList } : { dictAssociations: nextList }),
      dictionary: nextEntries,
    })
  }

  const handleDeleteGroup = (kind: 'table' | 'association', name: string) => {
    if (readOnly) return
    const list = kind === 'table' ? dictTables : dictAssociations
    const nextList = list.filter((n) => n !== name)
    const nextEntries = entries.map((e) =>
      e.ownerKind === kind && e.ownerName === name
        ? { id: e.id, name: e.name, type: e.type, size: e.size, comment: e.comment }
        : e,
    )
    updateExam({
      ...(kind === 'table' ? { dictTables: nextList } : { dictAssociations: nextList }),
      dictionary: nextEntries,
    })
  }

  const toCsv = () => {
    const header = ['Groupe', 'Donnée', 'Type', 'Taille', 'Règle / Commentaire'].join(';')
    const lines = entries.map((e) =>
      [e.ownerName ?? 'Non affectée', e.name, e.type, e.size, e.comment]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(';'),
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

  const query = search.trim().toLowerCase()
  const unplacedEntries = entries.filter((e) => !e.ownerKind)
  const tableGroups = dictTables.map((name) => ({
    kind: 'table' as const,
    name,
    rows: entries.filter((e) => e.ownerKind === 'table' && e.ownerName === name),
  }))
  const assocGroups = dictAssociations.map((name) => ({
    kind: 'association' as const,
    name,
    rows: entries.filter((e) => e.ownerKind === 'association' && e.ownerName === name),
  }))

  const activeGroups =
    tab === 'tables'
      ? tableGroups
      : tab === 'associations'
        ? assocGroups
        : [{ kind: 'unplaced' as const, name: t('Propriétés non affectées'), rows: unplacedEntries }]

  const filteredGroups = activeGroups.map((g) => ({
    ...g,
    rows: g.rows.filter(
      (r) =>
        !query ||
        g.name.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.comment.toLowerCase().includes(query),
    ),
  })).filter((g) => !query || g.rows.length > 0 || g.name.toLowerCase().includes(query))

  return (
    <section aria-label={t('Dictionnaire des données')} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-2">
        <Segmented<DictionaryTab>
          legend={t('Contenu du dictionnaire')}
          hideLegend
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'tables', label: `${t('Entités')} (${dictTables.length})` },
            { value: 'associations', label: `${t('Associations')} (${dictAssociations.length})` },
            { value: 'unplaced', label: `${t('Non affectées')} (${unplacedEntries.length})` },
          ]}
        />
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="ghost" onClick={handleAddTable}>
              <Icon name="plus" size={15} />
              {t('Nouvelle entité')}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleAddAssociation}>
              <Icon name="plus" size={15} />
              {t('Nouvelle association')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleAddProperty()}>
              <Icon name="plus" size={15} />
              {t('Ajouter une propriété')}
            </Button>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-2">
        <label className="flex min-w-0 max-w-sm basis-48 flex-1 items-center gap-2 text-xs">
          {t('Rechercher')}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-8 min-w-0 flex-1 rounded-lg border border-line-strong bg-surface px-2 py-1"
          />
        </label>
        <div className="flex items-center gap-1.5 lg:ml-auto">
          <Button size="sm" onClick={() => void handleCopy()} disabled={entries.length === 0}>
            {t('Copier')}
          </Button>
          <Button size="sm" onClick={() => void handleExport()} disabled={entries.length === 0}>
            {t('Exporter ce module (.csv)')}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
        {filteredGroups.length === 0 ? (
          <div className="rounded-card border border-line bg-surface p-6 text-center text-sm text-ink-soft">
            {tab === 'tables'
              ? t('Aucune entité dans le dictionnaire. Cliquez sur « Nouvelle entité » pour en créer une.')
              : tab === 'associations'
                ? t('Aucune association dans le dictionnaire. Cliquez sur « Nouvelle association » pour en créer une.')
                : t('Aucune propriété non affectée. Cliquez sur « Ajouter une propriété » pour en saisir une.')}
          </div>
        ) : (
          <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-lg border border-line bg-surface text-sm">
            <thead>
              <tr>
                <th className="w-[24%] border-b border-line bg-shell px-3 py-2 text-left text-xs font-medium text-ink-soft">{t('Donnée / Propriété')}</th>
                <th className="w-[18%] border-b border-line bg-shell px-3 py-2 text-left text-xs font-medium text-ink-soft">{t('Type')}</th>
                <th className="w-[14%] border-b border-line bg-shell px-3 py-2 text-left text-xs font-medium text-ink-soft">{t('Taille')}</th>
                <th className="w-[24%] border-b border-line bg-shell px-3 py-2 text-left text-xs font-medium text-ink-soft">{t('Règle / Commentaire')}</th>
                <th className="w-[15%] border-b border-line bg-shell px-3 py-2 text-left text-xs font-medium text-ink-soft">{t('Placement')}</th>
                {!readOnly && <th className="w-[5%] border-b border-line bg-shell px-2 py-2"><span className="sr-only">{t('Actions')}</span></th>}
              </tr>
            </thead>
            {filteredGroups.map((group) => (
              <Fragment key={`${group.kind}-${group.name}`}>
                <tbody>
                  <tr>
                    <th colSpan={readOnly ? 5 : 6} className="border-b border-line bg-shell px-3 py-1.5 text-left">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {group.kind !== 'unplaced' && !readOnly ? (
                          <input
                            type="text"
                            defaultValue={group.name}
                            onBlur={(e) => handleRenameGroup(group.kind, group.name, e.target.value)}
                            className="rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-ink hover:border-line-strong focus:border-line-strong focus:bg-surface focus:outline-none"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-ink">{group.name}</span>
                        )}
                        {!readOnly && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAddProperty(group.kind === 'unplaced' ? undefined : group.kind, group.kind === 'unplaced' ? undefined : group.name)}
                            >
                              <Icon name="plus" size={14} />
                              {t('Propriété')}
                            </Button>
                            {group.kind !== 'unplaced' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteGroup(group.kind, group.name)}
                                className="rounded p-1 text-ink-soft hover:bg-danger-soft hover:text-danger"
                                title={t('Supprimer ce groupe')}
                              >
                                <Icon name="trash" size={15} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  </tr>
                  {group.rows.length === 0 ? (
                    <tr>
                      <td colSpan={readOnly ? 5 : 6} className="border-b border-line px-4 py-3 text-xs text-ink-soft">
                        {t('Aucune propriété dans ce groupe.')}
                      </td>
                    </tr>
                  ) : (
                    group.rows.map((row) => (
                      <tr key={row.id} className="hover:bg-surface-soft">
                        <td className="border-b border-line px-2 py-1.5">
                          <input
                            type="text"
                            value={row.name}
                            readOnly={readOnly}
                            placeholder={t('ex. nom_client')}
                            className={inputClass + ' font-mono'}
                            onChange={(e) => handleChangeEntry(row.id, { name: e.target.value })}
                          />
                        </td>
                        <td className="border-b border-line px-2 py-1.5">
                          <input
                            type="text"
                            value={row.type}
                            readOnly={readOnly}
                            placeholder={t('ex. VARCHAR')}
                            className={inputClass}
                            onChange={(e) => handleChangeEntry(row.id, { type: e.target.value })}
                          />
                        </td>
                        <td className="border-b border-line px-2 py-1.5">
                          <input
                            type="text"
                            value={row.size}
                            readOnly={readOnly}
                            placeholder={t('ex. 100')}
                            className={inputClass}
                            onChange={(e) => handleChangeEntry(row.id, { size: e.target.value })}
                          />
                        </td>
                        <td className="border-b border-line px-2 py-1.5">
                          <input
                            type="text"
                            value={row.comment}
                            readOnly={readOnly}
                            placeholder={t('ex. Obligatoire...')}
                            className={inputClass}
                            onChange={(e) => handleChangeEntry(row.id, { comment: e.target.value })}
                          />
                        </td>
                        <td className="border-b border-line px-2 py-1.5">
                          <Select
                            disabled={readOnly}
                            value={row.ownerKind && row.ownerName ? `${row.ownerKind}:${row.ownerName}` : ''}
                            onValueChange={(val) => {
                              if (!val) {
                                handleChangeEntry(row.id, { ownerKind: undefined, ownerName: undefined })
                              } else {
                                const idx = val.indexOf(':')
                                const k = val.slice(0, idx) as 'table' | 'association'
                                const n = val.slice(idx + 1)
                                handleChangeEntry(row.id, { ownerKind: k, ownerName: n })
                              }
                            }}
                            className="min-h-8 w-full rounded-lg border border-line-strong bg-surface px-1.5 py-1 text-xs"
                          >
                            {dictTables.length > 0 && (
                              <optgroup label={t('Tables')}>
                                {dictTables.map((n) => (
                                  <option key={`table:${n}`} value={`table:${n}`}>{n}</option>
                                ))}
                              </optgroup>
                            )}
                            {dictAssociations.length > 0 && (
                              <optgroup label={t('Associations')}>
                                {dictAssociations.map((n) => (
                                  <option key={`association:${n}`} value={`association:${n}`}>{n}</option>
                                ))}
                              </optgroup>
                            )}
                            <option value="">{t('Non affectées')}</option>
                          </Select>
                        </td>
                        {!readOnly && (
                          <td className="border-b border-line px-2 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteEntry(row.id)}
                              aria-label={t('Supprimer la ligne')}
                              className="rounded p-1 text-ink-soft hover:bg-danger-soft hover:text-danger"
                            >
                              <Icon name="close" size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </Fragment>
            ))}
          </table>
        )}
      </div>
    </section>
  )
}
