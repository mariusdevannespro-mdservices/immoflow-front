import React from "react"
import { Link } from "react-router-dom"
import { PLANS } from "../config/plans"
import {
  TrendingUp,
  Calculator,
  FileText,
  BarChart3,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight,
  BadgeCheck,
  Sparkles,
  HelpCircle,
} from "lucide-react"

export function LandingPage() {
  return (
    <div className="bg-white dark:bg-gray-900">
      {/* ✅ IMPORTANT:
          La navbar est déjà rendue par <PublicLayout /> via <PublicNav /> dans App.tsx.
          Donc on ne met PAS de navbar ici. */}

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 lg:pt-24 lg:pb-16">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs mb-5">
              <Sparkles className="w-4 h-4" />
              Rentabilité réelle • Impôts inclus • PDF pro
            </div>

            <h1 className="text-gray-900 dark:text-gray-100 text-4xl sm:text-5xl font-semibold leading-tight mb-5">
              Sais immédiatement si ton investissement locatif est{" "}
              <span className="text-emerald-600 dark:text-emerald-500">rentable</span>.
            </h1>

            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-2xl">
              Cashflow réel, rentabilité nette, verdict clair. Fini les tableurs compliqués : tu rentres ton projet,
              ImmoFlow te donne une réponse nette — et un rapport PDF prêt à envoyer.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/simulateur-gratuit"
                className="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 text-center inline-flex items-center justify-center gap-2"
              >
                Tester gratuitement <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                to="/pricing"
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
              >
                Voir les tarifs
              </Link>
            </div>

            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Sans carte bancaire • Résultat en 2 minutes • Données sécurisées
            </div>

            {/* Trust bullets */}
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              <TrustPill icon={<BadgeCheck className="w-4 h-4" />} label="Méthode LMNP réaliste" />
              <TrustPill icon={<FileText className="w-4 h-4" />} label="PDF pro prêt à partager" />
              <TrustPill icon={<Shield className="w-4 h-4" />} label="Confidentialité & sécurité" />
            </div>
          </div>

          {/* Right side: “result preview” */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Exemple de verdict</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Projet RENTABLE</h3>
                  </div>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    OK
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cashflow</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-semibold text-emerald-600 dark:text-emerald-500">+124 €</span>
                    <span className="text-gray-600 dark:text-gray-400 mb-1">/ mois</span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <MiniStat label="Rendement" value="6,8 %" />
                    <MiniStat label="Mensualité" value="750 €" />
                    <MiniStat label="Impôt" value="320 € / an" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Hypothèses modifiables</span>
                  <span className="text-emerald-600 dark:text-emerald-500">Voir détail →</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Exemple illustratif. Les résultats dépendent de tes paramètres.
            </div>
          </div>
        </div>
      </section>

      {/* Proof strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid md:grid-cols-3 gap-4">
          <ProofCard title="Verdict clair" desc="Rentable / limite / non rentable, sans interprétation." />
          <ProofCard title="Chiffres actionnables" desc="Cashflow, rentabilité, impôts, mensualités." />
          <ProofCard title="Rapport pro" desc="PDF prêt à envoyer à un banquier ou associé." />
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              Tout ce qu’il faut, rien de trop
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Conçu pour décider vite, avec des chiffres réalistes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Calculator className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />}
              title="Calculs automatiques"
              description="Cashflow, rentabilité brute / nette / net-net, et détails structurés."
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />}
              title="Verdict immédiat"
              description="Un verdict lisible en 1 seconde : rentable, limite ou non rentable."
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />}
              title="Comparaison de projets"
              description="Compare rapidement tes projets pour choisir le meilleur deal."
            />
            <FeatureCard
              icon={<FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />}
              title="Export PDF professionnel"
              description="Résumé exécutif + détails, prêt à partager (banquier / associés)."
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />}
              title="Rapide et simple"
              description="Pensé pour aller droit au but : 2 minutes et tu sais."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />}
              title="Données sécurisées"
              description="Tes projets restent privés. Accès protégé et gestion par compte."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-3xl font-semibold text-gray-900 dark:text-gray-100">Comment ça marche ?</h2>
            <p className="text-gray-600 dark:text-gray-400">Trois étapes simples pour décider sans te tromper</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard number="1" title="Renseigne ton projet" description="Prix, financement, loyer, charges… le strict nécessaire." />
            <StepCard number="2" title="Obtiens ton verdict" description="Cashflow + rentabilités + impôts + lecture claire." />
            <StepCard number="3" title="Partage / compare" description="Compare tes projets et exporte un PDF pro." />
          </div>
        </div>
      </section>

      {/* Example Result Section */}
      <section id="resultat" className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="mb-4 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              Un résultat lisible en 5 secondes
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Le but : décider vite. Les détails sont là quand tu en as besoin.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <ResultShowcase />
          </div>

          <div className="text-center mt-10">
            <Link
              to="/simulateur-gratuit"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
            >
              Tester sur mon projet <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Sans carte bancaire</div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section id="tarifs" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-3xl font-semibold text-gray-900 dark:text-gray-100">Des offres simples</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Commence petit, passe Pro quand tu veux comparer et exporter.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <PricingCard
              title={PLANS.free.name}
              price={`${PLANS.free.amount}€`}
              badge={null}
              features={["1 projet", "Résultats détaillés", "Historique limité"]}
              highlighted={false}
            />

            <PricingCard
              title={PLANS.pro.name}
              price={`${PLANS.pro.amount}€`}
              badge="Le plus populaire"
              features={["Projets illimités", "Comparaison de projets", "Export PDF complet", "Support prioritaire"]}
              highlighted
            />

            <PricingCard
              title={PLANS.proPlus.name}
              price={`${PLANS.proPlus.amount}€`}
              badge={null}
              features={["Tout Pro", "Analyses avancées", "Simulations fiscales", "Support premium"]}
              highlighted={false}
            />
          </div>

          <div className="text-center mt-10">
            <Link to="/pricing" className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-500 hover:underline">
              Voir le détail des tarifs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-gray-50 dark:bg-gray-800 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="mb-4 text-3xl font-semibold text-gray-900 dark:text-gray-100">FAQ</h2>
            <p className="text-gray-600 dark:text-gray-400">Les questions qu’on te posera avant d’acheter</p>
          </div>

          <div className="space-y-4">
            <FAQItem
              q="Est-ce que c’est vraiment fiable ?"
              a="Oui : ImmoFlow calcule le cashflow, la rentabilité et les impôts selon tes paramètres. Le but est de te donner une lecture claire et exploitable, avec un rapport PDF pro."
            />
            <FAQItem
              q="Je dois être expert en immo / finance ?"
              a="Non. On te demande uniquement les infos essentielles. Les résultats sont expliqués et structurés."
            />
            <FAQItem
              q="Je peux exporter un PDF pour un banquier ?"
              a="Oui. L’offre Pro inclut un PDF complet et présentable (résumé + détails)."
            />
            <FAQItem q="Je peux annuler quand je veux ?" a="Oui, sans engagement." />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-emerald-600 dark:bg-emerald-700 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="mb-4 text-white text-3xl font-semibold">Prêt à analyser ton prochain investissement ?</h2>
          <p className="text-emerald-50 mb-8 text-lg">
            Teste ImmoFlow sur un projet réel et obtiens ton verdict en quelques minutes.
          </p>
          <Link
            to="/simulateur-gratuit"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors shadow-xl"
          >
            Tester gratuitement <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="mt-3 text-emerald-100 text-sm">Sans carte bancaire • Sans engagement</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 py-12 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="mb-3 text-gray-900 dark:text-gray-100 font-semibold">ImmoFlow</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                L’outil simple pour décider si un investissement locatif est rentable.
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-gray-900 dark:text-gray-100 font-semibold">Produit</h4>
              <div className="space-y-2 text-sm">
                <a
                  href="#fonctionnalites"
                  className="block text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Fonctionnalités
                </a>
                <Link
                  to="/pricing"
                  className="block text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Tarifs
                </Link>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-gray-900 dark:text-gray-100 font-semibold">Entreprise</h4>
              <div className="space-y-2 text-sm">
                <Link
                  to="/terms"
                  className="block text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  CGU
                </Link>
                <Link
                  to="/privacy"
                  className="block text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Confidentialité
                </Link>
                <Link
                  to="/legal"
                  className="block text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500"
                >
                  Mentions légales
                </Link>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-gray-900 dark:text-gray-100 font-semibold">Contact</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">contact@immoflow.fr</p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 ImmoFlow. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ---------- Small components ---------- */

function TrustPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3">
      <span className="text-emerald-600 dark:text-emerald-500">{icon}</span>
      <span className="text-sm text-gray-800 dark:text-gray-200">{label}</span>
    </div>
  )
}

function ProofCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  )
}

function ResultShowcase() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Projet RENTABLE
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Synthèse</span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cashflow</p>
            <p className="text-4xl font-semibold text-emerald-600 dark:text-emerald-500">+124 € / mois</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Rent. nette" value="5,1 %" />
            <MiniStat label="Charges" value="210 €" />
            <MiniStat label="Impôt" value="320 € / an" />
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Conclusion</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Deal intéressant : cashflow positif et rentabilité nette cohérente avec le risque.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">PDF professionnel</h3>
        </div>

        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <Bullet>Résumé exécutif (verdict + chiffres clés)</Bullet>
          <Bullet>Détails : revenus, charges, impôts, crédit</Bullet>
          <Bullet>Hypothèses & paramètres (transparent)</Bullet>
          <Bullet>Prêt à envoyer (banquier / associé)</Bullet>
        </div>

        <div className="mt-6 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 p-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
            <BadgeCheck className="w-5 h-5" />
            Valeur “premium” visible
          </div>
          <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-200/80">
            Le PDF fait pro, donc ton SaaS paraît pro.
          </p>
        </div>
      </div>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500 mt-0.5" />
      <span>{children}</span>
    </div>
  )
}

function PricingCard({
  title,
  price,
  badge,
  features,
  highlighted,
}: {
  title: string
  price: string
  badge: string | null
  features: string[]
  highlighted: boolean
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-6 bg-white dark:bg-gray-900",
        highlighted
          ? "border-emerald-200 dark:border-emerald-900/50 shadow-lg shadow-emerald-600/10"
          : "border-gray-200 dark:border-gray-700",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-gray-900 dark:text-gray-100 font-semibold text-lg">{title}</h3>
          <div className="mt-2 flex items-end gap-1">
            <span className="text-3xl font-semibold text-gray-900 dark:text-gray-100">{price}</span>
            <span className="text-gray-600 dark:text-gray-400">/ mois</span>
          </div>
        </div>

        {badge ? (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs">
            <CheckCircle2 className="w-4 h-4" />
            {badge}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300 mb-6">
        {features.map((f) => (
          <div key={f} className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-500 mt-0.5" />
            <span>{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-emerald-600 dark:text-emerald-500">
          <HelpCircle className="w-5 h-5" />
        </span>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{q}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{a}</p>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-gray-900 dark:text-gray-100 font-semibold">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-full mb-4">
        <span className="font-semibold">{number}</span>
      </div>
      <h3 className="mb-2 text-gray-900 dark:text-gray-100 font-semibold">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
    </div>
  )
}
