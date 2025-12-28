import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Save, Home, DollarSign, FileText, Calculator, Plus, Trash2, Lock } from "lucide-react"
import { useAuth0 } from "@auth0/auth0-react"
import { ProjectsAPI } from "../services/projects.api"
import { useMe } from "../App"

type Mode = "create" | "edit"

type ProjectFormProps = {
  mode?: Mode
}

type DepAssetForm = {
  category: "building" | "works" | "furniture" | "fees"
  label: string
  amount: string
  years: string
}

type FormData = {
  name: string
  city: string
  propertyType: string

  price: string
  notaryFees: string
  renovationCosts: string
  landShareRate: string

  contribution: string
  loanAmount: string
  interestRate: string
  duration: string

  monthlyRent: string
  vacancyRate: string
  rentChargesIncluded: boolean
  recoverableChargesMonthly: string
  otherIncomeMonthly: string

  propertyTax: string
  coOwnershipFees: string
  insurance: string
  maintenance: string

  // PRO+ (charges détaillées)
  propertyManagementFeeRate: string
  propertyManagementFeeMonthly: string
  rentGuaranteeInsuranceMonthly: string
  accountingFeesAnnual: string
  expectedCapexAnnual: string

  // PRO+ (fiscalité avancée via "real" + amortissements)
  taxMode: "micro" | "real"
  furnished: boolean
  depreciationAssets: DepAssetForm[]
}

const makeDefaultAssets = (): DepAssetForm[] => [
  { category: "building", label: "Bâti (hors terrain)", amount: "", years: "30" },
  { category: "works", label: "Travaux", amount: "", years: "10" },
  { category: "furniture", label: "Mobilier", amount: "", years: "7" },
]

function trimOrEmpty(v: string) {
  return (v ?? "").trim()
}

function isBlank(v: string) {
  return trimOrEmpty(v) === ""
}

function ProPlusLock({
  title,
  description,
  onUpgrade,
}: {
  title: string
  description?: string
  onUpgrade: () => void
}) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Lock className="w-5 h-5 text-amber-700 dark:text-amber-300" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-amber-900 dark:text-amber-100">{title}</div>
          <div className="text-sm text-amber-800 dark:text-amber-200 mt-1">
            {description ?? "Cette section est disponible uniquement avec le plan Pro+."}
          </div>
          <button
            type="button"
            onClick={onUpgrade}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:opacity-90"
          >
            Voir Pro+
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProjectForm({ mode: modeProp }: ProjectFormProps) {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const { getAccessTokenSilently } = useAuth0()
  const { me, meLoading } = useMe()

  const isProPlus = me?.plan === "pro_plus"
  const mode: Mode = id ? "edit" : modeProp ?? "create"

  const emptyData: FormData = useMemo(
    () => ({
      name: "",
      city: "",
      propertyType: "apartment",

      price: "",
      notaryFees: "",
      renovationCosts: "",
      landShareRate: "15",

      contribution: "",
      loanAmount: "",
      interestRate: "",
      duration: "",

      monthlyRent: "",
      vacancyRate: "",
      rentChargesIncluded: false,
      recoverableChargesMonthly: "",
      otherIncomeMonthly: "",

      propertyTax: "",
      coOwnershipFees: "",
      insurance: "",
      maintenance: "",

      propertyManagementFeeRate: "",
      propertyManagementFeeMonthly: "",
      rentGuaranteeInsuranceMonthly: "",
      accountingFeesAnnual: "",
      expectedCapexAnnual: "",

      taxMode: "micro",
      furnished: true,

      depreciationAssets: makeDefaultAssets(),
    }),
    []
  )

  const [formData, setFormData] = useState<FormData>(emptyData)
  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [deleting, setDeleting] = useState<boolean>(false)

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAssetChange = (index: number, field: keyof DepAssetForm, value: string) => {
    setFormData((prev) => {
      const next = [...prev.depreciationAssets]
      next[index] = { ...next[index], [field]: value } as DepAssetForm
      return { ...prev, depreciationAssets: next }
    })
  }

  const addAsset = () => {
    setFormData((prev) => ({
      ...prev,
      depreciationAssets: [...prev.depreciationAssets, { category: "building", label: "", amount: "", years: "10" }],
    }))
  }

  const removeAsset = (index: number) => {
    setFormData((prev) => {
      const next = [...prev.depreciationAssets]
      next.splice(index, 1)
      return { ...prev, depreciationAssets: next }
    })
  }

  const handleDeleteProject = async () => {
    if (!id) return
    const ok = window.confirm("Supprimer ce projet ? Cette action est irréversible.")
    if (!ok) return

    try {
      setDeleting(true)
      await ProjectsAPI.remove(getAccessTokenSilently, id)
      navigate("/dashboard", { replace: true })
    } catch (e) {
      console.error(e)
      alert("Erreur lors de la suppression du projet")
    } finally {
      setDeleting(false)
    }
  }

  // ✅ Si pas Pro+, on force la fiscalité en "micro" (et on évite de garder du contenu Pro+ en state)
  useEffect(() => {
    if (meLoading) return
    if (isProPlus) return

    setFormData((prev) => {
      if (prev.taxMode === "micro") return prev

      return {
        ...prev,
        taxMode: "micro",
        depreciationAssets: makeDefaultAssets(),

        // nettoie les champs PRO+ (optionnel mais propre)
        propertyManagementFeeRate: "",
        propertyManagementFeeMonthly: "",
        rentGuaranteeInsuranceMonthly: "",
        accountingFeesAnnual: "",
        expectedCapexAnnual: "",
      }
    })
  }, [isProPlus, meLoading])

  // Prefill edit
  useEffect(() => {
    if (mode !== "edit" || !id) return

    ;(async () => {
      try {
        setLoading(true)
        const p = await ProjectsAPI.get(getAccessTokenSilently, id)

        // ⚠️ si user n'est pas Pro+ mais le projet est "real", on force micro côté UI
        const safeTaxMode: "micro" | "real" = isProPlus ? ((p.taxMode ?? "micro") as any) : "micro"

        setFormData({
          name: p.name ?? "",
          city: p.city ?? "",
          propertyType: p.propertyType ?? "apartment",

          price: String(p.price ?? ""),
          notaryFees: p.notaryFees == null ? "" : String(p.notaryFees),
          renovationCosts: p.renovationCosts == null ? "" : String(p.renovationCosts),
          landShareRate: p.landShareRate == null ? "15" : String(Math.round((p.landShareRate ?? 0) * 100)),

          contribution: String(p.contribution ?? ""),
          loanAmount: String(p.loanAmount ?? ""),
          interestRate: String(p.interestRate ?? ""),
          duration: String(p.duration ?? ""),

          monthlyRent: String(p.monthlyRent ?? ""),
          vacancyRate: p.vacancyRate == null ? "" : String(p.vacancyRate),

          rentChargesIncluded: Boolean(p.rentChargesIncluded),
          recoverableChargesMonthly: p.recoverableChargesMonthly == null ? "" : String(p.recoverableChargesMonthly),
          otherIncomeMonthly: p.otherIncomeMonthly == null ? "" : String(p.otherIncomeMonthly),

          propertyTax: p.propertyTax == null ? "" : String(p.propertyTax),
          coOwnershipFees: p.coOwnershipFees == null ? "" : String(p.coOwnershipFees),
          insurance: p.insurance == null ? "" : String(p.insurance),
          maintenance: p.maintenance == null ? "" : String(p.maintenance),

          // PRO+ fields : si pas Pro+, on vide
          propertyManagementFeeRate: isProPlus ? (p.propertyManagementFeeRate == null ? "" : String(p.propertyManagementFeeRate)) : "",
          propertyManagementFeeMonthly: isProPlus ? (p.propertyManagementFeeMonthly == null ? "" : String(p.propertyManagementFeeMonthly)) : "",
          rentGuaranteeInsuranceMonthly: isProPlus ? (p.rentGuaranteeInsuranceMonthly == null ? "" : String(p.rentGuaranteeInsuranceMonthly)) : "",
          accountingFeesAnnual: isProPlus ? (p.accountingFeesAnnual == null ? "" : String(p.accountingFeesAnnual)) : "",
          expectedCapexAnnual: isProPlus ? (p.expectedCapexAnnual == null ? "" : String(p.expectedCapexAnnual)) : "",

          taxMode: safeTaxMode,
          furnished: Boolean(p.furnished),

          depreciationAssets:
            isProPlus && safeTaxMode === "real" && p.depreciationAssets?.length
              ? p.depreciationAssets.map((a: any) => ({
                  category: a.category,
                  label: a.label,
                  amount: String(a.amount),
                  years: String(a.years),
                }))
              : makeDefaultAssets(),
        })
      } catch (e) {
        console.error(e)
        navigate("/dashboard", { replace: true })
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, id, isProPlus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)

      // base payload
      const payload: any = {
        ...formData,
        landShareRate: trimOrEmpty(formData.landShareRate),
      }

      // ✅ Nettoyage PRO+ si pas ProPlus (évite d'envoyer ces champs)
      if (!isProPlus) {
        payload.taxMode = "micro"
        payload.depreciationAssets = undefined
        payload.propertyManagementFeeRate = ""
        payload.propertyManagementFeeMonthly = ""
        payload.rentGuaranteeInsuranceMonthly = ""
        payload.accountingFeesAnnual = ""
        payload.expectedCapexAnnual = ""
      } else {
        // Pro+ : amortissements uniquement si réel
        payload.depreciationAssets =
          formData.taxMode === "real"
            ? formData.depreciationAssets
                .filter((a) => !isBlank(a.amount) && !isBlank(a.years) && !isBlank(a.label))
                .map((a) => ({
                  ...a,
                  amount: trimOrEmpty(a.amount),
                  years: trimOrEmpty(a.years),
                  label: trimOrEmpty(a.label),
                }))
            : undefined
      }

      if (mode === "create") {
        await ProjectsAPI.create(getAccessTokenSilently, payload)
      } else {
        if (!id) throw new Error("Missing id")
        await ProjectsAPI.update(getAccessTokenSilently, id, payload)
      }

      navigate("/dashboard")
    } catch (err: any) {
      console.error(err)

      // Si ton ProjectsAPI remonte déjà { error }, adapte le parsing ici
      const apiError = err?.response?.data?.error ?? err?.error ?? err?.message

      if (apiError === "PRO_PLUS_REQUIRED") {
        navigate("/upgrade")
        return
      }

      alert("Erreur lors de l'enregistrement du projet")
    } finally {
      setSaving(false)
    }
  }

  const goUpgrade = () => navigate("/upgrade")

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au dashboard
            </Link>

            <h1 className="mb-2">{mode === "create" ? "Nouveau projet" : "Modifier le projet"}</h1>
            <p className="text-gray-600 dark:text-gray-400">Renseignez les informations de votre investissement</p>

            {id && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Projet : {id}</p>}
          </div>

          {mode === "edit" && id && (
            <button
              type="button"
              onClick={handleDeleteProject}
              disabled={deleting || saving || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              title="Supprimer le projet"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Suppression..." : "Supprimer"}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          Chargement du projet...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection icon={<Home className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />} title="Informations du bien">
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Nom du projet"
                value={formData.name}
                onChange={(v) => handleChange("name", v)}
                placeholder="Ex: Appartement T2 Centre-ville"
                required
              />
              <InputField label="Ville" value={formData.city} onChange={(v) => handleChange("city", v)} placeholder="Ex: Lyon" required />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <SelectField
                label="Type de bien"
                value={formData.propertyType}
                onChange={(v) => handleChange("propertyType", v)}
                options={[
                  { value: "apartment", label: "Appartement" },
                  { value: "house", label: "Maison" },
                  { value: "studio", label: "Studio" },
                  { value: "commercial", label: "Local commercial" },
                ]}
              />
              <InputField label="Prix d'achat" type="number" value={formData.price} onChange={(v) => handleChange("price", v)} placeholder="180000" suffix="€" required />
              <InputField label="Frais de notaire" type="number" value={formData.notaryFees} onChange={(v) => handleChange("notaryFees", v)} placeholder="14400" suffix="€" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <InputField label="Coût des travaux" type="number" value={formData.renovationCosts} onChange={(v) => handleChange("renovationCosts", v)} placeholder="5000" suffix="€" />
              <InputField
                label="Part terrain (non amortissable)"
                type="number"
                step="1"
                value={formData.landShareRate}
                onChange={(v) => handleChange("landShareRate", v)}
                placeholder="15"
                suffix="%"
                helpText="Souvent entre 10% et 20% selon la zone."
              />
            </div>
          </FormSection>

          <FormSection icon={<DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />} title="Financement">
            <div className="grid md:grid-cols-2 gap-4">
              <InputField label="Apport personnel" type="number" value={formData.contribution} onChange={(v) => handleChange("contribution", v)} placeholder="36000" suffix="€" required />
              <InputField label="Montant emprunté" type="number" value={formData.loanAmount} onChange={(v) => handleChange("loanAmount", v)} placeholder="163400" suffix="€" required />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <InputField label="Taux d'intérêt" type="number" step="0.1" value={formData.interestRate} onChange={(v) => handleChange("interestRate", v)} placeholder="3.5" suffix="%" required />
              <InputField label="Durée du prêt" type="number" value={formData.duration} onChange={(v) => handleChange("duration", v)} placeholder="20" suffix="ans" required />
            </div>
          </FormSection>

          <FormSection icon={<FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />} title="Revenus locatifs">
            <div className="grid md:grid-cols-2 gap-4">
              <InputField label="Loyer mensuel" type="number" value={formData.monthlyRent} onChange={(v) => handleChange("monthlyRent", v)} placeholder="850" suffix="€" required />
              <InputField label="Taux de vacance" type="number" step="0.1" value={formData.vacancyRate} onChange={(v) => handleChange("vacancyRate", v)} placeholder="5" suffix="%" helpText="Pourcentage de l'année sans locataire" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <ToggleField
                label="Loyer charges comprises ?"
                checked={formData.rentChargesIncluded}
                onChange={(v) => handleChange("rentChargesIncluded", v)}
                helpText="Si non, tu peux ajouter les charges récupérables en plus du loyer."
              />
              <InputField
                label="Charges récupérables (si loyer hors charges)"
                type="number"
                value={formData.recoverableChargesMonthly}
                onChange={(v) => handleChange("recoverableChargesMonthly", v)}
                placeholder="50"
                suffix="€/mois"
              />
            </div>

            <InputField
              label="Autres revenus (parking, cave...)"
              type="number"
              value={formData.otherIncomeMonthly}
              onChange={(v) => handleChange("otherIncomeMonthly", v)}
              placeholder="0"
              suffix="€/mois"
            />
          </FormSection>

          {/* ✅ Charges de base : accessibles à tous */}
          <FormSection icon={<Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />} title="Charges (base)">
            <div className="grid md:grid-cols-2 gap-4">
              <InputField label="Taxe foncière" type="number" value={formData.propertyTax} onChange={(v) => handleChange("propertyTax", v)} placeholder="800" suffix="€/an" />
              <InputField label="Charges de copropriété" type="number" value={formData.coOwnershipFees} onChange={(v) => handleChange("coOwnershipFees", v)} placeholder="120" suffix="€/mois" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <InputField label="Assurance PNO" type="number" value={formData.insurance} onChange={(v) => handleChange("insurance", v)} placeholder="25" suffix="€/mois" />
              <InputField label="Provision entretien" type="number" value={formData.maintenance} onChange={(v) => handleChange("maintenance", v)} placeholder="50" suffix="€/mois" />
            </div>
          </FormSection>

          {/* ✅ Charges détaillées : Pro+ only */}
          {isProPlus ? (
            <FormSection icon={<Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />} title="Charges et frais (détaillé)">
              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  label="Gestion locative (taux)"
                  type="number"
                  step="0.1"
                  value={formData.propertyManagementFeeRate}
                  onChange={(v) => handleChange("propertyManagementFeeRate", v)}
                  placeholder="7"
                  suffix="%"
                  helpText="Si tu mets un montant fixe, il sera prioritaire."
                />
                <InputField
                  label="Gestion locative (montant fixe)"
                  type="number"
                  value={formData.propertyManagementFeeMonthly}
                  onChange={(v) => handleChange("propertyManagementFeeMonthly", v)}
                  placeholder="0"
                  suffix="€/mois"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  label="Assurance loyers impayés (GLI)"
                  type="number"
                  value={formData.rentGuaranteeInsuranceMonthly}
                  onChange={(v) => handleChange("rentGuaranteeInsuranceMonthly", v)}
                  placeholder="0"
                  suffix="€/mois"
                />
                <InputField
                  label="Frais comptable (LMNP réel)"
                  type="number"
                  value={formData.accountingFeesAnnual}
                  onChange={(v) => handleChange("accountingFeesAnnual", v)}
                  placeholder="0"
                  suffix="€/an"
                />
              </div>

              <InputField
                label="Budget gros entretien (capex lissé)"
                type="number"
                value={formData.expectedCapexAnnual}
                onChange={(v) => handleChange("expectedCapexAnnual", v)}
                placeholder="0"
                suffix="€/an"
              />
            </FormSection>
          ) : (
            <ProPlusLock
              title="Charges et frais (détaillé)"
              description="Gestion locative, GLI, frais comptable, capex… disponible en Pro+."
              onUpgrade={goUpgrade}
            />
          )}

          {/* ✅ Fiscalité : Pro+ only (parce que tu veux “détail fiscalité”) */}
          {isProPlus ? (
            <>
              <FormSection icon={<FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />} title="Fiscalité">
                <div className="grid md:grid-cols-3 gap-4">
                  <SelectField
                    label="Mode fiscal"
                    value={formData.taxMode}
                    onChange={(v) => handleChange("taxMode", v as any)}
                    options={[
                      { value: "micro", label: "Micro-BIC" },
                      { value: "real", label: "Réel (LMNP)" },
                    ]}
                  />

                  <ToggleField
                    label="Meublé ?"
                    checked={formData.furnished}
                    onChange={(v) => handleChange("furnished", v)}
                    helpText="LMNP => généralement Oui."
                  />

                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-end">(TMI + PS sont côté profil User)</div>
                </div>
              </FormSection>

              {formData.taxMode === "real" && (
                <FormSection icon={<Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />} title="Amortissements (LMNP réel)">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Ajoute des lignes d’amortissement (montant + durée). L’app calcule amortissement/an.
                  </div>

                  <div className="space-y-3 mt-4">
                    {formData.depreciationAssets.map((a, idx) => (
                      <div
                        key={idx}
                        className="grid md:grid-cols-[200px_1fr_140px_120px_44px] gap-3 items-end bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
                      >
                        <SelectField
                          label="Catégorie"
                          value={a.category}
                          onChange={(v) => handleAssetChange(idx, "category", v as any)}
                          options={[
                            { value: "building", label: "Bâti" },
                            { value: "works", label: "Travaux" },
                            { value: "furniture", label: "Mobilier" },
                            { value: "fees", label: "Frais" },
                          ]}
                        />
                        <InputField
                          label="Libellé"
                          value={a.label}
                          onChange={(v) => handleAssetChange(idx, "label", v)}
                          placeholder="Ex: Bâti (hors terrain)"
                        />
                        <InputField
                          label="Montant"
                          type="number"
                          value={a.amount}
                          onChange={(v) => handleAssetChange(idx, "amount", v)}
                          placeholder="150000"
                          suffix="€"
                        />
                        <InputField
                          label="Durée"
                          type="number"
                          value={a.years}
                          onChange={(v) => handleAssetChange(idx, "years", v)}
                          placeholder="30"
                          suffix="ans"
                        />
                        <button
                          type="button"
                          onClick={() => removeAsset(idx)}
                          className="h-11 w-11 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center justify-center hover:opacity-90"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addAsset}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:opacity-90"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une ligne
                    </button>
                  </div>
                </FormSection>
              )}
            </>
          ) : (
            <ProPlusLock
              title="Fiscalité (détaillé) + Amortissements"
              description="Le mode réel (LMNP) et les amortissements sont disponibles en Pro+."
              onUpgrade={goUpgrade}
            />
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              disabled={saving || deleting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || deleting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? "Enregistrement..." : mode === "create" ? "Créer le projet" : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

/* ===================== UI FIELDS ===================== */

function FormSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h2>{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function InputField({
  label,
  type = "text",
  step,
  value,
  onChange,
  placeholder,
  suffix,
  helpText,
  required = false,
}: {
  label: string
  type?: string
  step?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suffix?: string
  helpText?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-gray-100"
          placeholder={placeholder}
          required={required}
        />
        {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">{suffix}</span>}
      </div>
      {helpText && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helpText}</p>}
    </div>
  )
}

function ToggleField({
  label,
  checked,
  onChange,
  helpText,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  helpText?: string
}) {
  return (
    <div>
      <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-full px-4 py-3 rounded-lg border transition-all text-left ${
          checked
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
            : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        }`}
      >
        <span className={`font-medium ${checked ? "text-emerald-700 dark:text-emerald-300" : "text-gray-700 dark:text-gray-300"}`}>
          {checked ? "Oui" : "Non"}
        </span>
      </button>
      {helpText && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helpText}</p>}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  helpText,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  helpText?: string
}) {
  return (
    <div>
      <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-gray-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {helpText && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helpText}</p>}
    </div>
  )
}
