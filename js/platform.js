/**
 * E-Immo Platform - Main JavaScript
 * Multi-Company Real Estate Platform
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════
  const CONFIG = {
    apiUrl: '/api',
    storageKey: 'eimmo_platform',
    demoCompany: {
      id: 'demo-001',
      name: 'ELECTRON',
      slug: 'electron',
      email: 'electronbusiness07@gmail.com',
      phone: '+229 01 977 003 47',
      logo: '',
      color: '#00d4ff',
      verified: true,
      services: ['vente', 'location', 'bureaux', 'gestion', 'investissement', 'expertise'],
      createdAt: '2024-01-15'
    },
    serviceTypes: {
      vente: { label: 'Vente', icon: '🏠', color: '#00d4ff' },
      location: { label: 'Location', icon: '🏡', color: '#c9a84c' },
      bureaux: { label: 'Bureaux', icon: '🏢', color: '#7c4dff' },
      gestion: { label: 'Gestion Locative', icon: '🔑', color: '#00d4ff' },
      investissement: { label: 'Investissement', icon: '📊', color: '#c9a84c' },
      expertise: { label: 'Expertise', icon: '📐', color: '#7c4dff' }
    },
    paymentMethods: {
      mobile_money: { 
        label: 'Mobile Money', 
        icon: '📱',
        providers: ['Moov Money', 'MTN Money', 'Coris Money']
      },
      bank_transfer: { 
        label: 'Virement Bancaire', 
        icon: '🏦',
        banks: ['Banque Atlantique', 'Ecobank', 'BOA', 'SG Benin']
      },
      visa: { 
        label: 'Visa/Mastercard', 
        icon: '💳',
        note: 'Paiement sécurisé en ligne'
      },
      cash: { 
        label: 'Espèces', 
        icon: '💵',
        note: 'Sur rendez-vous dans nos bureaux'
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════
  const Utils = {
    // Local Storage
    getData(key) {
      try {
        const data = localStorage.getItem(`${CONFIG.storageKey}_${key}`);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        console.error('Error reading from storage:', e);
        return null;
      }
    },

    setData(key, value) {
      try {
        localStorage.setItem(`${CONFIG.storageKey}_${key}`, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('Error writing to storage:', e);
        return false;
      }
    },

    removeData(key) {
      try {
        localStorage.removeItem(`${CONFIG.storageKey}_${key}`);
        return true;
      } catch (e) {
        return false;
      }
    },

    // Generate unique ID
    generateId() {
      return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Format date
    formatDate(date, locale = 'fr-FR') {
      return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },

    // Format price
    formatPrice(amount, currency = 'XOF') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
      }).format(amount);
    },

    // Slugify
    slugify(text) {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    },

    // Get URL params
    getUrlParam(param) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(param);
    },

    // Debounce
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    // Show element
    showElement(element) {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      if (element) {
        element.classList.add('active');
        element.style.display = '';
      }
    },

    // Hide element
    hideElement(element) {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      if (element) {
        element.classList.remove('active');
        element.style.display = 'none';
      }
    },

    // Toggle element
    toggleElement(element) {
      if (typeof element === 'string') {
        element = document.querySelector(element);
      }
      if (element) {
        element.classList.toggle('active');
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // COMPANY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  const CompanyManager = {
    companies: [],
    currentCompany: null,

    init() {
      this.companies = Utils.getData('companies') || [];
      
      // Add demo company if none exists
      if (this.companies.length === 0) {
        this.companies.push(CONFIG.demoCompany);
        Utils.setData('companies', this.companies);
      }
      
      this.currentCompany = Utils.getData('currentCompany') || this.companies[0];
    },

    getAll() {
      return this.companies;
    },

    getBySlug(slug) {
      return this.companies.find(c => c.slug === slug);
    },

    getCurrent() {
      return this.currentCompany;
    },

    setCurrent(companyId) {
      const company = this.companies.find(c => c.id === companyId);
      if (company) {
        this.currentCompany = company;
        Utils.setData('currentCompany', company);
      }
    },

    register(companyData) {
      const slug = Utils.slugify(companyData.name);
      
      // Check if company exists
      if (this.companies.find(c => c.slug === slug)) {
        return { success: false, error: 'Une entreprise avec ce nom existe déjà' };
      }

      const company = {
        id: Utils.generateId(),
        ...companyData,
        slug: slug,
        verified: false,
        createdAt: new Date().toISOString()
      };

      this.companies.push(company);
      Utils.setData('companies', this.companies);

      return { success: true, company: company };
    },

    update(companyId, data) {
      const index = this.companies.findIndex(c => c.id === companyId);
      if (index === -1) {
        return { success: false, error: 'Entreprise non trouvée' };
      }

      this.companies[index] = { ...this.companies[index], ...data };
      Utils.setData('companies', this.companies);

      if (this.currentCompany && this.currentCompany.id === companyId) {
        this.currentCompany = this.companies[index];
        Utils.setData('currentCompany', this.currentCompany);
      }

      return { success: true, company: this.companies[index] };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PROPERTY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════
  const PropertyManager = {
    properties: [],

    init() {
      this.properties = Utils.getData('properties') || [];
    },

    getAll(filters = {}) {
      let result = [...this.properties];

      if (filters.companyId) {
        result = result.filter(p => p.companyId === filters.companyId);
      }

      if (filters.type) {
        result = result.filter(p => p.type === filters.type);
      }

      if (filters.status) {
        result = result.filter(p => p.status === filters.status);
      }

      if (filters.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(p => 
          p.title.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.location.toLowerCase().includes(search)
        );
      }

      return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getById(id) {
      return this.properties.find(p => p.id === id);
    },

    create(propertyData) {
      const property = {
        id: Utils.generateId(),
        ...propertyData,
        status: 'active',
        views: 0,
        createdAt: new Date().toISOString()
      };

      this.properties.push(property);
      Utils.setData('properties', this.properties);

      return { success: true, property: property };
    },

    update(propertyId, data) {
      const index = this.properties.findIndex(p => p.id === propertyId);
      if (index === -1) {
        return { success: false, error: 'Propriété non trouvée' };
      }

      this.properties[index] = { ...this.properties[index], ...data };
      Utils.setData('properties', this.properties);

      return { success: true, property: this.properties[index] };
    },

    delete(propertyId) {
      const index = this.properties.findIndex(p => p.id === propertyId);
      if (index === -1) {
        return { success: false, error: 'Propriété non trouvée' };
      }

      this.properties.splice(index, 1);
      Utils.setData('properties', this.properties);

      return { success: true };
    },

    incrementViews(propertyId) {
      const property = this.properties.find(p => p.id === propertyId);
      if (property) {
        property.views = (property.views || 0) + 1;
        Utils.setData('properties', this.properties);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PAYMENT SYSTEM
  // ═══════════════════════════════════════════════════════════════════════
  const PaymentManager = {
    transactions: [],

    init() {
      this.transactions = Utils.getData('transactions') || [];
    },

    getMethods() {
      return CONFIG.paymentMethods;
    },

    createTransaction(transactionData) {
      const transaction = {
        id: Utils.generateId(),
        ...transactionData,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      this.transactions.push(transaction);
      Utils.setData('transactions', this.transactions);

      return { success: true, transaction: transaction };
    },

    getTransactionsByProperty(propertyId) {
      return this.transactions.filter(t => t.propertyId === propertyId);
    },

    getTransactionsByCompany(companyId) {
      return this.transactions.filter(t => t.companyId === companyId);
    },

    updateStatus(transactionId, status) {
      const index = this.transactions.findIndex(t => t.id === transactionId);
      if (index !== -1) {
        this.transactions[index].status = status;
        Utils.setData('transactions', this.transactions);
        return { success: true };
      }
      return { success: false, error: 'Transaction non trouvée' };
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // UI COMPONENTS
  // ═══════════════════════════════════════════════════════════════════════
  const UI = {
    // Show loading overlay
    showLoading(message = 'Chargement...') {
      let overlay = document.querySelector('.loading-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
          <div class="spinner"></div>
          <p>${message}</p>
        `;
        document.body.appendChild(overlay);
      }
      overlay.classList.add('active');
    },

    hideLoading() {
      const overlay = document.querySelector('.loading-overlay');
      if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
      }
    },

    // Show alert
    showAlert(message, type = 'info') {
      const alert = document.createElement('div');
      alert.className = `alert alert-${type}`;
      alert.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>${message}</span>
      `;
      
      const container = document.querySelector('.main-content') || document.body;
      container.insertBefore(alert, container.firstChild);
      
      setTimeout(() => {
        alert.classList.add('show');
        setTimeout(() => alert.remove(), 3000);
      }, 100);

      return alert;
    },

    // Show modal
    showModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    },

    // Hide modal
    hideModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    },

    // Render property card
    renderPropertyCard(property, options = {}) {
      const typeInfo = CONFIG.serviceTypes[property.type] || {};
      const imageUrl = property.images?.[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250"%3E%3Crect fill="%230a1628" width="400" height="250"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23667899" font-size="40"%3E🏠%3C/text%3E%3C/svg%3E';
      
      return `
        <div class="property-card" data-id="${property.id}">
          <div class="property-image">
            <img src="${imageUrl}" alt="${property.title}" loading="lazy">
            <span class="property-type badge badge-${property.type === 'vente' ? 'cyan' : property.type === 'location' ? 'or' : 'violet'}">
              ${typeInfo.icon} ${typeInfo.label}
            </span>
            ${property.featured ? '<span class="property-featured">Featured</span>' : ''}
          </div>
          <div class="property-body">
            <h3 class="property-title">${property.title}</h3>
            <p class="property-location">📍 ${property.location}</p>
            <div class="property-details">
              ${property.bedrooms ? `<span>🛏️ ${property.bedrooms} ch.</span>` : ''}
              ${property.bathrooms ? `<span>🚿 ${property.bathrooms} sdb</span>` : ''}
              ${property.surface ? `<span>📐 ${property.surface} m²</span>` : ''}
            </div>
            <div class="property-price">${Utils.formatPrice(property.price)}</div>
            ${options.showCompany !== false && property.companyId ? `
              <div class="property-company">
                ${this.renderCompanyBadge(property.companyId)}
              </div>
            ` : ''}
            <a href="/property/${property.id}" class="btn btn-primary btn-sm">Voir l'offre</a>
          </div>
        </div>
      `;
    },

    // Render company badge
    renderCompanyBadge(companyId) {
      const company = CompanyManager.companies.find(c => c.id === companyId);
      if (!company) return '';
      
      return `
        <span class="company-verified" title="${company.name}">
          <span class="company-color" style="background: ${company.color || '#00d4ff'}"></span>
          ${company.name}
          ${company.verified ? '<span class="verified-icon" title="Vérifié">✓</span>' : ''}
        </span>
      `;
    },

    // Render payment methods
    renderPaymentMethods(propertyId = null) {
      const methods = this.getMethods();
      let html = '<div class="payment-methods">';
      
      for (const [key, method] of Object.entries(methods)) {
        html += `
          <div class="payment-method" data-method="${key}">
            <div class="payment-icon">${method.icon}</div>
            <div class="payment-info">
              <h4>${method.label}</h4>
              <p>${method.note || ''}</p>
            </div>
          </div>
        `;
      }
      
      html += '</div>';
      return html;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════
  const Navigation = {
    init() {
      this.setupNavbar();
      this.setupScroll();
    },

    setupNavbar() {
      const navbar = document.getElementById('navbar');
      const navToggle = document.getElementById('nav-toggle');
      const navLinks = document.getElementById('nav-links');

      if (!navbar) return;

      // Mobile menu toggle
      if (navToggle) {
        navToggle.addEventListener('click', () => {
          navToggle.classList.toggle('active');
          navLinks.classList.toggle('active');
          navToggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
        });
      }

      // Close on link click
      document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
          navToggle?.classList.remove('active');
          navLinks?.classList.remove('active');
        });
      });

      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks?.classList.contains('active')) {
          navToggle?.classList.remove('active');
          navLinks.classList.remove('active');
        }
      });
    },

    setupScroll() {
      const navbar = document.getElementById('navbar');
      
      window.addEventListener('scroll', Utils.debounce(() => {
        if (window.scrollY > 50) {
          navbar?.classList.add('scrolled');
        } else {
          navbar?.classList.remove('scrolled');
        }
      }, 10));
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SCROLL ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════
  const ScrollAnimations = {
    init() {
      this.setup();
      this.setupParallax();
    },

    setup() {
      const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      elements.forEach(el => observer.observe(el));
    },

    setupParallax() {
      const parallaxes = document.querySelectorAll('.parallax');
      
      window.addEventListener('scroll', Utils.debounce(() => {
        const scrolled = window.scrollY;
        
        parallaxes.forEach(el => {
          const speed = parseFloat(el.dataset.speed) || 0.5;
          el.style.transform = `translateY(${scrolled * speed}px)`;
        });
      }, 10));
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // FORMS
  // ═══════════════════════════════════════════════════════════════════════
  const Forms = {
    init() {
      this.setupValidation();
      this.setupFileUpload();
    },

    setupValidation() {
      const forms = document.querySelectorAll('.needs-validation');
      
      forms.forEach(form => {
        form.addEventListener('submit', (e) => {
          if (!form.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
          }
          form.classList.add('was-validated');
        });
      });

      // Real-time validation
      const inputs = document.querySelectorAll('.form-input, .form-select');
      inputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => {
          if (input.classList.contains('error')) {
            this.validateField(input);
          }
        });
      });
    },

    validateField(input) {
      const isValid = input.checkValidity();
      
      if (isValid) {
        input.classList.remove('error');
        input.classList.add('success');
      } else {
        input.classList.remove('success');
        input.classList.add('error');
      }
      
      return isValid;
    },

    setupFileUpload() {
      const dropzones = document.querySelectorAll('.file-upload');
      
      dropzones.forEach(dropzone => {
        const input = dropzone.querySelector('input[type="file"]');
        const preview = dropzone.querySelector('.upload-preview');
        
        if (!input) return;

        // Click to upload
        dropzone.addEventListener('click', () => input.click());

        // File change
        input.addEventListener('change', () => this.handleFiles(input.files, preview));

        // Drag and drop
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
          dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
          this.handleFiles(e.dataTransfer.files, preview);
        });
      });
    },

    handleFiles(files, preview) {
      if (!files || files.length === 0) return;
      
      // Preview logic would go here
      console.log('Files selected:', files);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // MODALS
  // ═══════════════════════════════════════════════════════════════════
  const Modals = {
    init() {
      this.setup();
    },

    setup() {
      // Close on overlay click
      document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
          }
        });
      });

      // Close on button
      document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
          const overlay = btn.closest('.modal-overlay');
          if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
          }
        });
      });

      // Close on escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const activeModal = document.querySelector('.modal-overlay.active');
          if (activeModal) {
            activeModal.classList.remove('active');
            document.body.style.overflow = '';
          }
        }
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════
  function init() {
    // Initialize managers
    CompanyManager.init();
    PropertyManager.init();
    PaymentManager.init();

    // Initialize UI components
    Navigation.init();
    ScrollAnimations.init();
    Forms.init();
    Modals.init();

    // Publish to global
    window.EImmo = {
      CONFIG,
      Utils,
      CompanyManager,
      PropertyManager,
      PaymentManager,
      UI
    };

    console.log('E-Immo Platform initialized');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();