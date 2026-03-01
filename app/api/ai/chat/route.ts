import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { rateLimitAI } from "@/lib/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are a helpful AI assistant for Snipp, a code snippet manager. Users can store and search their code snippets. 
When the user asks about their snippets, search context, or code-related questions, provide helpful and concise answers.
If snippets context is provided, use it to answer questions about their code. Otherwise, give general coding advice.`;

export async function POST(request: Request) {
    const { allowed, retryAfter } = rateLimitAI(request);
    if (!allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429, headers: { "Retry-After": String(retryAfter ?? 60) } }
        );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY is not configured" },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const { message, history = [], snippets = [] } = body as {
            message: string;
            history?: Array<{ role: string; content: string }>;
            snippets?: Array<{ title: string; language?: string; code: string }>;
        };

        if (!message?.trim()) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const snippetsContext =
            snippets.length > 0
                ? `\n\nUser's snippets (for context):\n${snippets
                      .map(
                          (s) =>
                              `- "${s.title}" (${s.language || "unknown"}):\n\`\`\`\n${s.code.slice(0, 500)}${s.code.length > 500 ? "..." : ""}\n\`\`\``
                      )
                      .join("\n\n")}`
                : "";

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT + snippetsContext }],
                },
                {
                    role: "model",
                    parts: [{ text: "I understand. I'm your Snipp AI assistant. How can I help you with your code snippets or coding questions?" }],
                },
                ...history.slice(-10).map((m: { role: string; content: string }) => ({
                    role: m.role === "user" ? "user" : "model",
                    parts: [{ text: m.content }],
                })),
            ],
        });

        const result = await chat.sendMessageStream(message);

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    let fullText = "";
                    for await (const chunk of result.stream) {
                        const c = chunk as { text?: () => string };
                        const text = c.text?.() ?? "";
                        if (text) {
                            fullText += text;
                            controller.enqueue(encoder.encode(JSON.stringify({ text }) + "\n"));
                        }
                    }
                    controller.enqueue(encoder.encode(JSON.stringify({ done: true, fullText }) + "\n"));
                } catch (err) {
                    controller.enqueue(encoder.encode(JSON.stringify({ error: err instanceof Error ? err.message : "Stream error" }) + "\n"));
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "application/x-ndjson",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("Gemini chat error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to get AI response" },
            { status: 500 }
        );
    }
}
