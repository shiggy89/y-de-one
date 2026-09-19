import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { single, eq, from } = vi.hoisted(() => {
  const single = vi.fn();
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { single, eq, from };
});
vi.mock("../supabase", () => ({ supabaseAdmin: { from } }));

import { requireAdmin } from "../adminAuth";
import { requireSuperAdmin } from "../superAdmin";

function lineReturns(userId: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string | URL | Request) =>
      String(url).includes("/verify")
        ? new Response(JSON.stringify({ client_id: "1234567890", expires_in: 3600 }))
        : new Response(JSON.stringify({ userId }))
    )
  );
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_LIFF_ID", "1234567890-AbCdEfGh");
  single.mockReset();
  from.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("requireAdmin", () => {
  it("管理者の ID を名乗るだけ（x-admin-id）では通らず、DB も引かない", async () => {
    const req = new Request("https://example.com", { headers: { "x-admin-id": "Uadmin0000000000" } });
    expect(await requireAdmin(req)).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  it("検証済みトークンの持ち主が管理者なら通る", async () => {
    lineReturns("Uadmin0000000000");
    single.mockResolvedValue({ data: { is_admin: true } });
    const req = new Request("https://example.com", { headers: { authorization: "Bearer admin-token" } });
    expect(await requireAdmin(req)).toBe(true);
    expect(eq).toHaveBeenCalledWith("line_user_id", "Uadmin0000000000");
  });

  it("検証済みでも管理者でなければ通らない", async () => {
    lineReturns("Umember000000000");
    single.mockResolvedValue({ data: { is_admin: false } });
    const req = new Request("https://example.com", { headers: { authorization: "Bearer member-token" } });
    expect(await requireAdmin(req)).toBe(false);
  });
});

describe("requireSuperAdmin", () => {
  it("スーパー管理者の DB id でなければ、管理者でも通らない", async () => {
    lineReturns("Uadmin0000000000");
    single.mockResolvedValue({ data: { id: 99, is_admin: true } });
    const req = new Request("https://example.com", { headers: { authorization: "Bearer admin-token-2" } });
    expect(await requireSuperAdmin(req)).toBe(false);
  });

  it("スーパー管理者なら通る", async () => {
    lineReturns("Usuper0000000000");
    single.mockResolvedValue({ data: { id: 14, is_admin: true } });
    const req = new Request("https://example.com", { headers: { authorization: "Bearer super-token" } });
    expect(await requireSuperAdmin(req)).toBe(true);
  });
});
