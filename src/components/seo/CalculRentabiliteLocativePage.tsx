import { SeoPage } from "../SeoPage"

export function CalculRentabiliteLocativePage() {
  return (
    <SeoPage
      title="Calcul rentabilité locative – Brute, nette et réelle"
      description="Calcul de la rentabilité locative : brute, nette et après impôts. Évite les calculs trompeurs."
      h1="Calcul de la rentabilité locative : méthode réaliste"
      canonical="https://immoflow.fr/calcul-rentabilite-locative"
      content={
        <>
          <p>
            Le <strong>calcul de rentabilité locative</strong> est indispensable pour
            comparer plusieurs biens immobiliers avant d’acheter.
          </p>

          <h2>Rentabilité brute vs rentabilité nette</h2>
          <p>
            La rentabilité brute ne tient pas compte des charges.
            La rentabilité nette donne une vision beaucoup plus réaliste.
          </p>

          <h2>Comment calculer la rentabilité locative ?</h2>
          <ul>
            <li>Loyer annuel</li>
            <li>Prix du bien + frais</li>
            <li>Charges annuelles</li>
          </ul>

          <h2>Pourquoi les chiffres sont souvent faux ?</h2>
          <p>
            Beaucoup d’investisseurs sous-estiment les charges et la fiscalité,
            ce qui fausse complètement la rentabilité réelle.
          </p>

          <h2>Avec ImmoFlow</h2>
          <p>
            Tu obtiens une rentabilité locative fiable, basée sur des hypothèses
            réalistes et exploitables.
          </p>
        </>
      }
    />
  )
}
