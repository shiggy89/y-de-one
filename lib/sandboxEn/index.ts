import { ADMIN_EN } from "./admin";
import { COMMON_EN } from "./common";
import { FORMS_EN } from "./forms";
import { MYPAGE_EN } from "./mypage";

// 日本語 → 英語。画面ごとのファイルに分けて、ここで1つにまとめる。
// 同じ日本語は、後ろのファイルの訳が優先される（共通の用語は common.ts）。
export const SANDBOX_EN: Record<string, string> = {
  ...ADMIN_EN,
  ...FORMS_EN,
  ...MYPAGE_EN,
  ...COMMON_EN,
};
