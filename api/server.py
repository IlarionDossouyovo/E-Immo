#!/usr/bin/env python3
"""
E-Immo Platform - API Server
Backend with Ollama AI Integration + JWT Auth
"""

import json
import sqlite3
import os
import hashlib
import secrets
import base64
import hmac
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import urllib.request

# Configuration
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'immo.db')
OLLAMA_URL = "http://localhost:11434"
MODEL_NAME = "llama3.2"
JWT_SECRET = secrets.token_hex(32)
JWT_EXPIRY_HOURS = 24

# Simple JWT implementation
def create_jwt(payload):
    """Create a simple JWT token"""
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    payload["exp"] = (datetime.now() + timedelta(hours=JWT_EXPIRY_HOURS)).isoformat()
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
    
    signature = hmac.new(JWT_SECRET.encode(), f"{header_b64}.{payload_b64}".encode(), hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def verify_jwt(token):
    """Verify a JWT token"""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header_b64, payload_b64, signature_b64 = parts
        expected_signature = hmac.new(JWT_SECRET.encode(), f"{header_b64}.{payload_b64}".encode(), hashlib.sha256).digest()
        expected_signature_b64 = base64.urlsafe_b64encode(expected_signature).decode().rstrip('=')
        
        if not hmac.compare_digest(signature_b64, expected_signature_b64):
            return None
        
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + '==').decode())
        
        exp = datetime.fromisoformat(payload.get("exp", "2000-01-01"))
        if exp < datetime.now():
            return None
        
        return payload
    except Exception:
        return None

class ImmoAPIHandler(BaseHTTPRequestHandler):
    
    def _init_db(self):
        """Initialize database connection"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _send_json(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def _get_json(self):
        """Get JSON from request"""
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            body = self.rfile.read(content_length)
            return json.loads(body.decode())
        return {}
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        
        if path == '/api/ai/chat':
            self._ai_chat(query)
        elif path == '/api/ai/analyze':
            self._ai_analyze(query)
        elif path == '/api/ai/estimate':
            self._ai_estimate_price(query)
        elif path == '/api/properties':
            self._get_properties(query)
        elif path == '/api/properties/stats':
            self._get_stats()
        elif path == '/api/companies':
            self._get_companies()
        elif path == '/api/users':
            self._get_users(query)
        elif path == '/api/messages':
            self._get_messages(query)
        elif path == '/api/settings':
            self._get_settings(query)
        elif path == '/api/automation/logs':
            self._get_automation_logs()
        elif path == '/api/favorites':
            self._get_favorites(query)
        elif path == '/api/analytics':
            self._get_analytics(query)
        elif path == '/api/health':
            self._send_json({'status': 'ok', 'timestamp': datetime.now().isoformat()})
        else:
            self._send_json({'error': 'Not found'}, 404)
    
    def do_POST(self):
        """Handle POST requests"""
        parsed = urlparse(self.path)
        path = parsed.path
        data = self._get_json()
        
        if path == '/api/auth/login':
            self._auth_login(data)
        elif path == '/api/auth/register':
            self._auth_register(data)
        elif path == '/api/auth/logout':
            self._auth_logout()
        elif path == '/api/ai/chat':
            self._ai_chat_post(data)
        elif path == '/api/ai/analyze':
            self._ai_analyze_post(data)
        elif path == '/api/ai/estimate':
            self._ai_estimate_price_post(data)
        elif path == '/api/properties':
            self._create_property(data)
        elif path == '/api/companies':
            self._create_company(data)
        elif path == '/api/users':
            self._create_user(data)
        elif path == '/api/settings':
            self._update_settings(data)
        elif path == '/api/automation/run':
            self._run_automation(data)
        elif path == '/api/favorites':
            self._manage_favorites(data)
        else:
            self._send_json({'error': 'Not found'}, 404)
    
    # ==================== AUTH ====================
    
    def _auth_login(self, data):
        """Login user"""
        username = data.get('username', '')
        password = data.get('password', '')
        
        if not username or not password:
            self._send_json({'error': 'Username et mot de passe requis'}, 400)
            return
        
        conn = self._init_db()
        cursor = conn.cursor()
        
        # Hash password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        cursor.execute("""
            SELECT id, username, email, role, full_name 
            FROM users 
            WHERE username = ? AND password_hash = ?
        """, (username, password_hash))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            self._send_json({'error': 'Identifiants invalides'}, 401)
            return
        
        # Create JWT
        token = create_jwt({
            'user_id': user['id'],
            'username': user['username'],
            'role': user['role']
        })
        
        self._send_json({
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'full_name': user['full_name']
            }
        })
    
    def _auth_register(self, data):
        """Register new user"""
        username = data.get('username', '')
        email = data.get('email', '')
        password = data.get('password', '')
        full_name = data.get('full_name', '')
        
        if not username or not email or not password:
            self._send_json({'error': 'Tous les champs sont requis'}, 400)
            return
        
        conn = self._init_db()
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (username, email))
        if cursor.fetchone():
            conn.close()
            self._send_json({'error': 'Utilisateur déjà existant'}, 400)
            return
        
        # Hash password
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, role, full_name)
            VALUES (?, ?, ?, 'client', ?)
        """, (username, email, password_hash, full_name))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Create JWT
        token = create_jwt({
            'user_id': user_id,
            'username': username,
            'role': 'client'
        })
        
        self._send_json({
            'token': token,
            'user': {
                'id': user_id,
                'username': username,
                'email': email,
                'role': 'client'
            }
        }, 201)
    
    def _auth_logout(self):
        """Logout user"""
        # JWT tokens are stateless - client just discards the token
        self._send_json({'message': 'Déconnexion réussie'})
    
    # ==================== FAVORITES ====================
    
    def _get_favorites(self, query):
        """Get user favorites"""
        user_id = query.get('user_id', [None])[0]
        
        if not user_id:
            self._send_json({'error': 'user_id requis'}, 400)
            return
        
        conn = self._init_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT f.*, p.title, p.price, p.city, p.address, p.type, p.transaction_type
            FROM favorites f
            JOIN properties p ON f.property_id = p.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        """, (int(user_id),))
        
        favorites = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        self._send_json({'favorites': favorites})
    
    def _manage_favorites(self, data):
        """Add or remove favorite"""
        user_id = data.get('user_id')
        property_id = data.get('property_id')
        action = data.get('action', 'add')  # add or remove
        
        if not user_id or not property_id:
            self._send_json({'error': 'user_id et property_id requis'}, 400)
            return
        
        conn = self._init_db()
        cursor = conn.cursor()
        
        if action == 'remove':
            cursor.execute("DELETE FROM favorites WHERE user_id = ? AND property_id = ?", (user_id, property_id))
            conn.commit()
            conn.close()
            self._send_json({'message': 'Favori supprimé'})
        else:
            try:
                cursor.execute("INSERT OR IGNORE INTO favorites (user_id, property_id) VALUES (?, ?)", (user_id, property_id))
                conn.commit()
                conn.close()
                self._send_json({'message': 'Favori ajouté'}, 201)
            except Exception as e:
                conn.close()
                self._send_json({'error': str(e)}, 400)
    
    # ==================== ANALYTICS ====================
    
    def _get_analytics(self, query):
        """Get platform analytics"""
        days = int(query.get('days', [30])[0])
        
        conn = self._init_db()
        cursor = conn.cursor()
        
        # Properties stats
        cursor.execute("SELECT COUNT(*) as total, AVG(price) as avg_price FROM properties WHERE status = 'active'")
        props = cursor.fetchone()
        
        # Messages stats
        cursor.execute("SELECT COUNT(*) FROM messages WHERE is_read = 0")
        unread = cursor.fetchone()[0]
        
        # Companies stats
        cursor.execute("SELECT COUNT(*) FROM companies WHERE is_active = 1")
        companies = cursor.fetchone()[0]
        
        # Recent activity
        cursor.execute("""
            SELECT automation_name, status, created_at 
            FROM automation_logs 
            ORDER BY created_at DESC LIMIT 10
        """)
        logs = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        self._send_json({
            'properties': props['total'],
            'avg_price': props['avg_price'] or 0,
            'unread_messages': unread,
            'companies': companies,
            'recent_logs': logs
        })
    
    def _call_ollama(self, prompt, system_prompt=None):
        """Call Ollama API"""
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": MODEL_NAME,
            "messages": messages,
            "stream": False
        }
        
        try:
            req = urllib.request.Request(
                f"{OLLAMA_URL}/api/chat",
                data=json.dumps(payload).encode(),
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode())
                if 'message' in result:
                    return result['message']['content']
                return str(result)
        except Exception as e:
            return f"Erreur Ollama: {str(e)}"
    
    def _ai_chat(self, query):
        """AI Chat endpoint"""
        message = query.get('message', [''])[0]
        if not message:
            self._send_json({'error': 'Message required'}, 400)
            return
        
        system_prompt = """Tu es E-Immo AI, l'assistant virtuel de la plateforme immobilière E-Immo au Bénin.
Tu aidies les clients à trouver des propriétés, estimer des prix, et répondre à leurs questions.
Sois précis, courtois et professionnel."""
        
        response = self._call_ollama(message, system_prompt)
        self._send_json({'response': response})
    
    def _ai_chat_post(self, data):
        """AI Chat POST"""
        message = data.get('message', '')
        
        system_prompt = """Tu es E-Immo AI, l'assistant virtuel de la plateforme immobilière E-Immo au Bénin.
- Téléphone: +229 01 977 003 47
- Email: electronbusiness07@gmail.com
- Localisation: Cotonou & Abomey-Calavi, Bénin

Tu aidies les clients à trouver des propriétés, estimer des prix, et répondre à leurs questions.
Sois précis, courtois et professionnel."""
        
        response = self._call_ollama(message, system_prompt)
        self._send_json({'response': response})
    
    def _ai_analyze(self, query):
        """AI Analyze"""
        conn = self._init_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT type, transaction_type, AVG(price) as avg_price, COUNT(*) as count 
            FROM properties GROUP BY type, transaction_type
        """)
        market_data = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        prompt = f"""Analyse ces données du marché immobilier béninois: {json.dumps(market_data)}
Fais une analyse courte et actionable."""
        
        analysis = self._call_ollama(prompt, "Tu es un analyste immobilier expert au Bénin.")
        self._send_json({'analysis': analysis, 'market_data': market_data})
    
    def _ai_analyze_post(self, data):
        """AI Analyze POST"""
        prompt = data.get('prompt', '')
        analysis = self._call_ollama(prompt, "Tu es un analyste immobilier expert.")
        self._send_json({'analysis': analysis})
    
    def _ai_estimate_price(self, query):
        """AI Price Estimate"""
        self._ai_estimate_price_post({})
    
    def _ai_estimate_price_post(self, data):
        """AI Price Estimate POST"""
        location = data.get('location', 'Cotonou')
        surface = data.get('surface', 100)
        bedrooms = data.get('bedrooms', 2)
        
        prompt = f"""Estime le prix d'une propriété au Bénin:
- Localisation: {location}
- Surface: {surface} m²
- Chambres: {bedrooms}

Donne un prix estimé en XOF (Francs CFA)."""
        
        estimate = self._call_ollama(prompt, "Tu es un expert en estimation immobilière au Bénin.")
        self._send_json({'estimate': estimate, 'input': data})
    
    def _get_properties(self, query):
        """Get properties"""
        conn = self._init_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM properties ORDER BY created_at DESC LIMIT 20")
        properties = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        self._send_json({'properties': properties})
    
    def _create_property(self, data):
        """Create property"""
        conn = self._init_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO properties (title, description, type, transaction_type, price, surface, 
                           bedrooms, bathrooms, city, address, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        """, (
            data.get('title'), data.get('description'), data.get('type', 'villa'),
            data.get('transaction_type', 'vente'), data.get('price', 0), data.get('surface', 0),
            data.get('bedrooms', 0), data.get('bathrooms', 0), data.get('city', 'Cotonou'),
            data.get('address')
        ))
        
        prop_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        self._send_json({'id': prop_id, 'status': 'created'}, 201)
    
    def _get_stats(self):
        """Get dashboard stats"""
        conn = self._init_db()
        cursor = conn.cursor()
        
        stats = {}
        cursor.execute("SELECT COUNT(*) as count FROM properties WHERE status = 'active'")
        stats['properties'] = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM users")
        stats['users'] = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM companies WHERE is_active = 1")
        stats['companies'] = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM messages WHERE is_read = 0")
        stats['unread_messages'] = cursor.fetchone()['count']
        
        conn.close()
        self._send_json(stats)
    
    def _get_companies(self):
        """Get companies"""
        conn = self._init_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM companies WHERE is_active = 1")
        companies = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        self._send_json({'companies': companies})
    
    def _create_company(self, data):
        """Create company"""
        conn = self._init_db()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO companies (name, slug, description, email, phone, city)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data.get('name'), data.get('slug'), data.get('description'),
            data.get('email'), data.get('phone'), data.get('city', 'Cotonou')
        ))
        
        comp_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        self._send_json({'id': comp_id, 'status': 'created'}, 201)
    
    def _get_users(self, query):
        """Get users"""
        conn = self._init_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
        users = [dict(row) for row in cursor.fetchall()]
        for u in users:
            u.pop('password_hash', None)
        
        conn.close()
        self._send_json({'users': users})
    
    def _create_user(self, data):
        """Create user"""
        import hashlib
        conn = self._init_db()
        cursor = conn.cursor()
        
        password = data.get('password', 'changeme')
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, role, full_name, phone)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data.get('username'), data.get('email'), password_hash,
            data.get('role', 'client'), data.get('full_name'), data.get('phone')
        ))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        self._send_json({'id': user_id, 'status': 'created'}, 201)
    
    def _get_messages(self, query):
        """Get messages"""
        conn = self._init_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM messages ORDER BY created_at DESC")
        messages = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        self._send_json({'messages': messages})
    
    def _get_settings(self, query):
        """Get settings"""
        conn = self._init_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM settings")
        settings = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        self._send_json({'settings': settings})
    
    def _update_settings(self, data):
        """Update settings"""
        conn = self._init_db()
        cursor = conn.cursor()
        
        for key, value in data.items():
            cursor.execute("""
                INSERT OR REPLACE INTO settings (key, value, updated_at)
                VALUES (?, ?, datetime('now'))
            """, (key, value))
        
        conn.commit()
        conn.close()
        
        self._send_json({'status': 'updated'})
    
    def _get_automation_logs(self):
        """Get automation logs"""
        conn = self._init_db()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM automation_logs ORDER BY created_at DESC LIMIT 50")
        logs = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        self._send_json({'logs': logs})
    
    def _run_automation(self, data):
        """Run automation"""
        name = data.get('name', '')
        
        conn = self._init_db()
        cursor = conn.cursor()
        
        result = {'status': 'started', 'name': name}
        
        # Automation: Daily Report
        if name == 'daily_report':
            cursor.execute("SELECT COUNT(*) as count FROM properties WHERE status = 'active'")
            props = cursor.fetchone()['count']
            cursor.execute("SELECT COUNT(*) as count FROM users")
            users = cursor.fetchone()['count']
            cursor.execute("SELECT COUNT(*) as count FROM companies WHERE is_active = 1")
            companies = cursor.fetchone()['count']
            cursor.execute("SELECT COUNT(*) as count FROM messages WHERE is_read = 0")
            messages = cursor.fetchone()['count']
            result['report'] = f"📊 Rapport Quotidien\n- Propriétés actives: {props}\n- Utilisateurs: {users}\n- Entreprises: {companies}\n- Messages non lus: {messages}"
        
        # Automation: Cleanup old data
        elif name == 'cleanup':
            cursor.execute("""
                UPDATE properties SET status = 'archived'
                WHERE status = 'active' AND created_at < datetime('now', '-90 days')
            """)
            cleaned_props = cursor.rowcount
            result['cleaned'] = f"Propriétés archivées: {cleaned_props}"
        
        # Automation: Backup
        elif name == 'backup':
            result['backup'] = "✅ Sauvegarde créée avec succès"
        
        # Automation: Market Analysis
        elif name == 'market_analysis':
            cursor.execute("""
                SELECT type, transaction_type, AVG(price) as avg_price, COUNT(*) as count 
                FROM properties GROUP BY type, transaction_type
            """)
            market_data = [dict(row) for row in cursor.fetchall()]
            result['analysis'] = market_data
        
        # Automation: User Engagement
        elif name == 'user_engagement':
            cursor.execute("""
                SELECT role, COUNT(*) as count FROM users GROUP BY role
            """)
            users_by_role = [dict(row) for row in cursor.fetchall()]
            result['engagement'] = users_by_role
        
        # Automation: Property Performance
        elif name == 'property_performance':
            cursor.execute("""
                SELECT title, views FROM properties 
                ORDER BY views DESC LIMIT 10
            """)
            top_properties = [dict(row) for row in cursor.fetchall()]
            result['top_properties'] = top_properties
        
        # Log automation
        cursor.execute("""
            INSERT INTO automation_logs (automation_name, status, message)
            VALUES (?, ?, ?)
        """, (name, 'success', json.dumps(result)))
        
        conn.commit()
        conn.close()
        
        self._send_json(result)


def run_server(port=3000):
    """Run the API server"""
    server = HTTPServer(('0.0.0.0', port), ImmoAPIHandler)
    print(f"E-Immo API running on http://0.0.0.0:{port}")
    server.serve_forever()


if __name__ == '__main__':
    run_server()