import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getVerifiedLineUserId } from "../lineAuth";

const CHANNEL_ID = "1234567890";

function reqWith(headers: Record<string, string>) {
  return new Request("https://example.com/api/test", { headers });
}

function mockLine(opts: { verify?: Record<string, unknown> | null; profile?: Record<string, unknown> | null }) {
  const fetchMock = vi.fn(async (url: string | URL | Request) => {
    const u = String(url);
    if (u.startsWith("https://api.line.me/oauth2/v2.1/verify")) {
      return opts.verify ? new Response(JSON.stringify(opts.verify)) : new Response("{}", { status: 400 });
    }
    if (u === "https://api.line.me/v2/profile") {
      return opts.profile ? new Response(JSON.stringify(opts.profile)) : new Response("{}", { status: 401 });
    }
    throw new Error(`unexpected fetch: ${u}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_LIFF_ID", `${CHANNEL_ID}-AbCdEfGh`);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getVerifiedLineUserId", () => {
  it("返す: 自チャネル向けの有効なトークンなら、LINE が返した userId", async () => {
    mockLine({ verify: { client_id: CHANNEL_ID, expires_in: 3600 }, profile: { userId: "Uaaaaaaaaaaaaaaaa" } });
    const id = await getVerifiedLineUserId(reqWith({ authorization: "Bearer token-valid" }));
    expect(id).toBe("Uaaaaaaaaaaaaaaaa");
  });

  it("拒否: Authorization ヘッダーがない", async () => {
    const fetchMock = mockLine({});
    expect(await getVerifiedLineUserId(reqWith({}))).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("拒否: 旧方式の x-admin-id（自己申告）だけでは認証されない", async () => {
    const fetchMock = mockLine({});
    expect(await getVerifiedLineUserId(reqWith({ "x-admin-id": "Uadminadminadmin1" }))).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("拒否: 別のチャネルで発行されたトークン", async () => {
    const fetchMock = mockLine({ verify: { client_id: "9999999999", expires_in: 3600 }, profile: { userId: "Uother" } });
    expect(await getVerifiedLineUserId(reqWith({ authorization: "Bearer token-other-channel" }))).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1); // プロフィールまで取りにいかない
  });

  it("拒否: 期限切れのトークン", async () => {
    mockLine({ verify: { client_id: CHANNEL_ID, expires_in: 0 }, profile: { userId: "Uexpired" } });
    expect(await getVerifiedLineUserId(reqWith({ authorization: "Bearer token-expired" }))).toBeNull();
  });

  it("拒否: LINE が検証に失敗を返した", async () => {
    mockLine({ verify: null });
    expect(await getVerifiedLineUserId(reqWith({ authorization: "Bearer token-invalid" }))).toBeNull();
  });

  it("拒否: チャネルIDを特定できない（LIFF ID 未設定）", async () => {
    vi.stubEnv("NEXT_PUBLIC_LIFF_ID", "");
    mockLine({ verify: { client_id: CHANNEL_ID, expires_in: 3600 }, profile: { userId: "Uxxx" } });
    expect(await getVerifiedLineUserId(reqWith({ authorization: "Bearer token-nochannel" }))).toBeNull();
  });

  it("同じトークンの再検証は LINE に問い合わせずキャッシュを使う", async () => {
    const fetchMock = mockLine({ verify: { client_id: CHANNEL_ID, expires_in: 3600 }, profile: { userId: "Ucached" } });
    const req = () => reqWith({ authorization: "Bearer token-cache" });
    await getVerifiedLineUserId(req());
    await getVerifiedLineUserId(req());
    expect(fetchMock).toHaveBeenCalledTimes(2); // 1回目の verify + profile のみ
  });

  it("開発時のみ x-dev-line-user-id を受け付け、本番では無視する", async () => {
    mockLine({});
    expect(await getVerifiedLineUserId(reqWith({ "x-dev-line-user-id": "debug" }))).toBe("debug");
    vi.stubEnv("NODE_ENV", "production");
    expect(await getVerifiedLineUserId(reqWith({ "x-dev-line-user-id": "debug" }))).toBeNull();
  });
});
