import { beforeEach, describe, expect, it, vi } from "vitest";

const { single, update, insert, from } = vi.hoisted(() => {
  const single = vi.fn();
  const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
  const insert = vi.fn(async () => ({ error: null }));
  const from = vi.fn(() => ({
    select: () => ({ eq: () => ({ single }) }),
    update,
    insert,
  }));
  return { single, update, insert, from };
});
vi.mock("@/lib/supabase", () => ({ supabaseAdmin: { from } }));
vi.mock("@/lib/lineAuth", () => ({ getVerifiedLineUserId: vi.fn(async () => "Uverified00000000") }));

import { POST } from "@/app/api/register/route";

const request = () =>
  new Request("https://example.com/api/register", {
    method: "POST",
    body: JSON.stringify({ lastName: "山田", firstName: "花子" }),
  });

beforeEach(() => {
  single.mockReset();
  update.mockClear();
  insert.mockClear();
});

describe("POST /api/register", () => {
  it("体験（trial）の人は会員に昇格する", async () => {
    single.mockResolvedValue({ data: { id: 1, status: "trial" } });
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("すでに会員なら 409、書き換えない", async () => {
    single.mockResolvedValue({ data: { id: 2, status: "member" } });
    const res = await POST(request());
    expect(res.status).toBe(409);
    expect(update).not.toHaveBeenCalled();
  });

  it("先生のアカウントは 409、会員に書き換えない", async () => {
    single.mockResolvedValue({ data: { id: 3, status: "teacher" } });
    const res = await POST(request());
    expect(res.status).toBe(409);
    expect(update).not.toHaveBeenCalled();
  });

  it("未登録の人は新規に会員登録される", async () => {
    single.mockResolvedValue({ data: null });
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
