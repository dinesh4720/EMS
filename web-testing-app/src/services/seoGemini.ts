import { tryGenerateWithFallback } from './gemini';

export interface KeywordIdea {
  keyword: string;
  searchVolume: string; // Range or estimate
  difficulty: string;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
}

export interface ContentAnalysis {
  score: number;
  suggestions: string[];
  missingKeywords: string[];
  readability: string;
}

export async function generateKeywordIdeas(seed: string): Promise<KeywordIdea[]> {
  try {
    const prompt = `
      Act as an SEO Specialist. Generate a list of 10 keyword ideas based on the seed keyword: "${seed}".
      For each keyword, provide:
      1. The keyword itself
      2. Estimated search volume (Low/Medium/High)
      3. SEO Difficulty (Easy/Medium/Hard)
      4. Search Intent (Informational, Commercial, Transactional, Navigational)

      Return ONLY a raw JSON array of objects with keys: keyword, searchVolume, difficulty, intent.
      Do not include markdown formatting or code blocks.
    `;

    const response = await tryGenerateWithFallback(prompt);
    const text = response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse keyword ideas");
  } catch (error) {
    console.error("Keyword Research Error:", error);
    return [];
  }
}

export async function analyzeContentForSEO(content: string, targetKeyword: string): Promise<ContentAnalysis> {
  try {
    const prompt = `
      Act as an SEO Content Editor. Analyze the following content for the target keyword: "${targetKeyword}".
      
      Content:
      "${content.substring(0, 5000)}" ... (truncated)

      Provide a JSON response with:
      - score: number (0-100)
      - suggestions: array of strings (specific improvements)
      - missingKeywords: array of strings (related terms to include)
      - readability: string (analysis of reading level)

      Return ONLY raw JSON.
    `;

    const response = await tryGenerateWithFallback(prompt);
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Failed to parse content analysis");
  } catch (error) {
    console.error("Content Analysis Error:", error);
    return {
      score: 0,
      suggestions: ["Error analyzing content"],
      missingKeywords: [],
      readability: "Unknown"
    };
  }
}

export interface ContentBrief {
  titleIdeas: string[];
  metaDescription: string;
  targetAudience: string;
  outline: string[];
  keyQuestions: string[];
}

export async function generateContentBrief(topic: string): Promise<ContentBrief | null> {
  try {
    const prompt = `
      Create a detailed SEO content brief for the topic: "${topic}".
      Include:
      - Title ideas
      - Meta description
      - Target audience
      - Outline (H2, H3)
      - Key questions to answer

      Return as a JSON object.
    `;
    
    const response = await tryGenerateWithFallback(prompt);
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("Brief Generation Error:", error);
    return null;
  }
}
