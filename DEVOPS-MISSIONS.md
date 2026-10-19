# Cahier de missions DevOps : DevShop Catalogue

## Contexte

Vous venez d'être recruté comme **ingénieur DevOps**. L'équipe de développement vous livre ce dépôt : une application qui marche sur leurs postes, mais qui n'a jamais été industrialisée. Il n'y a ni Dockerfile, ni Compose, ni CI/CD, ni historique Git propre.

Votre travail : transformer ce code brut en un projet **versionné, conteneurisé, testé automatiquement et livrable**. Les développeurs ne doivent presque pas avoir à modifier le code applicatif (si vous devez le faire, justifiez-le dans une Pull Request).

**Durée estimée : 6 à 8 h** (à répartir sur plusieurs séances) · **Niveau : intermédiaire**

## Règles de travail

- Une mission = une branche = une Pull Request vers `main`.
- Branches nommées `devops/<mission>` (exemple : `devops/dockerfile-backend`).
- Commits en français ou en anglais, au format `type: description` (`feat:`, `fix:`, `ci:`, `docs:`, `chore:`).
- Aucun secret dans Git : pas de mot de passe, pas de `.env`.
- Chaque mission se termine par une **preuve** (commande + résultat) collée dans la description de la PR.

## Ce que vous devez livrer au final

```
devshop-catalog/
├── backend/Dockerfile, .dockerignore
├── frontend/Dockerfile, .dockerignore, nginx.conf
├── docker-compose.yml
├── .env.example
├── .github/workflows/ci.yml, release.yml
├── .gitignore
└── docs/RUNBOOK.md        (procédure d'exploitation)
```

---

## Mission 0 : Reprise du dépôt (Git / GitHub)

**Ticket.** Mettre le projet sous contrôle de version et sécuriser le dépôt.

À faire :
1. Initialiser le dépôt Git local et renommer `.gitignore.template` en `.gitignore`, puis le compléter (`dist/`, `.env`, logs, fichiers d'éditeur, etc.).
2. Premier commit : `chore: import initial du code livré par l'équipe dev`.
3. Créer un dépôt GitHub **privé** `devshop-catalog` et pousser `main`.
4. Sur GitHub, protéger `main` : Pull Request obligatoire, pas de push direct, au moins une approbation si vous êtes en binôme.
5. Ajouter un modèle de Pull Request (`.github/pull_request_template.md`) avec : objectif, preuve de test, risques.
6. Créer les issues correspondant aux missions 1 à 6 et les ranger dans un Project GitHub (Kanban : À faire / En cours / Terminé).

**Critères d'acceptation**
- `git status` ne montre jamais `node_modules/`, `dist/` ni `.env`.
- Impossible de pousser directement sur `main`.
- Les 6 issues existent et sont liées aux PR (`Closes #n`).

---

## Mission 1 : Conteneuriser le backend (Docker)

**Ticket.** Produire l'image Docker de l'API.

À faire :
1. Écrire `backend/Dockerfile` (Node 20, image légère).
2. Écrire `backend/.dockerignore`.
3. Construire et tester l'image **sans Compose**, avec un PostgreSQL lancé séparément dans un réseau Docker dédié (`docker network create`).
4. Appliquer `db/init.sql` sur cette base.

**Critères d'acceptation**
- `curl http://localhost:3000/api/health` renvoie `database: "up"`.
- Le build ne réinstalle pas les dépendances quand seul `src/` change (ordre des couches).
- L'image n'embarque ni `node_modules` de votre poste, ni `.git`, ni `.env`.
- Le conteneur ne tourne **pas en root**.

**Indices.** Copiez `package*.json` avant le code. `npm ci --omit=dev` est reproductible. L'image Node officielle fournit un utilisateur `node`.

---

## Mission 2 : Conteneuriser le frontend (Docker multi-stage)

**Ticket.** Produire l'image du frontend, servie par nginx.

À faire :
1. Écrire `frontend/Dockerfile` en **deux étapes** : build avec Node, puis service des fichiers statiques avec `nginx:alpine`.
2. Écrire `frontend/nginx.conf` : servir l'application (avec repli sur `index.html`) et relayer `/api/` vers le backend.
3. Écrire `frontend/.dockerignore`.

**Critères d'acceptation**
- L'image finale ne contient pas Node ni les sources.
- Sa taille est nettement inférieure à celle de l'image de build (comparez avec `docker images`).
- Une requête `/api/products` envoyée au frontend atteint bien le backend.

**Indices.** Dans un réseau Docker, le backend est joignable par le nom de son conteneur ou de son service. Le frontend appelle des URL relatives : c'est nginx qui fait le lien.

---

## Mission 3 : Orchestrer avec Docker Compose

**Ticket.** Lancer toute l'application en une commande : `docker compose up`.

À faire :
1. Écrire `docker-compose.yml` avec quatre services : `frontend`, `backend`, `db` (PostgreSQL 16), `cache` (Redis 7).
2. Seul le frontend est exposé à l'extérieur (port 8080). La base et Redis ne sont pas accessibles depuis l'hôte.
3. Persister les données PostgreSQL dans un volume nommé.
4. Initialiser automatiquement la base avec `db/init.sql` au premier démarrage.
5. Ajouter des **healthchecks** (`db`, `cache`, `backend`) et des `depends_on` avec condition de santé.
6. Sortir tous les secrets dans un `.env` ignoré par Git, et fournir un `.env.example`.
7. Configurer une politique de redémarrage.

**Critères d'acceptation**
- Sur une machine propre : `cp .env.example .env && docker compose up -d --build` suffit pour obtenir l'application sur http://localhost:8080.
- Les données survivent à `docker compose down` puis `up`, et disparaissent avec `down -v`.
- `docker compose ps` affiche les services `healthy`.
- `docker compose config` ne contient aucun mot de passe en dur dans le fichier versionné.

**Indices.** Le dossier `/docker-entrypoint-initdb.d/` de l'image PostgreSQL exécute les scripts SQL au premier démarrage. L'URL de la base s'écrit avec le **nom du service** comme hôte.

---

## Mission 4 : Intégration continue (GitHub Actions)

**Ticket.** À chaque Pull Request, vérifier automatiquement le code et les images.

À faire :
1. Créer `.github/workflows/ci.yml`, déclenché sur les Pull Requests et les pushs sur `main`.
2. Job `test-backend` : installer Node 20, `npm ci`, `npm test`, avec cache des dépendances.
3. Job `build-frontend` : `npm ci` et `npm run build`.
4. Job `docker-build` : construire les deux images (sans les publier).
5. Job `compose-smoke-test` : lancer la stack avec Compose, attendre qu'elle soit saine, appeler `/api/health` via `curl`, puis tout arrêter.
6. Rendre ces jobs **obligatoires** pour fusionner dans `main` (règle de protection de branche).

**Critères d'acceptation**
- Une PR avec un test cassé est bloquée.
- Un `Dockerfile` invalide fait échouer le job `docker-build`.
- Le temps de la CI est raisonnable grâce aux caches (Node et couches Docker).

**Indices.** `actions/checkout`, `actions/setup-node` (option `cache: npm`), `docker/setup-buildx-action`, `docker/build-push-action` (avec `push: false`). Dans un workflow, `docker compose up --wait` attend les healthchecks.

---

## Mission 5 : Livraison continue (GHCR + tags de version)

**Ticket.** Publier automatiquement les images à chaque version.

À faire :
1. Créer `.github/workflows/release.yml`, déclenché par un tag `v*.*.*`.
2. Se connecter à **GitHub Container Registry** (`ghcr.io`) avec le `GITHUB_TOKEN` (permissions minimales : `contents: read`, `packages: write`).
3. Publier `devshop-backend` et `devshop-frontend` avec les tags `1.2.3`, `1.2` et `latest`.
4. Créer une GitHub Release avec notes générées automatiquement.
5. Ajouter un `docker-compose.prod.yml` qui utilise les images publiées au lieu de construire.

**Critères d'acceptation**
- `git tag v1.0.0 && git push origin v1.0.0` publie les deux images.
- Sur une machine vierge : `docker compose -f docker-compose.prod.yml up -d` démarre l'application sans cloner le code.
- Aucun mot de passe personnel n'est utilisé dans le workflow.

---

## Mission 6 : Durcissement et exploitation

**Ticket.** Rendre la solution fiable et documentée.

À faire :
1. Analyser les images avec un scanner de vulnérabilités (Trivy) en local, puis dans la CI (échec sur gravité `CRITICAL`).
2. Fixer des versions précises d'images (pas de `latest` pour la base ni Redis).
3. Limiter les ressources des conteneurs (`mem_limit` ou `deploy.resources`).
4. Configurer la rotation des logs (`logging` du driver `json-file`).
5. Écrire `docs/RUNBOOK.md` : démarrage, arrêt, sauvegarde et restauration de la base, mise à jour d'une version, retour arrière, résolution des pannes courantes.
6. Mettre en place une sauvegarde : `pg_dump` dans un conteneur, restauration testée sur une base vide.

**Critères d'acceptation**
- Le RUNBOOK permet à une personne qui ne connaît pas le projet de le relancer.
- Une sauvegarde est restaurée avec succès, avec preuve (nombre de lignes avant et après).

---

## Mission bonus : Scénarios de pannes

Provoquez chaque panne, observez, documentez la cause et la correction dans le RUNBOOK.

| # | Panne à provoquer                                              | Question                                                            |
|---|----------------------------------------------------------------|---------------------------------------------------------------------|
| 1 | `docker compose stop cache`                                    | L'application continue-t-elle de fonctionner ? Que dit `/api/health` ? |
| 2 | `docker compose stop db`, puis redémarrage                     | Combien de temps avant le retour à la normale ? Pourquoi ?          |
| 3 | Changer `POSTGRES_PASSWORD` dans `.env` sans `down -v`         | Pourquoi l'API ne se connecte-t-elle plus ? Comment réparer sans perdre les données ? |
| 4 | Supprimer `db/init.sql` du montage                             | Que se passe-t-il sur une base neuve ? Sur une base existante ?      |
| 5 | Pousser un test cassé dans une PR                              | Que montre GitHub ? La fusion est-elle possible ?                    |
| 6 | Remplir le disque avec les logs (simulation)                   | Quelle configuration l'aurait évité ?                                |

---

## Grille d'évaluation (/40)

| Mission                                               | Points |
|-------------------------------------------------------|--------|
| 0 : Dépôt, protection de `main`, issues, PR template   | 5      |
| 1 : Image backend (légère, non-root, cache de couches) | 6      |
| 2 : Image frontend multi-stage + nginx                 | 5      |
| 3 : Compose complet (healthchecks, volumes, secrets)   | 8      |
| 4 : CI GitHub Actions (tests, builds, smoke test)      | 7      |
| 5 : Release GHCR et compose de production              | 5      |
| 6 : Durcissement, RUNBOOK, sauvegarde testée           | 4      |
| Bonus : scénarios de pannes documentés                 | +4     |

Qualité transversale (historique Git lisible, PR bien décrites, aucun secret versionné) : jusqu'à 3 points de pénalité en cas de manquement.

## Pour aller plus loin

- Ajouter un reverse proxy Traefik ou Caddy avec HTTPS automatique.
- Déployer sur un serveur (VPS) via SSH depuis GitHub Actions.
- Ajouter une stack d'observabilité (Prometheus, Grafana) via Compose.
- Passer à Kubernetes (kind ou minikube) en convertissant le Compose.
