import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { useMemo } from 'react'
import { useMe } from '../App'
import { PLANS } from "../config/plans"
import { useState } from "react"


export function PricingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isUpgradeMode = location.pathname === '/upgrade'

  const { me, meLoading } = useMe()
  const { isAuthenticated, isLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0()

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

  // ✅ Plan actuel (chez toi on sait que "pro" existe)
  const isCurrentPro = useMemo(() => me?.plan === 'pro', [me?.plan])

  // ✅ pour l’instant on ne connait pas la valeur exacte côté backend
  // (si plus tard ton /me renvoie "pro_plus", remplace cette condition)
  const isCurrentProPlus = useMemo(() => me?.plan === 'pro_plus', [me?.plan])

  // ✅ FREE = pas pro et pas pro_plus (ou pas de plan)
  const isCurrentFree = useMemo(() => !me?.plan || (!isCurrentPro && !isCurrentProPlus), [me?.plan, isCurrentPro, isCurrentProPlus])

  const startCheckout = async (priceId: string | undefined) => {
    if (!priceId) {
      alert('PriceId manquant (VITE_STRIPE_PRICE_PRO / VITE_STRIPE_PRICE_PRO_PLUS)')
      return
    }

    if (isLoading) return

    // ✅ Pas connecté -> on login et on revient sur /post-auth (pas /pricing)
    if (!isAuthenticated) {
      await loginWithRedirect({
        appState: { returnTo: '/post-auth' },
        authorizationParams: { screen_hint: 'signup' },
      })
      return
    }

    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      },
    })

    const res = await fetch(`${API_URL}/api/billing/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ priceId }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error(data)
      alert(data?.message ?? data?.error ?? 'Erreur checkout')
      return
    }

    if (!data?.url) {
      alert("Pas d'URL Stripe renvoyée")
      return
    }

    window.location.href = data.url
  }

  const startFree = async () => {
    if (isLoading) return

    if (!isAuthenticated) {
      await loginWithRedirect({
        appState: { returnTo: '/post-auth?startFree=1' },
        authorizationParams: { screen_hint: 'signup' },
      })
      return
    }

    const token = await getAccessTokenSilently({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      },
    })

    await fetch(`${API_URL}/api/me/start-free`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    navigate('/dashboard', { replace: true })
  }

  const [licenseKey, setLicenseKey] = useState("")
  const [redeemLoading, setRedeemLoading] = useState(false)

  const redeemKey = async () => {
    if (!licenseKey.trim()) return alert("Entre une clé")

    setRedeemLoading(true)

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email',
        },
      })

      const res = await fetch(`${API_URL}/api/billing/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: licenseKey.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data?.error ?? "Clé invalide")
        return
      }

      alert("🎉 Licence Pro+ activée à vie !")
      window.location.reload()
    } finally {
      setRedeemLoading(false)
    }
  }


  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="mb-4">{isUpgradeMode ? 'Passez au Pro' : 'Choisissez votre plan'}</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {isUpgradeMode
              ? 'Débloquez les fonctionnalités Pro en choisissant une offre.'
              : "Commencez gratuitement et passez à un plan supérieur quand vous en avez besoin"}
          </p>
        </div>

        {/* ✅ Toujours 3 colonnes */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* FREE (0€) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 relative">
            {isAuthenticated && !meLoading && isCurrentFree && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gray-900 text-white px-4 py-1 rounded-full text-sm">Plan actuel</span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-2">{PLANS.free.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-semibold">{PLANS.free.amount}€</span>
                <span className="text-gray-600 dark:text-gray-400">/mois</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Pour découvrir l'outil</p>
            </div>

            <button
              onClick={startFree}
              disabled={isAuthenticated && !meLoading && isCurrentFree}
              className={`block w-full py-3 px-6 rounded-lg transition-colors mb-6 text-center ${
                isAuthenticated && !meLoading && isCurrentFree
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : isAuthenticated && !meLoading && !isCurrentFree
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              type="button"
            >
              {isAuthenticated && !meLoading && isCurrentFree && 'Plan actuel'}
              {isAuthenticated && !meLoading && !isCurrentFree && 'Revenir au plan gratuit'}
              {!isAuthenticated && 'Commencer gratuitement'}
            </button>

            <div className="space-y-3">
              <Feature text="1 projets maximum" />
              <Feature text="Calculs de rentabilité" />
              <Feature text="Verdict automatique" />
              <Feature text="Dashboard simple" />
              <Feature text="Export PDF" included={false} />
              <Feature text="Comparaison de projets" included={false} />
            </div>
          </div>

          {/* PRO */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-emerald-600 dark:border-emerald-500 p-8 relative shadow-xl shadow-emerald-600/10">
            {!isUpgradeMode && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-sm">Le plus populaire</span>
              </div>
            )}

            {isAuthenticated && !meLoading && isCurrentPro && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gray-900 text-white px-4 py-1 rounded-full text-sm">Plan actuel</span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-2">{PLANS.pro.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-semibold">{PLANS.pro.amount}€</span>
                <span className="text-gray-600 dark:text-gray-400">/mois</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Pour les investisseurs sérieux</p>
            </div>

            <button
              onClick={() => startCheckout(PLANS.pro.priceId)}
              disabled={isAuthenticated && !meLoading && isCurrentPro}
              className={`block w-full py-3 px-6 rounded-lg transition-colors mb-6 shadow-lg text-center ${
                isAuthenticated && !meLoading && isCurrentPro
                  ? 'bg-emerald-200 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
              type="button"
            >
              {isAuthenticated && !meLoading && isCurrentPro ? 'Plan actuel' : "Commencer l'essai gratuit"}
            </button>

            <div className="space-y-3">
              <Feature text="Projets illimités" />
              <Feature text="Calculs de rentabilité" />
              <Feature text="Verdict automatique" />
              <Feature text="Dashboard avancé" />
              <Feature text="Export PDF professionnel" />
              <Feature text="Comparaison de projets" />
              <Feature text="Support prioritaire" />
              <Feature text="Historique complet" />
            </div>
          </div>

          {/* PRO+ */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 relative">
            {isAuthenticated && !meLoading && isCurrentProPlus && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gray-900 text-white px-4 py-1 rounded-full text-sm">Plan actuel</span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-2">{PLANS.proPlus.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-semibold">{PLANS.proPlus.amount}€</span>
                <span className="text-gray-600 dark:text-gray-400">/mois</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Pour les professionnels</p>
            </div>

            <button
              onClick={() => startCheckout(PLANS.proPlus.priceId)}
              disabled={isAuthenticated && !meLoading && isCurrentProPlus}
              className={`block w-full py-3 px-6 rounded-lg transition-colors mb-6 text-center ${
                isAuthenticated && !meLoading && isCurrentProPlus
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              type="button"
            >
              {isAuthenticated && !meLoading && isCurrentProPlus ? 'Plan actuel' : "Commencer l'essai gratuit"}
            </button>

            <div className="space-y-3">
              <Feature text="Tout du plan Pro" />
              <Feature text="Analyses avancées" />
              <Feature text="Simulations fiscales" />
              <Feature text="Formation personnalisée" />
              <Feature text="Accès anticipé aux nouvelles fonctionnalités" />
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <div className="mt-14 max-w-md mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
            <h3 className="mb-4">Tu as une clé lifetime ?</h3>

            <div className="flex gap-2">
              <input
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
              />
              <button
                onClick={redeemKey}
                disabled={redeemLoading}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Activer
              </button>
            </div>
          </div>
        )}

        {/* FAQ seulement en mode normal */}
        {!isUpgradeMode && (
          <>
            <div className="mt-20 max-w-3xl mx-auto">
              <h2 className="text-center mb-12">Questions fréquentes</h2>
              <div className="space-y-6">
                <FAQItem
                  question="Puis-je changer de plan à tout moment ?"
                  answer="Oui, vous pouvez changer de plan à tout moment. Le changement prend effet immédiatement et vous êtes facturé au prorata."
                />
                <FAQItem
                  question="Y a-t-il une période d'essai ?"
                  answer="Oui, tous les plans payants bénéficient d'une période d'essai gratuite de 14 jours. Aucune carte bancaire n'est requise."
                />
                <FAQItem
                  question="Puis-je annuler mon abonnement ?"
                  answer="Oui, vous pouvez annuler votre abonnement à tout moment depuis votre espace de facturation. Vous conserverez l'accès jusqu'à la fin de la période payée."
                />
                <FAQItem
                  question="Les calculs sont-ils fiables ?"
                  answer="Nos algorithmes sont basés sur les méthodes de calcul standard de rentabilité immobilière. Nous vous recommandons de valider les résultats avec votre conseiller financier."
                />
              </div>
            </div>

            <div className="mt-20 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Vous avez des questions ? Contactez-nous à{' '}
                <a href="mailto:contact@immoflow.fr" className="text-emerald-600 dark:text-emerald-500 hover:underline">
                  contact@immoflow.fr
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Feature({ text, included = true }: { text: string; included?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <Check
        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
          included ? 'text-emerald-600 dark:text-emerald-500' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
      <span className={included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 line-through'}>
        {text}
      </span>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="mb-2">{question}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{answer}</p>
    </div>
  )
}
