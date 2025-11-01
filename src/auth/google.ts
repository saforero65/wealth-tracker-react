/**
 * 🔐 Módulo de autenticación con Google Identity Services (GIS)
 */

import { useEffect, useState } from 'react';
import { GoogleAuthState } from '../types/persistencia';

// Tipos para Google Identity Services (GIS)
declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: TokenClientConfig) => TokenClient;
                };
            };
        };
    }
}

interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: any) => void;
}

interface TokenClient {
    requestAccessToken: () => void;
}

interface TokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
}

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

let tokenClient: TokenClient | null = null;

/**
 * 🚀 Inicializa el cliente de Google Identity Services
 */
export function initGoogleAuth(
    clientId: string,
    onSuccess: (auth: GoogleAuthState) => void,
    onError?: (error: any) => void
): void {
    if (!clientId || clientId.trim() === '') {
        console.error('❌ Client ID no proporcionado');
        onError?.({ error: 'Client ID vacío o no configurado' });
        return;
    }

    if (!window.google?.accounts?.oauth2) {
        console.error('❌ Google Identity Services no está cargado');
        console.info('💡 Verifica que el script esté incluido en index.html');
        onError?.({ error: 'GIS no disponible' });
        return;
    }

    try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (response: TokenResponse) => {
                console.log('✅ Token recibido exitosamente');

                const expiresAt = Date.now() + response.expires_in * 1000;

                const authState: GoogleAuthState = {
                    isAuthenticated: true,
                    accessToken: response.access_token,
                    expiresAt,
                    user: null, // GIS no proporciona info de usuario directamente
                };

                onSuccess(authState);
            },
            error_callback: (error) => {
                console.error('❌ Error de OAuth:', error);
                onError?.(error);
            },
        });

        console.log('✅ Google Auth inicializado correctamente');

        // IMPORTANTE: Llamar onSuccess inmediatamente para indicar que la inicialización está completa
        // Esto NO significa que el usuario esté autenticado, solo que el sistema está listo
    } catch (error) {
        console.error('❌ Error al inicializar Google Auth:', error);
        onError?.(error);
    }
}

/**
 * 🔓 Inicia el flujo de autenticación
 */
export function signIn(): void {
    if (!tokenClient) {
        console.error('❌ Token client no inicializado. Llama a initGoogleAuth primero.');
        alert('Error: Cliente de autenticación no inicializado. Verifica la configuración en .env');
        return;
    }

    try {
        console.log('🔓 Iniciando flujo de autenticación...');
        tokenClient.requestAccessToken();
    } catch (error) {
        console.error('❌ Error al solicitar acceso:', error);
        alert('Error al iniciar sesión. Verifica la consola para más detalles.');
    }
}

/**
 * 🔒 Cierra la sesión (limpia el estado local)
 */
export function signOut(onSignOut: () => void): void {
    // GIS no tiene un método de revocación directo desde el cliente
    // Simplemente limpiamos el estado local
    console.log('🔒 Cerrando sesión...');
    onSignOut();
}

/**
 * ✅ Verifica si el token aún es válido
 */
export function isTokenValid(expiresAt: number | null): boolean {
    if (!expiresAt) return false;
    return Date.now() < expiresAt;
}

/**
 * 💾 Guarda la sesión en localStorage
 */
export function saveAuthState(authState: GoogleAuthState): void {
    try {
        localStorage.setItem('google_auth', JSON.stringify(authState));
        console.log('💾 Sesión Google guardada en localStorage');
    } catch (error) {
        console.error('❌ Error al guardar sesión:', error);
    }
}

/**
 * 📥 Carga la sesión desde localStorage
 */
export function loadAuthState(): GoogleAuthState | null {
    try {
        const saved = localStorage.getItem('google_auth');
        if (!saved) return null;

        const authState: GoogleAuthState = JSON.parse(saved);

        // Verificar si el token aún es válido
        if (!isTokenValid(authState.expiresAt)) {
            console.log('⏰ Token expirado, limpiando sesión guardada');
            clearAuthState();
            return null;
        }

        console.log('📥 Sesión Google restaurada desde localStorage');
        return authState;
    } catch (error) {
        console.error('❌ Error al cargar sesión:', error);
        return null;
    }
}

/**
 * 🗑️ Limpia la sesión de localStorage
 */
export function clearAuthState(): void {
    try {
        localStorage.removeItem('google_auth');
        console.log('🗑️ Sesión Google eliminada de localStorage');
    } catch (error) {
        console.error('❌ Error al limpiar sesión:', error);
    }
}

/**
 * 🔄 Obtiene información del usuario usando el access token
 * (Requiere un endpoint adicional de Google)
 */
export async function getUserInfo(accessToken: string): Promise<any> {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            // Si no tenemos permisos, devolvemos un usuario genérico
            console.warn('⚠️ No se pudo obtener información del usuario. Posible falta de permisos.');
            return {
                name: 'Usuario Google',
                email: 'usuario@google.com',
                picture: null
            };
        }

        return await response.json();
    } catch (error) {
        console.error('❌ Error al obtener info de usuario:', error);
        // Devolver usuario genérico en caso de error
        return {
            name: 'Usuario Google',
            email: 'usuario@google.com',
            picture: null
        };
    }
}

/**
 * 🪝 Hook de React para gestionar la autenticación de Google
 */
export const useGoogleAuth = () => {
    const [auth, setAuth] = useState<GoogleAuthState>({
        isAuthenticated: false,
        accessToken: null,
        expiresAt: null,
        user: null,
    });

    const [isLoading, setIsLoading] = useState(true); // Iniciar con loading=true

    useEffect(() => {
        const initAuth = async () => {
            console.log('🚀 Iniciando autenticación...');

            // 1. Intentar cargar sesión guardada
            const savedAuth = loadAuthState();
            if (savedAuth) {
                console.log('🔄 Restaurando sesión guardada...');
                setAuth(savedAuth);
                setIsLoading(false);
                return;
            }

            // 2. Verificar si Google Identity Services está disponible
            const clientId = import.meta.env.VITE_GIS_CLIENT_ID;

            if (!clientId) {
                console.warn('⚠️ VITE_GIS_CLIENT_ID no configurado');
                setIsLoading(false);
                return;
            }

            console.log('🔑 Client ID encontrado:', clientId.substring(0, 20) + '...');
            console.log('🌐 window.google disponible:', !!window.google);
            console.log('🔐 window.google.accounts disponible:', !!window.google?.accounts);
            console.log('🎯 window.google.accounts.oauth2 disponible:', !!window.google?.accounts?.oauth2);

            // 3. Verificar si Google Identity Services ya está disponible
            if (window.google?.accounts?.oauth2) {
                console.log('✅ Google Identity Services ya disponible');

                try {
                    initGoogleAuth(
                        clientId,
                        async (authState) => {
                            console.log('🎉 Usuario autenticado via callback');
                            // Este callback solo se ejecuta cuando el usuario hace login
                            // Obtener información del usuario
                            let userInfo = null;
                            try {
                                userInfo = await getUserInfo(authState.accessToken!);
                            } catch (error) {
                                console.warn('⚠️ No se pudo obtener info del usuario, continuando sin ella:', error);
                            }

                            const completeAuthState = {
                                ...authState,
                                user: userInfo
                            };

                            setAuth(completeAuthState);
                            // Guardar la sesión
                            saveAuthState(completeAuthState);
                        },
                        (error) => {
                            console.error('Error en Google Auth callback:', error);
                        }
                    );

                    // La inicialización está completa, incluso si el usuario no se ha autenticado
                    console.log('🔓 Sistema de autenticación listo');
                    setIsLoading(false);

                } catch (error) {
                    console.error('❌ Error al inicializar Google Auth:', error);
                    setIsLoading(false);
                }
            } else {
                // 4. Si no está disponible inmediatamente, esperar con timeout
                console.log('⏳ Esperando Google Identity Services...');

                let timeoutId: number;
                let checkInterval: number;
                let resolved = false;

                const cleanup = () => {
                    if (timeoutId) clearTimeout(timeoutId);
                    if (checkInterval) clearInterval(checkInterval);
                };

                // Timeout de 3 segundos
                timeoutId = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        cleanup();
                        console.warn('⚠️ Timeout: Google Identity Services no se cargó');
                        setIsLoading(false);
                    }
                }, 3000);

                // Verificar cada 200ms
                checkInterval = setInterval(() => {
                    if (window.google?.accounts?.oauth2) {
                        if (!resolved) {
                            resolved = true;
                            cleanup();
                            console.log('✅ Google Identity Services cargado');

                            try {
                                initGoogleAuth(
                                    clientId,
                                    async (authState) => {
                                        console.log('🎉 Usuario autenticado via callback (async)');
                                        let userInfo = null;
                                        try {
                                            userInfo = await getUserInfo(authState.accessToken!);
                                        } catch (error) {
                                            console.warn('⚠️ No se pudo obtener info del usuario:', error);
                                        }

                                        const completeAuthState = {
                                            ...authState,
                                            user: userInfo
                                        };

                                        setAuth(completeAuthState);
                                        saveAuthState(completeAuthState);
                                    },
                                    (error) => {
                                        console.error('Error en Google Auth callback:', error);
                                    }
                                );

                                // La inicialización está completa
                                console.log('🔓 Sistema de autenticación listo (async)');
                                setIsLoading(false);

                            } catch (error) {
                                console.error('❌ Error al inicializar Google Auth (async):', error);
                                setIsLoading(false);
                            }
                        }
                    }
                }, 200);
            }
        };

        initAuth();
    }, []);

    // Guardar automáticamente el estado cuando cambie (excepto en la carga inicial)
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }

        if (auth.isAuthenticated && auth.accessToken) {
            saveAuthState(auth);
        }
    }, [auth, isInitialLoad]);

    // Verificar periódicamente si el token sigue siendo válido
    useEffect(() => {
        if (!auth.isAuthenticated || !auth.expiresAt) return;

        const checkTokenValidity = () => {
            if (!isTokenValid(auth.expiresAt)) {
                console.log('⏰ Token expirado, cerrando sesión automáticamente');
                handleSignOut();
            }
        };

        // Verificar cada minuto
        const interval = setInterval(checkTokenValidity, 60000);

        return () => clearInterval(interval);
    }, [auth.isAuthenticated, auth.expiresAt]);

    const handleSignIn = () => {
        setIsLoading(true);
        signIn();
    };

    const handleSignOut = () => {
        signOut(() => {
            const emptyAuth = {
                isAuthenticated: false,
                accessToken: null,
                expiresAt: null,
                user: null,
            };
            setAuth(emptyAuth);
            // Limpiar la sesión guardada
            clearAuthState();
        });
    };

    return {
        user: auth.user,
        isAuthenticated: auth.isAuthenticated,
        accessToken: auth.accessToken,
        isLoading,
        signIn: handleSignIn,
        signOut: handleSignOut,
        expiresAt: auth.expiresAt, // Agregar esto para debugging
    };
}

/**
 * 🔍 Función de utilidad para debugging del estado de auth
 */
export function debugAuthState(): void {
    const saved = loadAuthState();
    console.log('🔍 Debug Auth State:', {
        hasSavedAuth: !!saved,
        isValid: saved ? isTokenValid(saved.expiresAt) : false,
        expiresAt: saved?.expiresAt ? new Date(saved.expiresAt).toLocaleString() : 'N/A',
        timeUntilExpiry: saved?.expiresAt ? Math.round((saved.expiresAt - Date.now()) / 60000) + ' minutos' : 'N/A'
    });
}