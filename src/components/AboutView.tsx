import { t } from "../i18n/runtime"
import { useLanguage } from "../lib/useLanguage"
import { LogoMark } from './ui/Lockup'

/** À propos : le logiciel, son auteur et sa licence. */
export function AboutView() {
  useLanguage()
  return (
    <section aria-label={t("À propos")} className="min-h-0 flex-1 overflow-y-auto [overflow-wrap:anywhere]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-8 py-8">
        <header className="flex items-center gap-3">
          <LogoMark size={44} />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t("À propos de Merise EPSI Edition")}</h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              {t("Environnement moderne de modélisation Merise pour l'EPSI.")}</p>
          </div>
        </header>

        <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
          <h3 className="text-base font-semibold tracking-tight">{t("Le logiciel")}</h3>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            {t("Merise EPSI Edition est un outil moderne et libre de modélisation de bases de données selon la méthode Merise. Conçu spécialement pour les travaux pratiques et projets des étudiants de l'EPSI, il intègre l'import direct des fichiers JMerise (.mcd), la génération T-SQL pour Microsoft SQL Server, la gestion complète de l'héritage et de la spécialisation (X, T, XT), ainsi qu'un export PNG haute fidélité.")}</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            {t("Construit avec React 19, TypeScript et React Flow. Tout s'exécute localement sur votre poste : vos schémas et dictionnaires restent 100 % privés.")}</p>
        </div>

        <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
          <h3 className="text-base font-semibold tracking-tight">{t("Auteurs et crédits")}</h3>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            {t("Adaptation et extensions EPSI par Math087a.")}{' '}
            <a
              href="https://github.com/Math087a/meriz-epsi"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent-ink underline underline-offset-2 hover:text-ink"
            >
              github.com/Math087a/meriz-epsi
            </a>
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            {t("Basé sur le logiciel original Meriz créé par Yassine Daif :")}{' '}
            <a
              href="https://github.com/Yassine-Daif/meriz"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent-ink underline underline-offset-2 hover:text-ink"
            >
              github.com/Yassine-Daif/meriz
            </a>
            .
          </p>
        </div>

        <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
          <h3 className="text-base font-semibold tracking-tight">{t("Licence")}</h3>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            {t("Merise EPSI Edition est un logiciel libre publié sous licence GNU AGPL 3.0. Vous êtes libres de l'utiliser, l'étudier, le modifier et le partager.")}</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            {t("Conformément à la licence AGPL-3.0, toute version dérivée distribuée ou déployée en réseau doit conserver la même licence libre et créditer les auteurs.")}</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            {t("Le texte complet est dans le fichier LICENSE du dépôt, et sur")}{' '}
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-accent-ink underline underline-offset-2 hover:text-ink"
            >
              {t("gnu.org")}</a>
            {t(". Les dépendances gardent leur propre licence.")}</p>
        </div>
      </div>
    </section>
  )
}
