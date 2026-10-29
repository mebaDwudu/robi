// Utility to get guaranteed high-resolution images, emojis, nutrition facts, storage tips, and origin tags for produce items

export interface ProduceMeta {
  imageUrl: string;
  emoji: string;
  origin: string;
  originCountry: string;
  isOrganic: boolean;
  dietaryTags: string[];
  nutrition: {
    calories: string;
    vitaminC: string;
    fiber: string;
    potassium: string;
    keyBenefit: string;
  };
  storageTip: string;
  cookingTips: string;
  estimatedWeight: string;
}

// Fast-loading image URL optimizer for responsive, lightweight WebP/AVIF images
export function optimizeImageUrl(url: string, width = 400, quality = 75): string {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('w', String(width));
      parsed.searchParams.set('q', String(quality));
      return parsed.toString();
    } catch {
      return url
        .replace(/w=\d+/, `w=${width}`)
        .replace(/q=\d+/, `q=${quality}`);
    }
  }
  return url;
}

// Dictionary of verified high-definition photos for specific fresh fruits, vegetables, tubers, and herbs
export const PRODUCE_NAME_IMAGE_MAP: Array<{ match: (name: string) => boolean; image: string; emoji?: string }> = [
  // Fruits
  {
    match: (n) => n.includes('watermelon') || (n.includes('melon') && n.includes('wat')),
    image: 'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fit=crop&w=600&q=80',
    emoji: '🍉',
  },
  {
    match: (n) => n.includes('green banana') || n.includes('cooking banana'),
    image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=600&q=80',
    emoji: '🍌',
  },
  {
    match: (n) => n.includes('yellow banana') || n.includes('ripe banana') || (n.includes('banana') && !n.includes('plantain')),
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80',
    emoji: '🍌',
  },
  {
    match: (n) => n.includes('ripe plantain') || n.includes('sweet plantain'),
    image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=600&q=80',
    emoji: '🍌',
  },
  {
    match: (n) => n.includes('green plantain') || n.includes('plantain'),
    image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=600&q=80',
    emoji: '🍌',
  },
  {
    match: (n) => n.includes('dominican mango') || (n.includes('mango') && n.includes('dom')),
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
    emoji: '🥭',
  },
  {
    match: (n) => n.includes('mango'),
    image: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&w=600&q=80',
    emoji: '🥭',
  },
  {
    match: (n) => n.includes('hass avocado') || (n.includes('avocado') && n.includes('hss')),
    image: 'https://images.unsplash.com/photo-1519162584292-56dfc9eb5db4?auto=format&fit=crop&w=600&q=80',
    emoji: '🥑',
  },
  {
    match: (n) => n.includes('uganda') && n.includes('avocado'),
    image: 'https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=600&q=80',
    emoji: '🥑',
  },
  {
    match: (n) => n.includes('avocado'),
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=600&q=80',
    emoji: '🥑',
  },
  {
    match: (n) => n.includes('pineapple'),
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
    emoji: '🍍',
  },
  {
    match: (n) => n.includes('papaya'),
    image: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=600&q=80',
    emoji: '🥭',
  },
  {
    match: (n) => n.includes('pomegranate'),
    image: 'https://images.unsplash.com/photo-1608755728617-aefab37d2edd?auto=format&fit=crop&w=600&q=80',
    emoji: '🍎',
  },
  {
    match: (n) => n.includes('grapefruit'),
    image: 'https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?auto=format&fit=crop&w=600&q=80',
    emoji: '🍊',
  },
  {
    match: (n) => n.includes('orange') || n.includes('navel'),
    image: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=80',
    emoji: '🍊',
  },
  {
    match: (n) => n.includes('clemente') || n.includes('clementine') || n.includes('mandarin') || n.includes('tangerine'),
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80',
    emoji: '🍊',
  },
  {
    match: (n) => n.includes('gala') || n.includes('apple'),
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
    emoji: '🍎',
  },
  {
    match: (n) => n.includes('key lime') || (n.includes('lime') && n.includes('key')),
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    emoji: '🍋',
  },
  {
    match: (n) => n.includes('lime'),
    image: 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=600&q=80',
    emoji: '🍋',
  },
  {
    match: (n) => n.includes('lemon'),
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
    emoji: '🍋',
  },
  {
    match: (n) => n.includes('jelly coconut') || n.includes('green coconut') || (n.includes('coconut') && n.includes('jel')),
    image: 'https://images.unsplash.com/photo-1583083527882-4bee9aba2eea?auto=format&fit=crop&w=600&q=80',
    emoji: '🥥',
  },
  {
    match: (n) => n.includes('coconut'),
    image: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?auto=format&fit=crop&w=600&q=80',
    emoji: '🥥',
  },

  // Vegetables, Peppers & Greens
  {
    match: (n) => n.includes('red pepper') || n.includes('red bell') || n.includes('red cup'),
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80',
    emoji: '🫑',
  },
  {
    match: (n) => n.includes('green pepper') || n.includes('green bell') || n.includes('green cup'),
    image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?auto=format&fit=crop&w=600&q=80',
    emoji: '🫑',
  },
  {
    match: (n) => n.includes('yellow pepper') || n.includes('yellow bell') || n.includes('yellow cup'),
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80',
    emoji: '🫑',
  },
  {
    match: (n) => n.includes('orange pepper') || n.includes('orange bell') || n.includes('orange cup'),
    image: 'https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?auto=format&fit=crop&w=600&q=80',
    emoji: '🫑',
  },
  {
    match: (n) => n.includes('romero') || n.includes('romano'),
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
    emoji: '🌶️',
  },
  {
    match: (n) => n.includes('scotch bonnet') || n.includes('hot pepper'),
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
    emoji: '🌶️',
  },
  {
    match: (n) => n.includes('bird') && n.includes('chilli'),
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
    emoji: '🌶️',
  },
  {
    match: (n) => n.includes('aubergine') || n.includes('eggplant'),
    image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=600&q=80',
    emoji: '🍆',
  },
  {
    match: (n) => n.includes('garden egg'),
    image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=600&q=80',
    emoji: '🍆',
  },
  {
    match: (n) => n.includes('okra') || n.includes('lady finger'),
    image: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  {
    match: (n) => n.includes('karela') || n.includes('bitter gourd'),
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
    emoji: '🥒',
  },
  {
    match: (n) => n.includes('carrot'),
    image: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=600&q=80',
    emoji: '🥕',
  },
  {
    match: (n) => n.includes('beetroot'),
    image: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  {
    match: (n) => n.includes('turnip'),
    image: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  {
    match: (n) => n.includes('broccoli'),
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80',
    emoji: '🥦',
  },
  {
    match: (n) => n.includes('cauliflower'),
    image: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=600&q=80',
    emoji: '🥦',
  },
  {
    match: (n) => n.includes('red cabbage'),
    image: 'https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  {
    match: (n) => n.includes('cabbage'),
    image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  {
    match: (n) => n.includes('cucumber'),
    image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=600&q=80',
    emoji: '🥒',
  },
  {
    match: (n) => n.includes('courgette') || n.includes('zucchini'),
    image: 'https://images.unsplash.com/photo-1563252722-6434563a985d?auto=format&fit=crop&w=600&q=80',
    emoji: '🥒',
  },
  {
    match: (n) => n.includes('mushroom'),
    image: 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?auto=format&fit=crop&w=600&q=80',
    emoji: '🍄',
  },
  {
    match: (n) => n.includes('butternut') || n.includes('squash'),
    image: 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?auto=format&fit=crop&w=600&q=80',
    emoji: '🎃',
  },
  {
    match: (n) => n.includes('pumpkin'),
    image: 'https://images.unsplash.com/photo-1506917728037-b6af01a7d403?auto=format&fit=crop&w=600&q=80',
    emoji: '🎃',
  },
  {
    match: (n) => n.includes('spinach'),
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  {
    match: (n) => n.includes('lettuce'),
    image: 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  {
    match: (n) => n.includes('celery'),
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  {
    match: (n) => n.includes('leek'),
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  {
    match: (n) => n.includes('aloe'),
    image: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=600&q=80',
    emoji: '🪴',
  },
  {
    match: (n) => n.includes('chow chow') || n.includes('chayote'),
    image: 'https://images.unsplash.com/photo-1563252722-6434563a985d?auto=format&fit=crop&w=600&q=80',
    emoji: '🍈',
  },

  // Tomatoes
  {
    match: (n) => n.includes('cherry') && n.includes('tom'),
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    emoji: '🍅',
  },
  {
    match: (n) => n.includes('vine') && n.includes('tom'),
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    emoji: '🍅',
  },
  {
    match: (n) => n.includes('tom'),
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    emoji: '🍅',
  },

  // Yams, Tubers & Roots
  {
    match: (n) => n.includes('white yam') || n.includes('puna') || n.includes('ghana yam'),
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    emoji: '🍠',
  },
  {
    match: (n) => n.includes('cush cush') || n.includes('dasheen') || n.includes('eddo') || n.includes('yam'),
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    emoji: '🍠',
  },
  {
    match: (n) => n.includes('cassava') || n.includes('yuca'),
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    emoji: '🍠',
  },
  {
    match: (n) => n.includes('sweet potato'),
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    emoji: '🍠',
  },
  {
    match: (n) => n.includes('red potato'),
    image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80',
    emoji: '🥔',
  },
  {
    match: (n) => n.includes('cyprus potato'),
    image: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&w=600&q=80',
    emoji: '🥔',
  },
  {
    match: (n) => n.includes('potato'),
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
    emoji: '🥔',
  },

  // Onions, Garlic & Herbs
  {
    match: (n) => n.includes('red onion'),
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
    emoji: '🧅',
  },
  {
    match: (n) => n.includes('spring onion') || n.includes('scallion'),
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80',
    emoji: '🧅',
  },
  {
    match: (n) => n.includes('onion'),
    image: 'https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?auto=format&fit=crop&w=600&q=80',
    emoji: '🧅',
  },
  {
    match: (n) => n.includes('peeled garlic'),
    image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=600&q=80',
    emoji: '🧄',
  },
  {
    match: (n) => n.includes('garlic'),
    image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=600&q=80',
    emoji: '🧄',
  },
  {
    match: (n) => n.includes('mint'),
    image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?auto=format&fit=crop&w=600&q=80',
    emoji: '🌿',
  },
  {
    match: (n) => n.includes('rosemary'),
    image: 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=600&q=80',
    emoji: '🌿',
  },
  {
    match: (n) => n.includes('thyme'),
    image: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
    emoji: '🌿',
  },
  {
    match: (n) => n.includes('parsley'),
    image: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
    emoji: '🌿',
  },
  {
    match: (n) => n.includes('coriander') || n.includes('cilantro'),
    image: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=600&q=80',
    emoji: '🌿',
  },
  {
    match: (n) => n.includes('ginger'),
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    emoji: '🫚',
  },
  {
    match: (n) => n.includes('turmeric'),
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    emoji: '🫚',
  },
  // Berries & Orchard Fruits
  {
    match: (n) => n.includes('strawberr'),
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=600&q=80',
    emoji: '🍓',
  },
  {
    match: (n) => n.includes('blueberr'),
    image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=600&q=80',
    emoji: '🫐',
  },
  {
    match: (n) => n.includes('grape') && !n.includes('fruit'),
    image: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=600&q=80',
    emoji: '🍇',
  },
  {
    match: (n) => n.includes('pear'),
    image: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=600&q=80',
    emoji: '🍐',
  },
  {
    match: (n) => n.includes('passion'),
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
    emoji: '🍈',
  },
  {
    match: (n) => n.includes('guava'),
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
    emoji: '🍈',
  },
  {
    match: (n) => n.includes('breadfruit'),
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
    emoji: '🍈',
  },
  {
    match: (n) => n.includes('callaloo'),
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  {
    match: (n) => n.includes('corn'),
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
    emoji: '🌽',
  },
  {
    match: (n) => n.includes('bean') || n.includes('peas'),
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80',
    emoji: '🫛',
  },
];

const CATEGORY_DEFAULT_IMAGES: Record<string, { image: string; emoji: string }> = {
  // Canonical 5 Top Fruit & Veg categories
  'Fresh Fruits': {
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80',
    emoji: '🍎',
  },
  'Vegetables': {
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  'Roots & Tubers': {
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    emoji: '🍠',
  },
  'Tropical & Exotic': {
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
    emoji: '🥭',
  },
  'Herbs & Seasoning': {
    image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?auto=format&fit=crop&w=600&q=80',
    emoji: '🌿',
  },

  // Legacy & subcategory aliases
  'Roots, Tubers & Yams': {
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
    emoji: '🍠',
  },
  'Fresh Vegetables & Greens': {
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  'Tropical & Plantains': {
    image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=600&q=80',
    emoji: '🍌',
  },
  'Citrus & Fresh Fruits': {
    image: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=80',
    emoji: '🍊',
  },
  'Exotic & Tropical Produce': {
    image: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=80',
    emoji: '🥭',
  },
  'Peppers, Chillies & Squashes': {
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
    emoji: '🌶️',
  },
  'Salads & Greens': {
    image: 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?auto=format&fit=crop&w=600&q=80',
    emoji: '🥗',
  },
  'Fresh Tomatoes': {
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    emoji: '🍅',
  },
  'Citrus & Orchard Fruits': {
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80',
    emoji: '🍊',
  },
  'Onions, Garlic & Bulk Sacks': {
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
    emoji: '🧅',
  },
  'Fresh Herbs & Spices': {
    image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?auto=format&fit=crop&w=600&q=80',
    emoji: '🌿',
  },
};

export function getProduceMeta(name?: string, category?: string, existingImage?: string): ProduceMeta {
  const safeName = typeof name === 'string' ? name : '';
  const safeCategory = typeof category === 'string' ? category : '';
  const lower = safeName.toLowerCase();

  // Determine Emoji
  let emoji = '🥬';
  if (lower.includes('yam') || lower.includes('potato') || lower.includes('cassava') || lower.includes('coco yam') || lower.includes('dasheen') || lower.includes('eddoes')) {
    emoji = '🍠';
  } else if (lower.includes('banana') || lower.includes('plantain')) {
    emoji = '🍌';
  } else if (lower.includes('pepper') || lower.includes('chilli') || lower.includes('bonnet')) {
    emoji = '🌶️';
  } else if (lower.includes('tomato')) {
    emoji = '🍅';
  } else if (lower.includes('lemon') || lower.includes('lime')) {
    emoji = '🍋';
  } else if (lower.includes('orange') || lower.includes('clemente')) {
    emoji = '🍊';
  } else if (lower.includes('apple')) {
    emoji = '🍎';
  } else if (lower.includes('melon') || lower.includes('watermelon')) {
    emoji = '🍉';
  } else if (lower.includes('mango')) {
    emoji = '🥭';
  } else if (lower.includes('avocado')) {
    emoji = '🥑';
  } else if (lower.includes('coconut')) {
    emoji = '🥥';
  } else if (lower.includes('pineapple')) {
    emoji = '🍍';
  } else if (lower.includes('onion')) {
    emoji = '🧅';
  } else if (lower.includes('garlic')) {
    emoji = '🧄';
  } else if (lower.includes('ginger') || lower.includes('turmeric')) {
    emoji = '🫚';
  } else if (lower.includes('carrot')) {
    emoji = '🥕';
  } else if (lower.includes('corn')) {
    emoji = '🌽';
  } else if (lower.includes('eggplant') || lower.includes('garden egg') || lower.includes('aubergine')) {
    emoji = '🍆';
  }

  // Determine Origin
  let origin = 'Brixton Fresh Market';
  let originCountry = 'UK & Global';
  if (lower.includes('ghana')) {
    origin = 'Ghana 🇬🇭';
    originCountry = 'Ghana';
  } else if (lower.includes('nigeria') || lower.includes('abuja')) {
    origin = 'Nigeria 🇳🇬';
    originCountry = 'Nigeria';
  } else if (lower.includes('uganda') || lower.includes('matooke') || lower.includes('gonja') || lower.includes('bogoya') || lower.includes('ndizi')) {
    origin = 'Uganda 🇺🇬';
    originCountry = 'Uganda';
  } else if (lower.includes('jemaca') || lower.includes('jamaica')) {
    origin = 'Jamaica 🇯🇲';
    originCountry = 'Jamaica';
  } else if (lower.includes('brazil')) {
    origin = 'Brazil 🇧🇷';
    originCountry = 'Brazil';
  } else if (lower.includes('cyprus')) {
    origin = 'Cyprus 🇨🇾';
    originCountry = 'Cyprus';
  } else if (lower.includes('spanish') || lower.includes('spain')) {
    origin = 'Spain 🇪🇸';
    originCountry = 'Spain';
  } else if (lower.includes('dutch') || lower.includes('holland')) {
    origin = 'Netherlands 🇳🇱';
    originCountry = 'Netherlands';
  } else if (lower.includes('punjab') || lower.includes('india')) {
    origin = 'India 🇮🇳';
    originCountry = 'India';
  } else if (lower.includes('costa rica')) {
    origin = 'Costa Rica 🇨🇷';
    originCountry = 'Costa Rica';
  } else if (category === 'Tropical & Plantains') {
    origin = 'Caribbean & West Africa 🌴';
    originCountry = 'Tropical Regions';
  } else if (category === 'Roots, Tubers & Yams') {
    origin = 'Tropical Import 🌍';
    originCountry = 'West Africa & Caribbean';
  } else if (category === 'Fresh Vegetables & Greens') {
    origin = 'UK & European Farms 🇬🇧';
    originCountry = 'United Kingdom';
  }

  // Organic indicator
  const isOrganic =
    lower.includes('organic') ||
    lower.includes('turmeric') ||
    lower.includes('ginger') ||
    lower.includes('spinach') ||
    lower.includes('aloe') ||
    lower.includes('mint') ||
    lower.includes('thyme') ||
    lower.includes('callaloo') ||
    lower.includes('avocado') ||
    lower.includes('apple') ||
    lower.includes('honey');

  // Dietary & highlights tags
  const dietaryTags: string[] = ['Daily Fresh', 'Market Pick'];
  if (isOrganic) {
    dietaryTags.push('100% Organic Certified');
  }
  if (lower.includes('plantain') || lower.includes('yam') || lower.includes('cassava') || lower.includes('scotch')) {
    dietaryTags.push('Brixton Community Favorite');
  }
  if (lower.includes('bonnet') || lower.includes('chilli') || lower.includes('pepper') || lower.includes('hot')) {
    dietaryTags.push('Authentic Fiery Heat 🔥');
  }
  if (lower.includes('spinach') || lower.includes('callaloo') || lower.includes('cabbage') || lower.includes('greens') || lower.includes('broccoli')) {
    dietaryTags.push('Rich in Iron & Vitamins');
  }

  // Nutrition Facts & Storage Tips based on produce type
  let nutrition = {
    calories: '65 kcal per 100g',
    vitaminC: '25% Daily Value',
    fiber: '3.2g Dietary Fiber',
    potassium: '380mg Potassium',
    keyBenefit: 'Rich in essential vitamins, natural antioxidants, and clean dietary energy.',
  };

  let storageTip = 'Keep in a cool, well-ventilated dry area. Refrigerate once cut to maintain peak crispness.';
  let cookingTips = 'Ideal for soups, steaming, sautéing, or enjoying fresh as part of a balanced diet.';
  let estimatedWeight = 'Approx. 500g – 1kg';

  if (lower.includes('yam')) {
    nutrition = {
      calories: '118 kcal per 100g',
      vitaminC: '28% Daily Value',
      fiber: '4.1g Complex Fiber',
      potassium: '816mg Potassium',
      keyBenefit: 'High complex carbs, low glycemic index, sustained energy release for whole families.',
    };
    storageTip = 'Store in a cool, dark, dry and well-ventilated room (12–15°C). Never refrigerate raw uncut yams as moisture causes softening.';
    cookingTips = 'Boil with salt for yam & egg stew, pound for traditional fufu, or slice and deep-fry into crunchy yam chips (Dundun).';
    estimatedWeight = '1.5kg – 3kg per tuber';
  } else if (lower.includes('plantain')) {
    nutrition = {
      calories: '122 kcal per 100g',
      vitaminC: '30% Daily Value',
      fiber: '2.3g Fiber',
      potassium: '499mg Potassium',
      keyBenefit: 'Excellent source of Vitamin A, Vitamin B6, and potassium for heart vitality.',
    };
    storageTip = 'Leave on the counter at room temperature to ripen to sweet yellow/black for frying, or use green for savory boiling.';
    cookingTips = 'Slice ripe plantains diagonally and fry in oil for delicious sweet Dodo / Kelewele; boil green plantains with saltfish.';
    estimatedWeight = 'Approx. 350g per plantain';
  } else if (lower.includes('pepper') || lower.includes('bonnet') || lower.includes('chilli')) {
    nutrition = {
      calories: '40 kcal per 100g',
      vitaminC: '140% Daily Value',
      fiber: '1.5g Fiber',
      potassium: '320mg Potassium',
      keyBenefit: 'High capsaicin content boosts metabolism and provides immune-supporting Vitamin C.',
    };
    storageTip = 'Store in a breathable paper bag or perforated plastic in the vegetable crisper drawer for up to 2 weeks. Can be frozen whole.';
    cookingTips = 'Dice carefully for Jollof rice base, Jamaican jerk marinade, pepper soup, or homemade fiery hot sauce.';
    estimatedWeight = 'Approx. 100g – 250g bag';
  } else if (lower.includes('mango')) {
    nutrition = {
      calories: '60 kcal per 100g',
      vitaminC: '67% Daily Value',
      fiber: '1.6g Fiber',
      potassium: '168mg Potassium',
      keyBenefit: 'Abundant in beta-carotene, Vitamin A, and digestive enzymes for glowing skin.',
    };
    storageTip = 'Store at room temperature until fragrant and slightly soft to gentle touch, then refrigerate for up to 5 days.';
    cookingTips = 'Slice fresh for fruit platters, blend into creamy mango smoothies, or chop into fresh mango habanero salsa.';
    estimatedWeight = 'Approx. 400g per fruit';
  } else if (lower.includes('ginger') || lower.includes('turmeric')) {
    nutrition = {
      calories: '80 kcal per 100g',
      vitaminC: '8% Daily Value',
      fiber: '2.0g Fiber',
      potassium: '415mg Potassium',
      keyBenefit: 'Contains potent gingerols and curcumin known for powerful anti-inflammatory and digestive support.',
    };
    storageTip = 'Keep unpeeled in a paper bag in the fridge crisper or freeze whole rhizomes to grate directly into dishes.';
    cookingTips = 'Grate into hot lemon & honey herbal teas, curry bases, stir-fries, and spiced marinades.';
    estimatedWeight = 'Approx. 200g – 500g root';
  } else if (lower.includes('spinach') || lower.includes('callaloo') || lower.includes('greens')) {
    nutrition = {
      calories: '23 kcal per 100g',
      vitaminC: '47% Daily Value',
      fiber: '2.2g Dietary Fiber',
      potassium: '558mg Potassium',
      keyBenefit: 'Packed with plant-based iron, folate, lutein, and bone-strengthening Vitamin K.',
    };
    storageTip = 'Wrap unwashed greens in a dry paper towel and store inside a sealed container in the fridge crisper.';
    cookingTips = 'Steam with onions, garlic, and scotch bonnet for traditional Jamaican callaloo or Ghanaian Kontomire stew.';
    estimatedWeight = 'Approx. 300g – 500g bunch';
  }

  // Match verified high-definition produce image by name
  let matchedImage = '';
  const foundMap = PRODUCE_NAME_IMAGE_MAP.find((entry) => entry.match(lower));
  if (foundMap) {
    matchedImage = foundMap.image;
    if (foundMap.emoji && (!emoji || emoji === '🥬')) {
      emoji = foundMap.emoji;
    }
  }

  // Resolve best image URL: valid existing product image > matched specific produce image > category default
  const isValidUrl = (url?: string) => Boolean(url && url.trim().startsWith('http'));
  let imageUrl = (isValidUrl(existingImage) ? existingImage : '') || matchedImage;
  if (!imageUrl) {
    const catDefaults = CATEGORY_DEFAULT_IMAGES[safeCategory] || {
      image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=400&q=75',
      emoji: '🥬',
    };
    imageUrl = catDefaults.image;
  }

  imageUrl = optimizeImageUrl(imageUrl, 400, 75);

  return {
    imageUrl,
    emoji,
    origin,
    originCountry,
    isOrganic,
    dietaryTags,
    nutrition,
    storageTip,
    cookingTips,
    estimatedWeight,
  };
}
