# DevShop Catalogue

Application web de gestion d'un catalogue de produits, développée par l'équipe dev.

**État actuel :** le code fonctionne sur les postes des développeurs. Il n'y a ni conteneurisation, ni pipeline CI/CD, ni procédure de déploiement. C'est le travail de l'équipe DevOps (voir `DEVOPS-MISSIONS.md`).

## Architecture applicative

```
Navigateur ──► Frontend React (fichiers statiques après build)
                    │  appels /api/*
                    ▼
               Backend Node.js / Express (port 3000)
                    │                 │
                    ▼                 ▼
              PostgreSQL 16     Redis 7 (cache optionnel)
```

## Prérequis (poste de développement)

- Node.js 20 ou plus
- PostgreSQL 16 (base `devshop`, utilisateur `devshop`, mot de passe `devshop`)
- Redis 7 (optionnel : sans lui, l'API fonctionne sans cache)

## Lancer en local

### Backend

```bash
cd backend
npm install
export DATABASE_URL=postgres://devshop:devshop@localhost:5432/devshop
export REDIS_URL=redis://localhost:6379      # optionnel
npm run db:init                               # crée la table et des données d'exemple
npm run dev                                   # http://localhost:3000/api/health
```

### Frontend

```bash
cd frontend
npm install
npm run dev                                   # http://localhost:5173
```

En développement, Vite relaie automatiquement `/api` vers `localhost:3000`.

## Tests

```bash
cd backend
npm test
```

## Variables d'environnement du backend

| Variable       | Obligatoire | Défaut                                              | Rôle                          |
|----------------|-------------|-----------------------------------------------------|-------------------------------|
| `PORT`         | non         | `3000`                                              | Port d'écoute de l'API        |
| `DATABASE_URL` | oui en prod | `postgres://devshop:devshop@localhost:5432/devshop` | Connexion PostgreSQL          |
| `REDIS_URL`    | non         | (cache désactivé)                                   | Connexion Redis               |

## Build du frontend

```bash
cd frontend
npm run build        # génère frontend/dist/
```

Le dossier `dist/` contient des fichiers statiques. En production, un serveur web doit les servir et relayer les requêtes `/api/*` vers le backend (le frontend appelle toujours des URL relatives `/api/...`).

## API

| Méthode | Route                 | Description                                  |
|---------|-----------------------|----------------------------------------------|
| GET     | `/api/health`         | État de l'API, de la base et du cache        |
| GET     | `/api/products`       | Liste des produits (en-tête `X-Cache` HIT/MISS) |
| POST    | `/api/products`       | Crée un produit `{ name, price, stock }`     |
| DELETE  | `/api/products/:id`   | Supprime un produit                          |

## Notes de l'équipe dev

- L'API ne crée pas la table au démarrage : il faut lancer `npm run db:init` (ou appliquer `backend/db/init.sql`) une fois sur une base vide.
- Si Redis est injoignable, l'API continue de répondre depuis la base.
- Le script `db/init.sql` peut être rejoué sans risque (il ne duplique pas les données).
