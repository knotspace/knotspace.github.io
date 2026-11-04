// 大規模矛盾検出: node check5.js N seed
const fs=require('fs');const s=fs.readFileSync(__dirname+'/index.html','utf8');const m=s.match(/<script>([\s\S]*)<\/script>/);const eng=m[1].split('// ===== 状態 =====')[0];
const N=+process.argv[2]||1000,seed=+process.argv[3]||1;let st=seed*2654435761%4294967296;Math.random=()=>{st=(st*1664525+1013904223)%4294967296;return st/4294967296};
const E=new Function('window','document','localStorage',eng+';return {newLife,stepYearAll,autoResolve,JOBS}')({}, {}, {});
const hits={},ex={};const hit=(k,msg)=>{hits[k]=(hits[k]||0)+1;(ex[k]=ex[k]||[]);if(ex[k].length<6)ex[k].push(msg)};
const BY=[1950,1965,1980,1995,2005,2024,2024,2024,2040];
for(let i=0;i<N;i++){let L;try{L=E.newLife(Math.random()<.5,null,null,BY[i%BY.length]);const snaps=[];
  while(L.alive&&L.age<125){const n0=L.events.length;const pre={married:L.married,kids:L.kids.filter(k=>!k.dead&&!k.out).length,job:L.job,hs:!!L.hs,univ:!!L.univ,lover:L.lover&&L.lover.n,where:L.where,sex:L.sex,mom:!L.flags.momDead,dad:!L.flags.parentDead&&!L.flags.single,car:!!L.flags.car,y:L.birthYear+L.age};
    const d=E.stepYearAll(L);if(d)E.autoResolve(L,d);for(let k=n0;k<L.events.length;k++){const e=L.events[k];e._p=pre;e._a=L.age;e._job=L.job}
    if(!L.alive)break;L.age++}
 }catch(err){hit('CRASH',String(err&&err.stack||err).split('\n').slice(0,3).join(' | '));continue}
 const ev=L.events.filter(e=>e.t),T=e=>`${e._a}歳(${e._p&&e._p.y}) ${e.t.slice(0,90)}`;
 const cnt=re=>ev.filter(e=>re.test(e.t)).length;
 // 一度きりのはずの出来事の重複
 [[/^.{0,20}初めての恋人/,'first_lover'],[/第一子が生まれた/,'first_child'],[/に入学した（偏差値/,'univ_enter'],[/成人式。/,'seijin'],[/還暦。/,'kanreki'],[/^\d+歳。医師国家試験に合格|3月、医師国家試験に合格/,'med_exam']].forEach(([re,k])=>{const n=cnt(re);if(n>1)hit('dup_'+k,ev.filter(e=>re.test(e.t)).map(T).join(' / ').slice(0,260))});
 // 死亡が2回
 if(cnt(/(歳で|歳。)(亡くなった|死去)|^(.*)で亡くなった。\d+歳/)>1)0;
 ev.forEach((e,i)=>{const t=e.t,p=e._p||{},a=e._a;
  if(/\bundefined\b|NaN|null歳|\$\{/.test(t))hit('broken_text',T(e));
  if(/^\d+歳。\s*$/.test(t))hit('empty_text',T(e));
  if(a<16&&!/^\d{4}年、|世界的に流行|先輩たち/.test(t)&&/(会社|上司|残業|給料日|部下|昇進)/.test(t)&&!/父|母|親|兄|姉|祖|おじ|おば|将来|夢|ごっこ|バイト/.test(t))hit('kid_work',T(e));
  if(a<20&&/(酒を飲|ビール|二日酔い|居酒屋で飲|朝まで飲)/.test(t)&&!/父|母|親|大人|先生|未成年|飲まな|ウーロン|ジュース|兄|姉|先輩/.test(t))hit('minor_drink',T(e));
  if(a>=85&&/(転職|就職した|起業し|入社|昇進|部長に|課長に|マッチングアプリ|合コン|出産|妊娠)/.test(t)&&!/孫|子ども|息子|娘|昔|若い頃|かつて|ニュース/.test(t))hit('old_active',T(e));
  if(!p.married&&!L.mar&&/(^|[。、「])(妻|夫)(が|と|に|は)/.test(t)&&!/元|元の|友人の|兄の|姉の|妹の|弟の|上司の|同僚の|祖|母の|父の|親の|知人|離婚|結婚|亡く|再婚|プロポーズ|婚約|事実婚|不倫|お客|他人/.test(t)&&!L.flags.samesex)hit('spouse_unmarried',T(e));
  if(p.kids===0&&/(息子|娘)(が|と|に|は|の)/.test(t)&&!/名乗る|近所|友人|知人|同僚|上司|兄|姉|弟|妹|生まれ|産ま|妊娠|養子|夫の|妻の|の息子|の娘|亡く|社長|客|患者|生徒/.test(t)&&a>=20)hit('child_none',T(e));
  if(!p.mom&&/(?<![祖義叔伯])母(が|と|に|は|から)/.test(t)&&!/亡|墓|仏壇|遺|命日|思い出|生前|形見|新しい|義|継|祖|妻の|夫の|友人の|の母/.test(t))hit('dead_mom_alive',T(e));
  if(!p.dad&&/(?<![祖義叔伯])父(が|と|に|は|から)/.test(t)&&!/亡|墓|仏壇|遺|命日|思い出|生前|形見|新しい|義|継|祖|妻の|夫の|友人の|の父|知らな|いな/.test(t))hit('dead_dad_alive',T(e));
  if(p.sex==="M"&&/(妊娠した|出産した|つわり|生理|産休を取|女子校に入|スカート丈)/.test(t)&&!/妻|彼女|恋人|娘|母|姉|妹|パートナー|配偶者|同僚|友人|交際相手|不倫相手/.test(t))hit('gender_M',T(e));
  if(p.sex==="F"&&/(男子校に入|ひげを剃|立ち小便|認知の書類)/.test(t)&&!/夫|彼|息子|父|兄|弟|パートナー|配偶者/.test(t))hit('gender_F',T(e));
  {const ym=t.match(/^(\d{4})年、/);if(ym&&Math.abs(+ym[1]-p.y)>1&&!/前|ぶり|あの/.test(t))hit('year_mismatch',T(e)+' (今'+p.y+')')}
  if(/(\d+)歳だった。/.test(t)){const v=+t.match(/(\d+)歳だった。/)[1];if(v>118||v<0)hit('bad_age',T(e))}
  if(!p.hs&&a>=16&&a<=18&&/(高校の(授業|部活|文化祭|体育祭|担任)|クラスメイト|期末テスト)/.test(t)&&!/中退|行かな|進学せず|元|昔/.test(t)&&!L.flags.takaIn)hit('nohs_school',T(e));
  if((/^(経営者|農家|漁師|小説家|画家|YouTuber|フリーター)$/.test(e._job||'')||/^(自分の|個人|実家の|父の|フリーランス)/.test(L.company||'')&&e._job===L.job)&&/上司(から|に|が)|パワハラ|課長に昇進|部長に昇進|人事異動|転勤を命/.test(t)&&!/元|前の|昔|かつて|辞め|退職|友人|配偶者|夫|妻|父|母/.test(t))hit('self_boss',T(e)+' ['+e._job+']');
  if(e._job==='フリーター'&&/(正社員として|課長|部長|ボーナス|昇進)/.test(t)&&!/友人|同級生|元|辞め|になった|登用|配偶者|夫|妻|兄|姉|父|母|ニュース/.test(t))hit('freeter_regular',T(e));
  if(L.flags.noLicense&&/(車を買|新車|中古車|に買い替えた)/.test(t)&&ev.slice(0,i).some(q=>/免許を返納/.test(q.t)))hit('car_after_return',T(e));
 });
 // 同じ文が二度
 {const seen={};ev.forEach(e=>{const t=e.t.replace(/^\d+歳。/,'');if(t.length<28||/→/.test(t))return;if(seen[t]&&!/^\d{4}年/.test(t))hit('dup_text',T(e));seen[t]=1})}
 // 亡くなった人が名前で再登場
 {const dead={};ev.forEach((e,i)=>{const t=e.t;const m=t.match(/(?:父の|母の|兄の|姉の|弟の|妹の|配偶者の|夫の|妻の|親友の|祖母の|祖父の)?([一-龥々]{1,4} ?[一-龥ぁ-んァ-ヶー々]{1,4})(?:が|を)[^。]{0,16}(亡くなった|看取った|息を引き取った)/);if(m){const nm=m[1].split(' ').pop();if(nm.length>=2&&nm!=='自分')dead[nm]=i}
  for(const nm in dead){if(i>dead[nm]&&t.includes(nm)&&!/亡|墓|遺|命日|仏壇|思い出|生前|形見|葬|一周忌|三回忌|七回忌|法事|供え|写真|夢に|生きていたら|だったら|保険金|相続|遺産/.test(t))hit('dead_returns',T(e)+' ['+nm+'] <= '+ev[dead[nm]].t.slice(0,60))}})}
 // 死亡後の出来事
 const di=ev.findIndex(e=>/(亡くなった。\d+歳|死去)/.test(e.t)&&/^(?!.*(父|母|祖|兄|姉|弟|妹|夫|妻|配偶者|親友|友人|息子|娘|子|孫|犬|猫|ペット|叔|伯|先生|同期|恋人|元|社長|上司|患者|飼))/.test(e.t));
 if(L.kids.length>12)hit('too_many_kids',L.kids.length+'人');
 const ages=L.kids.map(k=>k.born);if(ages.some(b=>b<14))hit('kid_too_early',ages.join(','));
 if(L.flags.momDead===undefined&&L.age>110)hit('mom_immortal','本人'+L.age);
 if(L.income>20000&&!L.flags.megaEng)hit('huge_income',L.job+' '+L.income);
 if(L.age>=125)hit('age125',L.name);
 if(L.married&&!L.partner)hit('married_nopartner',L.name);
}
console.log(JSON.stringify(hits));for(const k in ex)console.log('##',k,'\n  '+ex[k].join('\n  '));
