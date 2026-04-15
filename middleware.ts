import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // LIFFの外部ブラウザ認証後、ルートに戻ってきた際のリダイレクト処理
  // liff.state には本来のサブパス（例: /trial）が入っている
  const liffState = request.nextUrl.searchParams.get("liff.state");

  if (liffState && request.nextUrl.pathname === "/") {
    try {
      const targetPath = decodeURIComponent(liffState);
      // /trial, /mypage, /admin, /register のみ対象
      if (/^\/(trial|mypage|admin|register)(\/.*)?$/.test(targetPath)) {
        const url = request.nextUrl.clone();
        url.pathname = targetPath;
        return NextResponse.redirect(url);
      }
    } catch {
      // デコードエラーは無視
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
