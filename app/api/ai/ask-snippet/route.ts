import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY is not configured" },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const { question, snippetTitle, code, language = "unknown" } = body as {
            question: string;
            snippetTitle: string;
            code: string;
            language?: string;
        };

        if (!question?.trim() || !code) {
            return NextResponse.json(
                { error: "Question and code are required" },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a code assistant. The user is asking about a code snippet titled "${snippetTitle}" (${language}).

Here is the code:
\`\`\`${language}
${code}
\`\`\`

User's question: ${question}

Provide a concise, helpful answer. Use markdown for code blocks if needed.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ text });
    } catch (error) {
        console.error("Gemini ask-snippet error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to get AI response" },
            { status: 500 }
        );
    }
}
