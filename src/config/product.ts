export const PRODUCT = {
  name: 'Kompvid',
  domain: 'kompvid.com',
  tagline: 'Comprime tus videos al tama\u00f1o que necesitas',
  subtitle: 'Reduce el tama\u00f1o de tus videos y prep\u00e1ralos para compartir',
} as const

// Pro: los limites quedan en null hasta confirmarlos con pruebas tecnicas.
export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratis',
    maxFileMB: 100,
    dailyOperations: 2,
  },
  pro: {
    id: 'pro',
    name: 'Kompvid Pro',
    currency: 'USD',
    priceMonthly: 9.99,
    priceYearly: 39.99,
    maxFileMB: null as number | null,
    dailyOperations: null as number | null,
  },
} as const
