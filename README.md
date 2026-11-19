# Merise - EPSI Edition

Environnement moderne de modélisation Merise (MCD, MLD, MPD, SQL Server T-SQL) conçu pour les étudiants et intervenants de l'EPSI (B1, B2, B3).

Merise EPSI Edition remplace avantageusement les outils historiques tels que JMerise ou AnalyseSI par une expérience fluide, un thème Vert Sapin soigné et des fonctionnalités directement adaptées aux cursus informatiques.

---

## Deux façons de l'utiliser

### 1. Version Web & PWA (Installation instantanée en 1 clic)

L'application est accessible directement en ligne avec un support hors-ligne complet (PWA) :

**Accéder à l'application en ligne : https://math087a.github.io/meriz-epsi/**

- **Installation comme une vraie application** : ouvre le lien dans Microsoft Edge, Google Chrome ou Brave, puis clique sur l'icône **« Installer »** dans la barre d'adresse.
- **Avantages majeurs** : 0 Mo d'archive lourde à télécharger, démarrage instantané en 0,2 seconde, zéro avertissement SmartScreen de Windows, et fonctionnement 100 % garanti sur les postes de l'EPSI sans droits administrateur.

### 2. Application de bureau Windows (Tauri Setup.exe - 2.3 Mo)

Pour ceux qui souhaitent un installateur `.exe` classique sans la lourdeur d'Electron (2.3 Mo au lieu de 150 Mo) :

- Rendez-vous sur la page des [Releases officielles sur GitHub](https://github.com/Math087a/meriz-epsi/releases/tag/v1.7.3).
- Téléchargez l'installateur Windows officiel [`Merise.EPSI.Edition_1.7.3_x64-setup.exe`](https://github.com/Math087a/meriz-epsi/releases/download/v1.7.3/Merise.EPSI.Edition_1.7.3_x64-setup.exe).
- Double-cliquez pour installer automatiquement l'application dans votre menu Démarrer et sur votre Bureau.
- *Note SmartScreen* : comme tout binaire open-source sans certificat d'entreprise payant, cliquez sur « Informations complémentaires » puis « Exécuter quand même » au premier lancement.

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
|-- src-tauri/             # Runtime desktop leger Windows / WebView2 (Rust)
|-- tests/                 # 82 suites de tests unitaires automatises sous Vitest
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
