import { Persistencia } from '../types/persistencia';

/**
 * 🔄 Fusiona dos estados de persistencia basándose en lastUpdated
 * Estrategia: el más reciente tiene prioridad
 */
export function mergePersistencia(
    local: Persistencia,
    remote: Persistencia
): { merged: Persistencia; conflicts: string[] } {
    const conflicts: string[] = [];

    // Si remote es más reciente, usar remote
    if (remote.lastUpdated && local.lastUpdated) {
        const remoteTime = new Date(remote.lastUpdated).getTime();
        const localTime = new Date(local.lastUpdated).getTime();

        if (remoteTime > localTime) {
            console.log('📥 Remote es más reciente, usando datos remotos');
            return { merged: remote, conflicts };
        } else if (localTime > remoteTime) {
            console.log('📤 Local es más reciente, manteniendo datos locales');
            return { merged: local, conflicts };
        }
    }

    // Si las fechas son iguales o no existen, fusionar por colecciones
    console.log('🔀 Fusionando datos con estrategia por colección');

    // Crear un mapa de IDs para detectar conflictos
    const merged: Persistencia = {
        version: Math.max(local.version, remote.version),
        instituciones: mergeById(local.instituciones, remote.instituciones, 'instituciones', conflicts),
        cuentas: mergeById(local.cuentas, remote.cuentas, 'cuentas', conflicts),
        activos: mergeById(local.activos, remote.activos, 'activos', conflicts),
        transacciones: mergeById(local.transacciones, remote.transacciones, 'transacciones', conflicts),
        fx: mergeById(local.fx, remote.fx, 'fx', conflicts),
        prefs: remote.prefs || local.prefs, // Preferir remote para prefs
        lastUpdated: new Date().toISOString(),
    };

    return { merged, conflicts };
}

/**
 * 🔗 Fusiona dos arrays de entidades por ID
 */
function mergeById<T extends { id: string }>(
    localItems: T[],
    remoteItems: T[],
    collectionName: string,
    conflicts: string[]
): T[] {
    const itemMap = new Map<string, T>();

    // Agregar items locales
    localItems.forEach((item) => itemMap.set(item.id, item));

    // Agregar o sobrescribir con items remotos
    remoteItems.forEach((item) => {
        if (itemMap.has(item.id)) {
            conflicts.push(`⚠️ Conflicto en ${collectionName}: ID ${item.id} (usando remoto)`);
        }
        itemMap.set(item.id, item); // Remote wins
    });

    return Array.from(itemMap.values());
}

/**
 * 📋 Clona un objeto de persistencia
 */
export function clonePersistencia(data: Persistencia): Persistencia {
    return JSON.parse(JSON.stringify(data));
}

/**
 * ✅ Valida la estructura de un objeto Persistencia
 */
export function validatePersistencia(data: any): data is Persistencia {
    return (
        data &&
        typeof data === 'object' &&
        typeof data.version === 'number' &&
        Array.isArray(data.instituciones) &&
        Array.isArray(data.cuentas) &&
        Array.isArray(data.activos) &&
        Array.isArray(data.transacciones) &&
        Array.isArray(data.fx) &&
        data.prefs &&
        typeof data.prefs === 'object'
    );
}
