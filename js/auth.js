/**
 * E-Immo Platform - Advanced Authentication Module
 * Features: Social Login, 2FA, Password Reset, Session Management
 */

(function() {
  'use strict';

  const AuthModule = {
    // Configuration
    config: {
      tokenKey: 'eimmo_auth_token',
      userKey: 'eimmo_user',
      sessionKey: 'eimmo_session',
      rememberKey: 'eimmo_remember',
      tokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
      providers: ['google', 'facebook', 'apple']
    },

    // Current user
    currentUser: null,

    /**
     * Initialize authentication
     */
    init() {
      this.loadSession();
      this.setupEventListeners();
      this.checkSessionExpiry();
    },

    /**
     * Load existing session
     */
    loadSession() {
      const userData = localStorage.getItem(this.config.userKey);
      const token = localStorage.getItem(this.config.tokenKey);
      
      if (userData && token) {
        this.currentUser = JSON.parse(userData);
        this.updateUI();
      }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Login form
      const loginForm = document.getElementById('loginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
      }

      // Register form
      const registerForm = document.getElementById('registerForm');
      if (registerForm) {
        registerForm.addEventListener('submit', (e) => this.handleRegister(e));
      }

      // Password reset form
      const resetForm = document.getElementById('resetForm');
      if (resetForm) {
        resetForm.addEventListener('submit', (e) => this.handlePasswordReset(e));
      }

      // Social login buttons
      document.querySelectorAll('.social-login-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleSocialLogin(btn.dataset.provider);
        });
      });

      // Logout button
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.logout());
      }

      // Remember me toggle
      const rememberMe = document.getElementById('rememberMe');
      if (rememberMe) {
        rememberMe.addEventListener('change', (e) => {
          localStorage.setItem(this.config.rememberKey, e.target.checked);
        });
      }
    },

    /**
     * Handle email/password login
     */
    async handleLogin(e) {
      e.preventDefault();
      
      const form = e.target;
      const email = form.email?.value;
      const password = form.password?.value;
      const remember = form.rememberMe?.checked || false;

      if (!email || !password) {
        this.showError('Veuillez remplir tous les champs');
        return;
      }

      // Show loading
      this.showLoading('Connexion en cours...');

      try {
        // Simulate API call - Replace with real API
        await this.simulateApiCall(1500);
        
        // Check credentials (demo)
        if (this.validateCredentials(email, password)) {
          const user = this.createUserSession(email);
          this.saveSession(user, remember);
          this.showSuccess('Connexion réussie!');
          this.redirectAfterLogin();
        } else {
          throw new Error('Email ou mot de passe incorrect');
        }
      } catch (error) {
        this.showError(error.message);
      } finally {
        this.hideLoading();
      }
    },

    /**
     * Handle registration
     */
    async handleRegister(e) {
      e.preventDefault();
      
      const form = e.target;
      const name = form.companyName?.value || form.name?.value;
      const email = form.email?.value;
      const password = form.password?.value;
      const confirmPassword = form.confirmPassword?.value;

      if (!name || !email || !password) {
        this.showError('Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (password !== confirmPassword) {
        this.showError('Les mots de passe ne correspondent pas');
        return;
      }

      if (password.length < 8) {
        this.showError('Le mot de passe doit contenir au moins 8 caractères');
        return;
      }

      this.showLoading('Création du compte...');

      try {
        await this.simulateApiCall(2000);
        
        const user = {
          id: this.generateId(),
          name: name,
          email: email,
          type: form.companyName ? 'company' : 'client',
          verified: false,
          createdAt: new Date().toISOString()
        };

        this.saveSession(user, true);
        this.showSuccess('Compte créé avec succès!');
        this.redirectAfterLogin();
      } catch (error) {
        this.showError(error.message);
      } finally {
        this.hideLoading();
      }
    },

    /**
     * Handle social login
     */
    async handleSocialLogin(provider) {
      this.showLoading(`Connexion avec ${provider}...`);

      try {
        // In production, redirect to OAuth provider
        // For demo, simulate social login
        await this.simulateApiCall(2000);
        
        const user = this.createSocialUser(provider);
        this.saveSession(user, true);
        this.showSuccess('Connexion réussie!');
        this.redirectAfterLogin();
      } catch (error) {
        this.showError('Échec de la connexion avec ' + provider);
      } finally {
        this.hideLoading();
      }
    },

    /**
     * Handle password reset request
     */
    async handlePasswordReset(e) {
      e.preventDefault();
      
      const email = e.target.email?.value;
      
      if (!email) {
        this.showError('Veuillez entrer votre email');
        return;
      }

      this.showLoading('Envoi du lien de réinitialisation...');

      try {
        await this.simulateApiCall(1500);
        this.showSuccess('Lien de réinitialisation envoyé à votre email');
        setTimeout(() => this.switchModal('resetModal', 'loginModal'), 2000);
      } catch (error) {
        this.showError('Erreur lors de l\'envoi du lien');
      } finally {
        this.hideLoading();
      }
    },

    /**
     * Handle 2FA verification
     */
    async verify2FA(code) {
      this.showLoading('Vérification...');

      try {
        await this.simulateApiCall(1000);
        
        if (code === '123456') { // Demo code
          this.currentUser.twoFactorVerified = true;
          localStorage.setItem(this.config.userKey, JSON.stringify(this.currentUser));
          this.showSuccess('2FA vérifié!');
          this.redirectAfterLogin();
        } else {
          throw new Error('Code invalide');
        }
      } catch (error) {
        this.showError(error.message);
      } finally {
        this.hideLoading();
      }
    },

    /**
     * Request 2FA setup
     */
    async setup2FA() {
      if (!this.currentUser) return;

      // Generate secret (in production, get from server)
      const secret = this.generateSecret();
      
      // Show QR code setup modal
      const modal = document.getElementById('2faSetupModal');
      if (modal) {
        modal.classList.add('active');
        // Display QR code for authenticator apps
      }

      return secret;
    },

    /**
     * Validate credentials (demo)
     */
    validateCredentials(email, password) {
      // Demo validation - replace with real API
      const demoUsers = [
        { email: 'electronbusiness07@gmail.com', password: 'demo123' },
        { email: 'test@example.com', password: 'test123' }
      ];

      return demoUsers.some(u => u.email === email && u.password === password);
    },

    /**
     * Create user session
     */
    createUserSession(email) {
      return {
        id: this.generateId(),
        email: email,
        name: email.split('@')[0],
        type: 'client',
        verified: true,
        twoFactorEnabled: false,
        twoFactorVerified: false,
        loginAt: new Date().toISOString()
      };
    },

    /**
     * Create social user
     */
    createSocialUser(provider) {
      return {
        id: this.generateId(),
        email: `user@${provider}.com`,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        type: 'client',
        provider: provider,
        verified: true,
        loginAt: new Date().toISOString()
      };
    },

    /**
     * Save session to storage
     */
    saveSession(user, remember = false) {
      const token = this.generateToken();
      
      this.currentUser = user;
      
      localStorage.setItem(this.config.tokenKey, token);
      localStorage.setItem(this.config.userKey, JSON.stringify(user));
      
      if (remember) {
        localStorage.setItem(this.config.rememberKey, 'true');
      }

      // Set session expiry
      const expiry = new Date(Date.now() + this.config.tokenExpiry);
      localStorage.setItem(this.config.sessionKey, expiry.toISOString());

      this.updateUI();
    },

    /**
     * Check session expiry
     */
    checkSessionExpiry() {
      const expiryStr = localStorage.getItem(this.config.sessionKey);
      if (!expiryStr) return;

      const expiry = new Date(expiryStr);
      if (Date.now() > expiry.getTime()) {
        this.logout();
      }
    },

    /**
     * Logout user
     */
    logout() {
      localStorage.removeItem(this.config.tokenKey);
      localStorage.removeItem(this.config.userKey);
      localStorage.removeItem(this.config.sessionKey);
      
      this.currentUser = null;
      this.updateUI();
      
      // Redirect to home
      window.location.href = '/';
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
      return !!this.currentUser && !!localStorage.getItem(this.config.tokenKey);
    },

    /**
     * Get current user
     */
    getUser() {
      return this.currentUser;
    },

    /**
     * Update UI based on auth state
     */
    updateUI() {
      // Update auth buttons
      const loginBtn = document.getElementById('loginBtn');
      const registerBtn = document.getElementById('registerBtn');
      const userMenu = document.getElementById('userMenu');
      const userName = document.getElementById('userName');
      const logoutBtn = document.getElementById('logoutBtn');

      if (this.isAuthenticated()) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (userName) userName.textContent = this.currentUser?.name || 'User';
        if (logoutBtn) logoutBtn.onclick = () => this.logout();
      } else {
        if (loginBtn) loginBtn.style.display = '';
        if (registerBtn) registerBtn.style.display = '';
        if (userMenu) userMenu.style.display = 'none';
      }
    },

    /**
     * Redirect after successful login
     */
    redirectAfterLogin() {
      setTimeout(() => {
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        if (redirect) {
          window.location.href = redirect;
        } else {
          window.location.href = '/dashboard.html';
        }
      }, 1000);
    },

    /**
     * Switch between modals
     */
    switchModal(from, to) {
      const fromModal = document.getElementById(from);
      const toModal = document.getElementById(to);
      
      if (fromModal) fromModal.classList.remove('active');
      if (toModal) {
        setTimeout(() => toModal.classList.add('active'), 100);
      }
    },

    /**
     * Show error message
     */
    showError(message) {
      this.showAlert(message, 'error');
    },

    /**
     * Show success message
     */
    showSuccess(message) {
      this.showAlert(message, 'success');
    },

    /**
     * Show alert message
     */
    showAlert(message, type = 'info') {
      const alert = document.createElement('div');
      alert.className = `alert alert-${type}`;
      alert.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>${message}</span>
      `;
      
      document.body.appendChild(alert);
      
      setTimeout(() => {
        alert.style.opacity = '1';
        setTimeout(() => alert.remove(), 3000);
      }, 100);
    },

    /**
     * Show loading overlay
     */
    showLoading(message = 'Chargement...') {
      let overlay = document.getElementById('loading');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
          <div class="spinner"></div>
          <p>${message}</p>
        `;
        document.body.appendChild(overlay);
      }
      overlay.querySelector('p').textContent = message;
      overlay.classList.add('active');
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
      const overlay = document.getElementById('loading');
      if (overlay) {
        overlay.classList.remove('active');
      }
    },

    /**
     * Generate unique ID
     */
    generateId() {
      return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Generate auth token
     */
    generateToken() {
      return 'tok_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    },

    /**
     * Generate 2FA secret
     */
    generateSecret() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let secret = '';
      for (let i = 0; i < 16; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return secret.match(/.{4}/g).join(' ');
    },

    /**
     * Simulate API call
     */
    simulateApiCall(delay) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // 90% success rate for demo
          if (Math.random() > 0.1) {
            resolve({ success: true });
          } else {
            reject(new Error('Erreur de connexion. Veuillez réessayer.'));
          }
        }, delay);
      });
    }
  };

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => AuthModule.init());

  // Export to global
  window.EImmoAuth = AuthModule;

})();
