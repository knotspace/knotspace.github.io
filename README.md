# KNOT Study 分割版

- `src/pages/index.astro`: 画面構造
- `src/data/questions.js`: 問題データ
- `src/scripts/app.js`: 出題・採点・復習・記録保存
- `src/styles/study.css`: デザイン

既存Astroプロジェクトの `src` に統合してください。`src/layouts/Layout.astro` は既存のものを残してください。

**重要:** 今回のZIPには動作確認用の問題5問を収録しています。会話内で送ってくれた v9q001〜v9q094 の全94問は、回答の文字数制限とコードの安全な受け渡しの都合でこのZIPには全件転記していません。`questions.js` の配列に残りの問題を追加できます。以前の sx/hx 系のデータも、元データを同じ形式で追加してください。
