import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // --- CÓDIGO DE DEBUG ---
      console.log("🔍 Buscando modelos disponibles...");
      fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
        .then(res => res.json())
        .then(data => {
          console.log("📋 LISTA DE MODELOS DISPONIBLES PARA TU CLAVE:", data);
          if (data.error) console.error("❌ ERROR DE CUENTA:", data.error.message);
        })
        .catch(err => console.error("❌ ERROR DE RED:", err));
      // ----------------------
    } else {
      console.error("⚠️ GeminiService: No se encontró la API KEY. Revisa tu archivo .env");
    }
  }

  // USAR ARROW FUNCTIONS (= async () =>) ES CRUCIAL AQUÍ
  // Esto evita que 'this' se pierda cuando lo llamas desde React
  
  generateBrainInsight = async (fatigueLevel: string, lang: string = 'en') => {
    if (!this.model) return "Error: API Key missing or service not initialized.";

    const prompt = `Provide a one-sentence scientific brain health insight for a user currently experiencing ${fatigueLevel} cognitive fatigue. Respond in ${lang === 'es' ? 'Spanish' : 'English'}. Keep it concise.`;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating insight:", error);
      return "Unable to generate insight.";
    }
  }

  explainMovement = async (title: string, benefit: string, lang: string = 'en') => {
    if (!this.model) return "Error: API Key missing.";

    const prompt = `Explain the scientific "Why" behind the movement "${title}" which claims to "${benefit}". Respond in ${lang === 'es' ? 'Spanish' : 'English'}. Use 2 sentences with anatomical terms.`;
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error explaining movement:", error);
      return "Unable to explain movement.";
    }
  }

  generateInstructions = async (title: string, category: string, lang: string = 'en') => {
    if (!this.genAI) return [];

    const prompt = `Provide 3 clear, numbered steps on how to perform the exercise "${title}" (${category}). Respond in ${lang === 'es' ? 'Spanish' : 'English'}. Keep steps short and actionable. Return ONLY raw JSON with a "steps" array of strings.`;
    
    try {
      // Creamos el modelo JSON al vuelo para asegurar la configuración correcta
      const jsonModel = this.genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash", // <--- CAMBIA AQUÍ
  generationConfig: { responseMimeType: "application/json" }
});

      const result = await jsonModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text).steps;
    } catch (error) {
      console.error("Error generating instructions:", error);
      return [];
    }
  }

  generateSynergyTip = async (lang: string = 'en') => {
    if (!this.genAI) return null;

    const prompt = `Give one unique nutritional synergy (e.g., Vitamin C + Iron) for brain health with a brief explanation. Respond in ${lang === 'es' ? 'Spanish' : 'English'}. Return ONLY raw JSON with keys: title, subtitle, description, icon.`;
    
    try {
      const jsonModel = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await jsonModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error("Error generating synergy:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();