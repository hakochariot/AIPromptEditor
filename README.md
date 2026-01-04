```markdown
# Prompt Assist (ローカルサンプル) — Styles/Artists removed

このバージョンでは「Styles / Artists」欄（タグボタン群）を UI から削除しました。

変更点
- index.html: Styles/Artists の列を削除し、Favorites の表示を単独にしました。
- app.js: TAGS 定義および renderTags 等、Styles/Artists に関するロジックを削除しました。
- Preset / Favorites / Clipboard History の動作はそのまま維持しています。

適用手順（推奨）
1. リポジトリをローカルに clone（未取得の場合）
   git clone git@github.com:hakochariot/AIPromptEditor.git
   cd AIPromptEditor

2. 新しいブランチを作成
   git checkout -b chore/remove-styles-artists

3. 上記のファイル（index.html, app.js, README.md）を置き換え・上書き保存

4. コミット & push
   git add index.html app.js README.md
   git commit -m "chore: remove Styles/Artists UI (simplify)"
   git push -u origin chore/remove-styles-artists

5. GitHub 上で Pull Request を作成し、レビュー・マージしてください。

備考
- 将来、タグ群（Styles/Artists）を再導入・ユーザーカスタム化したい場合は、app.js に load/save の仕組みを追加すれば localStorage ベースで簡単に復活できます。
```