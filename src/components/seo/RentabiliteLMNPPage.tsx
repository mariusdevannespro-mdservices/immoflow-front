import { SeoPage } from "../SeoPage"

export function RentabiliteLMNPPage() {
  return (
    <SeoPage
      title="Rentabilité LMNP – Simulation et fiscalité expliquée"
      description="Simule la rentabilité LMNP en intégrant amortissement, charges et impôts réels."
      h1="Rentabilité LMNP : calcule ton investissement après fiscalité"
      canonical="https://immoflow.fr/rentabilite-lmnp"
      content={
        <>
          <p>
            La <strong>rentabilité LMNP</strong> est souvent meilleure que la location nue,
            à condition de bien intégrer la fiscalité et les amortissements.
          </p>

          <h2>Pourquoi le LMNP est avantageux ?</h2>
          <p>
            Le statut LMNP permet de réduire fortement l’imposition grâce
            à l’amortissement du bien.
          </p>

          <h2>Ce que la simulation LMNP prend en compte</h2>
          <ul>
            <li>Revenus locatifs</li>
            <li>Charges déductibles</li>
            <li>Amortissement</li>
            <li>Impact fiscal réel</li>
          </ul>

          <h2>Exemple de rentabilité LMNP</h2>
          <p>
            Un bien générant 9 000 € de loyers peut afficher une fiscalité proche
            de zéro pendant plusieurs années.
          </p>

          <h2>ImmoFlow et le LMNP</h2>
          <p>
            ImmoFlow t’aide à estimer la rentabilité réelle de ton projet LMNP,
            sans calculs complexes.
          </p>
        </>
      }
    />
  )
}
