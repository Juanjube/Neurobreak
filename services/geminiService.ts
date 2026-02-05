import OpenAI from "openai";

export class AIService {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      console.error("❌ Falta la API Key de Groq");
      return;
    }

    // Inicializamos el cliente apuntando a los servidores de Groq
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.groq.com/openai/v1", // <--- Esto redirige a Groq
      dangerouslyAllowBrowser: true // Necesario para Vite/React
    });
  }

  // Función genérica para no repetir código
  private async askAI(prompt: string, jsonMode: boolean = false) {
    if (!this.client) return null;

    try {
      const completion = await this.client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile", // Modelo rápido y gratuito de Meta
        response_format: jsonMode ? { type: "json_object" } : { type: "text" },
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("Error AI:", error);
      return null;
    }
  }

  generateBrainInsight = async (fatigueLevel: string, lang: string = 'en') => {
    const prompt = `Provide a one-sentence scientific brain health insight for a user currently experiencing ${fatigueLevel} cognitive fatigue. Respond in ${lang === 'es' ? 'Spanish' : 'English'}. Keep it concise.`;
    
    const result = await this.askAI(prompt);
    return result || "Unable to generate insight.";
  }

  explainMovement = async (title: string, benefit: string, lang: string = 'en') => {
    const prompt = `Explain the scientific "Why" behind the movement "${title}" which claims to "${benefit}". Respond in ${lang === 'es' ? 'Spanish' : 'English'}. Use 2 sentences with anatomical terms.`;
    
    const result = await this.askAI(prompt);
    return result || "Unable to explain movement.";
  }

  generateInstructions = async (title: string, category: string, lang: string = 'en') => {
    // Para JSON en Llama 3, es IMPORTANTE decirle explícitamente en el prompt que devuelva JSON
    const prompt = `You are a fitness expert. Provide 3 clear, numbered steps on how to perform the exercise "${title}" (${category}). Respond in ${lang === 'es' ? 'Spanish' : 'English'}. Keep steps short. Return ONLY raw JSON with a "steps" array of strings. Example: {"steps": ["Step 1", "Step 2"]}`;
    
    const result = await this.askAI(prompt, true); // true activa modo JSON
    if (!result) return [];
    try {
        return JSON.parse(result).steps;
    } catch (e) {
        return [];
    }
  }

  generateSynergyTip = async (lang: string = 'en') => {
    const prompt = `Give one unique nutritional synergy for brain health. Respond in ${lang === 'es' ? 'Spanish' : 'English'}. Return ONLY raw JSON with keys: title, subtitle, description, icon.`;
    
    const result = await this.askAI(prompt, true);
    if (!result) return null;
    try {
        return JSON.parse(result);
    } catch (e) {
        return null;
    }
  }
}

// Exportamos con el mismo nombre para no romper tus otros componentes
export const geminiService = new AIService(); 