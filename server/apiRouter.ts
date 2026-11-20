import express, { Request, Response } from 'express';
import { ThinkingLevel } from '@google/genai';
import { ai } from './gemini.js';
import { buildCopilotSystemPrompt, getNicheGuidance } from './prompts.js';

export const apiRouter = express.Router();

apiRouter.use(express.json({ limit: '1mb' }));

// Multi-turn chat endpoint
apiRouter.post('/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages, modelMode, inventoryContext, language, businessType } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }
    if (
      messages.length > 50 ||
      messages.some((m: unknown) => typeof (m as { content?: unknown })?.content !== 'string' || (m as { content: string }).content.length > 8000)
    ) {
      return res.status(400).json({ error: 'Conversation too long or malformed.' });
    }

    const modelName = modelMode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';
    const systemInstruction = buildCopilotSystemPrompt({ language, businessType, inventoryContext });

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
      // Don't forward raw upstream errors (they can expose project/key/config details).
      error: 'Failed to generate chat response',
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
      error: 'Failed to audit stock',
    });
  }
});

