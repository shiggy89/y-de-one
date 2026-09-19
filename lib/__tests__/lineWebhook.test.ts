import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabaseAdmin: { from } }));

import { POST } from "@/app/api/webhook/line/route";

const SECRET = "test-channel-secret";
const BODY = JSON.stringify({ events: [] });
const sign = (body: string) => createHmac("sha256", SECRET).update(body).digest("base64");

function webhookRequest(body: string, signature?: string) {
  return new Request("https://example.com/api/webhook/line", {
    method: "POST",
    headers: signature ? { "x-line-signature": signature } : {},
    body,
  });
}

beforeEach(() => {
  from.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/webhook/line", () => {
  it("署名が正しければ受け付ける", async () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", SECRET);
    const res = await POST(webhookRequest(BODY, sign(BODY)));
    expect(res.status).toBe(200);
  });

  it("署名なしは 401。偽のイベントでユーザーが作られない", async () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", SECRET);
    const forged = JSON.stringify({ events: [{ type: "follow", source: { userId: "Uforged00000000000" } }] });
    const res = await POST(webhookRequest(forged));
    expect(res.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("署名が本文と合わなければ 401", async () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", SECRET);
    const forged = JSON.stringify({ events: [{ type: "follow", source: { userId: "Uforged00000000000" } }] });
    const res = await POST(webhookRequest(forged, sign(BODY)));
    expect(res.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("チャネルシークレット未設定なら、何も受け付けない（500）", async () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", "");
    const res = await POST(webhookRequest(BODY, sign(BODY)));
    expect(res.status).toBe(500);
  });
});
