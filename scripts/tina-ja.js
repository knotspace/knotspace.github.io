(() => {
  "use strict";
  document.documentElement.lang = "ja";
  const translations = new Map([
    ["Welcome to Tina! This is your dashboard for editing or creating content. Select a collection on the left to begin.", "TinaCMSへようこそ。左側の「ブログ記事」から記事を選択・作成できます。"],
    ["Create New", "新規作成"],
    ["Create new", "新規作成"],
    ["Save", "保存"],
    ["Reset", "リセット"],
    ["Required", "必須項目です"],
    ["Search", "検索"],
    ["Search...", "記事を検索…"],
    ["No results", "該当する記事はありません"],
    ["No results found", "該当する記事はありません"],
    ["Loading...", "読み込み中…"],
    ["Cancel", "キャンセル"],
    ["Delete", "削除"],
    ["Publish", "公開"],
    ["Unpublish", "公開を取り消す"],
    ["Are you sure?", "本当に実行しますか？"],
    ["Back", "戻る"],
    ["Today", "今日"],
    ["Clear", "クリア"],
    ["January", "1月"], ["February", "2月"], ["March", "3月"],
    ["April", "4月"], ["May", "5月"], ["June", "6月"],
    ["July", "7月"], ["August", "8月"], ["September", "9月"],
    ["October", "10月"], ["November", "11月"], ["December", "12月"],
    ["Sunday", "日"], ["Monday", "月"], ["Tuesday", "火"],
    ["Wednesday", "水"], ["Thursday", "木"], ["Friday", "金"], ["Saturday", "土"]
  ]);
  const translate = (root) => {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const original = node.nodeValue;
      const trimmed = original.trim();
      const translated = translations.get(trimmed);
      if (translated) node.nodeValue = original.replace(trimmed, translated);
    }
    root.querySelectorAll?.("[aria-label], [title], input[placeholder], textarea[placeholder]").forEach((el) => {
      for (const attr of ["aria-label", "title", "placeholder"]) {
        const value = el.getAttribute(attr);
        if (value && translations.has(value)) el.setAttribute(attr, translations.get(value));
      }
    });
  };
  const start = () => {
    translate(document.body);
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "childList") record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) translate(node);
          else if (node.nodeType === Node.TEXT_NODE) {
            const value = node.nodeValue.trim();
            if (translations.has(value)) node.nodeValue = node.nodeValue.replace(value, translations.get(value));
          }
        });
        else if (record.type === "characterData") {
          const value = record.target.nodeValue.trim();
          if (translations.has(value)) record.target.nodeValue = record.target.nodeValue.replace(value, translations.get(value));
        }
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();