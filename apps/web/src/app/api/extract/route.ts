import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { messages, mode, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages array." }, { status: 400 });
    }

    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return NextResponse.json({
        topics: [
          {
            id: "t1",
            label: "Core Principles & Foundation",
            description: "Fundamental terminology and core ideas discussed.",
            children: [
              { id: "t1-1", label: "Key Definitions", description: "Essential vocabulary and terms" },
              { id: "t1-2", label: "Primary Mechanisms", description: "How core components interact" },
              { id: "t1-3", label: "Theoretical Basis", description: "Foundation concepts and rules" }
            ]
          },
          {
            id: "t2",
            label: "Structural & Functional Systems",
            description: "Internal and external architectures.",
            children: [
              { id: "t2-1", label: "Internal Anatomy / Architecture", description: "Primary structural elements" },
              { id: "t2-2", label: "External Components", description: "Surrounding systems and interfaces" }
            ]
          },
          {
            id: "t3",
            label: "Processes, Regulation & Cycles",
            description: "How systems are regulated and maintained over time.",
            children: [
              { id: "t3-1", label: "Regulatory Pathways", description: "Control mechanisms and feedback" },
              { id: "t3-2", label: "Dynamic Cycles", description: "Periodic changes and phases" }
            ]
          }
        ],
        flashcards: [
          {
            id: "f1",
            front: "What is the primary mechanism discussed in this session?",
            back: "A system of mutually adapted components working together to regulate function."
          },
          {
            id: "f2",
            front: "Why is understanding core terminology essential?",
            back: "It forms the foundation for analyzing complex interactions and systems."
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

    // Formatting messages as a transcript for the LLM
    const transcript = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    
    let prompt = `Analyze the following chat transcript between a user and an AI tutor.\n`;
    if (context) {
        prompt += `The user also provided this document context:\n${context}\n\n`;
    }
    
    prompt += `Transcript:\n${transcript}\n\n`;
    prompt += `Your task is to extract the key learning concepts discussed in the transcript into two JSON formats:
1. "topics": A comprehensive hierarchical tree for a concept mindmap. CRITICAL RULE: You MUST generate at least 3 to 5 distinct top-level major branch topics in the "topics" array. DO NOT wrap everything under a single root topic. Each top-level topic MUST have 2 to 4 sub-topics in 'children'.
2. "flashcards": A list of Q&A flashcards based on the material discussed. Each flashcard must have an 'id', 'front' (the question), and 'back' (the answer).

Return ONLY a valid JSON object matching this schema:
{
  "topics": [
    {
      "id": "t1",
      "label": "First Major Topic Branch",
      "description": "Summary",
      "children": [
        { "id": "t1-1", "label": "Subtopic A", "description": "Details" },
        { "id": "t1-2", "label": "Subtopic B", "description": "Details" }
      ]
    },
    {
      "id": "t2",
      "label": "Second Major Topic Branch",
      "description": "Summary",
      "children": [
        { "id": "t2-1", "label": "Subtopic C", "description": "Details" },
        { "id": "t2-2", "label": "Subtopic D", "description": "Details" }
      ]
    },
    {
      "id": "t3",
      "label": "Third Major Topic Branch",
      "description": "Summary",
      "children": [
        { "id": "t3-1", "label": "Subtopic E", "description": "Details" }
      ]
    }
  ],
  "flashcards": [
    {
      "id": "f1",
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
