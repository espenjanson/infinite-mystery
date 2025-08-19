import OpenAI from "openai";

class OpenAIService {
  private client: OpenAI | null = null;
  private apiKey: string = "";

  initialize(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateCaseIllustration(safeImagePrompt: string): Promise<string> {
    if (!this.client) {
      throw new Error("OpenAI API not initialized. Please set your API key.");
    }

    // Extra safety layer - ensure prompt is completely clean
    const cleanPrompt = `${safeImagePrompt}

    Style: Classic film noir artistic illustration, black and white photography aesthetic, dramatic lighting and shadows, vintage 1940s atmosphere, cinematic composition. Family-friendly artistic illustration suitable for all audiences.
    
    Visual elements: Architectural details, dramatic window lighting, urban streetscapes, vintage clothing, classic automobiles, atmospheric weather effects, period-appropriate interior design.`;

    console.log("Sending prompt to OpenAI:", cleanPrompt); // Debug log

    try {
      const response = await this.client.images.generate({
        model: "gpt-image-1",
        prompt: cleanPrompt,
        size: "1024x1536",
      });

      const imageBase64 = response.data?.[0]?.b64_json;
      if (!imageBase64) {
        throw new Error("No image data received");
      }

      // Return as data URL for React Native Image component
      return `data:image/png;base64,${imageBase64}`;
    } catch (error) {
      console.error("Error generating case illustration:", error);
      console.error("Prompt that failed:", cleanPrompt); // Debug log
      throw error;
    }
  }
}

export default new OpenAIService();
