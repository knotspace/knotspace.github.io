# 高専入試 教科別DB 設計書(v1・2026-11-04)

最上位仕様は `kosen-past-paper-cloud-handoff.md`。この文書はその設計判断を記録する。

## 1. 現状(監査結果)

既存の問題バンクは7ファイル・計2,107件。**スキーマが3系統混在**している。

| 系統 | 項目名 | 使用ファイル |
|---|---|---|
| A | `q` / `choices` / `answer` / `explanation` | private-math-beta, private-past-bank, private-practice-bank |
| B | `prompt` / `options` / `correct` / `explanation` | study-foundation, public-exam, public-exam-upgrade |
| C | `q` / `a` / `c` / `e` | study-questions |

`scripts/study/validate-question-banks.mjs`(`npm run study:validate`)が3系統を共通形に正規化して検査する。読み取り専用で、既存データは変更しない。

## 2. 配置方針

- **スキーマ・出典台帳・単元定義**(小さく、レビュー対象): `src/data/study/kosen/`
- **問題シャード本体**(大きくなる): 教科・年度・単元で分割し、実行時に必要分だけ取得
  - 既存の先例 `public/data/game/schools/*.json` に倣い `public/data/study/kosen/<subject>/` に置く案を第一候補とする。
  - 各教科に `manifest.json`(シャード一覧・件数・sha256・更新日)を置き、初期表示ではmanifestだけ読む。
- 教科ディレクトリ: `math/`, `science/`, `english/`, `japanese/`, `social-studies/`

## 3. 容量の制約(**5GB超は現構成では置けない**)

GitHub公式ドキュメント([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits))によると、公開サイトは **1 GB 以内**、ソースリポジトリは **1 GB 以内を推奨**、帯域は月100 GBのソフトリミット。本サイトはGitHub Pages(`.github/workflows/deploy.yml`)で配信しているため、**5GBのDBをPagesから配信することはできない**。

したがって容量の方針は次の二段構えにする。
1. **Pagesに載せるもの**: 問題本文・解説・SVG図版・manifest・索引(テキスト中心)。教科ごとに分割し、現状31MBの`public`に対して数十〜数百MBに収める。
2. **5GB級になりうるもの**(大量の高解像度図版、検証ログ、制作過程の資料など): 外部ストレージ(リポジトリに設定のあるSupabase Storage、または他のオブジェクトストレージ)に置き、manifestからURL参照する。Git LFSはPages配信の上限を広げないため、配信用途には使えない(保管用途のみ)。

この選択(外部ストレージの採用、料金、認証)は費用・権限が絡むため、**利用者の判断が必要な未決事項**として `progress.md` に残す。容量を理由に必要なデータを削ることはしない。

## 4. 共通スキーマ

`src/data/study/kosen/question.schema.json`(JSON Schema 2020-12)。要点:

- **安定ID** `kosen-<math|sci|eng|jpn|soc>-<orig|rN>-<単元>-<連番3桁>`。公開後は変更・再利用しない。
- **出典の区別を型で強制**: `provenance.type` は `knot-original`(完全独自)か `knot-reconstructed`(過去問の出題意図を分析して新規構成)のみ。公式原文を表す種別は**存在しない**ので、原本をそのまま格納することはスキーマ上できない。`knot-reconstructed` は実際に確認できた年度・大問・小問・参考にした要素(`aspect`)と台帳ID(`ledgerId`)が必須。
- **必須の学習要素**: `learningGoal`, `estimatedSeconds`, `answerRationale`, 段階的解説 `solutionSteps`, 4択それぞれの `choiceNotes`, `summaryLink`。
- **検証状態** `verification.status`: `draft → recomputed → reviewed → published`。`published` は独立再計算と確認の両方を通過した問題だけ。公開DBに載せるのは `published` のみ。
- **重複対策**: `aliasOf` で統合。旧IDは削除せず別名として残し、進捗データを壊さない。`revisions` に改訂履歴。

## 5. 既存機能との互換

既存画面(`foundation.astro`、`public-exam.astro`、`quiet-practice-7c2e91.astro` など)は現行ファイルを直接読んでいる。移行は次の順で行い、各段階で `study:validate` と画面確認を通す。
1. 新DBを追加するだけ(既存ファイルと画面は触らない)。
2. 新DB→既存の回答UIが読める形に変換する薄い互換レイヤーを追加。
3. 画面を新DBへ切り替え、旧ファイルは移行完了を確認してから整理。

## 6. 品質ゲート

- `study:validate` のエラー0を公開条件とする。新DBには `--strict` を適用する。
- 正解位置は4択で均等(各25%±10%)に。最長選択肢が正解になる比率を50%未満に。
- 数式・計算問題は、解説とは独立したスクリプトで再計算する(`verification.recomputedBy` に記録)。
