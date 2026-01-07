import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Calculator, CheckCircle2, XCircle, AlertCircle, ArrowRight, TrendingUp, TrendingDown, Lock } from "lucide-react"

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
  const n = years * 12
  if (!principal || !n) return 0
  if (r === 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
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

  return {
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
    interestRate: "",
    durationYears: "",

    monthlyRent: "",
    vacancyRate: "",

    rentChargesIncluded: true,
    recoverableChargesMonthly: "",
    otherIncomeMonthly: "",

    propertyTaxAnnual: "",
    coOwnershipFeesMonthly: "",
    insuranceMonthly: "",
    maintenanceMonthly: "",

    tmiPercent: "",
    socialRatePercent: "",
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
      icon: <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-500" />,
      title: "Bon deal",
      desc: "Cashflow net positif et rentabilité correcte.",
      box: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-700 dark:text-emerald-400",
    },
    medium: {
      icon: <AlertCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-500" />,
      title: "Deal moyen",
      desc: "Ça passe, mais optimisable (loyer, charges, financement).",
      box: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-700 dark:text-yellow-400",
    },
    bad: {
      icon: <XCircle className="w-10 h-10 text-red-600 dark:text-red-500" />,
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

  const proLocked = true

  return (
    <div className="bg-white dark:bg-gray-900">
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
              Tu remplis le minimum, on calcule cashflow + rentabilités + impôts (version simple micro). Pour sauvegarder et exporter → crée un compte gratuit.
            </p>
          </div>

          <div className="flex gap-3">
            <Link to="/signup" className="px-5 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2">
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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* FORM */}
          <div className="lg:col-span-7 space-y-6">
            <Card title="Bien + financement">
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
                      Auto calculé : <b className="text-gray-900 dark:text-gray-100">{autoLoanAmount}€</b>
                      {loanManual ? " (manuel activé)" : ""}
                    </span>

                    {loanManual ? (
                      <button type="button" onClick={() => setLoanManual(false)} className="underline hover:opacity-80" title="Revenir au calcul automatique">
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
                        title="Forcer manuellement le montant emprunté"
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
            </Card>

            <Card title="Revenus + charges">
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Loyer mensuel" value={form.monthlyRent} onChange={setStr("monthlyRent")} suffix="€" placeholder="Ex: 850" />
                <Input label="Vacance locative" value={form.vacancyRate} onChange={setStr("vacancyRate")} suffix="%" placeholder="Ex: 5" />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Toggle label="Loyer charges comprises ?" checked={form.rentChargesIncluded} onChange={(v2) => set("rentChargesIncluded", v2)} />
                {!form.rentChargesIncluded ? (
                  <Input label="Charges récupérables" value={form.recoverableChargesMonthly} onChange={setStr("recoverableChargesMonthly")} suffix="€/mois" placeholder="Ex: 50" />
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

              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <Input label="Copro" value={form.coOwnershipFeesMonthly} onChange={setStr("coOwnershipFeesMonthly")} suffix="€/mois" placeholder="Ex: 120" />
                <Input label="Assurance PNO" value={form.insuranceMonthly} onChange={setStr("insuranceMonthly")} suffix="€/mois" placeholder="Ex: 25" />
                <Input label="Entretien" value={form.maintenanceMonthly} onChange={setStr("maintenanceMonthly")} suffix="€/mois" placeholder="Ex: 50" />
              </div>
            </Card>

            {/* 🔒 PRO+ teasing */}
            <Card title="Compte pro (aperçu)">
              <LockBanner />

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <Select
                  label="Mode fiscal"
                  value="real"
                  onChange={() => {}}
                  disabled={proLocked}
                  options={[
                    { value: "micro", label: "Micro-BIC" },
                    { value: "real", label: "Réel (LMNP)" },
                  ]}
                />
                <Toggle label="Meublé ?" checked={true} onChange={() => {}} disabled={proLocked} />
              </div>

              <div className="mt-4 grid md:grid-cols-3 gap-4">
                <Input label="Gestion locative" value="" onChange={() => {}} suffix="%" placeholder="Ex: 7" disabled={proLocked} />
                <Input label="Frais comptable" value="" onChange={() => {}} suffix="€/an" placeholder="Ex: 600" disabled={proLocked} />
                <Input label="Capex annuel" value="" onChange={() => {}} suffix="€/an" placeholder="Ex: 800" disabled={proLocked} />
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 text-sm text-gray-600 dark:text-gray-400">
                Amortissements, charges détaillées, PDF complet, comparaison de scénarios… dispo après création de compte.
              </div>
            </Card>
          </div>

          {/* RESULT */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Résultat</p>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cashflow mensuel (après impôts)</h2>
                </div>
                {res.cashflowAfterTax >= 0 ? <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-500" /> : <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-500" />}
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

                {/* ✅ CTA qui motive (sans sauvegarde maintenant) */}
                <div className="mt-5">
                  <Link
                    to="/signup"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    Sauvegarder cette simu + Export PDF <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Crée un compte gratuit et <b className="text-gray-900 dark:text-gray-100">tes simulations seront sauvegardées automatiquement</b>.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                ⚠️ Version “simple” : micro-bic + impôt estimatif. Dans l’app (avec compte), tu peux faire LMNP réel, amortissements, charges détaillées, PDF complet, comparaison…
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
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
            <div className="text-sm text-amber-800 dark:text-amber-200 mt-1">Crée un compte pour débloquer LMNP réel, amortissements et export PDF.</div>
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

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}) {
  return (
    <div className={disabled ? "opacity-60" : ""}>
      <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">{label}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-gray-100 ${
          disabled ? "cursor-not-allowed" : ""
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
