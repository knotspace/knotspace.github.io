// ご意見フォームで届いた矛盾の検出: node check2.js [N]
const fs=require('fs');
const s=fs.readFileSync(__dirname+'/index.html','utf8');const m=s.match(/<script>([\s\S]*)<\/script>/);
const eng=m[1].split('// ===== 状態 =====')[0];
const f=new Function('window','document','localStorage',eng+';return {newLife,stepYearAll,autoResolve,YOMI:typeof YOMI!=="undefined"?YOMI:null}');
const E=f({}, {}, {});
const N=+process.argv[2]||2000;const hits={};const ex={};
const hit=(k,msg)=>{hits[k]=(hits[k]||0)+1;if(!ex[k])ex[k]=[];if(ex[k].length<4)ex[k].push(msg)};
for(let i=0;i<N;i++){const by=1950+Math.floor(Math.random()*76);const L=E.newLife(true,null,null,by);
  const own=L.name.split(" ")[1];(L.sibs||[]).forEach(b=>{const g=b.n.split(" ")[1];if(g===own||(g.length===own.length&&g.length>=2&&[...g].filter((c,i)=>c!==own[i]).length===1))hit('sib_name',`${L.name} / ${b.n}`)});
  const left=new Set();let prevCo="";
  while(L.alive&&L.age<125){const n0=L.events.length;const snap={job:L.job,co:L.company,prison:L.prison,kids:L.kids.filter(k=>!k.dead&&!k.out).length,ss:!!L.flags.samesex,lover:!!L.lover,married:L.married};
    const d=E.stepYearAll(L);if(d)E.autoResolve(L,d);
    for(let k=n0;k<L.events.length;k++){const e=L.events[k];const t=e.t||"";if(!t)continue;const x=L.age;
      const inPrison=snap.prison>0||snap.job==="服役中";
      if(inPrison&&L.prison>0&&/残業|出社|上司|職場|締め切り|取引先|部下|昇進|昇給|ボーナス|同僚|シフト|会社で|現場で|患者|客/.test(t)&&!/刑務|房|面会|出所|服役|逮捕|判決|看守/.test(t))hit('prison_work',`${x}歳 ${snap.job}: ${t.slice(0,70)}`);
      if(L.sex==="F"&&/バレンタイン|チョコ/.test(t)&&/もら|貰|義理チョコだけ|下駄箱/.test(t)&&!/渡/.test(t))hit('f_valentine',`${x}歳: ${t.slice(0,60)}`);
      if(/^(無職|主婦・主夫)$/.test(snap.job)&&/残業|締め切り|納期|出社/.test(t))hit('nojob_office',`${x}歳 ${snap.job}: ${t.slice(0,60)}`);
      if(/医学部/.test(L.fac||"")&&L.univGrad&&x<L.univGrad&&/就活|就職活動|エントリーシート|内定|インターン|面接/.test(t)&&!/医局|研修|マッチング/.test(t))hit('med_shukatsu',`${x}歳(卒${L.univGrad}) ${t.slice(0,70)}`);
      if(L.home&&/東京/.test(L.home)&&/地元の国立にしなさい|地元の国立を/.test(t))hit('tokyo_local',`${L.home}: ${t.slice(0,60)}`);
      if(snap.ss&&/付き合|同棲|と結婚した|再婚|プロポーズ/.test(t)&&!/パートナー/.test(t))hit('ss_overlap',`${x}歳: ${t.slice(0,60)}`);
      if(/(?<!ペ)アローン/.test(t))hit('aloan',t.slice(0,40));
      if(snap.kids===0&&L.kids.filter(k=>!k.dead&&!k.out).length===0&&/寝顔|子どもに「|子供に「|子どもの運動会|子どもの宿題/.test(t))hit('kids_none',`${x}歳 ${snap.married?"既婚":"未婚"}: ${t.slice(0,60)}`);
      if(L.sex==="F"&&/「おじさん」と呼ばれ/.test(t))hit('f_ojisan',`${x}歳: ${t.slice(0,60)}`);
      if(/勤め先の株/.test(t)&&!(snap.co&&t.includes(snap.co)))hit('stock_employer',`${snap.job}/${snap.co}: ${t.slice(0,60)}`);
      if(/希望退職|リストラ|倒産|クビ|解雇/.test(t)&&snap.co)left.add(snap.co);
    }
    if(L.company&&L.company!==prevCo&&left.has(L.company)&&!/地元|自分の|個人|父の|継いだ|夫婦の|自宅|会社$|店$|工場$/.test(L.company))hit('rehire_left',`${L.age}歳 ${L.company}に戻った (${L.job})`);
    if(L.prison>0&&L.job!=="服役中")hit('prison_jobstate',`${L.age}歳 prison=${L.prison} job=${L.job}`);
    prevCo=L.company;
    if(!L.alive)break;L.age++}
}
console.log(JSON.stringify(hits));for(const k in ex)console.log(k,'\n  '+ex[k].join('\n  '));
