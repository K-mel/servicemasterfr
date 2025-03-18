# ServiceMasterFR

Plateforme web professionnelle de vente de formations en ligne spécialisée dans la sécurité et la cybersécurité. Cette application offre un environnement sécurisé pour l'achat et l'accès à des formations professionnelles de haute qualité.

## 📋 Présentation

ServiceMasterFR est un site web conçu pour la vente de formations en ligne dans les domaines de la sécurité personnelle et de la cybersécurité. Le site respecte les normes les plus strictes en matière de sécurité et de confidentialité, tout en offrant une expérience utilisateur fluide et professionnelle.

### Objectifs principaux

- Présenter les formations de manière professionnelle et attractive
- Faciliter l'achat et l'accès aux formations
- Garantir la sécurité des utilisateurs et de leurs données
- Inspirer confiance aux visiteurs et les convertir en clients
- Offrir une plateforme évolutive et performante

## 🚀 Technologies utilisées

### Frontend

- **Framework**: Next.js (React)
- **Langage**: TypeScript
- **Styles**: Tailwind CSS
- **Déploiement**: Hostinger

### Backend

- **Framework**: Node.js avec Express
- **Base de données**: PostgreSQL
- **Authentification**: JWT
- **Paiements**: Stripe / PayPal

## 🏗️ Structure du projet

```
ServiceMasterFR/
├── frontend/                # Application Next.js
│   ├── public/              # Ressources statiques
│   └── src/
│       ├── app/             # Pages de l'application
│       ├── components/      # Composants réutilisables
│       ├── lib/             # Utilitaires et services
│       ├── hooks/           # Hooks React personnalisés
│       └── context/         # Contextes React (auth, panier)
│
├── backend/                 # API Express
│   ├── src/
│   │   ├── controllers/     # Logique métier
│   │   ├── models/          # Modèles de données
│   │   ├── routes/          # Routes API
│   │   ├── middleware/      # Middleware personnalisés
│   │   ├── config/          # Configuration
│   │   └── server.ts        # Point d'entrée du serveur
│   └── ...
│
└── README.md                # Documentation du projet
```

## 🖥️ Fonctionnalités principales

- **Page d'accueil** avec présentation des formations phares
- **Catalogue de formations** détaillées
- **Système d'authentification** sécurisé pour les utilisateurs
- **Espace membre** personnalisé pour accéder aux formations achetées
- **Système de paiement** sécurisé (Stripe et PayPal)
- **Blog** avec contenu sur la sécurité et la cybersécurité
- **Page de témoignages** pour renforcer la confiance des visiteurs
- **Interface responsive** adaptée à tous les appareils

## 📦 Composants principaux

- **HeroSection**: Section d'en-tête avec message d'accroche
- **CourseSection**: Présentation des formations phares
- **TrustSection**: Arguments de confiance pour les utilisateurs
- **ProcessSection**: Explication du processus d'achat et d'utilisation
- **TestimonialSection**: Témoignages clients
- **Navbar**: Navigation responsive
- **Footer**: Pied de page avec informations de contact

## 🔧 Installation et démarrage

### Prérequis

- Node.js (v16+)
- npm ou yarn
- PostgreSQL

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## 🛡️ Mesures de sécurité

- Authentification JWT
- Validation côté serveur des données
- Protection CSRF/XSS
- Chiffrement des données sensibles
- Authentification à deux facteurs
- HTTPS obligatoire

## 📄 Licence

Ce projet est propriétaire. Tous droits réservés © ServiceMasterFR.

## 📞 Contact

Pour toute question concernant ce projet, veuillez contacter :

- Email: contact@servicemasterfr.fr
- Site: [servicemasterfr.fr](https://servicemasterfr.fr)
