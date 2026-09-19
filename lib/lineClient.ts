import liff from "@line/liff";

// API 呼び出し用の認証ヘッダー。サーバーが LIFF アクセストークンを検証して本人を特定する。
export function lineAuthHeaders(): Record<string, string> {
  try {
    const token = liff.getAccessToken();
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // liff.init() 前など。トークンなしで続行する（サーバー側で 401 になる）
  }
  // ローカル開発（LINE アプリの外）専用。本番では無効。
  if (process.env.NODE_ENV !== "production") return { "x-dev-line-user-id": "debug" };
  return {};
}
