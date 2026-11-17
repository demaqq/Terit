import express, { Request, Response } from 'express';
import { ThinkingLevel } from '@google/genai';
import { ai } from './gemini.js';

export const apiRouter = express.Router();

apiRouter.use(express.json());

const BUSINESS_NICHE_GUIDANCE: Record<string, string> = {
  pharmacy:
    'Pharmacy & Healthcare Dispensary: Emphasize EFDA batch/lot traceability, FEFO (First-Expired, First-Out) rotation, quarantine triggers for <=30d and <=90d expiry risk, WHO 2°C–8°C cold-chain integrity for insulin & vaccines, blister strip (10s) vs hospital box (100s) dispensing accuracy, and EPSS / Addis pharmaceutical distributor lead times.',
  building:
    'Building Materials & Hardware Yard: Emphasize 12m Grade 60 deformed rebar weight conversion ((2*D^2)/27 kg/bar), 4% cutting scrap buffer, tying wire (12kg/ton), 50kg OPC/PPC 42.5R cement FIFO rotation before 60–90 day hydration caking, raised pallet & tarp moisture protection, Isuzu FSR (11T) / Sino Tipper (35T) / Pickup (3T) axle payload compliance, 3% HCB block offloading breakage allowance, and contractor credit terms in ETB.',
  supermarket:
    'Supermarket & Grocery: Emphasize multi-aisle FMCG turnover, daily fresh produce/dairy/bakery markdown optimization to prevent food waste, 4°C chilled wall integrity, weekend peak shelf replenishment, and competitive ETB unit retail margins.',
  minimarket:
    'Minimarket & Neighborhood Express Store: Emphasize daily fast-turn replenishment (bottled water crates, fresh bread, milk, soft drinks, soap, cooking oil pouches), express POS velocity, lean backroom working capital, and Telebirr / CBE Birr micro-credit control.',
  shop:
    'Retail Shop & Boutique: Emphasize garment/footwear size-run balance (XS–XXL / EU 39–45), detecting broken size runs and slow-moving seasonal stock, clearance markdown liquidity recovery in ETB, and direct customer loyalty/proforma sales.',
  store:
    'Wholesale Depot & Distribution Center: Emphasize pallet bay utilization %, floor slab load limits (metric tons), Modjo Dry Port & Djibouti container drayage lead times, MOQ & B2B bulk tier rebates (1–9, 10–24, 25+ pallets), dock receiving verification, and multi-depot FIFO/FEFO transfers.',
  other:
    'General Commercial & Multi-Branch Operations: Emphasize cross-branch stock requisition balancing, landed unit cost breakdown (freight, customs duty, handling in ETB), flexible UoM conversions, and corporate procurement planning.',
};

const getNicheGuidance = (businessType?: string): string =>
  BUSINESS_NICHE_GUIDANCE[(businessType || 'shop').toLowerCase()] || BUSINESS_NICHE_GUIDANCE.shop;

// Multi-turn chat endpoint
apiRouter.post('/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages, modelMode, inventoryContext, language, businessType } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const modelName = modelMode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';
    const nicheGuidance = getNicheGuidance(businessType);

    const systemInstruction = `You are Terit Copilot (ጥሪት ኮፓይለት in Amharic/Tigrinya), an elite AI inventory, supply chain, and sector operations specialist embedded in Terit Stock & Operations Management OS.

LANGUAGE & MULTILINGUAL CONVERSATION PROTOCOL (CRITICAL REQUIREMENT):
You must converse with native fluency, cultural precision, and domain accuracy across all 5 supported languages:
1. English (en)
2. Amharic / አማርኛ (am) - Written in Ge'ez script (ፊደል). App brand in Amharic is strictly 'ጥሪት' (Terit).
3. Afaan Oromoo (om) - Written in Quubee Latin orthography.
4. Tigrinya / ትግርኛ (ti) - Written in Ge'ez script (ፊደል). App brand in Tigrinya is strictly 'ጥሪት'.
5. Somali / Af Soomaali (so) - Written in standard Somali Latin orthography.

STRICT LANGUAGE MATCHING RULES:
- ALWAYS identify the language of the user's latest query and reply 100% in that exact language.
- If the user writes in Amharic, Afaan Oromoo, Tigrinya, or Somali, respond 100% in that language using authentic, professional business terminology without clumsy parenthetical English glosses.
- If the user's query is purely numbers, a SKU code, or language-neutral, reply in the active client language: ${language || 'en'}.

DOMAIN TERMINOLOGY BENCHMARKS:
- Currency: ALWAYS use Ethiopian Birr (ETB / ብር / Birrii). Never quote in USD unless specifically asked.
- In Amharic: ክምችት (Inventory), አነስተኛ ክምችት ማስጠንቀቂያ (Low stock alert), ያለቀ ክምችት (Out of stock), የግዢ ማዘዣ (PO), አቅራቢ (Supplier), የደንበኞች ብድር (Customer Credit), የችርቻሮ ዋጋ / የመግዣ ዋጋ (Retail/Cost Price).
- In Afaan Oromoo: Kuusaa (Inventory), Hanqina Kuusaa (Low stock), Ajaja Bittaa (PO), Dhiyeessaa (Supplier), Liqii Maamiltootaa (Credit), Gatii Gurgurtaa / Seensaa (Retail/Cost Price).
- In Tigrinya: ክምችት / መኽዘን (Inventory), ሕጽረት ኣቑሑት (Low stock), ናይ ዕድጊት ትእዛዝ (PO), ኣቕራቢ (Supplier), ልቓሕ ዓማዊል (Credit), ዋጋ መሸጣ / ምዕዳግ (Retail/Cost Price).
- In Somali: Kaydka Alaabta (Inventory), Digniinta Alaabta Yar (Low stock), Dalabka Soo Iibinta (PO), Qeybiyaha (Supplier), Deynta Macaamiisha (Credit), Qiimaha Iibka / Asalka (Retail/Cost Price).

ACTIVE BUSINESS MODEL SPECIALIZATION (${(businessType || 'shop').toUpperCase()}):
${nicheGuidance}
Tailor every calculation, operational checklist, terminology choice, and recommendation strictly to this business model and the live SKUs below. Do NOT give generic advice for other industries when specific SKUs or workflows for ${(businessType || 'shop').toUpperCase()} exist in context.

RESPONSE FORMATTING DISCIPLINE:
- Clean, structured, concise, mobile-readable output.
- Use clear headings and standard numbered lists (1., 2.) or bullet points (-). Keep text clean without cluttered markdown formatting.

LIVE INVENTORY CONTEXT:
${inventoryContext ? JSON.stringify(inventoryContext, null, 2) : 'No live items context passed.'}

Deliver actionable, mathematically sound, sector-specific operations leadership.`;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const config: Record<string, unknown> = { systemInstruction };
    if (modelName === 'gemini-4-hydrogen') {
      if (modelMode === 'complex') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config,
    });
    const reply = response.text || 'I could not generate a response. Please try again.';
    res.json({ reply, modelUsed: modelName });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate chat response',
    });
  }
});

// Smart Audit & Restock Recommender
apiRouter.post('/gemini/audit-stock', async (req: Request, res: Response) => {
  try {
    const { items, suppliers, businessType, language } = req.body;
    const nicheGuidance = getNicheGuidance(businessType);

    const prompt = `Perform a sector-specific operational & procurement stock audit for this ${(businessType || 'commercial').toUpperCase()} workspace. Respond in language code "${language || 'en'}" and report all currency values in Ethiopian Birr (ETB).

Sector Priorities:
${nicheGuidance}

Inventory items: ${JSON.stringify(items || [])}
Suppliers: ${JSON.stringify(suppliers || [])}

Identify:
1. Urgent Stockout & Expiry/Spoilage Risks (items where quantity <= minStockAlert, or near-expiry batches).
2. Overstocked Items / Dead Capital tied up in ETB.
3. Recommended Purchase Orders (with suggested reorder quantities and supplier pairings).
4. Total Estimated Reorder Budget in ETB and top 3 immediate action steps.
Format cleanly with numbered sections and concise bullets.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction: `You are an elite Ethiopian supply chain auditor specializing in ${(businessType || 'commercial').toUpperCase()} operations. All costs and valuations must be stated in ETB.`,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
      },
    });

    res.json({ auditReport: response.text || 'Audit completed without remarks.' });
  } catch (error: any) {
    console.error('Error in /api/gemini/audit-stock:', error);
    res.status(500).json({
      error: error?.message || 'Failed to audit stock',
    });
  }
});

