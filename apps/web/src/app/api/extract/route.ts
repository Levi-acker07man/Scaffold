import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set in environment variables." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { messages, mode, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages array." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    // Formatting messages as a transcript for the LLM
    const transcript = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    
    let prompt = `Analyze the following chat transcript between a user and an AI tutor.\n`;
    if (context) {
        prompt += `The user also provided this document context:\n${context}\n\n`;
    }
    
    prompt += `Transcript:\n${transcript}\n\n`;
    prompt += `Your task is to extract the key learning concepts discussed in the transcript into two JSON formats:
1. "topics": A hierarchical tree for a mindmap. Each topic should have an 'id', 'label', 'description' (optional), and 'children' (optional array of sub-topics).
2. "flashcards": A list of Q&A flashcards based on the material discussed. Each flashcard must have an 'id' (a random string), 'front' (the question), and 'back' (the answer).

Return ONLY a valid JSON object matching this schema:
{
  "topics": [
    {
      "id": "string",
      "label": "string",
      "description": "string",
      "children": [...]
    }
  ],
  "flashcards": [
    {
      "id": "string",
      "front": "string",
      "back": "string"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    
    // Safety against potential markdown wrapping
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith("```")) {
        cleanJson = cleanJson.slice(0, -3);
    }

    const extractedData = JSON.parse(cleanJson.trim());
    return NextResponse.json(extractedData);

  } catch (error: any) {
    console.error("Extract API error:", error);
    return NextResponse.json({ error: error.message || "An error occurred during extraction." }, { status: 500 });
  }
}
