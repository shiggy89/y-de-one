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

## 作成済みページ
| ページ | パス | 状態 |
|---|---|---|
| トップ | `/` | 完成（オーナー作成） |
| クラス | `/class` | 完成（オーナー作成） |
| 料金 | `/price` | 完成 |
