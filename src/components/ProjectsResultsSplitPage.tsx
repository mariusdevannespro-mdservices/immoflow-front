import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Search, TrendingUp, TrendingDown, MapPin, Loader2 } from "lucide-react"
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

  // Charges (base)
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
    // micro-BIC LMNP classique: abattement 50%
    annualTaxable = annualIncome * 0.5
  } else {
    annualTaxable = annualIncome - annualDeductibleCharges - annualInterestApprox - annualDepreciation
  }

  const annualTax = Math.max(0, annualTaxable) * taxRate
  const monthlyTax = annualTax / 12

  const cashflowAfterTax = Math.round(cashflowBeforeTax - monthlyTax)

  const annualIncomeRounded = Math.round(annualIncome)
  const grossYield = totalInvestment > 0 ? round1(((rent * 12) / totalInvestment) * 100) : 0
  const netYield = totalInvestment > 0 ? round1(((annualIncome - monthlyCharges * 12) / totalInvestment) * 100) : 0

  const contribution = p.contribution ?? 0
  const base = contribution > 0 ? contribution : totalInvestment
  const netNetYield = base > 0 ? round1(((cashflowAfterTax * 12) / base) * 100) : 0

  const verdict: Verdict = cashflowAfterTax >= 100 ? "good" : cashflowAfterTax >= 0 ? "medium" : "bad"

  return {
    cashflowBeforeTax,
    cashflowAfterTax,
    monthlyTax: Math.round(monthlyTax),
    verdict,
    grossYield,
    netYield,
    netNetYield,
    monthlyLoan: Math.round(monthlyLoan),
    monthlyCharges: Math.round(monthlyCharges),
    annualIncome: annualIncomeRounded,
  }
}

export function ProjectsResultsSplitPage() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId?: string }>()
  const { getAccessTokenSilently } = useAuth0()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectDTO[]>([])
  const [search, setSearch] = useState("")
  const [selectedProject, setSelectedProject] = useState<ProjectDTO | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const list = await ProjectsAPI.list(getAccessTokenSilently)
        setProjects(list)
      } catch (e: any) {
        console.error(e)
        setError(e?.message ?? "Erreur lors du chargement des projets")
      } finally {
        setLoading(false)
      }
    })()
  }, [getAccessTokenSilently])

  useEffect(() => {
    if (!projects.length) return
    if (projectId) {
      const found = projects.find((p) => p.id === projectId) ?? null
      setSelectedProject(found)
      return
    }
    const first = projects[0]
    if (first?.id) navigate(`/projects/results/${first.id}`, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, projectId])

  useEffect(() => {
    if (!projectId) return
    const found = projects.find((p) => p.id === projectId) ?? null
    setSelectedProject(found)
  }, [projectId, projects])

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => {
      const name = (p.name ?? "").toLowerCase()
      const city = (p.city ?? "").toLowerCase()
      return name.includes(q) || city.includes(q)
    })
  }, [projects, search])

  const results = useMemo(() => {
    if (!selectedProject) return null
    return computeResults(selectedProject)
  }, [selectedProject])

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 lg:px-8 py-5 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-semibold">Résultats rapides</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Clique un projet à gauche pour afficher instantanément ses indicateurs.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] overflow-hidden">
        <aside className="border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (nom ou ville)..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement...
              </div>
            ) : error ? (
              <div className="p-4 text-red-700 dark:text-red-300">{error}</div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-4 text-gray-600 dark:text-gray-400">Aucun projet.</div>
            ) : (
              <ul className="p-2 space-y-2">
                {filteredProjects.map((p) => {
                  const active = p.id === projectId
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/projects/results/${p.id}`)}
                        className={`w-full text-left rounded-xl border p-4 transition-colors ${
                          active
                            ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{p.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{p.city}</span>
                            </div>
                          </div>

                          <MiniCashflowBadge project={p} />
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>

        <section className="bg-gray-50 dark:bg-gray-950/30 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-4xl">
            {!selectedProject ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                Sélectionne un projet à gauche.
              </div>
            ) : !results ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                Chargement des résultats...
              </div>
            ) : (
              <ResultsPanel project={selectedProject} results={results} />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function MiniCashflowBadge({ project }: { project: ProjectDTO }) {
  const res = computeResults(project)
  const isPos = res.cashflowAfterTax >= 0

  return (
    <div
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        isPos
          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
      }`}
    >
      {isPos ? "+" : ""}
      {res.cashflowAfterTax}€/mo
    </div>
  )
}

function ResultsPanel({
  project,
  results,
}: {
  project: ProjectDTO
  results: ReturnType<typeof computeResults>
}) {
  const navigate = useNavigate()

  const verdictConfig = {
    good: {
      title: "Bon deal !",
      desc: "Cashflow net positif et rentabilité intéressante.",
      box: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-700 dark:text-emerald-400",
    },
    medium: {
      title: "Deal moyen",
      desc: "Ok mais optimisable (charges / financement / fiscalité).",
      box: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-700 dark:text-yellow-400",
    },
    bad: {
      title: "Mauvais deal",
      desc: "Cashflow net négatif et/ou rentabilité faible.",
      box: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      text: "text-red-700 dark:text-red-400",
    },
  } as const

  const verdict = verdictConfig[results.verdict]

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold mb-1 truncate">{project.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{project.city}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Mode: {project.taxMode.toUpperCase()}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/projects/${project.id}/results`)}
            className="shrink-0 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            Voir plus
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cashflow mensuel (après impôts)</div>
            <div className="mt-1 flex items-center gap-2">
              {results.cashflowAfterTax >= 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-500" />
              )}
              <div
                className={`text-3xl font-bold ${
                  results.cashflowAfterTax >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"
                }`}
              >
                {results.cashflowAfterTax >= 0 ? "+" : ""}
                {results.cashflowAfterTax}€
              </div>
              <div className="text-gray-600 dark:text-gray-400">/mois</div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Impôts estimés : {results.monthlyTax}€/mois
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Mensualité prêt</div>
            <div className="text-lg font-semibold">{results.monthlyLoan}€</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Charges</div>
            <div className="text-lg font-semibold">{results.monthlyCharges}€</div>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border-2 p-6 ${verdict.box}`}>
        <h3 className={`text-lg font-semibold mb-1 ${verdict.text}`}>{verdict.title}</h3>
        <p className={verdict.text}>{verdict.desc}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <MetricCard title="Brute" value={`${results.grossYield}%`} desc="Loyers annuels / investissement" />
        <MetricCard title="Nette" value={`${results.netYield}%`} desc="Après charges (hors impôts)" />
        <MetricCard title="Net-net" value={`${results.netNetYield}%`} desc="Après impôts (approx)" highlight />
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  desc,
  highlight = false,
}: {
  title: string
  value: string
  desc: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl p-5 ${
        highlight
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800"
          : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
      <div className={`text-2xl font-bold mt-1 ${highlight ? "text-emerald-600 dark:text-emerald-500" : ""}`}>{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{desc}</div>
    </div>
  )
}
