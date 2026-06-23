/**
 * E-Immo API Server
 * Connecte Ollama aux agents IA
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

app.use(cors());
app.use(express.json());

// Agent system prompts
const agents = {
  sales: {
    name: 'Agent Ventes',
    role: 'Commercial',
    instructions: `Tu es l'agent commercial d'E-Immo Platform par ELECTRON au Bénin.
    - Tu aides les clients à trouver des propriétés adaptées à leur budget
    - Tu qualifies les leads selon leur pouvoir d'achat
    - Tu négocies les prix et conditions de vente
    - Tu suis les transactions jusqu'à la conclusion
    - Réponds en français professionnel et courtois`
  },
  support: {
    name: 'Agent Support',
    role: 'Service Client',
    instructions: `Tu es le support client d'E-Immo Platform par ELECTRON au Bénin.
    - Tu réponds aux questions des clients 24/7
    - Tu gère les plaintes avec empathie et professionnalisme
    - Tu suis les tickets jusqu'à résolution complète
    - Tu connais toutes les propriétés et politiques de l'entreprise
    - Réponds en français courtois et empathique`
  },
  marketing: {
    name: 'Agent Marketing',
    role: 'Communication',
    instructions: `Tu es l'agent marketing d'E-Immo Platform par ELECTRON au Bénin.
    - Tu crées du contenu attractif pour les propriétés
    - Tu optimises le SEO des descriptions
    - Tu génères des rapports marketing
    - Tu gères les campagnes publicitaires
    - Réponds en français créatif et percutant`
  },
  analysis: {
    name: 'Agent Analyse',
    role: 'Data & Analytics',
    instructions: `Tu es l'agent analyste d'E-Immo Platform par ELECTRON au Bénin.
    - Tu estimes les prix des propriétés avec précision
    - Tu génères des rapports statistiques détaillés
    - Tu analises les tendances du marché immobilier béninois
    - Tu fais des prédictions basées sur les données historiques
    - Réponds en français analytique et précis`
  },
  admin: {
    name: 'Agent Admin',
    role: 'Gestion Interne',
    instructions: `Tu es l'agent administratif d'E-Immo Platform par ELECTRON au Bénin.
    - Tu gères les utilisateurs et leurs droits d'accès
    - Tu modères les contenus inappropriate
    - Tu surveilles la sécurité de la plateforme
    - Tu génères des rapports d'administration
    - Réponds en français formel et professionnel`
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all agents
app.get('/api/agents', (req, res) => {
  res.json(Object.keys(agents).map(key => ({
    id: key,
    name: agents[key].name,
    role: agents[key].role
  })));
});

// Chat with specific agent
app.post('/api/chat/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const { message } = req.body;
  
  if (!agents[agentId]) {
    return res.status(404).json({ error: 'Agent non trouvé' });
  }
  
  if (!message) {
    return res.status(400).json({ error: 'Message requis' });
  }
  
  try {
    // Call Ollama
    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt: `${agents[agentId].instructions}\n\nQuestion: ${message}`,
        stream: false
      })
    });
    
    const data = await ollamaResponse.json();
    res.json({ 
      agent: agentId,
      response: data.response,
      model: data.model
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur de connexion à Ollama',
      details: error.message 
    });
  }
});

// Estimate property price
app.post('/api/estimate', async (req, res) => {
  const { location, surface, bedrooms, bathrooms, condition, type } = req.body;
  
  const prompt = `Tu es un expert immobilier au Bénin. Estime le prix d'une propriété avec ces caractéristiques:
    - Localisation: ${location}
    - Surface: ${surface} m²
    - Chambres: ${bedrooms}
    - Salles de bain: ${bathrooms}
    - Condition: ${condition}
    - Type: ${type}
    
    Donne un prix estimé en XOF et explique ta calculation.`;
  
  try {
    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        prompt: prompt,
        stream: false
      })
    });
    
    const data = await ollamaResponse.json();
    res.json({ estimation: data.response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ E-Immo API démarré sur port ${PORT}`);
  console.log(`✅ Connecté à Ollama: ${OLLAMA_URL}`);
});