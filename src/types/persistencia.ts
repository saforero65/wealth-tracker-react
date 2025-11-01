// 🔷 Tipos base
export type ID = string;

export type Moneda = 'COP' | 'USD' | 'EUR' | 'USDT' | 'BTC' | 'ETH';

// 🏦 Institución
export interface Institucion {
    id: ID;
    nombre: string;
    tipo?: 'banco' | 'broker' | 'exchange' | 'otro';
}

// 💳 Cuenta
export interface Cuenta {
    id: ID;
    nombre: string;
    institucionId?: ID;
    tipo: 'ahorros' | 'corriente' | 'cdt' | 'tarjeta' | 'broker' | 'exchange' | 'otro';
    moneda: Moneda;
    saldoInicial: number;
    fechaApertura?: string; // ISO 8601
    // Campos específicos para CDT
    tasaInteres?: number;
    fechaVencimiento?: string; // ISO 8601
    renovacionAutomatica?: boolean;
}

// 📈 Activo
export interface Activo {
    id: ID;
    clase: 'efectivo' | 'etf' | 'accion' | 'bono' | 'cripto' | 'fondo' | 'cde' | 'otro';
    ticker?: string;
    moneda: Moneda;
    cantidad: number;
    costoPromedio?: number;
    cuentaId: ID;
}

// 💸 Transacción
export type TipoTransaccion =
    | 'deposito'
    | 'retiro'
    | 'transferencia'
    | 'compra'
    | 'venta'
    | 'rendimiento'
    | 'comision';

export interface Transaccion {
    id: ID;
    fecha: string; // ISO 8601
    tipo: TipoTransaccion;
    cuentaOrigenId?: ID;
    cuentaDestinoId?: ID;
    activoId?: ID;
    monto?: number;
    cantidad?: number;
    precio?: number;
    comision?: number;
    concepto?: string;
}

// 💱 Tasa de cambio
export interface FxRate {
    id: ID;
    from: Moneda;
    to: Moneda;
    tasa: number;
    fecha: string; // ISO 8601
}

// ⚙️ Preferencias
export interface Preferencias {
    monedaBase: Moneda;
    timezone: string;
}

// 💾 Persistencia (todo el estado)
export interface Persistencia {
    version: number;
    instituciones: Institucion[];
    cuentas: Cuenta[];
    activos: Activo[];
    transacciones: Transaccion[];
    fx: FxRate[];
    prefs: Preferencias;
    lastUpdated?: string; // ISO 8601
}

// 🔐 Estado de autenticación Google
export interface GoogleAuthState {
    isAuthenticated: boolean;
    accessToken: string | null;
    expiresAt: number | null;
    user: {
        email: string;
        name: string;
        picture: string;
    } | null;
}
