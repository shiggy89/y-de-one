# main に push

未コミットの変更をコミットして、**必ず origin の main に**push する。ブランチは作らない・push しない。

## 手順

1. `git status --short` と `git branch --show-current` で状態を確認する
2. 変更ファイルだけを `git add` する（`git add -A` / `git add .` は使わない）
   - **含めない**: `.agents/` / `AGENTS.md` / `.env*` / 生成物（`dist/` `.next/`）
   - 直前の会話で触ったファイルだけを対象にする
3. 英語の簡潔なコミットメッセージでコミットする（末尾に Co-Authored-By 行を付ける）
4. `git fetch origin` する。origin/main が先に進んでいたら `git rebase origin/main` で取り込む
   - 競合したら止めて、内容をユーザーに報告する（勝手に解決しない）
5. push は **必ずこの形**で行う:
   ```bash
   git push origin HEAD:main
   ```
   - `git push`（引数なし）や `git push origin <ブランチ名>` は使わない
   - `--force` / `--force-with-lease` は使わない。拒否されたら 4 に戻って rebase する

## 完了報告

- push した範囲（`旧..新`）と、含めたファイル・含めなかったファイルを1〜2行で報告する
- 現在のブランチが main 以外だった場合は、「ローカルの main は古いままなので `git pull` が必要」と一言添える
