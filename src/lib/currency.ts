import type { Moneda } from '@/types/persistencia'

/**
 * Formatea un número como moneda, manejando tanto monedas fiat como criptomonedas
 * @param amount - Cantidad a formatear
 * @param currency - Código de moneda (COP, USD, EUR, USDT, BTC, ETH)
 * @param locale - Locale para el formato (por defecto es-CO)
 * @returns String formateado como moneda
 */
export function formatCurrency(amount: number, currency: Moneda = 'COP', locale: string = 'es-CO'): string {
  // Monedas fiat que soporta Intl.NumberFormat
  const fiatCurrencies = ['COP', 'USD', 'EUR']

  // Configuraciones específicas para criptomonedas
  const cryptoConfig = {
    USDT: { symbol: 'USDT', decimals: 6 },
    BTC: { symbol: '₿', decimals: 8 },
    ETH: { symbol: 'Ξ', decimals: 8 }
  }

  if (fiatCurrencies.includes(currency)) {
    // Para monedas fiat, usar Intl.NumberFormat estándar
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: currency === 'COP' ? 0 : 2,
    }).format(amount)
  } else if (currency in cryptoConfig) {
    // Para criptomonedas, formato personalizado
    const config = cryptoConfig[currency as keyof typeof cryptoConfig]

    // Determinar decimales dinámicamente basado en el valor
    let decimalsToShow = 0
    if (amount >= 1) {
      decimalsToShow = Math.min(2, config.decimals) // Para valores grandes, mostrar menos decimales
    } else if (amount >= 0.01) {
      decimalsToShow = Math.min(4, config.decimals)
    } else if (amount >= 0.0001) {
      decimalsToShow = Math.min(6, config.decimals)
    } else {
      decimalsToShow = config.decimals // Para valores muy pequeños, mostrar todos los decimales
    }

    const formattedAmount = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimalsToShow,
    }).format(amount)

    return `${config.symbol} ${formattedAmount}`
  } else {
    // Fallback para monedas no reconocidas
    return `${currency} ${amount.toLocaleString(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`
  }
}

/**
 * Obtiene el símbolo de una moneda
 * @param currency - Código de moneda
 * @returns Símbolo de la moneda
 */
export function getCurrencySymbol(currency: Moneda): string {
  const symbols = {
    COP: '$',
    USD: 'US$',
    EUR: '€',
    USDT: 'USDT',
    BTC: '₿',
    ETH: 'Ξ'
  }

  return symbols[currency] || currency
}

/**
 * Convierte entre monedas usando tasas de cambio simplificadas (versión simple)
 * ⚠️ IMPORTANTE: Esta función usa tasas HARDCODEADAS y desactualizadas
 * Para una app real, implementar fetchExchangeRates() con APIs en tiempo real
 * @param amount - Cantidad a convertir
 * @param from - Moneda origen
 * @param to - Moneda destino
 * @returns Cantidad convertida
 */
export function convertCurrencySimple(amount: number, from: Moneda, to: Moneda): number {
  if (from === to) return amount

  // ⚠️ TASAS HARDCODEADAS - NO SON REALES NI ACTUALES
  // TODO: Reemplazar con API de tasas en tiempo real
  const rates: Record<string, number> = {
    'USD_COP': 4100,        // Actualizado Oct 2024
    'EUR_COP': 4450,        // Actualizado Oct 2024
    'USDT_COP': 4100,       // Similar a USD
    'BTC_COP': 295000000,   // ~295M COP por BTC (Oct 2024)
    'ETH_COP': 11500000,    // ~11.5M COP por ETH (Oct 2024)
  }

  // Conversión directa
  const directKey = `${from}_${to}`
  if (rates[directKey]) {
    return amount * rates[directKey]
  }

  // Conversión inversa
  const inverseKey = `${to}_${from}`
  if (rates[inverseKey]) {
    return amount / rates[inverseKey]
  }

  // Conversión a través de COP
  if (from !== 'COP' && to !== 'COP') {
    const toCop = convertCurrencySimple(amount, from, 'COP')
    return convertCurrencySimple(toCop, 'COP', to)
  }

  // Fallback: retornar el mismo valor
  return amount
}

/**
 * 🌐 Obtiene tasas de cambio en tiempo real desde APIs externas
 * Esta es la función que deberías usar en producción
 * @param currencies - Array de monedas para obtener tasas
 * @returns Promise con las tasas de cambio actuales
 */
export async function fetchExchangeRates(currencies: Moneda[] = ['USD', 'EUR', 'BTC', 'ETH', 'USDT']): Promise<Record<string, number>> {
  try {
    const rates: Record<string, number> = {}

    // 1. Obtener tasas fiat (USD, EUR) desde ExchangeRate-API
    const fiatResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const fiatData = await fiatResponse.json()

    if (fiatData.rates?.COP) {
      rates['USD_COP'] = fiatData.rates.COP
    }

    // 2. Obtener tasas crypto desde CoinGecko API (gratis)
    const cryptoIds = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether'
    }

    const cryptoCurrencies = currencies.filter(c => c in cryptoIds)
    if (cryptoCurrencies.length > 0) {
      const ids = cryptoCurrencies.map(c => cryptoIds[c as keyof typeof cryptoIds]).join(',')
      const cryptoResponse = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=cop,usd`,
        {
          headers: {
            'Accept': 'application/json',
          },
          // Agregar timeout para evitar requests largos
          signal: AbortSignal.timeout(10000) // 10 segundos timeout
        }
      )

      // Verificar si la respuesta es exitosa
      if (!cryptoResponse.ok) {
        throw new Error(`CoinGecko API error: ${cryptoResponse.status} ${cryptoResponse.statusText}`)
      }

      const cryptoData = await cryptoResponse.json()

      // Mapear respuesta a nuestro formato
      Object.entries(cryptoIds).forEach(([symbol, id]) => {
        if (cryptoData[id]?.cop) {
          rates[`${symbol}_COP`] = cryptoData[id].cop
        }
        if (cryptoData[id]?.usd) {
          rates[`${symbol}_USD`] = cryptoData[id].usd
        }
      })
    }

    console.log('✅ Tasas de cambio actualizadas:', rates)
    return rates

  } catch (error) {
    console.error('❌ Error obteniendo tasas de cambio:', error)

    // Detectar tipos específicos de error para mejor manejo
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('⏱️ Timeout alcanzado - APIs externas lentas')
      } else if (error.message.includes('429')) {
        console.warn('� Rate limit alcanzado - Esperando antes del siguiente intento')
      } else if (error.message.includes('Failed to fetch')) {
        console.warn('🌐 Sin conexión a internet o APIs bloqueadas')
      }
    }

    console.warn('�🔄 Usando tasas hardcodeadas como fallback')

    // Fallback a tasas hardcodeadas actualizadas (más realistas para Oct 2024)
    return {
      'USD_COP': 4100,    // 1 USD = 4,100 COP
      'EUR_COP': 4450,    // 1 EUR = 4,450 COP  
      'USDT_COP': 4100,   // 1 USDT = 4,100 COP
      'BTC_COP': 295000000, // 1 BTC = 295,000,000 COP (~$72,000 USD)
      'ETH_COP': 11500000,  // 1 ETH = 11,500,000 COP (~$2,800 USD)
    }
  }
}

/**
 * 💱 Convierte entre monedas usando tasas actuales (versión mejorada)
 * @param amount - Cantidad a convertir
 * @param from - Moneda origen  
 * @param to - Moneda destino
 * @param customRates - Tasas personalizadas (opcional)
 * @returns Cantidad convertida
 */
export async function convertCurrency(
  amount: number,
  from: Moneda,
  to: Moneda,
  customRates?: Record<string, number>
): Promise<number> {
  if (from === to) return amount

  const rates = customRates || await fetchExchangeRates()

  // Conversión directa
  const directKey = `${from}_${to}`
  if (rates[directKey]) {
    return amount * rates[directKey]
  }

  // Conversión inversa
  const inverseKey = `${to}_${from}`
  if (rates[inverseKey]) {
    return amount / rates[inverseKey]
  }

  // Conversión a través de COP o USD
  const baseCurrency = rates[`${from}_COP`] ? 'COP' : 'USD'

  if (from !== baseCurrency && to !== baseCurrency) {
    const toBase = await convertCurrency(amount, from, baseCurrency as Moneda, rates)
    return await convertCurrency(toBase, baseCurrency as Moneda, to, rates)
  }

  // Fallback usando tasas hardcodeadas
  return convertCurrencySimple(amount, from, to)
}

/**
 * Obtiene la precisión máxima (número de decimales) para una moneda
 * @param currency - Código de moneda
 * @returns Número máximo de decimales permitidos
 */
export function getCurrencyPrecision(currency: Moneda): number {
  const precisions = {
    COP: 0,     // Peso colombiano no usa decimales
    USD: 2,     // Dólar estadounidense: centavos
    EUR: 2,     // Euro: céntimos
    USDT: 6,    // Tether: hasta 6 decimales
    BTC: 8,     // Bitcoin: satoshis (8 decimales)
    ETH: 18     // Ethereum: wei (18 decimales, pero mostramos máx 8)
  }

  return precisions[currency] || 2
}

/**
 * Obtiene el step apropiado para inputs numéricos según la moneda
 * @param currency - Código de moneda
 * @returns String con el valor de step para el input
 */
export function getCurrencyStep(currency: Moneda): string {
  const precision = getCurrencyPrecision(currency)

  if (precision === 0) return '1'
  if (precision <= 2) return '0.01'
  if (precision <= 6) return '0.000001'
  return '0.00000001' // Para BTC y otras criptos de alta precisión
}

/**
 * Obtiene un placeholder apropiado para inputs según la moneda
 * @param currency - Código de moneda
 * @returns String con ejemplo de valor para el placeholder
 */
export function getCurrencyPlaceholder(currency: Moneda): string {
  const examples = {
    COP: '1000000',
    USD: '1000.00',
    EUR: '1000.00',
    USDT: '1000.000000',
    BTC: '0.00199491',
    ETH: '0.123456789'
  }

  return examples[currency] || '0'
}
