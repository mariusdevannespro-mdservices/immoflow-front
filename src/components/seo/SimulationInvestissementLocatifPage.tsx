import { SeoPage } from "../SeoPage"

export function SimulationInvestissementLocatifPage() {
  return (
    <SeoPage
      title="Simulation investissement locatif – Calcul rentabilité & cashflow"
      description="Simulation investissement locatif gratuite : calcule cashflow, rentabilité nette, fiscalité et LMNP avant d’acheter."
      h1="Simulation investissement locatif : calcule la rentabilité réelle de ton projet"
      canonical="https://immoflow.fr/simulation-investissement-locatif"
      content={
        <>
          <p>
            Cette page te permet de faire une <strong>simulation d’investissement locatif</strong>
            réaliste avant d’acheter un bien immobilier. Contrairement aux calculs trop optimistes,
            ImmoFlow prend en compte le cashflow, les charges et la fiscalité.
          </p>

          <h2>Pourquoi faire une simulation d’investissement locatif ?</h2>
          <p>
            Beaucoup d’investisseurs se basent uniquement sur la rentabilité brute.
            Une bonne simulation permet d’anticiper le <strong>cashflow mensuel réel</strong>,
            les impôts et l’impact du crédit sur le long terme.
          </p>

          <h2>Que calcule ImmoFlow exactement ?</h2>
          <ul>
            <li>Cashflow mensuel réel</li>
            <li>Rentabilité nette après charges</li>
            <li>Impact fiscal (LMNP)</li>
            <li>Verdict clair : bon ou mauvais investissement</li>
          </ul>

          <h2>Comment fonctionne la simulation ?</h2>
          <p>
            Tu renseignes le prix du bien, le montant du prêt, le loyer attendu
            et les charges principales. L’outil calcule automatiquement tous
            les indicateurs clés de ton investissement locatif.
          </p>

          <h2>Exemple de simulation</h2>
          <p>
            Pour un appartement acheté <strong>150 000 €</strong>, loué <strong>750 € par mois</strong>,
            ImmoFlow affiche immédiatement le cashflow, la rentabilité nette et
            l’impact fiscal réel.
          </p>

          <h2>À qui s’adresse cette simulation ?</h2>
          <p>
            Cette simulation s’adresse aux investisseurs débutants comme confirmés
            qui veulent sécuriser leurs hypothèses avant un achat immobilier.
          </p>

          <h2>Foire aux questions</h2>

          <h3>La simulation est-elle gratuite ?</h3>
          <p>
            Oui, la simulation d’investissement locatif est accessible gratuitement.
          </p>

          <h3>Est-ce adapté au LMNP ?</h3>
          <p>
            Oui, ImmoFlow est conçu pour simuler des investissements en location meublée
            avec une vision réaliste de la fiscalité.
          </p>
        </>
      }
    />
  )
}
