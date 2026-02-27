/**
 * UI Controller for Shopify Link Converter
 */

class ConverterUI {
  constructor() {
    this.converter = new ShopifyLinkConverter();
    this.currentMode = 'single'; // 'single' or 'batch'
    this.batchResults = [];
    
    this.initElements();
    this.initEventListeners();
    this.initExamples();
  }

  /**
   * Initialize DOM element references
   */
  initElements() {
    // Tab buttons
    this.singleTab = document.getElementById('singleTab');
    this.batchTab = document.getElementById('batchTab');
    
    // Mode containers
    this.singleMode = document.getElementById('singleMode');
    this.batchMode = document.getElementById('batchMode');
    
    // Single mode elements
    this.adminUrlInput = document.getElementById('adminUrl');
    this.convertBtn = document.getElementById('convertBtn');
    this.singleResult = document.getElementById('singleResult');
    this.storefrontUrlOutput = document.getElementById('storefrontUrl');
    this.conversionDetails = document.getElementById('conversionDetails');
    this.copyBtn = document.getElementById('copyBtn');
    this.openBtn = document.getElementById('openBtn');
    
    // Batch mode elements
    this.batchInput = document.getElementById('batchInput');
    this.batchConvertBtn = document.getElementById('batchConvertBtn');
    this.batchResult = document.getElementById('batchResult');
    this.batchResultList = document.getElementById('batchResultList');
    this.batchStats = document.getElementById('batchStats');
    this.copyAllBtn = document.getElementById('copyAllBtn');
    this.downloadCsvBtn = document.getElementById('downloadCsvBtn');
    
    // Examples
    this.exampleLinks = document.querySelectorAll('.example-link');
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Tab switching
    this.singleTab.addEventListener('click', () => this.switchMode('single'));
    this.batchTab.addEventListener('click', () => this.switchMode('batch'));
    
    // Single mode
    this.convertBtn.addEventListener('click', () => this.handleSingleConvert());
    this.adminUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSingleConvert();
    });
    this.adminUrlInput.addEventListener('input', () => this.clearSingleResult());
    this.copyBtn.addEventListener('click', () => this.copySingleResult());
    this.openBtn.addEventListener('click', () => this.openSingleResult());
    
    // Batch mode
    this.batchConvertBtn.addEventListener('click', () => this.handleBatchConvert());
    this.copyAllBtn.addEventListener('click', () => this.copyAllResults());
    this.downloadCsvBtn.addEventListener('click', () => this.downloadResults());
  }

  /**
   * Initialize example links
   */
  initExamples() {
    this.exampleLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const exampleUrl = link.dataset.url;
        this.adminUrlInput.value = exampleUrl;
        this.handleSingleConvert();
        this.adminUrlInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  /**
   * Switch between single and batch mode
   */
  switchMode(mode) {
    this.currentMode = mode;
    
    if (mode === 'single') {
      this.singleTab.classList.add('active');
      this.batchTab.classList.remove('active');
      this.singleMode.classList.add('active');
      this.batchMode.classList.remove('active');
    } else {
      this.batchTab.classList.add('active');
      this.singleTab.classList.remove('active');
      this.batchMode.classList.add('active');
      this.singleMode.classList.remove('active');
    }
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
   * Handle batch conversion
   */
  handleBatchConvert() {
    const inputText = this.batchInput.value.trim();
    
    if (!inputText) {
      this.showError('Please enter at least one URL');
      return;
    }
    
    const urls = inputText.split('\n').filter(line => line.trim());
    
    if (urls.length === 0) {
      this.showError('Please enter at least one URL');
      return;
    }
    
    // Show loading state
    this.batchConvertBtn.disabled = true;
    this.batchConvertBtn.textContent = 'Converting...';
    
    setTimeout(() => {
      this.batchResults = this.converter.batchConvert(urls);
      this.displayBatchResults();
      
      // Reset button
      this.batchConvertBtn.disabled = false;
      this.batchConvertBtn.textContent = 'Batch Convert';
      
      this.showToast(`Converted ${this.batchResults.length} URLs`, 'success');
    }, 300);
  }

  /**
   * Display batch conversion results
   */
  displayBatchResults() {
    this.batchResult.classList.add('active');
    
    const successCount = this.batchResults.filter(r => r.result.success).length;
    const failCount = this.batchResults.length - successCount;
    
    // Update stats
    this.batchStats.innerHTML = `
      Converted <strong>${successCount}</strong> of <strong>${this.batchResults.length}</strong> URLs
      ${failCount > 0 ? `(<span class="error-text">${failCount} failed</span>)` : ''}
    `;
    
    // Display results
    this.batchResultList.innerHTML = this.batchResults.map((item, index) => {
      if (item.result.success) {
        return `
          <div class="batch-result-item success">
            <div class="batch-result-header">
              <span class="batch-result-icon">✓</span>
              <span class="batch-result-type">${item.result.details.pageType}</span>
            </div>
            <div class="batch-result-url">
              <input type="text" readonly value="${item.result.storefrontUrl}" id="batch-url-${index}">
              <button class="btn-icon" onclick="ui.copyBatchResult(${index})" title="Copy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <button class="btn-icon" onclick="ui.openBatchResult(${index})" title="Open">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </button>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="batch-result-item error">
            <div class="batch-result-header">
              <span class="batch-result-icon">✗</span>
              <span class="batch-result-type">Error</span>
            </div>
            <div class="batch-result-error">
              <strong>Input:</strong> ${item.input}<br>
              <strong>Error:</strong> ${item.result.error}
            </div>
          </div>
        `;
      }
    }).join('');
  }

  /**
   * Copy a specific batch result
   */
  copyBatchResult(index) {
    const url = this.batchResults[index].result.storefrontUrl;
    this.copyToClipboard(url);
    this.showToast('Copied to clipboard!', 'success');
  }

  /**
   * Open a specific batch result
   */
  openBatchResult(index) {
    const url = this.batchResults[index].result.storefrontUrl;
    window.open(url, '_blank');
  }

  /**
   * Copy all successful results
   */
  copyAllResults() {
    const successUrls = this.batchResults
      .filter(r => r.result.success)
      .map(r => r.result.storefrontUrl)
      .join('\n');
    
    if (successUrls) {
      this.copyToClipboard(successUrls);
      this.showToast('All URLs copied to clipboard!', 'success');
    }
  }

  /**
   * Download results as CSV
   */
  downloadResults() {
    const csvContent = this.converter.exportToCSV(this.batchResults);
    const timestamp = new Date().toISOString().split('T')[0];
    this.converter.downloadCSV(csvContent, `shopify-links-${timestamp}.csv`);
    this.showToast('CSV file downloaded!', 'success');
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
