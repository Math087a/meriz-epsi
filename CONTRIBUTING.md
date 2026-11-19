# Guide de contribution au projet Merise EPSI Edition

Ce guide s'adresse aux developpeurs souhaitant modifier le code source, executer les tests en local ou proposer des ameliorations.

---

## Prerequis de developpement

- **Node.js** : version 20 ou superieure
- **npm** : version 10 ou superieure
- **Git**

*(Ces prerequis concernent uniquement les developpeurs du code source. Les utilisateurs finaux, etudiants et enseignants n'ont besoin d'aucun de ces logiciels pour utiliser l'application).*

---

## Commandes de developpement

```bash
# 1. Cloner le depot
git clone https://github.com/Math087a/meriz-epsi.git
cd meriz-epsi

# 2. Installer les dependances
npm install

# 3. Lancer le serveur de developpement local
npm run dev

# 4. Executer l'ensemble des tests unitaires (1071 tests sous Vitest)
npm test

# 5. Compiler la version web de production
npm run build
```

---

## Architecture logicielle

Consultez le document technique detaille : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
