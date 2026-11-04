# KNOT リリースノート運用ガイド

## どこを編集するか

サイト内の「更新情報」は `public/release-notes.json` を読み込みます。
KNOT本体・Study・ゲーム一覧・青の分岐点・受験戦争の更新を、それぞれ別の `apps` キーで管理します。

## 追加方法

該当アプリの `notes` 配列の先頭に、次の形式で1件追加します。

```json
{
  "date": "2026-11-04",
  "version": "v1.1.0",
  "type": "feature",
  "audience": "all",
  "title": "追加した機能",
  "description": "ユーザーに伝える変更内容。何ができるようになったかを書く。"
}
```

- `type`: `feature`（新機能） / `improvement`（改善） / `fix`（不具合修正） / `content`（問題・記事・データ追加）
- `audience`: `all`（リリースノートに表示） / `developer`（開発ログに表示）
- `path`: 任意。変更したファイルや機能の場所を記録
- `version`: 最新項目の値が「更新情報を見た」状態の判定にも使われます

## アプリID

| アプリID | 対象 |
|---|---|
| `knot` | KNOT本体 |
| `study` | KNOT Study |
| `gamehub` | ゲーム一覧 |
| `life` | 青の分岐点 |
| `university` | 受験戦争 |
| `ichiate` | 位置をあてます！ |
| `aaa` | AAAサイト |

## 開発時のルール

1. 実装・検証が終わった変更だけを記録する。
2. 新機能・改善・不具合修正を分ける。
3. 不具合修正は「症状」と「直した内容」を短く書く。
4. 未実装の予定はリリースノートに書かず、開発ログに `audience: "developer"` で記録する。
5. JSONのカンマ・引用符を壊さない。変更後はJSONとして検証する。

表示スクリプトは `public/release-notes.js`。ゲーム本体のシミュレーション処理には依存しません。
