import { t } from "../i18n/runtime"
import { useLanguage } from "../lib/useLanguage"
import { useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'
import type { ViewId, ViewInfo } from './views'
import { FOOTER_VIEWS, VIEWS } from './views'

const RAIL_MIN = 140
const RAIL_MAX = 320
const RAIL_DEFAULT = 208
const RAIL_STEP = 16

function clampRailWidth(width: number): number {
  return Math.min(RAIL_MAX, Math.max(RAIL_MIN, width))
}

interface NavRailProps {
  allowedViews?: readonly ViewId[]
  activeView: ViewId
  onSelectView: (view: ViewId) => void
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

// Icônes dessinées en SVG en ligne : aucune dépendance.
const icons: Record<ViewId, ReactNode> = {
  dictionnaire: (
    <svg {...iconProps}>
      <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2Z" />
      <path d="M4 17a2 2 0 0 1 2-2h13" />
      <path d="M9 7h6" />
    </svg>
  ),
  mcd: (
    <svg {...iconProps}>
      <rect x="2.5" y="4" width="7" height="6" rx="1" />
      <rect x="14.5" y="14" width="7" height="6" rx="1" />
      <ellipse cx="12" cy="12" rx="3.5" ry="2.5" />
      <path d="M8.5 9.5 9.9 10.9M14.6 13.4l1.4 1.4" />
    </svg>
  ),
  mld: (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 9h18M9 9v11M3 14.5h18" />
    </svg>
  ),
  mpd: (
    <svg {...iconProps}>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
      <path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13" />
      <path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" />
    </svg>
  ),
  sql: (
    <svg {...iconProps}>
      <path d="m8 8-4.5 4L8 16" />
      <path d="m16 8 4.5 4L16 16" />
      <path d="m13 5-2.5 14" />
    </svg>
  ),
  code: (
    <svg {...iconProps}>
      <path d="M10 3h5.5L20 7.5V21H10Z" />
      <path d="M15.5 3v5H20" />
      <path d="M6 6.5V19a1.5 1.5 0 0 0 1.5 1.5H10" />
    </svg>
  ),
  apprendre: (
    <svg {...iconProps}>
      <path d="m12 4-9.5 4.5L12 13l9.5-4.5Z" />
      <path d="M6 10.8v5c1.7 1.5 4 2.2 6 2.2s4.3-.7 6-2.2v-5" />
      <path d="M21.5 8.5V15" />
    </svg>
  ),
  apropos: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.5v.2" />
    </svg>
  ),
}

interface RailItemProps {
  view: ViewInfo
  active: boolean
  collapsed: boolean
  onSelectView: (view: ViewId) => void
}

function RailItem({ view, active, collapsed, onSelectView }: RailItemProps) {
  useLanguage()
  return (
    <li>
      <button
        type="button"
        aria-current={active ? 'page' : undefined}
        title={view.label}
        onClick={() => onSelectView(view.id)}
        className={`flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-sm ${
          collapsed ? 'justify-center' : 'justify-center md:justify-start'
        } ${
          active ? 'bg-accent font-medium text-on-accent' : 'text-ink-soft hover:bg-accent-soft hover:text-ink'
        }`}
      >
        <span aria-hidden="true">{icons[view.id]}</span>
        <span className={collapsed ? 'sr-only' : 'sr-only md:not-sr-only'}>{view.label}</span>
      </button>
    </li>
  )
}

/**
 * Rail de navigation vertical, équivalent moderne du Navigateur
 * d'AnalyseSI. Vues de travail en haut, Apprendre et À propos en
 * pied. Réductible et redimensionnable.
 */
export function NavRail({ activeView, onSelectView, allowedViews }: NavRailProps) {
  useLanguage()
  const [collapsed, setCollapsed] = useState(false)
  const [railWidth, setRailWidth] = useState(RAIL_DEFAULT)

  const onSeparatorPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = railWidth
    const separator = event.currentTarget
    separator.setPointerCapture(event.pointerId)
    const onMove = (moveEvent: globalThis.PointerEvent) => {
      setRailWidth(clampRailWidth(startWidth + (moveEvent.clientX - startX)))
    }
    const onUp = () => {
      separator.removeEventListener('pointermove', onMove)
    }
    separator.addEventListener('pointermove', onMove)
    separator.addEventListener('pointerup', onUp, { once: true })
  }

  const onSeparatorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setRailWidth((w) => clampRailWidth(w + RAIL_STEP))
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setRailWidth((w) => clampRailWidth(w - RAIL_STEP))
    }
  }

  return (
    <div className="flex shrink-0">
      <nav
        aria-label={t("Vues")}
        style={collapsed ? undefined : { width: railWidth }}
        className={`flex shrink-0 flex-col border-r border-line bg-shell ${collapsed ? 'w-14' : 'max-w-[40vw] md:w-52'}`}
      >
        <div className={`flex items-center border-b border-line px-2 py-1.5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && <span className="truncate px-1 text-xs font-semibold text-ink-soft">{t("Navigation")}</span>}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? t("Agrandir le volet gauche") : t("Réduire le volet gauche")}
            title={collapsed ? t("Agrandir le volet gauche") : t("Réduire le volet gauche")}
            className="inline-flex h-7 w-7 items-center justify-center rounded-control text-ink-soft hover:bg-accent-soft hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {collapsed ? <path d="m9 18 6-6-6-6" /> : <path d="m15 18-6-6 6-6" />}
            </svg>
          </button>
        </div>
        <ul className="flex flex-col gap-1 p-2">
          {VIEWS.filter(view => !allowedViews || allowedViews.includes(view.id)).map((view) => (
            <RailItem
              key={view.id}
              view={view}
              active={view.id === activeView}
              collapsed={collapsed}
              onSelectView={onSelectView}
            />
          ))}
        </ul>
        <ul className="mt-auto flex flex-col gap-1 border-t border-line p-2">
          {FOOTER_VIEWS.filter((view) => !allowedViews || allowedViews.includes(view.id)).map((view) => (
            <RailItem
              key={view.id}
              view={view}
              active={view.id === activeView}
              collapsed={collapsed}
              onSelectView={onSelectView}
            />
          ))}
        </ul>
      </nav>
      {!collapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t("Redimensionner le volet gauche")}
          aria-valuemin={RAIL_MIN}
          aria-valuemax={RAIL_MAX}
          aria-valuenow={railWidth}
          tabIndex={0}
          onPointerDown={onSeparatorPointerDown}
          onKeyDown={onSeparatorKeyDown}
          className="hidden w-1.5 shrink-0 cursor-col-resize bg-line hover:bg-mark md:block"
        />
      )}
    </div>
  )
}
