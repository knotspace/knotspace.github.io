# TRACE LAB

IPアドレス・ネットワーク情報を確認するための独立ツールです。KNOTのトップページやナビゲーションからはリンクしません。

## できること
- 利用者本人がボタンを押した場合に、自分のIP情報（国・地域・市区町村の推定、ISP、ASN、IP推定座標）を表示
- 同意確認ページ付きの共有リンク発行
- リンクを開いた人が取得内容と共有先を確認し、明示的に同意した場合だけアクセス元情報を記録
- 発行者は管理キーで同意済みアクセス結果を確認
- アクセス情報は7日で自動削除、発行リンクは30日で自動削除

GPS、氏名、自宅住所、カメラ、マイクは取得しません。IP位置情報は推定値であり、実際の居場所や住所を示すものではありません。

## Cloudflare Worker の初回セットアップ

1. CloudflareでD1データベース trace-lab を作成する。
2. schema.sql のSQLをD1コンソールで実行する。
3. wrangler.toml の database_id を作成したD1のIDに置き換える。
4. このフォルダをWorkerとしてデプロイする（wrangler deploy）。
5. Workerのシークレット ADMIN_KEY を設定する（wrangler secret put ADMIN_KEY）。
6. 発行されたWorker URLをサイトの「Worker URL」に入力する。

Workerは /api/create、/api/consent、/api/results を提供します。/api/create と /api/results はADMIN_KEYによる認証が必要です。/api/consent はリンクIDと本人の明示的な同意を必須にします。

## 注意
このツールは技術学習・検証を目的とします。相手に隠した取得、追跡、嫌がらせ、個人特定には利用しないでください。WorkerのデプロイとD1の初期設定が完了するまでは、共有リンクの発行・記録機能は利用できません。
