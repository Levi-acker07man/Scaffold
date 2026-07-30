import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { topic, level, timeframe } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      return NextResponse.json({
        milestones: [
          {
            id: "m1",
            label: "Foundations & Core Concepts",
            description: `Understand the basic terminology, fundamental principles, and high-level overview of ${topic}.`,
            estimatedHours: 4,
          },
          {
            id: "m2",
            label: "Key Mechanisms & Theory",
            description: `Dive deeper into core mechanics, essential rules, and how components interact in ${topic}.`,
            estimatedHours: 8,
          },
          {
            id: "m3",
            label: "Practical Applications",
            description: `Apply your knowledge through real-world examples, exercises, and guided practice.`,
            estimatedHours: 10,
          },
          {
            id: "m4",
            label: "Advanced Integration",
            description: `Master complex scenarios, problem-solving techniques, and comprehensive review of ${topic}.`,
            estimatedHours: 8,
          },
        ],
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
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
