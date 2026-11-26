import { Fragment, useCallback, useEffect, useId, useMemo, useState } from 'react'
import type { Dispatch } from 'react'
import {
  applyNodeChanges,
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import type { Connection, Edge, EdgeChange, Node, NodeChange, NodeProps } from '@xyflow/react'
import type { Mcd } from '../model/mcd'
import type { McdAction } from '../model/mcdReducer'
import type { ExamMpdEdge, ExamWork } from '../model/examWork'
import type { MpdSettings, MpdTable, SqlDialect } from '../model/mpd'
import { buildMpd, SQL_DIALECTS } from '../model/mpd'
import { mcdToMld } from '../model/mld'
import { ARIA_LABELS } from '../canvas/ariaLabels'
import { useTheme } from '../lib/useTheme'
import { useLanguage } from '../lib/useLanguage'
import { t } from '../i18n/runtime'
import { newId } from '../lib/id'
import { saveFileAs } from '../lib/download'
import { Select } from './ui/Select'
import { Button } from './ui/Button'
import { SqlTypeControl } from './SqlTypeControl'
import { useToast } from './ui/toastContext'

interface ExamMpdViewProps {
  mcd: Mcd
  settings: MpdSettings
  exam?: ExamWork
  dispatch: Dispatch<McdAction>
  readOnly?: boolean
  onDialectChange: (dialect: SqlDialect) => void
  onOverrideChange: (columnId: string, value: string) => void
  isActive: boolean
}

type ExamTableFlowNode = Node<{ table: MpdTable }, 'examTable'>

function ExamTableNode({ data, selected }: NodeProps<ExamTableFlowNode>) {
  useLanguage()
  const { table } = data
  return (
    <div
      className={`min-w-52 rounded-node border bg-surface text-ink shadow-soft ${
        selected ? 'border-mark ring-3 ring-mark/45 ring-offset-2 ring-offset-canvas' : 'border-line-strong'
      }`}
    >
      <div className="rounded-t-node border-b border-line bg-accent-soft px-3 py-2 text-center text-sm font-semibold tracking-tight text-ink">
        {table.name}
      </div>
      <ul className="py-1.5 font-mono text-xs leading-6">
        {table.columns.length === 0 ? (
          <li className="px-3 py-1 italic text-ink-soft">{t('Aucune colonne')}</li>
        ) : (
          table.columns.map((column) => (
            <li key={column.id} className="relative flex items-center gap-3 px-3 py-0.5 hover:bg-surface-soft">
              <Handle
                type="target"
                id={`target:${column.id}`}
                position={Position.Left}
                className="!h-2.5 !w-2.5 !border-line-strong !bg-surface hover:!bg-accent"
              />
              <span className={column.isPrimaryKey ? 'font-medium underline decoration-accent-ink underline-offset-2' : ''}>
                {column.name}
              </span>
              <span className="ml-auto text-ink-soft">{column.sqlType}</span>
              {column.isPrimaryKey && (
                <span className="rounded-full bg-accent-soft px-1.5 text-nano font-medium text-accent-ink">
                  {t('clé')}
                </span>
              )}
              <Handle
                type="source"
                id={`source:${column.id}`}
                position={Position.Right}
                className="!h-2.5 !w-2.5 !border-line-strong !bg-surface hover:!bg-accent"
              />
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

const nodeTypes = { examTable: ExamTableNode }

function rawMcdToExamTables(mcd: Mcd, settings: MpdSettings): MpdTable[] {
  return buildMpd(
    mcdToMld({
      properties: mcd.properties,
      entities: mcd.entities,
      associations: [],
    }),
    settings,
  )
}

function buildExamNodes(tables: MpdTable[]): ExamTableFlowNode[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(tables.length)))
  return tables.map((table, index) => ({
    id: table.id,
    type: 'examTable',
    position: {
      x: (index % cols) * 300 + 40,
      y: Math.floor(index / cols) * 240 + 40,
    },
    data: { table },
  }))
}

/**
 * Vue MPD en Mode Contrôle :
 * - Affiche uniquement les tables brutes issues des entités du MCD (sans FK ni tables de jonction automatiques).
 * - Permet à l'étudiant de tirer manuellement des flèches entre les propriétés.
 * - Affiche le panneau de droite pour choisir le dialecte et mapper les types SQL.
 */
export function ExamMpdView({
  mcd,
  settings,
  exam,
  dispatch,
  readOnly = false,
  onDialectChange,
  onOverrideChange,
  isActive,
}: ExamMpdViewProps) {
  useLanguage()
  const toast = useToast()
  const dialectSelectId = useId()
  const mappingPanelId = useId()
  const [mappingOpen, setMappingOpen] = useState(true)
  const visibilityClass = isActive ? 'flex min-h-0 flex-1 flex-col' : 'hidden'

  const tables = useMemo(() => rawMcdToExamTables(mcd, settings), [mcd, settings])
  const [nodes, setNodes] = useState<ExamTableFlowNode[]>(() => buildExamNodes(tables))
  const [revealed, setRevealed] = useState(isActive)

  useEffect(() => {
    if (isActive) setRevealed(true)
  }, [isActive])

  useEffect(() => {
    setNodes((current) => {
      const byId = new Map(current.map((n) => [n.id, n]))
      return buildExamNodes(tables).map((node) => {
        const existing = byId.get(node.id)
        return existing ? { ...node, position: existing.position } : node
      })
    })
  }, [tables])

  const onNodesChange = useCallback((changes: NodeChange<ExamTableFlowNode>[]) => {
    setNodes((current) => applyNodeChanges(changes, current))
  }, [])

  const rawEdges = useMemo(() => exam?.mpdEdges ?? [], [exam?.mpdEdges])
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(() => new Set())
  const flowEdges: Edge[] = useMemo(
    () =>
      rawEdges.map((e) => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle,
        target: e.target,
        targetHandle: e.targetHandle,
        selected: selectedEdgeIds.has(e.id),
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: selectedEdgeIds.has(e.id) ? 2.5 : 1.8 },
      })),
    [rawEdges, selectedEdgeIds],
  )

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) return false
      if (connection.source === connection.target && connection.sourceHandle.replace('source:', '') === connection.targetHandle.replace('target:', '')) return false
      return !rawEdges.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          e.sourceHandle === connection.sourceHandle &&
          e.targetHandle === connection.targetHandle,
      )
    },
    [rawEdges],
  )

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (readOnly || !isValidConnection(connection)) return
      const nextEdge: ExamMpdEdge = {
        id: newId(),
        source: connection.source!,
        sourceHandle: connection.sourceHandle!,
        target: connection.target!,
        targetHandle: connection.targetHandle!,
      }
      dispatch({ type: 'UPDATE_EXAM_WORK', patch: { mpdEdges: [...rawEdges, nextEdge] } })
    },
    [readOnly, isValidConnection, rawEdges, dispatch],
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const nextSelected = new Set(selectedEdgeIds)
      let selectionChanged = false
      for (const c of changes) {
        if (c.type === 'select') {
          selectionChanged = true
          if (c.selected) nextSelected.add(c.id)
          else nextSelected.delete(c.id)
        }
      }
      if (selectionChanged) setSelectedEdgeIds(nextSelected)
      if (readOnly) return
      const removedIds = new Set(changes.filter((c) => c.type === 'remove').map((c) => c.id))
      if (removedIds.size > 0) {
        dispatch({ type: 'UPDATE_EXAM_WORK', patch: { mpdEdges: rawEdges.filter((e) => !removedIds.has(e.id)) } })
      }
    },
    [readOnly, rawEdges, selectedEdgeIds, dispatch],
  )

  const handleExport = async () => {
    const tableById = new Map(tables.map((tbl) => [tbl.id, tbl]))
    const colName = (tableId: string, handle: string) => {
      const colId = handle.replace(/^(source|target):/, '')
      const tbl = tableById.get(tableId)
      const col = tbl?.columns.find((c) => c.id === colId)
      return `${tbl?.name ?? tableId}.${col?.name ?? colId}`
    }
    const lines = tables.map((tbl) => {
      const cols = tbl.columns.map((c) => `${c.name} ${c.sqlType}${c.isPrimaryKey ? ' PK' : ''}`).join(', ')
      return `${tbl.name} (${cols})`
    })
    const links = rawEdges.map((e) => `${colName(e.source, e.sourceHandle)} -> ${colName(e.target, e.targetHandle)}`)
    const content = [...lines, ...(links.length ? ['', '# Liaisons manuelles :', ...links] : [])].join('\n')
    const res = await saveFileAs('mpd.txt', new Blob([content], { type: 'text/plain;charset=utf-8' }), t('MPD (Modèle Physique de Données)'), {
      'text/plain': ['.txt'],
    })
    toast(res === 'cancelled' ? t('Export annulé.') : t('Module exporté ({0}).', ['mpd.txt']))
  }

  const theme = useTheme()
  const ariaLabels = useMemo(() => ({ ...ARIA_LABELS }), [])

  return (
    <section aria-label={t('Vue MPD')} className={visibilityClass}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-2">
        <label htmlFor={dialectSelectId} className="text-xs font-medium text-ink-soft">
          {t('Dialecte SQL')}
        </label>
        <Select
          id={dialectSelectId}
          value={settings.dialect}
          disabled={readOnly}
          onValueChange={(value) => onDialectChange(value as SqlDialect)}
          className="rounded-lg border border-line-strong px-1.5 py-1 font-mono text-xs"
        >
          {SQL_DIALECTS.map((dialect) => (
            <option key={dialect.id} value={dialect.id}>
              {dialect.label}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          aria-expanded={mappingOpen}
          aria-controls={mappingPanelId}
          onClick={() => setMappingOpen((open) => !open)}
        >
          <span aria-hidden="true" className="text-ink-soft">
            {mappingOpen ? '▸' : '◂'}
          </span>
          {t('Mappage des types')}
        </Button>
        <Button size="sm" onClick={() => void handleExport()} disabled={tables.length === 0}>
          {t('Exporter ce module (.txt)')}
        </Button>
        {!readOnly && (
          <p className="text-xs text-ink-soft">
            {t('Tirez des flèches entre les propriétés pour définir les clés étrangères (Suppr pour retirer une flèche).')}
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 flex-1 bg-canvas">
          {tables.length === 0 ? (
            <div className="flex h-full items-center justify-center p-6 text-sm text-ink-soft">
              {t('Aucune table dans le MCD. Créez d’abord des entités dans le MCD.')}
            </div>
          ) : (
            revealed && (
              <ReactFlowProvider>
                <ReactFlow<ExamTableFlowNode>
                  nodes={nodes}
                  edges={flowEdges}
                  nodeTypes={nodeTypes}
                  onNodesChange={onNodesChange}
                  onEdgesChange={handleEdgesChange}
                  onConnect={handleConnect}
                  isValidConnection={isValidConnection}
                  nodesConnectable={!readOnly}
                  nodesDraggable={!readOnly}
                  elementsSelectable
                  ariaLabelConfig={ariaLabels}
                  colorMode={theme.resolved}
                  deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
                  proOptions={{ hideAttribution: true }}
                  fitView
                  fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                >
                  <Background gap={16} />
                </ReactFlow>
              </ReactFlowProvider>
            )
          )}
        </div>

        {mappingOpen && (
          <section
            id={mappingPanelId}
            aria-label={t('Mappage des types')}
            className="w-full min-w-0 shrink-0 overflow-auto border-l border-line bg-surface p-3 sm:w-1/2 sm:p-4"
          >
            <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-card border border-line text-sm shadow-soft">
              <thead className="sticky top-0 z-10">
                <tr>
                  {[t('Colonne'), t('Type proposé'), t('Type SQL')].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="border-b border-line bg-shell px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => (
                  <Fragment key={table.id}>
                    <tr>
                      <th
                        scope="colgroup"
                        colSpan={3}
                        className="border-b border-line bg-accent-soft px-3 py-1.5 text-left text-xs font-semibold tracking-tight text-ink"
                      >
                        {table.name}
                      </th>
                    </tr>
                    {table.columns.map((column, index) => (
                      <tr key={column.id} className={index % 2 === 1 ? 'bg-shell/50' : ''}>
                        <td className="border-b border-line px-3 py-1.5 font-mono text-code">
                          {column.name}
                          {column.isPrimaryKey && (
                            <span className="ml-1.5 rounded-sm border border-line bg-accent-soft px-1 text-nano font-medium text-accent-ink">
                              {t('clé')}
                            </span>
                          )}
                        </td>
                        <td className="border-b border-line px-3 py-1.5 font-mono text-code text-ink-soft">
                          {column.proposedType}
                        </td>
                        <td className="border-b border-line px-3 py-1.5">
                          <span className="flex items-center gap-1.5">
                            <SqlTypeControl compact property={{ id: column.id, name: column.name, type: column.conceptualType }} />
                            {column.overridden && (
                              <button
                                type="button"
                                aria-label={t('Revenir au type proposé pour {0}', [column.name])}
                                disabled={readOnly}
                                title={t('Revenir à {0}', [column.proposedType])}
                                onClick={() => onOverrideChange(column.id, '')}
                                className="shrink-0 rounded-control border border-line-strong px-1.5 py-0.5 text-xs hover:bg-surface-soft"
                              >
                                ↺
                              </button>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </section>
  )
}
