import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyLineSignature } from "../lineSignature";

const SECRET = "test-channel-secret";
const BODY = JSON.stringify({ events: [{ type: "follow", source: { userId: "Uabc" } }] });
const sign = (body: string, secret = SECRET) => createHmac("sha256", secret).update(body).digest("base64");

describe("verifyLineSignature", () => {
  it("正しい署名は通す", () => {
    expect(verifyLineSignature(BODY, sign(BODY), SECRET)).toBe(true);
  });

  it("本文が改ざんされていたら拒否", () => {
    expect(verifyLineSignature(BODY.replace("Uabc", "Uevil"), sign(BODY), SECRET)).toBe(false);
  });

  it("別のシークレットで作られた署名は拒否", () => {
    expect(verifyLineSignature(BODY, sign(BODY, "other-secret"), SECRET)).toBe(false);
  });

  it("署名なし・空・でたらめな署名は拒否", () => {
    expect(verifyLineSignature(BODY, null, SECRET)).toBe(false);
    expect(verifyLineSignature(BODY, "", SECRET)).toBe(false);
    expect(verifyLineSignature(BODY, "not-a-real-signature!!", SECRET)).toBe(false);
  });
});
