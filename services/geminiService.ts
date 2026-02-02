
import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem } from "../types";

export const getLuckAnalysis = async (inventory: InventoryItem[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const inventoryDesc = inventory
    .map(i => `${i.weapon} | ${i.name} (${i.rarity})`)
    .slice(0, 10)
    .join(', ');

  const prompt = `Act as a sarcastic CS2 case opening veteran. Analyze this player's recent inventory and give them a "Luck Score" (0-100) and a short, witty comment about their drops. 
  Inventory: ${inventoryDesc || 'Empty - just starting out.'}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            comment: { type: Type.STRING }
          },
          required: ["score", "comment"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { score: 0, comment: "The AI is too stunned by your bad luck to speak." };
  }
};
