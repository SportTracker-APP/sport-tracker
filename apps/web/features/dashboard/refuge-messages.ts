export type RefugeMessage = {
  title: string;
  body: string;
};

export const REFUGE_MESSAGES: readonly RefugeMessage[] = [
  {
    title: "Le sentier garde toujours une place.",
    body: "Une sortie courte, une grande boucle ou quelques mètres de D+ : chaque trace compte vraiment.",
  },
  {
    title: "La carte a encore un coin blanc.",
    body: "Pas besoin d’aller loin pour découvrir quelque chose de nouveau. Il suffit parfois de tourner plus tôt.",
  },
  {
    title: "Le refuge valide la régularité.",
    body: "Les grandes aventures impressionnent. Les petites sorties répétées construisent tout le reste.",
  },
  {
    title: "Les chaussures connaissent déjà la direction.",
    body: "Il ne manque plus qu’un créneau, un peu d’eau et cette bonne idée de sortir malgré tout.",
  },
  {
    title: "Le GPS peut souffler un instant.",
    body: "La prochaine aventure n’a pas besoin d’être parfaite. Elle doit seulement commencer.",
  },
  {
    title: "Le lac est toujours là.",
    body: "Ton prochain tour aussi. Le paysage n’est pas pressé, profite-en.",
  },
  {
    title: "Un peu de D+, beaucoup de tête libre.",
    body: "Les montées se paient en souffle. La vue, elle, rembourse souvent avec les intérêts.",
  },
  {
    title: "La forêt a prévu de ne rien dire.",
    body: "Parfait. Il reste juste le bruit des pas, du vélo et des idées qui se remettent en ordre.",
  },
  {
    title: "Les meilleurs détours ne sont pas perdus.",
    body: "Ils deviennent souvent les passages qu’on racontera le plus longtemps après la sortie.",
  },
  {
    title: "La météo choisit l’ambiance.",
    body: "Tu choisis l’allure, l’itinéraire et la satisfaction de rentrer avec une nouvelle trace.",
  },
  {
    title: "Le sommet n’est jamais pressé.",
    body: "Prends le rythme qui te ressemble. L’important est de continuer à monter.",
  },
  {
    title: "Les mollets ont signé sans lire les petites lignes.",
    body: "Ils protesteront peut-être demain, mais ils savent déjà que la sortie valait le détour.",
  },
  {
    title: "Une sortie calme prépare souvent la suivante.",
    body: "Tous les kilomètres n’ont pas besoin d’être rapides pour faire avancer l’histoire.",
  },
  {
    title: "Le vent a gardé une place pour toi.",
    body: "Prends-la avant qu’il ne change d’avis, puis laisse la route faire le reste.",
  },
  {
    title: "La prochaine trace commence près de la porte.",
    body: "Le plus difficile reste parfois de mettre les chaussures. Après, le terrain prend le relais.",
  },
  {
    title: "Le refuge garde ta place au chaud.",
    body: "Reviens avec de la boue, du dénivelé ou simplement une bonne raison de sourire.",
  },
  {
    title: "Aujourd’hui peut devenir un bon souvenir.",
    body: "Il suffit parfois d’un chemin familier, d’une lumière différente et de quelques kilomètres dehors.",
  },
  {
    title: "La montagne compte autrement.",
    body: "Elle ne mesure ni les records ni les classements. Seulement les passages et les retours.",
  },
  {
    title: "Le terrain de jeu est déjà ouvert.",
    body: "Course, trail, vélo ou marche : choisis ta porte d’entrée, Montaro gardera la trace.",
  },
  {
    title: "Le paysage donne rarement de mauvais conseils.",
    body: "Ralentir, respirer, regarder plus loin : parfois, la meilleure progression commence comme ça.",
  },
] as const;

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getLocalDayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getDailyRefugeMessage(date: Date) {
  const dayKey = getLocalDayKey(date);
  const index =
    hashString(`montaro-refuge:${dayKey}`) %
    REFUGE_MESSAGES.length;

  return REFUGE_MESSAGES[index];
}