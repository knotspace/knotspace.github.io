(() => {
  "use strict";
  if (window.__knotEditorToolsLoaded) return;
  window.__knotEditorToolsLoaded = true;

  const style = document.createElement("style");
  style.textContent = `
    .knot-privacy-warning{margin:0 0 10px;padding:10px 12px;border:1px solid #c58a4a88;border-radius:8px;background:#8a5b241c;color:var(--knot-admin-text,#d2dadd)}
    .knot-privacy-warning strong{display:block;margin-bottom:4px;color:#e8b36e}
    .knot-privacy-warning p{margin:0;font-size:11px;line-height:1.7}
    .knot-editor-tools{margin:10px 0 8px;padding:12px;border:1px solid var(--knot-admin-border,#465258);border-radius:10px;background:var(--knot-admin-surface,#30393e);color:var(--knot-admin-text,#d2dadd);font:13px/1.5 system-ui}
    .knot-tools-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:9px}
    .knot-tools-title{font-weight:700}
    .knot-tools-stats{color:var(--knot-admin-muted,#a5b0b5);font-size:12px}
    .knot-tools-buttons{display:flex;gap:6px;flex-wrap:wrap}
    .knot-tools-buttons button{border:1px solid var(--knot-admin-border,#465258);border-radius:7px;padding:7px 10px;background:var(--knot-admin-surface-raised,#354046);color:inherit;cursor:pointer;font:600 12px system-ui}
    .knot-tools-buttons button:hover{filter:brightness(1.12)}
    .knot-tools-help{margin-top:8px;color:var(--knot-admin-muted,#a5b0b5);font-size:11px}
    .knot-field-count{display:block;margin:5px 0 0;color:var(--knot-admin-muted,#a5b0b5);font-size:11px;text-align:right}
    .knot-field-count.warn{color:#d5a36d}
  `;
  document.head.appendChild(style);

  const snippets = [
    ["H2 見出し", "\n## 見出し\n\n", "見出し"],
    ["H3 小見出し", "\n### 小見出し\n\n", "小見出し"],
    ["太字", "**太字にする文字**", "太字にする文字"],
    ["リンク", "[リンク文字](https://example.com)", "リンク文字"],
    ["箇条書き", "\n- 項目1\n- 項目2\n- 項目3\n", "項目1"],
    ["番号リスト", "\n1. 1つ目\n2. 2つ目\n3. 3つ目\n", "1つ目"],
    ["引用", "\n> 引用文をここに入力\n\n", "引用文をここに入力"],
    ["画像", "\n![画像の説明](/uploads/image-name.jpg)\n", "画像の説明"],
    ["吹き出し（左）", '\n<div class="knot-balloon knot-left">\n  <div class="knot-balloon-name">名前</div>\n  <div class="knot-balloon-text">ここにセリフを入力</div>\n</div>\n', "名前"],
    ["吹き出し（右）", '\n<div class="knot-balloon knot-right">\n  <div class="knot-balloon-name">名前</div>\n  <div class="knot-balloon-text">ここにセリフを入力</div>\n</div>\n', "名前"],
    ["ポイント枠", '\n<div class="knot-box knot-box-point">\n  <div class="knot-box-title">POINT</div>\n  ここに重要なポイントを書く\n</div>\n', "ここに重要なポイントを書く"],
    ["補足枠", '\n<div class="knot-box knot-box-note">\n  <div class="knot-box-title">補足</div>\n  ここに補足説明を書く\n</div>\n', "ここに補足説明を書く"],
    ["注意枠", '\n<div class="knot-box knot-box-warning">\n  <div class="knot-box-title">注意</div>\n  ここに注意事項を書く\n</div>\n', "ここに注意事項を書く"],
    ["結論ボックス", '\n<div class="knot-box knot-box-summary">\n  <div class="knot-box-title">この記事の結論</div>\n  ここに結論を書く\n</div>\n', "ここに結論を書く"],
    ["2列比較", '\n<div class="knot-compare">\n  <div class="knot-compare-item"><strong>メリット</strong><p>内容を書く</p></div>\n  <div class="knot-compare-item"><strong>デメリット</strong><p>内容を書く</p></div>\n</div>\n', "メリット"],
    ["画像＋説明", '\n<figure class="knot-figure">\n  <img src="/uploads/image-name.jpg" alt="画像の説明" />\n  <figcaption>画像の説明を書く</figcaption>\n</figure>\n', "画像の説明"],
    ["区切り線", "\\n---\\n\\n", ""]
  ];

  function insertAtCursor(el, text, selectText) {
    const start = Number.isInteger(el.selectionStart) ? el.selectionStart : el.value.length;
    const end = Number.isInteger(el.selectionEnd) ? el.selectionEnd : start;
    el.setRangeText(text, start, end, "end");
    if (selectText) {
      const pos = el.value.indexOf(selectText, start);
      if (pos >= 0) el.setSelectionRange(pos, pos + selectText.length);
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
  }

  function addBodyTools(el) {
    if (el.dataset.knotTools) return;
    el.dataset.knotTools = "1";
    const panel = document.createElement("section");
    panel.className = "knot-editor-tools";
    panel.innerHTML = '<div class="knot-privacy-warning"><strong>🔒 公開前の個人情報チェック</strong><p>本名・学校名・学年・住所・電話番号・メール・行動範囲・他人の名前は書かない。顔写真や場所が分かる画像も使わないでね。</p></div><div class="knot-tools-top"><span class="knot-tools-title">✍️ 記事編集アシスト</span><span class="knot-tools-stats" aria-live="polite"></span></div><div class="knot-tools-buttons"></div><div class="knot-tools-help">ボタンを押すとカーソル位置にパーツが入るよ。吹き出し・枠の中の文章や名前を書き換えて使ってね。HTMLタグは消さず、中の文章だけ編集してね。</div>';
    const buttons = panel.querySelector(".knot-tools-buttons");
    snippets.forEach(([label, value, selected]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", () => insertAtCursor(el, value, selected));
      buttons.appendChild(b);
    });
    el.parentElement.insertBefore(panel, el);
    const stats = panel.querySelector(".knot-tools-stats");
    const update = () => {
      const text = el.value || "";
      const chars = text.replace(/\s/g, "").length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const minutes = Math.max(1, Math.ceil(text.length / 500));
      stats.textContent = chars.toLocaleString() + " 文字（空白除く） · 約" + minutes + "分で読める";
    };
    el.addEventListener("input", update);
    update();
  }

  function addFieldCount(el, max, label) {
    if (el.dataset.knotCount) return;
    el.dataset.knotCount = "1";
    const count = document.createElement("small");
    count.className = "knot-field-count";
    count.setAttribute("aria-live", "polite");
    el.insertAdjacentElement("afterend", count);
    const update = () => {
      const n = (el.value || "").length;
      count.textContent = label + "：" + n + (max ? " / " + max + "文字" : "文字");
      count.classList.toggle("warn", !!max && n > max);
    };
    el.addEventListener("input", update);
    update();
  }

  function enhance() {
    document.querySelectorAll("#nc-root textarea").forEach(el => {
      if (el.rows >= 5 || el.clientHeight > 150 || /markdown|本文|body/i.test((el.getAttribute("aria-label") || "") + " " + (el.name || ""))) {
        addBodyTools(el);
      } else {
        addFieldCount(el, 160, "説明文");
      }
    });
    document.querySelectorAll('#nc-root input[type="text"]').forEach(el => {
      const hint = (el.getAttribute("aria-label") || "") + " " + (el.name || "");
      if (/title|タイトル/i.test(hint)) addFieldCount(el, 60, "タイトル");
    });
  }

  const start = () => {
    enhance();
    const root = document.getElementById("nc-root") || document.body;
    new MutationObserver(enhance).observe(root, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();