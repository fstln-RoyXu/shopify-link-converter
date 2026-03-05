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
}

// Make it available globally
window.ShopifyLinkConverter = ShopifyLinkConverter;
