import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { mainTopic, nodeTitle, nodeDescription } = await req.json();

    if (!mainTopic || !nodeTitle) {
      return NextResponse.json({ error: "mainTopic and nodeTitle are required." }, { status: 400 });
    }

    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return NextResponse.json({
        articles: [
          {
            title: `Introduction to ${nodeTitle}`,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(nodeTitle)}`,
            summary: `A comprehensive overview and guide to ${nodeTitle} within ${mainTopic}.`
          }
        ],
        videos: [
          {
            title: `Understanding ${nodeTitle} in 10 Minutes`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(mainTopic + ' ' + nodeTitle)}`,
            summary: `A visual explanation of core concepts and practical examples.`
          }
        ],
        documentation: [
          {
            title: `${nodeTitle} Reference & Documentation`,
            url: `https://www.google.com/search?q=${encodeURIComponent(mainTopic + ' ' + nodeTitle + ' documentation')}`,
            summary: `Official documentation and reference materials for further study.`
          }
        ]
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are an expert tutor creating study materials.
The user is studying the main topic: "${mainTopic}".
They are currently focusing on a specific milestone: "${nodeTitle}".
Context: "${nodeDescription || ""}"

Please generate specific, actionable learning resources for this milestone.
Return ONLY a valid JSON object matching this exact schema:
{
  "summary": "A 2-3 paragraph detailed explanation of this topic.",
  "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"],
  "practiceExercise": "A specific, hands-on task or question they can do to practice.",
  "searchTerms": ["Exact search term 1", "Exact search term 2 for Youtube/Google"]
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
    console.error("Roadmap Resources API error:", error);
    return NextResponse.json({ error: error.message || "An error occurred during resource generation." }, { status: 500 });
  }
}
