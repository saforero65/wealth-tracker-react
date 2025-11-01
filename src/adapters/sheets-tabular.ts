/**
 * 🔄 Adapter de sincronización con Google Sheets en formato TABULAR
 * Crea hojas separadas por entidad con formato de tabla legible
 */

import { Persistencia, Institucion, Cuenta, Activo, Transaccion, FxRate } from '../types/persistencia';
import { SheetsConfig } from './sheets.client';

// Nombres de las hojas
const SHEETS = {
    INSTITUCIONES: 'Instituciones',
    CUENTAS: 'Cuentas',
    ACTIVOS: 'Activos',
    TRANSACCIONES: 'Transacciones',
    FX: 'FX',
    PREFS: 'Preferencias'
};

/**
 * 🔧 Convierte array de objetos a formato de rango 2D para Sheets
 */
function objectsToRange<T extends Record<string, any>>(
    objects: T[],
    headers: string[]
): any[][] {
    if (objects.length === 0) {
        return [headers];
    }

    const rows = objects.map(obj => 
        headers.map(header => {
            const value = obj[header];
            if (value === undefined || value === null) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return value;
        })
    );

    return [headers, ...rows];
}

/**
 * 🔧 Convierte rango 2D de Sheets a array de objetos
 */
function rangeToObjects<T>(range: any[][]): T[] {
    if (!range || range.length < 2) return [];

    const headers = range[0];
    const rows = range.slice(1);

    return rows
        .filter(row => row.some(cell => cell !== ''))
        .map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
                const value = row[index];
                if (value === '' || value === undefined) {
                    obj[header] = undefined;
                } else if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
                    try {
                        obj[header] = JSON.parse(value);
                    } catch {
                        obj[header] = value;
                    }
                } else {
                    obj[header] = value;
                }
            });
            return obj as T;
        });
}

/**
 * 📤 Guarda una hoja individual con datos tabulares
 */
async function saveSheetData(
    config: SheetsConfig,
    sheetName: string,
    data: any[][]
): Promise<void> {
    const spreadsheetId = config.spreadsheetId;
    const accessToken = config.accessToken;

    // 1. Verificar si la hoja existe
    const sheetsResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
        {
            headers: { Authorization: `Bearer ${accessToken}` }
        }
    );

    if (!sheetsResponse.ok) {
        throw new Error(`Error al obtener spreadsheet: ${sheetsResponse.statusText}`);
    }

    const spreadsheet = await sheetsResponse.json();
    const sheetExists = spreadsheet.sheets?.some(
        (s: any) => s.properties.title === sheetName
    );

    // 2. Crear hoja si no existe
    if (!sheetExists) {
        const createResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName,
                                gridProperties: {
                                    frozenRowCount: 1 // Congelar fila de encabezados
                                }
                            }
                        }
                    }]
                })
            }
        );

        if (!createResponse.ok) {
            throw new Error(`Error al crear hoja ${sheetName}`);
        }
    }

    // 3. Limpiar hoja
    await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z1000:clear`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        }
    );

    // 4. Escribir datos
    const writeResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1?valueInputOption=RAW`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                range: `${sheetName}!A1`,
                values: data
            })
        }
    );

    if (!writeResponse.ok) {
        throw new Error(`Error al escribir en hoja ${sheetName}`);
    }

    // 5. Formatear encabezados (negrita, fondo)
    const sheetId = spreadsheet.sheets?.find(
        (s: any) => s.properties.title === sheetName
    )?.properties.sheetId;

    if (sheetId !== undefined) {
        await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requests: [
                        {
                            repeatCell: {
                                range: {
                                    sheetId: sheetId,
                                    startRowIndex: 0,
                                    endRowIndex: 1
                                },
                                cell: {
                                    userEnteredFormat: {
                                        backgroundColor: { red: 0.2, green: 0.3, blue: 0.4 },
                                        textFormat: {
                                            bold: true,
                                            foregroundColor: { red: 1, green: 1, blue: 1 }
                                        }
                                    }
                                },
                                fields: 'userEnteredFormat(backgroundColor,textFormat)'
                            }
                        }
                    ]
                })
            }
        );
    }
}

/**
 * 📥 Lee una hoja individual con datos tabulares
 */
async function loadSheetData(
    config: SheetsConfig,
    sheetName: string
): Promise<any[][] | null> {
    const spreadsheetId = config.spreadsheetId;
    const accessToken = config.accessToken;

    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z1000`,
        {
            headers: { Authorization: `Bearer ${accessToken}` }
        }
    );

    if (!response.ok) {
        if (response.status === 400) {
            // La hoja no existe
            return null;
        }
        throw new Error(`Error al leer hoja ${sheetName}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.values || null;
}

/**
 * 📤 Guarda todos los datos en formato tabular
 */
export async function saveToSheetsTabular(
    config: SheetsConfig,
    data: Persistencia
): Promise<void> {
    try {
        console.log('📤 Guardando datos en formato tabular...');

        // Instituciones
        const institucionesHeaders = ['id', 'nombre', 'tipo'];
        const institucionesData = objectsToRange(data.instituciones, institucionesHeaders);
        await saveSheetData(config, SHEETS.INSTITUCIONES, institucionesData);

        // Cuentas
        const cuentasHeaders = ['id', 'nombre', 'institucionId', 'tipo', 'moneda', 'saldoInicial', 'fechaApertura'];
        const cuentasData = objectsToRange(data.cuentas, cuentasHeaders);
        await saveSheetData(config, SHEETS.CUENTAS, cuentasData);

        // Activos
        const activosHeaders = ['id', 'clase', 'ticker', 'moneda', 'cantidad', 'costoPromedio', 'cuentaId'];
        const activosData = objectsToRange(data.activos, activosHeaders);
        await saveSheetData(config, SHEETS.ACTIVOS, activosData);

        // Transacciones
        const transaccionesHeaders = [
            'id', 'fecha', 'tipo', 'cuentaOrigenId', 'cuentaDestinoId', 
            'activoId', 'monto', 'cantidad', 'precio', 'comision', 'concepto'
        ];
        const transaccionesData = objectsToRange(data.transacciones, transaccionesHeaders);
        await saveSheetData(config, SHEETS.TRANSACCIONES, transaccionesData);

        // FX
        const fxHeaders = ['id', 'from', 'to', 'tasa', 'fecha'];
        const fxData = objectsToRange(data.fx, fxHeaders);
        await saveSheetData(config, SHEETS.FX, fxData);

        // Preferencias
        const prefsData = [
            ['Configuración', 'Valor'],
            ['monedaBase', data.prefs.monedaBase],
            ['timezone', data.prefs.timezone],
            ['lastUpdated', data.lastUpdated]
        ];
        await saveSheetData(config, SHEETS.PREFS, prefsData);

        console.log('✅ Datos guardados en formato tabular');
    } catch (error) {
        console.error('❌ Error al guardar en formato tabular:', error);
        throw error;
    }
}

/**
 * 📥 Carga todos los datos desde formato tabular
 */
export async function loadFromSheetsTabular(
    config: SheetsConfig
): Promise<Persistencia | null> {
    try {
        console.log('📥 Cargando datos desde formato tabular...');

        // Cargar cada hoja
        const institucionesRange = await loadSheetData(config, SHEETS.INSTITUCIONES);
        const cuentasRange = await loadSheetData(config, SHEETS.CUENTAS);
        const activosRange = await loadSheetData(config, SHEETS.ACTIVOS);
        const transaccionesRange = await loadSheetData(config, SHEETS.TRANSACCIONES);
        const fxRange = await loadSheetData(config, SHEETS.FX);
        const prefsRange = await loadSheetData(config, SHEETS.PREFS);

        // Si no existe ninguna hoja, retornar null
        if (!institucionesRange && !cuentasRange && !activosRange) {
            console.log('⚠️ No se encontraron hojas con datos');
            return null;
        }

        // Convertir rangos a objetos
        const instituciones = institucionesRange 
            ? rangeToObjects<Institucion>(institucionesRange) 
            : [];
        
        const cuentas = cuentasRange 
            ? rangeToObjects<Cuenta>(cuentasRange) 
            : [];
        
        const activos = activosRange 
            ? rangeToObjects<Activo>(activosRange).map(a => ({
                ...a,
                cantidad: Number(a.cantidad) || 0,
                costoPromedio: Number(a.costoPromedio) || 0
            }))
            : [];
        
        const transacciones = transaccionesRange 
            ? rangeToObjects<Transaccion>(transaccionesRange).map(t => ({
                ...t,
                monto: t.monto ? Number(t.monto) : undefined,
                cantidad: t.cantidad ? Number(t.cantidad) : undefined,
                precio: t.precio ? Number(t.precio) : undefined,
                comision: t.comision ? Number(t.comision) : undefined
            }))
            : [];
        
        const fx = fxRange 
            ? rangeToObjects<FxRate>(fxRange).map(f => ({
                ...f,
                tasa: Number(f.tasa) || 0
            }))
            : [];

        // Extraer preferencias
        let prefs = {
            monedaBase: 'COP' as const,
            timezone: 'America/Bogota'
        };

        if (prefsRange && prefsRange.length > 1) {
            const prefsObj = Object.fromEntries(
                prefsRange.slice(1).map(row => [row[0], row[1]])
            );
            prefs = {
                monedaBase: (prefsObj.monedaBase || 'COP') as any,
                timezone: prefsObj.timezone || 'America/Bogota'
            };
        }

        const result: Persistencia = {
            version: 1,
            instituciones,
            cuentas,
            activos,
            transacciones,
            fx,
            prefs,
            lastUpdated: new Date().toISOString()
        };

        console.log('✅ Datos cargados desde formato tabular');
        console.log(`  📊 ${instituciones.length} instituciones`);
        console.log(`  📊 ${cuentas.length} cuentas`);
        console.log(`  📊 ${activos.length} activos`);
        console.log(`  📊 ${transacciones.length} transacciones`);
        console.log(`  📊 ${fx.length} tasas FX`);

        return result;
    } catch (error) {
        console.error('❌ Error al cargar desde formato tabular:', error);
        throw error;
    }
}

/**
 * 🔄 Detecta el formato actual en Sheets (JSON vs Tabular)
 */
export async function detectSheetsFormat(config: SheetsConfig): Promise<'json' | 'tabular' | 'empty'> {
    try {
        // Intentar cargar la hoja __data (formato JSON)
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}`,
            {
                headers: { Authorization: `Bearer ${config.accessToken}` }
            }
        );

        if (!response.ok) return 'empty';

        const spreadsheet = await response.json();
        const sheets = spreadsheet.sheets || [];
        const sheetNames = sheets.map((s: any) => s.properties.title);

        // Si existe __data, es formato JSON
        if (sheetNames.includes('__data')) {
            return 'json';
        }

        // Si existen las hojas tabulares, es formato tabular
        if (sheetNames.includes(SHEETS.INSTITUCIONES) || 
            sheetNames.includes(SHEETS.CUENTAS)) {
            return 'tabular';
        }

        return 'empty';
    } catch (error) {
        console.error('Error al detectar formato:', error);
        return 'empty';
    }
}

/**
 * 🗑️ Elimina la hoja __data (formato JSON antiguo)
 */
export async function deleteJsonSheet(config: SheetsConfig): Promise<boolean> {
    try {
        const spreadsheetId = config.spreadsheetId;
        const accessToken = config.accessToken;

        // Obtener información del spreadsheet
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        if (!response.ok) return false;

        const spreadsheet = await response.json();
        const sheet = spreadsheet.sheets?.find(
            (s: any) => s.properties.title === '__data'
        );

        if (!sheet) {
            console.log('⚠️ La hoja __data no existe');
            return false;
        }

        const sheetId = sheet.properties.sheetId;

        // Eliminar la hoja
        const deleteResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requests: [{
                        deleteSheet: {
                            sheetId: sheetId
                        }
                    }]
                })
            }
        );

        if (!deleteResponse.ok) {
            console.error('❌ Error al eliminar hoja __data');
            return false;
        }

        console.log('✅ Hoja __data eliminada correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al eliminar hoja __data:', error);
        return false;
    }
}

/**
 * 🔄 Migra datos del formato JSON al formato tabular
 */
export async function migrateToTabular(config: SheetsConfig): Promise<boolean> {
    try {
        console.log('🔄 Iniciando migración de JSON a Tabular...');

        // 1. Cargar datos del formato JSON
        const { loadFromSheets } = await import('./sheets');
        const jsonData = await loadFromSheets(config);

        if (!jsonData) {
            console.warn('⚠️ No hay datos JSON para migrar');
            return false;
        }

        console.log('📥 Datos JSON cargados');

        // 2. Guardar en formato tabular
        await saveToSheetsTabular(config, jsonData);
        console.log('📤 Datos guardados en formato tabular');

        // 3. Eliminar la hoja __data
        await deleteJsonSheet(config);
        console.log('🗑️ Hoja __data eliminada');

        console.log('✅ Migración completada exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error en migración:', error);
        return false;
    }
}
