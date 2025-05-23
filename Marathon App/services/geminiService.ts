
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SuggestedActivity, ActivityType } from '../types';

// This should be set via environment variables in a real build process
// For this environment, process.env.API_KEY will be picked up automatically by the execution context.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY is not set. Gemini API calls will fail.");
  // Potentially throw an error here or handle it in the calling function
  // to prevent API calls if key is missing.
}

const ai = new GoogleGenAI({ apiKey: API_KEY }); // API_KEY can be undefined here if not set.

export const fetchTrainingPlanSuggestion = async (prompt: string): Promise<SuggestedActivity[]> => {
  if (!API_KEY) { // Double check API_KEY before making a call.
    throw new Error("API Key for Gemini is not configured. Cannot fetch suggestions.");
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // temperature: 0.7, // Optional: Adjust for creativity vs. predictability
      }
    });

    let jsonStr = response.text.trim();
    
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    // Ensure parsing is safe
    let parsedPlan: any[];
    try {
        parsedPlan = JSON.parse(jsonStr);
        if (!Array.isArray(parsedPlan)) {
            console.error("Parsed response is not an array:", parsedPlan);
            throw new Error("Suggestion service returned data in an unexpected format (not an array).");
        }
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", e, "\nRaw response text:", jsonStr);
        throw new Error("Received an invalid JSON format from the suggestion service. Please check the AI's output.");
    }
    
    // Validate and normalize the data
    return parsedPlan.map((activity: any, index: number): SuggestedActivity => {
      // Basic validation for core fields
      if (!activity.date || !activity.type || typeof activity.durationMinutes === 'undefined') {
        console.warn(`Suggested activity at index ${index} is missing core fields:`, activity);
        // Skip or return a default "error" activity, or throw specific error
        // For now, let's try to salvage what we can or default.
      }

      const type = Object.values(ActivityType).includes(activity.type as ActivityType) 
                   ? activity.type as ActivityType 
                   : ActivityType.REST; // Default to REST if type is invalid

      const durationMinutes = Number(activity.durationMinutes);
      if (isNaN(durationMinutes)) {
        console.warn(`Invalid durationMinutes for activity at index ${index}:`, activity.durationMinutes);
      }
      
      let distanceKm = activity.distanceKm !== undefined ? Number(activity.distanceKm) : undefined;
      if (distanceKm !== undefined && isNaN(distanceKm)) {
        console.warn(`Invalid distanceKm for activity at index ${index}:`, activity.distanceKm);
        distanceKm = undefined;
      }
      
      return {
        date: String(activity.date || new Date().toISOString().split('T')[0]), // Ensure date is a string
        type: type,
        durationMinutes: isNaN(durationMinutes) ? 0 : Math.max(0, durationMinutes), // Ensure non-negative
        distanceKm: distanceKm,
        notes: typeof activity.notes === 'string' ? activity.notes : undefined, // Ensure notes is string or undefined
      };
    }).filter(activity => activity !== null) as SuggestedActivity[]; // Filter out any potential nulls if we chose to return null for invalid items

  } catch (error) {
    console.error("Error fetching training plan suggestion from Gemini:", error);
    if (error instanceof Error) {
        if (error.message.includes("quota") || error.message.includes("Quota")) {
             throw new Error("Failed to fetch suggestions due to API quota limits. Please try again later.");
        }
        // Re-throw other specific errors if they were thrown by parse/validation steps
        throw error; 
    }
    // Fallback for unknown error types
    throw new Error("An unexpected error occurred while fetching training plan suggestions.");
  }
};
