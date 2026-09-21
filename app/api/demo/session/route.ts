import { NextResponse } from "next/server";
import {
  DEMO_DISPLAY_NAMES,
  DEMO_GUEST_COOKIE,
  DEMO_MODE,
  DEMO_ROLE_COOKIE,
  getDemoSession,
  isDemoDatabaseConfigured,
  newGuestLineUserId,
} from "@/lib/demo";

export const dynamic = "force-dynamic";

// 画面が「いま誰として操作しているか」を知るための API。
// 役割を選ばずに /trial などへ直接来た人には、その場で来訪者（guest）を割り当てる。
export async function GET(req: Request) {
  if (!DEMO_MODE) return new NextResponse(null, { status: 404 });
  if (!isDemoDatabaseConfigured()) {
    return NextResponse.json({ error: "Demo database is not configured." }, { status: 503 });
  }

  const existing = getDemoSession(req);
  if (existing) {
    return NextResponse.json({
      role: existing.role,
      lineUserId: existing.lineUserId,
      displayName: DEMO_DISPLAY_NAMES[existing.role],
    });
  }

  const lineUserId = newGuestLineUserId();
  const res = NextResponse.json({
    role: "guest",
    lineUserId,
    displayName: DEMO_DISPLAY_NAMES.guest,
  });
  const options = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  } as const;
  res.cookies.set(DEMO_ROLE_COOKIE, "guest", options);
  res.cookies.set(DEMO_GUEST_COOKIE, lineUserId, options);
  return res;
}
