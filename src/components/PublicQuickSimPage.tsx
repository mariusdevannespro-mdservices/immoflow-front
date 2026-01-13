import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Calculator,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Lock,
  Sparkles,
  BadgeCheck,
  ShieldCheck,
  FileDown,
} from "lucide-react"

type Verdict = "good" | "medium" | "bad"

type FormData = {
  price: string
  notaryFees: string
  works: string

  contribution: string
  loanAmount: string
  interestRate: string
  durationYears: string

  monthlyRent: string
  vacancyRate: string

  rentChargesIncluded: boolean
  recoverableChargesMonthly: string
  otherIncomeMonthly: string

  propertyTaxAnnual: string
  coOwnershipFeesMonthly: string
  insuranceMonthly: string
  maintenanceMonthly: string

  // simple fiscal assumptions (micro-bic)
  tmiPercent: string
  socialRatePercent: string
}

function n(v: string) {
  const x = Number(String(v ?? "").replace(",", "."))
  return Number.isFinite(x) ? x : 0
}

function clamp(min: number, x: number, max: number) {
  return Math.max(min, Math.min(max, x))
}

function monthlyLoanPayment(principal: number, annualRatePercent: number, years: number) {
  const r = annualRatePercent / 100 / 12
  const nn = years * 12
  if (!principal || !nn) return 0
  if (r === 0) return principal / nn
  return (principal * r) / (1 - Math.pow(1 + r, -nn))
}

function round1(x: number) {
  return Math.round(x * 10) / 10
}

function compute(form: FormData) {
  const price = n(form.price)
  const notary = n(form.notaryFees)
  const works = n(form.works)
  const totalInvestment = price + notary + works

  const rent = n(form.monthlyRent)
  const vacancyRate = clamp(0, n(form.vacancyRate), 100) / 100
  const rentNetVacancy = rent * (1 - vacancyRate)

  const recoverable = form.rentChargesIncluded ? 0 : n(form.recoverableChargesMonthly)
  const otherIncome = n(form.otherIncomeMonthly)
  const monthlyIncome = rentNetVacancy + recoverable + otherIncome

  const loan = n(form.loanAmount)
  const rate = n(form.interestRate)
  const years = n(form.durationYears)
  const monthlyLoan = monthlyLoanPayment(loan, rate, years)

  // charges
  const coOwnership = n(form.coOwnershipFeesMonthly)
  const insurance = n(form.insuranceMonthly)
  const maintenance = n(form.maintenanceMonthly)
  const propertyTaxMonthly = n(form.propertyTaxAnnual) / 12
  const monthlyCharges = coOwnership + insurance + maintenance + propertyTaxMonthly

  const cashflowBeforeTax = Math.round(monthlyIncome - monthlyLoan - monthlyCharges)

  // fiscal (simple micro-bic 50%)
  const tmi = clamp(0, n(form.tmiPercent), 100) / 100
  const social = clamp(0, n(form.socialRatePercent), 100) / 100
  const taxRate = tmi + social

  const annualIncome = monthlyIncome * 12
  const annualTaxable = annualIncome * 0.5
  const annualTax = Math.max(0, annualTaxable) * taxRate
  const monthlyTax = annualTax / 12

  const cashflowAfterTax = Math.round(cashflowBeforeTax - monthlyTax)

  const grossYield = totalInvestment > 0 ? round1(((rent * 12) / totalInvestment) * 100) : 0
  const netYield = totalInvestment > 0 ? round1((((monthlyIncome - monthlyCharges) * 12) / totalInvestment) * 100) : 0

  const contribution = n(form.contribution)
  const base = contribution > 0 ? contribution : totalInvestment
  const netNetYield = base > 0 ? round1(((cashflowAfterTax * 12) / base) * 100) : 0

  const verdict: Verdict = cashflowAfterTax >= 100 ? "good" : cashflowAfterTax >= 0 ? "medium" : "bad"

  const ready =
    n(form.price) > 0 &&
    n(form.monthlyRent) > 0 &&
    n(form.durationYears) > 0 &&
    n(form.interestRate) >= 0 &&
    (n(form.loanAmount) > 0 || n(form.contribution) > 0)

  return {
    ready,
    verdict,
    totalInvestment: Math.round(totalInvestment),
    monthlyIncome: Math.round(monthlyIncome),
    monthlyLoan: Math.round(monthlyLoan),
    monthlyCharges: Math.round(monthlyCharges),
    monthlyTax: Math.round(monthlyTax),
    cashflowBeforeTax,
    cashflowAfterTax,
    grossYield,
    netYield,
    netNetYield,
    annualTax: Math.round(annualTax),
    annualIncome: Math.round(annualIncome),
  }
}

export function PublicQuickSimPage() {
  const [form, setForm] = useState<FormData>({
    price: "",
    notaryFees: "",
    works: "",

    contribution: "",
    loanAmount: "",
    interestRate: "3.6", // ✅ défaut
    durationYears: "20", // ✅ défaut

    monthlyRent: "",
    vacancyRate: "5", // ✅ défaut

    rentChargesIncluded: true,
    recoverableChargesMonthly: "",
    otherIncomeMonthly: "",

    propertyTaxAnnual: "",
    coOwnershipFeesMonthly: "",
    insuranceMonthly: "",
    maintenanceMonthly: "",

    // ✅ defaults “France classique”
    tmiPercent: "30",
    socialRatePercent: "17.2",
  })

  // ✅ Loan auto + override manuel
  const [loanManual, setLoanManual] = useState(false)

  const autoLoanAmount = useMemo(() => {
    const total = n(form.price) + n(form.notaryFees) + n(form.works)
    const contrib = n(form.contribution)
    return Math.max(0, Math.round(total - contrib))
  }, [form.price, form.notaryFees, form.works, form.contribution])

  useEffect(() => {
    if (loanManual) return
    setForm((p) => ({ ...p, loanAmount: autoLoanAmount ? String(autoLoanAmount) : "" }))
  }, [autoLoanAmount, loanManual])

  const res = useMemo(() => compute(form), [form])

  const verdictUI = {
    good: {
      icon: <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-500" />,
      title: "Bon deal",
      desc: "Cashflow net positif et rentabilité correcte.",
      box: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-700 dark:text-emerald-400",
    },
    medium: {
      icon: <AlertCircle className="w-9 h-9 text-yellow-600 dark:text-yellow-500" />,
      title: "Deal moyen",
      desc: "Ça passe, mais optimisable (loyer, charges, financement).",
      box: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-700 dark:text-yellow-400",
    },
    bad: {
      icon: <XCircle className="w-9 h-9 text-red-600 dark:text-red-500" />,
      title: "Mauvais deal",
      desc: "Cashflow net négatif et/ou rentabilité faible.",
      box: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      text: "text-red-700 dark:text-red-400",
    },
  } as const

  const v = verdictUI[res.verdict]

  const set = <K extends keyof FormData>(k: K, value: FormData[K]) => setForm((p) => ({ ...p, [k]: value }))
  const setStr =
    (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      set(k as any, e.target.value as any)

  // ✅ “Mode rapide / Avancé”
  const [showAdvanced, setShowAdvanced] = useState(false)

  // ✅ CTA qui s’adapte
  const ctaLabel = res.ready ? "Sauvegarder + Export PDF (gratuit)" : "Créer un compte pour sauvegarder"
  const ctaSub = res.ready ? "Tes simulations seront sauvegardées automatiquement." : "Fais une simu rapide, puis sauvegarde."

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs mb-4">
              <Calculator className="w-4 h-4" />
              Simulateur public (sans compte)
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-gray-100">
              Teste ton investissement en <span className="text-emerald-600 dark:text-emerald-500">2 minutes</span>
            </h1>

            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl">
              Cashflow + rentabilité + impôts (micro) en direct. Pour sauvegarder, comparer et exporter → compte gratuit.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Pill icon={<BadgeCheck className="w-4 h-4" />} text="Résultat immédiat" />
              <Pill icon={<ShieldCheck className="w-4 h-4" />} text="Sans CB" />
              <Pill icon={<FileDown className="w-4 h-4" />} text="Export PDF avec compte" />
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/signup"
              className="px-5 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
            >
              Créer un compte <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="px-5 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Voir les offres
            </Link>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* FORM */}
          <div className="lg:col-span-7 space-y-6">
            {/* MODE RAPIDE */}
            <Card title="Mode rapide (à faire en 1er)" icon={<Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />}>
              <div className="grid md:grid-cols-3 gap-4">
                <Input label="Prix d'achat" value={form.price} onChange={setStr("price")} suffix="€" placeholder="Ex: 180000" />
                <Input label="Frais de notaire" value={form.notaryFees} onChange={setStr("notaryFees")} suffix="€" placeholder="Ex: 14400" />
                <Input label="Travaux" value={form.works} onChange={setStr("works")} suffix="€" placeholder="Ex: 5000" />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input label="Apport" value={form.contribution} onChange={setStr("contribution")} suffix="€" placeholder="Ex: 30000" />

                <div>
                  <Input
                    label="Montant emprunté"
                    value={form.loanAmount}
                    onChange={(e) => {
                      setLoanManual(true)
                      set("loanAmount", e.target.value)
                    }}
                    suffix="€"
                    placeholder={autoLoanAmount ? `Auto: ${autoLoanAmount}` : "Ex: 169400"}
                  />

                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Auto : <b className="text-gray-900 dark:text-gray-100">{autoLoanAmount}€</b>
                      {loanManual ? " (manuel)" : ""}
                    </span>

                    {loanManual ? (
                      <button type="button" onClick={() => setLoanManual(false)} className="underline hover:opacity-80">
                        Repasser en auto
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setLoanManual(true)
                          if (!form.loanAmount && autoLoanAmount) set("loanAmount", String(autoLoanAmount))
                        }}
                        className="underline hover:opacity-80"
                      >
                        Forcer manuel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input label="Taux" value={form.interestRate} onChange={setStr("interestRate")} suffix="%" placeholder="Ex: 3.6" />
                <Input label="Durée" value={form.durationYears} onChange={setStr("durationYears")} suffix="ans" placeholder="Ex: 20" />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Input label="Loyer mensuel" value={form.monthlyRent} onChange={setStr("monthlyRent")} suffix="€" placeholder="Ex: 850" />
                <Input label="Vacance locative" value={form.vacancyRate} onChange={setStr("vacancyRate")} suffix="%" placeholder="Ex: 5" />
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="mt-5 w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:opacity-90 transition-all text-sm text-gray-700 dark:text-gray-300"
              >
                {showAdvanced ? "Masquer les options avancées" : "Afficher les options avancées (facultatif)"}
              </button>
            </Card>

            {/* AVANCÉ */}
            {showAdvanced && (
              <>
                <Card title="Revenus (détails)">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Toggle label="Loyer charges comprises ?" checked={form.rentChargesIncluded} onChange={(v2) => set("rentChargesIncluded", v2)} />
                    {!form.rentChargesIncluded ? (
                      <Input
                        label="Charges récupérables"
                        value={form.recoverableChargesMonthly}
                        onChange={setStr("recoverableChargesMonthly")}
                        suffix="€/mois"
                        placeholder="Ex: 50"
                      />
                    ) : (
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 text-sm text-gray-600 dark:text-gray-400">
                        Charges récupérables désactivées (charges comprises).
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <Input label="Autres revenus" value={form.otherIncomeMonthly} onChange={setStr("otherIncomeMonthly")} suffix="€/mois" placeholder="Ex: 0" />
                    <Input label="Taxe foncière" value={form.propertyTaxAnnual} onChange={setStr("propertyTaxAnnual")} suffix="€/an" placeholder="Ex: 800" />
                  </div>
                </Card>

                <Card title="Charges (base)">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Input label="Copro" value={form.coOwnershipFeesMonthly} onChange={setStr("coOwnershipFeesMonthly")} suffix="€/mois" placeholder="Ex: 120" />
                    <Input label="Assurance PNO" value={form.insuranceMonthly} onChange={setStr("insuranceMonthly")} suffix="€/mois" placeholder="Ex: 25" />
                    <Input label="Entretien" value={form.maintenanceMonthly} onChange={setStr("maintenanceMonthly")} suffix="€/mois" placeholder="Ex: 50" />
                  </div>
                </Card>

                <Card title="Impôts (hypothèses micro)">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input label="TMI (estimation)" value={form.tmiPercent} onChange={setStr("tmiPercent")} suffix="%" placeholder="Ex: 30" />
                    <Input label="Prélèvements sociaux" value={form.socialRatePercent} onChange={setStr("socialRatePercent")} suffix="%" placeholder="Ex: 17.2" />
                  </div>
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Astuce : laisse les valeurs par défaut si tu veux juste une estimation rapide.
                  </div>
                </Card>
              </>
            )}

            {/* TEASING PRO */}
            <Card title="Pro+ (aperçu)" icon={<Lock className="w-5 h-5 text-amber-700 dark:text-amber-300" />}>
              <LockBanner />
              <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 text-sm text-gray-600 dark:text-gray-400">
                LMNP réel, amortissements, charges détaillées, PDF complet, comparaison de scénarios… dispo avec un compte.
              </div>
            </Card>
          </div>

          {/* RESULT (sticky) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Résultat</p>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cashflow mensuel (après impôts)</h2>
                </div>
                {res.cashflowAfterTax >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-500" />
                )}
              </div>

              <div className="p-6">
                <div className="flex items-end gap-3">
                  <div className={`text-5xl font-bold ${res.cashflowAfterTax >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}>
                    {res.cashflowAfterTax >= 0 ? "+" : ""}
                    {res.cashflowAfterTax}€
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mb-2">/ mois</div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <MiniStat label="Brut" value={`${res.grossYield}%`} />
                  <MiniStat label="Net" value={`${res.netYield}%`} />
                  <MiniStat label="Net-net" value={`${res.netNetYield}%`} />
                </div>

                <div className={`mt-5 rounded-2xl border p-5 ${v.box}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{v.icon}</div>
                    <div>
                      <div className={`font-semibold ${v.text}`}>{v.title}</div>
                      <div className={`text-sm mt-1 ${v.text}`}>{v.desc}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Line label="Revenus" value={`${res.monthlyIncome}€/mois`} />
                    <Line label="Crédit" value={`${res.monthlyLoan}€/mois`} />
                    <Line label="Charges" value={`${res.monthlyCharges}€/mois`} />
                    <Line label="Impôts (micro, est.)" value={`${res.monthlyTax}€/mois`} />
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                    Impôt annuel estimé : <b className="text-gray-900 dark:text-gray-100">{res.annualTax}€</b> • Revenus annuels :{" "}
                    <b className="text-gray-900 dark:text-gray-100">{res.annualIncome}€</b>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-5">
                  <Link
                    to="/signup"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    {ctaLabel} <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">{ctaSub}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ⚠️ Version “simple” : micro-bic + impôt estimatif. Avec un compte : LMNP réel, amortissements, charges détaillées, PDF complet, comparaison…
              </div>
              <div className="mt-4 flex gap-3">
                <Link to="/pricing" className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Voir les features
                </Link>
                <Link to="/cashflow-immobilier" className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Lire “cashflow”
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ===================== UI ===================== */

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200">
      {icon}
      <span>{text}</span>
    </div>
  )
}

function Card({
  title,
  children,
  icon,
}: {
  title: string
  children: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-5">
        {icon ?? <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function LockBanner() {
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Lock className="w-5 h-5 text-amber-700 dark:text-amber-300 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-900 dark:text-amber-100">Pro+ (verrouillé)</div>
            <div className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              Crée un compte pour débloquer LMNP réel, amortissements et export PDF.
            </div>
          </div>
        </div>
        <Link to="/signup" className="shrink-0 px-4 py-2 rounded-lg bg-amber-600 text-white hover:opacity-90">
          Créer un compte
        </Link>
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  suffix,
  placeholder,
  disabled,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  suffix?: string
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div className={disabled ? "opacity-60" : ""}>
      <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-gray-100 ${
            disabled ? "cursor-not-allowed" : ""
          }`}
        />
        {suffix ? <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">{suffix}</span> : null}
      </div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={disabled ? "opacity-60" : ""}>
      <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">{label}</label>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-lg border transition-all text-left ${
          checked
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
            : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        } ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <span className={`font-medium ${checked ? "text-emerald-700 dark:text-emerald-300" : "text-gray-700 dark:text-gray-300"}`}>
          {checked ? "Oui" : "Non"}
        </span>
      </button>
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

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-gray-900 dark:text-gray-100 font-semibold">{value}</span>
    </div>
  )
}
