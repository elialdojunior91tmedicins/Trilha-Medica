// simulação de uso (não é teste): N dias de um estudante com rotina de faculdade, usando as próprias funções do app.
// Uso: node sim17.js <cenário> [dias]   cenários: normal | pausa (7 dias parado no meio) | curto (só 30 min a 1 h por dia) | intenso
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const SC=process.argv[2]||"normal",N=+(process.argv[3]||90),SEED=process.argv[4]==='base';const seedSrc=fs.readFileSync(__dirname+'/seed10.js','utf8');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1366,height:900}});
await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});
const out=await p.evaluate(([SC,N,SEED,seedSrc])=>{let seed=7;if(SEED){const module={exports:{}};eval(seedSrc);module.exports()}const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  render=function(){};persist=function(){};
  const W={normal:[120,60,60,60,60,60,120],pausa:[120,60,60,60,60,60,120],curto:[60,30,30,60,30,30,60],intenso:[180,120,120,120,120,120,180]}[SC];
  ui.prefs.wday=W;ui.prefs.wplans={};ui.prefs.hgoal=W.reduce((a,b)=>a+b,0);
  const rows=[];let qid=0;
  for(let d=0;d<N;d++){dayOff=d;const T=today();const skip=(SC==="pausa"&&d>=40&&d<47)||(rnd()<0.08);const m=dayMin(dnum(T));
    const r={d,T,skip,m};
    if(!skip&&m>0){
      qAutoRev();const C=qCounts();r.C=C;
      eDueList().slice(0,C.errs).forEach(e=>eAnswer(e,rnd()<.75));
      cdDue().forEach(x=>cdAnswer(x,rnd()<.85?3:1));
      rdDueList().slice(0,C.redo).forEach(x=>rnd()<.6?rdHit(x):rdMiss(x));
      const due=[...ALL,...FAC_ITEMS].filter(i=>isDue(get(i.key))).sort(revPri).slice(0,C.revs);
      due.forEach(it=>{const x=rnd();reviewTopic(it.key,x<.7?2:x<.9?1:0,{quiet:true})});
      const P=ensurePlan();r.plan=P.items.map(x=>x.cls).join(",");r.planK=P.items.map(x=>x.cls+":"+x.k).join(",");
      P.items.forEach(pi=>{const it=BYKEY[pi.k];if(pi.cls==="r-new"||pi.cls==="r-cont"||pi.cls==="r-own"){pi.subs.forEach(t=>{const x=subList(it).find(y=>y.t===t);if(x&&!x.done)toggleSub(it,x)})}
        else if(pi.cls==="r-weak"){upd(pi.k,x=>addQ(x,5,3));logAct("q",5,3)}});
      /* questões do dia: 10 em temas estudados, 65% de acerto; erradas vão para o Refazer; 1 erro por dia para o caderno; a cada 2 erros, cartões */
      const st=ALL.filter(i=>get(i.key).last);const nq=m>=60?10:5;
      for(let i=0;i<nq&&st.length;i++){const it=st[Math.floor(rnd()*st.length)],ok=rnd()<.65;upd(it.key,x=>addQ(x,1,ok?1:0));logAct("q",1,ok?1:0);
        if(!ok){const q={enunciado:"Q"+(qid++),alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"B",comentario:"c"};rdAdd(it.key,q,"sim");
          if(i===0){const e=eNew(it.key,"w","r","conhecimento","s");if(e&&d%2===0){const c=cdAdd(it.key,"q","a","eu",{eid:e.id});e.cd=c.id}}}}
    }
    const allDue=[...ALL,...FAC_ITEMS].filter(i=>isDue(get(i.key)));
    r.dueAll=allDue.length;r.late=allDue.filter(i=>dueIn(get(i.key))<0).length;r.late7=allDue.filter(i=>dueIn(get(i.key))<-7).length;
    r.studied=ALL.filter(i=>get(i.key).last).length;r.ing=ALL.filter(i=>isIng(get(i.key))&&!get(i.key).last).length;
    r.redo=redo.length;r.rdDue=rdDueList().length;r.errDue=eDueList().length;r.errs=errors.length;r.cards=cards.length;r.cdDue=cdDue().length;
    const C2=qCounts();r.qMin=qMinutes(C2);r.revCap=C2.revCap;rows.push(r)}
  dayOff=0;return rows},[SC,N,SEED,seedSrc]);
fs.writeFileSync(__dirname+`/out_sim17_${SC}${SEED?'_base':''}.json`,JSON.stringify(out));
const pick=[0,1,2,3,4,5,9,13,17,21,30,40,44,47,50,55,62,70,80,89].filter(i=>i<N);
console.log(`cenário ${SC} · dias ${N}`);console.log("dia  data        min skip | vencidas atras >7d | capHoje filaMin | estud estudando | refazer(venc) erros(venc) cartões(venc) | plano");
pick.forEach(i=>{const r=out[i];console.log(`${String(r.d).padStart(3)}  ${r.T}  ${String(r.m).padStart(3)} ${r.skip?"S":" "}   | ${String(r.dueAll).padStart(4)} ${String(r.late).padStart(5)} ${String(r.late7).padStart(4)} | ${String(r.revCap).padStart(4)} ${String(r.qMin).padStart(6)} | ${String(r.studied).padStart(4)} ${String(r.ing).padStart(5)} | ${String(r.redo).padStart(4)}(${r.rdDue}) ${String(r.errs).padStart(4)}(${r.errDue}) ${String(r.cards).padStart(4)}(${r.cdDue}) | ${r.plan||""}`)});
if(errs.length)console.log("ERROS JS: "+errs.slice(0,5).join(" | "));await b.close()})();
