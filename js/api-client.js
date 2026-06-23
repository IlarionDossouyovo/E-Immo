/**
 * E-Immo API Client
 * Client JavaScript pour communiquer avec l'API
 */

const API_URL = 'http://localhost:3000';

// Store for JWT token
let authToken = localStorage.getItem('immo_token');
let currentUser = JSON.parse(localStorage.getItem('immo_user') || 'null');

// API Methods
const API = {
    /**
     * Login
     */
    async login(username, password) {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('immo_token', data.token);
            localStorage.setItem('immo_user', JSON.stringify(data.user));
        }
        
        return data;
    },
    
    /**
     * Register
     */
    async register(username, email, password, fullName) {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, full_name: fullName })
        });
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('immo_token', data.token);
            localStorage.setItem('immo_user', JSON.stringify(data.user));
        }
        
        return data;
    },
    
    /**
     * Logout
     */
    logout() {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('immo_token');
        localStorage.removeItem('immo_user');
    },
    
    /**
     * Get current user
     */
    getUser() {
        return currentUser;
    },
    
    /**
     * Check if logged in
     */
    isLoggedIn() {
        return !!authToken;
    },
    
    /**
     * Get properties
     */
    async getProperties(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_URL}/api/properties?${params}`);
        return await response.json();
    },
    
    /**
     * Get property by ID
     */
    async getProperty(id) {
        const response = await fetch(`${API_URL}/api/properties/${id}`);
        return await response.json();
    },
    
    /**
     * Create property
     */
    async createProperty(data) {
        const response = await fetch(`${API_URL}/api/properties`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    },
    
    /**
     * Get companies
     */
    async getCompanies() {
        const response = await fetch(`${API_URL}/api/companies`);
        return await response.json();
    },
    
    /**
     * Get stats
     */
    async getStats() {
        const response = await fetch(`${API_URL}/api/properties/stats`);
        return await response.json();
    },
    
    /**
     * Chat with AI
     */
    async chat(message, context = {}) {
        const response = await fetch(`${API_URL}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, context })
        });
        return await response.json();
    },
    
    /**
     * Run automation
     */
    async runAutomation(name) {
        const response = await fetch(`${API_URL}/api/automation/run`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name })
        });
        return await response.json();
    },
    
    /**
     * Get automation logs
     */
    async getAutomationLogs() {
        const response = await fetch(`${API_URL}/api/automation/logs`);
        return await response.json();
    }
};

// Export
window.API = API;