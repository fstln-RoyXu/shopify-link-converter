/**
 * UI Controller for Shopify Link Converter
 */

class ConverterUI {
  constructor() {
    this.converter = new ShopifyLinkConverter();
    
    this.initElements();
    this.initEventListeners();
    this.loadLastConversion();
  }

  /**
   * Get cookie value by name
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value or null if not found
   */
  getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  /**
   * Set cookie with name, value, and expiration in days
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {number} days - Expiration in days (default 30)
   */
  setCookie(name, value, days = 30) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/`;
  }

  /**
   * Delete cookie by name
   * @param {string} name - Cookie name
   */
  deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }

  /**
   * Save last successful conversion to cookie
   * @param {string} adminUrl - The admin URL that was successfully converted
   */
  saveLastConversion(adminUrl) {
    this.setCookie('lastShopifyConversion', adminUrl);
  }

  /**
   * Load last conversion from cookie and auto-populate/convert if exists
   */
  loadLastConversion() {
    const lastUrl = this.getCookie('lastShopifyConversion');
    if (lastUrl) {
      // Populate the input field
      this.adminUrlInput.value = lastUrl;
      
      // Auto-convert after a short delay to ensure DOM is ready
      setTimeout(() => {
        this.handleSingleConvert();
      }, 300);
    }
  }

  /**
   * Initialize DOM element references
   */
  initElements() {
    // Single mode elements
    this.adminUrlInput = document.getElementById('adminUrl');
    this.convertBtn = document.getElementById('convertBtn');
    this.singleResult = document.getElementById('singleResult');
    this.storefrontUrlOutput = document.getElementById('storefrontUrl');
    this.conversionDetails = document.getElementById('conversionDetails');
    this.copyBtn = document.getElementById('copyBtn');
    this.openBtn = document.getElementById('openBtn');
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Single mode
    this.convertBtn.addEventListener('click', () => this.handleSingleConvert());
    this.adminUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSingleConvert();
    });
    this.adminUrlInput.addEventListener('input', () => this.clearSingleResult());
    this.copyBtn.addEventListener('click', () => this.copySingleResult());
    this.openBtn.addEventListener('click', () => this.openSingleResult());
  }

/**
 * Handle single URL conversion
 */
handleSingleConvert() {
    const adminUrl = this.adminUrlInput.value.trim();
    
    if (!adminUrl) {
        this.showError('Please enter a URL');
        return;
    }
    
    // Show loading state
    this.convertBtn.disabled = true;
    this.convertBtn.textContent = 'Converting...';
    
    // Small delay for UX
    setTimeout(() => {
        const result = this.converter.convert(adminUrl);
        this.displaySingleResult(result);
        
        // Save successful conversion to cookie
        if (result.success) {
            this.saveLastConversion(adminUrl);
        }
        
        // Reset button
        this.convertBtn.disabled = false;
        this.convertBtn.textContent = 'Convert';
    }, 200);
}

  /**
   * Display single conversion result
   */
  displaySingleResult(result) {
    if (result.success) {
      this.singleResult.classList.add('active', 'success');
      this.singleResult.classList.remove('error');
      
      this.storefrontUrlOutput.value = result.storefrontUrl;
      
      // Display details
      const { store, themeId, pageType, view } = result.details;
      this.conversionDetails.innerHTML = `
        <div class="detail-item">
          <span class="detail-label">Store:</span>
          <span class="detail-value">${store}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Theme ID:</span>
          <span class="detail-value">${themeId}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Page Type:</span>
          <span class="detail-value">${pageType}</span>
        </div>
        ${view ? `
        <div class="detail-item">
          <span class="detail-label">View:</span>
          <span class="detail-value">${view}</span>
        </div>
        ` : ''}
      `;
      
      this.showToast('Conversion successful!', 'success');
    } else {
      this.singleResult.classList.add('active', 'error');
      this.singleResult.classList.remove('success');
      
      this.storefrontUrlOutput.value = '';
      this.conversionDetails.innerHTML = `
        <div class="error-message">
          <strong>Error:</strong> ${result.error}
        </div>
      `;
      
      this.showToast(result.error, 'error');
    }
  }

  /**
   * Clear single result
   */
  clearSingleResult() {
    this.singleResult.classList.remove('active');
  }

  /**
   * Copy single result to clipboard
   */
  copySingleResult() {
    const url = this.storefrontUrlOutput.value;
    if (url) {
      this.copyToClipboard(url);
      this.showToast('Copied to clipboard!', 'success');
    }
  }

  /**
   * Open single result in new tab
   */
  openSingleResult() {
    const url = this.storefrontUrlOutput.value;
    if (url) {
      window.open(url, '_blank');
      this.showToast('Opening preview...', 'info');
    }
  }

  /**
   * Copy text to clipboard
   */
  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after delay
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showToast(message, 'error');
  }
}

// Initialize UI when DOM is ready
let ui;
document.addEventListener('DOMContentLoaded', () => {
  ui = new ConverterUI();
});
