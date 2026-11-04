# Study 絵馬掲示板の接続手順

絵馬掲示板はSupabaseをデータベースとして利用する。GitHub Pagesだけでは投稿を全利用者間で共有できないため、次の設定が必要。

## 1. Supabaseプロジェクトを用意

1. Supabaseでプロジェクトを作成する。
2. SQL Editorを開き、同じリポジトリの `docs/study/ema-board-supabase.sql` の内容を実行する。
3. Project Settings → APIからProject URLとanon/public keyを確認する。

## 2. GitHub Actions Secretsを設定

GitHubリポジトリ `knotspace/knotspace.github.io` の Settings → Secrets and variables → Actions → New repository secret で次の2つを登録する。

- `PUBLIC_SUPABASE_URL`: SupabaseのProject URL
- `PUBLIC_SUPABASE_ANON_KEY`: Supabaseのanon / publishable key

この2つはブラウザに配信される公開用設定値。**service_roleキーや秘密鍵は絶対に登録・公開しない。**

## 3. デプロイと動作確認

mainへpushするとGitHub ActionsがAstroをビルドし、Studyをデプロイする。絵馬ページで投稿するとpending状態で保存され、公開一覧にはまだ表示されない。

## 4. 投稿の確認・公開

SupabaseのTable Editorで `ema_posts` を開き、内容を確認する。問題のない投稿だけ `status` を `approved` に変更する。返信も `ema_comments` で同様に確認する。公開しない場合は `rejected` にする。通報は `ema_reports` で確認する。

## 安全上の注意

- 公開前確認を必ず継続する。未成年者が使う可能性を前提に、本名・住所・学校の詳細・連絡先を投稿しないよう明示する。
- 個人情報、誹謗中傷、脅迫、広告、性的・暴力的な投稿は公開しない。
- 初期版はDM・画像添付・外部リンク投稿を実装しない。
- 現在の匿名IDはブラウザ内で生成する簡易方式であり、本人確認や不正投稿防止を保証しない。公開範囲を広げる前に、CAPTCHA、投稿頻度制限、管理者向け削除・通報対応を追加する。
- RLSは公開読み取りとpending投稿を制御する最低限の設定。Supabaseの管理者権限をブラウザに置かない。
