import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Plus, TrendingUp, TrendingDown, MapPin, Eye, Edit, BarChart3, Sparkles } from "lucide-react"
import { useAuth0 } from "@auth0/auth0-react"
import { useNavigate } from "react-router-dom"
import { ProjectsAPI, type ProjectDTO } from "../services/projects.api"
import { useMe } from "../App"

type ProjectCardVM = {
  id: string
  name: string
  city: string
  cashflow: number
  cashflowBeforeTax: number
  monthlyTax: number
  verdict: "good" | "medium" | "bad"
  rentability: number
  price: number
  taxMode: "micro" | "real"
}

function monthlyLoanPayment(principal: number, annualRatePercent: number, years: number) {
  const r = annualRatePercent / 100 / 12
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

function computeVM(p: ProjectDTO): ProjectCardVM {
  // Invest
  const price = p.price ?? 0
  const notary = p.notaryFees ?? 0
  const works = p.renovationCosts ?? 0
  const totalInvestment = price + notary + works

  // Revenus
  const rent = p.monthlyRent ?? 0
  const vacancyRate = (p.vacancyRate ?? 0) / 100
  const baseRentNetVacancy = rent * (1 - vacancyRate)

  const recoverableCharges = p.rentChargesIncluded ? 0 : p.recoverableChargesMonthly ?? 0
  const otherIncome = p.otherIncomeMonthly ?? 0
  const monthlyIncome = baseRentNetVacancy + recoverableCharges + otherIncome

  // Prêt
  const loan = p.loanAmount ?? 0
  const rate = p.interestRate ?? 0
  const years = p.duration ?? 0
  const mensualite = monthlyLoanPayment(loan, rate, years)

  // Charges base (⚠️ on garde ta logique : coOwnership/insurance/maintenance en mensuel, TF en annuel)
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
    (p.accountingFeesAnnual ?? 0) / 12 +
    (p.expectedCapexAnnual ?? 0) / 12

  const chargesMensuelles = monthlyChargesBase + monthlyChargesExtra

  // Cashflow avant impôts
  const cashflowBeforeTax = Math.round(monthlyIncome - mensualite - chargesMensuelles)

  // Impôts (approx)
  const tmi = (p.user?.tmi ?? 30) / 100
  const ps = p.user?.socialContribRate ?? 0.172
  const taxRate = tmi + ps

  const annualIncome = monthlyIncome * 12
  const annualDeductibleCharges = chargesMensuelles * 12
  const annualInterestApprox = loan * (rate / 100)
  const annualDepreciation = p.taxMode === "real" ? computeAnnualDepreciation(p) : 0

  let annualTaxable = 0
  if (p.taxMode === "micro") {
    annualTaxable = annualIncome * 0.5 // micro-BIC LMNP classique
  } else {
    annualTaxable = annualIncome - annualDeductibleCharges - annualInterestApprox - annualDepreciation
  }

  const annualTax = Math.max(0, annualTaxable) * taxRate
  const monthlyTax = annualTax / 12

  // Cashflow après impôts
  const cashflow = Math.round(cashflowBeforeTax - monthlyTax)

  // Rentabilité (simple) : loyers nets vacance / investissement
  const annualRentNetVacancy = baseRentNetVacancy * 12
  const rentability = totalInvestment > 0 ? round1((annualRentNetVacancy / totalInvestment) * 100) : 0

  const verdict: "good" | "medium" | "bad" = cashflow >= 100 ? "good" : cashflow >= 0 ? "medium" : "bad"

  return {
    id: p.id,
    name: p.name,
    city: p.city,
    cashflow,
    cashflowBeforeTax: Math.round(cashflowBeforeTax),
    monthlyTax: Math.round(monthlyTax),
    verdict,
    rentability,
    price,
    taxMode: p.taxMode,
  }
}

export function Dashboard({
  onCreateProject,
  onSelectProject,
  onViewResults,
}: {
  onCreateProject: () => void
  onSelectProject: (id: string) => void
  onViewResults: (id: string) => void
}) {
  const { getAccessTokenSilently } = useAuth0()
  const { me } = useMe()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectsRaw, setProjectsRaw] = useState<ProjectDTO[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const list = await ProjectsAPI.list(getAccessTokenSilently)
        setProjectsRaw(list)
      } catch (e: any) {
        console.error(e)
        setError(e?.message ?? "Erreur lors du chargement des projets")
      } finally {
        setLoading(false)
      }
    })()
  }, [getAccessTokenSilently])

  const projects = useMemo(() => projectsRaw.map(computeVM), [projectsRaw])
  const hasProjects = projects.length > 0

  const stats = useMemo(() => {
    const total = projects.length
    const avgCashflow = total ? Math.round(projects.reduce((s, p) => s + p.cashflow, 0) / total) : 0
    const avgRentability = total ? Number((projects.reduce((s, p) => s + p.rentability, 0) / total).toFixed(1)) : 0
    const goodDeals = projects.filter((p) => p.verdict === "good").length
    return { total, avgCashflow, avgRentability, goodDeals }
  }, [projects])

  // ✅ FREE = pas de plan OU plan free (adapte si ton backend renvoie autre chose)
  const isFree = !me?.plan || me.plan === "free"
  const freeLimitReached = isFree && projectsRaw.length >= 1

  const handleCreateProject = () => {
    if (freeLimitReached) {
      navigate("/upgrade")
      return
    }
    onCreateProject()
  }

  const createBtnClass = freeLimitReached
    ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-none"
    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"

  // ✅ CTA : “Tester” plutôt que “Créer”
  const createBtnLabel = freeLimitReached ? "Limite atteinte (Free)" : hasProjects ? "Nouveau projet" : "Tester un projet"

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="mb-2">{hasProjects ? "Mes projets" : "Test rapide"}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {hasProjects ? "Gérez et analysez vos investissements immobiliers" : "Découvre si ton prochain projet est rentable en 2 minutes."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateProject}
            disabled={freeLimitReached}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors ${createBtnClass}`}
          >
            {hasProjects ? <Plus className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            {createBtnLabel}
          </button>
        </div>

        {/* Quick Stats : on les cache quand 0 projet (sinon ça affiche du 0 partout et ça démotive) */}
        {hasProjects && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Projets total"
              value={`${stats.total}`}
              icon={<BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />}
            />
            <StatCard
              label="Cashflow moyen (net)"
              value={`${stats.avgCashflow}€`}
              subtext="/mois"
              icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />}
            />
            <StatCard
              label="Rentabilité moyenne"
              value={`${stats.avgRentability}%`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />}
            />
            <StatCard
              label="Bons deals"
              value={`${stats.goodDeals}/${stats.total}`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />}
            />
          </div>
        )}

        {/* ✅ Message si limite atteinte (seulement si tu as déjà 1 projet) */}
        {freeLimitReached && (
          <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 rounded-xl p-4">
            Ton compte est en <b>FREE</b> : tu es limité à <b>1 projet</b>. Passe en Pro pour en créer autant que tu veux.
            <button
              type="button"
              onClick={() => navigate("/upgrade")}
              className="ml-3 underline text-amber-900 dark:text-amber-100 hover:opacity-80"
            >
              Voir les offres
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">Chargement...</div>
      ) : error ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/40 p-6 text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : hasProjects ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => onSelectProject(project.id)}
              onViewResults={() => onViewResults(project.id)}
            />
          ))}
        </div>
      ) : (
        /* Empty State (rework conversion) */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 sm:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl mb-4">
                <Sparkles className="w-7 h-7 text-emerald-600 dark:text-emerald-500" />
              </div>

              <h2 className="mb-2">Ton prochain investissement est-il rentable ?</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Lance une simulation rapide, vois le cashflow et la rentabilité, puis décide si ça vaut le coup.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <button
                  type="button"
                  onClick={handleCreateProject}
                  disabled={freeLimitReached}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors ${createBtnClass}`}
                >
                  <Sparkles className="w-5 h-5" />
                  {freeLimitReached ? "Voir les offres Pro" : "Tester un projet (2 min)"}
                </button>
              </div>

              <div className="mt-6 grid sm:grid-cols-3 gap-3">
                <StepChip number="1" text="Renseigne prix & loyer" />
                <StepChip number="2" text="Vois cashflow & renta" />
                <StepChip number="3" text="Décide si ça vaut le coup" />
              </div>
            </div>

            <div className="flex-1">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Ce que tu obtiens en 2 minutes</div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Cashflow estimé (avant / après impôts)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Rentabilité + verdict “bon deal / moyen / mauvais”
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Option Pro : optimisation fiscale & détails avancés
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string
  value: string
  subtext?: string
  icon: ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold">{value}</span>
        {subtext && <span className="text-sm text-gray-500 dark:text-gray-400">{subtext}</span>}
      </div>
    </div>
  )
}

function StepChip({ number, text }: { number: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
      <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-semibold">
        {number}
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-200">{text}</div>
    </div>
  )
}

function ProjectCard({
  project,
  onEdit,
  onViewResults,
}: {
  project: ProjectCardVM
  onEdit: () => void
  onViewResults: () => void
}) {
  const verdictConfig = {
    good: {
      label: "Bon deal",
      color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    },
    medium: {
      label: "Moyen",
      color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    },
    bad: {
      label: "Mauvais deal",
      color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    },
  } as const

  const verdict = verdictConfig[project.verdict]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="mb-2">{project.name}</h3>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <MapPin className="w-4 h-4" />
              {project.city}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Mode: {project.taxMode.toUpperCase()}</div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${verdict.color}`}>{verdict.label}</span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Cashflow net</span>
            <div className="flex items-center gap-1">
              {project.cashflow >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-500" />
              )}
              <span
                className={`font-semibold ${
                  project.cashflow >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
                }`}
              >
                {project.cashflow >= 0 ? "+" : ""}
                {project.cashflow}€
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
            <span>Avant impôts</span>
            <span>{project.cashflowBeforeTax}€/mo</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
            <span>Impôts estimés</span>
            <span>{project.monthlyTax}€/mo</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Rentabilité</span>
            <span className="font-semibold">{project.rentability}%</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Prix</span>
            <span className="font-semibold">{project.price.toLocaleString("fr-FR")}€</span>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onViewResults}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Résultats
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
        </div>
      </div>
    </div>
  )
}
