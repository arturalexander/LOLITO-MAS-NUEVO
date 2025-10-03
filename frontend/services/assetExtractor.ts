/**
 * Extracts up to 6 image URLs (.jpg or .jpeg) from a given HTML string
 * and resolves them against a base URL.
 * @param html The HTML content as a string.
 * @param baseUrl The base URL to resolve relative image paths.
 * @returns An array of strings containing the absolute image URLs.
 */
export const extractImageUrls = (html: string, baseUrl: string): string[] => {
  const imageUrls: Set<string> = new Set(); // Use a Set to avoid duplicates
  // Regex to find img tags with src pointing to .jpg or .jpeg files
  const regex = /<img[^>]+src="([^"]+\.jpe?g)"/gi;
  
  // Use matchAll to get an iterator of all matches
  const matches = html.matchAll(regex);

  for (const match of matches) {
    // Stop after finding 6 images
    if (imageUrls.size >= 6) {
      break;
    }
    // The first capturing group (index 1) contains the URL
    if (match[1]) {
       try {
        // Create a full URL from a potentially relative path
        const absoluteUrl = new URL(match[1], baseUrl).href;
        imageUrls.add(absoluteUrl);
      } catch (e) {
        console.warn(`Skipping invalid image URL: ${match[1]}`, e);
      }
    }
  }

  return Array.from(imageUrls);
};
