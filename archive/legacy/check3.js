// ご意見（2026-10-16 #444〜）の矛盾検出: node check3.js [N]
const fs=require('fs');
const s=fs.readFileSync(__dirname+'/index.html','utf8');const m=s.match(/<script>([\s\S]*)<\/script>/);
const eng=m[1].split('// ===== 状態 =====')[0];
const E=new Function('window','document','localStorage',eng+';return {newLife,stepYearAll,autoResolve}')({}, {}, {});
const N=+process.argv[2]||2000;const hits={},ex={};
const hit=(k,msg)=>{hits[k]=(hits[k]||0)+1;(ex[k]=ex[k]||[]);if(ex[k].length<4)ex[k].push(msg)};
for(let i=0;i<N;i++){const by=[1960,1985,2000,2024,2024,2040][i%6];const L=E.newLife(true,null,null,by);
  const snaps=[];
  while(L.alive&&L.age<125){const n0=L.events.length;const F=L.flags;
    const pre={car:!!F.car,married:L.married,partner:L.partner,hs:L.hs,edu:L.edu,univ:L.univ,where:L.where,job:L.job,co:L.company,lic:!!F.lic,sex:L.sex,selfEmp:/^(自分の|個人|父の|母の|親の|継いだ|夫婦の|自宅|実家の)/.test(L.company||"")||L.job==="経営者"};
    const d=E.stepYearAll(L);if(d)E.autoResolve(L,d);
    for(let k=n0;k<L.events.length;k++){const e=L.events[k];e._a=L.age;e._p=pre;e._job=L.job}
    if(!L.alive)break;L.age++}
  const ev=L.events.filter(e=>e.t);const T=e=>e._a+'歳 '+e.t.slice(0,90);
  let dadDeaths=0,momDeaths=0,mar=null,fl=false,ownHome=false;
  ev.forEach((e,i)=>{const t=e.t,p=e._p||{};
    if(/(?<![叔伯祖義])父(の[^。、]{1,8})?(が|を)?[^。]{0,10}(亡くなった|看取った|息を引き取った)/.test(t)&&!/叔父|祖父|義父|夫の父|妻の父/.test(t))dadDeaths++;
    if(/(?<![叔伯祖義])母(の[^。、]{1,8})?(が|を)?[^。]{0,10}(亡くなった|看取った|息を引き取った)/.test(t)&&!/叔母|祖母|義母|夫の母|妻の母/.test(t))momDeaths++;
    if(!p.car&&/車(が|は)?(2台とも)?水没|車の塗装|愛車/.test(t))hit('car_none',T(e));
    if(p.selfEmp&&/副業禁止/.test(t))hit('selfemp_fukugyo',T(e)+' /'+p.co);
    if(p.sex==="F"&&/「お父さんの仕事|彼女に言われ|彼女に(「|怒|笑)/.test(t)&&!/友人の|同僚の/.test(t))hit('sex_F',T(e));
    if(p.sex==="M"&&/「お母さんの仕事|彼氏に言われ/.test(t))hit('sex_M',T(e));
    if(/ひとり親/.test(t)&&L.married&&p.married)hit('hitorioya_married',T(e));
    if(/沖縄(旅行|に旅行|へ旅行)/.test(t)&&/沖縄/.test(p.where||""))hit('okinawa_trip',T(e));
    if(!p.hs&&e._a>=16&&/高校の(先生|担任|恩師|教師)|高校時代の(先生|担任|恩師)/.test(t))hit('nohs_teacher',T(e)+' edu='+p.edu);
    if(/部活の先輩/.test(t)&&L.flags.kitaku)hit('kitaku_senpai',T(e));
    if(/(教室|スクール)を辞めた。試合/.test(t))hit('lesson_match',T(e));
    if(/同乗中/.test(t)&&/自転車|横断中|歩行中/.test(t))hit('death_mix',T(e));
    if(/(一人暮らし|ひとり暮らし)を始めた/.test(t)&&ev.slice(0,i).some(q=>/一人暮らしで初めて|一人暮らしの部屋/.test(q.t)))hit('alone_order',T(e));
    if(/軽音部|吹奏楽部|に入部/.test(t)&&e._a<=15&&ev.slice(i+1).some(q=>q._a===e._a&&/高校に合格|合格発表/.test(q.t)))hit('club_before_pass',T(e));
    if(/運転免許(を取|を取得|を取る)/.test(t)&&!/現地|国際|取り直/.test(t)&&p.car)hit('lic_after_car',T(e));
    if(!p.univ&&e._a>=18&&e._a<=24&&/(大学|キャンパス)の(授業|ゼミ|サークル|学園祭|学食|図書館)|ゼミの(先生|教授|発表)|単位を落と|履修登録/.test(t)&&!/中退|入学|合格|受験|オープンキャンパス|友だちの|友人の|兄|姉|子ども|息子|娘|進学しな|行かなかった/.test(t))hit('univ_none',T(e)+' edu='+p.edu);
    if(p.sex==="M"&&/スカート|生理(痛|が)|ブラジャー|つわり|出産した|妊娠した|女子会|「おばあちゃん|「お母さん」と呼|ママ友|産休を取|女子校に|女子高に|キャバ嬢として|ヒール/.test(t)&&!/(彼女|妻|娘|母|姉|妹|客|配偶者|恋人|友人|同僚|女性|相手|パートナー|孫)(が|の|に|は|と)/.test(t))hit('gender_M',T(e));
    if(p.sex==="F"&&/男子校|学ラン|髭を剃|ひげを剃|「おじいちゃん|「お父さん」と呼|パパ友|ホストとして|キャバクラに通|彼女ができ/.test(t)&&!/(彼|夫|息子|父|兄|弟|配偶者|恋人|友人|同僚|男性|相手|パートナー|孫)(が|の|に|は|と)/.test(t)&&!L.flags.samesex)hit('gender_F',T(e));
    if(/(夫|配偶者)[^。]{0,20}乳がん/.test(t)&&p.sex==="F")hit('husband_breast',T(e));
    if(/(習いはじめた|習い始めた)/.test(t))L._les=1;
    if(/(ピアノ|バイオリン|バレエ|習字|そろばん|公文|英会話)(の発表会|で初めて賞|の進級)/.test(t)&&!L._les)hit('lesson_nostart',T(e));
  });
  {const n=ev.filter(e=>/炎上/.test(e.t)).length;if(n>=3)hit('enjou3',n+'回');hits.enjouSum=(hits.enjouSum||0)+n}
  if(dadDeaths>1)hit('dad_twice',ev.filter(e=>/(?<![叔伯祖義])父.{0,20}(亡くなった|看取った)/.test(e.t)).map(T).join(' / '));
  if(momDeaths>1)hit('mom_twice',ev.filter(e=>/(?<![叔伯祖義])母.{0,20}(亡くなった|看取った)/.test(e.t)).map(T).join(' / '));
  if(/医学部/.test(L.fac||"")&&L.univGrad&&L.age>L.univGrad+3&&!ev.some(e=>/医師|国家試験|国試/.test(e.t))&&!/医師/.test(L.job))hit('med_no_doctor',L.univ+' '+L.fac+' job='+L.job);
}
console.log(JSON.stringify(hits));for(const k in ex)console.log(k,'\n  '+ex[k].join('\n  '));
