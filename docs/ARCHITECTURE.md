# Architecture de Merise EPSI Edition

Ce document decrit l'organisation architecturale et la structure des dossiers de Merise EPSI Edition. Cette structure s'inspire des principes de l'artisanat logiciel (Software Craftsmanship), de la Clean Architecture et des standards d'organisation issus du monde Unix/Linux (FHS - Filesystem Hierarchy Standard).

---

## 1. Principes directeurs

1. **Separation des responsabilites (Separation of Concerns)** :
   - Le coeur metier Merise (calculs, passage MLD, SQL) ne depend d'aucun composant d'interface utilisateur.
   - L'interface graphique (React) n'effectue aucun calcul relationnel directement : elle consomme les fonctions pures du domaine.
2. **Lisibilite humaine** :
   - Chaque fichier et dossier a une fonction unique, explicite et previsible.
   - La racine du depot reste depouillee des fichiers temporaires ou des artefacts generes.
3. **Portabilite & modularite** :
   - Le coeur applicatif s'execute a l'identique dans le navigateur web (PWA) et en mode application de bureau autonome epinglable a la barre des taches.

---

## 2. Arborescence generale du depot

```text
merise-epsi/
|-- .github/               # Pipelines d'integration continue (deploiement GitHub Pages)
|   `-- workflows/         # Workflow de compilation et de publication web
|-- docs/                  # Documentation technique et guides d'architecture
|-- examples/              # Modeles Merise et cas d'etudes pedagogiques (JSON)
|-- public/                # Ressources statiques servies directement (manifest, favicons)
|-- scripts/               # Utilitaires de conversion et d'automatisation locale
|-- src/                   # Code source principal de l'application (TypeScript / React)
|   |-- assets/            # Polices de caracteres et ressources graphiques embarquees
|   |-- canvas/            # Composants React Flow (entites, associations, pattes, heritage)
|   |-- components/        # Couche de presentation (TopBar, inspecteurs, formulaires, dialogs)
|   |   `-- ui/            # Composants graphiques atomiques et reutilisables (Switch, Button)
|   |-- design/            # Regles de contraste et design system
|   |-- i18n/              # Moteur d'internationalisation et catalogues de langues
|   |-- lib/               # Services d'infrastructure (parseur JMerise, stockage, exports)
|   `-- model/             # Coeur metier Merise (MCD, passage MLD, MPD, generation T-SQL)
|-- tests/                 # Suites de validation, tests d'integration et non-regression
|-- index.html             # Point d'entree HTML unique de l'application SPA
|-- install.ps1            # Script d'installation du raccourci applicatif Windows (PowerShell)
|-- Installer-Merise-EPSI.cmd # Script d'installation automatique Windows (1 clic)
|-- package.json           # Declarations des dependances npm et scripts de developpement
`-- README.md              # Guide d'accueil, installation et prise en main rapide
```

---

## 3. Les couches logiques de `src/`

```text
[Couche Presentation : src/components & src/canvas]
                     |
                     v
   [Couche Metier Pur : src/model]
   (MCD, regles de passage MLD, MPD, T-SQL)
                     ^
                     |
[Couche Infrastructure : src/lib & src/i18n]
(Parseur binaire JMerise, stockage local, exports PNG)
```

- **`src/model/` (Domaine pur)** :
  Ne contient aucune reference a React ou au DOM. Les fonctions recoivent un graphe Merise et produisent de maniere deterministe le dictionnaire des donnees, les tables relationnelles du MLD et le script SQL/T-SQL. Cette purete garantit que les 1071 tests unitaires s'executent en moins de 2 secondes.
- **`src/canvas/` (Moteur visuel)** :
  Composants specifiques a React Flow (@xyflow/react) pour afficher visuellement les noeuds entites, les ellipses d'associations, les angles de cardinalites et le triangle de specialisation/heritage.
- **`src/components/` (Interface utilisateur)** :
  Gere la navigation, la barre d'outils superieure, le basculement de theme sombre Vert Sapin / clair, et les inspecteurs d'edition lateraux.
- **`src/lib/` (Infrastructure)** :
  Convertit les formats de donnees externes (comme le flux binaire de JMerise `jmeriseParser.ts`), assure la persistance sur le stockage du navigateur et pilote le moteur d'exportation d'images.
