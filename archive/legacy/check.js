// 矛盾検出: node check.js [N]
const fs=require('fs');
const s=fs.readFileSync(__dirname+'/index.html','utf8');const m=s.match(/<script>([\s\S]*)<\/script>/);
const eng=m[1].split('// ===== 状態 =====')[0];
const f=new Function('window','document','localStorage',eng+';return {newLife,stepYearAll,autoResolve}');
const E=f({}, {}, {});const E_JOBS=new Function(eng+';return JOBS')();
const N=+process.argv[2]||2000;const hits={};const ex={};
const hit=(k,L,msg)=>{hits[k]=(hits[k]||0)+1;if(!ex[k])ex[k]=[];if(ex[k].length<3)ex[k].push(msg)};
for(let i=0;i<N;i++){const L=E.newLife(true,null,null,2024);const jobAt=[];let prisonFrom=-1;
  while(L.alive&&L.age<125){const n0=L.events.length;const d=E.stepYearAll(L);if(d)E.autoResolve(L,d);
    for(let k=n0;k<L.events.length;k++){L.events[k]._job=L.job;L.events[k]._co=L.company;L.events[k]._age=L.age}
    if(!L.alive)break;L.age++}
  const ev=L.events.filter(e=>e.t);let own=false,prison=false,mech=-1;
  ev.forEach((e,i)=>{const t=e.t;
    const isOwn=e._job==="経営者"||/^(自分の|個人|父の|継いだ|夫婦の|自宅)/.test(e._co||"");
    if(isOwn&&/上司|課長に|課長と|部長に|人事で|同期の/.test(t))hit('own_boss',L,`${e._age}歳 ${e._job}/${e._co}: ${t.slice(0,60)}`);
    if(/逮捕|懲役|実刑|服役/.test(t)&&!/執行猶予/.test(t))prison=true;
    if(e._job==="服役中"&&/博士|ポスドク|学位|研究室/.test(t))hit('prison_phd',L,`${e._age}歳 ${t.slice(0,60)}`);
    if(/介護/.test(t)&&/(兄|姉|弟|妹|きょうだい)/.test(t)&&L.sibs&&0)0;
    if(L.sex==="F"&&/男子校|男子高|男子部/.test(t))hit('girl_boys',L,`${e._age}歳 ${t.slice(0,60)}`);
    if(L.sex==="M"&&/女子校|女子高|女子大/.test(t)&&/入学|合格|進学/.test(t))hit('boy_girls',L,`${e._age}歳 ${t.slice(0,60)}`);
    if(/(と|と、)結婚/.test(t)){const mm=t.match(/(自動車整備士|看護師|美容師|保育士|消防士|警察官|教員|医師|調理師|システムエンジニア|営業)/);if(mm)mech=[mm[1],i,e._job]}
  });
  if(mech!==-1){const [j,i,before]=mech;if(before!==j){const later=ev.slice(i+1,i+15).find(e=>e._job===j);if(later&&!/転職|になった|資格|就職|働き/.test(ev.slice(i,i+15).map(e=>e.t).join('')))hit('spouse_job',L,`${j}と結婚 前職${before}→${later._age}歳で${j}`)}}
  if(ev.some(e=>e._age>=76&&e._job&&e._job!=="無職"&&e._job!=="主婦・主夫"&&E_JOBS[e._job]&&E_JOBS[e._job].reg))hit('work76',L,ev.filter(e=>e._age>=76&&e._job!=="無職").slice(0,1).map(e=>e._age+'歳 '+e._job+' '+e.t.slice(0,40)).join());
  if(ev.some(e=>/内部進学/.test(e.t)))hit('naibu',L,ev.find(e=>/内部進学/.test(e.t)).t.slice(0,60));
  ev.forEach(e=>{if(/飲み会/.test(e.t)&&e._age<20)hit('nomikai_minor',L,e._age+'歳 '+e.t.slice(0,50));if(/孫/.test(e.t)&&!L.kids.some(k=>e._age-k.born>=25))hit('mago_early',L,e._age+'歳 '+e.t.slice(0,50));if(/初めての海外/.test(e.t)){const prev=ev.slice(0,ev.indexOf(e)).some(p=>/留学|海外赴任|移住|ワーキングホリデー/.test(p.t));if(prev)hit('first_abroad_again',L,e._age+'歳 '+e.t.slice(0,50))}if(/夫（妻）|妻（夫）/.test(e.t)&&!L.married&&!L.divorced&&!L.flags.widowed)hit('spouse_single',L,e._age+'歳 '+e.t.slice(0,50))});
  // 年収が上がった転職の直後にフリーター
  ev.forEach((e,i)=>{if(/転職/.test(e.t)&&/年収|給料/.test(e.t)&&/上が|増え/.test(e.t)&&e._job==="フリーター")hit('upjob_freeter',L,`${e._age}歳 ${e.t.slice(0,60)}`)});
  // 研究者・博士 + 服役
  if(L.flags.phd&&ev.some(e=>e._job==="服役中")){const pe=ev.find(e=>e._job==="服役中");const ph=ev.find(e=>/博士号/.test(e.t));if(ph&&pe&&ph._age>=pe._age&&ph._age<=pe._age+10)hit('prison_then_phd',L,`服役${pe._age} 博士${ph._age}`)}
}
console.log(JSON.stringify(hits));for(const k in ex)console.log(k,'\n  '+ex[k].join('\n  '));
