import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Crown, CheckSquare, Square } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { ProjectsAPI, type ProjectDTO } from '../services/projects.api'

type Verdict = 'good' | 'medium' | 'bad'

type ProjectVM = {
  id: string
  name: string
  city: string
  price: number
  cashflow: number
  grossYield: number
  netYield: number
  netNetYield: number
  verdict: Verdict
  isBest?: boolean
}

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

function computeVM(p: ProjectDTO): ProjectVM {
  const price = p.price ?? 0
  const notary = p.notaryFees ?? 0
  const works = p.renovationCosts ?? 0
  const totalInvestment = price + notary + works

  const rent = p.monthlyRent ?? 0
  const vacancyRate = (p.vacancyRate ?? 0) / 100
  const effectiveRent = rent * (1 - vacancyRate)

  const loan = p.loanAmount ?? 0
  const rate = p.interestRate ?? 0
  const years = p.duration ?? 0
  const monthlyLoan = monthlyLoanPayment(loan, rate, years)

  const coOwnership = p.coOwnershipFees ?? 0
  const insurance = p.insurance ?? 0
  const maintenance = p.maintenance ?? 0
  const propertyTaxMonthly = (p.propertyTax ?? 0) / 12

  const monthlyCharges = coOwnership + insurance + maintenance + propertyTaxMonthly
  const cashflow = Math.round(effectiveRent - monthlyLoan - monthlyCharges)

  const grossYield = totalInvestment > 0 ? round1(((rent * 12) / totalInvestment) * 100) : 0
  const netYield =
    totalInvestment > 0
      ? round1((((effectiveRent * 12) - (monthlyCharges * 12)) / totalInvestment) * 100)
      : 0

  // net-net (approx) : cashflow annuel / apport, sinon / investissement total
  const contribution = (p as any).contribution != null ? Number((p as any).contribution) : 0
  const base = contribution > 0 ? contribution : totalInvestment
  const netNetYield = base > 0 ? round1(((cashflow * 12) / base) * 100) : 0

  const verdict: Verdict = cashflow >= 100 ? 'good' : cashflow >= 0 ? 'medium' : 'bad'

  return {
    id: p.id,
    name: p.name ?? 'Projet',
    city: p.city ?? '',
    price,
    cashflow,
    grossYield,
    netYield,
    netNetYield,
    verdict,
  }
}

export function ComparisonPage() {
  const { getAccessTokenSilently } = useAuth0()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectsRaw, setProjectsRaw] = useState<ProjectDTO[]>([])

  // sélection
  const MAX_COMPARE = 4
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [appliedIds, setAppliedIds] = useState<string[]>([]) // ceux réellement comparés

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const list = await ProjectsAPI.list(getAccessTokenSilently)
        setProjectsRaw(list)

      } catch (e: any) {
        console.error(e)
        setError(e?.message ?? 'Erreur lors du chargement des projets')
      } finally {
        setLoading(false)
      }
    })()
  }, [getAccessTokenSilently])

  const allVMs = useMemo(() => projectsRaw.map(computeVM), [projectsRaw])

  const selectedVMs = useMemo(() => {
    const set = new Set(appliedIds)
    return allVMs.filter((p) => set.has(p.id))
  }, [allVMs, appliedIds])

  const projectsToCompare: ProjectVM[] = useMemo(() => {
    const vms = [...selectedVMs]
    if (vms.length === 0) return vms

    // best = net-net puis cashflow
    const best = vms.reduce((best, cur) => {
      if (cur.netNetYield > best.netNetYield) return cur
      if (cur.netNetYield < best.netNetYield) return best
      return cur.cashflow > best.cashflow ? cur : best
    }, vms[0])

    return vms.map((p) => ({ ...p, isBest: p.id === best.id }))
  }, [selectedVMs])

  const bestProject = projectsToCompare.find((p) => p.isBest)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const has = prev.includes(id)
      if (has) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_COMPARE) return prev // limite
      return [...prev, id]
    })
  }

  const applySelection = () => {
    if (selectedIds.length < 2) return
    setAppliedIds(selectedIds)
  }

  const clearSelection = () => {
    setSelectedIds([])
    setAppliedIds([])
  }

  const minPriceIndex = useMemo(() => {
    if (projectsToCompare.length === 0) return -1
    const min = Math.min(...projectsToCompare.map((x) => x.price))
    return projectsToCompare.findIndex((p) => p.price === min)
  }, [projectsToCompare])

  const bestCashflowIndex = useMemo(() => {
    if (projectsToCompare.length === 0) return -1
    const max = Math.max(...projectsToCompare.map((x) => x.cashflow))
    return projectsToCompare.findIndex((p) => p.cashflow === max)
  }, [projectsToCompare])

  const bestGrossIndex = useMemo(() => {
    if (projectsToCompare.length === 0) return -1
    const max = Math.max(...projectsToCompare.map((x) => x.grossYield))
    return projectsToCompare.findIndex((p) => p.grossYield === max)
  }, [projectsToCompare])

  const bestNetIndex = useMemo(() => {
    if (projectsToCompare.length === 0) return -1
    const max = Math.max(...projectsToCompare.map((x) => x.netYield))
    return projectsToCompare.findIndex((p) => p.netYield === max)
  }, [projectsToCompare])

  const bestNetNetIndex = useMemo(() => {
    if (projectsToCompare.length === 0) return -1
    const max = Math.max(...projectsToCompare.map((x) => x.netNetYield))
    return projectsToCompare.findIndex((p) => p.netNetYield === max)
  }, [projectsToCompare])

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>

          <h1 className="mb-2">Comparaison de projets</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sélectionne 2 à {MAX_COMPARE} projets, puis compare-les côte à côte.
          </p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            Chargement...
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/40 p-6 text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : projectsRaw.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            Aucun projet disponible.
          </div>
        ) : (
          <>
            {/* Selection panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h2 className="mb-1">Sélection</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedIds.length} sélectionné(s) • {appliedIds.length} comparé(s)
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={applySelection}
                    disabled={selectedIds.length < 2}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Comparer
                  </button>
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allVMs.map((p) => {
                    const checked = selectedIds.includes(p.id)
                    const disabled = !checked && selectedIds.length >= MAX_COMPARE

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleSelect(p.id)}
                        disabled={disabled}
                        className={`text-left p-4 rounded-lg border transition-colors ${
                          checked
                            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{p.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{p.city}</div>
                          </div>
                          <div className="mt-0.5">
                            {checked ? (
                              <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Cashflow</span>
                          <span className={p.cashflow >= 0 ? 'text-emerald-600 dark:text-emerald-500 font-semibold' : 'text-red-600 dark:text-red-500 font-semibold'}>
                            {p.cashflow >= 0 ? '+' : ''}
                            {p.cashflow}€
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Net-net</span>
                          <span className="font-semibold">{p.netNetYield}%</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedIds.length >= MAX_COMPARE && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Limite atteinte : {MAX_COMPARE} projets max.
                </p>
              )}
              {selectedIds.length < 2 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-3">
                  Sélectionne au moins 2 projets pour comparer.
                </p>
              )}
            </div>

            {projectsToCompare.length < 2 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                Sélectionne 2 projets puis clique sur <strong>Comparer</strong>.
              </div>
            ) : (
              <>
                {/* Best Investment Highlight */}
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 p-6 mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <Crown className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                    <h2 className="text-emerald-900 dark:text-emerald-300">Meilleur investissement</h2>
                  </div>

                  <p className="text-emerald-800 dark:text-emerald-400 mb-4">
                    Basé sur la rentabilité net-net puis le cashflow, le projet{' '}
                    <strong>{bestProject?.name}</strong> est le plus intéressant.
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Rentabilité net-net</span>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-500">
                        {bestProject?.netNetYield}%
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Cashflow mensuel</span>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-500">
                        {bestProject && (bestProject.cashflow >= 0 ? '+' : '')}
                        {bestProject?.cashflow}€
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Critère
                          </th>
                          {projectsToCompare.map((project) => (
                            <th key={project.id} className="px-6 py-4 pt-10 text-left relative">
                              {project.isBest && (
                                <div className="absolute top-2 left-1/2 -translate-x-1/2">
                                  <span className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                                    <Crown className="w-3 h-3" />
                                    Meilleur
                                  </span>
                                </div>
                              )}

                              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {project.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {project.city}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        <ComparisonRow
                          label="Prix d'achat"
                          values={projectsToCompare.map((p) => `${p.price.toLocaleString('fr-FR')}€`)}
                          bestIndex={minPriceIndex}
                        />

                        <ComparisonRow
                          label="Cashflow mensuel"
                          values={projectsToCompare.map((p) => ({
                            value: `${p.cashflow >= 0 ? '+' : ''}${p.cashflow}€`,
                            positive: p.cashflow >= 0,
                          }))}
                          bestIndex={bestCashflowIndex}
                          highlight
                        />

                        <ComparisonRow
                          label="Rentabilité brute"
                          values={projectsToCompare.map((p) => `${p.grossYield}%`)}
                          bestIndex={bestGrossIndex}
                        />

                        <ComparisonRow
                          label="Rentabilité nette"
                          values={projectsToCompare.map((p) => `${p.netYield}%`)}
                          bestIndex={bestNetIndex}
                        />

                        <ComparisonRow
                          label="Rentabilité net-net"
                          values={projectsToCompare.map((p) => `${p.netNetYield}%`)}
                          bestIndex={bestNetNetIndex}
                          highlight
                        />

                        <ComparisonRow
                          label="Verdict"
                          values={projectsToCompare.map((p) => {
                            const verdictLabels = { good: 'Bon deal', medium: 'Moyen', bad: 'Mauvais deal' } as const
                            return verdictLabels[p.verdict]
                          })}
                          verdicts={projectsToCompare.map((p) => p.verdict)}
                        />
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Analysis Summary */}
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <AnalysisCard
                    title="Prix le plus accessible"
                    project={projectsToCompare.reduce((min, p) => (p.price < min.price ? p : min))}
                    metric="Prix"
                    value={`${projectsToCompare.reduce((min, p) => (p.price < min.price ? p : min)).price.toLocaleString('fr-FR')}€`}
                  />
                  <AnalysisCard
                    title="Meilleur cashflow"
                    project={projectsToCompare.reduce((max, p) => (p.cashflow > max.cashflow ? p : max))}
                    metric="Cashflow"
                    value={`${projectsToCompare.reduce((max, p) => (p.cashflow > max.cashflow ? p : max)).cashflow >= 0 ? '+' : ''}${projectsToCompare.reduce((max, p) => (p.cashflow > max.cashflow ? p : max)).cashflow}€/mois`}
                    highlight
                  />
                  <AnalysisCard
                    title="Meilleure rentabilité"
                    project={projectsToCompare.reduce((max, p) => (p.netNetYield > max.netNetYield ? p : max))}
                    metric="Net-net"
                    value={`${projectsToCompare.reduce((max, p) => (p.netNetYield > max.netNetYield ? p : max)).netNetYield}%`}
                    highlight
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ComparisonRow({
  label,
  values,
  bestIndex,
  highlight = false,
  verdicts,
}: {
  label: string
  values: (string | { value: string; positive: boolean })[]
  bestIndex?: number
  highlight?: boolean
  verdicts?: ('good' | 'medium' | 'bad')[]
}) {
  return (
    <tr className={highlight ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}>
      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{label}</td>

      {values.map((value, index) => {
        const isBest = bestIndex === index
        const displayValue = typeof value === 'object' ? value.value : value
        const isPositive = typeof value === 'object' ? value.positive : true

        return (
          <td key={index} className={`px-6 py-4 text-sm ${isBest ? 'font-semibold' : ''}`}>
            <div className="flex items-center gap-2">
              {typeof value === 'object' &&
                (isPositive ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-500" />
                ))}

              <span
                className={
                  verdicts
                    ? verdicts[index] === 'good'
                      ? 'text-emerald-600 dark:text-emerald-500'
                      : verdicts[index] === 'bad'
                      ? 'text-red-600 dark:text-red-500'
                      : 'text-yellow-600 dark:text-yellow-500'
                    : isBest
                    ? 'text-emerald-600 dark:text-emerald-500'
                    : typeof value === 'object' && !isPositive
                    ? 'text-red-600 dark:text-red-500'
                    : 'text-gray-900 dark:text-gray-100'
                }
              >
                {displayValue}
              </span>
            </div>
          </td>
        )
      })}
    </tr>
  )
}

function AnalysisCard({
  title,
  project,
  metric,
  value,
  highlight = false,
}: {
  title: string
  project: ProjectVM
  metric: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl p-6 ${
        highlight
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      }`}
    >
      <h3 className="mb-3">{title}</h3>
      <div className="mb-2">
        <div className="font-semibold">{project.name}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{project.city}</div>
      </div>
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">{metric}</div>
        <div className={`text-xl font-semibold ${highlight ? 'text-emerald-600 dark:text-emerald-500' : ''}`}>
          {value}
        </div>
      </div>
    </div>
  )
}
