/**
 * 🔄 Adapter de sincronización con Google Sheets
 */

import { validatePersistencia } from '../lib/merge';
import { Persistencia } from '../types/persistencia';
import { createSheet, readCell, sheetExists, SheetsConfig, writeCell } from './sheets.client';

const DATA_SHEET = '__data';
const DATA_CELL = '__data!A1';

/**
 * 📥 Carga los datos desde Google Sheets
 */
export async function loadFromSheets(config: SheetsConfig): Promise<Persistencia | null> {
    try {
        console.log('📥 Cargando datos desde Google Sheets...');

        // Verificar si la hoja existe
        const exists = await sheetExists(config, DATA_SHEET);

        if (!exists) {
            console.log(`⚠️ La hoja "${DATA_SHEET}" no existe. Créala primero o usa saveToSheets.`);
            return null;
        }

        // Leer el contenido de la celda A1
        const content = await readCell(config, DATA_CELL);

        if (!content) {
            console.log('⚠️ No hay datos en la celda __data!A1');
            return null;
        }

        // Parsear el JSON
        const data = JSON.parse(content);

        // Validar estructura
        if (!validatePersistencia(data)) {
            throw new Error('Los datos cargados no tienen la estructura correcta');
        }

        console.log('✅ Datos cargados exitosamente desde Sheets');
        return data;
    } catch (error) {
        console.error('❌ Error al cargar desde Sheets:', error);
        throw error;
    }
}

/**
 * 📤 Guarda los datos en Google Sheets
 */
export async function saveToSheets(
    config: SheetsConfig,
    data: Persistencia
): Promise<void> {
    try {
        console.log('📤 Guardando datos en Google Sheets...');

        // Verificar si la hoja existe, si no, crearla
        const exists = await sheetExists(config, DATA_SHEET);

        if (!exists) {
            console.log(`➕ Creando hoja "${DATA_SHEET}"...`);
            await createSheet(config, DATA_SHEET, true);
        }

        // Convertir a JSON
        const jsonString = JSON.stringify(data);

        // Escribir en la celda A1
        await writeCell(config, DATA_CELL, jsonString);

        console.log('✅ Datos guardados exitosamente en Sheets');
    } catch (error) {
        console.error('❌ Error al guardar en Sheets:', error);
        throw error;
    }
}

/**
 * 🔄 Sincroniza datos bidireccional (load + merge + save)
 * Esta función debe ser llamada desde el componente con la lógica de merge
 */
export async function syncWithSheets(
    config: SheetsConfig,
    localData: Persistencia
): Promise<{ remote: Persistencia | null; synced: boolean }> {
    try {
        const remote = await loadFromSheets(config);

        if (!remote) {
            // No hay datos remotos, subir los locales
            await saveToSheets(config, localData);
            return { remote: null, synced: true };
        }

        return { remote, synced: false };
    } catch (error) {
        console.error('❌ Error en sincronización:', error);
        throw error;
    }
}
