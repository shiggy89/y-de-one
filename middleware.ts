import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// デモ環境（NEXT_PUBLIC_DEMO_MODE=true）だけ有効。本番のURL構成は変えない。
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function middleware(request: NextRequest) {
  if (DEMO_MODE) {
    // demo.y-de-one.com/ は入口ページ（/demo）を表示し、日本語のホームページは /ja で見せる
    if (request.nextUrl.pathname === "/") return NextResponse.rewrite(new URL("/demo", request.url));
    if (request.nextUrl.pathname === "/ja") return NextResponse.rewrite(new URL("/", request.url));
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
  matcher: ["/", "/ja"],
};
