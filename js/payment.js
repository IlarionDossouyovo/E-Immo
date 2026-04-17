/**
 * E-Immo Platform - Payment Module
 * Features: Stripe, PayPal, Mobile Money, Payment Plans
 */

(function() {
  'use strict';

  const PaymentModule = {
    // Configuration
    config: {
      stripePublicKey: 'pk_test_your_stripe_key',
      currency: 'XOF',
      currencySymbol: 'XOF',
      minAmount: 1000,
      maxAmount: 50000000,
      paymentMethods: ['card', 'mobile_money', 'bank_transfer', 'cash']
    },

    // Payment state
    state: {
      currentMethod: null,
      propertyId: null,
      amount: 0,
      transactionId: null
    },

    /**
     * Initialize payment module
     */
    init() {
      this.setupEventListeners();
      this.loadStripe();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Payment method selection
      document.querySelectorAll('.payment-method-card').forEach(card => {
        card.addEventListener('click', () => {
          this.selectPaymentMethod(card.dataset.method);
        });
      });

      // Stripe card element
      const cardElement = document.getElementById('card-element');
      if (cardElement) {
        this.initStripeCard();
      }

      // Payment form
      const paymentForm = document.getElementById('paymentForm');
      if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => this.processPayment(e));
      }

      // Mobile money form
      const mobileMoneyForm = document.getElementById('mobileMoneyForm');
      if (mobileMoneyForm) {
        mobileMoneyForm.addEventListener('submit', (e) => this.processMobileMoney(e));
      }

      // Bank transfer form
      const bankTransferForm = document.getElementById('bankTransferForm');
      if (bankTransferForm) {
        bankTransferForm.addEventListener('submit', (e) => this.processBankTransfer(e));
      }

      // Installment options
      document.querySelectorAll('.installment-option').forEach(option => {
        option.addEventListener('click', () => {
          this.selectInstallment(option.dataset.installments);
        });
      });
    },

    /**
     * Load Stripe.js
     */
    loadStripe() {
      if (typeof Stripe !== 'undefined') {
        this.stripe = Stripe(this.config.stripePublicKey);
        this.elements = this.stripe.elements();
      }
    },

    /**
     * Initialize Stripe card element
     */
    initStripeCard() {
      if (!this.elements) return;

      const style = {
        base: {
          color: '#f4f6fa',
          fontFamily: '"DM Sans", sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#8899bb'
          }
        },
        invalid: {
          color: '#ef4444',
          iconColor: '#ef4444'
        }
      };

      this.cardElement = this.elements.create('card', { style });
      this.cardElement.mount('#card-element');

      this.cardElement.on('change', (event) => {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
          displayError.textContent = event.error.message;
        } else {
          displayError.textContent = '';
        }
      });
    },

    /**
     * Select payment method
     */
    selectPaymentMethod(method) {
      this.state.currentMethod = method;

      // Update UI
      document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.method === method);
      });

      // Show/hide relevant forms
      document.querySelectorAll('.payment-form').forEach(form => {
        form.style.display = 'none';
      });

      const selectedForm = document.getElementById(`${method}Form`);
      if (selectedForm) {
        selectedForm.style.display = 'block';
      }

      // Store selection
      localStorage.setItem('eimmo_selected_payment', method);
    },

    /**
     * Process card payment
     */
    async processPayment(e) {
      e.preventDefault();

      const form = e.target;
      const amount = parseInt(form.amount?.value || this.state.amount);
      const propertyId = form.propertyId?.value || this.state.propertyId;

      if (!this.validateAmount(amount)) {
        this.showError('Montant invalide');
        return;
      }

      this.showLoading('Traitement du paiement...');

      try {
        // In production, call your backend to create PaymentIntent
        // const response = await fetch('/api/create-payment-intent', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ amount, propertyId })
        // });
        // const { clientSecret } = await response.json();

        // For demo, simulate payment
        await this.simulatePayment();

        const result = await this.stripe.confirmCardPayment(clientSecret || 'demo', {
          payment_method: {
            card: this.cardElement,
            billing_details: {
              name: form.name?.value || 'Client',
              email: form.email?.value || 'client@example.com'
            }
          }
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        this.onPaymentSuccess(result.paymentIntent, propertyId);

      } catch (error) {
        this.showError(error.message);
      } finally {
        this.hideLoading();
      }
    },

    /**
     * Process Mobile Money payment
     */
    async processMobileMoney(e) {
      e.preventDefault();

      const form = e.target;
      const phone = form.phone?.value;
      const provider = form.provider?.value;
      const amount = parseInt(form.amount?.value || this.state.amount);
      const propertyId = form.propertyId?.value || this.state.propertyId;

      if (!phone) {
        this.showError('Veuillez entrer votre numéro de téléphone');
        return;
      }

      this.showLoading('Envoi de la demande de paiement...');

      try {
        // In production, integrate with Mobile Money API (MTN, Moov, Coris)
        // For demo, simulate
        await this.simulatePayment();

        // Show confirmation message
        this.showNotification('Demande de paiement envoyée! Vérifiez votre téléphone.', 'success');

        // Wait for payment confirmation (in production, use webhooks)
        await this.waitForConfirmation(30000);

        this.onPaymentSuccess({ id: 'mm_' + Date.now() }, propertyId);

      } catch (error) {
        this.showError(error.message);
      } finally {
        this.hideLoading();
      }
    },

    /**
     * Process Bank Transfer
     */
    async processBankTransfer(e) {
      e.preventDefault();

      const form = e.target;
      const bank = form.bank?.value;
      const amount = parseInt(form.amount?.value || this.state.amount);
      const propertyId = form.propertyId?.value || this.state.propertyId;

      if (!bank) {
        this.showError('Veuillez sélectionner une banque');
        return;
      }

      this.showLoading('Génération du bon de paiement...');

      try {
        // Generate payment reference
        const reference = 'EIMMO-' + Date.now();
        
        // Show bank transfer details
        const transferDetails = this.getBankDetails(bank);
        
        // Display payment instructions
        this.showBankTransferModal(reference, transferDetails, amount);

        // Save pending transaction
        this.savePendingTransaction({
          id: reference,
          method: 'bank_transfer',
          amount,
          propertyId,
          bank,
          status: 'pending'
        });

      } catch (error) {
        this.showError(error.message);
      } finally {
        this.hideLoading();
      }
    },

    /**
     * Process Cash payment
     */
    async processCashPayment(e) {
      e.preventDefault();

      const form = e.target;
      const amount = parseInt(form.amount?.value || this.state.amount);
      const propertyId = form.propertyId?.value || this.state.propertyId;
      const location = form.location?.value;

      if (!location) {
        this.showError('Veuillez sélectionner un bureau');
        return;
      }

      this.showLoading('Génération du rendez-vous...');

      try {
        const reference = 'CASH-' + Date.now();
        
        // Show appointment confirmation
        this.showCashPaymentModal(reference, location, amount);

        this.savePendingTransaction({
          id: reference,
          method: 'cash',
          amount,
          propertyId,
          location,
          status: 'pending'
        });

      } catch (error) {
        this.showError(error.message);
      } finally {
        this.hideLoading();
      }
    },

    /**
     * Select installment plan
     */
    selectInstallment(installments) {
      const amount = this.state.amount;
      const monthlyAmount = Math.ceil(amount / installments);
      
      document.querySelectorAll('.installment-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.installments === installments);
      });

      // Update display
      const installmentDisplay = document.getElementById('installmentDisplay');
      if (installmentDisplay) {
        installmentDisplay.innerHTML = `
          <div class="installment-summary">
            <span>${installments} x ${this.formatPrice(monthlyAmount)}</span>
            <small>Total: ${this.formatPrice(amount)}</small>
          </div>
        `;
      }

      this.state.installments = installments;
    },

    /**
     * Get bank details
     */
    getBankDetails(bank) {
      const banks = {
        'atlantique': {
          name: 'Banque Atlantique',
          account: '123 456 789 01',
          code: 'BA'
        },
        'ecobank': {
          name: 'Ecobank',
          account: '987 654 321 09',
          code: 'ECO'
        },
        'boa': {
          name: 'Bank of Africa',
          account: '456 789 123 07',
          code: 'BOA'
        },
        'sg': {
          name: 'Société Générale',
          account: '789 123 456 05',
          code: 'SG'
        }
      };

      return banks[bank] || banks.atlantique;
    },

    /**
     * Show bank transfer modal
     */
    showBankTransferModal(reference, details, amount) {
      const modal = document.getElementById('bankTransferModal');
      if (modal) {
        document.getElementById('transferReference').textContent = reference;
        document.getElementById('transferBank').textContent = details.name;
        document.getElementById('transferAccount').textContent = details.account;
        document.getElementById('transferAmount').textContent = this.formatPrice(amount);
        
        modal.classList.add('active');
      }
    },

    /**
     * Show cash payment modal
     */
    showCashPaymentModal(reference, location, amount) {
      const modal = document.getElementById('cashPaymentModal');
      if (modal) {
        document.getElementById('cashReference').textContent = reference;
        document.getElementById('cashLocation').textContent = location;
        document.getElementById('cashAmount').textContent = this.formatPrice(amount);
        
        modal.classList.add('active');
      }
    },

    /**
     * Save pending transaction
     */
    savePendingTransaction(transaction) {
      const transactions = JSON.parse(localStorage.getItem('eimmo_transactions') || '[]');
      transactions.push(transaction);
      localStorage.setItem('eimmo_transactions', JSON.stringify(transactions));
    },

    /**
     * On payment success
     */
    onPaymentSuccess(paymentIntent, propertyId) {
      // Update transaction status
      const transactions = JSON.parse(localStorage.getItem('eimmo_transactions') || '[]');
      const transaction = transactions.find(t => t.propertyId === propertyId);
      if (transaction) {
        transaction.status = 'completed';
        transaction.completedAt = new Date().toISOString();
        localStorage.setItem('eimmo_transactions', JSON.stringify(transactions));
      }

      // Show success
      this.showSuccessModal(paymentIntent.id);

      // Send confirmation email (in production)
      // Redirect after delay
      setTimeout(() => {
        window.location.href = '/confirmation.html?id=' + paymentIntent.id;
      }, 3000);
    },

    /**
     * Show success modal
     */
    showSuccessModal(transactionId) {
      const modal = document.getElementById('paymentSuccessModal');
      if (modal) {
        document.getElementById('successTransactionId').textContent = transactionId;
        modal.classList.add('active');
      }
    },

    /**
     * Validate amount
     */
    validateAmount(amount) {
      return amount >= this.config.minAmount && amount <= this.config.maxAmount;
    },

    /**
     * Format price
     */
    formatPrice(amount) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: this.config.currency,
        maximumFractionDigits: 0
      }).format(amount);
    },

    /**
     * Simulate payment (demo)
     */
    simulatePayment() {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 2000);
      });
    },

    /**
     * Wait for payment confirmation
     */
    waitForConfirmation(timeout) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Délai de confirmation dépassé'));
        }, timeout);

        // In production, use webhooks or polling
        // For demo, auto-resolve after delay
        setTimeout(() => {
          clearTimeout(timer);
          resolve({ confirmed: true });
        }, 5000);
      });
    },

    /**
     * Show loading
     */
    showLoading(message) {
      let overlay = document.getElementById('paymentLoading');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'paymentLoading';
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
     * Hide loading
     */
    hideLoading() {
      const overlay = document.getElementById('paymentLoading');
      if (overlay) overlay.classList.remove('active');
    },

    /**
     * Show error
     */
    showError(message) {
      this.showNotification(message, 'error');
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>${message}</span>
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }, 100);
    }
  };

  // Initialize
  document.addEventListener('DOMContentLoaded', () => PaymentModule.init());

  // Export
  window.EImmoPayment = PaymentModule;

})();
