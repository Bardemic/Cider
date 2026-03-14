import { NextRequest } from "next/server";
import { runAgent } from "@/lib/gemini-agent";

/**
 * POST /api/agent
 * Body: { prompt: string }
 * Returns: SSE stream of AgentEvents
 */
export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt || typeof prompt !== "string") {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await runAgent(prompt, (event) => {
          const line = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(line));
        });
      } catch (err) {
        const errorEvent = {
          type: "error",
          data: { message: err instanceof Error ? err.message : String(err) },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
