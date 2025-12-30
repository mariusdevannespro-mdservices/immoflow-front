// src/components/BillingPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Download, Calendar, Check } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'

type BillingInvoice = {
  id: string
  date: string | null
  amount: number | null
  status: string | null
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
}

type BillingPaymentMethod = {
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  name: string | null
} | null

type BillingSummary = {
  plan: string
  stripeStatus: string | null
  currentPeriodEnd: string | null
  price: number | null
  interval: 'month' | 'year' | null
  paymentMethod: BillingPaymentMethod
  invoices: BillingInvoice[]
}

export function BillingPage() {
  const { getAccessTokenSilently, isLoading: authLoading } = useAuth0()
  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<BillingSummary | null>(null)

  const fetchSummary = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email',
        },
      })

      const res = await fetch(`${API_URL}/api/billing/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `API error ${res.status}`)
      }

      const json = (await res.json()) as BillingSummary
      setSummary(json)
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? 'Erreur lors du chargement de la facturation')
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const isFree = useMemo(() => {
    const p = summary?.plan ?? 'free'
    return p === 'free'
  }, [summary?.plan])

  // ✅ NEW: lifetime
  const isLifetime = useMemo(() => summary?.stripeStatus === 'lifetime', [summary?.stripeStatus])

  const openPortal = async () => {
    // 🔒 Empêche l'accès au portail Stripe si plan FREE ou lifetime
    if (isFree || isLifetime) return

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email',
        },
      })

      const res = await fetch(`${API_URL}/api/billing/portal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `API error ${res.status}`)
      }

      const json = (await res.json()) as { url?: string }
      if (!json?.url) throw new Error("Pas d'URL portal renvoyée")

      window.location.href = json.url
    } catch (e: any) {
      console.error(e)
      alert(e?.message ?? 'Impossible d’ouvrir le portail Stripe')
    }
  }

  const cancelSubscription = async () => {
    if (isFree || isLifetime) return

    const ok = window.confirm(
      "Tu es sûr de vouloir annuler ton abonnement ?\n\nTu garderas l’accès jusqu’à la fin de la période en cours."
    )
    if (!ok) return

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email',
        },
      })

      const res = await fetch(`${API_URL}/api/billing/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `API error ${res.status}`)
      }

      alert("Abonnement annulé ✅ (fin de période).")
      await fetchSummary()
    } catch (e: any) {
      console.error(e)
      alert(e?.message ?? "Erreur lors de l’annulation")
    }
  }

  useEffect(() => {
    if (authLoading) return
    void fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading])

  const planLabel = useMemo(() => {
    const p = summary?.plan ?? 'free'
    if (p === 'pro') return 'Plan Pro'
    if (p === 'pro_plus') return 'Plan Pro+'
    return 'Plan Gratuit'
  }, [summary?.plan])

  const statusLabel = useMemo(() => {
    const s = summary?.stripeStatus
    if (!s) return 'Aucun abonnement'
    if (s === 'lifetime') return 'Accès à vie'
    if (s === 'active') return 'Actif'
    if (s === 'trialing') return 'Essai'
    if (s === 'past_due') return 'Paiement en retard'
    if (s === 'canceled') return 'Annulé'
    if (s === 'unpaid') return 'Impayé'
    return s
  }, [summary?.stripeStatus])

  const priceValue = summary?.price ?? 0
  const intervalLabel = summary?.interval === 'year' ? 'par an' : 'par mois'

  const nextBillingLabel = useMemo(() => {
    if (!summary?.currentPeriodEnd) return null
    const d = new Date(summary.currentPeriodEnd)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  }, [summary?.currentPeriodEnd])

  const invoices = summary?.invoices ?? []
  const pm = summary?.paymentMethod

  const disableStripeActions = isFree || isLifetime

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="mb-2">Facturation</h1>
          <p className="text-gray-600 dark:text-gray-400">Chargement…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="mb-2">Facturation</h1>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchSummary}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            type="button"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="mb-2">Facturation</h1>
        <p className="text-gray-600 dark:text-gray-400">Gérez votre abonnement et consultez vos factures</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="mb-6">Plan actuel</h2>

            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-emerald-900 dark:text-emerald-300 mb-1">{planLabel}</h3>
                  <p className="text-emerald-800 dark:text-emerald-400">{statusLabel}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">
                    {summary?.price != null ? `${priceValue}€` : '0€'}
                  </div>
                  <div className="text-sm text-emerald-700 dark:text-emerald-400">
                    {summary?.price != null ? intervalLabel : ''}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <Feature text="Projets illimités" included={(summary?.plan ?? 'free') !== 'free'} />
                <Feature text="Export PDF professionnel" included={(summary?.plan ?? 'free') !== 'free'} />
                <Feature text="Comparaison de projets" included={(summary?.plan ?? 'free') !== 'free'} />
                <Feature text="Support prioritaire" included={(summary?.plan ?? 'free') !== 'free'} />
              </div>

              {nextBillingLabel && (
                <div className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-400">
                  <Calendar className="w-4 h-4" />
                  <span>Fin de période / prochaine facturation : {nextBillingLabel}</span>
                </div>
              )}

              {isLifetime && (
                <div className="mt-4 text-sm text-emerald-800 dark:text-emerald-400">
                  🎉 Licence <b>Pro+</b> à vie active — aucune gestion Stripe n’est nécessaire.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {!isLifetime ? (
                <Link
                  to="/upgrade"
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 text-center"
                >
                  Changer de plan
                </Link>
              ) : (
                <button
                  disabled
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 rounded-lg cursor-not-allowed"
                  type="button"
                >
                  Accès à vie actif
                </button>
              )}

              <button
                onClick={cancelSubscription}
                disabled={disableStripeActions}
                title={
                  isLifetime
                    ? 'Licence lifetime active – aucune gestion Stripe'
                    : isFree
                      ? 'Portail Stripe indisponible en plan Gratuit'
                      : 'Annuler'
                }
                className={`flex-1 px-6 py-3 rounded-lg transition-colors ${
                  disableStripeActions
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                type="button"
              >
                Annuler
              </button>
            </div>

            {isFree && !isLifetime && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Tu es en plan Gratuit : pas d’accès au portail Stripe.
              </p>
            )}

            {isLifetime && (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Tu es en licence lifetime : le portail Stripe, l’annulation et le changement de plan sont désactivés.
              </p>
            )}
          </div>

          {/* Invoices */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="mb-6">Historique de facturation</h2>

            {invoices.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Aucune facture pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="mb-4">Méthode de paiement</h3>

            {pm ? (
              <>
                <div className="bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 text-white mb-4">
                  <div className="flex justify-between items-start mb-8">
                    <CreditCard className="w-8 h-8" />
                    <span className="text-xs">{pm.brand?.toUpperCase?.() ?? 'CARD'}</span>
                  </div>
                  <div className="mb-6">
                    <div className="text-lg tracking-wider">•••• •••• •••• {pm.last4}</div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>{pm.name ?? '—'}</div>
                    <div>
                      {String(pm.exp_month).padStart(2, '0')}/{String(pm.exp_year).slice(-2)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={openPortal}
                  disabled={disableStripeActions}
                  title={
                    isLifetime
                      ? 'Licence lifetime active – aucune gestion Stripe'
                      : isFree
                        ? 'Portail Stripe indisponible en plan Gratuit'
                        : 'Modifier la carte'
                  }
                  className={`w-full px-4 py-3 rounded-lg transition-colors ${
                    disableStripeActions
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  type="button"
                >
                  Modifier la carte
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Aucune carte enregistrée (ou abonnement inactif).
                </p>
                <button
                  onClick={openPortal}
                  disabled={disableStripeActions}
                  title={
                    isLifetime
                      ? 'Licence lifetime active – aucune gestion Stripe'
                      : isFree
                        ? 'Portail Stripe indisponible en plan Gratuit'
                        : 'Ouvrir le portail Stripe'
                  }
                  className={`w-full px-4 py-3 rounded-lg transition-colors ${
                    disableStripeActions
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  type="button"
                >
                  Ouvrir le portail Stripe
                </button>
              </>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="mb-2 text-blue-900 dark:text-blue-300">💡 Bon à savoir</h3>
            <p className="text-sm text-blue-800 dark:text-blue-400 mb-3">
              Vous pouvez annuler votre abonnement à tout moment. Vous conserverez l'accès jusqu'à la fin de la période payée.
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Toutes vos données seront conservées pendant 30 jours après l'annulation.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="mb-4">Besoin d'aide ?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Une question sur votre facturation ?</p>
            <a
              href="mailto:support@immoflow.fr"
              className="text-sm text-emerald-600 dark:text-emerald-500 hover:underline"
            >
              Contacter le support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function Feature({ text, included = true }: { text: string; included?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Check
        className={`w-4 h-4 ${
          included ? 'text-emerald-600 dark:text-emerald-500' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
      <span
        className={`text-sm ${
          included ? 'text-emerald-800 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500 line-through'
        }`}
      >
        {text}
      </span>
    </div>
  )
}

function InvoiceRow({ invoice }: { invoice: BillingInvoice }) {
  const dateLabel = invoice.date ? new Date(invoice.date).toLocaleDateString('fr-FR') : '—'
  const amountLabel = invoice.amount != null ? `${invoice.amount}€` : '—'

  const paid = invoice.status === 'paid'
  const statusLabel = paid ? 'Payée' : invoice.status ?? '—'

  const url = invoice.invoicePdf ?? invoice.hostedInvoiceUrl ?? null

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <div className="flex-1">
        <div className="font-medium mb-1">{invoice.id}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{dateLabel}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-semibold">{amountLabel}</div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            paid
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
          }`}
        >
          {statusLabel}
        </span>

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors"
            title="Voir / télécharger la facture"
          >
            <Download className="w-5 h-5" />
          </a>
        ) : (
          <button className="p-2 text-gray-400 cursor-not-allowed" title="Lien de facture indisponible" type="button" disabled>
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
