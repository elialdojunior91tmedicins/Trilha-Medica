// t133: item apagado em outro aparelho não volta (27/10/2026). Antes, ao abrir, o aparelho enviava de volta ao servidor tudo o que só ele tinha
// (ex.: questão que saiu do Refazer com 2 acertos no celular voltava pelo computador). Agora cada aparelho guarda os ids que já viu no servidor
// (localStorage resid-seen-v1): o que o servidor já teve e não tem mais sai daqui também; o que nunca chegou ao servidor é enviado.
// Pacotes (site): item que está na coleção antiga E num pacote some dos dois ao apagar.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
const Q=st=>({enunciado:st,alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"B",comentario:"",conceito:"",alerta:""});
const rd=(id,st)=>({id,k:"CM-1",d:"2026-10-20",n:1,due:"2026-10-21",q:Q(st)});
const er=id=>({id,k:"CM-1",w:"errei "+id,r:"certo",t:"conhecimento",s:"",d:"2026-10-20"});
const P="data/users/u1/progress/";
async function open(seed,ls,extra){const ctx=await b.newContext();
  await ctx.addInitScript(mock+`;try{if(!sessionStorage.getItem('x')){sessionStorage.setItem('x',1);const L=${JSON.stringify(ls)};for(const k in L)localStorage.setItem(k,JSON.stringify(L[k]))}}catch(e){};${extra||""};window.__mock(${JSON.stringify(seed)},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(500);return {p,ctx}}
const srv=(p,col)=>p.evaluate(c=>Object.keys(window.__store).filter(k=>k.includes("/progress/"+c+"/")).map(k=>k.split("/").pop()).sort(),col);

/* 1. Refazer: X foi visto no servidor e sumiu de lá (saiu em outro aparelho) → sai daqui; Z nunca chegou ao servidor → é enviado */
{const {p,ctx}=await open({[P+"redo/Y"]:rd("Y","Questão Y")},{"resid-redo-v1":[rd("X","Questão X"),rd("Y","Questão Y"),rd("Z","Questão Z")],"resid-seen-v1":{redo:["X","Y"]}});
  const L=await p.evaluate(()=>redo.map(x=>x.id).sort());ok(JSON.stringify(L)==='["Y","Z"]',"Refazer: o apagado em outro aparelho sai daqui, o novo fica: "+L);
  const S=await srv(p,"redo");ok(JSON.stringify(S)==='["Y","Z"]',"Refazer: o apagado não volta ao servidor, o novo é enviado: "+S);
  const seen=await p.evaluate(()=>JSON.parse(localStorage.getItem("resid-seen-v1")).redo.sort());ok(seen.includes("Y")&&seen.includes("Z")&&!seen.includes("X"),"lista do que foi visto atualizada: "+seen);
  await ctx.close()}

/* 2. 1ª abertura com esta versão (sem lista do que foi visto): Refazer com conta em uso → o que só existe aqui sai; erros continuam sendo enviados (cuidado) */
{const {p,ctx}=await open({[P+"redo/Y"]:rd("Y","Questão Y"),[P+"errors/E1"]:er("E1")},{"resid-redo-v1":[rd("X","Questão X"),rd("Y","Questão Y")],"resid-erros-v1":[er("E1"),er("E2")]});
  ok(JSON.stringify(await srv(p,"redo"))==='["Y"]',"1ª abertura: a questão que saiu em outro aparelho não volta ao Refazer");
  ok(JSON.stringify(await p.evaluate(()=>redo.map(x=>x.id)))==='["Y"]',"1ª abertura: some deste aparelho também");
  const E=await srv(p,"errors");ok(E.includes("E2"),"erros: sem lista do que foi visto, o que só existe aqui ainda é enviado (nada se perde): "+E);
  await ctx.close()}

/* 3. Erros com a lista: apagado em outro aparelho não volta */
{const {p,ctx}=await open({[P+"errors/E1"]:er("E1")},{"resid-erros-v1":[er("E1"),er("E2")],"resid-seen-v1":{err:["E1","E2"]}});
  ok(JSON.stringify(await srv(p,"errors"))==='["E1"]'&&await p.evaluate(()=>!errors.some(e=>e.id==="E2")),"erros: apagado em outro aparelho não volta");
  await ctx.close()}

/* 4. Ao vivo: outro aparelho tira a questão do Refazer → some aqui e entra na lista do que foi visto (não volta ao reabrir) */
{const {p,ctx}=await open({[P+"redo/Y"]:rd("Y","Questão Y"),[P+"redo/W"]:rd("W","Questão W")},{"resid-seen-v1":{redo:[]}});
  await p.evaluate(P=>window.__remote(P+"redo/W",null),P);await p.waitForTimeout(400);
  ok(await p.evaluate(()=>!redo.some(x=>x.id==="W")),"ao vivo: some daqui");
  const seen=await p.evaluate(()=>JSON.parse(localStorage.getItem("resid-seen-v1")).redo);ok(seen.includes("Y")&&!seen.includes("W"),"ao vivo: lista do que foi visto sem a questão");
  await ctx.close()}

/* 5. Acertou 2 vezes em dias diferentes → sai do servidor e não volta ao reabrir (mesmo aparelho) */
{const {p,ctx}=await open({[P+"redo/Y"]:rd("Y","Questão Y")},{"resid-seen-v1":{redo:["Y"]}});
  await p.evaluate(()=>{const x=redo.find(y=>y.id==="Y");x.ok=1;x.okd=fromNum(dnum(today())-3);rdHit(x)});await p.waitForTimeout(300);
  ok(JSON.stringify(await srv(p,"redo"))==='[]'&&await p.evaluate(()=>!redo.length),"2º acerto em outro dia: sai do Refazer");
  ok(await p.evaluate(()=>!JSON.parse(localStorage.getItem("resid-redo-v1")||"[]").some(x=>x.id==="Y")),"guardado no aparelho sem a questão (não volta ao reabrir)");
  await ctx.close()}

/* 6. Pacotes: a mesma questão na coleção antiga e num pacote → apagar tira dos dois */
{const id="D1",j=JSON.stringify(rd(id,"Questão D"));
  const {p,ctx}=await open({[P+"redo/"+id]:rd(id,"Questão D"),[P+"redopk/p0"]:{i:{[id]:j}}},{"resid-seen-v1":{redo:[id]}},"window.__packs=true");
  await p.waitForTimeout(400);
  await p.evaluate(id=>rdDel(id),id);await p.waitForTimeout(400);
  const st=await p.evaluate((a)=>{const s=window.__store;return {old:!!s[a.P+"redo/"+a.id],pk:Object.keys(s).filter(k=>k.includes("/redopk/")).some(k=>s[k].i&&a.id in s[k].i)}},{P,id});
  ok(!st.old&&!st.pk,"pacotes: some da coleção antiga e do pacote: "+JSON.stringify(st));
  await ctx.close()}

ok(!errs.length,"sem erros de página: "+errs.join(" | "));
await b.close()})();
