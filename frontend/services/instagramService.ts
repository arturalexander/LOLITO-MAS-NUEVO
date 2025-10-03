// --- ¡IMPORTANTE! ---
// Reemplaza el valor de abajo con el ID de tu Aplicación de Facebook real.
// Debes crear una App en el panel de Meta for Developers para obtener este ID.
// FIX: Explicitly type FACEBOOK_APP_ID as a string. This prevents TypeScript from inferring a literal type,
// which causes a comparison error when checking for a placeholder value.
const FACEBOOK_APP_ID: string = '1835653367021356'; // Ejemplo: '123456789012345'


// Define los tipos del SDK de Facebook que usaremos desde el objeto window
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface IgAccount {
  id: string;
  name: string;
  username: string;
}

// Inicializa el SDK de Facebook
export const initFacebookSdk = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!FACEBOOK_APP_ID || FACEBOOK_APP_ID === 'REEMPLAZA_CON_TU_APP_ID_DE_FACEBOOK') {
      return reject(new Error('INST_ERR:APP_ID_MISSING:El ID de la App de Facebook no está configurado. Por favor, edita el archivo `services/instagramService.ts`.'));
    }
    
    console.log("Iniciando SDK de Facebook...");
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v19.0',
      });
      console.log("SDK de Facebook inicializado correctamente.");
      resolve();
    };
  });
};

// Activa el flujo de inicio de sesión de Facebook
export const loginToFacebook = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      return reject(new Error('INST_ERR:SDK_LOAD_FAIL:El SDK de Facebook no se ha cargado. Revisa tu conexión, posibles bloqueadores de anuncios o la consola del navegador para más detalles.'));
    }
    
    console.log("Mostrando diálogo de inicio de sesión de Facebook...");
    window.FB.login(
      (response: any) => {
        console.log("Respuesta del diálogo de inicio de sesión:", response);
        if (response.authResponse) {
          console.log("Inicio de sesión exitoso.");
          resolve(response.authResponse);
        } else {
           console.error("El usuario canceló el inicio de sesión o no lo autorizó completamente.");
          reject(new Error('INST_ERR:LOGIN_CANCELLED:Inicio de sesión cancelado o fallido. Asegúrate de aceptar todos los permisos solicitados.'));
        }
      },
      { scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement' }
    );
  });
};

// Obtiene las cuentas de Instagram Business conectadas a las páginas de Facebook del usuario
export const getInstagramAccounts = async (accessToken: string): Promise<IgAccount[]> => {
  console.log("Obteniendo Páginas de Facebook y cuentas de Instagram conectadas...");
  const pagesResponse = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account{id,name,username}&access_token=${accessToken}`);
  const pagesData = await pagesResponse.json();
  console.log("Respuesta de la API de Cuentas:", pagesData);

  if (!pagesResponse.ok) {
    const error = pagesData.error;
    console.error("Error al obtener las páginas de Facebook:", error);
    throw new Error(`INST_ERR:API_ERROR:${error.message || 'No se pudieron obtener las páginas de Facebook.'}`);
  }
  
  const igAccounts: IgAccount[] = pagesData.data
    .filter((page: any) => page.instagram_business_account)
    .map((page: any) => page.instagram_business_account);
    
  if (igAccounts.length === 0) {
    console.warn("No se encontraron cuentas de Instagram Business.");
    throw new Error('INST_ERR:NO_ACCOUNTS:No se encontraron cuentas de Instagram Business.');
  }
  
  console.log("Cuentas de Instagram encontradas:", igAccounts);
  return igAccounts;
};

// Publica un carrusel en Instagram
export const postCarouselToInstagram = async (
  accessToken: string,
  igUserId: string,
  imageUrls: string[],
  caption: string
): Promise<string> => {
  if (imageUrls.length < 1) {
    throw new Error('INST_ERR:API_ERROR:Se necesita al menos una imagen para publicar.');
  }

  console.log("Paso 1: Creando contenedores de medios para el carrusel...");
  const uploadPromises = imageUrls.map(url =>
    fetch(`https://graph.facebook.com/v19.0/${igUserId}/media?image_url=${encodeURIComponent(url)}&is_carousel_item=true&access_token=${accessToken}`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error.message);
        console.log(`Contenedor de imagen creado: ${data.id}`);
        return data.id;
      })
      .catch(err => {
          throw new Error(`INST_ERR:UPLOAD_ERROR:Fallo al subir una de las imágenes: ${err.message}`);
      })
  );
  const containerIds = await Promise.all(uploadPromises);

  console.log("Paso 2: Creando el contenedor principal del carrusel...");
  const children = containerIds.join(',');
  const carouselResponse = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media?media_type=CAROUSEL&children=${children}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`, { method: 'POST' });
  
  const carouselData = await carouselResponse.json();
  if (carouselData.error) {
    console.error("Error al crear el contenedor del carrusel:", carouselData.error);
    throw new Error(`INST_ERR:API_ERROR:Error al crear el carrusel: ${carouselData.error.message}`);
  }
  const carouselContainerId = carouselData.id;
  console.log(`Contenedor de carrusel creado: ${carouselContainerId}`);

  console.log("Paso 3: Publicando el carrusel (puede tardar unos segundos)...");
  let attempts = 0;
  const maxAttempts = 10;
  while(attempts < maxAttempts) {
    const publishResponse = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish?creation_id=${carouselContainerId}&access_token=${accessToken}`, { method: 'POST' });
    const publishData = await publishResponse.json();
    
    if (publishResponse.ok) {
        console.log("¡Carrusel publicado con éxito!", publishData);
        return publishData.id;
    }
    
    // Código de error específico para cuando el contenido está siendo procesado
    if (publishData.error && publishData.error.code === 9007) {
        attempts++;
        console.warn(`El contenido aún se está procesando. Reintentando en 5 segundos... (Intento ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
        console.error("Error final al publicar el carrusel:", publishData.error);
        throw new Error(`INST_ERR:PUBLISH_ERROR:Error al publicar: ${publishData.error.message}`);
    }
  }

  throw new Error('INST_ERR:TIMEOUT_ERROR:La publicación del carrusel agotó el tiempo de espera. El servidor de Instagram tardó demasiado en procesar las imágenes. Inténtalo de nuevo más tarde.');
};
