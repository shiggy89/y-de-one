import { NextResponse } from "next/server";
import {
  DEMO_GUEST_COOKIE,
  DEMO_MODE,
  DEMO_ROLE_COOKIE,
  isDemoDatabaseConfigured,
  newGuestLineUserId,
} from "@/lib/demo";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "member", "guest"] as const;
const NEXT_PATHS = ["/admin", "/mypage", "/trial", "/register", "/"];

// デモの入口。選んだ役割を Cookie に保存して、その画面へ移動する。
// Domain を付けない Cookie（このホスト限定）なので、本番ドメインには送られない。
export async function GET(req: Request) {
  if (!DEMO_MODE) return new NextResponse(null, { status: 404 });
  if (!isDemoDatabaseConfigured()) {
    return NextResponse.json({ error: "Demo database is not configured." }, { status: 503 });
  }

  const url = new URL(req.url);
  const role = ROLES.find((r) => r === url.searchParams.get("role"));
  const next = url.searchParams.get("next") ?? "/";
  if (!role || !NEXT_PATHS.includes(next)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const res = NextResponse.redirect(new URL(next, req.url));
  const options = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  } as const;
  res.cookies.set(DEMO_ROLE_COOKIE, role, options);
  if (role === "guest") res.cookies.set(DEMO_GUEST_COOKIE, newGuestLineUserId(), options);
  return res;
}
