/**
 * Sanitizes and standardizes produce names and categories
 * Rule 10: "for the fruits n veg in there name use only there name do not put 25 kg or 10 kg peoples decide them theleves"
 * Rule 11: Minimalist 5 categories
 */

export function cleanProduceName(name: string): string {
  if (!name) return '';
  let cleaned = name
    .replace(/\b\d+(\.\d+)?\s*(kg|g|lb|oz|kilos?|kilograms?)\b/gi, '')
    .replace(/\((25|10|5|4|2\.5|2|1|0\.5)\s*(kg|g|lb)?\)/gi, '')
    .replace(/\b(Sack|Bag|Pack)\b/gi, '')
    .replace(/\s*\(Medium\)|\s*\(Large\)|\s*\(Small\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If cleaning leaves empty or odd chars
  if (!cleaned) return name;
  return cleaned;
}

export const MINIMAL_CATEGORIES = [
  'Fresh Fruits',
  'Vegetables',
  'Roots & Tubers',
  'Tropical & Exotic',
  'Herbs & Seasoning',
] as const;

export function normalizeCategory(cat?: string): string {
  if (!cat) return 'Fresh Fruits';
  const c = cat.toLowerCase();

  if (c.includes('fruit') || c.includes('citrus') || c.includes('berry') || c.includes('apple') || c.includes('mango')) {
    return 'Fresh Fruits';
  }
  if (c.includes('root') || c.includes('tuber') || c.includes('yam') || c.includes('onion') || c.includes('garlic') || c.includes('potato')) {
    return 'Roots & Tubers';
  }
  if (c.includes('tropical') || c.includes('exotic') || c.includes('plantain') || c.includes('banana')) {
    return 'Tropical & Exotic';
  }
  if (c.includes('herb') || c.includes('spice') || c.includes('seasoning') || c.includes('mint') || c.includes('pepper') || c.includes('chilli')) {
    return 'Herbs & Seasoning';
  }
  return 'Vegetables';
}
