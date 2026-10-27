// t122: Lote 18 (1.2, 1º passo) — a carga lê cada documento/lista da conta UMA vez (a 1ª resposta da assinatura ao vivo serve de carga; antes era get() + onSnapshot)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const U="data/users/u1/";const t=new Date().toISOString().slice(0,10);
const SEED={[U+"progress"]:{version:3,split:true,hist:{[t]:{e:1}},plan:null},[U+"progress/topics/CM-1"]:{l:1,last:t,step:0},[U+"progress/topics/CM-2"]:{l:2,last:t,step:1},
  [U+"faculdade"]:{sems:[],discs:[],provas:[],own:{}},[U+"prefs"]:{prefs:{},profile:{name:"Ana"}},[U+"settings"]:{prompt:"Meu prompt"},
  [U+"progress/errors/e1"]:{id:"e1",k:"CM-1",w:"Errei",r:"Certo",t:"conhecimento",s:"",d:t},
  [U+"progress/cards/c1"]:{id:"c1",k:"CM-1",q:"P?",a:"R",src:"eu",due:t,n:0,ok:0,box:0},
  [U+"progress/focus/f1"]:{id:"f1",d:t,s:t+"T10:00:00.000Z",sec:1500,m:"p",ref:"T:CM-1",lab:""},
  [U+"progress/notes/CM-1"]:{t:"Anotação do tema",updatedAt:t+"T10:00:00.000Z"}};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,w,h,mob] of [["note",1366,900,false],["fone",390,844,true]]){
const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock(${JSON.stringify(SEED)},5);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+": "+e.message));
await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(300);
const r=await p.evaluate(U=>{const R=window.__reads,bad=Object.keys(R).filter(k=>!/exfig/.test(k)&&R[k]>1);
  return {bad,n:Object.keys(R).length,live:window.__subs.length,st:!!state["CM-2"]&&state["CM-2"].l===2,er:errors.some(e=>e.id==="e1"),cd:cards.some(c=>c.id==="c1"),fo:foSess.some(f=>f.id==="f1"),
    nt:notes["CM-1"]==="Anotação do tema",nm:ui.profile.name==="Ana",pr:promptText==="Meu prompt"}},U);
ok(r.bad.length===0&&r.n>=14,name+": cada caminho lido uma vez só na abertura ("+r.n+" caminhos"+(r.bad.length?"; repetidos: "+r.bad.join(", "):"")+")");
ok(r.live>=14&&r.live<=16,name+": uma assinatura ao vivo por caminho ("+r.live+")");
ok(r.st&&r.er&&r.cd&&r.fo&&r.nt&&r.nm&&r.pr,name+": a carga trouxe temas, erros, cartões, foco, anotações, perfil e instruções");
/* a assinatura da carga continua viva: mudança de outro aparelho chega */
await p.evaluate(U=>{window.__remote(U+"progress/topics/CM-3",{l:3,last:today(),step:2});window.__remote(U+"progress/errors/e2",{id:"e2",k:"CM-2",w:"Outro",r:"Certo",t:"conhecimento",s:"",d:today()});liveAct=0},U);
await p.waitForFunction(()=>state["CM-3"]&&errors.some(e=>e.id==="e2"),null,{timeout:8000}).catch(()=>{});
ok(await p.evaluate(()=>!!state["CM-3"]&&errors.some(e=>e.id==="e2")),name+": depois da carga, o que muda no outro aparelho chega (sem nova leitura)");
await p.evaluate(U=>window.__remote(U+"progress/errors/e1",null),U);await p.waitForTimeout(300);
ok(await p.evaluate(()=>!errors.some(e=>e.id==="e1")),name+": item apagado no outro aparelho some daqui (visto na carga)");
/* item só deste aparelho sobe uma vez */
await ctx.close()}
const ctx=await b.newContext();await ctx.route(/googleapis|gstatic/,r=>r.abort());
await ctx.addInitScript(mock+`;if(!localStorage.getItem("x")){localStorage.setItem("x","1");localStorage.setItem("resid-erros-v1",JSON.stringify([{id:"eL",k:"CM-4",w:"Local",r:"Certo",t:"conhecimento",s:"",d:"${t}"}]))};window.__mock(${JSON.stringify(SEED)},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push("local: "+e.message));await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(300);
ok(await p.evaluate(U=>!!window.__store[U+"progress/errors/eL"]&&errors.filter(e=>e.id==="eL").length===1&&errors.some(e=>e.id==="e1"),U),"erro que só estava no aparelho sobe para a conta e não duplica");
ok(errs.length===0,"sem erros de JavaScript"+(errs.length?": "+errs.slice(0,3).join(" | "):""));
await b.close()})();
