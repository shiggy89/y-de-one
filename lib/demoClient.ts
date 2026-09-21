import type { DemoRole } from "./demo";

export type DemoClientSession = {
  role: DemoRole;
  lineUserId: string;
  displayName: string;
};

// デモ環境で、現在の役割と架空の LINE ユーザーIDをサーバーから受け取る（LIFF の代わり）。
export async function fetchDemoSession(): Promise<DemoClientSession> {
  const res = await fetch("/api/demo/session", { cache: "no-store" });
  if (!res.ok) throw new Error(`demo session failed: ${res.status}`);
  return res.json();
}
