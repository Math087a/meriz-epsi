# Meriz - EPSI Edition

Meriz EPSI Edition est un environnement professionnel de modélisation de bases de donnees selon la méthode Merise, conçu pour l'apprentissage, l'enseignement et la conception de systèmes d'information aux niveaux B1, B2 et B3 à l'EPSI.

Ce projet constitue une évolution avancée de l'application open-source Merise Meriz, intégrant le support complet des spécificités académiques et industrielles : rétro-ingénierie des projets JMerise, dialecte Microsoft SQL Server (T-SQL), héritage et spécialisation formelle, post-its interactifs avec rendu MLD dynamique, et packaging autonome sous Windows.

---

## Fonctionnalités Clés & Extensions EPSI

### 1. Importateur & Rétro-ingénierie JMerise (.mcd)
- **Compatibilité native** : Ouverture et conversion directe des fichiers binaires `.mcd` issus de JMerise sans nécessiter l'exécution de Java ou d'outils tiers.
- **Décodeur de flux Java Serialization** : Analyse bas niveau du protocole `0xACED 0x0005`, extraction des classes `IhmEntite2`, `IhmRelation2`, `IhmLien2`, des propriétés, des types de données, des cardinalités et des coordonnées graphiques.
- **Remplacement instantané** : Migration transparente des anciens TP Merise (ex. buveur, cinéma, gestion commerciale) vers l'environnement moderne Meriz.

### 2. Moteur Microsoft SQL Server (T-SQL) & Types Étendus
- **Support T-SQL complet** : Génération de scripts DDL adaptés à SQL Server (crochets d'échappement `[colonne]`, auto-incrémentation `IDENTITY(1,1)`, contraintes nommées).
- **Catalogue de types enrichi** : Ajout de `MONEY`, `SMALLMONEY`, `FLOAT`, `DOUBLE`, `REAL`, `CHAR`, `SMALLINT`, `TINYINT`, `BIT`, `DATETIME2`, `DATETIMEOFFSET`, `UNIQUEIDENTIFIER`.
- **Dialectes multiples** : Bascule fluide et instantanée entre MySQL, PostgreSQL et SQL Server, avec vérification des types physiques et rétro-compatibilité Eloquent / Doctrine.

### 3. Héritage & Spécialisation Merise
- **Représentation formelle** : Intégration du triangle de spécialisation Merise orienté vers l'entité mère (sur-type) et relié aux entités filles (sous-types).
- **Contraintes de modélisation** : Sélection rapide de la contrainte associée :
  - **Aucune** : Héritage libre sans contrainte.
  - **X (Disjonction / Exclusion)** : Un sous-type au maximum.
  - **T (Totalité)** : Au moins un sous-type obligatoire.
  - **XT (Partition)** : Exactement un sous-type (disjonction et totalité).
- **Règles de passage MLD automatiques** : Propagation automatique de la clé primaire de l'entité mère vers les tables des entités filles, avec intégrité référentielle (FK pointant vers la PK mère).

### 4. Post-it Interactif sur Canevas (Double Mode)
- **Composant déplaçable** : Ajout libre de cartes mémo repositionnables directement sur le canevas de modélisation.
- **Mode Note Libre** : Prise de notes, consignes d'exercices, hypothèses de gestion ou règles métier.
- **Mode MLD Dynamique** : Calcul et affichage en temps réel de la notation relationnelle textuelle standard (ex. `Client (numeroClient, nom, #id_ville)`) directement sur le schéma, synchronisée à la moindre modification du MCD.

### 5. Associations Réflexives & Ternaires
- **Rôles distincts** : Prise en charge des associations réflexives avec nommage explicite des pattes (ex. tuteur / tutoré, supérieur / subordonné).
- **Génération relationnelle propre** : Préfixage automatique des clés étrangères composées pour éviter les collisions de colonnes.

---

## Architecture Technique

- **Interface utilisateur** : React 19, TypeScript 5.8+, Tailwind CSS v4.
- **Moteur de graphe** : React Flow (@xyflow/react 12).
- **Collaboration & Persistance** : CRDT Yjs avec détection de conflits et synchronisation temps réel.
- **Exécution Desktop** : Electron encapsulant l'application compilée avec isolation de contexte et sandbox de sécurité.
- **Qualité logicielle** : Suite de 82 fichiers de tests et 1040 tests unitaires automatisés sous Vitest.

---

## Installation & Démarrage

### Prérequis
- Node.js (version 20 ou supérieure recommandée)
- npm (version 10 ou supérieure)

### Installation des dépendances
```bash
npm install
```

### Lancement en mode développement web
```bash
npm run dev
```
L'application est accessible localement à l'adresse indiquée (par défaut `http://localhost:5173/`).

### Exécution des tests automatisés
```bash
npm test
```
Lance la suite complète des 1040 tests unitaires (couverture I18n, validation MCD, passage MLD, génération SQL/T-SQL, importateur JMerise).

### Compilation de production web
```bash
npm run build
```
Compile les sources TypeScript et génère les assets optimisés dans le dossier `dist/`.

### Lancement en application de bureau (Electron)
```bash
npm run electron:dev
```

### Génération de l'exécutable Windows (.exe)
```bash
npm run electron:dist
```
L'exécutable autonome est produit dans le répertoire `release/` ou `dist-electron/`.

---

## Structure du Projet

```text
meriz-epsi/
├── electron/
│   └── main.cjs                # Point d'entrée de l'application desktop Electron
├── src/
│   ├── canvas/                 # Composants React Flow (Entités, Associations, Héritage, Post-it, Pattes)
│   ├── components/             # Interface utilisateur, barre d'outils, inspecteurs, sélecteurs
│   ├── i18n/                   # Moteur d'internationalisation bilingue (fr / en)
│   ├── lib/
│   │   ├── jmeriseParser.ts    # Décodeur binaire des fichiers JMerise (.mcd)
│   │   └── importFile.ts       # Gestionnaire universel d'importation de documents
│   └── model/                  # Cœur métier Merise (MCD, MLD, MPD, SQL, T-SQL, Yjs, Réducteurs)
├── tests/                      # Suites de tests de conformité, d'importation et de non-régression
├── package.json
└── README.md
```

---

## Licence

Ce projet est distribué sous licence GNU Affero General Public License v3 (AGPL-3.0-only).
Consultez le fichier `LICENSE` pour plus de détails.
