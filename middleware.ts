import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_LANG_COOKIE } from "@/lib/demo";

// デモ環境（NEXT_PUBLIC_DEMO_MODE=true）だけ有効。本番のURL構成は変えない。
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function middleware(request: NextRequest) {
  if (DEMO_MODE) {
    // 入口ページ：demo.y-de-one.com/ は日本語（/demo）、/en は英語（/demo/en）。
    // 教室のホームページは、日本語が /ja、英語が /en/home。
    const { pathname } = request.nextUrl;
    if (pathname === "/") return NextResponse.rewrite(new URL("/demo", request.url));
    if (pathname === "/en") return NextResponse.rewrite(new URL("/demo/en", request.url));
    if (pathname === "/ja") return NextResponse.rewrite(new URL("/", request.url));
    if (pathname === "/en/home") return NextResponse.rewrite(new URL("/en", request.url));

    // 教室サイトの「体験レッスン」から来たときは、そのサイトの言語でフォームを出す
    const lang = request.nextUrl.searchParams.get("lang");
    if (pathname === "/trial" && (lang === "ja" || lang === "en")) {
      const res = NextResponse.next();
      res.cookies.set(DEMO_LANG_COOKIE, lang, {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return res;
    }
  }

  // LIFFの外部ブラウザ認証後、ルートに戻ってきた際のリダイレクト処理
  // liff.state には本来のサブパス（例: /trial）が入っている
  const liffState = request.nextUrl.searchParams.get("liff.state");
  const code = request.nextUrl.searchParams.get("code");

  // codeがある場合はLINE認証コールバック。LIFFに処理させるためリダイレクトしない。
  if (code) return NextResponse.next();

  if (liffState && request.nextUrl.pathname === "/") {
    try {
      const decoded = decodeURIComponent(liffState);
      const [pathOnly, queryString] = decoded.split("?");
      // /trial, /mypage, /admin, /register のみ対象
      if (/^\/(trial|mypage|admin|register)(\/.*)?$/.test(pathOnly)) {
        const url = request.nextUrl.clone();
        url.pathname = pathOnly;
        url.search = queryString ? `?${queryString}` : "";
        return NextResponse.redirect(url);
      }
    } catch {
      // デコードエラーは無視
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/ja", "/en", "/en/home", "/trial"],
};
