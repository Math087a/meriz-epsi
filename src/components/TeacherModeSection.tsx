import { useEffect, useState } from 'react'
import type { ApiClient } from '../lib/apiClient'
import { fetchCurrentUser } from '../lib/authApi'
import type { ApiUser } from '../lib/authApi'
import { t } from '../i18n/runtime'
import { useLanguage } from '../lib/useLanguage'
import { useSession } from './sessionContext'
import { ResendVerification } from './ResendVerification'
import { Button } from './ui/Button'
import { useToast } from './ui/toastContext'

export function TeacherModeSection({
  user,
  client,
  onShowClasses,
}: {
  user: ApiUser
  client: ApiClient
  onShowClasses: () => void
}) {
  useLanguage()
  const { updateUser } = useSession()
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const canActivate = user.isAcademic || user.teacherVerifiedAt != null
  useEffect(() => {
    if (
      user.role === 'teacher' ||
      user.usageCategory !== 'teacher' ||
      !canActivate
    )
      return
    let active = true,
      running = false
    const refresh = async () => {
      if (!active || running || document.hidden) return
      running = true
      try {
        const result = await fetchCurrentUser(client)
        if (
          active &&
          result.ok &&
          (result.value.role !== user.role ||
            result.value.emailVerifiedAt !== user.emailVerifiedAt)
        )
          updateUser(result.value)
      } finally {
        running = false
      }
    }
    const check = () => {
      void refresh()
    }
    check()
    const timer = window.setInterval(check, 5000)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [
    client,
    user.role,
    user.usageCategory,
    user.emailVerifiedAt,
    canActivate,
    updateUser,
  ])
  async function refresh() {
    if (pending) return
    setPending(true)
    try {
      const result = await fetchCurrentUser(client)
      if (!result.ok) {
        toast({ kind: 'error', text: result.error.message })
        return
      }
      updateUser(result.value)
      if (result.value.role === 'teacher') onShowClasses()
      else
        toast(
          t(
            'Ouvrez le lien reçu par email pour activer votre espace professeur.',
          ),
        )
    } finally {
      setPending(false)
    }
  }
  if (user.role !== 'teacher' && user.usageCategory !== 'teacher') return null
  return (
    <section
      className="mt-6 space-y-4 rounded-card border border-line bg-surface p-5 sm:p-6"
      aria-labelledby="teacher-activation-title"
    >
      <h2 id="teacher-activation-title" className="text-lg font-semibold">
        {t(
          user.role === 'teacher'
            ? 'Espace professeur'
            : 'Activer mon espace professeur',
        )}
      </h2>
      {user.role === 'teacher' ? (
        <>
          <p className="text-sm text-ink-soft">
            {t(
              'Votre espace professeur est actif. Vos classes et documents restent accessibles.',
            )}
          </p>
          <Button onClick={onShowClasses}>{t('Aller à mes classes')}</Button>
        </>
      ) : canActivate ? (
        <>
          <p className="break-words text-sm">
            {t('Confirmez votre adresse d’établissement : {0}.', [user.email])}
          </p>
          <p className="text-sm text-ink-soft">
            {t(
              'Cliquez sur ce lien pour activer automatiquement votre espace professeur. Aucune invitation ni validation manuelle n’est nécessaire.',
            )}
          </p>
          <div className="flex flex-wrap items-start gap-3">
            <ResendVerification
              client={client}
              label={t('Renvoyer le lien d’activation')}
            />
            <Button loading={pending} onClick={() => void refresh()}>
              {t('J’ai confirmé mon adresse')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-ink-soft">
            {t(
              'L’activation automatique du mode professeur demande une adresse scolaire ou universitaire confirmée. L’adresse de ce compte n’est pas reconnue comme une adresse d’établissement.',
            )}
          </p>
          <p className="text-sm text-ink-soft">
            {t(
              'Vous pouvez continuer à utiliser l’éditeur. Si votre adresse d’établissement n’est pas reconnue, signalez son domaine pour que nous puissions l’ajouter.',
            )}
          </p>
        </>
      )}
    </section>
  )
}
