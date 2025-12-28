export const PLANS = {
  free: {
    key: "free",
    name: "Gratuit",
    amount: 0,
  },
  pro: {
    key: "pro",
    name: "Pro",
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO,
    amount: Number(import.meta.env.VITE_PRICE_PRO_AMOUNT ?? 9.99),
  },
  proPlus: {
    key: "pro_plus",
    name: "Pro+",
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO_PLUS,
    amount: Number(import.meta.env.VITE_PRICE_PRO_PLUS_AMOUNT ?? 19.99),
  },
} as const
