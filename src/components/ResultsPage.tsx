import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, TrendingUp, TrendingDown, Download, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { useAuth0 } from "@auth0/auth0-react"
import { ProjectsAPI, type ProjectDTO } from "../services/projects.api"

type Verdict = "good" | "medium" | "bad"

function monthlyLoanPayment(principal: number, annualRatePercent: number, years: number) {
  const r = (annualRatePercent / 100) / 12
  const n = years * 12
  if (!principal || !n) return 0
  if (r === 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

function computeAnnualDepreciation(p: ProjectDTO) {
  const assets = p.depreciationAssets ?? []
  return assets.reduce((sum, a) => (a.years > 0 ? sum + a.amount / a.years : sum), 0)
}

function computeResults(p: ProjectDTO) {
  const price = p.price ?? 0
  const notary = p.notaryFees ?? 0
  const works = p.renovationCosts ?? 0
  const totalInvestment = price + notary + works

  // Revenus
  const rent = p.monthlyRent ?? 0
  const vacancyRate = (p.vacancyRate ?? 0) / 100
  const baseRentNetVacancy = rent * (1 - vacancyRate)
  const recoverableCharges = p.rentChargesIncluded ? 0 : (p.recoverableChargesMonthly ?? 0)
  const otherIncome = p.otherIncomeMonthly ?? 0
  const monthlyIncome = baseRentNetVacancy + recoverableCharges + otherIncome

  // Prêt
  const loan = p.loanAmount ?? 0
  const rate = p.interestRate ?? 0
  const years = p.duration ?? 0
  const monthlyLoan = monthlyLoanPayment(loan, rate, years)

  // Charges base
  const coOwnership = p.coOwnershipFees ?? 0
  const insurance = p.insurance ?? 0
  const maintenance = p.maintenance ?? 0
  const propertyTaxMonthly = (p.propertyTax ?? 0) / 12
  const monthlyChargesBase = coOwnership + insurance + maintenance + propertyTaxMonthly

  // Charges détaillées
  const managementMonthly =
    p.propertyManagementFeeMonthly != null
      ? p.propertyManagementFeeMonthly
      : p.propertyManagementFeeRate != null
      ? (monthlyIncome * p.propertyManagementFeeRate) / 100
      : 0

  const monthlyChargesExtra =
    managementMonthly +
    (p.rentGuaranteeInsuranceMonthly ?? 0) +
    ((p.accountingFeesAnnual ?? 0) / 12) +
    ((p.expectedCapexAnnual ?? 0) / 12)

  const monthlyCharges = monthlyChargesBase + monthlyChargesExtra

  // Cashflow avant impôts
  const cashflowBeforeTax = Math.round(monthlyIncome - monthlyLoan - monthlyCharges)

  // Impôts (approx)
  const tmi = (p.user?.tmi ?? 30) / 100
  const ps = p.user?.socialContribRate ?? 0.172
  const taxRate = tmi + ps

  const annualIncome = monthlyIncome * 12
  const annualDeductibleCharges = monthlyCharges * 12
  const annualInterestApprox = loan * (rate / 100)
  const annualDepreciation = p.taxMode === "real" ? computeAnnualDepreciation(p) : 0

  let annualTaxable = 0
  if (p.taxMode === "micro") {
    annualTaxable = annualIncome * 0.5
  } else {
    annualTaxable = annualIncome - annualDeductibleCharges - annualInterestApprox - annualDepreciation
  }

  const annualTax = Math.max(0, annualTaxable) * taxRate
  const monthlyTax = annualTax / 12

  const cashflowAfterTax = Math.round(cashflowBeforeTax - monthlyTax)

  const annualIncomeRounded = Math.round(annualIncome)
  const annualExpenses = Math.round((monthlyLoan + monthlyCharges + monthlyTax) * 12)

  const grossYield = totalInvestment > 0 ? round1(((rent * 12) / totalInvestment) * 100) : 0
  const netYield = totalInvestment > 0 ? round1(((annualIncome - monthlyCharges * 12) / totalInvestment) * 100) : 0

  const contribution = p.contribution ?? 0
  const base = contribution > 0 ? contribution : totalInvestment
  const netNetYield = base > 0 ? round1(((cashflowAfterTax * 12) / base) * 100) : 0

  const verdict: Verdict = cashflowAfterTax >= 100 ? "good" : cashflowAfterTax >= 0 ? "medium" : "bad"

  return {
    verdict,
    cashflowBeforeTax,
    cashflowAfterTax,
    monthlyTax: Math.round(monthlyTax),

    grossYield,
    netYield,
    netNetYield,

    monthlyLoan: Math.round(monthlyLoan),
    monthlyCharges: Math.round(monthlyCharges),

    annualIncome: annualIncomeRounded,
    annualExpenses,
    annualDepreciation: Math.round(annualDepreciation),
    annualTaxable: Math.round(annualTaxable),
    annualTax: Math.round(annualTax),
  }
}

export function ResultsPage() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId?: string }>()
  const { getAccessTokenSilently } = useAuth0()

  const [loading, setLoading] = useState(false)
  const [project, setProject] = useState<ProjectDTO | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!projectId) return

    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const p = await ProjectsAPI.get(getAccessTokenSilently, projectId)
        setProject(p)
      } catch (e: any) {
        console.error(e)
        setError(e?.message ?? "Erreur lors du chargement du projet")
      } finally {
        setLoading(false)
      }
    })()
  }, [projectId, getAccessTokenSilently])

  const results = useMemo(() => (project ? computeResults(project) : null), [project])

  const verdictConfig = {
    good: {
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-500" />,
      title: "Bon deal !",
      description: "Cashflow net positif et rentabilité intéressante.",
      color: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
      textColor: "text-emerald-700 dark:text-emerald-400",
    },
    medium: {
      icon: <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-500" />,
      title: "Deal moyen",
      description: "Ok mais optimisable (charges / financement / fiscalité).",
      color: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      textColor: "text-yellow-700 dark:text-yellow-400",
    },
    bad: {
      icon: <XCircle className="w-12 h-12 text-red-600 dark:text-red-500" />,
      title: "Mauvais deal",
      description: "Cashflow net négatif et/ou rentabilité faible.",
      color: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      textColor: "text-red-700 dark:text-red-400",
    },
  } as const

  if (!projectId) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          Projet introuvable (id manquant).
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          Chargement...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/40 p-6 text-red-700 dark:text-red-300">
          {error}
        </div>
      </div>
    )
  }

  if (!project || !results) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          Aucun projet trouvé.
        </div>
      </div>
    )
  }

  const verdict = verdictConfig[results.verdict]

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="mb-2">{project.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">{project.city}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Projet : {projectId} • Mode: {project.taxMode.toUpperCase()}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(`/projects/${projectId}/pdf`)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter PDF
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-2">Cashflow mensuel (après impôts)</p>
        <div className="flex items-center justify-center gap-3 mb-4">
          {results.cashflowAfterTax >= 0 ? (
            <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
          ) : (
            <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-500" />
          )}
          <span
            className={`text-5xl font-bold ${
              results.cashflowAfterTax >= 0
                ? "text-emerald-600 dark:text-emerald-500"
                : "text-red-600 dark:text-red-500"
            }`}
          >
            {results.cashflowAfterTax >= 0 ? "+" : ""}
            {results.cashflowAfterTax}€
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Impôts estimés : {results.monthlyTax}€/mois • Cashflow avant impôts : {results.cashflowBeforeTax}€/mois
        </p>
      </div>

      <div className={`rounded-2xl border-2 p-8 mb-6 ${verdict.color}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-shrink-0">{verdict.icon}</div>
          <div className="flex-1">
            <h2 className={`mb-2 ${verdict.textColor}`}>{verdict.title}</h2>
            <p className={verdict.textColor}>{verdict.description}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <MetricCard title="Rentabilité brute" value={`${results.grossYield}%`} description="Loyers annuels / investissement total" />
        <MetricCard title="Rentabilité nette" value={`${results.netYield}%`} description="Après charges (hors impôts)" />
        <MetricCard title="Rentabilité net-net" value={`${results.netNetYield}%`} description="Après impôts (approx)" highlight />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <DetailSection title="Mensuel">
          <DetailItem label="Revenus (corrigés vacance)" value={`${Math.round((project.monthlyRent ?? 0) * (1 - ((project.vacancyRate ?? 0) / 100)))}€`} />
          <DetailItem label="Charges" value={`${results.monthlyCharges}€`} />
          <DetailItem label="Crédit" value={`${results.monthlyLoan}€`} />
          <DetailItem label="Impôts estimés" value={`${results.monthlyTax}€`} />
          <DetailItem label="Cashflow net" value={`${results.cashflowAfterTax}€`} highlight />
        </DetailSection>

        <DetailSection title="Annuel (estimations)">
          <DetailItem label="Revenus" value={`${results.annualIncome}€`} />
          <DetailItem label="Imposable" value={`${results.annualTaxable}€`} />
          <DetailItem label="Impôt" value={`${results.annualTax}€`} />
          {project.taxMode === "real" && <DetailItem label="Amortissements" value={`${results.annualDepreciation}€`} />}
          <DetailItem label="Dépenses totales" value={`${results.annualExpenses}€`} highlight />
        </DetailSection>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  description,
  highlight = false,
}: {
  title: string
  value: string
  description: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl p-6 ${
        highlight
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800"
          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      }`}
    >
      <h3 className="mb-2">{title}</h3>
      <div className={`text-3xl font-bold mb-2 ${highlight ? "text-emerald-600 dark:text-emerald-500" : ""}`}>{value}</div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function DetailItem({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`flex items-center justify-between ${highlight ? "pt-3 border-t border-gray-200 dark:border-gray-700 font-semibold" : ""}`}>
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span>{value}</span>
    </div>
  )
}
