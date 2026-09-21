// デモ環境（LINEなしで管理画面・マイページを触れる公開サンドボックス）専用の設定。
// デモ用の Vercel プロジェクトで NEXT_PUBLIC_DEMO_MODE=true を設定したときだけ有効になる。
// 本番では未設定のため、ここにあるコードは一切動かない。

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export const DEMO_ROLE_COOKIE = "demo_role";
export const DEMO_GUEST_COOKIE = "demo_uid";

export type DemoRole = "admin" | "member" | "guest";

// 実在の LINE ユーザーID と同じ形式（U + 16進数）にして、既存 API の形式チェックをそのまま通す。
export const DEMO_LINE_USER_IDS = {
  admin: `U${"0".repeat(28)}de01`,
  member: `U${"0".repeat(28)}de02`,
} as const;

export const DEMO_DISPLAY_NAMES: Record<DemoRole, string> = {
  admin: "Demo Admin",
  member: "Demo Member",
  guest: "Demo Guest",
};

// 体験レッスンの申込み先。本番は公式LINE、デモは LINE なしで動く申込みフォーム。
export const TRIAL_ENTRY_URL = DEMO_MODE ? "/trial" : "https://lin.ee/iz33eCM";

// 公開サンドボックスなので、アップロードは小さな画像だけ受け付ける。
export const DEMO_MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const GUEST_ID_PATTERN = /^U[a-f0-9]{32}$/;

export function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function newGuestLineUserId(): string {
  return `U${crypto.randomUUID().replaceAll("-", "")}`;
}

// デモ用の認証情報が、デモ用データベースに向いているときだけ有効にする。
// 本番の設定に NEXT_PUBLIC_DEMO_MODE が紛れ込んでも（あるいは本番の .env.local でデモを試しても）、
// DEMO_SUPABASE_URL が接続先と一致しない限り、本番のデータには触れない。
export function isDemoDatabaseConfigured(): boolean {
  const allowed = process.env.DEMO_SUPABASE_URL;
  return Boolean(allowed) && allowed === process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export type DemoSession = { role: DemoRole; lineUserId: string };

export function getDemoSession(req: Request): DemoSession | null {
  if (!DEMO_MODE || !isDemoDatabaseConfigured()) return null;

  const cookies = req.headers.get("cookie");
  const role = readCookie(cookies, DEMO_ROLE_COOKIE);

  if (role === "admin" || role === "member") {
    return { role, lineUserId: DEMO_LINE_USER_IDS[role] };
  }
  if (role === "guest") {
    const uid = readCookie(cookies, DEMO_GUEST_COOKIE);
    // 管理者・生徒の固定IDとは重ならないものだけを来訪者として扱う
    const reserved = Object.values(DEMO_LINE_USER_IDS) as string[];
    if (uid && GUEST_ID_PATTERN.test(uid) && !reserved.includes(uid)) return { role, lineUserId: uid };
  }
  return null;
}
