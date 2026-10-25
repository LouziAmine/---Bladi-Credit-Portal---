# Démo GitHub Pages — avancement

Branche : `release/2.1.0-demo` (à partir de `release/2.1.0`).
But : faire tourner le front **sans backend Java** pour déployer une démo sur GitHub Pages,
avec une fidélité **maximale** au backend Spring (`../---Credit-Bladi---`). Les testeurs
(PO, Scrum Master, Manager) se connectent et manipulent le cheminement complet d'un dossier
via l'URL GitHub Pages.

## Principe technique
- Un **faux backend** = un interceptor Angular placé en dernier dans la chaîne
  (`authInterceptor, languageInterceptor, errorInterceptor, fakeBackendInterceptor`).
  Il court-circuite le vrai réseau et renvoie les mêmes JSON / codes HTTP que Spring.
- Données persistées dans **IndexedDB** (survivent au rafraîchissement, par navigateur).
- Activé **uniquement** avec `ng build --configuration demo` (fileReplacement). Jamais en prod.
- Logique métier portée fidèlement de Java vers TypeScript, organisée comme les packages Spring.

## Comptes de démo (mot de passe en clair, choisis pour la démo)
- `admin` / `admin123` — MANAGER (comme les tests e2e du back)
- Les 26 comptes manager seedés (amine.louzi, sara.bennani, ...) : mdp `demo123`
- Clients : créés via invitation pendant la démo.

## Référence backend (inventaire)
- 89 endpoints, ~25 domaines. Rôles : MANAGER, CLIENT.
- Seed de référence dans `../---Credit-Bladi---/src/main/resources/db/changelog/db.changelog-master.yaml`
  (grades x10, teams x7, process x13, steps x21, workflows x3, workflow_process,
   workflow_process_step, activity_sectors, document_suggestions, credit_rate,
   bam_parameters, mourabaha_parameters, enterprise_credit_parameters).
- Users dev seedés : changeset `002-seed-dev-users` (26 MANAGER).

## État des tranches
Légende : [ ] à faire  [~] en cours  [x] fait

### Socle
- [x] environment.demo.ts + angular.json config `demo` + base href GitHub Pages (`/---Bladi-Credit-Portal---/`)
- [x] IndexedDB (core/demo-db.ts : stores par table, séquences d'ID, reset)
- [x] http-responses (core/demo-result.ts : ok/created/noContent/badRequest/unauthorized/forbidden/notFound/conflict + ApiError CB-<status>)
- [x] fake-session (core/demo-session.ts : session persistée IndexedDB) + demo-context (requireAuth/Manager/Client)
- [x] routeur (core/demo-router.ts : match pattern :param, dispatch, erreurs) + fake-backend.ts (seed + enregistrement routes)
- [x] demo.providers.ts (interceptor, import dynamique -> chunk séparé, branché en dernier dans app.config)
- [x] 404.html fallback (copie de index.html par le workflow Pages)
- [x] demo-banner (bandeau démo : reset + comptes + boîte de réception des invitations) — demo/demo-banner/
- [~] seed/ porté du changelog (fait : users 26, grades 10, teams 7 ; reste : process/steps/workflows, paramètres, secteurs, suggestions, données de démo)

**Validé** : build `ng build --configuration demo` OK (chunk fake-backend 26 kB séparé, bundle prod propre). Upload docs : prévu 100 % navigateur (IndexedDB base64).
Smoke test Playwright : login `admin/admin123` -> redirection `/mortgage-credit`, `/auth/me` servi 200. 

### Domaines (handlers) — fidélité max
- [x] auth (login/register/refresh/logout/me) — handlers/auth.handler.ts
- [x] reference-data (grades, teams) — handlers/reference-data.handler.ts
- [x] credit-rate / bam-parameters / mourabaha-parameters / investment-credit-parameters — handlers/parameters.handler.ts (seed-parameters.ts)
- [x] activity-sectors — handlers/catalog.handler.ts (seed-catalog.ts)
- [x] document-suggestions — handlers/catalog.handler.ts (filtres ENTERPRISE/CSP fidèles, scope conflict, duplicate)
- [x] users (liste, créer, rôle, profil) — handlers/users.handler.ts (auto-modif interdite, dernier manager protégé)
- [x] enterprises (créer, liste, get, match normalisé) — handlers/enterprise.handler.ts
- [x] enterprise-user-links (invite/claim/approve/reject/revoke) — handlers/enterprise-link.handler.ts + domain/client-domain.ts
- [x] invitations (preview, accept par jeton) — handlers/invitation.handler.ts (jeton en clair pour boîte de réception démo)
- [x] client-portfolio (claim, my-links, portfolio, portfolio demands, mortgage-demands) — handlers/client-portfolio.handler.ts
- [x] investment-credit (simulation) — handlers/simulation.handler.ts (calc + éligibilité + ouverture demande)
- [x] mortgage-credit (simulation) — conventionnel + Mourabaha, bornes, TAEG
- [x] demands (liste, get, current-step, history, pipeline, advance, classify, amortization, assign, assignment-history, eligible-assignees, comments) — handlers/demand.handler.ts + domain/workflow-engine.ts + workflow-repo.ts
      amortization, assign, assignment-history, eligible-assignees, comments
- [x] documents (upload, liste, download, supersede) — handlers/document.handler.ts + domain/document-domain.ts (base64 navigateur, checksum SHA-256)
- [x] document-requests (manager create/list + client list/upload/download) — handlers/document-request.handler.ts + client-document-request.handler.ts
- [x] credit-file + early-repayments (servicing) — domain/servicing.ts + handlers credit-file/client-credit-file/early-repayment (dossier créé à la complétion)
- [x] notifications (liste, unread-count, read, read-all ; SSE neutralisé en démo) — handlers/notification.handler.ts + domain/notifications.ts
- [x] audit-log — domain/audit.ts (enregistrement auto des actions mutantes) + handlers/audit-log.handler.ts
- [x] bam-verification (mock) — handlers/bam-verification.handler.ts (scénarios + distribution par type)
- [x] demand-import (import Excel) — handlers/demand-import.handler.ts + domain/demand-import.ts (SheetJS, createDemand par ligne, rapport read/write/skip)

### Déploiement
- [x] .github/workflows/deploy-demo.yml (build démo + 404 + .nojekyll + publication Pages)

## Notes de reprise
- Le moteur de workflow (advance/classify) est le cœur : voir service/workflow côté back.
- Les formes de réponse exactes = modèles front `src/app/core/models/*.model.ts`.
- NE PAS toucher aux composants/services existants : le faux backend est transparent.
