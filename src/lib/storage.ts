import localforage from 'localforage';
import { Persistencia } from '../types/persistencia';

const STORAGE_KEY = 'finanzas_app_data';

// Configurar localforage
localforage.config({
    name: 'FinanzasApp',
    storeName: 'finanzas_data',
    description: 'Datos de la aplicación de finanzas personales',
});

/**
 * 💾 Guarda el estado completo en IndexedDB
 */
export async function saveToLocal(data: Persistencia): Promise<void> {
    try {
        await localforage.setItem(STORAGE_KEY, data);
        console.log('✅ Datos guardados en local');
    } catch (error) {
        console.error('❌ Error al guardar en local:', error);
        throw error;
    }
}

/**
 * 📥 Carga el estado desde IndexedDB
 */
export async function loadFromLocal(): Promise<Persistencia | null> {
    try {
        const data = await localforage.getItem<Persistencia>(STORAGE_KEY);
        if (data) {
            console.log('✅ Datos cargados desde local');
            return data;
        }
        return null;
    } catch (error) {
        console.error('❌ Error al cargar desde local:', error);
        return null;
    }
}

/**
 * 🗑️ Limpia todos los datos locales
 */
export async function clearLocal(): Promise<void> {
    try {
        await localforage.removeItem(STORAGE_KEY);
        console.log('✅ Datos locales eliminados');
    } catch (error) {
        console.error('❌ Error al limpiar local:', error);
        throw error;
    }
}

/**
 * 📊 Obtiene el tamaño aproximado de los datos almacenados
 */
export async function getStorageSize(): Promise<number> {
    try {
        const data = await localforage.getItem<Persistencia>(STORAGE_KEY);
        if (!data) return 0;
        return new Blob([JSON.stringify(data)]).size;
    } catch {
        return 0;
    }
}
