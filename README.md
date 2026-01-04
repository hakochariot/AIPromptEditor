# Prompt Assist (ローカルサンプル) — Generate ボタン削除版

このバージョンでは「Generate」ボタンとそれに紐づくフロント側の generateImage ロジックを一旦取り除きました。

- 理由：UI をシンプルにするため。画像生成呼び出しは別プロキシ／サーバ側で実装する予定のため、一時的に削除しています。
- Preset は prompt と negative のみを保存します。
- 将来的に画像生成機能を戻す場合は、app.js に generateImage() を追加し、サーバプロキシ経由で外部APIを叩く実装を推奨します。