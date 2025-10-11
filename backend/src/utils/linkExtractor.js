/**
 * Extrae todos los links de propiedades de una página principal
 */
function extractPropertyLinks(html, baseUrl, patterns = null) {
  const links = new Set();

  // Patrones por defecto
  const defaultPatterns = [
    /href="([^"]*(?:property|propiedad|inmueble|listing|venta|alquiler|apartamento|villa|casa|piso|for-sale)[^"]*)"/gi,
    /href="([^"]*\/\d+[^"]*)"/gi,
    /href="([^"]*detail[^"]*)"/gi,
    /href="([^"]*ref=[^"]*)"/gi,
  ];

  const patternsToUse = patterns || defaultPatterns;

  for (const pattern of patternsToUse) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        try {
          const absoluteUrl = new URL(match[1], baseUrl).href;
          if (!shouldSkipUrl(absoluteUrl)) {
            links.add(absoluteUrl);
          }
        } catch (e) {
          // Ignorar URLs inválidas
        }
      }
    }
  }

  return Array.from(links);
}

/**
 * Decide si una URL debe ser ignorada
 */
function shouldSkipUrl(url) {
  const skipPatterns = [
    /\.(jpg|jpeg|png|gif|svg|css|js|pdf|zip)$/i,
    /#/,
    /mailto:/i,
    /tel:/i,
    /javascript:/i,
    /contacto|contact|login|registro|register|cart|carrito|search|buscar|about|nosotros/i,
  ];

  return skipPatterns.some(pattern => pattern.test(url));
}

/**
 * Extrae links de propiedades de manera inteligente
 */
function smartExtractPropertyLinks(html, baseUrl) {
  console.log('[EXTRACTOR] Starting smart extraction...');
  const links = new Set();

  // 1. Buscar en elementos comunes de listados
  const listingPatterns = [
    /<a[^>]*class="[^"]*(?:property|listing|card|item)[^"]*"[^>]*href="([^"]*)"/gi,
    /<div[^>]*class="[^"]*(?:property|listing)[^"]*"[^>]*>[\s\S]*?<a[^>]*href="([^"]*)"/gi,
  ];

  for (const pattern of listingPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        try {
          const absoluteUrl = new URL(match[1], baseUrl).href;
          if (!shouldSkipUrl(absoluteUrl)) {
            links.add(absoluteUrl);
          }
        } catch (e) {
          // Ignorar
        }
      }
    }
  }

  console.log(`[EXTRACTOR] Found ${links.size} links with smart patterns`);

  // 2. Si no encuentra nada, usar método por defecto
  if (links.size === 0) {
    console.log('[EXTRACTOR] Falling back to default patterns...');
    return extractPropertyLinks(html, baseUrl);
  }

  return Array.from(links);
}

module.exports = { 
  extractPropertyLinks, 
  smartExtractPropertyLinks 
};