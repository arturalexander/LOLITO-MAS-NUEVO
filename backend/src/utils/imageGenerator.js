const fetch = require('node-fetch');

const HCTI_USER_ID = process.env.HCTI_USER_ID || "5df328f2-b21a-466c-ad02-5ebab370627d";
const HCTI_API_KEY = process.env.HCTI_API_KEY || "b1640222-f0ee-4183-92c2-806a9e8037b2";
const HCTI_API_ENDPOINT = 'https://hcti.io/v1/image';

const HTML_TEMPLATE = `
<div class="card">
  <img src="{{imageUrl}}" class="bg" alt="Property Image">
  <div class="overlay"></div>
  <div class="text tweet-text">
    <img src="{{logoUrl}}" class="logo" alt="Agency Logo" />
    <div class="message">
      {{summaryText}}
    </div>
  </div>
</div>`;

const CSS_TEMPLATE = `
@import url('https://fonts.googleapis.com/css2?family={{fontFamily}}:wght@800;900&display=swap');

body { margin: 0; }
.card { position: relative; display: inline-block; width: 1080px; height: 1350px; overflow: hidden; }
.bg { display: block; width: 100%; height: 100%; object-fit: cover; }
.overlay { position: absolute; inset: 0; background: rgba(0,0,0,.25); }
.text {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 90%;
}
.tweet-text {
  background: linear-gradient(45deg, {{textColor1}}, {{textColor2}});
  color: #fff;
  font-family: '{{fontFamily}}', system-ui, Arial, sans-serif;
  font-weight: 900;
  line-height: 1.1;
  text-shadow: 0 2px 12px rgba(0,0,0,.6);
  padding: 24px 36px;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,.25);
}
.logo {
  display: block;
  max-width: 250px;
  max-height: 80px;
  width: auto;
  height: auto;
  margin: 0 auto 20px;
}
.message { font-size: 64px; line-height: 1.15; }`;

async function createSocialImage(imageUrl, summaryText, options) {
  if (!HCTI_USER_ID || !HCTI_API_KEY || HCTI_USER_ID === "TU_USER_ID") {
    throw new Error("HCTI credentials not configured");
  }

  const { colors, font, logo } = options;
  const defaultLogoUrl = 'https://www.azulvilla.pl/crm/pages/agencies/azulvilla/assets/logo.svg';

  const finalHtml = HTML_TEMPLATE
    .replace('{{imageUrl}}', imageUrl)
    .replace('{{summaryText}}', summaryText)
    .replace('{{logoUrl}}', logo || defaultLogoUrl);
    
  const finalCss = CSS_TEMPLATE
    .replace(/\{\{fontFamily\}\}/g, font)
    .replace('{{textColor1}}', colors.color1)
    .replace('{{textColor2}}', colors.color2);

  try {
    const response = await fetch(HCTI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${HCTI_USER_ID}:${HCTI_API_KEY}`).toString('base64')
      },
      body: JSON.stringify({
        html: finalHtml,
        css: finalCss,
        google_fonts: `${font.replace(' ', '+')}:wght@800;900`,
        viewport_width: 1080,
        viewport_height: 1350
      })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`HCTI API error: ${errorBody.error || errorBody.message}`);
    }

    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error('Error creating social image:', error);
    throw new Error(`Failed to create social image: ${error.message}`);
  }
}

module.exports = { createSocialImage }; // 🔄 exporta como objeto
