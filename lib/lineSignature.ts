import { createHmac, timingSafeEqual } from "node:crypto";

// LINE Webhook の署名検証。
// x-line-signature は「リクエスト本文（生の文字列）を、チャネルシークレットで HMAC-SHA256 したものの Base64」。
export function verifyLineSignature(rawBody: string, signature: string | null, channelSecret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", channelSecret).update(rawBody).digest();
  const given = Buffer.from(signature, "base64");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
