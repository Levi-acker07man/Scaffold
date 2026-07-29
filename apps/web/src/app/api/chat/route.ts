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

    let systemInstruction = mode === "learn"
      ? "You are a patient, encouraging tutor. Explain concepts clearly with examples. Break down complex topics into easily digestible parts. Be concise but informative."
      : "You are a Socratic tutor. NEVER give direct answers. Guide the student with hints and questions to help them arrive at the answer themselves. Encourage critical thinking.";

    if (context) {
      systemInstruction += `\n\nHere is some additional context or document content the student has provided. Use this to inform your answers:\n${context}`;
    }

    const modelWithSystem = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction,
    });

    // We take all messages except the last one as history
    // Assuming messages from UI are { role: 'user' | 'assistant', content: string }
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
        return NextResponse.json({ error: "The last message must be from the user." }, { status: 400 });
    }

    const chat = modelWithSystem.startChat({
      history,
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const reply = response.text();

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message || "An error occurred during chat." }, { status: 500 });
  }
}
