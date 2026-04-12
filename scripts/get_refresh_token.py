"""
Step 1: リフレッシュトークンを取得するスクリプト
実行後に表示されるリフレッシュトークンを .env.local に保存してください
"""
import json
from google_auth_oauthlib.flow import InstalledAppFlow

# ダウンロードしたJSONファイルのパスを指定
CLIENT_SECRETS_FILE = "client_secret.json"  # JSONファイルをこのディレクトリに置いてください

SCOPES = ["https://www.googleapis.com/auth/adwords"]

flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, scopes=SCOPES)
credentials = flow.run_local_server(port=0)

print("\n===== リフレッシュトークン =====")
print(credentials.refresh_token)
print("================================\n")
print(".env.local に以下を追加してください:")
print(f"GOOGLE_ADS_REFRESH_TOKEN={credentials.refresh_token}")
