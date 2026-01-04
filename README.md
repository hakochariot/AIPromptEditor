```markdown
# Prompt Assist（ローカルサンプル）— 日本語化版

このリポジトリはプロンプト入力支援の簡易サンプルです。このバージョンでは UI の文言をすべて日本語化しています。

主な機能
- プロンプト（メイン）／ネガティブプロンプト編集
- 候補（サジェスト）ボタンのワンクリック挿入
- 文字数・単語数・簡易トークン見積もりの表示
- よく使う文言（Favorites）の追加・削除・挿入（localStorage に保存）
- クリップボード履歴の記録・挿入・再コピー・削除（localStorage に保存）
- プリセット保存（プロンプト・ネガティブのみ）

注意点
- 画像生成（Generate）機能はこのバージョンでは取り除いてあります。実際に画像生成 API を呼びたい場合は、フロントから機密情報（APIキー）を送らない構成にし、サーバ側プロキシ等を用意してください。
- ローカルで試す場合は index.html をブラウザで開くだけで動作します。

適用手順（ローカルで差し替える場合の例）
1. リポジトリをクローン（未取得の場合）
   git clone git@github.com:hakochariot/AIPromptEditor.git
   cd AIPromptEditor

2. 新しいブランチを作成
   git checkout -b chore/japanese-ui

3. 上記ファイル（index.html / app.js / README.md）を置き換え、保存

4. コミット & push
   git add index.html app.js README.md
   git commit -m "chore: UI 文言を日本語化"
   git push -u origin chore/japanese-ui

5. GitHub で Pull Request を作成し、レビュー・マージしてください。
```