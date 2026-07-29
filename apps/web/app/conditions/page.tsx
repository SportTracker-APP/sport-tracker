import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/legal-page";
import { createPublicMetadata } from "@/lib/seo";

export const metadata: Metadata = createPublicMetadata({
  path: "/conditions",
  title: "Conditions d’utilisation de HOVREN",
  description:
    "Consulte les conditions d’utilisation de HOVREN, le carnet d’exploration outdoor pour tes sorties, traces et sommets.",
});

const termsSections = [
  {
    title: "1. Acceptation des conditions",
    paragraphs: [
      "Les presentes conditions encadrent l'acces et l'utilisation de HOVREN. En creant un compte ou en utilisant l'application, l'utilisateur accepte ces conditions.",
      "Si l'utilisateur n'accepte pas ces conditions, il ne doit pas utiliser le service.",
    ],
  },
  {
    title: "2. Description du service",
    paragraphs: [
      "HOVREN est une application de carnet outdoor permettant d'enregistrer, organiser et consulter des activites sportives, des sommets, des objectifs, des statistiques et des souvenirs d'exploration.",
      "Certaines fonctionnalites peuvent dependre d'integrations tierces, d'une connexion internet, de donnees fournies par l'utilisateur ou de services externes.",
    ],
  },
  {
    title: "3. Creation et securite du compte",
    paragraphs: [
      "L'utilisateur doit fournir des informations exactes lors de la creation du compte et maintenir ces informations a jour lorsque cela est necessaire.",
      "L'utilisateur est responsable de la confidentialite de ses identifiants et de toutes les actions realisees depuis son compte, sauf preuve d'un usage frauduleux non imputable a l'utilisateur.",
      "HOVREN peut demander une verification d'email, bloquer temporairement une action ou suspendre un compte en cas de suspicion d'abus, de compromission ou d'utilisation non conforme.",
    ],
  },
  {
    title: "4. Utilisation autorisee",
    paragraphs: [
      "L'utilisateur s'engage a utiliser HOVREN de maniere loyale, personnelle et conforme aux lois applicables.",
      "Il est interdit de tenter d'acceder a des comptes tiers, de contourner les mecanismes de securite, de perturber le service, d'automatiser des requetes abusives ou de publier du contenu illicite.",
      "L'utilisateur reste responsable des donnees, textes, notes, traces ou informations qu'il ajoute dans l'application.",
    ],
  },
  {
    title: "5. Donnees sportives et limites d'usage",
    paragraphs: [
      "Les donnees affichees par HOVREN, notamment distances, deniveles, durees, cartes, statistiques, badges et objectifs, sont fournies a titre de suivi personnel.",
      "Ces informations peuvent contenir des approximations, erreurs de mesure, differences d'arrondi ou incoherences issues de services tiers ou de donnees importees.",
      "HOVREN ne remplace pas un avis medical, sportif, meteorologique, cartographique, de securite ou de secours. L'utilisateur reste seul responsable de ses decisions sur le terrain.",
    ],
  },
  {
    title: "6. Integrations et services tiers",
    paragraphs: [
      "L'utilisateur peut choisir de connecter HOVREN a des services tiers, comme une plateforme sportive ou un prestataire d'email transactionnel utilise par le service.",
      "Les services tiers disposent de leurs propres conditions et politiques de confidentialite. HOVREN n'est pas responsable de leurs decisions, interruptions, changements d'API ou erreurs de traitement.",
      "L'utilisateur peut retirer l'acces a une integration lorsque les parametres de HOVREN ou du service tiers le permettent.",
    ],
  },
  {
    title: "7. Disponibilite et evolution",
    paragraphs: [
      "HOVREN s'efforce de fournir un service fiable, mais ne garantit pas une disponibilite permanente, continue ou sans erreur.",
      "Le service peut etre modifie, suspendu ou interrompu temporairement pour maintenance, correction, evolution produit, securite ou contrainte technique.",
      "Certaines fonctionnalites peuvent etre ajoutees, modifiees ou retirees afin d'ameliorer l'application ou de respecter des contraintes legales, techniques ou de securite.",
    ],
  },
  {
    title: "8. Propriete intellectuelle",
    paragraphs: [
      "L'application, son interface, son code, ses elements visuels, sa marque, sa structure et ses contenus propres sont proteges par les droits de propriete intellectuelle applicables.",
      "L'utilisateur conserve les droits sur les donnees et contenus qu'il ajoute dans son compte, sous reserve des droits necessaires accordes a HOVREN pour fournir le service.",
      "Toute reproduction, extraction, copie ou exploitation non autorisee de l'application ou de ses elements est interdite.",
    ],
  },
  {
    title: "9. Suppression et suspension",
    paragraphs: [
      "L'utilisateur peut demander la suppression de son compte selon les modalites disponibles dans l'application ou via le support.",
      "HOVREN peut suspendre ou supprimer l'acces a un compte en cas de violation grave ou repetee des conditions, d'utilisation frauduleuse, de risque de securite ou d'obligation legale.",
      "La suppression du compte peut entrainer la perte definitive des activites, objectifs, sommets, statistiques et preferences associes.",
    ],
  },
  {
    title: "10. Responsabilite",
    paragraphs: [
      "HOVREN est fourni comme un outil de suivi personnel. L'utilisateur reconnait que l'activite outdoor comporte des risques et qu'il doit prendre toutes les precautions necessaires avant, pendant et apres une sortie.",
      "HOVREN ne peut etre tenu responsable des dommages lies a une mauvaise interpretation des donnees, a une decision prise sur le terrain, a une indisponibilite temporaire ou a une erreur provenant d'un service tiers.",
      "Rien dans ces conditions n'exclut les garanties ou responsabilites qui ne peuvent pas etre exclues par la loi applicable.",
    ],
  },
  {
    title: "11. Donnees personnelles",
    paragraphs: [
      "Le traitement des donnees personnelles est decrit dans la politique de confidentialite accessible depuis l'application.",
      "L'utilisateur est invite a consulter cette politique pour comprendre quelles donnees sont traitees, pourquoi, pendant combien de temps et quels droits il peut exercer.",
    ],
  },
  {
    title: "12. Modification des conditions",
    paragraphs: [
      "HOVREN peut mettre a jour ces conditions pour tenir compte de l'evolution du service, des contraintes techniques ou des obligations legales.",
      "La version publiee sur cette page est la version applicable. En cas de modification importante, HOVREN pourra informer les utilisateurs par un moyen approprie.",
    ],
  },
  {
    title: "13. Droit applicable",
    paragraphs: [
      "Ces conditions sont redigees pour un service exploite depuis la France et ont vocation a etre interpretees selon le droit applicable au lieu d'etablissement de l'editeur, sauf regle imperative contraire.",
      "En cas de difficulte, l'utilisateur est invite a contacter HOVREN afin de rechercher une solution amiable avant toute autre demarche.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Conditions d'utilisation"
      title="Cadre d'utilisation de HOVREN"
      introduction="Ces conditions définissent les règles d'accès et d'utilisation de HOVREN, ainsi que les droits et responsabilités de chacun."
      documentLabel="Conditions d'utilisation"
      sections={termsSections}
    />
  );
}
