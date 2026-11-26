# Merise - EPSI Edition

Environnement moderne de modélisation Merise (MCD, MLD, MPD, SQL Server T-SQL) conçu pour les étudiants et intervenants de l'EPSI (B1, B2, B3).

Merise EPSI Edition remplace avantageusement les outils historiques tels que JMerise ou AnalyseSI par une expérience fluide, un thème Vert Sapin soigné et des fonctionnalités directement adaptées aux cursus informatiques.

> [!IMPORTANT]
> **Zéro installation, zéro prérequis (aucun Java, aucun Node.js requis sur votre poste)**.
> Pour les étudiants et intervenants, Merise EPSI Edition s'exécute directement dans votre navigateur web habituel ou en application autonome sur votre Bureau, sans nécessiter de droits administrateur.

---

## Les deux versions disponibles

Ce dépôt déploie automatiquement **deux versions complémentaires** sur GitHub Pages, chacune adaptée à un contexte pédagogique précis :

| Version | Adresse d'accès | Thème visuel | À quoi elle sert |
| :--- | :--- | :--- | :--- |
| **Version Standard** | https://math087a.github.io/meriz-epsi/ | **Vert Sapin** | **Cours, TP et projets** : outil complet avec dictionnaire des données, MCD, héritage (X, T, XT), passage automatique en MLD, MPD, génération SQL (T-SQL, MySQL, PostgreSQL) et post-its MLD dynamique. |
| **Version Mode Contrôle** | https://math087a.github.io/meriz-epsi/controle/ | **Rouge Contrôle** | **Évaluations et examens en classe** : identique pour dessiner le MCD et gérer le dictionnaire, l'héritage, l'import JMerise (`.mcd`) et l'export PNG, mais **toute génération automatique (MLD, MPD, SQL, code et post-its MLD dynamique) est désactivée**. Le thème rouge vif permet au surveillant de vérifier d'un coup d'œil qu'aucun outil de génération n'est utilisé. |

---

## Comment l'installer sur votre PC (Barre des tâches & Bureau)

### Option 1 : Installation directe en 1 clic via le navigateur (Recommandée)

L'application est disponible immédiatement sans aucun téléchargement lourd :

**Accéder à l'application : https://math087a.github.io/meriz-epsi/**

1. Ouvre l'adresse dans **Microsoft Edge**, **Google Chrome** ou **Brave**.
2. Clique sur l'icône **« Installer l'application »** située tout à droite dans la barre d'adresse (ou menu 3 points -> *Applications* -> *Installer Merise EPSI Edition*).
3. L'application s'ouvre immédiatement dans sa propre fenêtre autonome (sans barre d'adresse ni onglets) et s'ajoute à votre Bureau et à votre Menu Démarrer.
4. Fais un **clic droit sur l'icône dans la barre des tâches en bas** -> **« Épingler à la barre des tâches »**.

### Option 2 : Installation en 1 commande dans le terminal (cmd ou PowerShell)

Pour créer directement le raccourci sur votre Bureau et dans votre Menu Démarrer avec le logo officiel :

1. Ouvrez l'**Invite de commandes (cmd)** ou **PowerShell** (Touche Windows puis tapez `cmd` ou `powershell`).
2. Copiez et collez la commande correspondant à la version souhaitée, puis appuyez sur Entrée :

- **Version Standard (Vert Sapin)** :
```cmd
powershell -Command "irm https://raw.githubusercontent.com/Math087a/meriz-epsi/main/scripts/install.ps1 | iex"
```

- **Version Mode Contrôle / Examen (Rouge Contrôle)** :
```cmd
powershell -Command "irm https://raw.githubusercontent.com/Math087a/meriz-epsi/main/scripts/install-controle.ps1 | iex"
```

3. L'application démarre instantanément en fenêtre autonome.
4. Fais un **clic droit sur l'icône dans la barre des tâches en bas** -> **« Épingler à la barre des tâches »**.

> Cette méthode exécutée directement dans le terminal ne télécharge aucun fichier exécutable non signé, et ne déclenche donc aucun blocage de Windows SmartScreen ou du Contrôle intelligent des applications.

---

## Fonctionnalités

- **Modélisation conceptuelle (MCD)** : création visuelle et fluide d'entités, d'associations, d'attributs, de clés primaires et de cardinalités (0,1 / 1,1 / 0,n / 1,n).
- **Passage automatique au modèle relationnel (MLD)** : dérivation dynamique et instantanée des tables relationnelles selon les règles formelles de normalisation Merise (gestion des clés étrangères, tables d'association n:n).
- **Génération SQL multi-SGBD** : production de scripts DDL prêts à l'exécution pour **Microsoft SQL Server (T-SQL)**, **MySQL** et **PostgreSQL** (contraintes `PRIMARY KEY`, `FOREIGN KEY`, types de données natifs).
- **Héritage et spécialisation formelle** : support complet des contraintes Merise d'héritage (Aucune, Disjonction `X`, Totalité `T`, Partition `XT`) et dérivation automatique vers le modèle relationnel.
- **Rétro-ingénierie et import JMerise (.mcd)** : ouverture et conversion directe des fichiers de TP existants au format binaire JMerise sans nécessiter d'environnement Java.
- **Dictionnaire des données centralisé** : vue d'ensemble et recherche sur toutes les propriétés du modèle pour éliminer les doublons et harmoniser les types.
- **Collaboration en temps réel** : travail à plusieurs en direct sur un même schéma pour faciliter les projets et ateliers de groupe.
- **Export haute fidélité pour les rendus** : exportation du schéma en PNG haute résolution et génération du script SQL pour une intégration directe dans les rapports de TP.

---

## Architecture logicielle

L'organisation du dépôt s'inspire des principes de l'artisanat logiciel (Software Craftsmanship) et de la Clean Architecture.

Consultez le document technique détaillé : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```text
merise-epsi/
|-- docs/                  # Documentation technique et principes d'architecture
|-- examples/              # Modeles Merise et cas d'etudes pedagogiques (JSON)
|-- public/                # Ressources statiques et manifeste PWA
|-- scripts/               # Scripts d'installation et d'automatisation
|-- src/
|   |-- canvas/            # Moteur de graphe React Flow (entites, associations, pattes, heritage)
|   |-- components/        # Couche de presentation (TopBar, switch de theme, inspecteurs)
|   |-- i18n/              # Gestion du bilinguisme (francais / anglais)
|   |-- lib/               # Services d'infrastructure (parseur JMerise, stockage, exports)
|   `-- model/             # Coeur metier Merise (MCD, passage MLD, MPD, generation T-SQL)
|-- tests/                 # 82 suites de tests unitaires automatises sous Vitest
|-- CONTRIBUTING.md        # Guide technique pour les contributeurs et developpeurs
|-- package.json           # Dependances npm et scripts
`-- README.md              # Ce document
```

---

## Développement & contribution

Ce projet est open-source sous licence libre **GNU AGPL-3.0**. Si vous souhaitez modifier le code source, exécuter la suite de tests ou compiler l'application en local, consultez le [Guide pour les contributeurs (CONTRIBUTING.md)](CONTRIBUTING.md).

---

## Licence et crédits

Ce logiciel est distribué sous licence libre **GNU Affero General Public License v3 (AGPL-3.0-only)**. Consultez le fichier [LICENSE](LICENSE) pour plus de détails.

- **Adaptation & extensions EPSI** : Math087a ([dépôt GitHub](https://github.com/Math087a/meriz-epsi)).
- **Logiciel d'origine Meriz** : conçu et développé par Yassine Daif ([dépôt GitHub amont](https://github.com/Yassine-Daif/meriz)).
