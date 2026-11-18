# Meriz - EPSI Edition

Environnement moderne de modélisation Merise (MCD, MLD, MPD, SQL Server T-SQL) conçu pour les étudiants et intervenants de l'EPSI (B1, B2, B3).

Meriz EPSI Edition remplace avantageusement les outils historiques tels que JMerise ou AnalyseSI par une expérience fluide, réactive et conforme aux exigences pédagogiques et professionnelles actuelles.

---

## Téléchargement rapide (Windows 64 bits)

La version desktop autonome pour Windows est disponible directement sans installation complexe ni dépendance externe.

[Télécharger Meriz EPSI Edition v1.7.3 (Archive ZIP - 120 Mo)](https://github.com/Math087a/meriz-epsi/releases/download/v1.7.3/Meriz-EPSI-Edition-Windows-x64.zip)

### Guide de lancement en 3 etapes

1. **Telecharger l'archive** : clique sur le lien ci-dessus pour recuperer `Meriz-EPSI-Edition-Windows-x64.zip`.
2. **Extraire les fichiers** : fais un clic droit sur le fichier zip telecharge puis choisis « Extraire tout » vers l'emplacement de ton choix (par exemple dans `Documents` ou `Applications`).
3. **Lancer l'application** :
   - Ouvre le dossier extrait et double-clique directement sur `Meriz EPSI Edition.exe`.
   - *Optionnel* : double-clique sur `Installer-Meriz.cmd` pour creer automatiquement un raccourci dans ton menu Demarrer Windows.

> **Aucun environnement Java (JRE/JDK) n'est requis.** L'application s'execute nativement sous Windows via un runtime optimise.

---

## Pourquoi Meriz EPSI Edition ?

Concu specifiquement pour les travaux pratiques et projets de bases de donnees a l'EPSI, Meriz integre des fonctionnalites avancees qui repondent aux limites des outils traditionnels :

- **Import direct et retro-ingenierie JMerise (.mcd)** : ouvre et convertit instantanement les fichiers de TP au format binaire JMerise sans lancer Java.
- **Support natif Microsoft SQL Server (T-SQL)** : generation de scripts DDL conformes avec syntaxe a crochets `[nom]`, `IDENTITY(1,1)`, contraintes d'integrite nommees et catalogue complet de types (`MONEY`, `TINYINT`, `BIT`, `DATETIME2`, `UNIQUEIDENTIFIER`). Egalement compatible MySQL et PostgreSQL.
- **Heritage et specialisation formelle** : support complet des contraintes Merise d'heritage (Aucune, Disjonction `X`, Totalite `T`, Partition `XT`) et regles de passage automatique en tables relationnelles MLD.
- **Canevas interactif haute performance** : deplacement fluide des entites et associations, calcul automatique des pattes et ancrages, detection visuelle des incoherences.
- **Post-its interactifs a double mode** : insertion de mémos sur le canevas avec un mode texte libre ou un mode de calcul dynamique du MLD textuel synchronise en temps reel.
- **Export d'images vectorielles et PNG nettes** : rendu fidele incluant les cardinalites, les liaisons d'associations et les contraintes.
- **Modeles et exemples inclus** : bibliotheque d'exemples EPSI directement chargeables depuis le dossier `examples/`.

---

## Arborescence du projet

```text
meriz-epsi/
|-- electron/              # Point d'entree et configuration du runtime desktop Electron
|-- examples/              # Exemples et modeles de TP Merise au format JSON
|-- public/                # Assets statiques et manifeste PWA
|-- src/
|   |-- canvas/            # Moteur de graphe React Flow (entites, associations, pattes, heritage)
|   |-- components/        # Composants de l'interface (barre d'outils, inspecteurs, formulaires)
|   |-- i18n/              # Gestion du bilinguisme (francais / anglais)
|   |-- lib/               # Parseur binaire JMerise, convertisseurs, gestion des exports
|   `-- model/             # Coeur metier Merise (MCD, passage MLD, MPD, generation SQL/T-SQL)
|-- tests/                 # 82 suites de tests unitaires et d'integration (1071 tests Vitest)
|-- package.json           # Dependances et scripts de developpement
`-- README.md              # Documentation du projet
```

---

## Guide pour les contributeurs

Pour executer, modifier et tester l'application localement sur ton poste de developpement :

### 1. Prerequis
- Node.js (version 20 ou superieure)
- npm (version 10 ou superieure)

### 2. Installation des dependances
```bash
npm install
```

### 3. Lancer en mode developpement web (Vite)
```bash
npm run dev
```
L'application est accessible dans ton navigateur sur `http://localhost:5173/`.

### 4. Lancer en mode developpement bureau (Electron)
```bash
npm run electron:dev
```

### 5. Executer la suite de tests automatises
```bash
npm test
```
Execute l'ensemble des 1071 tests unitaires sous Vitest.

### 6. Compiler l'application pour la production web
```bash
npm run build
```
Genere les fichiers optimises dans le dossier `dist/`.

---

## Licence

Projet distribue sous licence GNU Affero General Public License v3 (AGPL-3.0-only). Voir le fichier `LICENSE` pour plus de details.
