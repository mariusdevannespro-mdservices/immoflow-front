import { Link } from "react-router-dom"

export function LegalPage({ type }: { type: "terms" | "privacy" | "legal" }) {
  const LAST_UPDATE = "24 décembre 2025"
  const CONTACT_EMAIL = "contact@immoflow.fr"

  const content = {
    terms: {
      title: "Conditions Générales d'Utilisation",
      sections: [
        {
          title: "1. Objet",
          content:
            "Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de la plateforme ImmoFlow, un outil d'analyse de rentabilité d'investissements immobiliers locatifs.",
        },
        {
          title: "2. Acceptation des conditions",
          content:
            "L'utilisation de la plateforme ImmoFlow implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.",
        },
        {
          title: "3. Description du service",
          content:
            "ImmoFlow fournit un outil en ligne permettant d'analyser la rentabilité d'investissements immobiliers locatifs. Les calculs fournis sont indicatifs et ne constituent pas un conseil en investissement, fiscal ou financier.",
        },
        {
          title: "4. Inscription et compte utilisateur",
          content:
            "L'utilisation de certaines fonctionnalités nécessite la création d'un compte. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées sous votre compte.",
        },
        {
          title: "5. Utilisation du service",
          content:
            "Vous vous engagez à utiliser le service de manière conforme aux lois en vigueur et aux présentes CGU. Toute utilisation abusive ou frauduleuse pourra entraîner la suspension ou la suppression de votre compte.",
        },
        {
          title: "6. Propriété intellectuelle",
          content:
            "Tous les contenus présents sur la plateforme (textes, graphiques, logos, interfaces, etc.) sont la propriété exclusive de l'éditeur, sauf mentions particulières, et sont protégés par les lois sur la propriété intellectuelle.",
        },
        {
          title: "7. Limitation de responsabilité",
          content:
            "ImmoFlow ne peut être tenu responsable des décisions d'investissement prises sur la base des calculs fournis. Les résultats sont indicatifs et doivent être validés par un professionnel.",
        },
        {
          title: "8. Modification des CGU",
          content:
            "ImmoFlow se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification importante. La date de dernière mise à jour est affichée en haut de page.",
        },
        {
          title: "9. Droit applicable",
          content:
            "Les présentes CGU sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français seront seuls compétents."
        },
      ],
    },

    privacy: {
      title: "Politique de Confidentialité",
      sections: [
        {
          title: "1. Collecte des données",
          content:
            "Nous collectons les informations que vous nous fournissez lors de votre inscription (ex : email, informations de profil) ainsi que les données relatives à vos projets immobiliers, afin de fournir le service.",
        },
        {
          title: "2. Utilisation des données",
          content:
            "Vos données sont utilisées pour :\n- fournir et améliorer le service,\n- gérer votre compte,\n- assurer la sécurité et prévenir la fraude,\n- gérer la facturation et les paiements si vous souscrivez à une offre payante.",
        },
        {
          title: "3. Base légale du traitement",
          content:
            "Le traitement de vos données repose sur l’exécution du contrat liant l’utilisateur à ImmoFlow, sur votre consentement lorsque requis, ainsi que sur nos obligations légales."
        },
        {
          title: "4. Sous-traitants / Prestataires",
          content:
            "Nous faisons appel à des prestataires nécessaires au fonctionnement du service :\n- Auth0 : authentification et gestion des sessions\n- Stripe : paiement et gestion de l'abonnement\n\nNous ne vendons pas vos données personnelles.",
        },
        {
          title: "5. Protection des données",
          content:
            "Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.",
        },
        {
          title: "6. Cookies",
          content:
            "Notre site peut utiliser des cookies techniques nécessaires au fonctionnement (ex : maintien de session). Si des cookies d'analyse sont ajoutés à l'avenir, un bandeau de consentement sera mis en place.",
        },
        {
          title: "7. Vos droits",
          content:
            "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données, ainsi que d'un droit d'opposition et de limitation. Vous pouvez exercer ces droits en nous contactant à " +
            CONTACT_EMAIL +
            ".",
        },
        {
          title: "8. Conservation des données",
          content:
            "Les données liées au compte sont conservées tant que le compte est actif.\n" +
            "Les données de facturation sont conservées pendant 10 ans conformément aux obligations légales.\n" +
            "Après suppression du compte, les données sont supprimées ou anonymisées sous 30 jours, sauf obligation légale contraire."
        },
        {
          title: "9. Contact",
          content:
            "Pour toute question concernant cette politique de confidentialité, vous pouvez nous contacter à " +
            CONTACT_EMAIL +
            ".",
        },
      ],
    },

    legal: {
      title: "Mentions Légales",
      sections: [
        {
          title: "Éditeur du site",
          content:
            "ImmoFlow\nÉditeur : Marius Devannes (micro-entreprise)\nSIRET : en cours d'immatriculation\nAdresse : 1 rue de la tournerie Solesmes\nEmail : " +
            CONTACT_EMAIL,
        },
        {
          title: "Directeur de publication",
          content: "Marius Devannes",
        },
        {
          title: "Hébergement",
          content:
            "Hébergement du front-end : Vercel Inc.\n" +
            "Adresse : 340 S Lemon Ave #4133, Walnut, CA 91789, USA\n\n" +
            "Hébergement de l’API : Render Services, Inc.\n" +
            "Adresse : 525 Brannan St, Suite 300, San Francisco, CA 94107, USA"
        },
        {
          title: "Contact",
          content: "Email : " + CONTACT_EMAIL,
        },
        {
          title: "Propriété intellectuelle",
          content:
            "L'ensemble du contenu de ce site (structure, textes, logos, images, etc.) est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation préalable est interdite.",
        },
        {
          title: "Données personnelles",
          content:
            "Les informations recueillies font l'objet d'un traitement destiné à la gestion de votre compte et à l'amélioration du service. Conformément au RGPD, vous disposez de droits sur vos données (accès, rectification, suppression...). Voir la Politique de Confidentialité pour plus de détails.",
        },
        {
          title: "Limitation de responsabilité",
          content:
            "Les informations et résultats fournis sur le site sont proposés à titre indicatif. ImmoFlow ne saurait être tenu responsable des décisions prises sur la base de ces informations.",
        },
      ],
    },
  } as const

  const pageContent = content[type]

  return (
    <div className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link to="/" className="inline-block text-emerald-600 dark:text-emerald-500 hover:underline mb-4">
            ← Retour à l'accueil
          </Link>

          <h1 className="mb-4">{pageContent.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">Dernière mise à jour : {LAST_UPDATE}</p>
        </div>

        <div className="space-y-8">
          {pageContent.sections.map((section, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8"
            >
              <h2 className="mb-4">{section.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vous avez des questions concernant{" "}
            {type === "terms" ? "nos CGU" : type === "privacy" ? "notre politique de confidentialité" : "nos mentions légales"}{" "}
            ?
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-emerald-600 dark:text-emerald-500 hover:underline"
          >
            Contactez-nous à {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  )
}
