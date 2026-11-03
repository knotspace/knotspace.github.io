(() => {
"use strict";
const CMS=window.CMS,h=window.h,createClass=window.createClass;
if(!CMS||typeof CMS.registerWidget!=="function"||typeof h!=="function"||typeof createClass!=="function"){
  console.error("[KNOT] Block editor could not initialize. Check Decap CMS script loading order and globals.");
  return;
}
const TYPES={
 paragraph:{label:"段落",make:()=>({type:"paragraph",text:""})},
 heading:{label:"見出し",make:()=>({type:"heading",level:2,text:"新しい見出し"})},
 image:{label:"画像",make:()=>({type:"image",src:"",alt:"",caption:""})},
 quote:{label:"引用",make:()=>({type:"quote",text:"",attribution:""})},
 callout:{label:"ポイント枠",make:()=>({type:"callout",title:"ポイント",text:"",style:"note"})},
 list:{label:"リスト",make:()=>({type:"list",items:"",ordered:false})},
 button:{label:"ボタン",make:()=>({type:"button",label:"詳しく見る",url:""})},
 divider:{label:"区切り線",make:()=>({type:"divider"})}
};
const values=v=>{if(v&&typeof v.toJS==="function")v=v.toJS();return Array.isArray(v)?v.map(x=>x&&typeof x.toJS==="function"?x.toJS():x).filter(Boolean):[];};
const field=(label,value,change,multi)=>h("label",{className:"knot-block-field"},h("span",{},label),multi?h("textarea",{value:value||"",rows:4,placeholder:"ここに入力…",onChange:e=>change(e.target.value)}):h("input",{type:"text",value:value||"",placeholder:"ここに入力…",onChange:e=>change(e.target.value)}));
const inline=(tag,value,change,placeholder,extra={})=>h(tag,Object.assign({className:"knot-inline-edit",contentEditable:true,suppressContentEditableWarning:true,"data-placeholder":placeholder,onInput:e=>change(e.currentTarget.innerText),onBlur:e=>change(e.currentTarget.innerText)},extra),value||"");
const Control=createClass({
 getInitialState(){return{newType:"paragraph",dragIndex:null};},
 change(i,patch){const a=values(this.props.value).map(x=>Object.assign({},x));a[i]=Object.assign({},a[i],patch);this.props.onChange(a);},
 add(){const a=values(this.props.value).slice();a.push(TYPES[this.state.newType].make());this.props.onChange(a);},
 move(i,d){const a=values(this.props.value).slice(),j=i+d;if(j<0||j>=a.length)return;const x=a.splice(i,1)[0];a.splice(j,0,x);this.props.onChange(a);},
 drop(i){const from=this.state.dragIndex;this.setState({dragIndex:null});if(from===null||from===i)return;const a=values(this.props.value).slice(),x=a.splice(from,1)[0];a.splice(i,0,x);this.props.onChange(a);},
 remove(i){const a=values(this.props.value).slice();a.splice(i,1);this.props.onChange(a);},
 duplicate(i){const a=values(this.props.value).slice();a.splice(i+1,0,Object.assign({},a[i]));this.props.onChange(a);},
 fields(b,i){const set=p=>this.change(i,p);switch(b.type){
 case"paragraph":return h("div",{className:"knot-live-canvas"},inline("p",b.text,v=>set({text:v}),"ここをクリックして本文を入力…"));
 case"heading":return h("div",{className:"knot-live-canvas"},inline(b.level===3?"h3":"h2",b.text,v=>set({text:v}),"見出しを入力…"),h("label",{className:"knot-block-inline-setting"},"見出しレベル ",h("select",{value:String(b.level||2),onChange:e=>set({level:Number(e.target.value)})},h("option",{value:"2"},"H2"),h("option",{value:"3"},"H3"))));
 case"image":return h("div",{className:"knot-block-fields"},field("画像URL（/uploads/...）",b.src,v=>set({src:v})),field("代替テキスト",b.alt,v=>set({alt:v})),field("キャプション",b.caption,v=>set({caption:v})),b.src?h("div",{className:"knot-image-preview"},h("img",{src:b.src,alt:b.alt||"",onError:e=>{e.currentTarget.style.display="none";}}),h("small",{},"画像プレビュー")):h("p",{className:"knot-block-help"},"画像をメディアライブラリにアップロードし、URLを指定してください。"));
 case"quote":return h("div",{className:"knot-live-canvas knot-live-quote"},inline("blockquote",b.text,v=>set({text:v}),"引用文を入力…"),field("出典・人物名",b.attribution,v=>set({attribution:v})));
 case"callout":return h("div",{className:"knot-live-canvas knot-live-callout"},field("見出し",b.title,v=>set({title:v})),inline("div",b.text,v=>set({text:v}),"枠内の説明を入力…"),h("label",{className:"knot-block-inline-setting"},"デザイン ",h("select",{value:b.style||"note",onChange:e=>set({style:e.target.value})},[["point","ポイント"],["note","補足"],["warning","注意"],["summary","まとめ"]].map(x=>h("option",{value:x[0],key:x[0]},x[1])))));
 case"list":return h("div",{className:"knot-block-fields"},field("項目（1行に1つ）",b.items,v=>set({items:v}),true),h("label",{className:"knot-block-check"},h("input",{type:"checkbox",checked:!!b.ordered,onChange:e=>set({ordered:e.target.checked})}),"番号付きリスト"),h("div",{className:"knot-list-preview"},(b.items||"").split("\n").filter(Boolean).map((x,n)=>h("div",{key:n},(b.ordered?(n+1)+". ":"• ")+x))));
 case"button":return h("div",{className:"knot-block-fields"},field("表示文字",b.label,v=>set({label:v})),field("リンク先URL",b.url,v=>set({url:v})),h("div",{className:"knot-button-preview"},b.label||"ボタン"));
 case"divider":return h("div",{className:"knot-divider-preview"},h("hr",{}),h("small",{},"区切り線"));
 default:return h("div",{className:"knot-live-canvas"},inline("p",b.text,v=>set({text:v}),"ここをクリックして本文を入力…"));
 }},
 render(){const blocks=values(this.props.value);return h("section",{className:"knot-block-editor"},
 h("div",{className:"knot-block-editor-head"},h("div",{},h("strong",{},"本文ブロックエディター"),h("small",{},"本文を直接クリックして入力。ドラッグまたは矢印で順番を変更できます。")),h("span",{className:"knot-block-count"},blocks.length+" ブロック")),
 blocks.length?blocks.map((raw,i)=>{const b=Object.assign({type:"paragraph"},raw),type=TYPES[b.type]?b.type:"paragraph";return h("article",{className:"knot-block-card",key:i,draggable:true,onDragStart:()=>this.setState({dragIndex:i}),onDragOver:e=>e.preventDefault(),onDrop:e=>{e.preventDefault();this.drop(i);},onDragEnd:()=>this.setState({dragIndex:null})},
 h("div",{className:"knot-block-card-head"},h("span",{className:"knot-block-type"},TYPES[type].label),h("div",{className:"knot-block-actions"},
 h("button",{type:"button",disabled:i===0,title:"上へ",onClick:()=>this.move(i,-1)},"↑"),
 h("button",{type:"button",disabled:i===blocks.length-1,title:"下へ",onClick:()=>this.move(i,1)},"↓"),
 h("button",{type:"button",onClick:()=>this.duplicate(i)},"複製"),
 h("button",{type:"button",className:"is-danger",onClick:()=>this.remove(i)},"削除"))),this.fields(Object.assign({},b,{type}),i));}):h("div",{className:"knot-block-empty"},"まだブロックがありません。下から「段落」などを追加してください。"),
 h("div",{className:"knot-block-add"},h("select",{value:this.state.newType,onChange:e=>this.setState({newType:e.target.value})},Object.keys(TYPES).map(t=>h("option",{value:t,key:t},TYPES[t].label))),h("button",{type:"button",onClick:this.add},"＋ ブロックを追加")));
 }
});
CMS.registerWidget("knot-block-editor",Control);
console.info("[KNOT] Visual block editor registered.");
})();