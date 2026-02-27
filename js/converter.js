/**
 * Shopify Link Converter
 * Converts Shopify admin theme editor URLs to storefront preview URLs
 */

class ShopifyLinkConverter {
  constructor() {
    this.urlPattern = /\/store\/([^/]+)\/themes\/(\d+)/;
  }

  /**
   * Convert a single admin URL to storefront URL
   * @param {string} adminUrl - The Shopify admin URL
   * @returns {Object} Result object with success status and details
   */
  convert(adminUrl) {
    try {
      // Trim whitespace
      adminUrl = adminUrl.trim();
      
      if (!adminUrl) {
        throw new Error('URL cannot be empty');
      }

      // Parse the URL
      let url;
      try {
        url = new URL(adminUrl);
      } catch (e) {
        throw new Error('Invalid URL format');
      }

      // Validate it's a Shopify admin URL
      if (!url.hostname.includes('admin.shopify.com')) {
        throw new Error('Not a Shopify admin URL');
      }

      // Extract store name and theme ID from path
      const match = url.pathname.match(this.urlPattern);
      if (!match) {
        throw new Error('Invalid Shopify admin URL format. Expected: admin.shopify.com/store/{store}/themes/{theme_id}/...');
      }

      const [, store, themeId] = match;

      // Get and decode previewPath parameter
      const previewPath = url.searchParams.get('previewPath') || '/';
      const decodedPath = decodeURIComponent(previewPath);

      // Extract view parameter from the decoded previewPath if it contains query params
      let path = decodedPath;
      let view = null;

      if (decodedPath.includes('?')) {
        const [pathPart, queryPart] = decodedPath.split('?');
        path = pathPart;
        
        // Parse query parameters from the preview path
        const previewParams = new URLSearchParams(queryPart);
        view = previewParams.get('view');
      }

      // Build storefront URL
      let storefrontUrl = `https://${store}.myshopify.com${path}?preview_theme_id=${themeId}`;
      if (view) {
        storefrontUrl += `&view=${view}`;
      }

      // Detect page type
      const pageType = this.detectPageType(path);

      return {
        success: true,
        storefrontUrl,
        details: {
          store,
          themeId,
          path,
          view,
          pageType
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Detect the type of page from the path
   * @param {string} path - The page path
   * @returns {string} The page type
   */
  detectPageType(path) {
    if (path === '/') return 'Homepage';
    if (path.startsWith('/products/')) return 'Product';
    if (path.startsWith('/collections/')) return 'Collection';
    if (path.startsWith('/pages/')) return 'Page';
    return 'Other';
  }

  /**
   * Convert multiple admin URLs to storefront URLs
   * @param {string[]} adminUrls - Array of Shopify admin URLs
   * @returns {Array} Array of result objects
   */
  batchConvert(adminUrls) {
    return adminUrls
      .filter(url => url.trim()) // Remove empty lines
      .map(url => ({
        input: url,
        result: this.convert(url)
      }));
  }

  /**
   * Export batch conversion results to CSV format
   * @param {Array} results - Array of conversion results
   * @returns {string} CSV formatted string
   */
  exportToCSV(results) {
    const headers = ['Admin URL', 'Storefront URL', 'Status', 'Store', 'Theme ID', 'Page Type', 'Error'];
    const rows = results.map(item => {
      if (item.result.success) {
        return [
          item.input,
          item.result.storefrontUrl,
          'Success',
          item.result.details.store,
          item.result.details.themeId,
          item.result.details.pageType,
          ''
        ];
      } else {
        return [
          item.input,
          '',
          'Failed',
          '',
          '',
          '',
          item.result.error
        ];
      }
    });

    // Escape CSV fields
    const escapeCsvField = (field) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const csvContent = [
      headers.map(escapeCsvField).join(','),
      ...rows.map(row => row.map(escapeCsvField).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download CSV file
   * @param {string} csvContent - CSV content
   * @param {string} filename - Filename for download
   */
  downloadCSV(csvContent, filename = 'shopify-links.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Make it available globally
window.ShopifyLinkConverter = ShopifyLinkConverter;
