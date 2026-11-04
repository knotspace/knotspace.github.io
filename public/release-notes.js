(() => {
  'use strict';
  const script = document.currentScript;
  const appId = document.documentElement.dataset.releaseApp;
  if (!script || !appId || document.getElementById('knot-release-trigger')) return;
  const dataUrl = new URL('release-notes.json', script.src).href;
  const style = document.createElement('style');
  style.textContent = \`
    #knot-release-trigger{position:fixed;right:18px;bottom:18px;z-index:99980;display:flex;align-items:center;gap:8px;padding:11px 15px;border:1px solid rgba(148,163,184,.38);border-radius:999px;background:#111827;color:#f8fafc;box-shadow:0 8px 28px #0003;font:700 12px/1.2 system-ui,sans-serif;cursor:pointer}
    #knot-release-trigger:hover{transform:translateY(-2px);border-color:#60a5fa}
    #knot-release-trigger .knot-rn-dot{width:7px;height:7px;border-radius:50%;background:#60a5fa}
    #knot-release-overlay{position:fixed;inset:0;z-index:99990;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(2,6,23,.68);backdrop-filter:blur(7px)}
    #knot-release-overlay.open{display:flex}
    #knot-release-panel{width:min(680px,100%);max-height:min(82vh,820px);overflow:hidden;display:flex;flex-direction:column;border:1px solid rgba(148,163,184,.28);border-radius:20px;background:#f8fafc;color:#172033;box-shadow:0 28px 90px #0007;font-family:system-ui,-apple-system,"Noto Sans JP",sans-serif}
    #knot-release-panel *{box-sizing:border-box}
    #knot-release-panel button{font:inherit;cursor:pointer}
    .knot-rn-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:22px 24px 16px;border-bottom:1px solid #e2e8f0}
    .knot-rn-eyebrow{font:800 10px/1.4 ui-monospace,monospace;letter-spacing:.16em;color:#64748b}
    .knot-rn-title{margin:5px 0 0;font-size:23px;line-height:1.3;font-weight:850;letter-spacing:-.04em}
    .knot-rn-close{width:34px;height:34px;flex:none;border:1px solid #cbd5e1;border-radius:50%;background:transparent;color:#334155;font-size:20px}
    .knot-rn-tabs{display:flex;gap:7px;padding:13px 24px 0}
    .knot-rn-tab{padding:8px 13px;border:1px solid #cbd5e1;border-radius:999px;background:transparent;color:#475569;font-size:12px;font-weight:800}
    .knot-rn-tab[aria-selected="true"]{border-color:#1d4ed8;background:#1d4ed8;color:white}
    .knot-rn-list{overflow:auto;padding:12px 24px 24px}
    .knot-rn-entry{padding:17px 0;border-bottom:1px solid #e2e8f0}
    .knot-rn-meta{display:flex;align-items:center;flex-wrap:wrap;gap:7px;color:#64748b;font:11px/1.5 ui-monospace,monospace}
    .knot-rn-tag{padding:3px 8px;border-radius:999px;background:#e2e8f0;color:#334155;font:800 10px/1.4 system-ui,sans-serif}
    .knot-rn-entry h3{margin:8px 0 5px;font-size:16px;line-height:1.5;font-weight:850}
    .knot-rn-entry p{margin:0;color:#475569;font-size:13px;line-height:1.85;white-space:pre-wrap}
    .knot-rn-empty{padding:28px 0;color:#64748b;font-size:13px;line-height:1.8}
    .knot-rn-devbox{margin:4px 0 16px;padding:14px;border:1px solid #cbd5e1;border-radius:13px;background:#f1f5f9}
    .knot-rn-devbox strong{display:block;margin-bottom:5px;font-size:12px}
    .knot-rn-devbox p{margin:0;color:#475569;font-size:12px;line-height:1.8}
    .knot-rn-devbox a{display:inline-block;margin-top:8px;color:#1d4ed8;font-size:12px;font-weight:800;text-decoration:none}
    .knot-rn-foot{padding:11px 24px;border-top:1px solid #e2e8f0;color:#94a3b8;font:10px/1.5 ui-monospace,monospace}
    @media(prefers-color-scheme:dark){html:not([data-theme="light"]) #knot-release-panel{background:#111827;color:#e5e7eb;border-color:#334155}html:not([data-theme="light"]) .knot-rn-head,html:not([data-theme="light"]) .knot-rn-entry,html:not([data-theme="light"]) .knot-rn-foot{border-color:#334155}html:not([data-theme="light"]) .knot-rn-close{color:#e5e7eb;border-color:#475569}html:not([data-theme="light"]) .knot-rn-tab{color:#cbd5e1;border-color:#475569}html:not([data-theme="light"]) .knot-rn-tab[aria-selected="true"]{color:#fff;border-color:#3b82f6;background:#1d4ed8}html:not([data-theme="light"]) .knot-rn-entry p,html:not([data-theme="light"]) .knot-rn-devbox p{color:#cbd5e1}html:not([data-theme="light"]) .knot-rn-devbox{background:#1e293b;border-color:#475569}html:not([data-theme="light"]) .knot-rn-tag{background:#334155;color:#e2e8f0}html:not([data-theme="light"]) .knot-rn-devbox a{color:#93c5fd}}
    html[data-theme="dark"] #knot-release-panel{background:#111827;color:#e5e7eb;border-color:#334155}html[data-theme="dark"] .knot-rn-head,html[data-theme="dark"] .knot-rn-entry,html[data-theme="dark"] .knot-rn-foot{border-color:#334155}html[data-theme="dark"] .knot-rn-close{color:#e5e7eb;border-color:#475569}html[data-theme="dark"] .knot-rn-tab{color:#cbd5e1;border-color:#475569}html[data-theme="dark"] .knot-rn-tab[aria-selected="true"]{color:#fff;border-color:#3b82f6;background:#1d4ed8}html[data-theme="dark"] .knot-rn-entry p,html[data-theme="dark"] .knot-rn-devbox p{color:#cbd5e1}html[data-theme="dark"] .knot-rn-devbox{background:#1e293b;border-color:#475569}html[data-theme="dark"] .knot-rn-tag{background:#334155;color:#e2e8f0}html[data-theme="dark"] .knot-rn-devbox a{color:#93c5fd}
    @media(max-width:520px){#knot-release-trigger{right:12px;bottom:12px;padding:10px 13px}#knot-release-overlay{padding:9px}#knot-release-panel{max-height:88vh;border-radius:16px}.knot-rn-head{padding:18px 17px 13px}.knot-rn-title{font-size:20px}.knot-rn-tabs{padding:11px 17px 0}.knot-rn-list{padding:8px 17px 18px}.knot-rn-foot{padding:10px 17px}}
    @media print{#knot-release-trigger,#knot-release-overlay{display:none!important}}
  \`;
  document.head.appendChild(style);
  const trigger = document.createElement('button');
  trigger.id = 'knot-release-trigger';
  trigger.type = 'button';
  trigger.innerHTML = '<span class="knot-rn-dot" aria-hidden="true"></span><span>更新情報</span>';
  trigger.setAttribute('aria-haspopup','dialog');
  document.body.appendChild(trigger);
  const overlay = document.createElement('div');
  overlay.id = 'knot-release-overlay';
  overlay.innerHTML = '<section id="knot-release-panel" role="dialog" aria-modal="true" aria-labelledby="knot-rn-heading"><header class="knot-rn-head"><div><div class="knot-rn-eyebrow">KNOT / RELEASE NOTES</div><h2 class="knot-rn-title" id="knot-rn-heading">更新情報</h2></div><button class="knot-rn-close" type="button" aria-label="閉じる">×</button></header><nav class="knot-rn-tabs" aria-label="更新情報の種類"><button class="knot-rn-tab" type="button" data-tab="release" aria-selected="true">リリースノート</button><button class="knot-rn-tab" type="button" data-tab="developer" aria-selected="false">開発ログ</button></nav><div class="knot-rn-list" id="knot-rn-list" aria-live="polite">読み込み中…</div><footer class="knot-rn-foot">更新履歴はサイトごとに管理されています。</footer></section>';
  document.body.appendChild(overlay);
  const list = overlay.querySelector('#knot-rn-list');
  const title = overlay.querySelector('#knot-rn-heading');
  const close = () => { overlay.classList.remove('open'); trigger.focus(); };
  overlay.querySelector('.knot-rn-close').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });
  let config = null;
  let activeTab = 'release';
  const labelFor = type => ({feature:'新機能',improvement:'改善',fix:'不具合修正',content:'コンテンツ',developer:'開発'}[type] || '更新');
  const node = (tag, cls, text) => { const el=document.createElement(tag); if(cls)el.className=cls; if(text!==undefined)el.textContent=text; return el; };
  function render(){
    if(!config){list.textContent='更新情報を読み込めませんでした。時間をおいて再読み込みしてください。';return;}
    title.textContent=config.title || '更新情報';
    list.replaceChildren();
    if(activeTab==='developer'){
      const box=node('div','knot-rn-devbox');
      const strong=node('strong',null,'開発者向け：更新を追加する方法');
      const p=node('p',null,'release-notes.json の該当アプリ欄に新しい項目を1件追加するだけで、この画面にも反映されます。日付・バージョン・種別・タイトル・説明を記録してください。');
      const a=node('a',null,'GitHubで更新データを編集 ↗'); a.href=config.editUrl || '#'; a.target='_blank'; a.rel='noopener noreferrer';
      box.append(strong,p,a); list.append(box);
    }
    const notes=(config.notes||[]).filter(n=>activeTab==='developer'?n.audience==='developer':n.audience!=='developer');
    if(!notes.length){list.append(node('p','knot-rn-empty',activeTab==='developer'?'開発ログはまだありません。実装した内容や検証結果を追加できます。':'現在公開されている更新情報はありません。'));return;}
    for(const n of notes){
      const article=node('article','knot-rn-entry');
      const meta=node('div','knot-rn-meta');
      meta.append(node('time',null,n.date||''),node('span','knot-rn-tag',labelFor(n.type)),node('span',null,n.version||''));
      const h=node('h3',null,n.title||'更新');
      const p=node('p',null,n.description||'');
      article.append(meta,h,p);
      if(n.path) article.append(node('p','knot-rn-meta','対象：'+n.path));
      list.append(article);
    }
  }
  overlay.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    activeTab=btn.dataset.tab;
    overlay.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===btn)));
    render();
  }));
  trigger.addEventListener('click',()=>{
    overlay.classList.add('open');
    activeTab='release';
    overlay.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab==='release')));
    render();
    overlay.querySelector('.knot-rn-close').focus();
    try{localStorage.setItem('knot-release-seen-'+appId,(config?.notes||[])[0]?.version||'');}catch{}
  });
  fetch(dataUrl,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(data=>{
    config=data.apps?.[appId]||null;
    if(!config){trigger.hidden=true;return;}
    const latest=(config.notes||[])[0];
    try{if(latest&&localStorage.getItem('knot-release-seen-'+appId)!==latest.version)trigger.setAttribute('title','新しい更新があります');}catch{}
    if(overlay.classList.contains('open'))render();
  }).catch(()=>{config=null;});
})();
