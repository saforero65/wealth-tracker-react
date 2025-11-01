/**
 * 🔄 Auto-sincronización con Google Sheets
 * Guarda automáticamente cada cambio en Sheets cuando está habilitado
 */

import { saveToSheetsTabular } from '../adapters/sheets-tabular';
import { Persistencia } from '../types/persistencia';

// Estado global de auto-sync
let autoSyncEnabled = false;
let isSyncing = false;
let syncQueue: (() => Promise<void>)[] = [];
let debounceTimer: number | null = null;
let lastSyncTime = 0;

/**
 * 🔧 Habilita o deshabilita la sincronización automática
 */
export function setAutoSyncEnabled(enabled: boolean) {
    autoSyncEnabled = enabled;
    console.log(`🔄 Auto-sync ${enabled ? 'habilitado' : 'deshabilitado'}`);
}

/**
 * 🔧 Verifica si el auto-sync está habilitado
 */
export function isAutoSyncEnabled(): boolean {
    return autoSyncEnabled;
}

/**
 * 🔧 Verifica si actualmente está sincronizando
 */
export function isSyncingNow(): boolean {
    return isSyncing;
}

/**
 * 🔄 Sincroniza datos automáticamente en segundo plano
 */
export async function autoSync(
    data: Persistencia,
    config: { spreadsheetId: string; accessToken: string }
): Promise<void> {
    if (!autoSyncEnabled) {
        console.log('🔄 Auto-sync deshabilitado, saltando sincronización');
        return;
    }

    if (!config.spreadsheetId || !config.accessToken) {
        console.warn('⚠️ Auto-sync: No hay spreadsheet o token configurado');
        console.warn(`  - spreadsheetId: ${config.spreadsheetId ? 'OK' : 'FALTA'}`);
        console.warn(`  - accessToken: ${config.accessToken ? 'OK' : 'FALTA'}`);
        return;
    }

    // Validar que el spreadsheetId tenga formato correcto
    if (config.spreadsheetId.length < 10) {
        console.warn('⚠️ Auto-sync: spreadsheetId parece inválido (muy corto)');
        return;
    }

    // Rate limiting: no sincronizar más de una vez cada 2 minutos
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTime;
    const minSyncInterval = 2 * 60 * 1000; // 2 minutos

    if (timeSinceLastSync < minSyncInterval) {
        console.log('🚦 Auto-sync: Rate limiting activo, esperando...');
        return;
    }

    // Debounce: cancelar timer anterior y crear uno nuevo
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
        // Agregar a la cola
        syncQueue.push(async () => {
            try {
                lastSyncTime = Date.now();
                console.log('🔄 Auto-sync: Guardando cambios en Sheets...');
                console.log(`  📊 ${data.transacciones.length} transacciones`);
                console.log(`  💰 ${data.cuentas.length} cuentas`);
                console.log(`  📈 ${data.activos.length} activos`);

                await saveToSheetsTabular(config, data);
                console.log('✅ Auto-sync: Cambios guardados exitosamente');
            } catch (error) {
                console.error('❌ Auto-sync: Error al guardar:', error);

                // Si el error es de autenticación, deshabilitar auto-sync
                if (error instanceof Error &&
                    (error.message.includes('401') ||
                        error.message.includes('403') ||
                        error.message.includes('Unauthorized'))) {
                    console.warn('🔐 Auto-sync: Error de autenticación, deshabilitando auto-sync');
                    setAutoSyncEnabled(false);
                    saveAutoSyncConfig(false);
                }
            }
        });

        // Procesar cola si no está sincronizando
        if (!isSyncing) {
            processSyncQueue();
        }
    }, 3000); // Debounce de 3 segundos
}

/**
 * 🔄 Procesa la cola de sincronización
 */
async function processSyncQueue() {
    if (isSyncing || syncQueue.length === 0) {
        return;
    }

    isSyncing = true;

    while (syncQueue.length > 0) {
        // Tomar solo el último de la cola (ignorar cambios intermedios)
        const syncFn = syncQueue[syncQueue.length - 1];
        syncQueue = [];

        try {
            await syncFn();
        } catch (error) {
            console.error('Error en procesamiento de cola:', error);
        }

        // Esperar un poco antes del siguiente sync para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    isSyncing = false;
}

/**
 * 🔄 Obtiene la configuración de auto-sync desde localStorage
 */
export function loadAutoSyncConfig(): {
    enabled: boolean;
    spreadsheetId: string | null;
} {
    const enabled = localStorage.getItem('auto_sync_enabled') === 'true';
    const spreadsheetId = localStorage.getItem('spreadsheet_id');

    return { enabled, spreadsheetId };
}

/**
 * 🔄 Guarda la configuración de auto-sync en localStorage
 */
export function saveAutoSyncConfig(enabled: boolean) {
    localStorage.setItem('auto_sync_enabled', enabled.toString());
    setAutoSyncEnabled(enabled);
}
