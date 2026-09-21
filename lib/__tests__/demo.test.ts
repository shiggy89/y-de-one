import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const DEMO_DB = "https://demo-project.supabase.co";

function reqWith(cookie?: string) {
  return new Request("https://demo.example.com/api/test", { headers: cookie ? { cookie } : {} });
}

// DEMO_MODE はモジュール読み込み時に決まるので、環境変数を設定してから読み込み直す
async function loadWith(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) vi.stubEnv(key, "");
    else vi.stubEnv(key, value);
  }
  const demo = await import("../demo");
  const auth = await import("../lineAuth");
  return { demo, auth };
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_LIFF_ID", "1234567890-AbCdEfGh");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("デモ環境の認証", () => {
  const demoEnv = {
    NEXT_PUBLIC_DEMO_MODE: "true",
    NEXT_PUBLIC_SUPABASE_URL: DEMO_DB,
    DEMO_SUPABASE_URL: DEMO_DB,
  };

  it("管理者の Cookie なら、固定の架空の管理者IDを返す（LINE には問い合わせない）", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { demo, auth } = await loadWith(demoEnv);
    const id = await auth.getVerifiedLineUserId(reqWith("demo_role=admin"));
    expect(id).toBe(demo.DEMO_LINE_USER_IDS.admin);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("生徒の Cookie なら、固定の架空の生徒IDを返す", async () => {
    const { demo, auth } = await loadWith(demoEnv);
    expect(await auth.getVerifiedLineUserId(reqWith("demo_role=member"))).toBe(demo.DEMO_LINE_USER_IDS.member);
  });

  it("来訪者は、Cookie の形式が正しいIDだけ受け付ける", async () => {
    const { auth } = await loadWith(demoEnv);
    const good = `U${"a1".repeat(16)}`;
    expect(await auth.getVerifiedLineUserId(reqWith(`demo_role=guest; demo_uid=${good}`))).toBe(good);
    // 管理者のIDになりすませない
    expect(await auth.getVerifiedLineUserId(reqWith(`demo_role=guest; demo_uid=U${"0".repeat(28)}de01`))).toBeNull();
    expect(await auth.getVerifiedLineUserId(reqWith("demo_role=guest; demo_uid=not-an-id"))).toBeNull();
    expect(await auth.getVerifiedLineUserId(reqWith("demo_role=guest"))).toBeNull();
  });

  it("拒否: Cookie がない、または未知の役割", async () => {
    const { auth } = await loadWith(demoEnv);
    expect(await auth.getVerifiedLineUserId(reqWith())).toBeNull();
    expect(await auth.getVerifiedLineUserId(reqWith("demo_role=superuser"))).toBeNull();
  });

  it("拒否: 接続先がデモ用データベースと確認できないときは、Cookie があっても認証しない", async () => {
    const other = await loadWith({ ...demoEnv, NEXT_PUBLIC_SUPABASE_URL: "https://production.supabase.co" });
    expect(await other.auth.getVerifiedLineUserId(reqWith("demo_role=admin"))).toBeNull();

    const unset = await loadWith({ ...demoEnv, DEMO_SUPABASE_URL: undefined });
    expect(await unset.auth.getVerifiedLineUserId(reqWith("demo_role=admin"))).toBeNull();
  });

  it("デモ環境では、x-dev-line-user-id ヘッダーも LINE のトークンも受け付けない", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { auth } = await loadWith(demoEnv);
    const req = new Request("https://demo.example.com/api/test", {
      headers: { "x-dev-line-user-id": "debug", authorization: "Bearer some-token" },
    });
    expect(await auth.getVerifiedLineUserId(req)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("デモ環境が無効なとき（本番）", () => {
  it("demo_role の Cookie があっても認証されない", async () => {
    const { demo, auth } = await loadWith({ NEXT_PUBLIC_DEMO_MODE: undefined });
    expect(demo.DEMO_MODE).toBe(false);
    expect(demo.getDemoSession(reqWith("demo_role=admin"))).toBeNull();
    expect(await auth.getVerifiedLineUserId(reqWith("demo_role=admin"))).toBeNull();
  });

  it("体験レッスンの申込み先は公式LINE", async () => {
    const { demo } = await loadWith({ NEXT_PUBLIC_DEMO_MODE: undefined });
    expect(demo.TRIAL_ENTRY_URL).toBe("https://lin.ee/iz33eCM");
  });
});

describe("デモ用の架空ID", () => {
  it("既存 API の LINE ユーザーID形式チェックを通る", async () => {
    const { demo } = await loadWith({});
    const pattern = /^U[a-fA-F0-9]{16,64}$/;
    expect(demo.DEMO_LINE_USER_IDS.admin).toMatch(pattern);
    expect(demo.DEMO_LINE_USER_IDS.member).toMatch(pattern);
    expect(demo.newGuestLineUserId()).toMatch(pattern);
  });
});
