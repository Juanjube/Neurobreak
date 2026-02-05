
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateBrainInsight(fatigueLevel: string, lang: string = 'en') {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a one-sentence scientific brain health insight for a user currently experiencing ${fatigueLevel} cognitive fatigue. Respond in ${lang === 'es' ? 'Spanish' : 'English'}. Keep it concise.`,
    });
    return response.text;
  }

  async explainMovement(title: string, benefit: string, lang: string = 'en') {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain the scientific "Why" behind the movement "${title}" which claims to "${benefit}". Respond in ${lang === 'es' ? 'Spanish' : 'English'}. Use 2 sentences with anatomical terms.`,
    });
    return response.text;
  }

  async generateInstructions(title: string, category: string, lang: string = 'en') {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide 3 clear, numbered steps on how to perform the exercise "${title}" (${category}). Respond in ${lang === 'es' ? 'Spanish' : 'English'}. Keep steps short and actionable.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["steps"]
        }
      }
    });
    return JSON.parse(response.text).steps;
  }

  async generateSynergyTip(lang: string = 'en') {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Give one unique nutritional synergy (e.g., Vitamin C + Iron) for brain health with a brief explanation. Respond in ${lang === 'es' ? 'Spanish' : 'English'}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            description: { type: Type.STRING },
            icon: { type: Type.STRING }
          },
          required: ["title", "subtitle", "description", "icon"]
        }
      }
    });
    return JSON.parse(response.text);
  }
}

export const geminiService = new GeminiService();
