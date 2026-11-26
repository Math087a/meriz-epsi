import { EXAM_MODE } from '../../lib/examMode'
import { t } from '../../i18n/runtime'
import { useLanguage } from '../../lib/useLanguage'
import { themeStore } from '../../lib/theme'
import { useTheme } from '../../lib/useTheme'
import { Icon } from './Icon'

interface ThemeSwitchProps {
  className?: string
}

/**
 * Bouton bascule gauche/droite compact pour alterner
 * entre le mode clair et le mode sombre Vert Sapin.
 */
export function ThemeSwitch({ className = '' }: ThemeSwitchProps) {
  useLanguage()
  const { resolved } = useTheme()
  const isDark = resolved === 'dark'

  const toggle = () => {
    themeStore.setPreference(isDark ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? t("Basculer vers le mode clair") : t(EXAM_MODE ? "Basculer vers le mode sombre Rouge Contrôle" : "Basculer vers le mode sombre Vert Sapin")}
      title={isDark ? t("Mode sombre actif (cliquer pour mode clair)") : t(EXAM_MODE ? "Mode clair actif (cliquer pour mode sombre Rouge Contrôle)" : "Mode clair actif (cliquer pour mode sombre Vert Sapin)")}
      onClick={toggle}
      className={`relative inline-flex h-[28px] w-[56px] shrink-0 cursor-pointer items-center rounded-full border border-line-strong bg-surface-soft transition-colors duration-200 hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${className}`}
    >
      <div className="flex w-full items-center justify-between px-2 pointer-events-none select-none">
        <Icon
          name="sun"
          size={11}
          className={`transition-opacity duration-200 ${!isDark ? 'text-amber-500 opacity-100' : 'text-ink-soft opacity-40'}`}
        />
        <Icon
          name="moon"
          size={11}
          className={`transition-opacity duration-200 ${isDark ? (EXAM_MODE ? 'text-rose-400 opacity-100' : 'text-emerald-400 opacity-100') : 'text-ink-soft opacity-40'}`}
        />
      </div>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-[3px] top-[2px] flex h-[22px] w-[22px] transform items-center justify-center rounded-full bg-accent text-on-accent shadow-sm transition-transform duration-200 ease-out ${
          isDark ? 'translate-x-[28px]' : 'translate-x-0'
        }`}
      >
        <Icon name={isDark ? 'moon' : 'sun'} size={11} className="text-white" />
      </span>
    </button>
  )
}
