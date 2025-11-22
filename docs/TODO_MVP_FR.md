## TODO Travel Art – MVP détaillé (FR)

Ce document liste les tâches à réaliser pour construire le **MVP** de la plateforme Travel Art, basées sur le document `plateforme_mvp_fr.md`.

> Astuce : coche les cases au fur et à mesure (`- [x]`) pour suivre l’avancement.

---

## 1. Modèles & backend de base (User / Trip / Booking)

- [ ] **Définir le modèle `User` dans Prisma**
  - [ ] Champs : `id`, `name`, `email` (unique), `passwordHash`, `role` (`CUSTOMER`, `ADMIN`, `PARTNER`), `createdAt`, `updatedAt`.
  - [ ] Générer et appliquer la migration Prisma en dev (SQLite).
- [ ] **Définir le modèle `Trip` dans Prisma**
  - [ ] Champs : `id`, `title`, `slug`, `description`, `priceFrom`, `priceTo`, `location`, `images` (JSON ou table liée), `status` (`DRAFT`, `PUBLISHED`, `ARCHIVED`), `createdAt`, `updatedAt`.
  - [ ] Migration Prisma (dev).
- [ ] **Définir le modèle `Booking` dans Prisma**
  - [ ] Champs : `id`, `userId`, `tripId` (optionnel), `status` (`REQUESTED`, `IN_PROGRESS`, `CONFIRMED`, `CANCELLED`), `startDate`, `endDate`, `peopleCount`, `notes`, `createdAt`, `updatedAt`.
  - [ ] Relations Prisma (`Booking` → `User`, `Booking` → `Trip`).
  - [ ] Migration Prisma (dev).
- [ ] **Configurer Prisma pour PostgreSQL en prod (Render)**
  - [ ] Vérifier `DATABASE_URL` pour Postgres.
  - [ ] Préparer la commande de migration pour la prod (Render).

---

## 2. Authentification & rôles

- [ ] **Mettre en place les routes d’authentification**
  - [ ] `POST /auth/signup` pour créer un compte client (`role = CUSTOMER` par défaut).
  - [ ] `POST /auth/login` pour retourner un token (JWT ou session).
  - [ ] `POST /auth/logout` si nécessaire (invalidation côté client / blacklist côté serveur si besoin).
- [ ] **Middleware d’authentification**
  - [ ] Extraire et vérifier le token (JWT) ou la session.
  - [ ] Ajouter `req.user` avec `id`, `role`, etc.
- [ ] **Middleware d’autorisation**
  - [ ] Vérifier que l’utilisateur a le bon `role` pour les routes protégées (`ADMIN`, `PARTNER`, `CUSTOMER`).

---

## 3. API publique voyages / expériences

- [ ] **Endpoint `GET /trips`**
  - [ ] Renvoyer la liste des voyages publiés (`status = PUBLISHED`).
  - [ ] Supporter des filtres simples (destination / type si disponible).
- [ ] **Endpoint `GET /trips/:id`**
  - [ ] Renvoyer les détails d’un voyage : description, images, prix, localisation, etc.

---

## 4. API bookings (demandes de voyage)

- [ ] **Endpoint `POST /bookings` (client)**
  - [ ] Créer une demande de voyage liée à `req.user.id`.
  - [ ] Accepter : dates (ou période), destination(s), budget, nombre de personnes, notes.
  - [ ] Statut initial : `REQUESTED`.
- [ ] **Endpoint `GET /bookings` (client)**
  - [ ] Renvoyer uniquement les bookings du user connecté.
- [ ] **Endpoints admin pour bookings**
  - [ ] `GET /admin/bookings` : liste de toutes les réservations / demandes.
  - [ ] `GET /admin/bookings/:id` : détail d’une réservation.
  - [ ] `PUT /admin/bookings/:id` : mise à jour du statut + notes internes (réservé à `ADMIN`).

---

## 5. API partenaires (Partner / Offering)

- [ ] **Définir le modèle `Partner` dans Prisma**
  - [ ] Champs : `id`, `userId`, `bio`, `location`, `images`, `status` (`PENDING`, `APPROVED`, `DISABLED`), `createdAt`, `updatedAt`.
- [ ] **Définir le modèle `Offering` dans Prisma**
  - [ ] Champs : `id`, `partnerId`, `title`, `description`, `price`, `duration`, `isActive`, `createdAt`, `updatedAt`.
- [ ] **Endpoints partenaire**
  - [ ] `GET /partner/me`, `PUT /partner/me` – consulter / modifier le profil partenaire.
  - [ ] `GET /partner/offerings` – liste des offres du partenaire connecté.
  - [ ] `POST /partner/offerings` – créer une nouvelle offre.
  - [ ] `PUT /partner/offerings/:id` – mettre à jour une offre existante.
- [ ] **Endpoints admin partenaires**
  - [ ] `GET /admin/partners` – liste de tous les partenaires.
  - [ ] `PUT /admin/partners/:id` – changer le statut (`PENDING` → `APPROVED` ou `DISABLED`).

---

## 6. Frontend – routes publiques

- [ ] **Page d’accueil (`/`)**
  - [ ] Hero (image forte + accroche + CTA).
  - [ ] Section présentant le concept Travel Art.
  - [ ] Section “Expériences en avant” (quelques `Trip`).
  - [ ] Section “Pourquoi Travel Art ?” (arguments luxe / art / sur mesure).
- [ ] **Page liste des voyages (`/trips`)**
  - [ ] Affichage des voyages via API `/trips`.
  - [ ] Cartes avec image, titre, destination, fourchette de prix, bouton “Voir le voyage”.
- [ ] **Page détail voyage (`/trips/:id`)**
  - [ ] Affichage du voyage via `/trips/:id`.
  - [ ] Galerie d’images / section hero.
  - [ ] Description, itinéraire, inclus / non inclus.
  - [ ] Bouton “Demander ce voyage” redirigeant vers `/request-trip` (avec pré-remplissage si possible).
- [ ] **Pages marque**
  - [ ] `/about` – page “À propos”.
  - [ ] `/contact` – formulaire de contact ou infos (email, téléphone, etc.).

---

## 7. Frontend – espace client

- [ ] **Pages d’authentification**
  - [ ] `/login` – formulaire de connexion (email + mot de passe).
  - [ ] `/signup` – formulaire d’inscription (email, mot de passe, prénom, nom).
  - [ ] Gestion de l’état d’authentification (store, context, etc.).
- [ ] **Dashboard client (`/account`)**
  - [ ] Afficher un résumé du profil.
  - [ ] Afficher le prochain voyage confirmé (si un `Booking` avec statut `CONFIRMED` existe).
  - [ ] Lien vers “Mes réservations/demandes”.
- [ ] **Page bookings client (`/account/bookings`)**
  - [ ] Liste des `Booking` du user (consommation de `GET /bookings`).
  - [ ] Indication du statut et des dates / destination.
- [ ] **Page demande de voyage (`/request-trip`)**
  - [ ] Formulaire avec :
    - Destination(s), dates ou période, budget, nombre de personnes, style de voyage, notes.
  - [ ] Envoi vers `POST /bookings`.
  - [ ] Message de confirmation après envoi.

---

## 8. Frontend – back-office admin

- [ ] **Connexion admin (`/admin/login`)**
  - [ ] Formulaire de connexion réservé aux admins.
  - [ ] Redirection vers `/admin/bookings` en cas de succès.
- [ ] **Tableau de bord des réservations (`/admin/bookings`)**
  - [ ] Affichage de la liste via `GET /admin/bookings`.
  - [ ] Filtres de base (statut, date).
  - [ ] Liens vers une page détail.
- [ ] **Page détail réservation (`/admin/bookings/:id`)**
  - [ ] Infos complètes sur le client et la demande.
  - [ ] Champ pour notes internes.
  - [ ] Sélecteur / boutons pour changer le statut (appelle `PUT /admin/bookings/:id`).
- [ ] **Gestion des voyages (`/admin/trips`)**
  - [ ] Liste des voyages.
  - [ ] Bouton “Créer un voyage”.
  - [ ] Bouton “Modifier” qui ouvre un formulaire d’édition.
  - [ ] Bouton “Archiver/Supprimer”.
- [ ] **Gestion des partenaires (`/admin/partners`)** (MVP plus tard possible)
  - [ ] Liste des partenaires et de leur statut.
  - [ ] Bouton pour approuver / désactiver.

---

## 9. Frontend – espace partenaire (optionnel pour premier MVP)

- [ ] **Connexion partenaire (`/partner/login`)**
  - [ ] Connexion pour les `User` avec `role = PARTNER`.
- [ ] **Profil partenaire (`/partner/profile`)**
  - [ ] Formulaire pour bio, localisation, photos, type.
- [ ] **Gestion des offres (`/partner/offerings`)**
  - [ ] Liste des offres du partenaire.
  - [ ] Formulaire pour créer / modifier une offre.

---

## 10. Infra, qualité & workflow dev

- [ ] **Configuration des environnements**
  - [ ] `.env` pour le backend (dev) avec `DATABASE_URL`, `JWT_SECRET`, etc.
  - [ ] Variables d’environnement configurées sur Render (backend + Postgres).
- [ ] **Déploiement**
  - [ ] Vérifier que le backend est bien déployé sur Render (build, start command).
  - [ ] Vérifier que le frontend est bien déployé (build Vite + static site).
- [ ] **Workflow Git + worktrees**
  - [ ] Définir une convention de branches (ex: `feature/...`, `fix/...`).
  - [ ] Utiliser `git worktree` pour travailler sur plusieurs features si nécessaire.
- [ ] **Tests de base**
  - [ ] Tester à la main les principaux parcours (visiteur, client, admin).
  - [ ] Ajouter quelques tests automatisés (API / e2e) quand le cœur est stable.

---

## 11. Backend – implantation détaillée (Prisma + Express)

- [ ] **Écrire le schéma Prisma complet**
  - [ ] Définir les modèles `User`, `Trip`, `Booking`, `Partner`, `Offering` avec les relations.
  - [ ] Vérifier les types (`DateTime`, `Decimal` pour les prix, etc.).
  - [ ] Générer les migrations et les appliquer (SQLite).
- [ ] **Générer le client Prisma**
  - [ ] Exécuter `npx prisma generate` dans le backend.
  - [ ] Vérifier que l’import du client Prisma fonctionne dans le code (`db.ts` ou équivalent).
- [ ] **Structurer les routes Express**
  - [ ] Créer des routeurs séparés : `auth`, `trips`, `bookings`, `partners`, `admin`.
  - [ ] Monter les routeurs dans `index.ts` (backend).
- [ ] **Implémenter les contrôleurs**
  - [ ] Pour chaque endpoint (`/auth`, `/trips`, `/bookings`, `/partner`, `/admin`), écrire la logique :
    - [ ] Validation des inputs (body, params, query).
    - [ ] Appel à Prisma.
    - [ ] Gestion des erreurs (try/catch + middleware `errorHandler`).
- [ ] **Sécurité de base**
  - [ ] Ne jamais renvoyer `passwordHash`.
  - [ ] Protéger les routes privées avec `authMiddleware`.
  - [ ] Limiter les données exposées dans les listes admin (pas d’infos sensibles inutiles).

---

## 12. Frontend – structure des pages & composants (React + Tailwind)

- [ ] **Définir la structure globale**
  - [ ] Layout principal (header + footer + navigation).
  - [ ] Layouts spécifiques admin / partenaire si nécessaire.
- [ ] **Design system de base**
  - [ ] Palette de couleurs (bleu nuit, or, crème) conforme à l’identité luxe.
  - [ ] Composants réutilisables : boutons, cartes, formulaire, modales.
  - [ ] Styles typographiques (titres, paragraphes, légendes).
- [ ] **Composants clés**
  - [ ] Carte `TripCard` (utilisée dans la liste des voyages).
  - [ ] `TripHero` pour les pages détail.
  - [ ] `BookingStatusBadge` pour indiquer le statut (client + admin).
  - [ ] `FormField` / `Input`, `Select`, `Textarea` réutilisables.
- [ ] **Gestion d’état**
  - [ ] Store d’authentification (ex: Zustand ou simple context).
  - [ ] Gestion du token (stockage sécurisé, rafraîchissement si nécessaire).
  - [ ] Loading / erreurs globales (composants de feedback).

---

## 13. UX / UI – expérience de marque luxe

- [ ] **Navigation & clarté**
  - [ ] Menu simple : Accueil, Voyages, À propos, Contact, Connexion/Compte.
  - [ ] CTA clair sur la home (ex: “Commencer mon voyage sur mesure”).
- [ ] **Cohérence visuelle**
  - [ ] Utiliser les mêmes composants et styles sur toutes les pages.
  - [ ] Garder des espaces généreux, peu de bruit visuel (sensation premium).
- [ ] **Formulaires agréables**
  - [ ] Messages d’erreur clairs et bien stylés.
  - [ ] Indications de champ (placeholders, labels explicites).
  - [ ] Confirmation visuelle après une action (ex: demande de voyage envoyée).
- [ ] **Responsive**
  - [ ] Vérifier l’affichage mobile/tablette/desktop pour les pages clés (home, trips, trip detail, request-trip, account).

---

## 14. Contenu, SEO & analytics

- [ ] **Contenu rédactionnel**
  - [ ] Rédiger les textes de la home (hero, sections).
  - [ ] Rédiger les fiches de quelques voyages “pilotes”.
  - [ ] Rédiger la page “À propos” (histoire, vision, méthodes).
- [ ] **SEO de base**
  - [ ] Titres de page (`<title>`) cohérents et optimisés.
  - [ ] Meta descriptions pour les pages principales.
  - [ ] URLs propres (`/trips/italie-florence-art` plutôt que `/trips/123` uniquement).
- [ ] **Analytics**
  - [ ] Intégrer un outil d’analytics (ex: Plausible, GA4, etc.) dans le frontend.
  - [ ] Traquer les événements clés :
    - [ ] Visite home.
    - [ ] Clic sur “Demander ce voyage”.
    - [ ] Soumission de `/request-trip`.
    - [ ] Création de compte.

---

## 15. Emails & notifications (MVP simple)

- [ ] **Emails transactionnels simples**
  - [ ] Email de confirmation de création de compte.
  - [ ] Email de réception de demande de voyage (au client).
  - [ ] Email interne à l’équipe Travel Art pour chaque nouvelle demande.
- [ ] **Intégration technique**
  - [ ] Choisir un provider (ex: SendGrid, Mailgun, etc.).
  - [ ] Créer un petit service `notification` ou un module dédié dans le backend.
  - [ ] Gérer les templates d’email (même simples au début).

---

## 16. Qualité, tests & préparation production

- [ ] **Tests frontend**
  - [ ] Tests e2e sur les parcours critiques (visiteur → demande de voyage, client → dashboard).
  - [ ] Vérification manuelle de l’accessibilité de base (contraste, alt sur les images importantes).
- [ ] **Tests backend**
  - [ ] Tests unitaires / d’intégration sur les endpoints critiques (`/auth`, `/bookings`, `/trips`).
- [ ] **Check-list pré-production**
  - [ ] Vérifier les messages d’erreur (qu’ils ne révèlent pas d’infos sensibles).
  - [ ] Vérifier les rôles et les protections d’accès (admin, partenaire, client).
  - [ ] Vérifier la configuration des logs sur Render.
