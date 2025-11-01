import { endOfMonth, format, isValid, parseISO, startOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * 📅 Formatea una fecha ISO a un formato legible
 */
export function formatDate(isoDate: string, formatStr = 'dd/MM/yyyy'): string {
    try {
        const date = parseISO(isoDate);
        if (!isValid(date)) return isoDate;
        return format(date, formatStr, { locale: es });
    } catch {
        return isoDate;
    }
}

/**
 * 📅 Formatea una fecha ISO a formato corto (dd MMM)
 */
export function formatDateShort(isoDate: string): string {
    return formatDate(isoDate, 'dd MMM');
}

/**
 * 📅 Formatea una fecha ISO a formato completo (dd MMMM yyyy)
 */
export function formatDateFull(isoDate: string): string {
    return formatDate(isoDate, "dd 'de' MMMM 'de' yyyy");
}

/**
 * 📅 Obtiene la fecha actual en formato ISO
 */
export function getTodayISO(): string {
    return new Date().toISOString();
}

/**
 * 📅 Obtiene el rango del mes actual
 */
export function getCurrentMonthRange(): { start: string; end: string } {
    const now = new Date();
    return {
        start: startOfMonth(now).toISOString(),
        end: endOfMonth(now).toISOString(),
    };
}

/**
 * 📅 Obtiene el rango del mes anterior
 */
export function getLastMonthRange(): { start: string; end: string } {
    const lastMonth = subMonths(new Date(), 1);
    return {
        start: startOfMonth(lastMonth).toISOString(),
        end: endOfMonth(lastMonth).toISOString(),
    };
}

/**
 * 📅 Valida si una fecha ISO es válida
 */
export function isValidISODate(isoDate: string): boolean {
    try {
        const date = parseISO(isoDate);
        return isValid(date);
    } catch {
        return false;
    }
}
