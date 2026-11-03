const ALLOWED_ORIGINS = new Set([
  "https://knotspace.github.io",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
]);
const ADMIN_GITHUB_LOGIN = "knotspace";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const MAX_DOCUMENT_BYTES = 200 * 1024;

const ADMIN_HTML = String.raw`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#f7f7f5">
<title>KNOT CMS</title>
<style>
:root{color-scheme:light;--bg:#f7f7f5;--panel:#fff;--ink:#20211f;--muted:#777a73;--line:#e8e8e2;--accent:#315c4b;--soft:#edf3ef;--danger:#a33b32}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif}button,input,textarea,select{font:inherit}button{cursor:pointer;border:1px solid var(--line);border-radius:9px;background:#fff;padding:9px 13px;color:var(--ink)}button.primary{background:var(--accent);color:#fff;border-color:var(--accent)}button:disabled{opacity:.45;cursor:not-allowed}.top{height:62px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:3}.brand{font-weight:800;letter-spacing:.12em}.brand small{font-weight:500;letter-spacing:0;color:var(--muted);margin-left:9px}.user{display:flex;align-items:center;gap:12px;color:var(--muted);font-size:13px}.layout{display:grid;grid-template-columns:270px minmax(0,1fr);min-height:calc(100vh - 62px)}aside{border-right:1px solid var(--line);background:#fbfbf9;padding:22px 16px}.side-title{font-size:11px;letter-spacing:.12em;color:var(--muted);font-weight:700;padding:4px 10px 12px}.nav{display:flex;gap:10px;align-items:center;padding:10px;border-radius:9px;color:#454841}.nav.active{background:var(--soft);color:var(--accent);font-weight:700}.aside-note{font-size:12px;color:var(--muted);margin:28px 10px}.main{padding:30px;min-width:0;max-width:1180px;width:100%;margin:0 auto}.heading{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:22px}.heading h1{font-size:25px;margin:0;letter-spacing:-.03em}.muted{color:var(--muted);font-size:13px}.columns{display:grid;grid-template-columns:minmax(230px,310px) minmax(0,1fr);gap:20px;align-items:start}.panel{background:var(--panel);border:1px solid var(--line);border-radius:13px;overflow:hidden}.panel-head{padding:15px 17px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;font-weight:700}.list{padding:7px}.doc{display:block;width:100%;text-align:left;border:0;border-radius:9px;padding:12px;margin:2px 0;background:transparent}.doc:hover,.doc.selected{background:#f0f3ef}.doc strong{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.doc span{font-size:12px;color:var(--muted)}.empty{padding:28px 16px;text-align:center;color:var(--muted);font-size:13px}.editor{padding:22px}.field-label{font-size:12px;font-weight:700;color:var(--muted);display:block;margin:0 0 6px}.title-input{width:100%;border:0;border-bottom:1px solid var(--line);padding:5px 0 13px;font-size:27px;font-weight:750;outline:none;background:transparent}.meta{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin:18px 0 23px}.control{width:100%;border:1px solid var(--line);border-radius:8px;padding:9px 10px;background:#fff}.blocks-head{display:flex;align-items:center;justify-content:space-between;margin:25px 0 10px}.blocks{display:flex;flex-direction:column;gap:10px}.block{border:1px solid var(--line);border-radius:10px;padding:12px;background:#fff}.block-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;color:var(--muted);font-size:12px}.block textarea{width:100%;border:0;outline:0;resize:vertical;min-height:65px;line-height:1.8;background:transparent;color:var(--ink)}.block[data-type=heading] textarea{font-size:22px;font-weight:750;min-height:45px}.block[data-type=quote] textarea{border-left:3px solid #c8d7ce;padding-left:12px;font-style:italic}.toolbar{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.toolbar button{font-size:12px;padding:7px 10px}.footer{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid var(--line);margin-top:22px;padding-top:16px}.status{font-size:12px;color:var(--muted)}.status.error{color:var(--danger)}.history{margin-top:18px}.history-list{padding:12px 17px;font-size:12px;color:var(--muted)}.hidden{display:none!important}.login{max-width:460px;margin:12vh auto;padding:36px;background:#fff;border:1px solid var(--line);border-radius:16px;text-align:center}.login h1{letter-spacing:.1em}.login p{color:var(--muted)}@media(max-width:850px){.layout{grid-template-columns:1fr}aside{display:none}.main{padding:18px}.columns{grid-template-columns:1fr}.top{padding:0 15px}.user span{display:none}.heading h1{font-size:21px}.editor{padding:16px}.meta{grid-template-columns:1fr}.list-panel{max-height:300px;overflow:auto}}
</style>
</head>
<body>
<header class="top"><div class="brand">KNOT <small>CONTENT STUDIO</small></div><div class="user"><span id="who">ログイン確認中...</span><button id="logout">ログアウト</button></div></header>
<div id="login" class="login hidden"><h1>KNOT CMS</h1><p>記事を編集するには管理者としてログインしてください。</p><a href="/auth/login"><button class="primary">GitHubでログイン</button></a></div>
<div id="app" class="layout hidden">
<aside><div class="side-title">WORKSPACE</div><div class="nav active">▤　記事</div><div class="nav">◫　ページ <span class="muted">準備中</span></div><a class="nav" href="https://knotspace.github.io/admin/wordpress/" target="_blank" rel="noopener noreferrer">▣　WordPress編集室 ↗</a><div class="nav">◷　編集履歴</div><div class="aside-note">KNOT CMS<br>記事は下書きとして保存されます。公開機能はまだ接続されていません。</div></aside>
<main class="main">
<div class="heading"><div><h1>記事</h1><div class="muted">記事の作成・編集・下書き管理</div></div><button class="primary" id="new">＋ 新しい記事</button></div>
<div class="columns">
<section class="panel list-panel"><div class="panel-head"><span>記事一覧</span><button id="refresh">更新</button></div><div class="list" id="documents"><div class="empty">読み込み中...</div></div></section>
<section>
<div class="panel"><div class="editor" id="editor">
<div class="empty">記事を選択するか「新しい記事」を押してください。</div>
</div></div>
<div class="panel history hidden" id="history"><div class="panel-head">編集履歴</div><div class="history-list" id="history-list">履歴はありません。</div></div>
</section>
</div>
</main>
</div>
<script>
(function(){
const API="";
let csrfToken="";
let current=null;
let blocks=[];
let saveTimer=null;
let saving=false;
let dirty=false;
const $=id=>document.getElementById(id);
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(path,options){
  const opts=Object.assign({credentials:"same-origin",headers:{}},options||{});
  if(opts.body){opts.headers["Content-Type"]="application/json";opts.headers["X-KNOT-CSRF"]=csrfToken;}
  const res=await fetch(API+path,opts);
  let data={};try{data=await res.json();}catch(e){}
  if(!res.ok)throw new Error(data.error||("HTTP "+res.status));
  return data;
}
function slugify(s){
  const slug=String(s||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,90);
  return slug||("knot-"+Date.now().toString(36));
}
function setStatus(text,error){
  const el=$("save-status");if(!el)return;
  el.textContent=text;el.classList.toggle("error",!!error);
}
async function loadList(){
  try{
    const data=await api("/api/documents?limit=100");
    const root=$("documents");root.replaceChildren();
    if(!data.documents.length){root.innerHTML='<div class="empty">まだ記事がありません。<br>「新しい記事」から作成できます。</div>';return;}
    data.documents.forEach(doc=>{
      const b=document.createElement("button");b.className="doc"+(current&&current.document_id===doc.document_id?" selected":"");
      const strong=document.createElement("strong");strong.textContent=doc.title;
      const span=document.createElement("span");span.textContent=(doc.status==="review"?"レビュー":"下書き")+" ・ "+new Date(doc.updated_at).toLocaleString("ja-JP");
      b.append(strong,span);b.addEventListener("click",()=>openDoc(doc.document_id));root.append(b);
    });
  }catch(e){$("documents").innerHTML='<div class="empty">'+esc(e.message)+'</div>';}
}
function renderEditor(){
  const root=$("editor");
  root.innerHTML=
  '<label class="field-label" for="title">タイトル</label><input id="title" class="title-input" maxlength="200" placeholder="記事のタイトル">'+
  '<div class="meta"><div><label class="field-label" for="slug">URLスラッグ</label><input id="slug" class="control" maxlength="100" placeholder="my-first-post"></div><div><label class="field-label" for="status">状態</label><select id="status" class="control"><option value="draft">下書き</option><option value="review">レビュー待ち</option></select></div></div>'+
  '<div class="blocks-head"><strong>本文ブロック</strong><button id="preview-toggle">プレビュー</button></div><div class="blocks" id="blocks"></div><div id="preview" class="blocks hidden"></div>'+
  '<div class="toolbar"><button data-add="paragraph">＋ 段落</button><button data-add="heading">＋ 見出し</button><button data-add="quote">＋ 引用</button><button data-add="list">＋ リスト</button><button data-add="image">＋ 画像</button><button data-add="code">＋ コード</button><button data-add="divider">＋ 区切り線</button></div>'+
  '<div class="footer"><span class="status" id="save-status">未保存</span><button class="primary" id="save">保存する</button></div>';
  $("title").value=current.title||"";
  $("slug").value=current.slug||"";
  $("status").value=current.status||"draft";
  $("title").addEventListener("input",()=>{if(!current.slug||current.slug===slugify(current.title))$("slug").value=slugify($("title").value);queueSave();});
  $("slug").addEventListener("input",queueSave);
  $("status").addEventListener("change",queueSave);
  root.querySelectorAll("[data-add]").forEach(btn=>btn.addEventListener("click",()=>{blocks.push({type:btn.dataset.add,text:""});renderBlocks();queueSave();}));
  $("preview-toggle").addEventListener("click",togglePreview);
  $("save").addEventListener("click",saveNow);
  renderBlocks();
}
function renderBlocks(){
  const root=$("blocks");root.replaceChildren();
  blocks.forEach((block,index)=>{
    const wrap=document.createElement("div");wrap.className="block";wrap.dataset.type=block.type;
    const top=document.createElement("div");top.className="block-top";
    const labels={paragraph:"段落",heading:"見出し",quote:"引用",list:"リスト",image:"画像",code:"コード",divider:"区切り線"};
    const label=document.createElement("span");label.textContent=labels[block.type]||"段落";
    const actions=document.createElement("div");actions.style.display="flex";actions.style.gap="5px";
    const move=(caption,delta)=>{const target=index+delta;if(target<0||target>=blocks.length)return;[blocks[index],blocks[target]]=[blocks[target],blocks[index]];renderBlocks();queueSave();};
    const up=document.createElement("button");up.textContent="↑";up.title="上へ";up.style.padding="3px 8px";up.disabled=index===0;up.addEventListener("click",()=>move("up",-1));
    const down=document.createElement("button");down.textContent="↓";down.title="下へ";down.style.padding="3px 8px";down.disabled=index===blocks.length-1;down.addEventListener("click",()=>move("down",1));
    const remove=document.createElement("button");remove.textContent="削除";remove.style.padding="3px 8px";remove.addEventListener("click",()=>{blocks.splice(index,1);renderBlocks();queueSave();});
    actions.append(up,down,remove);top.append(label,actions);
    if(block.type!=="divider"){
      const area=document.createElement("textarea");area.value=block.text||"";
      area.placeholder=block.type==="heading"?"見出しを入力":block.type==="list"?"項目を1行ずつ入力":block.type==="image"?"画像のURLを入力":block.type==="code"?"コードを入力...":"文章を入力...";
      area.rows=block.type==="heading"?2:3;area.addEventListener("input",()=>{blocks[index].text=area.value;queueSave();});
      wrap.append(area);
    }else{const note=document.createElement("span");note.className="muted";note.textContent="記事内に水平線を表示します";wrap.append(note);}
    root.append(wrap);
  });
}
function togglePreview(){
  const editing=$("blocks"), preview=$("preview"), button=$("preview-toggle");
  const showing=preview.classList.contains("hidden");
  if(showing){
    const title=esc($("title").value||"タイトル未設定");
    preview.innerHTML='<h1 style="font-size:30px;line-height:1.35">'+title+'</h1>'+blocks.map(b=>{
      const value=esc(b.text||"").replace(/\n/g,"<br>");
      if(b.type==="heading")return '<h2 style="font-size:24px;margin:28px 0 12px">'+value+'</h2>';
      if(b.type==="quote")return '<blockquote style="border-left:4px solid #9aafa2;padding:8px 16px;color:#59645c">'+value+'</blockquote>';
      if(b.type==="list")return '<ul>'+String(b.text||"").split("\n").map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>';
      if(b.type==="image")return '<figure><img src="'+esc(b.text||"")+'" alt="" style="max-width:100%;height:auto"><figcaption class="muted">画像</figcaption></figure>';
      if(b.type==="code")return '<pre style="background:#f2f2ef;padding:14px;overflow:auto"><code>'+value+'</code></pre>';
      if(b.type==="divider")return '<hr style="border:0;border-top:1px solid #ddd;margin:28px 0">';
      return '<p style="line-height:2">'+value+'</p>';
    }).join("");
    editing.classList.add("hidden");preview.classList.remove("hidden");button.textContent="編集に戻る";
  }else{preview.classList.add("hidden");editing.classList.remove("hidden");button.textContent="プレビュー";}
}
function queueSave(){
  dirty=true;setStatus("変更あり・自動保存待ち");
  if(saveTimer)clearTimeout(saveTimer);
  saveTimer=setTimeout(saveNow,1200);
}
function currentPayload(){
  return {collection:current.collection||"blog",slug:$("slug").value.trim(),title:$("title").value.trim(),status:$("status").value,content:{type:"knot-document",version:1,blocks:blocks}};
}
async function saveNow(){
  if(!current||saving)return;
  if(saveTimer){clearTimeout(saveTimer);saveTimer=null;}
  const payload=currentPayload();
  if(!payload.title){setStatus("タイトルを入力してください",true);return;}
  if(!payload.slug){setStatus("URLスラッグを入力してください",true);return;}
  saving=true;setStatus("保存中...");
  try{
    let result;
    if(current.document_id){
      result=await api("/api/documents/"+current.document_id,{method:"PUT",body:JSON.stringify(payload)});
    }else{
      result=await api("/api/documents",{method:"POST",body:JSON.stringify(payload)});
    }
    current=result.document;dirty=false;
    setStatus("保存済み · "+new Date().toLocaleTimeString("ja-JP"));
    await loadList();
  }catch(e){setStatus("保存エラー: "+e.message,true);}
  finally{saving=false;}
}
async function openDoc(id){
  if(dirty)await saveNow();
  try{
    const data=await api("/api/documents/"+id);current=data.document;
    const c=current.content||{};blocks=Array.isArray(c.blocks)?c.blocks.map(b=>({type:b.type||"paragraph",text:b.text||""})):[];
    $("history").classList.remove("hidden");renderEditor();await loadList();await loadHistory();
  }catch(e){alert("記事を開けませんでした: "+e.message);}
}
async function loadHistory(){
  if(!current||!current.document_id)return;
  try{
    const data=await api("/api/documents/"+current.document_id+"/revisions");
    $("history-list").textContent=data.revisions.length?data.revisions.map(x=>new Date(x.created_at).toLocaleString("ja-JP")+" · "+(x.author_label||"admin")).join("\n"):"まだ編集履歴はありません。";
    $("history-list").style.whiteSpace="pre-line";
  }catch(e){$("history-list").textContent=e.message;}
}
function newDoc(){
  if(dirty&&!confirm("未保存の変更があります。新しい記事を作成しますか？"))return;
  current={collection:"blog",slug:"",title:"",status:"draft"};blocks=[{type:"paragraph",text:""}];dirty=false;
  $("history").classList.add("hidden");renderEditor();$("title").focus();setStatus("新規記事・未保存");
}
async function boot(){
  try{
    const me=await api("/api/me");csrfToken=me.csrfToken;
    $("who").textContent="@"+me.login;$("app").classList.remove("hidden");
    await loadList();
  }catch(e){$("login").classList.remove("hidden");$("who").textContent="未ログイン";}
}
$("new").addEventListener("click",newDoc);
$("refresh").addEventListener("click",loadList);
$("logout").addEventListener("click",async()=>{
  try{await api("/auth/logout",{method:"POST",body:"{}"});}catch(e){}
  location.href="/auth/login";
});
boot();
})();
</script>
</body>
</html>`;

function corsHeaders(origin) {
  const headers = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-KNOT-CSRF",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
  if (ALLOWED_ORIGINS.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(data, status, origin, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...corsHeaders(origin),
      ...extraHeaders,
    },
  });
}

function cookieValue(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  for (const part of cookies.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return null;
}

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeBase64url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  return atob(padded);
}

function randomToken(bytes = 32) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return base64url(data);
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

async function encryptSecret(value, secret) {
  const keyBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value)));
  return base64url(new Uint8Array([...iv, ...encrypted]));
}

async function decryptSecret(value, secret) {
  const bytes = Uint8Array.from(decodeBase64url(value), c => c.charCodeAt(0));
  const iv = bytes.slice(0, 12);
  const payload = bytes.slice(12);
  const keyBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, payload);
  return new TextDecoder().decode(plain);
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function createSession(login, secret) {
  const payload = base64url(new TextEncoder().encode(JSON.stringify({
    login,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })));
  const signature = base64url(await hmac(payload, secret));
  return payload + "." + signature;
}

async function readSession(request, secret) {
  const token = cookieValue(request, "__Host-knot_session");
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const expected = await hmac(parts[0], secret);
    const actual = Uint8Array.from(decodeBase64url(parts[1]), c => c.charCodeAt(0));
    if (expected.length !== actual.length) return null;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i];
    if (diff !== 0) return null;
    const payload = JSON.parse(decodeBase64url(parts[0]));
    if (payload.login !== ADMIN_GITHUB_LOGIN || !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000) return null;
    return { login: payload.login, expiresAt: payload.exp };
  } catch {
    return null;
  }
}

function clearCookie(name, sameSite = "None") {
  return name + "=; Path=/; HttpOnly; Secure; SameSite=" + sameSite + "; Max-Age=0";
}

function validSlug(value) {
  return typeof value === "string" && value.length >= 2 && value.length <= 100 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function validTitle(value) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 200;
}

function validStatus(value) {
  return value === "draft" || value === "review";
}

function documentSnapshot(row) {
  return {
    document_id: row.document_id,
    collection: row.collection,
    slug: row.slug,
    title: row.title,
    content_json: row.content_json,
    status: row.status,
    scheduled_at: row.scheduled_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
  };
}

async function readJsonBody(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { error: "Content-Type must be application/json" };
  }
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_DOCUMENT_BYTES) return { error: "Document is too large" };
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_DOCUMENT_BYTES) return { error: "Document is too large" };
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return { error: "JSON body must be an object" };
    return { value };
  } catch {
    return { error: "Invalid JSON" };
  }
}

async function requireAdmin(request, env) {
  const session = await readSession(request, env.SESSION_SECRET);
  if (!session) return { response: json({ error: "Authentication required" }, 401, request.headers.get("Origin") || "") };
  return { session };
}

async function requireCsrf(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (origin !== new URL(request.url).origin && !ALLOWED_ORIGINS.has(origin)) {
    return json({ error: "Origin is not allowed" }, 403, origin);
  }
  const sessionCookie = cookieValue(request, "__Host-knot_session");
  const supplied = request.headers.get("X-KNOT-CSRF") || "";
  if (!sessionCookie || !env.SESSION_SECRET || !supplied) {
    return json({ error: "CSRF validation failed" }, 403, origin);
  }
  const expected = base64url(await hmac("csrf:" + sessionCookie, env.SESSION_SECRET));
  if (supplied !== expected) return json({ error: "CSRF validation failed" }, 403, origin);
  return null;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return new Response(null, { status: 403, headers: corsHeaders("") });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if ((url.pathname === "/admin" || url.pathname === "/admin/") && request.method === "GET") {
      return new Response(ADMIN_HTML, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
          "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src https: data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
        },
      });
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      let database = "not_configured";
      if (env.DB) {
        try {
          await env.DB.prepare("SELECT 1 AS ok").first();
          database = "connected";
        } catch {
          database = "connection_error";
        }
      }
      return json({
        service: "KNOT CMS API",
        status: "ok",
        database,
        mode: "authenticated-document-api",
      }, 200, origin);
    }

    if (url.pathname === "/auth/login" && request.method === "GET") {
      if (!env.GITHUB_CLIENT_ID) return json({ error: "OAuth is not configured" }, 503, origin);
      const state = randomToken();
      const callback = url.origin + "/auth/callback";
      const authorize = new URL("https://github.com/login/oauth/authorize");
      authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      authorize.searchParams.set("redirect_uri", callback);
      authorize.searchParams.set("scope", "read:user public_repo");
      authorize.searchParams.set("state", state);
      return new Response(null, {
        status: 302,
        headers: {
          "Location": authorize.toString(),
          "Cache-Control": "no-store",
          "Set-Cookie": "__Host-knot_oauth_state=" + state + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600",
        },
      });
    }

    if (url.pathname === "/auth/callback" && request.method === "GET") {
      const state = url.searchParams.get("state");
      const savedState = cookieValue(request, "__Host-knot_oauth_state");
      const code = url.searchParams.get("code");
      const clearState = clearCookie("__Host-knot_oauth_state", "Lax");
      if (!state || !savedState || state !== savedState || !code) {
        return json({ error: "OAuth state validation failed" }, 400, origin, { "Set-Cookie": clearState });
      }
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.SESSION_SECRET) {
        return json({ error: "OAuth server secrets are not configured" }, 503, origin, { "Set-Cookie": clearState });
      }

      try {
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "KNOT-CMS",
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
            redirect_uri: url.origin + "/auth/callback",
          }),
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok || !tokenData.access_token) {
          return json({ error: "GitHub token exchange failed" }, 502, origin, { "Set-Cookie": clearState });
        }

        const userResponse = await fetch("https://api.github.com/user", {
          headers: {
            "Authorization": "Bearer " + tokenData.access_token,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "KNOT-CMS",
          },
        });
        const user = await userResponse.json();
        if (!userResponse.ok || user.login !== ADMIN_GITHUB_LOGIN) {
          return new Response("このGitHubアカウントにはKNOT CMSの管理権限がありません。", {
            status: 403,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "no-store",
              "Set-Cookie": clearState,
            },
          });
        }

        if (!env.DB) {
          return json({ error: "Publishing storage is not configured. Apply migration 0002 first." }, 503, origin, { "Set-Cookie": clearState });
        }
        const encryptedToken = await encryptSecret(tokenData.access_token, env.SESSION_SECRET);
        await env.DB.prepare(
          "INSERT INTO cms_github_tokens (user_login, encrypted_token, updated_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) ON CONFLICT(user_login) DO UPDATE SET encrypted_token = excluded.encrypted_token, updated_at = excluded.updated_at"
        ).bind(user.login, encryptedToken).run();

        const session = await createSession(user.login, env.SESSION_SECRET);
        const redirectHeaders = new Headers({
          "Location": url.origin + "/admin/?knot_login=success",
          "Cache-Control": "no-store",
        });
        redirectHeaders.append("Set-Cookie", clearState);
        redirectHeaders.append(
          "Set-Cookie",
          "__Host-knot_session=" + session + "; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=" + SESSION_TTL_SECONDS,
        );
        return new Response(null, { status: 302, headers: redirectHeaders });
      } catch {
        return json({ error: "OAuth authentication failed" }, 502, origin, { "Set-Cookie": clearState });
      }
    }

    if (url.pathname === "/api/publish-article" && request.method === "POST") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      const csrfError = await requireCsrf(request, env);
      if (csrfError) return csrfError;
      if (!env.DB) return json({ error: "Publishing storage is not configured" }, 503, origin);
      const declaredLength = Number(request.headers.get("Content-Length") || 0);
      if (declaredLength > 300000) return json({ error: "Article file is too large" }, 413, origin);
      let payload;
      try {
        const raw = await request.text();
        if (new TextEncoder().encode(raw).length > 300000) return json({ error: "Article file is too large" }, 413, origin);
        payload = JSON.parse(raw);
      } catch {
        return json({ error: "Invalid JSON body" }, 400, origin);
      }
      const slug = payload?.slug;
      const content = payload?.content;
      if (!validSlug(slug) || typeof content !== "string" || !content.trim() || content.length > 250000) {
        return json({ error: "Invalid slug or article content" }, 400, origin);
      }
      try {
        const row = await env.DB.prepare("SELECT encrypted_token FROM cms_github_tokens WHERE user_login = ?").bind(auth.session.login).first();
        if (!row?.encrypted_token) return json({ error: "GitHub publish permission is missing. Log out and sign in again." }, 401, origin);
        const githubToken = await decryptSecret(row.encrypted_token, env.SESSION_SECRET);
        const apiUrl = "https://api.github.com/repos/knotspace/knotspace.github.io/contents/src/content/blog/" + slug + ".md";
        const headers = {
          "Authorization": "Bearer " + githubToken,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "KNOT-CMS",
        };
        const existing = await fetch(apiUrl, { headers });
        if (existing.status === 200) return json({ error: "This slug already exists. Change the slug before publishing." }, 409, origin);
        if (existing.status !== 404) return json({ error: "GitHub could not check the target file." }, 502, origin);
        const write = await fetch(apiUrl, {
          method: "PUT",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Publish WordPress article: " + slug,
            content: encodeBase64Utf8(content),
            branch: "main",
          }),
        });
        const result = await write.json();
        if (!write.ok) return json({ error: result?.message || "GitHub rejected the publish request." }, 502, origin);
        return json({
          published: true,
          path: "src/content/blog/" + slug + ".md",
          commit: result.commit?.html_url || null,
        }, 201, origin);
      } catch {
        return json({ error: "Publishing failed. Check Worker logs and D1 migration." }, 502, origin);
      }
    }

    if (url.pathname === "/api/me" && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      const sessionCookie = cookieValue(request, "__Host-knot_session");
      const csrfToken = base64url(await hmac("csrf:" + sessionCookie, env.SESSION_SECRET));
      return json({
        authenticated: true,
        login: auth.session.login,
        expiresAt: auth.session.expiresAt,
        csrfToken,
      }, 200, origin);
    }

    if (url.pathname === "/auth/logout" && request.method === "POST") {
      const csrfError = await requireCsrf(request, env);
      if (csrfError) return csrfError;
      return json({ authenticated: false }, 200, origin, {
        "Set-Cookie": clearCookie("__Host-knot_session"),
      });
    }

    if (url.pathname === "/api/documents" && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      const collection = url.searchParams.get("collection");
      const status = url.searchParams.get("status");
      if (collection && collection !== "blog" && collection !== "pages") {
        return json({ error: "Invalid collection" }, 400, origin);
      }
      if (status && !["draft", "review", "published", "scheduled"].includes(status)) {
        return json({ error: "Invalid status" }, 400, origin);
      }
      const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
      let query = "SELECT document_id, collection, slug, title, status, scheduled_at, created_at, updated_at, published_at FROM cms_documents";
      const clauses = [];
      const values = [];
      if (collection) { clauses.push("collection = ?"); values.push(collection); }
      if (status) { clauses.push("status = ?"); values.push(status); }
      if (clauses.length) query += " WHERE " + clauses.join(" AND ");
      query += " ORDER BY updated_at DESC LIMIT ?";
      values.push(limit);
      try {
        const result = await env.DB.prepare(query).bind(...values).all();
        return json({ documents: result.results || [] }, 200, origin);
      } catch {
        return json({ error: "Could not load documents" }, 500, origin);
      }
    }

    if (url.pathname === "/api/documents" && request.method === "POST") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      const csrfError = await requireCsrf(request, env);
      if (csrfError) return csrfError;
      const parsed = await readJsonBody(request);
      if (parsed.error) return json({ error: parsed.error }, 400, origin);
      const body = parsed.value;
      const collection = body.collection;
      const slug = body.slug;
      const title = body.title;
      const status = body.status || "draft";
      if (collection !== "blog" && collection !== "pages") return json({ error: "collection must be blog or pages" }, 400, origin);
      if (!validSlug(slug)) return json({ error: "slug must use lowercase letters, numbers, and hyphens" }, 400, origin);
      if (!validTitle(title)) return json({ error: "title is required and must be at most 200 characters" }, 400, origin);
      if (!validStatus(status)) return json({ error: "Only draft and review can be created through this API" }, 400, origin);
      if (body.content === undefined) return json({ error: "content is required" }, 400, origin);
      let contentJson;
      try { contentJson = JSON.stringify(body.content); } catch { return json({ error: "content is not valid JSON" }, 400, origin); }
      if (new TextEncoder().encode(contentJson).length > MAX_DOCUMENT_BYTES) return json({ error: "Document is too large" }, 413, origin);

      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const row = {
        document_id: id, collection, slug, title: title.trim(), content_json: contentJson,
        status, scheduled_at: null, created_at: now, updated_at: now, published_at: null,
      };
      try {
        await env.DB.batch([
          env.DB.prepare("INSERT INTO cms_documents (document_id, collection, slug, title, content_json, status, scheduled_at, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL)")
            .bind(id, collection, slug, row.title, contentJson, status, now, now),
          env.DB.prepare("INSERT INTO cms_revisions (revision_id, document_id, snapshot_json, author_label) VALUES (?, ?, ?, ?)")
            .bind(crypto.randomUUID(), id, JSON.stringify(row), auth.session.login),
        ]);
        return json({ document: row }, 201, origin);
      } catch (error) {
        const message = String(error && error.message || "");
        if (message.includes("UNIQUE")) return json({ error: "That slug already exists in this collection" }, 409, origin);
        return json({ error: "Could not create document" }, 500, origin);
      }
    }

    const documentMatch = url.pathname.match(/^\/api\/documents\/([a-f0-9-]{36})$/i);
    if (documentMatch && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      try {
        const row = await env.DB.prepare("SELECT * FROM cms_documents WHERE document_id = ?").bind(documentMatch[1]).first();
        if (!row) return json({ error: "Document not found" }, 404, origin);
        let content;
        try { content = JSON.parse(row.content_json); } catch { content = row.content_json; }
        return json({ document: { ...row, content, content_json: undefined } }, 200, origin);
      } catch {
        return json({ error: "Could not load document" }, 500, origin);
      }
    }

    if (documentMatch && request.method === "PUT") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      const csrfError = await requireCsrf(request, env);
      if (csrfError) return csrfError;
      const parsed = await readJsonBody(request);
      if (parsed.error) return json({ error: parsed.error }, 400, origin);
      const body = parsed.value;
      try {
        const existing = await env.DB.prepare("SELECT * FROM cms_documents WHERE document_id = ?").bind(documentMatch[1]).first();
        if (!existing) return json({ error: "Document not found" }, 404, origin);
        const slug = body.slug === undefined ? existing.slug : body.slug;
        const title = body.title === undefined ? existing.title : body.title;
        const status = body.status === undefined ? existing.status : body.status;
        const collection = body.collection === undefined ? existing.collection : body.collection;
        if (collection !== existing.collection) return json({ error: "Moving documents between collections is not supported yet" }, 400, origin);
        if (!validSlug(slug)) return json({ error: "Invalid slug" }, 400, origin);
        if (!validTitle(title)) return json({ error: "Invalid title" }, 400, origin);
        if (!validStatus(status)) return json({ error: "Only draft and review can be saved through this API" }, 400, origin);
        let contentJson = existing.content_json;
        if (body.content !== undefined) {
          contentJson = JSON.stringify(body.content);
          if (new TextEncoder().encode(contentJson).length > MAX_DOCUMENT_BYTES) return json({ error: "Document is too large" }, 413, origin);
        }
        const now = new Date().toISOString();
        const nextRow = {
          ...existing, slug, title: title.trim(), content_json: contentJson,
          status, updated_at: now,
        };
        await env.DB.batch([
          env.DB.prepare("INSERT INTO cms_revisions (revision_id, document_id, snapshot_json, author_label) VALUES (?, ?, ?, ?)")
            .bind(crypto.randomUUID(), existing.document_id, JSON.stringify(documentSnapshot(existing)), auth.session.login),
          env.DB.prepare("UPDATE cms_documents SET slug = ?, title = ?, content_json = ?, status = ?, updated_at = ? WHERE document_id = ?")
            .bind(nextRow.slug, nextRow.title, nextRow.content_json, nextRow.status, now, existing.document_id),
        ]);
        let content;
        try { content = JSON.parse(nextRow.content_json); } catch { content = nextRow.content_json; }
        return json({ document: { ...nextRow, content, content_json: undefined } }, 200, origin);
      } catch (error) {
        const message = String(error && error.message || "");
        if (message.includes("UNIQUE")) return json({ error: "That slug already exists in this collection" }, 409, origin);
        return json({ error: "Could not update document" }, 500, origin);
      }
    }

    const revisionsMatch = url.pathname.match(/^\/api\/documents\/([a-f0-9-]{36})\/revisions$/i);
    if (revisionsMatch && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.response) return auth.response;
      try {
        const result = await env.DB.prepare("SELECT revision_id, document_id, created_at, author_label FROM cms_revisions WHERE document_id = ? ORDER BY created_at DESC LIMIT 50")
          .bind(revisionsMatch[1]).all();
        return json({ revisions: result.results || [] }, 200, origin);
      } catch {
        return json({ error: "Could not load revisions" }, 500, origin);
      }
    }

    return json({ error: "Not found" }, 404, origin);
  },
};
