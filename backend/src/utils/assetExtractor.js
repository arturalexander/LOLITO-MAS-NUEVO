function extractImageUrls(html, baseUrl) {
  const imageUrls = new Set();
  const regex = /<img[^>]+src="([^"]+\.jpe?g)"/gi;
  const matches = html.matchAll(regex);

  for (const match of matches) {
    if (imageUrls.size >= 6) break;
    if (match[1]) {
      try {
        const absoluteUrl = new URL(match[1], baseUrl).href;
        imageUrls.add(absoluteUrl);
      } catch (e) {
        console.warn(`Invalid image URL: ${match[1]}`);
      }
    }
  }

  return Array.from(imageUrls);
}

module.exports = { extractImageUrls }; // 🔄 exporta como objeto
