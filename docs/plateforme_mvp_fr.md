## Plateforme Travel Art – Récapitulatif MVP (FR)

Ce document résume **ce dont la plateforme a besoin** pour une première version exploitable (MVP), côté **produit** et côté **technique**.

---

## 1. Fonctionnalités MVP par type d’utilisateur

### Visiteur (non connecté)

- **Objectif principal**: découvrir la marque, les voyages et générer des leads.
- **Besoins fonctionnels**
  - **Page d’accueil**
    - Hero visuel (univers luxe : bleu nuit, or, crème).
    - Accroche claire sur le positionnement Travel Art.
    - Mise en avant de quelques voyages / expériences.
  - **Découverte des voyages / expériences**
    - Page liste (ex: `/trips`) avec cartes de voyages.
    - Filtres simples (destination, type d’expérience).
  - **Page détail d’un voyage**
    - Photos haute qualité.
    - Description détaillée, itinéraire, inclus / non inclus.
    - Fourchette de prix (ex: `priceFrom`, `priceTo`).
    - Bouton **“Demander ce voyage”** ou **“Demande de devis”**.
  - **Pages de confiance & marque**
    - Page **À propos** (vision, ADN, équipe).
    - Témoignages / avis clients.
    - Partenaires / artistes mis en avant.
    - Page ou section **Contact** (formulaire + coordonnées).

---

### Client (connecté)

- **Objectif principal**: permettre de demander / suivre un voyage et gérer son profil.
- **Besoins fonctionnels**
  - **Authentification**
    - Inscription (email + mot de passe, éventuellement prénom/nom).
    - Connexion / déconnexion.
  - **Profil**
    - Voir / modifier ses informations: nom, email, téléphone.
    - Enregistrer des **préférences** (destinations préférées, budget indicatif, type d’art).
  - **Demande de voyage / réservation**
    - Formulaire de demande (ex: `/request-trip`) avec:
      - Dates (ou période estimée).
      - Destination souhaitée ou plusieurs villes.
      - Budget global ou fourchette.
      - Nombre de personnes.
      - Notes libres (envies spécifiques, artistes, musées, etc.).
    - Enregistrer une entrée de type **Booking / TripRequest** en base.
  - **Espace client / tableau de bord**
    - Vue **“Mes voyages / demandes”**:
      - Liste des demandes avec statut (`REQUESTED`, `IN_PROGRESS`, `CONFIRMED`, `CANCELLED`).
      - Détail d’une demande / réservation.
    - Section **“Prochains voyages”** et **“Voyages passés”** (même si simple au début).

---

### Artiste / Partenaire

- **Objectif principal**: permettre à un partenaire de gérer son profil et ses offres (même de façon simple au début).
- **Besoins fonctionnels MVP**
  - **Connexion partenaire**
    - Compte avec rôle `PARTNER`.
  - **Profil partenaire**
    - Bio, localisation (ville / pays).
    - Quelques photos (atelier, galerie, œuvres).
    - Type de partenaire (galerie, artiste indépendant, guide culturel, etc.).
  - **Offres / expériences**
    - Créer / modifier des **offres**:
      - Titre, description courte.
      - Description détaillée.
      - Prix indicatif.
      - Durée (ex: 2h, demi-journée, journée).
      - Notes sur la disponibilité (jours de la semaine, contraintes).
  - (Plus tard) **Suivi des réservations**:
    - Voir les réservations qui impliquent ce partenaire.
    - Confirmer / refuser une demande.

---

### Admin / Staff

- **Objectif principal**: piloter le contenu et les réservations.
- **Besoins fonctionnels**
  - **Connexion admin sécurisée**
    - Compte avec rôle `ADMIN`.
  - **Gestion des réservations**
    - Tableau de bord des réservations / demandes:
      - Liste (table) avec client, dates, destination, statut.
      - Filtres de base (statut, date, client).
    - Détail d’une réservation:
      - Infos client, voyage / demande, notes internes.
      - Possibilité de modifier le statut (`REQUESTED` → `CONFIRMED`, etc.).
  - **Gestion du contenu**
    - CRUD des **voyages / expériences** visibles sur le site public:
      - Créer / éditer / archiver un `Trip`.
      - Gérer les images et la mise en avant (featured).
  - **Gestion des partenaires**
    - Voir la liste des `Partner`.
    - Approuver / désactiver un partenaire ou une offre.
  - **Gestion des utilisateurs (simple)**
    - Voir la liste des `User`.
    - (Optionnel) bloquer un compte, réinitialiser un mot de passe.

---

### Développeur

- **Objectif principal**: travailler efficacement avec une stack claire et un workflow fluide.
- **Besoins**
  - **Workflow Git**
    - Branche `main` (ou `prod`) + branches de features.
    - **Git worktrees** pour travailler sur plusieurs branches en parallèle sans tout re-checkout.
  - **Environnements**
    - Dev: SQLite + `.env` local (URL backend, clés API).
    - Prod: PostgreSQL via Render, variables d’environnement configurées.
  - **Migrations & schéma**
    - Utiliser Prisma Migrate pour faire évoluer le schéma.
    - Garder le même modèle logique entre SQLite (dev) et PostgreSQL (prod).

---

## 2. Côté technique – pièces à mettre en place

### Frontend (React + TypeScript + Vite + Tailwind)

- **Routes publiques**
  - `/` : page d’accueil (hero luxe, storytelling, CTA “Découvrir les voyages”).
  - `/trips` : liste des voyages / expériences.
  - `/trips/:id` : page détail.
  - `/about` : à propos.
  - `/contact` : formulaire ou infos de contact.

- **Routes client**
  - `/login`, `/signup`.
  - `/account` : dashboard simple (récap profil + dernières réservations).
  - `/account/bookings` : liste des réservations.
  - `/request-trip` : formulaire de demande sur mesure.

- **Routes admin**
  - `/admin/login`.
  - `/admin/bookings` : tableau de bord des réservations.
  - `/admin/trips` : gestion des voyages / expériences.
  - `/admin/users` (optionnel).
  - `/admin/partners` (optionnel).

- **Routes partenaire (optionnel MVP, mais déjà pensées)**
  - `/partner/login`.
  - `/partner/profile`.
  - `/partner/offerings`.

---

### Backend (Express.js + Prisma)

- **Auth**
  - `POST /auth/signup` (client).
  - `POST /auth/login`, `POST /auth/logout`.
  - Middleware d’authentification (JWT ou session).
  - Gestion des rôles (`CUSTOMER`, `ADMIN`, `PARTNER`) via middleware d’autorisation.

- **Utilisateurs / profil**
  - `GET /me` : récupérer le profil de l’utilisateur connecté.
  - `PUT /me` : mettre à jour son profil.
  - **Admin**:
    - `GET /admin/users` : liste des utilisateurs.

- **Voyages / expériences**
  - Public:
    - `GET /trips`
    - `GET /trips/:id`
  - Admin:
    - `POST /admin/trips` : créer un voyage.
    - `PUT /admin/trips/:id` : mettre à jour.
    - `DELETE /admin/trips/:id` : archiver / supprimer.

- **Réservations / demandes de voyage**
  - Client:
    - `POST /bookings` : créer une demande.
    - `GET /bookings` : liste des réservations de l’utilisateur.
  - Admin:
    - `GET /admin/bookings` : toutes les réservations.
    - `GET /admin/bookings/:id` : détail.
    - `PUT /admin/bookings/:id` : changer le statut, ajouter des notes internes.

- **Partenaires**
  - Partenaire:
    - `GET /partner/me`, `PUT /partner/me`.
    - `GET /partner/offerings`, `POST /partner/offerings`, `PUT /partner/offerings/:id`.
  - Admin:
    - Endpoints pour approuver / désactiver un partenaire ou une offre.

---

### Schéma base de données (Prisma – version MVP)

- **User**
  - `id`
  - `name`
  - `email` (unique)
  - `passwordHash`
  - `role` (`CUSTOMER`, `ADMIN`, `PARTNER`)
  - `createdAt`, `updatedAt`

- **Trip**
  - `id`
  - `title`
  - `slug`
  - `description`
  - `priceFrom`, `priceTo`
  - `location`
  - `images` (champ JSON ou table séparée)
  - `status` (ex: `DRAFT`, `PUBLISHED`, `ARCHIVED`)
  - `createdAt`, `updatedAt`

- **Booking**
  - `id`
  - `userId` (→ `User`)
  - `tripId` (→ `Trip`, optionnel pour les demandes 100 % sur-mesure)
  - `status` (`REQUESTED`, `IN_PROGRESS`, `CONFIRMED`, `CANCELLED`)
  - `startDate`, `endDate`
  - `peopleCount`
  - `notes` (demandes spécifiques du client)
  - `createdAt`, `updatedAt`

- **Partner**
  - `id`
  - `userId` (→ `User`)
  - `bio`
  - `location`
  - `images`
  - `status` (`PENDING`, `APPROVED`, `DISABLED`)
  - `createdAt`, `updatedAt`

- **Offering**
  - `id`
  - `partnerId` (→ `Partner`)
  - `title`
  - `description`
  - `price`
  - `duration`
  - `isActive`
  - `createdAt`, `updatedAt`

---

## 3. Mini-MVP recommandé (si tu veux aller au plus simple)

Pour une première version très simple mais cohérente, tu peux commencer par:

1. **Visiteur + Client**
   - Pages: `/`, `/trips`, `/trips/:id`, `/login`, `/signup`, `/request-trip`.
   - Backend: `User`, `Trip`, `Booking` + endpoints associés.
2. **Admin**
   - Page: `/admin/bookings` pour voir et mettre à jour les demandes.
3. **Partenaires**
   - Modéliser `Partner` et `Offering` en base, sans forcément exposer encore toute l’interface.

Ce document pourra évoluer au fur et à mesure que la plateforme grandit.




