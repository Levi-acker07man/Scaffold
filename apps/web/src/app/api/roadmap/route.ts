import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set in environment variables." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { topic, level, timeframe } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `Create a structured learning roadmap for the following topic:
Topic: ${topic}
Current Level: ${level || "Beginner"}
Timeframe: ${timeframe || "1 month"}

Your task is to break down this topic into logical, sequential milestones.
For each milestone, provide an ID, a clear label, a short description of what needs to be learned, and an estimated number of hours to complete it.

Return ONLY a valid JSON object matching this schema:
{
  "milestones": [
    {
      "id": "string (e.g. m1, m2)",
      "label": "string",
      "description": "string",
      "estimatedHours": number
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    
    // Extract JSON block robustly
    let cleanJson = responseText.trim();
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }

    const extractedData = JSON.parse(cleanJson);
    return NextResponse.json(extractedData);

  } catch (error: any) {
    console.error("Roadmap API error:", error);
    return NextResponse.json({ error: error.message || "An error occurred during roadmap generation." }, { status: 500 });
  }
}
