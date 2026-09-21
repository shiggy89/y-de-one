// LIFF アクセストークンをサーバー側で検証し、LINE が保証するユーザーIDを返す。
// クライアントが送ってくる lineUserId は自己申告なので、認証には使わない。

import { DEMO_MODE, getDemoSession } from "./demo";

const VERIFY_ENDPOINT = "https://api.line.me/oauth2/v2.1/verify";
const PROFILE_ENDPOINT = "https://api.line.me/v2/profile";

const CACHE_TTL_MS = 60_000;
const CACHE_MAX_ENTRIES = 500;
const cache = new Map<string, { userId: string; expiresAt: number }>();

// LIFF ID は "{LINE ログインのチャネルID}-{ランダム文字列}" の形式。
// トークンが自分のチャネル向けに発行されたものかを確かめるために使う。
function loginChannelId(): string | null {
  const explicit = process.env.LINE_LOGIN_CHANNEL_ID;
  if (explicit) return explicit;
  const fromLiffId = process.env.NEXT_PUBLIC_LIFF_ID?.split("-")[0];
  return fromLiffId || null;
}

export async function verifyLineAccessToken(accessToken: string): Promise<string | null> {
  const cached = cache.get(accessToken);
  if (cached && cached.expiresAt > Date.now()) return cached.userId;

  const channelId = loginChannelId();
  if (!channelId) {
    console.error("LINE ログインのチャネルIDを特定できません（NEXT_PUBLIC_LIFF_ID 未設定）。");
    return null;
  }

  try {
    const verifyRes = await fetch(`${VERIFY_ENDPOINT}?access_token=${encodeURIComponent(accessToken)}`);
    if (!verifyRes.ok) return null;
    const info = (await verifyRes.json()) as { client_id?: string; expires_in?: number };
    // 他のチャネルで発行されたトークンや、期限切れのトークンは受け付けない
    if (info.client_id !== channelId || !info.expires_in || info.expires_in <= 0) return null;

    const profileRes = await fetch(PROFILE_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) return null;
    const profile = (await profileRes.json()) as { userId?: string };
    if (!profile.userId) return null;

    if (cache.size >= CACHE_MAX_ENTRIES) cache.clear();
    cache.set(accessToken, { userId: profile.userId, expiresAt: Date.now() + CACHE_TTL_MS });
    return profile.userId;
  } catch (e) {
    console.error("LINE トークン検証エラー:", e);
    return null;
  }
}

// リクエストの Authorization: Bearer <LIFFアクセストークン> から、検証済みのユーザーIDを取り出す。
// 未認証・不正なトークンの場合は null。
export async function getVerifiedLineUserId(req: Request): Promise<string | null> {
  // デモ環境（LINEなし）。Cookie で選んだ役割の架空ユーザーを返す。LINE には問い合わせない。
  if (DEMO_MODE) return getDemoSession(req)?.lineUserId ?? null;

  // ローカル開発（npm run dev）専用。本番ビルドでは NODE_ENV が production になり無効。
  if (process.env.NODE_ENV !== "production") {
    const dev = req.headers.get("x-dev-line-user-id");
    if (dev) return dev;
  }

  const match = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "");
  if (!match) return null;
  return verifyLineAccessToken(match[1].trim());
}
