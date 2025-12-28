import { apiFetch , apiFetchBlob } from "../lib/api"

type GetTokenSilently = (opts?: any) => Promise<string>

export type DepreciationAssetDTO = {
  id: string
  category: "building" | "works" | "furniture" | "fees"
  label: string
  amount: number
  years: number
  createdAt: string
}

export type ProjectDTO = {
  id: string
  name: string
  city: string
  propertyType: string

  // Acquisition
  price: number
  notaryFees: number | null
  renovationCosts: number | null
  landShareRate: number | null

  // Financement
  contribution: number
  loanAmount: number
  interestRate: number
  duration: number

  // Revenus
  monthlyRent: number
  vacancyRate: number | null
  rentChargesIncluded: boolean
  recoverableChargesMonthly: number | null
  otherIncomeMonthly: number | null

  // Charges (base)
  propertyTax: number | null
  coOwnershipFees: number | null
  insurance: number | null
  maintenance: number | null

  // Charges détaillées
  propertyManagementFeeRate: number | null
  propertyManagementFeeMonthly: number | null
  rentGuaranteeInsuranceMonthly: number | null
  accountingFeesAnnual: number | null
  expectedCapexAnnual: number | null

  // Fiscalité projet
  taxMode: "micro" | "real"
  furnished: boolean

  // Relations
  depreciationAssets?: DepreciationAssetDTO[]
  user?: {
    id: string
    tmi: number
    socialContribRate: number
  }

  createdAt: string
  updatedAt: string
}

export type DepreciationAssetFormPayload = {
  category: "building" | "works" | "furniture" | "fees"
  label: string
  amount: string
  years: string
}

export type ProjectFormPayload = {
  name: string
  city: string
  propertyType: string

  // Acquisition
  price: string
  notaryFees: string
  renovationCosts: string
  landShareRate: string

  // Financement
  contribution: string
  loanAmount: string
  interestRate: string
  duration: string

  // Revenus
  monthlyRent: string
  vacancyRate: string
  rentChargesIncluded: boolean
  recoverableChargesMonthly: string
  otherIncomeMonthly: string

  // Charges (base)
  propertyTax: string
  coOwnershipFees: string
  insurance: string
  maintenance: string

  // Charges détaillées
  propertyManagementFeeRate: string
  propertyManagementFeeMonthly: string
  rentGuaranteeInsuranceMonthly: string
  accountingFeesAnnual: string
  expectedCapexAnnual: string

  // Fiscalité
  taxMode: "micro" | "real"
  furnished: boolean

  // Amortissements (optionnel)
  depreciationAssets?: DepreciationAssetFormPayload[]
}

export const ProjectsAPI = {
  list(getToken: GetTokenSilently) {
    return apiFetch<ProjectDTO[]>(getToken, "/api/projects")
  },

  get(getToken: GetTokenSilently, id: string) {
    return apiFetch<ProjectDTO>(getToken, `/api/projects/${id}`)
  },

  create(getToken: GetTokenSilently, payload: ProjectFormPayload) {
    return apiFetch<ProjectDTO>(getToken, "/api/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  update(getToken: GetTokenSilently, id: string, payload: ProjectFormPayload) {
    return apiFetch<ProjectDTO>(getToken, `/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },

  remove(getToken: GetTokenSilently, id: string) {
    return apiFetch<void>(getToken, `/api/projects/${id}`, {
      method: "DELETE",
    })
  },

  // Téléchargement PDF : on récupère un Blob et on laisse la page déclencher le download
  async downloadPdf(getToken: GetTokenSilently, id: string) {
    return apiFetchBlob(getToken, `/api/projects/${id}/pdf`, { method: "GET" })
  },
}
