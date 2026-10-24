// t119: rodízio dos subtópicos na revisão — sempre os revisados há mais tempo (nunca revisado primeiro), quantidade ≈ 1/4 do tema (mín. "Subtópicos por tema"),
// não repete os mesmos no último degrau (90 dias) e "Tive dificuldade" não faz o rodízio recomeçar. Subtópico seu entra no rodízio.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
const R=await p.evaluate(()=>{const it=BYKEY["CM-1"],n=it.subs.length;
  /* tema com todos os subtópicos estudados, no último degrau */
  const all=[...Array(n).keys()];upd("CM-1",x=>{x.sd=all;x.last=fromNum(dnum(today())-100);x.step=INT.length-1;delete x.sv});
  const N=revSubN(n),seen=new Set(),rounds=[];
  for(let r=0;r<Math.ceil(n/N);r++){dayOff=r*100;const sub=pickSubs(it,"r-rev");rounds.push(sub);sub.forEach(t=>seen.add(t));reviewTopic("CM-1",true);upd("CM-1",x=>{x.last=fromNum(dnum(today())-100)})}
  dayOff=0;
  /* dificuldade não recomeça: depois de "Tive dificuldade", os próximos não são os mesmos 1ºs */
  upd("CM-1",x=>{delete x.sv;x.step=3});const a=pickSubs(it,"r-rev");reviewTopic("CM-1",false);const b=pickSubs(it,"r-rev");
  /* subtópico seu entra */
  upd("CM-1",x=>{x.cs=[{t:"Meu subtópico",d:true}];x.sv={}; it.subs.forEach((t,i)=>x.sv["i"+i]=today())});const c=pickSubs(it,"r-rev");
  /* tema pequeno: mínimo das configurações */
  const it2=BYKEY["CM-2"],m=it2.subs.length;upd("CM-2",x=>{x.sd=[0,1,2,3];x.last=today();x.step=1});const d=pickSubs(it2,"r-rev");
  return {n,N,cover:seen.size,rounds:rounds.map(r=>r.length),dup:rounds.length>1&&rounds[0].join()===rounds[1].join(),a,b,overlap:a.filter(t=>b.includes(t)).length,c0:c[0],d:d.length,sv:Object.keys(get("CM-1").sv||{}).length}});
ok(R.N===Math.max(3,Math.ceil(R.n/4)),`quantidade cresce com o tema (${R.n} subtópicos → ${R.N} por revisão)`);
ok(R.cover===R.n&&!R.dup,`no último degrau o rodízio passa por todos (${R.cover}/${R.n}) sem repetir ${JSON.stringify(R.rounds)}`);
ok(R.overlap===0,`"Tive dificuldade" não faz recomeçar ${JSON.stringify([R.a,R.b])}`);
ok(R.c0==="Meu subtópico",`subtópico seu entra no rodízio (${R.c0})`);
ok(R.d===3,`tema pequeno usa o mínimo (${R.d})`);
/* a tela da revisão mostra os escolhidos */
await p.evaluate(()=>{upd("CM-1",x=>{x.sv={};x.last=fromNum(dnum(today())-200)});commit();goRevs("CM-1")});await p.waitForTimeout(400);
const S=await p.evaluate(()=>{const li=document.querySelector('#revlist .rcard[data-k="CM-1"]');return li?li.querySelector('.psp').textContent:""});
ok(/de (\d+) subtópicos/.test(S)&&+S.match(/de (\d+)/)[1]===R.N,"o cartão da revisão mostra a quantidade nova "+S);
ok(!errs.length,"sem erros de página "+errs.join(" | "));await b.close()})();
