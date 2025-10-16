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
  max-width: 250px; /* Increased max width for more flexibility */
  max-height: 80px; /* Added max height */
  width: auto;
  height: auto;
  margin: 0 auto 20px;
}
.message { font-size: 64px; line-height: 1.15; }`;

interface CustomizationOptions {
  colors: { color1: string, color2: string };
  font: string;
  logo: string | null; // Base64 encoded logo
}

/**
 * Creates a social media image using the HCTI API.
 * @param imageUrl The background image for the card.
 * @param summaryText The text to display on the card (should include <br> for line breaks).
 * @param options The customization options for the template.
 * @returns The URL of the generated image.
 */
export const createSocialImage = async (
  imageUrl: string, 
  summaryText: string, 
  options: CustomizationOptions
): Promise<string> => {
  // --- ¡IMPORTANTE! ---
  // Reemplaza los valores de abajo con tus credenciales reales de HCTI.
  // FIX: Explicitly type userId as a string. This prevents TypeScript from inferring a literal type,
  // which causes an error when comparing it to a different placeholder string.
  const userId: string = "a5ed4716-ffcf-4ac2-b2dd-e20540303ba3";
  // FIX: Explicitly type apiKey as a string for the same reason as userId.
  const apiKey: string = "1c51b53b-8a21-45fc-928b-16c282ae808b";
  // --- --- --- --- ---

  if (!userId || !apiKey || userId === "TU_USER_ID" || apiKey === "TU_API_KEY") {
    throw new Error("El User ID o la API Key de HCTI no están configurados. Edita el archivo `services/imageGeneratorService.ts`.");
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
        'Authorization': 'Basic ' + btoa(`${userId}:${apiKey}`)
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
      // Intenta obtener más detalles del error desde el cuerpo de la respuesta.
      const errorBody = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Error de la API HCTI: ${errorBody.error || errorBody.message}`);
    }

    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error("Error al crear la imagen social:", error);
    if (error instanceof Error) {
        throw new Error(`No se pudo crear la imagen social: ${error.message}`);
    }
    throw new Error("Ocurrió un error desconocido al crear la imagen social.");
  }
};