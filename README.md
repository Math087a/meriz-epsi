# Merise - EPSI Edition

Environnement moderne de modélisation Merise (MCD, MLD, MPD, SQL Server T-SQL) conçu pour les étudiants et intervenants de l'EPSI (B1, B2, B3).

Merise EPSI Edition remplace avantageusement les outils historiques tels que JMerise ou AnalyseSI par une expérience fluide, un thème Vert Sapin soigné et des fonctionnalités directement adaptées aux cursus informatiques.

---

## Comment l'installer sur votre PC (Barre des tâches & Bureau)

### Option 1 : Installation directe en 1 clic via le navigateur (Recommandée)

L'application est disponible immédiatement sans aucun téléchargement lourd :

**Accéder à l'application : https://math087a.github.io/meriz-epsi/**

1. Ouvre l'adresse dans **Microsoft Edge**, **Google Chrome** ou **Brave**.
2. Clique sur l'icône **« Installer l'application »** située tout à droite dans la barre d'adresse (ou menu 3 points -> *Applications* -> *Installer Merise EPSI Edition*).
3. L'application s'ouvre immédiatement dans sa propre fenêtre autonome (sans barre d'adresse ni onglets) et s'ajoute à votre Bureau et à votre Menu Démarrer.
4. Fais un **clic droit sur l'icône dans la barre des tâches en bas** -> **« Épingler à la barre des tâches »**.

### Option 2 : Script d'installation automatique Windows

Pour installer automatiquement le raccourci avec l'icône officielle Vert Sapin sur votre Bureau et dans votre Menu Démarrer :

- **Via le script prêt à l'emploi** :
  1. Télécharge le script [`Installer-Merise-EPSI.cmd`](https://raw.githubusercontent.com/Math087a/meriz-epsi/main/Installer-Merise-EPSI.cmd) (ou depuis la [Release v1.7.3](https://github.com/Math087a/meriz-epsi/releases/tag/v1.7.3)).
  2. Double-clique dessus : il configure instantanément l'application et la démarre.
  3. Fais un **clic droit sur l'icône dans la barre des tâches en bas** -> **« Épingler à la barre des tâches »**.

- **Ou en 1 ligne dans PowerShell** :
  ```powershell
  irm https://raw.githubusercontent.com/Math087a/meriz-epsi/main/install.ps1 | iex
  ```

---

## Fonctionnalités clés

- **Identité visuelle Vert Sapin** : palette sombre végétale (#161b18 / #111513) calquée sur le thème Obsidian EPSI, complétée par un mode clair pour les projections en classe.
- **Bouton bascule clair / sombre direct** : switch compact Soleil/Lune dans la barre d'outils pour alterner d'un clic entre les deux modes.
- **Logo MCD iconique** : représentation symbolique authentique de deux entités reliées à une association centrale par des pattes de cardinalités.
- **Import direct et rétro-ingénierie JMerise (.mcd)** : ouvre et convertit instantanément les fichiers de TP au format binaire JMerise sans exécuter Java.
- **Support natif Microsoft SQL Server (T-SQL)** : génération de scripts DDL conformes avec syntaxe à crochets `[nom]`, `IDENTITY(1,1)`, contraintes nommées et catalogue étendu (`MONEY`, `TINYINT`, `BIT`, `DATETIME2`, `UNIQUEIDENTIFIER`). Compatible également MySQL et PostgreSQL.
- **Héritage et spécialisation formelle** : support complet des contraintes Merise d'héritage (Aucune, Disjonction `X`, Totalité `T`, Partition `XT`) et règles de passage automatique en tables relationnelles MLD.
- **Post-its interactifs à double mode** : insertion de mémos sur le canevas avec un mode texte libre ou un mode de calcul dynamique du MLD textuel synchronisé en temps réel.
- **Bibliothèque d'exemples inclus** : modèles de TP prêts à l'emploi accessibles directement dans le dossier `examples/`.

---

## Architecture logicielle

L'organisation du dépôt s'inspire des principes de l'artisanat logiciel (Software Craftsmanship) et de la Clean Architecture.

Consultez le document technique détaillé : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```text
merise-epsi/
|-- docs/                  # Documentation technique et principes d'architecture
|-- examples/              # Modeles Merise et cas d'etudes pedagogiques (JSON)
|-- public/                # Ressources statiques et manifeste PWA
|-- src/
|   |-- canvas/            # Moteur de graphe React Flow (entites, associations, pattes, heritage)
|   |-- components/        # Couche de presentation (TopBar, switch de theme, inspecteurs)
|   |-- i18n/              # Gestion du bilinguisme (francais / anglais)
|   |-- lib/               # Services d'infrastructure (parseur JMerise, stockage, exports)
|   `-- model/             # Coeur metier Merise (MCD, passage MLD, MPD, generation T-SQL)
|-- tests/                 # 82 suites de tests unitaires automatises sous Vitest
|-- install.ps1            # Script d'installation applicatif PowerShell
|-- Installer-Merise-EPSI.cmd # Script d'installation automatique Windows
|-- package.json           # Dependances npm et scripts
`-- README.md              # Ce document
```

---

## Guide pour les contributeurs

### Prérequis
- Node.js (version 20 ou supérieure)
- npm (version 10 ou supérieure)

### Commandes utiles
```bash
# Installer les dépendances
npm install

# Lancer en mode développement web
npm run dev

# Exécuter les tests automatisés (1071 tests unitaires)
npm test

# Compiler pour la production web
npm run build
```

---

## Licence et crédits

Ce logiciel est distribué sous licence libre **GNU Affero General Public License v3 (AGPL-3.0-only)**. Consultez le fichier [LICENSE](LICENSE) pour plus de détails.

- **Adaptation & extensions EPSI** : Math087a ([dépôt GitHub](https://github.com/Math087a/meriz-epsi)).
- **Logiciel d'origine Meriz** : conçu et développé par Yassine Daif ([dépôt GitHub amont](https://github.com/Yassine-Daif/meriz)).
