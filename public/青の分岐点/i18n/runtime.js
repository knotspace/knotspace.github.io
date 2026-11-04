// 表示時翻訳（ゲーム内部は日本語のまま。画面に出る瞬間だけ訳す）
(function(){
  var KEY="68man_lang",LANGS=["ja","en","zh","ko"];
  var lang=null;try{lang=localStorage.getItem(KEY)}catch(e){}
  if(!lang){var nl=(navigator.language||"ja").toLowerCase();lang=nl.indexOf("ja")===0?"ja":nl.indexOf("zh")===0?"zh":nl.indexOf("ko")===0?"ko":"en"}
  if(LANGS.indexOf(lang)<0)lang="ja";
  var I={lang:lang,ready:lang==="ja",t:function(s){return s},tl:function(s){return s}};
  window.I18N=I;
  I.set=function(l){try{localStorage.setItem(KEY,l)}catch(e){}location.reload()};
  document.addEventListener("click",function(e){var b=e.target&&e.target.closest&&e.target.closest(".lang[data-l]");if(b&&b.dataset.l!==I.lang)I.set(b.dataset.l)});
  if(lang==="ja")return;
  document.documentElement.lang=lang==="zh"?"zh-CN":lang;
  var hide=document.createElement("style");hide.textContent="body{visibility:hidden}";document.head.appendChild(hide);
  setTimeout(function(){hide.remove()},4000);
  var JP=/[぀-ヺー-ヿ㐀-鿿々〆ヵヶ]/,SEP=lang==="zh"?"":" ";
  var D={},P=[],cache=new Map(),OUT=new Set();
  function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
  var KEYS=null,NAMES=new Set(),MAXK=12;
  function build(dict){
    D=dict;P=[];KEYS=new Set();NAMES=new Set(dict.__names||[]);
    for(var k in dict){
      if(!/\{\d+\}/.test(k)){if(k.length>=2&&k.length<=MAXK)KEYS.add(k);continue}
      var parts=k.split(/\{(\d+)\}/),lits=[],order=[],n=0,longest="";
      for(var i=0;i<parts.length;i++){if(i%2===0){lits.push(parts[i]);n+=parts[i].length;if(parts[i].length>longest.length)longest=parts[i]}else order.push(+parts[i])}
      if(!n)continue;
      P.push({lits:lits,order:order,tr:dict[k],n:n,key:longest})}
    P.sort(function(a,b){return b.n-a.n})}
  var JPC=lang==="zh"?/[\u3040-\u309f]/g:/[\u3040-\u30fa\u30fc-\u30ff\u3400-\u9fff\u3005\u3006\u30f5\u30f6]/g;function jpn(s){var m=String(s).match(JPC);return m?m.length:0}
  var depth=0;
  // パターン照合（各スロットの中身が訳せる分け方を探す）
  function matchP(c,p){
    var L=p.lits,k=L.length-1,best=null;
    if(c.indexOf(L[0])!==0||c.length<p.n)return null;
    if(k>0&&L[k]&&c.slice(-L[k].length)!==L[k])return null;
    var vals=[];var tries=0;
    function rec(pos,i){ // L[i]は pos の直前で一致済み。次はスロット i
      if(tries++>200)return false;
      if(i===k)return pos===c.length;
      var next=L[i+1],cands=[];
      if(i+1===k){var endPos=c.length-next.length;if(endPos>=pos&&c.slice(endPos)===next)cands.push(endPos)}
      else if(next===""){for(var e=pos;e<c.length&&cands.length<24;e++)cands.push(e)}
      else{var f=c.indexOf(next,pos);while(f>=0&&cands.length<12){cands.push(f);f=c.indexOf(next,f+1)}}
      for(var j=0;j<cands.length;j++){var v=c.slice(pos,cands[j]);if(/[。！？]./.test(v)&&!((L[i]===""||/[。！？」\s]$/.test(L[i]))&&/[。！？」]$/.test(v)))continue;var tv=v===""?"":T(v);var bad=jpn(tv);
        vals[i]=tv;
        if(bad===0){if(rec(cands[j]+next.length,i+1))return true}
        else if(!best||bad<best.bad){/* 部分一致候補として保持 */}
      }
      return false}
    var ok=rec(L[0].length,0);
    if(ok===true)return {bad:0,out:fillV(p,vals)};
    if(best)return {bad:best.bad,out:fillV(p,best.vals)};
    return null}
  function fillV(p,vals){return p.tr.replace(/\{(\d+)\}/g,function(_,d){var i=p.order.indexOf(+d);return i<0?"":vals[i]})}
  function name(s){var q=s.split(/[ 　]/);if(q.length===2&&D[q[0]]!=null&&D[q[1]]!=null)return D[q[0]]+(lang==="zh"?"":" ")+D[q[1]];return null}
  function T(s){
    if(s==null)return s;s=String(s);
    if(!JP.test(s))return s;
    if(cache.has(s))return cache.get(s);
    if(depth===0&&OUT.has(s))return s;
    if(depth>8)return s;
    depth++;var r;try{r=T0(s)}finally{depth--}
    cache.set(s,r);if(depth===0)OUT.add(r);return r}
  function tokens(c){ // 最長一致で辞書語に分解（地名・短い語用）
    var out=[],i=0,any=false;
    while(i<c.length){var hit=null;for(var l=Math.min(MAXK,c.length-i);l>=1;l--){var w=c.substr(i,l);if((l>=2&&(KEYS.has(w)||NAMES.has(w)))||(l===1&&NAMES.has(w)&&i===c.length-1&&any)){hit=w;break}}
      if(hit){out.push(D[hit]);i+=hit.length;any=true}else{out.push(c[i]);i++}}
    if(!any)return c;
    return out.join(lang==="zh"?"":" ").replace(/ ([^\w\s]) /g,"$1")}
  var UNIT={
    en:[[/(\d[\d,]*)万円/g,function(_,a){var v=+a.replace(/,/g,"")*1e4;return "¥"+v.toLocaleString("en-US")}],[/(\d[\d,]*)円/g,"¥$1"],[/(\d+)歳/g,"age $1"],[/(\d+)年/g,"$1"],[/(\d[\d,]*)人/g,"$1 people"],[/(\d+)か月/g,"$1 months"],[/(\d+)回/g,"$1 times"],[/偏差値/g,"score "]],
    zh:[[/(\d[\d,]*)万円/g,"$1万日元"],[/(\d[\d,]*)円/g,"$1日元"],[/(\d+)歳/g,"$1岁"]],
    ko:[[/(\d[\d,]*)万円/g,"$1만 엔"],[/(\d[\d,]*)円/g,"$1엔"],[/(\d+)歳/g,"$1세"],[/(\d+)年/g,"$1년"],[/(\d[\d,]*)人/g,"$1명"],[/(\d+)か月/g,"$1개월"],[/(\d+)回/g,"$1회"],[/偏差値/g,"편차치 "]]};
  function units(o){(UNIT[lang]||[]).forEach(function(r){o=o.replace(r[0],r[1])});return o}
  function splitPlace(c){var m=c.match(/^(.{2,4}?[都道府県])?(.{1,6}?[市区町村郡])?(.{1,8}?[区町村])?$/);if(!m||!(m[1]||m[2]))return null;var o=[];for(var i=1;i<=3;i++)if(m[i]){var t=D[m[i]]!=null?D[m[i]]:(D[m[i].slice(0,-1)]!=null&&m[i].length>2?D[m[i].slice(0,-1)]:null);if(t==null)return null;o.push(t)}return lang==="zh"?o.join(""):o.reverse().join(", ")}
  function Tspan(c){
    if(D[c]!=null)return D[c];var c2=c.replace(/。$/,"");if(c2!==c&&D[c2]!=null)return D[c2]+(lang==="zh"?"。":/[.!?]$/.test(D[c2])?"":".");var n=name(c);if(n)return n;
    for(var i=0;i<P.length;i++){var p=P[i];if(p.key&&c.indexOf(p.key)<0)continue;var m=matchP(c,p);if(m&&m.bad===0)return m.out}
    return null}
  function cover(a){
    var n=a.length,best=new Array(n+1);best[0]={cost:0,parts:[]};
    for(var j=1;j<=n;j++){for(var i=Math.max(0,j-6);i<j;i++){if(!best[i])continue;var span=a.slice(i,j).join(""),tr;
        if(span==="\n")tr="\n";else if(j-i>1)tr=Tspan(span.trim());else tr=T(span.trim());
        if(tr==null)continue;var cost=best[i].cost+jpn(tr)*10+1;
        if(!best[j]||cost<best[j].cost)best[j]={cost:cost,parts:best[i].parts.concat([tr])}}}
    if(!best[n])return null;return best[n].parts.join(SEP).replace(/ ?\n ?/g,"\n")}
  var AL=[["役所","会社",{en:[[/\bcompany\b/gi,"office"],[/\bcompanies\b/gi,"offices"]],zh:[[/公司/g,"单位"]],ko:[[/회사/g,"관청"]]}],
    ["学校","会社",{en:[[/\bcompany\b/gi,"school"]],zh:[[/公司/g,"学校"]],ko:[[/회사/g,"학교"]]}],
    ["病院","会社",{en:[[/\bcompany\b/gi,"hospital"]],zh:[[/公司/g,"医院"]],ko:[[/회사/g,"병원"]]}],
    ["電話","LINE",{en:[[/\bLINE\b/g,"phone"]],zh:[[/LINE/g,"电话"]],ko:[[/LINE|라인/g,"전화"]]}],
    ["電話","スマホ",{en:[[/smartphones?/gi,"phone"]],zh:[[/智能手机|手机/g,"电话"]],ko:[[/스마트폰|스마폰/g,"전화"]]}],
    ["携帯","スマホ",{en:[[/smartphone/gi,"cell phone"]],zh:[[/智能手机/g,"手机"]],ko:[[/스마트폰|스마폰/g,"휴대폰"]]}],
    ["テレビ","SNS",{en:[[/social media|SNS/gi,"TV"]],zh:[[/社交媒体|社交网络|SNS/g,"电视"]],ko:[[/SNS|소셜 ?미디어/g,"TV"]]}],
    ["ネット","SNS",{en:[[/social media|SNS/gi,"the internet"]],zh:[[/社交媒体|社交网络|SNS/g,"网上"]],ko:[[/SNS|소셜 ?미디어/g,"인터넷"]]}],
    ["テレビ","YouTube",{en:[[/YouTube/g,"TV"]],zh:[[/YouTube|油管/g,"电视"]],ko:[[/YouTube|유튜브/g,"TV"]]}],
    ["ネット","YouTube",{en:[[/YouTube/g,"the internet"]],zh:[[/YouTube|油管/g,"网上"]],ko:[[/YouTube|유튜브/g,"인터넷"]]}],
    ["お見合い","マッチングアプリ",{en:[[/dating apps?|matching apps?/gi,"an arranged meeting"]],zh:[[/交友软件|相亲软件|婚恋软件|约会软件/g,"相亲"]],ko:[[/데이팅 ?앱|매칭 ?앱|소개팅 ?앱/g,"맞선"]]}],
    ["リサイクルショップ","メルカリ",{en:[[/Mercari/g,"a secondhand shop"]],zh:[[/Mercari|煤炉/g,"二手店"]],ko:[[/Mercari|메루카리/g,"중고 가게"]]}],
    ["「おじいちゃん」と呼ばれ","「おばあちゃん」と呼ばれ",{en:[[/Grandma/g,"Grandpa"],[/grandma/g,"grandpa"]],zh:[[/奶奶|外婆|老奶奶/g,"爷爷"]],ko:[[/할머니/g,"할아버지"]]}],
    ["「おばあちゃん」と呼ばれ","「おじいちゃん」と呼ばれ",{en:[[/Grandpa/g,"Grandma"],[/grandpa/g,"grandma"]],zh:[[/爷爷|外公|老爷爷/g,"奶奶"]],ko:[[/할아버지/g,"할머니"]]}],
    ["「おじいちゃんの話","「おばあちゃんの話",{en:[[/Grandma/g,"Grandpa"],[/grandma/g,"grandpa"]],zh:[[/奶奶|外婆/g,"爷爷"]],ko:[[/할머니/g,"할아버지"]]}],
    ["「お父さん」と呼ばれ","「お母さん」と呼ばれ",{en:[[/\bMom\b/g,"Dad"],[/\bmom\b/g,"dad"],[/Mother/g,"Father"],[/mother/g,"father"]],zh:[[/妈妈|母亲/g,"爸爸"]],ko:[[/엄마|어머니/g,"아빠"]]}],
    ["お父さんみたい","お母さんみたい",{en:[[/\bmom\b/gi,"dad"],[/mother/gi,"father"]],zh:[[/妈妈|母亲/g,"爸爸"]],ko:[[/엄마|어머니/g,"아빠"]]}],
    ["「お母さん」と呼ばれ","「お父さん」と呼ばれ",{en:[[/\bDad\b/g,"Mom"],[/\bdad\b/g,"mom"],[/Father/g,"Mother"],[/father/g,"mother"]],zh:[[/爸爸|父亲/g,"妈妈"]],ko:[[/아빠|아버지/g,"엄마"]]}],
    ["競馬","パチンコ",{en:[[/pachinko parlou?r|pachinko/gi,"horse racing"]],zh:[[/柏青哥店|柏青哥|弹珠店|小钢珠店|小钢珠|弹珠机/g,"赛马"]],ko:[[/파친코 ?가게|파친코장|파친코/g,"경마"]]}],
    ["オンラインカジノ","パチンコ",{en:[[/pachinko parlou?r|pachinko/gi,"online casino"]],zh:[[/柏青哥店|柏青哥|弹珠店|小钢珠店|小钢珠|弹珠机/g,"网络赌场"]],ko:[[/파친코 ?가게|파친코장|파친코/g,"온라인 카지노"]]}],
    ["競艇","パチンコ",{en:[[/pachinko parlou?r|pachinko/gi,"boat racing"]],zh:[[/柏青哥店|柏青哥|弹珠店|小钢珠店|小钢珠|弹珠机/g,"赛艇"]],ko:[[/파친코 ?가게|파친코장|파친코/g,"경정"]]}],
    ["FX","パチンコ",{en:[[/pachinko parlou?r|pachinko/gi,"FX trading"]],zh:[[/柏青哥店|柏青哥|弹珠店|小钢珠店|小钢珠|弹珠机/g,"外汇交易"]],ko:[[/파친코 ?가게|파친코장|파친코/g,"FX"]]}],
    ["パチンコの","パチンコ屋の",{en:[],zh:[],ko:[]}],
    ["交換日記","裏アカ",{en:[[/secret accounts?|burner accounts?|alt accounts?/gi,"exchange diary"]],zh:[[/小号|马甲/g,"交换日记"]],ko:[[/부계정|뒷계정/g,"교환일기"]]}]];
  function alias(c){
    for(var i=0;i<AL.length;i++){var a=AL[i];if(c.indexOf(a[0])<0)continue;var src=c.split(a[0]).join(a[1]);var tr=Tspan(src);if(tr==null){var ss=src.match(/[^。！？!?\n]+[。！？!?」）)]*|\n/g);if(ss&&ss.length>1)tr=cover(ss)}
      if(tr!=null&& !jpn(tr)){(a[2][lang]||[]).forEach(function(r){tr=tr.replace(r[0],r[1])});return tr}}
    return null}
  function list(c){if(/[。、]/.test(c))return null;var q=c.split("と");if(q.length<2)return null;var o=[];for(var i=0;i<q.length;i++){var t=D[q[i]];if(t==null)return null;o.push(t)}
    if(lang==="zh")return o.join("、");if(lang==="ko")return o.join(", ");return o.length===2?o.join(" and "):o.slice(0,-1).join(", ")+" and "+o[o.length-1]}
  I.miss=new Map();
  function T0(s){var r=T00(s);if(I.debug&&jpn(r)){var c=s.trim();if(!/[。！？]./.test(c)&&c.indexOf(" → ")<0)I.miss.set(c,(I.miss.get(c)||0)+1)}return r}
  function T00(s){
    var lead=s.match(/^\s*/)[0],trail=s.match(/\s*$/)[0],c=s.trim();
    if(D[c]!=null)return lead+D[c]+trail;
    var n=name(c);if(n)return lead+n+trail;
    var pl=splitPlace(c);if(pl)return lead+pl+trail;
    if(/^.○+$/.test(c))return lead+"？？？"+trail;
    if(/　/.test(c)){var fw=T(c.replace(/　/g," "));if( !jpn(fw))return lead+fw+trail}
    var br=c.match(/^【([^】]+)】\s*([\s\S]*)$/);if(br){var b1=T(br[1]);return lead+"["+b1+"]"+(br[2]?" "+T(br[2]):"")+trail}
    var sp=c.match(/^([^ 。、]+) ([^ 。、]+?)([。]?)$/);if(sp){var x1=T(sp[1]),x2=T(sp[2]);if( !jpn(x1+x2))return lead+x1+(lang==="zh"?"":" ")+x2+(sp[3]?(lang==="zh"?"。":"."):"")+trail}
    // 「選択 → 結果」
    if(c.indexOf(" → ")>0){return lead+c.split(" → ").map(T).join(" → ")+trail}
    var sents=c.match(/[^。！？!?\n]+[。！？!?」）)]*|\n/g),multi=sents&&sents.filter(function(x){return x!=="\n"}).length>1;
    var li=list(c);if(li)return lead+li+trail;
    var pm=c.match(/^([^（]+?)（([^（）]*(?:（[^（）]*）[^（）]*)*)）$/);if(pm&&/[。]/.test(pm[2])){var p1=T(pm[1]),p2=T(pm[2]);if( !jpn(p1+p2))return lead+p1+" ("+p2.replace(/[.。]$/,"")+")"+trail}
    if(!multi){var r1=Tspan(c);if(r1!=null)return lead+r1+trail}
    else{var o=cover(sents);if(o!=null)return lead+o+trail}
    if(!multi&&c.indexOf("、")>0){var cm=c.split("、");for(var q=1;q<cm.length;q++){var lf=cm.slice(0,q).join("、"),rt=cm.slice(q).join("、");var tr2=Tspan(rt);if(tr2!=null){var tl=T(lf);if( !jpn(tl))return lead+tl+(lang==="zh"?"，":", ")+tr2+trail}}}
    var al=alias(c);if(al!=null)return lead+al+trail;
    var segs=c.split(/(、|→|・|／|：|（|）|\(|\)|「|」|【|】| )/);
    if(segs.length>1){var o2=segs.map(function(x){if(!x)return x;if(!JP.test(x))return x;return T(x)}).join("");
      o2=o2.replace(/、/g,lang==="zh"?"，":", ").replace(/（/g," (").replace(/）/g,") ").replace(/「|」/g,lang==="ko"?"'":"\"").replace(/【/g,"[").replace(/】/g,"] ").replace(/・/g,lang==="zh"?"·":" · ").replace(/\s+/g," ").trim();
      if(jpn(o2)<jpn(c))return lead+units(o2)+trail}
    var nm=c.match(/^([\d,.]+)(.+)$/);if(nm&&D["{0}"+nm[2]]!=null)return lead+D["{0}"+nm[2]].replace("{0}",nm[1])+trail;
    var u=units(c);if(u!==c&& !jpn(u))return lead+u+trail;
    if(c.length<=30&&!/[。]./.test(c)){var tk=tokens(c.replace(/。$/,""))+(/。$/.test(c)?(lang==="zh"?"。":"."):"");if(jpn(tk)<jpn(c))return lead+units(tk)+trail}
    return lead+units(c)+trail}
  I.t=T;I.tl=function(s){return String(s).split("\n").map(T).join("\n")};
  // ===== DOM =====
  var SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,RT:1,RP:1,NOSCRIPT:1,TEMPLATE:1};
  var LEAFOK={RUBY:1,RT:1,RP:1,BR:1};
  function textNoRt(el){var s="";el.childNodes.forEach(function(n){if(n.nodeType===3)s+=n.nodeValue;else if(n.nodeType===1){if(n.tagName==="RT"||n.tagName==="RP")return;if(n.tagName==="BR"){s+="\n";return}s+=textNoRt(n)}});return s}
  function isLeaf(el){for(var c=el.firstElementChild;c;c=c.nextElementSibling){if(!LEAFOK[c.tagName])return false;if(c.tagName==="RUBY"&&c.querySelector(":not(rt):not(rp)"))return false}return true}
  function attr(el){["placeholder","title","aria-label","alt"].forEach(function(a){var v=el.getAttribute&&el.getAttribute(a);if(v&&JP.test(v)){var tv=T(v);if(tv!==v)el.setAttribute(a,tv)}});if((el.tagName==="INPUT")&&(el.type==="button"||el.type==="submit")&&JP.test(el.value)&&T(el.value)!==el.value)el.value=T(el.value)}
  function walk(el){
    if(el.nodeType!==1||SKIP[el.tagName]||(el.closest&&el.closest(".notr")))return;
    attr(el);
    if(el.firstElementChild&&el.querySelector("ruby")&&isLeaf(el)){var tx=textNoRt(el);if(JP.test(tx)){var tr=T(tx);if(tr!==tx){el.textContent=tr;return}}}
    for(var n=el.firstChild;n;n=n.nextSibling){
      if(n.nodeType===3){if(JP.test(n.nodeValue)){var t=T(n.nodeValue);if(t!==n.nodeValue)n.nodeValue=t}}
      else if(n.nodeType===1)walk(n)}}
  var pending=new Set(),sched=false;
  function flush(){sched=false;var a=Array.from(pending);pending.clear();a.forEach(function(n){if(n.nodeType===3){var p=n.parentElement;if(p&&!SKIP[p.tagName]&&!(p.closest&&p.closest(".notr"))){if(p.querySelector("ruby")&&isLeaf(p))walk(p);else if(JP.test(n.nodeValue)){var t2=T(n.nodeValue);if(t2!==n.nodeValue)n.nodeValue=t2}}}else walk(n)});if(JP.test(document.title)&&T(document.title)!==document.title)document.title=T(document.title)}
  var mo=new MutationObserver(function(ms){if(!I.ready)return;ms.forEach(function(m){if(m.type==="characterData")pending.add(m.target);else if(m.type==="attributes")pending.add(m.target);else m.addedNodes.forEach(function(n){pending.add(n)})});flush()});
  // canvas
  var C=window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype;
  if(C){["fillText","strokeText","measureText"].forEach(function(f){var o=C[f];C[f]=function(t){var a=Array.prototype.slice.call(arguments);if(I.ready&&typeof t==="string")a[0]=T(t);return o.apply(this,a)}})}
  ["alert","confirm"].forEach(function(f){var o=window[f];window[f]=function(t){return o.call(window,I.ready?T(t):t)}});
  fetch("i18n/"+lang+".json").then(function(r){return r.json()}).then(function(d){build(d);I.ready=true;
    var go=function(){walk(document.body);document.title=T(document.title);mo.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["placeholder","title","aria-label","value"]});hide.remove()};
    if(document.body)go();else document.addEventListener("DOMContentLoaded",go)}).catch(function(){hide.remove()});
})();
// KNOT release notes loader (kept separate from the simulation engine)
document.addEventListener("DOMContentLoaded",function(){var rn=document.createElement("script");rn.src="/release-notes.js";rn.dataset.releaseApp="life";rn.defer=true;document.head.appendChild(rn);},{once:true});

