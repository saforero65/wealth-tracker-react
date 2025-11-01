import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { autoSync } from '../lib/auto-sync';
import { convertCurrency, convertCurrencySimple, fetchExchangeRates } from '../lib/currency';
import { getTodayISO } from '../lib/date';
import { loadFromLocal, saveToLocal } from '../lib/storage';
import {
    Activo,
    Cuenta,
    FxRate,
    GoogleAuthState,
    Institucion,
    Persistencia,
    Preferencias,
    Transaccion,
} from '../types/persistencia';

// 🏗️ Estado de la aplicación
interface AppState extends Persistencia {
    // 🔐 Autenticación Google
    googleAuth: GoogleAuthState;
    setGoogleAuth: (auth: GoogleAuthState) => void;

    // 💱 Caché de tasas de cambio
    exchangeRatesCache: Record<string, number>;
    exchangeRatesCacheExpiry: number | null;
    isLoadingExchangeRates: boolean;
    updateExchangeRatesCache: () => Promise<void>;
    getExchangeRate: (from: string, to: string) => Promise<number>;

    // 🏦 Instituciones
    addInstitucion: (institucion: Omit<Institucion, 'id'>) => void;
    updateInstitucion: (id: string, updates: Partial<Institucion>) => void;
    deleteInstitucion: (id: string) => void;

    // 💳 Cuentas
    addCuenta: (cuenta: Omit<Cuenta, 'id'>) => void;
    updateCuenta: (id: string, updates: Partial<Cuenta>) => void;
    deleteCuenta: (id: string) => void;
    getCuentaSaldo: (cuentaId: string) => number;

    // 📈 Activos
    addActivo: (activo: Omit<Activo, 'id'>) => void;
    updateActivo: (id: string, updates: Partial<Activo>) => void;
    deleteActivo: (id: string) => void;

    // 💸 Transacciones
    addTransaccion: (transaccion: Omit<Transaccion, 'id'>) => void;
    updateTransaccion: (id: string, updates: Partial<Transaccion>) => void;
    deleteTransaccion: (id: string) => void;

    // 💱 FX
    addFxRate: (fxRate: Omit<FxRate, 'id'>) => void;
    updateFxRate: (id: string, updates: Partial<FxRate>) => void;
    deleteFxRate: (id: string) => void;

    // ⚙️ Preferencias
    updatePreferencias: (updates: Partial<Preferencias>) => void;

    // 💾 Persistencia
    loadData: (data: Persistencia) => void;
    exportData: () => Persistencia;
    saveToLocalStorage: () => Promise<void>;
    loadFromLocalStorage: () => Promise<void>;
    resetData: () => void;

    // 📊 Cálculos (ahora asíncronos para tasas reales)
    getTotalPatrimonio: () => Promise<number>;
    getTotalPorClase: () => Promise<Record<string, number>>;
    getTopCuentas: (limit: number) => Promise<Array<{ cuenta: Cuenta; saldo: number }>>;
    getRecentTransacciones: (limit: number) => Transaccion[];

    // 🔄 Sync y gestión de datos
    importData: (jsonData: string) => void;
    clearAllData: () => void;
    syncToSheets: () => Promise<void>;
    syncFromSheets: () => Promise<void>;
}

// 🌱 Estado inicial
const initialState: Persistencia = {
    version: 1,
    instituciones: [],
    cuentas: [],
    activos: [],
    transacciones: [],
    fx: [],
    prefs: {
        monedaBase: 'COP',
        timezone: 'America/Bogota',
    },
    lastUpdated: getTodayISO(),
};

const initialGoogleAuth: GoogleAuthState = {
    isAuthenticated: false,
    accessToken: null,
    expiresAt: null,
    user: null,
};

// 💱 Estado inicial del caché de tasas
const initialExchangeRatesState = {
    exchangeRatesCache: {},
    exchangeRatesCacheExpiry: null,
    isLoadingExchangeRates: false,
};

// 🔄 Helper para ejecutar auto-sync después de cambios
const triggerAutoSync = (get: () => AppState) => {
    const state = get();
    const spreadsheetId = localStorage.getItem('spreadsheet_id');

    console.log('🔄 Trigger auto-sync:', {
        authenticated: state.googleAuth.isAuthenticated,
        hasToken: !!state.googleAuth.accessToken,
        hasSpreadsheetId: !!spreadsheetId,
        spreadsheetId: spreadsheetId ? `${spreadsheetId.substring(0, 10)}...` : 'null'
    });

    if (state.googleAuth.isAuthenticated && state.googleAuth.accessToken && spreadsheetId) {
        const data = state.exportData();
        autoSync(data, {
            spreadsheetId,
            accessToken: state.googleAuth.accessToken,
        }).catch(error => {
            console.error('❌ Error en auto-sync:', error);
        });
    } else {
        console.log('⏭️ Auto-sync saltado - faltan prerrequisitos');
    }
};

// 🏪 Store principal
export const useStore = create<AppState>((set, get) => ({
    // Estado inicial
    ...initialState,
    googleAuth: initialGoogleAuth,
    ...initialExchangeRatesState,

    // 🔐 Autenticación
    setGoogleAuth: (auth) => set({ googleAuth: auth }),

    // 💱 Gestión de tasas de cambio con rate limiting mejorado
    updateExchangeRatesCache: async () => {
        const state = get();

        // Evitar múltiples requests simultáneos
        if (state.isLoadingExchangeRates) {
            console.log('⏳ Ya hay una actualización de tasas en progreso...');
            return;
        }

        // Rate limiting: no actualizar más de una vez cada 5 minutos
        const lastUpdate = state.exchangeRatesCacheExpiry ?
            (state.exchangeRatesCacheExpiry - 30 * 60 * 1000) : 0;
        const timeSinceLastUpdate = Date.now() - lastUpdate;
        const minInterval = 5 * 60 * 1000; // 5 minutos

        if (timeSinceLastUpdate < minInterval && Object.keys(state.exchangeRatesCache).length > 0) {
            console.log('🚦 Rate limiting activo - usando caché existente');
            return;
        }

        set({ isLoadingExchangeRates: true });
        try {
            const rates = await fetchExchangeRates();
            set({
                exchangeRatesCache: rates,
                exchangeRatesCacheExpiry: Date.now() + (30 * 60 * 1000), // 30 minutos
                isLoadingExchangeRates: false,
            });
            console.log('✅ Caché de tasas actualizado:', rates);
        } catch (error) {
            console.error('❌ Error actualizando caché de tasas:', error);

            // Si hay un error pero tenemos caché previo, mantenerlo
            if (Object.keys(state.exchangeRatesCache).length > 0) {
                console.log('🔄 Manteniendo caché previo debido al error');
                set({
                    exchangeRatesCacheExpiry: Date.now() + (10 * 60 * 1000), // Extender por 10 min más
                    isLoadingExchangeRates: false,
                });
            } else {
                set({ isLoadingExchangeRates: false });
            }
        }
    },

    getExchangeRate: async (from: string, to: string): Promise<number> => {
        const state = get();

        // Verificar si el caché está vigente
        const cacheExpired = !state.exchangeRatesCacheExpiry ||
            Date.now() > state.exchangeRatesCacheExpiry;

        // Solo actualizar si realmente es necesario y no estamos ya actualizando
        if (cacheExpired && Object.keys(state.exchangeRatesCache).length === 0 && !state.isLoadingExchangeRates) {
            await state.updateExchangeRatesCache();
        }

        // Intentar obtener tasa desde caché
        const directKey = `${from}_${to}`;
        const inverseKey = `${to}_${from}`;

        const updatedState = get();
        if (updatedState.exchangeRatesCache[directKey]) {
            return updatedState.exchangeRatesCache[directKey];
        }

        if (updatedState.exchangeRatesCache[inverseKey]) {
            return 1 / updatedState.exchangeRatesCache[inverseKey];
        }

        // Fallback a conversión simple
        console.warn(`⚠️ Tasa ${from}_${to} no encontrada en caché, usando fallback`);
        return convertCurrencySimple(1, from as any, to as any);
    },

    // 🏦 Instituciones
    addInstitucion: (institucion) => {
        set((state) => ({
            instituciones: [...state.instituciones, { ...institucion, id: nanoid() }],
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    updateInstitucion: (id, updates) => {
        set((state) => ({
            instituciones: state.instituciones.map((inst) =>
                inst.id === id ? { ...inst, ...updates } : inst
            ),
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    deleteInstitucion: (id) => {
        set((state) => ({
            instituciones: state.instituciones.filter((inst) => inst.id !== id),
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    // 💳 Cuentas
    addCuenta: (cuenta) => {
        set((state) => ({
            cuentas: [...state.cuentas, { ...cuenta, id: nanoid() }],
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    updateCuenta: (id, updates) => {
        set((state) => ({
            cuentas: state.cuentas.map((cuenta) =>
                cuenta.id === id ? { ...cuenta, ...updates } : cuenta
            ),
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    deleteCuenta: (id) => {
        set((state) => ({
            cuentas: state.cuentas.filter((cuenta) => cuenta.id !== id),
            // También eliminar activos asociados
            activos: state.activos.filter((activo) => activo.cuentaId !== id),
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    getCuentaSaldo: (cuentaId) => {
        const state = get();
        const cuenta = state.cuentas.find((c) => c.id === cuentaId);
        if (!cuenta) return 0;

        let saldo = cuenta.saldoInicial;

        // Sumar/restar transacciones
        state.transacciones.forEach((tx) => {
            if (tx.cuentaDestinoId === cuentaId && tx.monto) {
                saldo += tx.monto;
            }
            if (tx.cuentaOrigenId === cuentaId && tx.monto) {
                saldo -= tx.monto;
            }
            if (tx.cuentaOrigenId === cuentaId && tx.comision) {
                saldo -= tx.comision;
            }
        });

        return saldo;
    },

    // 📈 Activos
    addActivo: (activo) => {
        set((state) => ({
            activos: [...state.activos, { ...activo, id: nanoid() }],
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    updateActivo: (id, updates) => {
        set((state) => ({
            activos: state.activos.map((activo) =>
                activo.id === id ? { ...activo, ...updates } : activo
            ),
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    deleteActivo: (id) => {
        set((state) => ({
            activos: state.activos.filter((activo) => activo.id !== id),
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    // 💸 Transacciones
    addTransaccion: (transaccion) => {
        set((state) => ({
            transacciones: [...state.transacciones, { ...transaccion, id: nanoid() }],
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    updateTransaccion: (id, updates) => {
        set((state) => ({
            transacciones: state.transacciones.map((tx) =>
                tx.id === id ? { ...tx, ...updates } : tx
            ),
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    deleteTransaccion: (id) => {
        set((state) => ({
            transacciones: state.transacciones.filter((tx) => tx.id !== id),
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    // 💱 FX
    addFxRate: (fxRate) => {
        set((state) => ({
            fx: [...state.fx, { ...fxRate, id: nanoid() }],
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    updateFxRate: (id, updates) => {
        set((state) => ({
            fx: state.fx.map((rate) => (rate.id === id ? { ...rate, ...updates } : rate)),
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    deleteFxRate: (id) => {
        set((state) => ({
            fx: state.fx.filter((rate) => rate.id !== id),
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    // ⚙️ Preferencias
    updatePreferencias: (updates) => {
        set((state) => ({
            prefs: { ...state.prefs, ...updates },
            lastUpdated: getTodayISO(),
        }));
        get().saveToLocalStorage();
        triggerAutoSync(get);
    },

    // 💾 Persistencia
    loadData: (data) =>
        set({
            ...data,
            lastUpdated: getTodayISO(),
        }),

    exportData: () => {
        const state = get();
        return {
            version: state.version,
            instituciones: state.instituciones,
            cuentas: state.cuentas,
            activos: state.activos,
            transacciones: state.transacciones,
            fx: state.fx,
            prefs: state.prefs,
            lastUpdated: state.lastUpdated,
        };
    },

    saveToLocalStorage: async () => {
        const data = get().exportData();
        await saveToLocal(data);
    },

    loadFromLocalStorage: async () => {
        const data = await loadFromLocal();
        if (data) {
            get().loadData(data);
        }
    },

    resetData: () =>
        set({
            ...initialState,
            lastUpdated: getTodayISO(),
        }),

    // 📊 Cálculos
    getTotalPatrimonio: async () => {
        const state = get();
        const { prefs } = state;
        let total = 0;

        // Sumar saldos de cuentas
        for (const cuenta of state.cuentas) {
            const saldo = state.getCuentaSaldo(cuenta.id);
            const saldoBase = await convertCurrency(saldo, cuenta.moneda, prefs.monedaBase, state.exchangeRatesCache);
            total += saldoBase;
        }

        // Sumar valor de activos
        for (const activo of state.activos) {
            const valorActivo = activo.cantidad * (activo.costoPromedio || 0);
            const valorBase = await convertCurrency(valorActivo, activo.moneda, prefs.monedaBase, state.exchangeRatesCache);
            total += valorBase;
        }

        return total;
    },

    getTotalPorClase: async () => {
        const state = get();
        const { prefs } = state;
        const totales: Record<string, number> = {};

        // Agrupar activos por clase
        for (const activo of state.activos) {
            const valorActivo = activo.cantidad * (activo.costoPromedio || 0);
            const valorBase = await convertCurrency(valorActivo, activo.moneda, prefs.monedaBase, state.exchangeRatesCache);

            if (!totales[activo.clase]) {
                totales[activo.clase] = 0;
            }
            totales[activo.clase] += valorBase;
        }

        // Sumar efectivo (cuentas)
        let efectivoTotal = 0;
        for (const cuenta of state.cuentas) {
            const saldo = state.getCuentaSaldo(cuenta.id);
            const saldoBase = await convertCurrency(saldo, cuenta.moneda, prefs.monedaBase, state.exchangeRatesCache);
            efectivoTotal += saldoBase;
        }

        if (efectivoTotal > 0) {
            totales['efectivo'] = efectivoTotal;
        }

        return totales;
    },

    getTopCuentas: async (limit) => {
        const state = get();
        const cuentasConSaldo = await Promise.all(
            state.cuentas.map(async (cuenta) => {
                const saldo = state.getCuentaSaldo(cuenta.id);
                const saldoBase = await convertCurrency(saldo, cuenta.moneda, state.prefs.monedaBase, state.exchangeRatesCache);
                return {
                    cuenta,
                    saldo,
                    saldoBase, // Añadimos saldo convertido para ordenamiento
                };
            })
        );

        return cuentasConSaldo
            .sort((a, b) => b.saldoBase - a.saldoBase)
            .slice(0, limit)
            .map(({ cuenta, saldo }) => ({ cuenta, saldo })); // Removemos saldoBase del resultado final
    },

    getRecentTransacciones: (limit) => {
        const state = get();
        return [...state.transacciones]
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .slice(0, limit);
    },

    // Funciones de importación y limpieza de datos
    importData: (jsonData: string) => {
        try {
            const data = JSON.parse(jsonData);
            set((state) => ({
                ...state,
                instituciones: data.instituciones || [],
                cuentas: data.cuentas || [],
                activos: data.activos || [],
                transacciones: data.transacciones || [],
                fx: data.fx || [],
                prefs: data.prefs || state.prefs,
                lastUpdated: new Date().toISOString(),
            }));
            get().saveToLocalStorage();
        } catch (error) {
            console.error('Error importing data:', error);
            throw new Error('Invalid JSON data');
        }
    },

    clearAllData: () => {
        set(() => ({
            instituciones: [],
            cuentas: [],
            activos: [],
            transacciones: [],
            fx: [],
            prefs: {
                monedaBase: 'COP' as const,
                timezone: 'America/Bogota',
            },
            googleAuth: {
                isAuthenticated: false,
                accessToken: null,
                expiresAt: null,
                user: null,
            },
            lastUpdated: new Date().toISOString(),
        }));
        get().saveToLocalStorage();
    },

    // Funciones de sincronización con Google Sheets
    syncToSheets: async () => {
        const { saveToSheets } = await import('../adapters/sheets');
        const state = get();

        // Obtener configuración de Google Sheets
        const spreadsheetId = import.meta.env.VITE_SHEETS_SPREADSHEET_ID;
        const accessToken = state.googleAuth.accessToken;

        if (!accessToken) {
            throw new Error('No hay token de acceso. Inicia sesión primero.');
        }

        if (!spreadsheetId) {
            throw new Error('ID de spreadsheet no configurado en .env');
        }

        const config = { spreadsheetId, accessToken };
        const data = state.exportData();

        await saveToSheets(config, data);
    },

    syncFromSheets: async () => {
        const { loadFromSheets } = await import('../adapters/sheets');
        const state = get();

        // Obtener configuración de Google Sheets
        const spreadsheetId = import.meta.env.VITE_SHEETS_SPREADSHEET_ID;
        const accessToken = state.googleAuth.accessToken;

        if (!accessToken) {
            throw new Error('No hay token de acceso. Inicia sesión primero.');
        }

        if (!spreadsheetId) {
            throw new Error('ID de spreadsheet no configurado en .env');
        }

        const config = { spreadsheetId, accessToken };
        const remoteData = await loadFromSheets(config);

        if (remoteData) {
            get().importData(JSON.stringify(remoteData));
        } else {
            throw new Error('No se encontraron datos en Google Sheets');
        }
    },
}));
