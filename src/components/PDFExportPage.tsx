import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Download } from "lucide-react"
import { useAuth0 } from "@auth0/auth0-react"
import { useEffect, useMemo, useState } from "react"
import type { ProjectDTO } from "../services/projects.api"
import { useMe } from "../App"

type Verdict = "good" | "medium" | "bad"

function monthlyLoanPayment(principal: number, annualRatePercent: number, years: number) {
  const r = (annualRatePercent / 100) / 12
  const n = years * 12
  if (!principal || !n) return 0
  if (r === 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function computeAnnualDepreciation(p: ProjectDTO) {
  const assets = p.depreciationAssets ?? []
  return assets.reduce((sum, a) => (a.years > 0 ? sum + a.amount / a.years : sum), 0)
}

function computeResults(p: ProjectDTO) {
  const notary = p.notaryFees ?? 0
  const works = p.renovationCosts ?? 0
  const totalInvestment = (p.price ?? 0) + notary + works

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
    (p.accountingFeesAnnual ?? 0) / 12 +
    (p.expectedCapexAnnual ?? 0) / 12

  const monthlyCharges = monthlyChargesBase + monthlyChargesExtra

  // Cashflow avant impôts
  const monthlyCashflowBeforeTax = monthlyIncome - monthlyCharges - monthlyLoan

  // Fiscalité (approx)
  const tmi = (p.user?.tmi ?? 30) / 100
  const ps = p.user?.socialContribRate ?? 0.172
  const taxRate = tmi + ps

  const annualIncome = monthlyIncome * 12
  const annualDeductibleCharges = monthlyCharges * 12
  const annualInterestApprox = loan * (rate / 100)
  const annualDepreciation = p.taxMode === "real" ? computeAnnualDepreciation(p) : 0

  let annualTaxableIncome = 0
  if (p.taxMode === "micro") {
    annualTaxableIncome = annualIncome * 0.5
  } else {
    annualTaxableIncome = annualIncome - annualDeductibleCharges - annualInterestApprox - annualDepreciation
  }

  const annualTax = Math.max(0, annualTaxableIncome) * taxRate
  const monthlyTax = annualTax / 12
  const monthlyCashflowAfterTax = monthlyCashflowBeforeTax - monthlyTax

  const verdict: Verdict =
    monthlyCashflowAfterTax >= 100 ? "good" : monthlyCashflowAfterTax >= 0 ? "medium" : "bad"

  return {
    totalInvestment: round2(totalInvestment),

    monthlyIncome: round2(monthlyIncome),
    monthlyCharges: round2(monthlyCharges),
    monthlyLoan: round2(monthlyLoan),

    monthlyCashflowBeforeTax: round2(monthlyCashflowBeforeTax),
    monthlyTax: round2(monthlyTax),
    monthlyCashflowAfterTax: round2(monthlyCashflowAfterTax),

    annualIncome: round2(annualIncome),
    annualTaxableIncome: round2(annualTaxableIncome),
    annualTax: round2(annualTax),
    annualDepreciation: round2(annualDepreciation),

    managementMonthly: round2(managementMonthly),

    verdict,
  }
}

export function PDFExportPage() {
  const { projectId } = useParams<{ projectId?: string }>()
  const { getAccessTokenSilently } = useAuth0()
  const { me, meLoading } = useMe()

  const isProPlus = me?.plan === "pro_plus"

  const API_URL = useMemo(() => import.meta.env.VITE_API_URL ?? "http://localhost:3001", [])
  const [project, setProject] = useState<ProjectDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // options
  const [showChargesAndTax, setShowChargesAndTax] = useState(true)
  const [confidential, setConfidential] = useState(false)

  // ✅ force OFF si pas Pro+
  useEffect(() => {
    if (meLoading) return
    if (!isProPlus) setShowChargesAndTax(false)
  }, [isProPlus, meLoading])

  useEffect(() => {
    if (!projectId) return
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            scope: "openid profile email",
          },
        })

        const res = await fetch(`${API_URL}/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          const txt = await res.text().catch(() => "")
          throw new Error(txt || `API error ${res.status}`)
        }

        const data = (await res.json()) as ProjectDTO
        if (!cancelled) setProject(data)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Erreur lors du chargement du projet")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [API_URL, getAccessTokenSilently, projectId])

  const eur = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n)

  const title = project ? `${project.name} — ${project.city}` : projectId ? `Projet ${projectId}` : "Export PDF"

  const results = useMemo(() => (project ? computeResults(project) : null), [project])

  const verdictLabel =
    results?.verdict === "good" ? "Bon deal" : results?.verdict === "medium" ? "Moyen" : "Mauvais deal"

  const verdictClass =
    results?.verdict === "good"
      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
      : results?.verdict === "medium"
      ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"

  const mask = (value: string, sensitive?: boolean) => (confidential && sensitive ? "—" : value)

  const downloadPdf = async () => {
    if (!projectId) return
    try {
      setDownloading(true)
      setError(null)

      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: "openid profile email",
        },
      })

      const params = new URLSearchParams()

      // ✅ seuls les Pro+ peuvent passer details=1
      if (showChargesAndTax && isProPlus) params.set("details", "1")
      if (confidential) params.set("confidential", "1")

      const res = await fetch(`${API_URL}/api/projects/${projectId}/pdf?${params.toString()}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || `API error ${res.status}`)
      }

      const blob = await res.blob()
      const safeName = (project?.name || `project-${projectId}`)
        .replaceAll(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replaceAll(" ", "_")

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `immoflow-${safeName}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e?.message ?? "Erreur lors du téléchargement du PDF")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
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
            <h1 className="mb-2">Export PDF</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Télécharge et partage ton rapport d&apos;investissement
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{title}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadPdf}
              disabled={!projectId || downloading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-lg
                ${downloading ? "bg-emerald-700" : "bg-emerald-600 hover:bg-emerald-700"}
                text-white shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed`}
              type="button"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Téléchargement…" : "Télécharger PDF"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
            <div className="aspect-[210/297] bg-gray-50 dark:bg-gray-900 rounded-lg p-8 overflow-auto">
              <div className="max-w-xl mx-auto space-y-6">
                <div className="text-center pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-semibold mb-2">Rapport d&apos;Analyse d&apos;Investissement</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {project
                      ? `${project.propertyType} • ${project.city} • ${project.taxMode.toUpperCase()}`
                      : "Chargement…"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Généré le {new Date().toLocaleDateString("fr-FR")}
                  </div>
                </div>

                {loading && <div className="text-sm text-gray-600 dark:text-gray-400">Chargement du projet…</div>}

                {!loading && project && results && (
                  <>
                    {/* Résumé */}
                    <div className={`rounded-lg p-4 border ${verdictClass}`}>
                      <div className="text-sm opacity-80 mb-1">Verdict</div>
                      <div className="text-xl font-semibold">{verdictLabel}</div>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <KpiBox
                          label={showChargesAndTax ? "Cashflow net (après impôts)" : "Cashflow (avant impôts)"}
                          value={mask(
                            `${Math.round(
                              showChargesAndTax ? results.monthlyCashflowAfterTax : results.monthlyCashflowBeforeTax
                            )}€/mo`,
                            true
                          )}
                        />

                        {showChargesAndTax && (
                          <KpiBox label="Impôts estimés" value={mask(`${Math.round(results.monthlyTax)}€/mo`, true)} />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenus (mensuel)</div>
                        <div className="text-xl font-semibold text-emerald-600 dark:text-emerald-500">
                          {mask(eur(results.monthlyIncome), true)}
                        </div>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mensualité prêt</div>
                        <div className="text-xl font-semibold">{mask(eur(results.monthlyLoan), true)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {`${project.interestRate}% • ${project.duration} ans`}
                        </div>
                      </div>
                    </div>

                    {/* Bien */}
                    <BlockTitle>Caractéristiques du bien</BlockTitle>
                    <Block>
                      <DetailLine label="Prix d'achat" value={mask(eur(project.price), true)} />
                      <DetailLine label="Frais de notaire" value={mask(eur(project.notaryFees ?? 0), true)} />
                      <DetailLine label="Travaux" value={mask(eur(project.renovationCosts ?? 0), true)} />
                      <DetailLine
                        label="Part terrain (non amortissable)"
                        value={`${Math.round((project.landShareRate ?? 0.15) * 100)}%`}
                      />
                      <DetailLine
                        label="Total investissement"
                        value={mask(eur(project.price + (project.notaryFees ?? 0) + (project.renovationCosts ?? 0)), true)}
                        highlight
                      />
                    </Block>

                    {/* Financement */}
                    <BlockTitle>Financement</BlockTitle>
                    <Block>
                      <DetailLine label="Apport" value={mask(eur(project.contribution), true)} />
                      <DetailLine label="Emprunt" value={mask(eur(project.loanAmount), true)} />
                      <DetailLine label="Taux" value={`${project.interestRate}%`} />
                      <DetailLine label="Durée" value={`${project.duration} ans`} />
                    </Block>

                    {/* Revenus */}
                    <BlockTitle>Revenus locatifs</BlockTitle>
                    <Block>
                      <DetailLine label="Loyer mensuel" value={mask(eur(project.monthlyRent), true)} />
                      <DetailLine label="Vacance locative" value={`${project.vacancyRate ?? 0}%`} />
                      <DetailLine label="Loyer charges comprises" value={project.rentChargesIncluded ? "Oui" : "Non"} />
                      <DetailLine label="Charges récupérables" value={mask(eur(project.recoverableChargesMonthly ?? 0), true)} />
                      <DetailLine label="Autres revenus" value={mask(eur(project.otherIncomeMonthly ?? 0), true)} />
                      <DetailLine label="Revenus mensuels (corrigés)" value={mask(eur(results.monthlyIncome), true)} highlight />
                    </Block>

                    {/* Charges + Fiscalité */}
                    {showChargesAndTax && (
                      <>
                        <BlockTitle>Charges</BlockTitle>
                        <Block>
                          <DetailLine label="Taxe foncière" value={mask(eur(project.propertyTax ?? 0), true)} />
                          <DetailLine label="Copropriété" value={mask(eur(project.coOwnershipFees ?? 0), true)} />
                          <DetailLine label="Assurance PNO" value={mask(eur(project.insurance ?? 0), true)} />
                          <DetailLine label="Entretien / provisions" value={mask(eur(project.maintenance ?? 0), true)} />

                          <DetailLine
                            label="Gestion locative (fixe)"
                            value={
                              project.propertyManagementFeeMonthly != null
                                ? mask(eur(project.propertyManagementFeeMonthly), true)
                                : "—"
                            }
                          />
                          <DetailLine
                            label="Gestion locative (taux)"
                            value={project.propertyManagementFeeRate != null ? `${project.propertyManagementFeeRate}%` : "—"}
                          />
                          <DetailLine label="Gestion locative (calculée)" value={mask(eur(results.managementMonthly), true)} />

                          <DetailLine
                            label="Assurance loyers impayés (GLI)"
                            value={mask(eur(project.rentGuaranteeInsuranceMonthly ?? 0), true)}
                          />
                          <DetailLine label="Frais comptable (annuel)" value={mask(eur(project.accountingFeesAnnual ?? 0), true)} />
                          <DetailLine label="Capex lissé (annuel)" value={mask(eur(project.expectedCapexAnnual ?? 0), true)} />

                          <DetailLine label="Charges mensuelles totales" value={mask(eur(results.monthlyCharges), true)} highlight />
                        </Block>

                        <BlockTitle>Fiscalité (estimations)</BlockTitle>
                        <Block>
                          <DetailLine label="Mode fiscal" value={project.taxMode.toUpperCase()} />
                          <DetailLine label="Meublé" value={project.furnished ? "Oui" : "Non"} />
                          <DetailLine label="TMI" value={`${project.user?.tmi ?? 30}%`} />
                          <DetailLine
                            label="Prélèvements sociaux"
                            value={`${Math.round((project.user?.socialContribRate ?? 0.172) * 1000) / 10}%`}
                          />
                          <DetailLine label="Revenu imposable (annuel)" value={mask(eur(results.annualTaxableIncome), true)} />
                          <DetailLine label="Impôt (annuel)" value={mask(eur(results.annualTax), true)} />
                          <DetailLine label="Impôt (mensuel)" value={mask(eur(results.monthlyTax), true)} highlight />
                        </Block>

                        {project.taxMode === "real" && (
                          <>
                            <BlockTitle>Amortissements (LMNP réel)</BlockTitle>
                            <Block>
                              <DetailLine
                                label="Amortissements annuels (total)"
                                value={mask(eur(results.annualDepreciation), true)}
                                highlight
                              />

                              {(project.depreciationAssets?.length ?? 0) === 0 ? (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  Aucune ligne d’amortissement enregistrée.
                                </div>
                              ) : (
                                <div className="mt-3 space-y-2">
                                  {(project.depreciationAssets ?? []).map((a) => (
                                    <div
                                      key={a.id}
                                      className="flex items-start justify-between text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg p-3"
                                    >
                                      <div className="min-w-0">
                                        <div className="font-medium truncate">{a.label}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {a.category} • {a.years} ans
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0 pl-3">
                                        <div className="font-semibold">{mask(eur(a.amount), true)}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {mask(`${eur(a.amount / a.years)}/an`, true)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </Block>
                          </>
                        )}
                      </>
                    )}

                    {/* Totaux */}
                    <BlockTitle>Résumé financier</BlockTitle>
                    <Block>
                      <DetailLine label="Cashflow avant impôts" value={mask(eur(results.monthlyCashflowBeforeTax), true)} />
                      <DetailLine label="Cashflow après impôts" value={mask(eur(results.monthlyCashflowAfterTax), true)} highlight />
                    </Block>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-500">
                      <p>Ce rapport a été généré par ImmoFlow</p>
                      <p className="mt-1">Les calculs sont fournis à titre indicatif.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="mb-4">Options d&apos;export</h3>

            <div className="space-y-4">
              <label className={`flex items-start gap-3 ${!isProPlus ? "opacity-60" : ""}`}>
                <input
                  type="checkbox"
                  checked={showChargesAndTax}
                  disabled={!isProPlus}
                  onChange={(e) => {
                    if (!isProPlus) return
                    setShowChargesAndTax(e.target.checked)
                  }}
                  className="mt-1 w-4 h-4 text-emerald-600 rounded disabled:cursor-not-allowed"
                />
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">
                    Détails complets
                    {!isProPlus && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
                        Pro+
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Afficher Charges + Fiscalité
                    {!isProPlus && (
                      <>
                        {" "}
                        —{" "}
                        <Link to="/upgrade" className="text-emerald-600 dark:text-emerald-500 underline">
                          Débloquer
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={confidential}
                  onChange={(e) => setConfidential(e.target.checked)}
                  className="mt-1 w-4 h-4 text-emerald-600 rounded"
                />
                <div>
                  <div className="font-medium text-sm">Mode confidentiel</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Masquer seulement les montants sensibles</div>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="mb-2 text-blue-900 dark:text-blue-300">💡 Conseil</h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Ce rapport pro peut être partagé avec un banquier ou un partenaire.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===================== UI helpers ===================== */

function BlockTitle({ children }: { children: React.ReactNode }) {
  return <div className="font-semibold mb-2">{children}</div>
}

function Block({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

function KpiBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/60 dark:bg-white/5 rounded-lg p-3 border border-black/5 dark:border-white/10">
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  )
}

function DetailLine({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex justify-between text-sm ${
        highlight
          ? "font-semibold pt-2 border-t border-gray-200 dark:border-gray-700"
          : "text-gray-600 dark:text-gray-400"
      }`}
    >
      <span>{label}</span>
      <span className={highlight ? "text-emerald-600 dark:text-emerald-500" : ""}>{value}</span>
    </div>
  )
}
