import { SeoPage } from "../SeoPage"

export function CashflowImmobilierPage() {
  return (
    <SeoPage
      title="Cashflow immobilier – Calcul gratuit et réaliste"
      description="Calcule ton cashflow immobilier réel après crédit, charges et fiscalité. Simulation simple et fiable."
      h1="Cashflow immobilier : calcule ton revenu mensuel réel"
      canonical="https://immoflow.fr/cashflow-immobilier"
      content={
        <>
          <p>
            Le <strong>cashflow immobilier</strong> correspond à l’argent qu’il te reste
            chaque mois après avoir payé le crédit, les charges et les impôts.
          </p>

          <h2>Pourquoi le cashflow est essentiel ?</h2>
          <p>
            Un investissement peut être rentable sur le papier mais négatif en cashflow.
            Cette simulation permet d’éviter les mauvaises surprises.
          </p>

          <h2>Que prend en compte ImmoFlow ?</h2>
          <ul>
            <li>Loyer mensuel</li>
            <li>Mensualité de crédit</li>
            <li>Charges réelles</li>
            <li>Fiscalité (LMNP)</li>
          </ul>

          <h2>Exemple de cashflow</h2>
          <p>
            Pour un loyer de 800 € et des charges totales de 750 €, le cashflow est
            de +50 € par mois.
          </p>

          <h2>Cashflow positif ou négatif ?</h2>
          <p>
            ImmoFlow te donne un verdict clair pour savoir si ton projet est viable
            sur le long terme.
          </p>
        </>
      }
    />
  )
}
