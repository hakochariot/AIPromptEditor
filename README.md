# Prompt Assist (ローカルサンプル) — Generation Options removed

このバージョンでは「Generation Options」欄（steps / cfg / seed / sampler）を UI から取り除きました。
- 理由: シンプル化とクライアントでの秘密情報混入を避けるため
- 画像生成 API と連携する際は、必要なパラメータは別途 server/proxy 側で指定するか、フロント側に新しい UI を追加してください。

備考:
- Preset は現在 prompt と negative のみを保存します。
- 実際の画像生成 API を使う場合は、app.js の generateImage() を編集してプロキシ経由で呼び出してください。