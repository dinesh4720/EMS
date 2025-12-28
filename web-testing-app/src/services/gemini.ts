import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Missing Gemini API Key');
}

const genAI = new GoogleGenerativeAI(API_KEY);
// Default to the latest stable model, but we will allow fallback/checks
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function logAvailableModels() {
    try {
        // Unfortunately, the client SDK might not expose listModels directly in the simplified interface
        // We have to use the model manager if available, or just rely on documentation.
        // But we can try a fetch if the SDK exposes it? 
        // Actually, let's just log a helpful message.
        console.log("Checking available models...");
        // This is a rough way to check, usually requires a separate API call not easily done via the helper 
        // without more setup. 
        // Instead, let's try a fallback chain.
    } catch (e) {
        console.error("Could not list models", e);
    }
}

export async function tryGenerateWithFallback(prompt: string, imageParts: any[] = []) {
    // User requested specific model: gemini-3-flash-preview
    // We also keep others as fallback
    const modelsToTry = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    
    // Note: 'gemini-3-flash-preview' is likely not a valid API model name yet (current latest is 2.0-flash-exp or 1.5).
    // However, if the user insists or has special access, we can try it. 
    // But commonly users mistake the model name. 
    // I will add "gemini-2.0-flash-exp" which is the latest preview, and "gemini-1.5-flash-8b"
    
    // Let's try to interpret "gemini-3-flash-preview" as potentially "gemini-2.0-flash-exp" or just add it if they really mean it.
    // I'll add it to the top of the list as requested.
    modelsToTry.unshift("gemini-3-flash-preview"); 
    
    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting to generate with model: ${modelName}`);
            const currentModel = genAI.getGenerativeModel({ model: modelName });
            const result = await currentModel.generateContent([prompt, ...imageParts]);
            return await result.response;
        } catch (error: any) {
            console.warn(`Failed with ${modelName}:`, error.message);
            // If it's not a 404 (Not Found), it might be a key issue (403), so we shouldn't just keep trying if the key is bad.
            if (!error.message.includes("404") && !error.message.includes("not found")) {
                throw error;
            }
        }
    }
    throw new Error("All model attempts failed. Please check your API key and region availability.");
}

export interface AnalysisRequest {
  screenshots: string[]; // Base64 strings
  testResults: any[];
  testDescription: string;
}

export interface AnalysisResponse {
  analysis: string;
  issuesFound: string[];
  recommendations: string[];
  confidence: number;
}

export async function analyzeTestResults(data: AnalysisRequest): Promise<AnalysisResponse> {
  try {
    const prompt = `
      Analyze the following web application test results.
      
      Test Description: ${data.testDescription}
      
      Test Execution Results:
      ${JSON.stringify(data.testResults, null, 2)}
      
      Please provide a JSON response with the following structure:
      {
        "analysis": "Detailed analysis of what happened",
        "issuesFound": ["List of specific issues"],
        "recommendations": ["List of recommendations"],
        "confidence": 0.95 (number between 0 and 1)
      }
      
      Attached are screenshots from the test execution.
    `;

    const imageParts = data.screenshots.map(base64Data => {
        // Remove data URL prefix if present
        const cleanBase64 = base64Data.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
        return {
            inlineData: {
                data: cleanBase64,
                mimeType: "image/png"
            }
        };
    });

    const response = await tryGenerateWithFallback(prompt, imageParts);
    const text = response.text();
    
    // Extract JSON from response (handle markdown code blocks if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse JSON from Gemini response");
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      analysis: "Failed to generate analysis due to an error.",
      issuesFound: ["Analysis error"],
      recommendations: ["Check API key and network connection"],
      confidence: 0
    };
  }
}

export async function generateTestCases(description: string): Promise<any[]> {
    try {
        const prompt = `
            Generate a list of test cases for a web application based on this description:
            "${description}"

            Return a JSON array of test cases. Each test case should have:
            - name: string
            - description: string
            - actions: array of objects { type: "click"|"input"|"navigate"|"wait", selector?: string, value?: string, description: string }
            - expected_results: object { description: string }
        `;

        const response = await tryGenerateWithFallback(prompt);
        const text = response.text();
        
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [];
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        return [];
    }
}
