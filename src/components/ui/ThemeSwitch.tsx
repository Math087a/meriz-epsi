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
      aria-label={isDark ? t("Basculer vers le mode clair") : t("Basculer vers le mode sombre Vert Sapin")}
      title={isDark ? t("Mode sombre actif (cliquer pour mode clair)") : t("Mode clair actif (cliquer pour mode sombre Vert Sapin)")}
      onClick={toggle}
      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border border-line-strong bg-surface-soft p-0.5 transition-colors duration-200 hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus ${className}`}
    >
      <div className="flex w-full items-center justify-between px-1.5 pointer-events-none select-none">
        <Icon
          name="sun"
          size={12}
          className={`transition-opacity duration-200 ${!isDark ? 'text-amber-500 opacity-100' : 'text-ink-soft opacity-40'}`}
        />
        <Icon
          name="moon"
          size={12}
          className={`transition-opacity duration-200 ${isDark ? 'text-emerald-400 opacity-100' : 'text-ink-soft opacity-40'}`}
        />
      </div>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-0.5 top-0.5 flex h-6 w-6 transform items-center justify-center rounded-full bg-accent text-on-accent shadow-sm transition-transform duration-200 ease-out ${
          isDark ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        <Icon name={isDark ? 'moon' : 'sun'} size={12} className="text-white" />
      </span>
    </button>
  )
}
