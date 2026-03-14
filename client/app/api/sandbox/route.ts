import { NextRequest, NextResponse } from "next/server";

const SANDBOX_URL = process.env.SANDBOX_URL!;

/**
 * Proxy to the MacBook sandbox API to avoid CORS issues.
 * GET /api/sandbox?endpoint=/status
 * POST /api/sandbox?endpoint=/exec  { command: "ls" }
 */

export async function GET(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint param" }, { status: 400 });
  }

  try {
    const res = await fetch(`${SANDBOX_URL}${endpoint}`);
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("image/")) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: { "Content-Type": contentType },
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sandbox unreachable" },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint param" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const res = await fetch(`${SANDBOX_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sandbox unreachable" },
      { status: 502 }
    );
  }
}
