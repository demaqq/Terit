import { Catalog, CatalogCategory, it } from './types';

// Food retail. The supermarket uses the full range; the minimarket uses the fast-turnover
// subset plus neighbourhood-shop extras.
const E = { expiry: true } as const;

export const supermarket: Catalog = [
  {
    id: 'grains', name: 'Grains, Flour & Pasta', local: 'እህል እና ዱቄት',
    items: [
      it('teff', 'Teff', 'kg', { local: 'ጤፍ', variants: ['White (Magna)', 'Mixed (Sergegna)', 'Red'], fast: true }),
      it('wheat-flour', 'Wheat Flour', 'bags', { local: 'የስንዴ ዱቄት', variants: ['5kg', '10kg', '25kg', '50kg'], fast: true, ...E }),
      it('rice', 'Rice', 'bags', { local: 'ሩዝ', variants: ['1kg', '5kg', '25kg'], fast: true }),
      it('pasta', 'Pasta', 'packs', { local: 'ፓስታ', variants: ['500g', '1kg'], fast: true, pack: 20, ...E }),
      it('macaroni', 'Macaroni', 'packs', { local: 'መኮሮኒ', variants: ['500g', '1kg'], pack: 20, ...E }),
      it('oats', 'Oats', 'packs', { variants: ['500g', '1kg'], ...E }),
      it('barley', 'Barley / Kinche', 'kg', { local: 'ገብስ / ቅንጬ' }),
    ],
  },
  {
    id: 'pulses-spices', name: 'Pulses, Spices & Sugar', local: 'ጥራጥሬ እና ቅመማ ቅመም',
    items: [
      it('misir', 'Red Lentils', 'kg', { local: 'ምስር', variants: ['Whole', 'Split'], fast: true }),
      it('kik', 'Split Peas', 'kg', { local: 'ክክ' }),
      it('shimbra', 'Chickpeas', 'kg', { local: 'ሽንብራ' }),
      it('shiro', 'Shiro Powder', 'kg', { local: 'ሽሮ', variants: ['Plain', 'Spiced (Mitin)'], fast: true }),
      it('berbere', 'Berbere', 'kg', { local: 'በርበሬ', fast: true }),
      it('mitmita', 'Mitmita', 'packs', { local: 'ሚጥሚጣ' }),
      it('salt', 'Salt', 'packs', { local: 'ጨው', variants: ['500g iodized', '1kg iodized'], fast: true }),
      it('sugar', 'Sugar', 'kg', { local: 'ስኳር', variants: ['1kg pack', 'Loose kg', '50kg sack'], fast: true }),
    ],
  },
  {
    id: 'oil', name: 'Cooking Oil & Fats', local: 'ዘይት እና ቅቤ',
    items: [
      it('sunflower', 'Sunflower Oil', 'bottles', { local: 'የሱፍ ዘይት', variants: ['1L', '3L', '5L'], fast: true, ...E }),
      it('palm', 'Palm Oil', 'bottles', { local: 'የፓልም ዘይት', variants: ['1L', '3L', '5L', '20L'], fast: true, ...E }),
      it('kibbeh', 'Spiced Butter (Niter Kibbeh)', 'kg', { local: 'ንጥር ቅቤ', ...E }),
      it('margarine', 'Margarine', 'pcs', { variants: ['250g', '500g'], ...E }),
    ],
  },
  {
    id: 'dairy', name: 'Dairy & Eggs', local: 'ወተት እና እንቁላል',
    items: [
      it('milk', 'Fresh Milk', 'pcs', { local: 'ወተት', variants: ['500ml', '1L'], fast: true, ...E, cold: true }),
      it('yogurt', 'Yogurt', 'pcs', { local: 'እርጎ', variants: ['200ml', '500ml', '1L'], ...E, cold: true }),
      it('ayib', 'Cottage Cheese (Ayib)', 'kg', { local: 'አይብ', ...E, cold: true }),
      it('cheese', 'Cheese', 'pcs', { variants: ['200g', '500g'], ...E, cold: true }),
      it('eggs', 'Eggs', 'pcs', { local: 'እንቁላል', variants: ['Single', 'Tray of 30'], fast: true, ...E }),
      it('butter', 'Butter', 'pcs', { local: 'ቅቤ', variants: ['250g', '500g'], ...E, cold: true }),
    ],
  },
  {
    id: 'bakery', name: 'Bakery', local: 'ዳቦ ቤት',
    items: [
      it('bread', 'Bread', 'pcs', { local: 'ዳቦ', variants: ['Small', 'Large', 'Sliced loaf'], fast: true, ...E }),
      it('injera', 'Injera', 'pcs', { local: 'እንጀራ', fast: true, ...E }),
      it('cake', 'Cake / Pastry', 'pcs', { local: 'ኬክ', ...E }),
    ],
  },
  {
    id: 'meat', name: 'Meat & Poultry', local: 'ስጋ',
    items: [
      it('beef', 'Beef', 'kg', { local: 'የበሬ ስጋ', variants: ['Fillet', 'Mixed cut', 'Minced'], ...E, cold: true }),
      it('chicken', 'Chicken', 'kg', { local: 'ዶሮ', variants: ['Whole', 'Pieces'], ...E, cold: true }),
      it('fish', 'Fish', 'kg', { local: 'አሳ', ...E, cold: true }),
    ],
  },
  {
    id: 'produce', name: 'Fruit & Vegetables', local: 'አትክልት እና ፍራፍሬ',
    items: [
      it('onion', 'Red Onion', 'kg', { local: 'ቀይ ሽንኩርት', fast: true, ...E }),
      it('tomato', 'Tomato', 'kg', { local: 'ቲማቲም', fast: true, ...E }),
      it('potato', 'Potato', 'kg', { local: 'ድንች', fast: true, ...E }),
      it('garlic', 'Garlic', 'kg', { local: 'ነጭ ሽንኩርት', ...E }),
      it('ginger', 'Ginger', 'kg', { local: 'ዝንጅብል', ...E }),
      it('cabbage', 'Cabbage', 'kg', { local: 'ጎመን', ...E }),
      it('carrot', 'Carrot', 'kg', { local: 'ካሮት', ...E }),
      it('pepper', 'Green Pepper', 'kg', { local: 'ቃሪያ', ...E }),
      it('banana', 'Banana', 'kg', { local: 'ሙዝ', fast: true, ...E }),
      it('avocado', 'Avocado', 'kg', { local: 'አቮካዶ', ...E }),
      it('orange', 'Orange', 'kg', { local: 'ብርቱካን', ...E }),
      it('mango', 'Mango', 'kg', { local: 'ማንጎ', ...E }),
    ],
  },
  {
    id: 'beverages', name: 'Beverages, Coffee & Tea', local: 'መጠጦች',
    items: [
      it('water', 'Bottled Water', 'pcs', { local: 'የታሸገ ውሃ', variants: ['0.5L', '1L', '2L', 'Pack of 12 (0.5L)'], fast: true, pack: 12, ...E }),
      it('soft', 'Soft Drink', 'pcs', { local: 'ለስላሳ መጠጥ', variants: ['Bottle 300ml', 'Bottle 1L', 'Can 330ml', 'Crate of 24'], fast: true, pack: 24, ...E }),
      it('juice', 'Juice', 'pcs', { local: 'ጭማቂ', variants: ['250ml', '1L'], ...E }),
      it('coffee', 'Coffee', 'kg', { local: 'ቡና', variants: ['Green beans', 'Roasted beans', 'Ground 250g'], fast: true }),
      it('tea', 'Tea', 'packs', { local: 'ሻይ', variants: ['Leaves 100g', 'Bags 25', 'Bags 100'], fast: true, ...E }),
      it('malt', 'Malt Drink', 'pcs', { ...E }),
    ],
  },
  {
    id: 'snacks', name: 'Snacks & Confectionery', local: 'መክሰስ',
    items: [
      it('biscuit', 'Biscuits', 'packs', { local: 'ብስኩት', fast: true, pack: 24, ...E }),
      it('chocolate', 'Chocolate', 'pcs', { local: 'ቸኮሌት', ...E }),
      it('candy', 'Candy / Sweets', 'packs', { local: 'ከረሜላ', fast: true, ...E }),
      it('kolo', 'Roasted Barley Snack (Kolo)', 'packs', { local: 'ቆሎ', ...E }),
      it('chips', 'Crisps / Chips', 'packs', { ...E }),
    ],
  },
  {
    id: 'household', name: 'Household & Cleaning', local: 'የቤት ውስጥ ጽዳት',
    items: [
      it('detergent', 'Laundry Detergent Powder', 'packs', { local: 'ኦሞ', variants: ['Sachet 45g', '500g', '1kg', '3kg'], fast: true }),
      it('bar-soap', 'Laundry Bar Soap', 'pcs', { local: 'የልብስ ሳሙና', fast: true, pack: 24 }),
      it('dish', 'Dishwashing Liquid', 'bottles', { variants: ['500ml', '1L'] }),
      it('bleach', 'Bleach', 'bottles', { local: 'በረኪና', variants: ['500ml', '1L'] }),
      it('toilet-paper', 'Toilet Paper', 'rolls', { local: 'ሶፍት', variants: ['Single roll', 'Pack of 10'], fast: true }),
      it('tissue', 'Facial Tissue', 'boxes'),
      it('charcoal', 'Charcoal', 'bags', { local: 'ከሰል' }),
    ],
  },
  {
    id: 'personal', name: 'Personal Care & Baby', local: 'የግል ንጽህና',
    items: [
      it('soap', 'Bath Soap', 'pcs', { local: 'የገላ ሳሙና', fast: true, pack: 72 }),
      it('shampoo', 'Shampoo', 'bottles', { variants: ['Sachet', '200ml', '400ml'] }),
      it('toothpaste', 'Toothpaste', 'pcs', { local: 'የጥርስ ሳሙና', variants: ['50ml', '100ml'], fast: true }),
      it('toothbrush', 'Toothbrush', 'pcs'),
      it('pads', 'Sanitary Pads', 'packs', { local: 'ሞዴስ', fast: true }),
      it('lotion', 'Body Lotion / Petroleum Jelly', 'pcs', { variants: ['Lotion 400ml', 'Vaseline 100ml'] }),
      it('diapers', 'Baby Diapers', 'packs', { local: 'ዳይፐር', variants: ['Newborn', 'Small', 'Medium', 'Large'], fast: true }),
      it('formula', 'Infant Formula', 'pcs', { variants: ['Stage 1', 'Stage 2'], ...E }),
      it('cereal', 'Baby Cereal', 'pcs', { ...E }),
    ],
  },
];

const pick = (catId: string, ids: string[]): CatalogCategory => {
  const cat = supermarket.find((c) => c.id === catId)!;
  return { ...cat, items: cat.items.filter((i) => ids.includes(i.id)) };
};

export const minimarket: Catalog = [
  pick('bakery', ['bread', 'injera']),
  pick('dairy', ['milk', 'yogurt', 'eggs']),
  pick('beverages', ['water', 'soft', 'juice', 'tea', 'coffee']),
  pick('grains', ['wheat-flour', 'rice', 'pasta', 'macaroni']),
  pick('pulses-spices', ['misir', 'shiro', 'berbere', 'salt', 'sugar']),
  pick('oil', ['sunflower', 'palm']),
  pick('snacks', ['biscuit', 'candy', 'kolo', 'chocolate']),
  pick('household', ['detergent', 'bar-soap', 'toilet-paper', 'bleach', 'charcoal']),
  pick('personal', ['soap', 'toothpaste', 'pads', 'diapers', 'lotion']),
  {
    id: 'convenience', name: 'Convenience Extras', local: 'ተጨማሪ',
    items: [
      it('airtime', 'Mobile Airtime Voucher', 'pcs', { local: 'የሞባይል ካርድ', variants: ['5 Birr', '10 Birr', '25 Birr', '50 Birr', '100 Birr'], fast: true }),
      it('matches', 'Matches', 'boxes', { local: 'ክብሪት', fast: true, pack: 10 }),
      it('candles', 'Candles', 'pcs', { local: 'ሻማ', fast: true }),
      it('batteries', 'Batteries', 'pcs', { local: 'ባትሪ', variants: ['AA', 'AAA', 'D'] }),
      it('kerosene', 'Kerosene', 'L', { local: 'ነጭ ጋዝ' }),
      it('plastic-bags', 'Carry Bags', 'packs', { local: 'ፌስታል' }),
    ],
  },
];
