import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// 🟢 MAPEO DE IDIOMAS
const LANGUAGE_NAMES: Record<string, string> = {
  'es': 'Spanish (Spain)',
  'en': 'English (UK)',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  'pl': 'Polish',
  'ru': 'Russian'
};

// 🟢 FUNCIÓN PARA OBTENER SYSTEM INSTRUCTION
function getSystemInstruction(language: string = 'en'): string {
  const languageName = LANGUAGE_NAMES[language] || 'English (UK)';
  
  return `Act as an expert Community Manager for real-estate Facebook Pages. Create a viral-style post that drives engagement (likes, comments, shares).
Write the post in ${languageName}. Use plain text with line breaks (no markdown). Do not include these instructions in the output.

Structure & rules (emojis ONLY in the three basic lines below):

Headline (1 line):
🏡 {Property type} – 📍 {Location}

Capitalize the first word.

If a part is missing, omit it (no placeholders).

Key facts (1 line, concise):
💶 {Price} | 📐 {Size} | 🛏 {Beds} | 🛁 {Baths}

Include only available items; remove empty ones.

Price: keep input format if present; otherwise use € with thousands separators (e.g., €299,000).

If price is absent: Price on request.

Use m² or sq ft exactly as in the input (no conversion).

Perks (1 line, concise):
🌿 Garden/Terrace · 🏊 Pool (say Heated if input says so) · 🧭 Orientation · 🌅 Views · 🌊 Distance to beach · 🛗 Lift · 🚗 Parking/Garage · 🏷️ Tourist license

List only what exists in the input.

Use "·" as separator; max 6 items (keep the most important).

Engagement (1 line, no emojis):
One direct question to spark comments in ${languageName}.

CTA (1 line, no emojis):
Invite to request info / book a viewing in ${languageName}.

Link (mandatory, its own line):
"Here you can find more information:" (translate to ${languageName}):
{The original URL of the page that will be provided in the prompt}

Phone (mandatory, final line):
+34 697897156

Hashtags:
Only if none exist in the input; add 3–5 strong, Facebook-optimized real-estate hashtags (brand/location/property type). Use CamelCase, no accents, no spaces.

General style:
Friendly, dynamic tone; short, easy-to-scan lines.
Don't repeat benefits/emojis/CTAs already present in the input.
No extra emojis beyond the three basic lines above.
No markdown. No extra blank lines.
Everything must be in ${languageName}.`;
}

function getSummaryInstruction(language: string = 'en'): string {
  const languageName = LANGUAGE_NAMES[language] || 'English (UK)';
  
  return `Based on the provided real estate post, return EXACTLY 4 lines in ${languageName}, separated only by <br>.

Rules:
- Each line must start with one of these emojis in this specific order: 1) 🏠 property type, 2) 📍 location, 3) 💶 price (in numbers), 4) ✨ feature (m², pool, garden, terrace, views, etc.).
- Capitalize the first word of each line.
- Use very short phrases: a maximum of 4 words per line (the emoji does not count).
- Price format: Use a European thousands separator (dot) with the euro symbol at the end (e.g., 299.000 €). If there is no price, omit the entire price line.
- Do not include quotes, extra text, HTML, or Markdown. Return ONLY the content with the <br> separators.
- Everything must be in ${languageName}.`;
}

export const generatePost = async (htmlContent: string, url: string, language: string = 'en'): Promise<string> => {
  try {
    const prompt = `The original URL for this content is: ${url}. Please generate the social media post based on the following HTML content. Ignore any additional content on the page and focus only on the first property listed.\n\nHTML CONTENT:\n${htmlContent}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(language) // 🟢 USAR IDIOMA
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error generating social media post:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate social post: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the social post.");
  }
};

export const generateShortSummary = async (postContent: string, language: string = 'en'): Promise<string> => {
  if (!postContent) {
    throw new Error("El contenido de la publicación no puede estar vacío.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Here is the post to summarize:\n\n${postContent}`,
      config: {
        systemInstruction: getSummaryInstruction(language) // 🟢 USAR IDIOMA
      }
    });
    
    return response.text.trim();

  } catch (error) {
    console.error("Error al generar el resumen corto:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate short summary: ${error.message}`);
    }
    throw new Error("Ocurrió un error desconocido al generar el resumen corto.");
  }
};