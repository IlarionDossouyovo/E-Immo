# 🤖 E-Immo AI Dashboard - Guide d'Installation

## Prérequis

- **Docker** installé sur votre machine
- **Ollama** pour les modèles IA

---

## 🚀 Installation Rapide

### 1. Démarrer Ollama

```bash
# Télécharger et démarrer Ollama
docker run -d -v ollama-data:/root/.ollama -p 11434:11434 --name eimmo-ollama ollama/ollama:latest

# Charger le modèle llama3
docker exec eimmo-ollama ollama pull llama3
```

### 2. Démarrer le serveur API

```bash
cd "C:\Users\AUGUSTIN\OneDrive\Documents\E-Immo"

# Installer les dépendances
npm install

# Démarrer le serveur
npm start
```

### 3. Accéder au Dashboard

Ouvrir: **http://localhost:8080/ai-dashboard.html**

---

## 🤖 Les 5 Agents IA

| Agent | Département | Rôle |
|-------|-------------|------|
| 💰 **Ventes** | Commercial | Qualification, négociation, conversion |
| 🎧 **Support** | Service Client | Assistance 24/7, gestion des tickets |
| 📢 **Marketing** | Communication | Contenu, SEO, campagnes |
| 📊 **Analyse** | Data & Analytics | Estimation, rapports, prédictions |
| ⚙️ **Admin** | Gestion Interne | Utilisateurs, modération, sécurité |

---

## 🔧 Configuration

### Variables d'Environnement

```bash
OLLAMA_URL=http://localhost:11434
PORT=3000
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/api/health` | Vérifier le statut |
| GET | `/api/agents` | Liste des agents |
| POST | `/api/chat/:agentId` | Chat avec un agent |
| POST | `/api/estimate` | Estimer un prix |

### Exemple de requête

```bash
curl -X POST http://localhost:3000/api/chat/sales \
  -H "Content-Type: application/json" \
  -d '{"message": "Je cherche une villa à Cotonou"}'
```

---

## 🎯 Utilisation du Dashboard

1. **Ouvrir** `ai-dashboard.html`
2. **Vérifier** le statut Ollama (doit être "Connecté")
3. **Cliquer** sur "Chat" pour discuter avec un agent
4. **Activer** un agent pour charger ses instructions

---

## 🔐 Sécurité

- Ce dashboard est **réservé au propriétaire** (ELECTRON)
- Mode "Propriétaire uniquement" par défaut
- Journal d'activité activé

---

## 📞 Support

- Email: electronbusiness07@gmail.com
- WhatsApp: +229 01 977 003 47