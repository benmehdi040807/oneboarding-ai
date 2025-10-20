// app/api/health/route.ts
export const runtime = "edge";

import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse(
    JSON.stringify({ ok: true, time: new Date().toISOString() }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
