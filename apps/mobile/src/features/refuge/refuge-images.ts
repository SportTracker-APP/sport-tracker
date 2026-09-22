import type { ImageSourcePropType } from 'react-native';

type RefugeSummitImage = {
  credit: string;
  source: ImageSourcePropType;
};

const SUMMIT_IMAGES: Record<string, RefugeSummitImage> = {
  'vigie de marinas': {
    credit: 'Decathlon Outdoor',
    source: require('../../../assets/refuge/vigie-de-marinas.webp'),
  },
  'le concors': {
    credit: 'Gundan · CC BY-SA 4.0',
    source: require('../../../assets/refuge/le-concors.webp'),
  },
  'la tournette': {
    credit: 'Guilhem Vellut · CC BY 2.0',
    source: require('../../../assets/refuge/la-tournette.webp'),
  },
  'le mole': {
    credit: 'Guilhem Vellut · CC BY 2.0',
    source: require('../../../assets/refuge/le-mole.webp'),
  },
  'mont veyrier': {
    credit: 'Yann Forget · CC BY-SA 3.0',
    source: require('../../../assets/refuge/mont-veyrier.webp'),
  },
  'montagne de sous dine': {
    credit: 'Guilhem Vellut · CC BY 2.0',
    source: require('../../../assets/refuge/montagne-de-sous-dine.webp'),
  },
  'pointe de talamarche': {
    credit: 'Guilhem Vellut · CC BY 2.0',
    source: require('../../../assets/refuge/pointe-de-talamarche.webp'),
  },
  'pointe percee': {
    credit: 'Guilhem Vellut · CC BY 2.0',
    source: require('../../../assets/refuge/pointe-percee.webp'),
  },
};

function normalizeSummitName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getRefugeSummitImage(
  summitName: string,
): RefugeSummitImage | null {
  return SUMMIT_IMAGES[normalizeSummitName(summitName)] ?? null;
}
