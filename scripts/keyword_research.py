"""
大人バレエ キーワード調査スクリプト
Google Ads API (KeywordPlanIdeaService) を使用
"""
import os
from dotenv import load_dotenv
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../.env.local"))

DEVELOPER_TOKEN = os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"]
CLIENT_ID = os.environ["GOOGLE_ADS_CLIENT_ID"]
CLIENT_SECRET = os.environ["GOOGLE_ADS_CLIENT_SECRET"]
REFRESH_TOKEN = os.environ["GOOGLE_ADS_REFRESH_TOKEN"]
LOGIN_CUSTOMER_ID = os.environ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"]

KEYWORDS = [
    "大人バレエ",
    "大人 バレエ 初心者",
    "大人バレエ教室",
    "大人から始めるバレエ",
    "大人バレエ 体験",
    "大人バレエ 料金",
    "バレエ 大人 習い事",
    "バレエ教室 大人",
    "大人バレエスタジオ",
    "大人バレエ 効果",
    "バレエ 大人 初めて",
    "バレエ 大人 何歳から",
    "大人バレエ オンライン",
    "バレエ 大人 週1",
    "バレエ 大人 ダイエット",
]

# 日本（地域ID: 2392）、日本語（言語ID: 1005）
LOCATION_IDS = ["2392"]
LANGUAGE_ID = "1005"

def main():
    config = {
        "developer_token": DEVELOPER_TOKEN,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": REFRESH_TOKEN,
        "login_customer_id": LOGIN_CUSTOMER_ID,
        "use_proto_plus": True,
    }

    client = GoogleAdsClient.load_from_dict(config)
    service = client.get_service("KeywordPlanIdeaService")

    request = client.get_type("GenerateKeywordIdeasRequest")
    request.customer_id = LOGIN_CUSTOMER_ID
    request.language = f"languageConstants/{LANGUAGE_ID}"
    request.geo_target_constants.extend([
        f"geoTargetConstants/{loc}" for loc in LOCATION_IDS
    ])
    request.include_adult_keywords = False
    request.keyword_plan_network = client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH

    request.keyword_seed.keywords.extend(KEYWORDS)

    try:
        response = service.generate_keyword_ideas(request=request)

        results = []
        for idea in response:
            keyword = idea.text
            monthly_searches = idea.keyword_idea_metrics.avg_monthly_searches
            competition = idea.keyword_idea_metrics.competition.name
            results.append((keyword, monthly_searches, competition))

        # 検索ボリューム降順でソート
        results.sort(key=lambda x: x[1], reverse=True)

        print(f"\n{'キーワード':<35} {'月間検索数':>10} {'競合'}")
        print("-" * 65)
        for keyword, vol, comp in results:
            print(f"{keyword:<35} {vol:>10,} {comp}")

        print(f"\n合計 {len(results)} 件\n")

    except GoogleAdsException as ex:
        print(f"エラー: {ex.error.code().name}")
        for error in ex.failure.errors:
            print(f"  {error.message}")

if __name__ == "__main__":
    main()
