import type { Metadata } from "next";
import Link from "next/link";

import { Mountain } from "lucide-react";

export const metadata: Metadata = {
  title: "Confidentialite | Hovren",
  description: "Politique de confidentialite de Hovren.",
};

const privacySections = [
  {
    title: "1. Responsable du traitement",
    paragraphs: [
      "Hovren est une application de carnet outdoor qui permet de suivre des activites sportives, des sommets, des objectifs et des statistiques personnelles.",
      "Le responsable du traitement des donnees est l'editeur de Hovren. Pour toute demande relative aux donnees personnelles, l'utilisateur peut contacter l'equipe Hovren via l'adresse de support indiquee dans l'application ou dans les communications officielles du service.",
    ],
  },
  {
    title: "2. Donnees collectees",
    paragraphs: [
      "Hovren collecte uniquement les donnees necessaires au fonctionnement du service : adresse email, nom ou prenom affiche, mot de passe chiffre, statut de verification du compte, preferences et parametres de compte.",
      "L'application peut egalement traiter les donnees sportives ajoutees par l'utilisateur ou synchronisees depuis une integration autorisee : activites, distances, durees, deniveles, dates, sports pratiques, traces, objectifs, sommets, badges et statistiques associees.",
      "Des donnees techniques peuvent etre enregistrees pour assurer la securite et la fiabilite du service : journaux d'erreurs, informations de session, date de connexion, adresse IP tronquee ou informations techniques strictement utiles au diagnostic.",
    ],
  },
  {
    title: "3. Finalites d'utilisation",
    paragraphs: [
      "Les donnees sont utilisees pour creer et administrer le compte, permettre la connexion, afficher le carnet outdoor, suivre les activites, calculer les statistiques et proposer une experience personnalisee.",
      "Elles servent aussi a securiser le compte, prevenir les abus, envoyer les emails transactionnels indispensables, traiter les demandes de support et maintenir le bon fonctionnement de l'application.",
      "Hovren n'utilise pas les donnees sportives personnelles pour vendre des profils publicitaires individualises.",
    ],
  },
  {
    title: "4. Base legale",
    paragraphs: [
      "Le traitement des donnees necessaires au compte et aux fonctionnalites principales repose sur l'execution du contrat d'utilisation du service.",
      "Certains traitements de securite, de prevention des abus et d'amelioration technique reposent sur l'interet legitime de Hovren a maintenir un service fiable et protege.",
      "Lorsque l'utilisateur connecte volontairement un service tiers ou active une fonctionnalite optionnelle, le traitement peut reposer sur son consentement, qu'il peut retirer selon les modalites disponibles.",
    ],
  },
  {
    title: "5. Emails transactionnels",
    paragraphs: [
      "Hovren peut envoyer des emails strictement lies au fonctionnement du compte : verification d'adresse email, reinitialisation du mot de passe, confirmation de changement de mot de passe, notifications importantes de securite ou messages necessaires a l'utilisation du service.",
      "Ces emails ne contiennent pas volontairement d'informations sensibles non necessaires et les liens de securite ont une duree de validite limitee lorsqu'ils permettent une action sensible.",
    ],
  },
  {
    title: "6. Services tiers et integrations",
    paragraphs: [
      "Si l'utilisateur connecte une integration comme Strava, Hovren traite les donnees transmises par ce service uniquement pour fournir les fonctionnalites demandees : import, affichage, suivi et statistiques.",
      "L'utilisateur peut retirer l'acces a une integration depuis les parametres du service concerne ou depuis Hovren lorsque cette fonctionnalite est disponible.",
      "Hovren peut s'appuyer sur des prestataires techniques pour l'hebergement, l'envoi d'emails, l'analyse d'erreurs ou la mesure technique du service. Ces prestataires ne traitent les donnees que pour le compte de Hovren et selon les finalites prevues.",
    ],
  },
  {
    title: "7. Conservation",
    paragraphs: [
      "Les donnees du compte sont conservees tant que le compte reste actif. Les donnees sportives sont conservees pour permettre a l'utilisateur de consulter son historique et ses statistiques.",
      "En cas de suppression du compte, Hovren supprime ou anonymise les donnees associees dans un delai raisonnable, sous reserve des obligations legales ou de securite qui imposeraient une conservation temporaire.",
      "Les journaux techniques et donnees de securite sont conserves pendant une duree limitee, proportionnee a leur finalite de diagnostic, de prevention des abus et de securisation du service.",
    ],
  },
  {
    title: "8. Securite",
    paragraphs: [
      "Hovren applique des mesures raisonnables de securite : mots de passe haches, verification des droits d'acces, protection des routes sensibles, validation des donnees et limitation de l'exposition des informations sensibles dans les journaux techniques.",
      "Aucun systeme n'etant totalement invulnerable, l'utilisateur doit choisir un mot de passe robuste, le garder confidentiel et signaler rapidement toute activite suspecte sur son compte.",
    ],
  },
  {
    title: "9. Droits de l'utilisateur",
    paragraphs: [
      "Conformement a la reglementation applicable, l'utilisateur peut demander l'acces, la rectification, l'effacement, la limitation ou la portabilite de ses donnees personnelles.",
      "Il peut egalement s'opposer a certains traitements lorsque la loi le permet et retirer son consentement pour les fonctionnalites optionnelles fondees sur celui-ci.",
      "Une demande peut necessiter une verification d'identite afin d'eviter qu'un tiers non autorise accede aux donnees du compte.",
    ],
  },
  {
    title: "10. Cookies et stockage local",
    paragraphs: [
      "Hovren peut utiliser des cookies ou du stockage local pour maintenir la session, memoriser certaines preferences d'affichage et assurer le fonctionnement normal de l'application.",
      "Les informations strictement necessaires au fonctionnement du service ne peuvent pas toujours etre desactivees sans degrader l'experience ou empecher l'utilisation du compte.",
    ],
  },
  {
    title: "11. Modifications",
    paragraphs: [
      "Cette politique peut etre modifiee pour tenir compte des evolutions du produit, de la loi ou des prestataires techniques utilises.",
      "La version publiee sur cette page est la version applicable. En cas de modification importante, Hovren pourra informer les utilisateurs par un moyen approprie.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#08070f] px-6 py-10 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-zinc-300 transition hover:text-white"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/10">
              <Mountain className="h-5 w-5 text-violet-300" />
            </span>
            <span className="text-xl font-semibold">Hovren</span>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-violet-300/30 hover:text-white"
          >
            Retour
          </Link>
        </header>

        <section className="space-y-5">
          <p className="text-sm font-semibold tracking-[0.24em] text-violet-300 uppercase">
            Politique de confidentialite
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Protection des donnees personnelles
          </h1>
          <p className="max-w-3xl text-base leading-8 text-zinc-400">
            Derniere mise a jour : 26 juin 2026. Cette politique explique
            comment Hovren collecte, utilise, protege et conserve les donnees
            liees au compte et aux activites outdoor.
          </p>
        </section>

        <section className="grid gap-4">
          {privacySections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-violet-950/10"
            >
              <h2 className="text-lg font-semibold text-white">
                {section.title}
              </h2>
              <div className="mt-4 space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-7 text-zinc-400">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
