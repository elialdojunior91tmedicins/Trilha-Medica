// t90: Foco vinculado a disciplina da faculdade ainda sem conteúdo (horas contam para a disciplina)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabDeitado:[1180,820,true],note:[1366,768,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
 await p.evaluate(()=>{fac={sems:[{id:"s6",name:"6º semestre",archived:false},{id:"s5",name:"5º semestre",archived:true}],discs:[
     {id:"d1",semId:"s6",name:"PMSUS",items:[],info:{},links:[],sps:[]},{id:"d2",semId:"s6",name:"Tutoria",items:["T:CM-37"],info:{},links:[],sps:[]},
     {id:"d3",semId:"s5",name:"Antiga vazia",items:[],info:{},links:[],sps:[]}],provas:[],own:{}};
   registerOwn();saveFac();foSess=foSess.filter(x=>!/^D:/.test(x.ref||""));foPick.ref="";commit();backStack=[];setView("foco")});await p.waitForTimeout(200);
 const q=await p.evaluate(()=>{const c=[...document.querySelectorAll('.foquick .chip')];return {d1:!!document.querySelector('#foqd-d1'),d2:!document.querySelector('#foqd-d2'),d3:!document.querySelector('#foqd-d3'),tag:(document.querySelector('#foqd-d1 small')||{}).textContent}});
 ok(q.d1&&q.d2&&q.d3&&/sem conteúdo/.test(q.tag||""),name+": disciplina vazia do semestre ativo aparece em Estudar agora (a com conteúdo e a arquivada não) "+JSON.stringify(q));
 await click('#foqd-d1');
 ok(await p.evaluate(()=>foPick.ref==="D:d1"&&document.querySelector('#foqd-d1').getAttribute("aria-pressed")==="true"),name+": um toque vincula o Foco à disciplina");
 ok(await p.evaluate(()=>{const s=document.querySelector('#foRef');return !!s&&s.value==="D:d1"&&/PMSUS \(sem conteúdo\)/.test(s.selectedOptions[0].textContent)}),name+": a lista Vincular a mostra a disciplina marcada como sem conteúdo");
 /* sessão salva conta para a disciplina */
 await p.evaluate(()=>{foSess.unshift({id:"fd1",d:today(),s:new Date().toISOString(),sec:1500,m:"p",ref:foPick.ref,lab:foRefLabel(foPick.ref)});commit();render()});
 ok(await p.evaluate(()=>discFocusSec(discOf("d1"),foWeekStart())===1500&&foMat(foSess[0]).lab==="PMSUS"),name+": 25 min contam para a disciplina vazia");
 /* ganhou conteúdo: sai do Estudar agora, as horas ficam */
 await p.evaluate(()=>{const d=discOf("d1");addToDisc(d,"T:CM-1");setView("foco")});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>!document.querySelector('#foqd-d1')&&discFocusSec(discOf("d1"),foWeekStart())===1500),name+": com conteúdo, sai da lista rápida e as horas continuam na disciplina");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
