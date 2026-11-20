import { Catalog, it } from './types';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const KIDS = ['2-3y', '4-5y', '6-7y', '8-9y', '10-12y'];

// Shop & boutique: apparel by size run, footwear by EU size, plus beauty and phone accessories.
export const shop: Catalog = [
  {
    id: 'women', name: 'Women’s Clothing', local: 'የሴቶች ልብስ',
    items: [
      it('dress', 'Dress', 'pcs', { local: 'ቀሚስ', variants: SIZES, fast: true }),
      it('blouse', 'Blouse / Top', 'pcs', { variants: SIZES, fast: true }),
      it('skirt', 'Skirt', 'pcs', { variants: SIZES }),
      it('w-jeans', 'Women’s Jeans', 'pcs', { variants: ['26', '28', '30', '32', '34', '36'] }),
      it('habesha-kemis', 'Habesha Kemis', 'pcs', { local: 'የሀበሻ ቀሚስ', variants: SIZES, note: 'Seasonal peaks: Meskel, Enkutatash, Timket and weddings.' }),
      it('netela', 'Netela / Gabi', 'pcs', { local: 'ነጠላ / ጋቢ' }),
    ],
  },
  {
    id: 'men', name: 'Men’s Clothing', local: 'የወንዶች ልብስ',
    items: [
      it('shirt', 'Shirt', 'pcs', { local: 'ሸሚዝ', variants: SIZES, fast: true }),
      it('tshirt', 'T-shirt', 'pcs', { variants: SIZES, fast: true }),
      it('trousers', 'Trousers', 'pcs', { local: 'ሱሪ', variants: ['30', '32', '34', '36', '38', '40'] }),
      it('m-jeans', 'Men’s Jeans', 'pcs', { variants: ['30', '32', '34', '36', '38'], fast: true }),
      it('suit', 'Suit', 'pcs', { local: 'ሙሉ ልብስ', variants: ['46', '48', '50', '52', '54'] }),
      it('jacket', 'Jacket / Sweater', 'pcs', { variants: SIZES }),
      it('m-traditional', 'Men’s Traditional Wear', 'pcs', { local: 'የባህል ልብስ', variants: SIZES }),
    ],
  },
  {
    id: 'kids', name: 'Children’s Clothing', local: 'የልጆች ልብስ',
    items: [
      it('k-set', 'Kids’ Outfit Set', 'sets', { variants: KIDS }),
      it('uniform', 'School Uniform', 'sets', { local: 'የትምህርት ቤት ዩኒፎርም', variants: KIDS, note: 'Peak demand: late August–September.' }),
      it('baby', 'Baby Clothing', 'pcs', { variants: ['0-6m', '6-12m', '12-24m'] }),
    ],
  },
  {
    id: 'footwear', name: 'Footwear', local: 'ጫማ',
    items: [
      it('sneakers', 'Sneakers', 'pairs', { local: 'ስኒከር', variants: SHOE_SIZES, fast: true }),
      it('leather-shoes', 'Leather Shoes', 'pairs', { local: 'የቆዳ ጫማ', variants: SHOE_SIZES }),
      it('sandals', 'Sandals / Slippers', 'pairs', { local: 'ነጠላ ጫማ', variants: SHOE_SIZES, fast: true }),
      it('boots', 'Boots', 'pairs', { variants: SHOE_SIZES }),
      it('heels', 'Women’s Heels', 'pairs', { variants: ['36', '37', '38', '39', '40', '41'] }),
    ],
  },
  {
    id: 'accessories', name: 'Bags & Accessories', local: 'ቦርሳ እና መለዋወጫ',
    items: [
      it('bag', 'Handbag / Backpack', 'pcs', { local: 'ቦርሳ', variants: ['Handbag', 'Backpack', 'School bag'] }),
      it('belt', 'Belt', 'pcs', { local: 'ቀበቶ', variants: ['S', 'M', 'L'] }),
      it('wallet', 'Wallet', 'pcs', { local: 'ቦርሳ (የኪስ)' }),
      it('scarf', 'Scarf / Shawl', 'pcs', { local: 'ሻርፕ' }),
      it('cap', 'Cap / Hat', 'pcs', { local: 'ኮፍያ' }),
      it('sunglasses', 'Sunglasses', 'pcs', { local: 'መነጽር' }),
      it('watch', 'Wristwatch', 'pcs', { local: 'ሰዓት' }),
      it('jewelry', 'Jewellery', 'pcs', { local: 'ጌጣጌጥ', variants: ['Necklace', 'Earrings', 'Bracelet', 'Ring'] }),
    ],
  },
  {
    id: 'beauty', name: 'Beauty & Cosmetics', local: 'የውበት ዕቃዎች',
    items: [
      it('perfume', 'Perfume', 'bottles', { local: 'ሽቶ', variants: ['30ml', '50ml', '100ml'], expiry: true }),
      it('lotion', 'Body Lotion', 'bottles', { variants: ['200ml', '400ml'], expiry: true, fast: true }),
      it('hair-ext', 'Hair Extensions / Wig', 'pcs', { local: 'ሂውማን ሄር / ዊግ', variants: ['Synthetic', 'Human hair'] }),
      it('hair-oil', 'Hair Oil / Cream', 'pcs', { expiry: true }),
      it('makeup', 'Makeup', 'pcs', { variants: ['Foundation', 'Lipstick', 'Mascara', 'Powder'], expiry: true }),
      it('nail', 'Nail Polish', 'pcs', { expiry: true }),
    ],
  },
  {
    id: 'phone-acc', name: 'Phone & Electronics Accessories', local: 'የሞባይል መለዋወጫ',
    items: [
      it('charger', 'Phone Charger', 'pcs', { local: 'ቻርጀር', variants: ['USB-C', 'Micro-USB', 'Lightning', 'Fast charger'], fast: true }),
      it('cable', 'USB Cable', 'pcs', { variants: ['USB-C', 'Micro-USB', 'Lightning'], fast: true }),
      it('earphones', 'Earphones / Headphones', 'pcs', { local: 'ኤርፎን', variants: ['Wired', 'Wireless'], fast: true }),
      it('powerbank', 'Power Bank', 'pcs', { variants: ['10,000mAh', '20,000mAh'] }),
      it('memory', 'Memory Card / Flash Drive', 'pcs', { variants: ['16GB', '32GB', '64GB', '128GB'] }),
      it('case', 'Phone Case', 'pcs' ),
      it('screen', 'Screen Protector', 'pcs', { fast: true }),
    ],
  },
];

// Wholesale depot & warehouse: bulk units, pallets and pack sizes for order rounding.
export const store: Catalog = [
  {
    id: 'bulk-food', name: 'Bulk Food Staples', local: 'የጅምላ ምግብ',
    items: [
      it('w-sugar', 'Sugar 50kg Sack', 'sacks', { local: 'ስኳር', fast: true, pack: 20, expiry: true }),
      it('w-flour', 'Wheat Flour 50kg Sack', 'sacks', { local: 'ዱቄት', fast: true, pack: 20, expiry: true }),
      it('w-rice', 'Rice 25/50kg Sack', 'sacks', { local: 'ሩዝ', variants: ['25kg', '50kg'], pack: 20 }),
      it('w-oil', 'Edible Oil Jerrycan', 'jerrycans', { local: 'ዘይት', variants: ['5L', '20L'], fast: true, pack: 4, expiry: true }),
      it('w-pasta', 'Pasta Carton', 'cartons', { variants: ['20×500g', '10×1kg'], pack: 50, expiry: true }),
      it('w-lentils', 'Lentils / Pulses Sack', 'sacks', { variants: ['Lentils 50kg', 'Split peas 50kg', 'Chickpeas 50kg'] }),
      it('w-teff', 'Teff Quintal', 'quintals', { local: 'ጤፍ', variants: ['White', 'Mixed', 'Red'] }),
      it('w-salt', 'Salt 25kg Sack', 'sacks', { local: 'ጨው' }),
    ],
  },
  {
    id: 'bulk-bev', name: 'Beverages (Crates & Pallets)', local: 'መጠጦች',
    items: [
      it('w-water', 'Bottled Water Pallet', 'pallets', { variants: ['0.5L', '1L', '2L'], fast: true, expiry: true }),
      it('w-soft', 'Soft Drink Crate', 'crates', { variants: ['24×300ml', '12×1L'], fast: true, pack: 50, expiry: true }),
      it('w-beer', 'Beer Crate', 'crates', { variants: ['24×330ml'], expiry: true }),
      it('w-juice', 'Juice Carton', 'cartons', { variants: ['24×250ml', '12×1L'], expiry: true }),
    ],
  },
  {
    id: 'bulk-household', name: 'Household Goods (Cartons)', local: 'የቤት ውስጥ ዕቃዎች',
    items: [
      it('w-detergent', 'Detergent Carton', 'cartons', { variants: ['72×45g sachets', '20×500g', '10×1kg'], fast: true, pack: 30 }),
      it('w-soap', 'Soap Carton', 'cartons', { variants: ['Bath soap 72pcs', 'Laundry bar 24pcs'], fast: true, pack: 30 }),
      it('w-tissue', 'Toilet Paper Bale', 'bales', { variants: ['48 rolls', '96 rolls'] }),
      it('w-diapers', 'Diaper Bale', 'bales' ),
    ],
  },
  {
    id: 'bulk-construction', name: 'Construction (Bulk)', local: 'የግንባታ (በጅምላ)',
    items: [
      it('w-cement', 'Cement Pallet (40×50kg)', 'pallets', { variants: ['OPC 42.5R', 'PPC 32.5N'] }),
      it('w-rebar', 'Rebar Bundle', 'tons', { variants: ['Ø8mm', 'Ø10mm', 'Ø12mm', 'Ø16mm', 'Ø20mm'] }),
      it('w-cgi', 'Corrugated Sheet Bundle', 'bundles', { variants: ['G28', 'G30', 'G32'] }),
    ],
  },
  {
    id: 'agri', name: 'Agricultural Inputs', local: 'የእርሻ ግብዓቶች',
    items: [
      it('fert', 'Fertilizer 50kg', 'sacks', { local: 'ማዳበሪያ', variants: ['DAP', 'Urea', 'NPS'] }),
      it('seed', 'Improved Seed', 'kg', { local: 'ዘር', variants: ['Wheat', 'Maize', 'Teff'], expiry: true }),
      it('agrochem', 'Agro-chemicals', 'L', { variants: ['Herbicide', 'Insecticide', 'Fungicide'], expiry: true }),
      it('feed', 'Animal Feed 50kg', 'sacks', { variants: ['Poultry', 'Dairy'], expiry: true }),
    ],
  },
  {
    id: 'packaging', name: 'Packaging & Handling', local: 'ማሸጊያ',
    items: [
      it('carton', 'Corrugated Carton', 'pcs', { variants: ['Small', 'Medium', 'Large'] }),
      it('sack', 'Polypropylene Sack', 'pcs', { local: 'ማዳበሪያ ከረጢት', variants: ['25kg', '50kg'] }),
      it('stretch', 'Stretch Film', 'rolls'),
      it('strap', 'Strapping Band', 'rolls'),
      it('pallet', 'Wooden Pallet', 'pcs'),
      it('pallet-truck', 'Hand Pallet Truck', 'pcs'),
    ],
  },
  {
    id: 'lubricants', name: 'Lubricants & Spare Parts', local: 'ዘይት እና መለዋወጫ',
    items: [
      it('engine-oil', 'Engine Oil', 'L', { variants: ['4L', '20L', '208L drum'] }),
      it('grease', 'Grease', 'kg'),
      it('filter', 'Oil / Air Filter', 'pcs'),
      it('tyre', 'Tyre', 'pcs', { variants: ['Light vehicle', 'Truck'] }),
    ],
  },
];

// General trading / enterprise: office, IT, furniture, janitorial and spares.
export const other: Catalog = [
  {
    id: 'stationery', name: 'Office & Stationery', local: 'የቢሮ ዕቃዎች',
    items: [
      it('a4', 'A4 Paper (ream)', 'reams', { local: 'ወረቀት', fast: true, pack: 5 }),
      it('pen', 'Pens', 'boxes', { local: 'እስክሪብቶ', variants: ['Blue', 'Black', 'Red'], fast: true }),
      it('file', 'Box File / Folder', 'pcs'),
      it('notebook', 'Exercise Book / Notebook', 'pcs', { local: 'ደብተር', variants: ['50 pages', '100 pages', '200 pages'], fast: true }),
      it('stapler', 'Stapler & Staples', 'pcs'),
      it('toner', 'Printer Toner / Ink', 'pcs', { variants: ['Black', 'Colour'] }),
    ],
  },
  {
    id: 'it', name: 'IT & Electronics', local: 'ኤሌክትሮኒክስ',
    items: [
      it('laptop', 'Laptop', 'pcs'),
      it('desktop', 'Desktop Computer', 'pcs'),
      it('printer', 'Printer', 'pcs', { variants: ['Laser', 'Inkjet', 'Receipt (thermal)'] }),
      it('ups', 'UPS / Stabilizer', 'pcs', { variants: ['650VA', '1000VA', '1500VA'] }),
      it('net-cable', 'Network Cable Cat6', 'rolls'),
      it('router', 'Router / Switch', 'pcs'),
    ],
  },
  {
    id: 'furniture', name: 'Office Furniture', local: 'የቢሮ እቃዎች',
    items: [
      it('chair', 'Office Chair', 'pcs'),
      it('desk', 'Desk', 'pcs'),
      it('shelf', 'Shelf / Cabinet', 'pcs'),
    ],
  },
  {
    id: 'janitorial', name: 'Cleaning & Janitorial', local: 'የጽዳት እቃዎች',
    items: [
      it('j-detergent', 'Detergent', 'kg'),
      it('j-mop', 'Mop & Bucket', 'sets'),
      it('j-bin', 'Waste Bin', 'pcs'),
      it('j-sanitizer', 'Hand Sanitizer', 'L', { expiry: true }),
    ],
  },
  {
    id: 'spares', name: 'Spare Parts & Consumables', local: 'መለዋወጫ',
    items: [
      it('o-engine-oil', 'Engine Oil', 'L', { variants: ['4L', '20L'] }),
      it('o-filter', 'Filters', 'pcs', { variants: ['Oil', 'Air', 'Fuel'] }),
      it('o-battery', 'Vehicle Battery', 'pcs', { variants: ['45Ah', '70Ah', '100Ah'] }),
      it('o-tyre', 'Tyre', 'pcs'),
    ],
  },
];
