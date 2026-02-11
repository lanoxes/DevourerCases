import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem } from "../types";

export const getLuckAnalysis = async (inventory: InventoryItem[]) => {
  // Creating a new instance right before call ensures we use the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const inventoryDesc = inventory
    .map(i => `${i.weapon} | ${i.name} (${i.rarity})`)
    .slice(0, 15) // Analyze a bit more for better feedback
    .join(', ');

  const prompt = `Act as the "Neural Mascot" (a high-tech cyberpunk girl/vibe). Analyze this player's recent CS2 inventory. 
  Give them a "Luck Score" (0-100) and a short, witty, high-tech comment about their drops. 
  Be slightly mysterious but encouraging.
  Inventory: ${inventoryDesc || 'Empty - no assets secured yet.'}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.NUMBER,
              description: "A luck score between 0 and 100"
            },
            comment: { 
              type: Type.STRING,
              description: "A witty cyberpunk comment about the player's items"
            }
          },
          required: ["score", "comment"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Neural Sync Error:", error);
    return { 
      score: 404, 
      comment: "Connection unstable. Your luck is currently fluctuating in the digital void. Recalibrate and try again." 
    };
  }
};