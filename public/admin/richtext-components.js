(() => {
  "use strict";
  const cms = window.CMS;
  const h = window.h;
  if (!cms || typeof cms.registerEditorComponent !== "function" || typeof h !== "function") {
    console.warn("KNOT rich-text components could not initialize.");
    return;
  }
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  cms.registerEditorComponent({
    id: "knot-callout",
    label: "KNOT 囲み枠",
    fields: [
      { name: "style", label: "種類", widget: "select", options: ["point", "note", "warning", "summary"], default: "point" },
      { name: "title", label: "見出し", widget: "string" },
      { name: "text", label: "本文", widget: "text" }
    ],
    pattern: /^<aside class="knot-box knot-box-(point|note|warning|summary)">\s*<strong>([\s\S]*?)<\/strong>\s*<p>([\s\S]*?)<\/p>\s*<\/aside>$/,
    fromBlock: (match) => ({
      style: match[1],
      title: match[2].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
      text: match[3].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    }),
    toBlock: (data) => {
      const style = ["point", "note", "warning", "summary"].includes(data.style) ? data.style : "point";
      return '<aside class="knot-box knot-box-' + style + '"><strong>' + escapeHtml(data.title) + '</strong><p>' + escapeHtml(data.text).replace(/\n/g, "<br>") + '</p></aside>';
    },
    toPreview: (data) => h("aside", { className: "knot-box knot-box-" + (data.style || "point") },
      h("strong", {}, data.title || "ポイント"),
      h("p", {}, data.text || "")
    )
  });

  cms.registerEditorComponent({
    id: "knot-button",
    label: "KNOT ボタン",
    fields: [
      { name: "label", label: "表示文字", widget: "string" },
      { name: "url", label: "リンク先", widget: "string" }
    ],
    pattern: /^<p><a class="knot-content-button" href="([^"]*)">([\s\S]*?)<\/a><\/p>$/,
    fromBlock: (match) => ({ url: match[1], label: match[2] }),
    toBlock: (data) => '<p><a class="knot-content-button" href="' + escapeHtml(data.url || "#") + '">' + escapeHtml(data.label || "詳しく見る") + '</a></p>',
    toPreview: (data) => h("a", { className: "knot-content-button", href: data.url || "#" }, data.label || "詳しく見る")
  });
})();
