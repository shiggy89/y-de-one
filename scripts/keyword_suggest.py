"""
Google サジェスト API でキーワード取得（無料・APIキー不要）
"""
import urllib.request
import urllib.parse
import json
import time

BASE_URL = "https://suggestqueries.google.com/complete/search"

SEED_KEYWORDS = [
    "大人バレエ",
    "大人 バレエ",
    "バレエ 大人",
    "大人バレエ教室",
    "大人バレエ 初心者",
]

# アルファベット・数字・ひらがなでサジェスト拡張
SUFFIXES = [
    "", "初心者", "教室", "料金", "体験", "効果", "東京", "大阪", "名古屋",
    "オンライン", "ダイエット", "何歳から", "週1", "費用", "服装",
    "シューズ", "難しい", "痩せる", "レッスン", "スタジオ",
]

def get_suggestions(keyword):
    params = urllib.parse.urlencode({
        "q": keyword,
        "hl": "ja",
        "gl": "jp",
        "client": "firefox",
    })
    url = f"{BASE_URL}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=5) as res:
        data = json.loads(res.read().decode("utf-8"))
        return data[1] if len(data) > 1 else []

all_keywords = set()

for seed in SEED_KEYWORDS:
    suggestions = get_suggestions(seed)
    all_keywords.update(suggestions)
    for suffix in SUFFIXES:
        if suffix:
            time.sleep(0.5)
            try:
                suggestions2 = get_suggestions(f"{seed} {suffix}")
                all_keywords.update(suggestions2)
            except Exception:
                pass

# バレエ関連のみフィルタ
filtered = sorted([k for k in all_keywords if "バレエ" in k or "ballet" in k.lower()])

print(f"\n{'キーワード'}")
print("-" * 50)
for kw in filtered:
    print(kw)

print(f"\n合計 {len(filtered)} 件")
