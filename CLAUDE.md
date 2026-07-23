# Y-de-ONE プロジェクトルール

## 役割分担
- **デザイナー**: ページのデザイン・アイコン生成（Nano Banana 2 API）
- **デベロッパー**: コード実装（Next.js / TypeScript）
- **ライター**: 各ページの文言・コピー（指示があるまで適当な文字でOK）

---

## コード構成
```
app/
  (site)/               ← 各ページ（layout.tsxでHeader/Footer共通）
    page.tsx            ← トップページ
    price/page.tsx      ← 料金ページ
    class/page.tsx      ← クラスページ
  _components/
    layout/
      Header/           ← 共通ヘッダー（全ページ共通・変更不要）
      Footer/           ← 共通フッター（全ページ共通・変更不要）
    sections/
      top/              ← トップページセクション
      price/            ← 料金ページセクション
      class/            ← クラスページセクション
      common/           ← 共通コンポーネント（Heading2, CTAボタン等）

public/images/
  home/                 ← トップページ用アイコン
  class/                ← クラスページ用アイコン
  price/                ← 料金ページ用アイコン
  common/               ← ロゴ等共通
  {ページ名}/           ← 新規ページのアイコンはここに追加
```

---

## デザインルール

### 全ページ共通
- Header / Footer は既存コンポーネントをそのまま使う
- 各ページは `app/(site)/{ページ名}/page.tsx` に作成
- セクションコンポーネントは `app/_components/sections/{ページ名}/` に作成
- CSSは各コンポーネントに対応する `.module.css` を作成

### Heading2
- 全セクションのH2は必ず `Heading2` コンポーネントを使う
- **子ページ（top以外）は `leftSrc` / `rightSrc` アイコン不要**

### カラー
- ピンク系アクセント: `#e05080`
- 水色アクセント: `#0090e8`
- 水色背景カード: `#e8f4fd`
- テキスト: `#333`
- 白背景: `#ffffff`

### レイアウト
- `inner` クラス: max-width 960px 中央揃え（globals.cssに定義済み）
- フォント: Noto Sans JP

### アイコン
- アイコンをこまめに配置して視覚的にわかりやすくする
- 新規ページのアイコンは `public/images/{ページ名}/` に保存
- アイコンは Nano Banana 2 API で自動生成する（手動作成しない）
- 生成後はPillowで背景透過処理を行う

---

## Nano Banana 2 アイコン自動生成

### APIキー
`.env.local` に保存済み（`GEMINI_API_KEY`）

### 使用モデル
`gemini-3.1-flash-image-preview`（1枚約$0.045）

### 生成スクリプトのパターン
```js
// scripts/generate-{page}-icons.mjs として作成・実行後に削除
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  }
);
const data = await res.json();
const base64 = data.candidates[0].content.parts.find(p => p.inlineData).inlineData.data;
fs.writeFileSync('output.png', Buffer.from(base64, 'base64'));
```

### プロンプトのコツ
- `cute flat illustration icon` — フラットイラスト
- `transparent background` — 透過背景
- `white outline` — 白アウトライン
- `Pastel colors` — パステルカラー
- `Square format` — 正方形
- **必須禁止フレーズ（毎回必ず入れること）**: `PURE SOLID WHITE BACKGROUND. ABSOLUTELY NO dots, NO polka dots, NO circles pattern, NO stippling, NO grain, NO noise, NO halftone, NO texture of any kind, NO background pattern, NO dot grid, completely flat solid colors only, zero texture, zero pattern`

### 背景透過処理（Pillow）
白固定ではなく、**四隅の色を自動検出**して除去すること（生成画像の背景色は白以外になることがある）:
```python
def remove_bg_auto(path, threshold=30):
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    pixels = img.load()
    corners = [pixels[0,0], pixels[w-1,0], pixels[0,h-1], pixels[w-1,h-1]]
    bg_ref = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
    seeds = [(x, y) for x in range(w) for y in [0, h-1]] + [(x, y) for y in range(h) for x in [0, w-1]]
    stack = list(set(seeds))
    visited = set()
    while stack:
        cx, cy = stack.pop()
        if (cx, cy) in visited: continue
        if cx < 0 or cy < 0 or cx >= w or cy >= h: continue
        r, g, b, a = pixels[cx, cy]
        if a == 0: visited.add((cx, cy)); continue
        if abs(r-bg_ref[0]) + abs(g-bg_ref[1]) + abs(b-bg_ref[2]) > threshold * 3: continue
        visited.add((cx, cy))
        pixels[cx, cy] = (r, g, b, 0)
        stack.extend([(cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)])
    img.save(path)
```

### 注意
- 503エラー → リトライで解決
- fetch failed → リトライで解決
- スクリプトは実行後に削除する

### 画像差し替え後の反映手順
画像を差し替えてもブラウザに反映されない場合、`dist` フォルダ（Next.jsキャッシュ）を削除して再起動する：
```bash
lsof -ti :3000 | xargs kill -9 2>/dev/null; sleep 2 && npm run dev
rm -rf dist
npm run dev
```
- `distDir: "dist"` が `next.config.ts` に設定されているため、`.next` ではなく `dist` がキャッシュ先
- サーバー起動後、`✓ Ready` が出るまで待ってからブラウザでアクセスすること（早すぎるとエラーになる）

---

## レッスンスケジュール変更時の必須更新箇所

レッスンの追加・変更・削除を行う際は、**必ず以下3ファイルすべてを更新すること**：

| ファイル | 内容 | 対象 |
|---|---|---|
| `app/_components/sections/class/Schedule.tsx` | `LESSONS` 配列 | クラスページのスケジュール表示 |
| `lib/lessons.ts` | `LESSONS_BY_DAY` | 管理画面の出席記録レッスン選択 |
| `app/trial/TrialForm.tsx` | `TRIAL_SLOTS` / `VISIT_SLOTS` | 体験・見学フォームの時間帯選択 |

### 各ファイルの更新ポイント
- `Schedule.tsx`：色（pink/blue/yellow/gray）、ストレッチ（stretch: true）、topOffsetPct も忘れずに
- `lessons.ts`：シンプルに start/end/title/teacher のみ。リハーサルは teacher: "" でOK
- `TrialForm.tsx`：`TRIAL_SLOTS`（体験レッスン用・ジャンル×曜日→時間帯）と `VISIT_SLOTS`（見学用・曜日→全クラス）の両方。リハーサルは体験・見学対象外のため除外する

---

## Y-de-ONEの料金体系・ビジネスモデル（必読）

### 基本方針
**一般的なバレエ教室とは異なる料金システム**のため、汎用的なバレエスタジオ向けのアドバイスを提案しないこと。

### 料金体系の特徴
- **入会金0円・更新料なし**
- **維持費500円/月**（月最初のレッスン時に現金払い）
- **チケット制ではない都度払い** → 期限切れなし、来なければ払わなくていい
- **標準レッスンは累積ステップ制**（月初リセット）：

| 月の回数 | その回の料金 | 月累計 |
|---|---|---|
| 1回目 | 2,800円 | 3,300円（維持費込） |
| 2回目 | 2,600円 | 5,900円 |
| 3回目 | 2,400円 | 8,300円 |
| 4回目 | 1,800円 | 10,100円 |
| 5〜8回目 | 2,200円 / 1,400円 | 〜18,100円 |
| 9回目〜 | 2,000円/回（ずっと） | ── |

- **固定料金クラス（ステップカウント外）**：
  - ポワント・プレモダン・バレエ基礎センター・リハーサル → **1,100円/回**
  - 特別レッスン（祝日） → **3,000円/回**
  - 個人レッスン → **2,500円/15分**
  - 90分リハーサル → ステップカウント対象（例外）

### 料金体系が出席行動に与える影響（重要）
- 月謝固定制と違い「払ったからもったいない」という欠席抑制が**ない**
- 来なければ払わなくていいので**欠席ハードルが低い**
- 逆に「あと1回来ると今月の単価が下がる」という**来る理由**を作れる
- 8回目は1,400円、9回目以降は2,000円 → **8回の壁を超えると単価が上がる**ため、7〜8回帯の生徒が特に重要

### バッジシステム（マイページ）

**バッジカウントは「加重カウント」（実来店回数とは異なる）**：
- 通常/祝日/特別レッスン → ポワント・プレモダンは **0.5回**、それ以外は **1回**
- 個人レッスン → 15分 = 1回（lesson_timeに分数が入る）
- リハーサル (lesson_type) → **0回**（バッジカウント外）

**バッジ閾値**（月初リセット）：

| バッジカウント | バッジ |
|---|---|
| 1以上 | ノーマル |
| 4以上 | ブロンズ |
| 8以上 | シルバー |
| 12以上 | ゴールド |
| 20以上 | プラチナ |
| 40以上 | ダイヤモンド |

**継続モード**：先月バッジ > 今月現在バッジの場合、先月バッジを目標に「あとX回で○○継続！」表示。
通常モード：現在バッジの次ランクが目標。

**DB構成**：
- `badges`テーブル：`user_id, year_month, badge`（過去月の確定値）
- `users`テーブル：`current_badge, badge_notified`（ポップアップ制御用）
- 今月分はリアルタイムでattendancesから計算。毎月1日JST10:00のcronで前月分を確定。

### クラス体系
**先生**: 門馬和樹・青山佳樹の2名
**休講日**: 月曜

| 曜日 | レッスン |
|---|---|
| 火 | バレエ入門13:00・プレモダン14:30・モダンバレエ19:30(青山) |
| 水 | バレエ入門基礎13:00・モダンバレエ15:00・バレエ入門基礎合同19:15(青山) |
| 木 | バレエ入門基礎合同13:00(青山)・ポワント14:30・モダンバレエ15:30(青山)・モダンバレエ19:30 |
| 金 | バレエ入門15:00(青山)・ポワント16:30 |
| 土 | バレエ入門基礎合同12:30・モダンバレエ14:30(青山)・リハーサル16:30 |
| 日 | バレエ入門基礎合同12:30(青山)・ポワント14:00・リハーサル15:00 |

### Supabaseテーブル構成

| テーブル | 主要カラム | 用途 |
|---|---|---|
| `users` | id, name, line_user_id, line_picture_url, status(teacher/member/trial), is_admin | 生徒・講師情報 |
| `attendance` | student_id, lesson_date, lesson_type(通常/祝日/特別/個人/リハーサル), lesson_title, lesson_teacher, lesson_time, price_paid | 出席記録 |
| `server_db_costs` | year_month, amount | サーバー費用管理 |

---

## 分析ページ（/analytics）の設計方針

### 目的
**既存生徒の出席回数を増やすこと**（＝収益向上）

### このスタジオ固有の「出席率向上」の考え方
一般的な「出席率 = 来た日数 / 全クラス数」という発想は**使わない**。
このスタジオでは固定クラス数というものがなく、生徒は好きな時に来て好きなだけ払う。
分析上の「出席率」とは実質 **「月間来店回数」** であり、向上策も以下の観点から考える：

1. **あと1回来るとお得になる生徒**（累積ステップの境界に近い）
2. **平均来店間隔を超えている生徒**（そろそろ来るはずなのに来ていない）
3. **今月まだ0回の生徒**（休眠予備軍）
4. **特定曜日しか来ない生徒**（別曜日の同系クラスを案内できる余地）
5. **空きのあるクラスへ誘導できる生徒**（クラス充填率の改善）

### 既存の分析ロジック（lib/studentAnalytics.ts）
すでに充実した分析ロジックが実装済み。分析ページの実装時は必ずここを読んでから作る：
- `StudentAnalysisSummary` — 生徒個別サマリー
- `calcActionPriorityStudents()` — アプローチ優先度順リスト（今日声をかけるべき生徒）
- `calcClassRecruitmentOpportunities()` — 空きクラスへの声がけ候補
- `calcMonthlyDistribution()` — 月間回数分布
- `calcRevenueImpact()` — 追加収益インパクト試算
- `calcKPI()` — 全体KPI
- `recommendationEngine.ts` — クラスレコメンドエンジン

### 禁止事項
- 「月謝の値下げ」「チケット制導入」などの料金体系変更の提案
- 「出席率〇%」という固定クラス数を前提とした指標の使用
- 一般的なフィットネス・ダンス教室向けの汎用的な離脱防止施策の提案

---

## 作成済みページ
| ページ | パス | 状態 |
|---|---|---|
| トップ | `/` | 完成（オーナー作成） |
| クラス | `/class` | 完成（オーナー作成） |
| 料金 | `/price` | 完成 |
