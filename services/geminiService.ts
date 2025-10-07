import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development and should not happen in a configured environment.
  console.warn("API_KEY environment variable not set. Gemini features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const prompts = {
  session_id: `
    You are a helpful assistant for a remote desktop application called RemoteNexzi.
    A user has asked what their "Address" or "Session ID" is.
    Explain in a simple, non-technical paragraph what this ID is used for.
    Mention that it's a unique, temporary code they can share with someone they trust to allow that person to view their screen.
    Emphasize that they should treat it like a password and only share it with people they know.
    Keep the tone friendly and reassuring.
  `,
  // Add other topics here as needed
};

type HelpTopic = keyof typeof prompts;

export const getHelpfulTips = async (topic: HelpTopic): Promise<string> => {
  if (!API_KEY) {
    return Promise.resolve("AI features are currently unavailable. Your 'Address' is a unique code to share with a trusted person to start a remote session.");
  }

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompts[topic],
        config: {
          temperature: 0.5,
          topP: 0.95,
        }
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to get helpful tips from AI.");
  }
};