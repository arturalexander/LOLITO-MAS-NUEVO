import React, { useState, useEffect } from 'react';
import { Spinner } from './Spinner';
import * as instagramService from '../services/instagramService';

interface InstagramPublisherProps {
  socialPost: string | null;
  socialImageUrl: string | null;
  imageUrls: string[];
}

interface IgAccount {
  id: string;
  name: string;
  username: string;
}

const ErrorGuide: React.FC<{ error: string | null; onDismiss: () => void }> = ({ error, onDismiss }) => {
    if (!error) return null;

    let title = 'Ha Ocurrido un Error';
    let content: React.ReactNode = null;
    const errorMessage = error.split(':').slice(2).join(':').trim();

    if (error.includes('INST_ERR:APP_ID_MISSING')) {
        title = 'Configuración Requerida';
        content = (
            <>
                <p className="mb-2">El ID de tu aplicación de Facebook no se ha configurado correctamente en el código.</p>
                <ol className="list-decimal list-inside text-left text-sm space-y-1">
                    <li>Abre el archivo <code>services/instagramService.ts</code> en el editor de código.</li>
                    <li>Busca la línea que dice <code>const FACEBOOK_APP_ID = ...</code></li>
                    <li>Reemplaza el valor de marcador de posición con el ID real de tu aplicación de Meta for Developers.</li>
                </ol>
            </>
        );
    } else if (error.includes('INST_ERR:SDK_LOAD_FAIL')) {
        title = 'Fallo al Cargar el SDK de Facebook';
        content = (
             <>
                <p className="mb-2">No se pudo cargar el script necesario de Facebook. Esto puede deberse a varias razones:</p>
                <ul className="list-disc list-inside text-left text-sm space-y-1">
                    <li>Un <strong>bloqueador de anuncios</strong> (AdBlocker) está activo en tu navegador.</li>
                    <li>Problemas de conexión a internet.</li>
                    <li>La configuración de tu App en el panel de Meta Developers no tiene el dominio de esta web en la <strong>lista de dominios permitidos</strong>.</li>
                </ul>
             </>
        );
    } else if (error.includes('INST_ERR:LOGIN_CANCELLED')) {
        title = 'Inicio de Sesión Fallido';
        content = <p>{errorMessage}</p>;
    } else if (error.includes('INST_ERR:NO_ACCOUNTS')) {
        title = 'No se Encontraron Cuentas';
        content = (
            <>
                 <p className="mb-2 font-semibold">No encontramos ninguna cuenta de Instagram Business conectada.</p>
                 <p className="mb-2">Por favor, revisa los siguientes puntos en tu configuración de Facebook e Instagram:</p>
                 <ol className="list-decimal list-inside text-left text-sm space-y-1">
                    <li>Tu cuenta de Instagram debe ser de tipo <strong>"Profesional"</strong> (ya sea "Empresa" o "Creador"). Puedes cambiar esto en la configuración de Instagram.</li>
                    <li>Tu cuenta de Instagram Profesional debe estar <strong>vinculada a una Página de Facebook</strong> que administres.</li>
                    <li>Al hacer clic en "Conectar", debes <strong>aceptar todos los permisos</strong> que solicita la ventana de Facebook.</li>
                 </ol>
            </>
        );
    } else {
        title = 'Error de la API';
        content = <p>{errorMessage || 'Ha ocurrido un error inesperado. Revisa la consola del navegador para más detalles.'}</p>;
    }

    return (
        <div className="mt-4 text-center text-red-800 bg-red-100 p-4 rounded-lg text-sm border border-red-200">
            <h4 className="font-bold mb-2">{title}</h4>
            <div className="text-slate-700">{content}</div>
             <button onClick={onDismiss} className="mt-3 text-xs font-semibold text-red-700 hover:underline">
                Entendido
            </button>
        </div>
    );
};


export const InstagramPublisher: React.FC<InstagramPublisherProps> = ({ socialPost, socialImageUrl, imageUrls }) => {
  const [sdkStatus, setSdkStatus] = useState<string>('Cargando SDK de Facebook...');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [igAccounts, setIgAccounts] = useState<IgAccount[]>([]);
  const [selectedIgAccount, setSelectedIgAccount] = useState<string | null>(null);
  const [connectedUsername, setConnectedUsername] = useState<string | null>(null);
  
  useEffect(() => {
    instagramService.initFacebookSdk().then(() => {
        setSdkStatus('SDK de Facebook listo.');
    }).catch(err => {
        console.error("Error al inicializar el SDK de Facebook:", err);
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar SDK.';
        
        if (errorMessage.includes('INST_ERR:APP_ID_MISSING')) {
             setError(errorMessage);
        } else {
             setError(`INST_ERR:SDK_LOAD_FAIL:${errorMessage}`);
        }
        setSdkStatus('Error al cargar SDK.');
    });
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const authResponse = await instagramService.loginToFacebook();
      setAccessToken(authResponse.accessToken);
      const accounts = await instagramService.getInstagramAccounts(authResponse.accessToken);
      setIgAccounts(accounts);
      if (accounts.length === 1) {
        setSelectedIgAccount(accounts[0].id);
        setConnectedUsername(accounts[0].username);
      }
    } catch (err) {
      console.error("Error durante el proceso de conexión:", err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePost = async () => {
    if (!accessToken || !selectedIgAccount || !socialPost || !socialImageUrl) {
      setError('Faltan datos para poder publicar. Asegúrate de estar conectado y de haber generado la imagen de marketing.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    // Instagram Carousel allows 2 to 10 items.
    // We'll use the generated image + up to 4 original images.
    const imagesToPost = [
      socialImageUrl,
      ...imageUrls.slice(0, 4) 
    ];

    try {
      const postId = await instagramService.postCarouselToInstagram(accessToken, selectedIgAccount, imagesToPost, socialPost);
      setSuccess(`¡Publicado con éxito! ID de la publicación: ${postId}`);
    } catch (err) {
      console.error("Error al publicar en Instagram:", err);
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido al publicar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const accountId = e.target.value;
      setSelectedIgAccount(accountId);
      const account = igAccounts.find(acc => acc.id === accountId);
      setConnectedUsername(account ? account.username : null);
  };
  
  const handleDisconnect = () => {
      setAccessToken(null);
      setIgAccounts([]);
      setSelectedIgAccount(null);
      setConnectedUsername(null);
      setError(null);
      setSuccess(null);
  }
  
  const handleClearError = () => setError(null);

  const renderContent = () => {
    if (sdkStatus.startsWith('Error')) return null;

    if (!selectedIgAccount) {
      return (
        <>
            <button
              onClick={handleConnect}
              disabled={isLoading || !sdkStatus.includes('listo')}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 disabled:bg-slate-400 disabled:opacity-50"
            >
              {isLoading ? <><Spinner /><span className="ml-2">Conectando...</span></> : 'Conectar con Instagram'}
            </button>
            {igAccounts.length > 1 && !selectedIgAccount && (
                 <div className="mt-4">
                    <label htmlFor="ig-account-selector" className="block text-sm font-medium text-slate-700 mb-1">
                        Selecciona una cuenta para continuar
                    </label>
                    <select
                        id="ig-account-selector"
                        onChange={handleAccountSelect}
                        defaultValue=""
                        className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                        <option value="" disabled>Elige una cuenta de Instagram...</option>
                        {igAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.username} ({acc.name})</option>
                        ))}
                    </select>
                </div>
            )}
        </>
      );
    }
    
    return (
        <div className="space-y-4">
            <div className="text-center bg-green-100 text-green-800 p-3 rounded-lg">
                <p>Conectado como <strong className="font-semibold">{connectedUsername}</strong></p>
            </div>
            <button
              onClick={handlePost}
              disabled={isLoading || !socialPost || !socialImageUrl}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-brand-blue hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isLoading ? <><Spinner /><span className="ml-2">Publicando...</span></> : 'Publicar en Instagram'}
            </button>
            <button
                onClick={handleDisconnect}
                className="w-full text-sm text-slate-600 hover:text-brand-dark"
            >
                Desconectar
            </button>
        </div>
    );

  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
      <h3 className="text-xl font-bold text-brand-dark mb-4 text-center">Publicar en Instagram</h3>
       <p className="text-center text-xs text-slate-500 mb-4">{sdkStatus}</p>
      <div className="mt-4">
        {renderContent()}
      </div>
      <ErrorGuide error={error} onDismiss={handleClearError} />
      {success && !error && <p className="mt-4 text-center text-green-600 bg-green-100 p-3 rounded-lg text-sm">{success}</p>}
    </div>
  );
};
