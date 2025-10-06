const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

const SYSTEM_INSTRUCTION = `Act as an expert Community Manager for real-estate Facebook Pages. Create a viral-style post that drives engagement (likes, comments, shares).
Write the post in English. Use plain text with line breaks (no markdown). Do not include these instructions in the output.

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
One direct question to spark comments.

CTA (1 line, no emojis):
Invite to request info / book a viewing.

Link (mandatory, its own line):
Here you can find more information:
{The original URL of the page that will be provided in the prompt}

Phone (mandatory, final line):
+34 697897156

Hashtags:
Only if none exist in the input; add 3–5 strong, Facebook-optimized real-estate hashtags (brand/location/property type). Use CamelCase, no accents, no spaces.

General style:
Friendly, dynamic tone; short, easy-to-scan lines.
Don't repeat benefits/emojis/CTAs already present in the input.
No extra emojis beyond the three basic lines above.
No markdown. No extra blank lines.`;

const SUMMARY_SYSTEM_INSTRUCTION = `Based on the provided real estate post, return EXACTLY 4 lines in UK English, separated only by <br>.

Rules:
- Each line must start with one of these emojis in this specific order: 1) 🏠 property type, 2) 📍 location, 3) 💶 price (in numbers), 4) ✨ feature (m², pool, garden, terrace, views, etc.).
- Capitalize the first word of each line.
- Use very short phrases: a maximum of 4 words per line (the emoji does not count).
- Price format: Use a European thousands separator (dot) with the euro symbol at the end (e.g., 299.000 €). If there is no price, omit the entire price line.
- Do not include quotes, extra text, HTML, or Markdown. Return ONLY the content with the <br> separators.`;

async function generatePost(htmlContent, url) {
  try {
    const prompt = `The original URL for this content is: ${url}. Please generate the social media post based on the following HTML content. Ignore any additional content on the page and focus only on the first property listed.\n\nHTML CONTENT:\n${htmlContent}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating post:', error);
    throw new Error(`Failed to generate post: ${error.message}`);
  }
}

async function generateShortSummary(postContent) {
  if (!postContent) {
    throw new Error('Post content cannot be empty');
  }

  try {
    const prompt = `Here is the post to summarize:\n\n${postContent}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: SUMMARY_SYSTEM_INSTRUCTION }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}

module.exports = { generatePost, generateShortSummary };