/**
 * E-Immo Platform - Security Module
 * Features: SSL, Security Headers, Input Validation, GDPR
 */

(function() {
  'use strict';

  const SecurityModule = {
    // Security configuration
    config: {
      csrfTokenName: 'eimmo_csrf_token',
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      passwordMinLength: 8,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      maxFileSize: 10 * 1024 * 1024 // 10MB
    },

    /**
     * Initialize security module
     */
    init() {
      this.setupCSRFProtection();
      this.setupInputValidation();
      this.setupSecurityHeaders();
      this.setupRateLimiting();
      this.setupGDPRConsent();
    },

    /**
     * Setup CSRF protection
     */
    setupCSRFProtection() {
      // Generate CSRF token
      const token = this.generateCSRFToken();
      localStorage.setItem(this.config.csrfTokenName, token);

      // Add token to all AJAX requests
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        const [resource, config] = args;
        
        // Add CSRF token to requests
        if (config && (config.method === 'POST' || config.method === 'PUT' || config.method === 'DELETE')) {
          config.headers = {
            ...config.headers,
            'X-CSRF-Token': localStorage.getItem(SecurityModule.config.csrfTokenName)
          };
        }
        
        return originalFetch.apply(this, args);
      };
    },

    /**
     * Generate CSRF token
     */
    generateCSRFToken() {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Verify CSRF token
     */
    verifyCSRFToken(token) {
      const stored = localStorage.getItem(this.config.csrfTokenName);
      return token === stored;
    },

    /**
     * Setup input validation
     */
    setupInputValidation() {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      // Phone validation (Benin format)
      const phoneRegex = /^\+?229[0-9]{8}$/;
      
      // XOF price validation
      const priceRegex = /^[0-9]+$/;

      // Add validation to forms
      document.querySelectorAll('.validate-email').forEach(input => {
        input.addEventListener('blur', function() {
          const isValid = emailRegex.test(this.value);
          this.classList.toggle('invalid', !isValid);
          this.classList.toggle('valid', isValid);
        });
      });

      document.querySelectorAll('.validate-phone').forEach(input => {
        input.addEventListener('blur', function() {
          const isValid = phoneRegex.test(this.value.replace(/\s/g, ''));
          this.classList.toggle('invalid', !isValid);
          this.classList.toggle('valid', isValid);
        });
      });
    },

    /**
     * Setup security headers (meta tags)
     */
    setupSecurityHeaders() {
      // CSP is handled server-side, but we can add meta for reference
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://api.stripe.com",
        "frame-src https://js.stripe.com"
      ].join('; ');
      document.head.appendChild(meta);
    },

    /**
     * Setup rate limiting (client-side)
     */
    setupRateLimiting() {
      this.loginAttempts = 0;
      this.lockedUntil = null;
    },

    /**
     * Check if account is locked
     */
    isLocked() {
      if (this.lockedUntil && Date.now() < this.lockedUntil) {
        const remaining = Math.ceil((this.lockedUntil - Date.now()) / 1000 / 60);
        throw new Error(`Compte verrouillé. Réessayez dans ${remaining} minutes.`);
      }
      return false;
    },

    /**
     * Record failed login attempt
     */
    recordFailedAttempt() {
      this.loginAttempts++;
      if (this.loginAttempts >= this.config.maxLoginAttempts) {
        this.lockedUntil = Date.now() + this.config.lockoutDuration;
        this.loginAttempts = 0;
        throw new Error('Trop de tentatives. Compte verrouillé pour 15 minutes.');
      }
    },

    /**
     * Reset login attempts
     */
    resetLoginAttempts() {
      this.loginAttempts = 0;
      this.lockedUntil = null;
    },

    /**
     * Setup GDPR consent
     */
    setupGDPRConsent() {
      // Check if consent was given
      const consent = localStorage.getItem('eimmo_gdpr_consent');
      
      if (!consent) {
        this.showGDPRBanner();
      }
    },

    /**
     * Show GDPR banner
     */
    showGDPRBanner() {
      const banner = document.createElement('div');
      banner.id = 'gdpr-banner';
      banner.className = 'gdpr-banner';
      banner.innerHTML = `
        <div class="gdpr-content">
          <p>Nous utilisons des cookies pour améliorer votre expérience. 
             <a href="/privacy.html" target="_blank">Politique de confidentialité</a></p>
          <div class="gdpr-buttons">
            <button class="btn-accept">Accepter</button>
            <button class="btn-reject">Refuser</button>
          </div>
        </div>
      `;
      document.body.appendChild(banner);

      banner.querySelector('.btn-accept').addEventListener('click', () => {
        localStorage.setItem('eimmo_gdpr_consent', 'accepted');
        localStorage.setItem('eimmo_gdpr_date', new Date().toISOString());
        banner.remove();
      });

      banner.querySelector('.btn-reject').addEventListener('click', () => {
        localStorage.setItem('eimmo_gdpr_consent', 'rejected');
        banner.remove();
      });
    },

    /**
     * Check GDPR consent
     */
    hasConsent() {
      return localStorage.getItem('eimmo_gdpr_consent') === 'accepted';
    },

    /**
     * Sanitize input
     */
    sanitize(input) {
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    },

    /**
     * Validate file upload
     */
    validateFile(file) {
      // Check file type
      if (!this.config.allowedFileTypes.includes(file.type)) {
        throw new Error('Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou PDF.');
      }

      // Check file size
      if (file.size > this.config.maxFileSize) {
        throw new Error('Fichier trop volumineux. Maximum 10MB.');
      }

      return true;
    },

    /**
     * Hash password (client-side - should also be done server-side)
     */
    async hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * XSS protection - escape HTML
     */
    escapeHTML(str) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
      };
      return str.replace(/[&<>"'/]/g, char => map[char]);
    },

    /**
     * Secure storage
     */
    secureSet(key, value) {
      try {
        // In production, encrypt before storing
        const encrypted = btoa(JSON.stringify(value));
        localStorage.setItem(key, encrypted);
        return true;
      } catch (e) {
        console.error('Secure storage error:', e);
        return false;
      }
    },

    /**
     * Secure get
     */
    secureGet(key) {
      try {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        return JSON.parse(atob(encrypted));
      } catch (e) {
        console.error('Secure storage error:', e);
        return null;
      }
    },

    /**
     * Clear sensitive data
     */
    clearSensitiveData() {
      const keysToRemove = [
        'eimmo_auth_token',
        'eimmo_user',
        'eimmo_csrf_token',
        'eimmo_session'
      ];

      keysToRemove.forEach(key => localStorage.removeItem(key));
    },

    /**
     * Log security event
     */
    logSecurityEvent(event, details = {}) {
      const log = {
        event,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ...details
      };
      
      // In production, send to server
      console.log('[Security]', log);
    }
  };

  // Initialize
  document.addEventListener('DOMContentLoaded', () => SecurityModule.init());

  // Export
  window.SecurityModule = SecurityModule;

})();
