import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import anthropic from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Allow both authenticated and unauthenticated users to use the chatbot

    const { message, context } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are Nex, an AI assistant for DECA students working on competition projects.
You help with:
- Brainstorming business ideas
- Writing business plans and reports
- Creating pitch decks
- Understanding DECA event requirements
- Preparing for judge presentations
- Providing feedback on projects

Be friendly, encouraging, and specific in your help. Keep responses concise but helpful.
If asked about specific DECA events, provide relevant guidance for that event type.`;

    const stream = anthropic.messages.stream({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: message
        }
      ]
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              const chunk = encoder.encode(
                `data: ${JSON.stringify({ content: event.delta.text })}\n\n`
              );
              controller.enqueue(chunk);
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Nex chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}