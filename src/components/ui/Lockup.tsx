import { useLanguage } from "../../lib/useLanguage"
/**
 * Logo de Meriz, repris de design/logo : une tuile indigo, la queue en V
 * et deux merises. Les couleurs suivent le thème par les tokens (tuile
 * « logo », mot à l'encre). Décoratif par défaut, nommé si `label`.
 */

interface LogoProps {
  /** Hauteur en pixels. */
  size?: number
  /** Nom accessible. Sans lui, le logo est ignoré des lecteurs d'écran. */
  label?: string
  className?: string
}

function a11y(label: string | undefined) {
  return label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const }
}

function Mark() {
  useLanguage()
  return (
    <>
      <rect width="64" height="64" rx="16" className="fill-logo" />
      {/* Entité 1 */}
      <rect x="10" y="11" width="18" height="15" rx="3" fill="#FFFFFF" />
      <line x1="10" y1="15.5" x2="28" y2="15.5" className="stroke-logo" strokeWidth="1.5" />
      {/* Entité 2 */}
      <rect x="36" y="38" width="18" height="15" rx="3" fill="#FFFFFF" />
      <line x1="36" y1="42.5" x2="54" y2="42.5" className="stroke-logo" strokeWidth="1.5" />
      {/* Pattes de liaison */}
      <line x1="24" y1="26" x2="28" y2="30" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="36" y1="34" x2="40" y2="38" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      {/* Association centrale (Ellipse) */}
      <ellipse cx="32" cy="32" rx="9" ry="6" fill="#FFFFFF" />
      <ellipse cx="32" cy="32" rx="9" ry="6" className="stroke-logo" strokeWidth="1.5" fill="none" />
    </>
  )
}

/** L'icône seule. */
export function LogoMark({ size = 28, label, className }: LogoProps) {
  useLanguage()
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={`shrink-0 ${className ?? ''}`} {...a11y(label)}>
      <Mark />
    </svg>
  )
}

/** L'icône et le texte « Merise EPSI Edition ». */
export function Lockup({ size = 32, label, className }: LogoProps) {
  useLanguage()
  return (
    <div className={`inline-flex items-center gap-2.5 shrink-0 select-none ${className ?? ''}`} {...a11y(label)}>
      <svg viewBox="0 0 64 64" width={size} height={size} className="shrink-0">
        <Mark />
      </svg>
      <div className="flex flex-col justify-center leading-tight">
        <span className="font-bold tracking-tight text-ink font-['Outfit']" style={{ fontSize: `${Math.round(size * 0.58)}px`, lineHeight: 1 }}>
          Merise
        </span>
        <span className="font-semibold uppercase tracking-wider text-accent font-['Outfit']" style={{ fontSize: `${Math.round(size * 0.3)}px`, letterSpacing: '0.08em', lineHeight: 1.1 }}>
          EPSI Edition
        </span>
      </div>
    </div>
  )
}
