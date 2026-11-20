import { Catalog, it } from './types';

// Community pharmacy / drug store. Common items from Ethiopia's essential medicines practice.
// Every medicine is batch- and expiry-tracked; cold-chain items are flagged.
// Prescription status follows EFDA rules; controlled substances are deliberately not listed.
const E = { expiry: true } as const;

const catalog: Catalog = [
  {
    id: 'analgesics', name: 'Pain & Fever', local: 'የህመም ማስታገሻ',
    items: [
      it('pcm', 'Paracetamol', 'strips', { ...E, variants: ['500mg tablet', '120mg/5ml syrup 60ml', '125mg suppository'], fast: true }),
      it('ibu', 'Ibuprofen', 'strips', { ...E, variants: ['200mg', '400mg', '100mg/5ml syrup'], fast: true }),
      it('diclo', 'Diclofenac', 'strips', { ...E, variants: ['50mg tablet', '75mg/3ml injection', 'Gel 1%'] }),
      it('asa', 'Aspirin', 'strips', { ...E, variants: ['75mg', '300mg'] }),
    ],
  },
  {
    id: 'antibiotics', name: 'Antibiotics', local: 'አንቲባዮቲክ',
    items: [
      it('amox', 'Amoxicillin', 'strips', { ...E, variants: ['250mg capsule', '500mg capsule', '125mg/5ml suspension', '250mg/5ml suspension'], fast: true,
        note: 'Prescription only. Store suspensions dry; reconstitute at dispensing.' }),
      it('amoxclav', 'Amoxicillin + Clavulanic acid', 'strips', { ...E, variants: ['625mg', '1g', '228mg/5ml suspension'] }),
      it('cipro', 'Ciprofloxacin', 'strips', { ...E, variants: ['250mg', '500mg', 'Eye/ear drops 0.3%'] }),
      it('azithro', 'Azithromycin', 'strips', { ...E, variants: ['250mg', '500mg', '200mg/5ml suspension'] }),
      it('doxy', 'Doxycycline 100mg', 'strips', { ...E }),
      it('metro', 'Metronidazole', 'strips', { ...E, variants: ['250mg', '500mg', '200mg/5ml suspension'], fast: true }),
      it('cotri', 'Cotrimoxazole', 'strips', { ...E, variants: ['480mg', '960mg', '240mg/5ml suspension'] }),
      it('cloxa', 'Cloxacillin', 'strips', { ...E, variants: ['250mg', '500mg'] }),
      it('ceftri', 'Ceftriaxone injection', 'vials', { ...E, variants: ['500mg', '1g'] }),
      it('nitro', 'Nitrofurantoin 100mg', 'strips', { ...E }),
    ],
  },
  {
    id: 'antimalarial', name: 'Antimalarials & Antiparasitics', local: 'የወባ እና የትላትል መድኃኒት',
    items: [
      it('al', 'Artemether + Lumefantrine (20/120mg)', 'boxes', { ...E, variants: ['6 tablets', '12 tablets', '18 tablets', '24 tablets'] }),
      it('cq', 'Chloroquine 250mg', 'strips', { ...E }),
      it('pq', 'Primaquine 7.5mg', 'strips', { ...E }),
      it('alben', 'Albendazole', 'pcs', { ...E, variants: ['400mg tablet', '200mg/5ml suspension'], fast: true }),
      it('meben', 'Mebendazole 100mg', 'strips', { ...E }),
      it('tinid', 'Tinidazole 500mg', 'strips', { ...E }),
    ],
  },
  {
    id: 'gi', name: 'Stomach & Digestion', local: 'የሆድ እና የምግብ መፍጨት',
    items: [
      it('ors', 'ORS (Oral Rehydration Salts)', 'sachets', { ...E, fast: true, pack: 50 }),
      it('zinc', 'Zinc 20mg dispersible', 'strips', { ...E }),
      it('omep', 'Omeprazole 20mg', 'strips', { ...E, fast: true }),
      it('antacid', 'Antacid (Magnesium/Aluminium)', 'bottles', { ...E, variants: ['Suspension 200ml', 'Chewable tablets'] }),
      it('loper', 'Loperamide 2mg', 'strips', { ...E }),
      it('hyosc', 'Hyoscine Butylbromide 10mg', 'strips', { ...E }),
      it('metoclo', 'Metoclopramide 10mg', 'strips', { ...E }),
    ],
  },
  {
    id: 'chronic', name: 'Blood Pressure, Heart & Diabetes', local: 'የደም ግፊት እና የስኳር',
    items: [
      it('amlo', 'Amlodipine', 'strips', { ...E, variants: ['5mg', '10mg'], fast: true }),
      it('enal', 'Enalapril', 'strips', { ...E, variants: ['5mg', '10mg', '20mg'] }),
      it('hctz', 'Hydrochlorothiazide 25mg', 'strips', { ...E }),
      it('aten', 'Atenolol 50mg', 'strips', { ...E }),
      it('atorva', 'Atorvastatin', 'strips', { ...E, variants: ['10mg', '20mg', '40mg'] }),
      it('metf', 'Metformin', 'strips', { ...E, variants: ['500mg', '850mg', '1000mg'], fast: true }),
      it('glib', 'Glibenclamide 5mg', 'strips', { ...E }),
      it('insulin', 'Insulin', 'vials', { ...E, cold: true, variants: ['NPH 100 IU/ml', 'Regular 100 IU/ml', 'Mixed 70/30', 'Glargine pen'],
        note: 'Store at 2–8°C. Never freeze. Log fridge temperature daily.' }),
    ],
  },
  {
    id: 'respiratory', name: 'Cough, Cold & Allergy', local: 'የሳል እና የአለርጂ',
    items: [
      it('salb', 'Salbutamol', 'pcs', { ...E, variants: ['Inhaler 100mcg', '4mg tablet strip', '2mg/5ml syrup'] }),
      it('pred', 'Prednisolone 5mg', 'strips', { ...E }),
      it('cough', 'Cough Syrup', 'bottles', { ...E, variants: ['Dry cough', 'Productive cough', 'Children'] , fast: true }),
      it('cetir', 'Cetirizine 10mg', 'strips', { ...E, fast: true }),
      it('lorat', 'Loratadine 10mg', 'strips', { ...E }),
      it('chlorph', 'Chlorphenamine 4mg', 'strips', { ...E }),
    ],
  },
  {
    id: 'vitamins', name: 'Vitamins & Supplements', local: 'ቫይታሚኖች',
    items: [
      it('ifa', 'Iron + Folic Acid', 'strips', { ...E, fast: true }),
      it('folic', 'Folic Acid 5mg', 'strips', { ...E }),
      it('multi', 'Multivitamin', 'bottles', { ...E, variants: ['Tablets 30', 'Syrup 100ml'] }),
      it('vitc', 'Vitamin C', 'strips', { ...E, variants: ['500mg', '1000mg effervescent'] }),
      it('calcium', 'Calcium + Vitamin D', 'bottles', { ...E }),
      it('vitd', 'Vitamin D3', 'bottles', { ...E, variants: ['1000 IU', '5000 IU'] }),
    ],
  },
  {
    id: 'topical', name: 'Skin, Eye & Ear', local: 'የቆዳ፣ የዓይን እና የጆሮ',
    items: [
      it('tetra-eye', 'Tetracycline Eye Ointment 1%', 'pcs', { ...E }),
      it('genta-eye', 'Gentamicin Eye Drops', 'pcs', { ...E }),
      it('clotri', 'Clotrimazole', 'pcs', { ...E, variants: ['Cream 1%', 'Vaginal tablet'] }),
      it('flucon', 'Fluconazole 150mg', 'pcs', { ...E }),
      it('hydrocort', 'Hydrocortisone Cream 1%', 'pcs', { ...E }),
      it('silver', 'Silver Sulfadiazine Cream', 'pcs', { ...E }),
      it('whitfield', "Whitfield's Ointment", 'pcs', { ...E }),
      it('calamine', 'Calamine Lotion', 'bottles', { ...E }),
    ],
  },
  {
    id: 'maternal', name: 'Family Planning & Maternal', local: 'የቤተሰብ ዕቅድ',
    items: [
      it('coc', 'Combined Oral Contraceptive', 'packs', { ...E }),
      it('ec', 'Emergency Contraceptive', 'packs', { ...E }),
      it('dmpa', 'Injectable Contraceptive (DMPA)', 'vials', { ...E }),
      it('preg-test', 'Pregnancy Test Strip', 'pcs', { ...E, fast: true }),
      it('condom', 'Condoms', 'packs', { ...E, fast: true }),
      it('oxytocin', 'Oxytocin 10 IU injection', 'ampoules', { ...E, cold: true, note: 'Store at 2–8°C.' }),
    ],
  },
  {
    id: 'supplies', name: 'Medical Supplies & Devices', local: 'የሕክምና ቁሳቁሶች',
    items: [
      it('gauze', 'Sterile Gauze', 'packs', { ...E, variants: ['5×5cm', '10×10cm'] }),
      it('cotton', 'Absorbent Cotton', 'rolls', { variants: ['100g', '500g'] }),
      it('bandage', 'Elastic Bandage', 'rolls', { variants: ['7.5cm', '10cm', '15cm'] }),
      it('plaster', 'Adhesive Plaster', 'boxes', { fast: true }),
      it('syringe', 'Syringe with Needle', 'pcs', { ...E, variants: ['2ml', '3ml', '5ml', '10ml'], pack: 100 }),
      it('cannula', 'IV Cannula', 'pcs', { ...E, variants: ['G18', 'G20', 'G22', 'G24'] }),
      it('iv-fluid', 'IV Fluid 500ml', 'bottles', { ...E, variants: ['Normal Saline', "Ringer's Lactate", 'Dextrose 5%'] }),
      it('gloves', 'Examination Gloves', 'boxes', { variants: ['S', 'M', 'L'] }),
      it('mask', 'Surgical Mask', 'boxes', { fast: true }),
      it('alcohol', 'Alcohol 70% / Swabs', 'pcs', { variants: ['Bottle 500ml', 'Swabs box'] }),
      it('thermo', 'Digital Thermometer', 'pcs'),
      it('bp', 'Blood Pressure Monitor', 'pcs'),
      it('gluco-strip', 'Glucometer Test Strips', 'boxes', { ...E }),
    ],
  },
];

export default catalog;
