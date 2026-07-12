import { NextResponse } from "next/server";

export async function GET(req: Request) {
  if (req.headers.get("x-analytics-key") !== process.env.ANALYTICS_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
