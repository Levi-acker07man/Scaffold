import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

function getDemoTutorReply(prompt: string, mode: string): string {
  const q = prompt.trim().toLowerCase();
  
  if (q.includes("reproduction") || q.includes("biology")) {
    if (mode === "learn") {
      return `### 🌱 Introduction to Reproduction\n\nReproduction is one of the fundamental biological processes by which new individual organisms—**"offspring"**—are produced from their **"parents."**\n\nThere are two primary types of reproduction in living organisms:\n\n1. **Asexual Reproduction:**\n   - Involves only **one parent**.\n   - The offspring are genetically identical to the parent (clones).\n   - *Examples:* Binary fission in bacteria, budding in yeast, and vegetative propagation in plants.\n\n2. **Sexual Reproduction:**\n   - Involves **two parents** contributing genetic material (usually through specialized cells called gametes: sperm and egg).\n   - Creates **genetic diversity**, which helps species adapt to changing environments.\n   - *Examples:* Humans, most animals, and flowering plants.\n\n---\n\nWould you like to explore **sexual vs. asexual reproduction** in more detail, or focus on human reproduction or plant reproduction?\n\n*(💡 **Note:** Running in built-in Tutor Mode. To connect live Gemini AI, add your free \`GEMINI_API_KEY\` from aistudio.google.com to \`.env.local\`)*`;
    } else {
      return `That's a fantastic topic to explore! Before we dive into the specifics, let's start with a foundational question:\n\nWhy do you think reproduction is essential for a species, and what might happen if organisms couldn't reproduce?\n\nTake a guess, and we'll build from there!\n\n*(💡 **Note:** Running in built-in Tutor Mode. To connect live Gemini AI, add your free \`GEMINI_API_KEY\` from aistudio.google.com to \`.env.local\`)*`;
    }
  }

  if (mode === "learn") {
    return `### 📚 Learning: "${prompt}"\n\nHere is a structured overview to get you started with **${prompt}**:\n\n1. **Core Concept:** Understanding the foundational principles and why this topic is important.\n2. **Key Mechanisms:** Breaking down how the major components interact and function.\n3. **Practical Examples:** Seeing how this applies in real-world scenarios.\n\nWhat specific part of **${prompt}** would you like to explore first? Let me know where you'd like to dive deeper!\n\n*(💡 **Note:** Running in built-in Tutor Mode. To connect live Gemini AI, add your free \`GEMINI_API_KEY\` from aistudio.google.com to \`.env.local\`)*`;
  } else {
    return `That is a great question about **"${prompt}"**!\n\nIn the spirit of Socratic learning, let's break this down together. What do you already know or intuitively think about this topic? What is the first thought that comes to mind when you consider how it works?\n\n*(💡 **Note:** Running in built-in Tutor Mode. To connect live Gemini AI, add your free \`GEMINI_API_KEY\` from aistudio.google.com to \`.env.local\`)*`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { messages, mode, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages array." }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: "The last message must be from the user." }, { status: 400 });
    }

    if (!apiKey) {
      const demoReply = getDemoTutorReply(lastMessage.content, mode || "socratic");
      await new Promise((resolve) => setTimeout(resolve, 700));
      return NextResponse.json({ reply: demoReply });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    let systemInstruction = mode === "learn"
      ? "You are a patient, encouraging tutor. Explain concepts clearly with examples. Break down complex topics into easily digestible parts. Be concise but informative."
      : "You are a Socratic tutor. NEVER give direct answers. Guide the student with hints and questions to help them arrive at the answer themselves. Encourage critical thinking.";

    if (context) {
      systemInstruction += `\n\nHere is some additional context or document content the student has provided. Use this to inform your answers:\n${context}`;
    }

    const modelWithSystem = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction,
    });

    // We take all messages except the last one as history
    // Assuming messages from UI are { role: 'user' | 'assistant', content: string }
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

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
