# E-Immo Platform

**Plateforme immobilière premium du Bénin - Développée par ELECTRON**

---

## À propos du projet

E-Immo Platform est une plateforme immobilière numérique de nouvelle génération, basée au Bénin, développée par **ELECTRON** (Entreprise: electronbusiness07@gmail.com).

Cette plateforme permet:
- ✅ Aux entreprises immobilières de publier leurs biens
- ✅ Aux clients de rechercher et acheter/louer des propriétés
- ✅ Aux agents de gérer leurs listings
- ✅ Aux administrateurs de superviser la plateforme

## Informations de l'entreprise

| Info | Détail |
|------|--------|
| **Nom** | E-Immo By ELECTRON |
| **Entreprise** | ELECTRON |
| **Email** | electronbusiness07@gmail.com |
| **WhatsApp 1** | +229 01 977 003 47 |
| **WhatsApp 2** | +229 01 498 022 02 |
| **Localisations** | Cotonou & Abomey-Calavi, Bénin |
| **Année de création** | 2025 |

## Fonctionnalités

### Pour les entreprises
- Création de page entreprise personnalisée
- Ajout de propriétés (vente, location, bureaux)
- Dashboard de gestion
- Système de paiement intégré

### Pour les clients
- Recherche avancée avec filtres
- Gestion des favoris
- Comparateur de biens
- Chatbot d'assistance IA
- Multiple moyens de paiement

### Pour les administrateurs
- Tableau de bord complet
- Gestion des utilisateurs
- Modération des contenus
- Suivi des transactions

## Moyens de paiement disponibles

- 💵 **Espèces** - Paiement en main propre
- 📱 **Mobile Money** - MTN, Moov, Flooz
- 🏦 **Virement bancaire** - Virement direct
- 💳 **Carte bancaire** - Via Stripe/PayPal (à venir)

## Pages du site

| Page | URL locale | Description |
|------|------------|-------------|
| Accueil | `index.html` | Page d'accueil de la plateforme |
| Annonces | `listings.html` | Liste de toutes les propriétés |
| Dashboard | `dashboard.html` | Tableau de bord entreprise |
| Entreprise | `company/electron.html` | Page ELECTRON |
| Propriétés | `property/*.html` | Pages de propriétés |
| Agents | `agents.html` | Annuaire des agents |
| Admin | `admin.html` | Panel administrateur |
| Contact | `contact.html` | Page de contact |

## Structure technique

```
E-Immo/
├── css/                    # Styles CSS
│   ├── styles.css         # Style principal
│   └── company.css        # Style pages entreprises
├── js/                    # Scripts JavaScript
│   ├── platform.js       # Gestion de base
│   ├── auth.js           # Authentification
│   ├── client.js         # Espace client
│   ├── search.js         # Moteur de recherche
│   ├── payment.js        # Module de paiement
│   ├── ai.js            # Intelligence artificielle
│   └── security.js      # Sécurité
├── assets/               # Images et médias
│   ├── logo-main.svg    # Logo principal
│   ├── logo-icon.svg    # Logo icône
│   └── logo-horizontal.svg
├── company/              # Pages entreprises
├── property/            # Pages propriétés
├── docs/                # Documentation
├── index.html           # Page d'accueil
├── dashboard.html       # Dashboard
├── listings.html        # Liste annonces
├── agents.html          # Annuaire agents
├── admin.html           # Panel admin
└── manifest.json        # PWA
```

## Installation locale

1. Cloner le dépôt:
```bash
git clone https://github.com/IlarionDossouyovo/E-Immo.git
cd E-Immo
```

2. Ouvrir `index.html` dans un navigateur ou utiliser un serveur local:
```bash
# Avec Python
python -m http.server 8000

# Avec Node.js
npx serve
```

3. Accéder à `http://localhost:8000`

## Configuration

### Pour personnaliser:
1. Modifier `index.html` pour le contenu principal
2. Ajouter vos propriétés dans `company/`
3. Configurer les moyens de paiement dans `js/payment.js`
4. Mettre à jour les logos dans `assets/`

### Pour le déploiement:
1. Utiliser Vercel, Netlify ou autre hébergeur statique
2. Connecter un nom de domaine personnalisé
3. Configurer SSL (inclus avec Vercel)

## Technologies utilisées

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Design:** CSS Grid, Flexbox, Animations CSS
- **API:** REST, Mobile Money APIs
- **IA:** Chatbot, Estimation de prix
- **PWA:** Service Worker, Manifest

## Sécurité

- ✅ Protection CSRF
- ✅ Validation des entrées
- ✅ Conformité RGPD
- ✅ Chiffrement des données sensibles

## Licence et copyright

```
© 2025 E-Immo Platform by ELECTRON
Tous droits réservés.

Développé au Bénin pour le marché africain.
```

## Contact

Pour toute question ou collaboration:
- 📧 Email: electronbusiness07@gmail.com
- 💬 WhatsApp: +229 01 977 003 47
- 📍 Localisation: Cotonou, Abomey-Calavi, République du Bénin
