/**
 * 🔐 Cliente para Google Sheets API v4 (REST)
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface SheetsConfig {
    spreadsheetId: string;
    accessToken: string;
}

/**
 * 📥 Lee el contenido de una celda específica
 */
export async function readCell(
    config: SheetsConfig,
    range: string
): Promise<string | null> {
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${config.accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.values && data.values[0] && data.values[0][0]) {
            return data.values[0][0];
        }

        return null;
    } catch (error) {
        console.error('❌ Error al leer de Sheets:', error);
        throw error;
    }
}

/**
 * 📤 Escribe contenido en una celda específica
 */
export async function writeCell(
    config: SheetsConfig,
    range: string,
    value: string
): Promise<void> {
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?valueInputOption=RAW`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                range,
                majorDimension: 'ROWS',
                values: [[value]],
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('✅ Datos escritos en Sheets');
    } catch (error) {
        console.error('❌ Error al escribir en Sheets:', error);
        throw error;
    }
}

/**
 * 📋 Verifica si la hoja existe
 */
export async function sheetExists(
    config: SheetsConfig,
    sheetName: string
): Promise<boolean> {
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${config.accessToken}`,
            },
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        const sheets = data.sheets || [];

        return sheets.some(
            (sheet: any) => sheet.properties?.title === sheetName
        );
    } catch {
        return false;
    }
}

/**
 * ➕ Crea una nueva hoja
 */
export async function createSheet(
    config: SheetsConfig,
    sheetName: string,
    hidden = true
): Promise<void> {
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}:batchUpdate`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: sheetName,
                                hidden,
                            },
                        },
                    },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log(`✅ Hoja "${sheetName}" creada`);
    } catch (error) {
        console.error('❌ Error al crear hoja:', error);
        throw error;
    }
}
