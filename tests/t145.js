// t145 (Lote 21, item 7): High Yield — selo HY nos temas de peso 3, ★ HY nos subtópicos (estimativa + toque do usuário), efeitos nas partes, rodízio, gerador e PDF
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
 /* selo HY no tema */
 await p.evaluate(()=>{backStack=[];setView("temas");openTopic("CM-1");openTopic("CM-10");render()});await p.waitForTimeout(250);
 ok(await p.evaluate(()=>{const li=document.querySelector('#t-CM-1'),l2=document.querySelector('#t-CM-10');return !!li&&!!li.querySelector('.meta .hyb')&&!!l2&&!l2.querySelector('.hyb')}),name+": selo HY no tema de peso 3 (e não no de peso 1)");
 ok(await p.evaluate(()=>{const f=document.createElement("div");f.appendChild(incEl(3,false,true));return !f.querySelector('.hyb')}),name+": sem selo no seletor de peso");
 /* ★ HY nos subtópicos: estimativa */
 const L=await p.evaluate(()=>({L:subList(BYKEY["CM-1"]).filter(x=>x.hy).map(x=>x.i).join(),D:HY_DEF["CM-1"].join(),n:HY_DEF["CM-1"].length,m:Math.ceil(BYKEY["CM-1"].subs.length/3)}));
 ok(L.L===L.D&&L.n<=L.m,name+": estimativa embutida, no máximo 1/3 dos subtópicos "+JSON.stringify(L));
 await p.evaluate(()=>{openTopic("CM-1")});await p.waitForTimeout(250);
 ok(await p.evaluate(()=>document.querySelectorAll('#t-CM-1 .subs .hyst[aria-pressed="true"]').length===HY_DEF["CM-1"].length),name+": ★ HY aparece nos subtópicos do tema aberto");
 /* toque do usuário vence */
 await click('#hyEd-CM-1');ok(await p.evaluate(()=>document.querySelectorAll('#t-CM-1 .subs .hyst').length===BYKEY["CM-1"].subs.length),name+": modo marcar mostra ☆ em todos");
 await click('#hy-CM-1-0');await click('#hy-CM-1-2');
 ok(await p.evaluate(()=>{const s=get("CM-1");return s.hy&&s.hy[0]==="u"&&s.hy[2]==="n"&&subList(BYKEY["CM-1"])[0].hy&&!subList(BYKEY["CM-1"])[2].hy}),name+": marcar e tirar ficam guardados como seus (u/n)");
 await click('#hy-CM-1-2');ok(await p.evaluate(()=>!(get("CM-1").hy||{})[2]),name+": voltar ao da estimativa limpa a marca");
 ok(await p.evaluate(()=>{upd("CM-1",s=>{s.cs=[{t:"Meu subtópico",d:false}]});const L=subList(BYKEY["CM-1"]);setHy(BYKEY["CM-1"],L[L.length-1],true);return get("CM-1").cs[0].hy==="u"&&subList(BYKEY["CM-1"]).slice(-1)[0].hy}),name+": subtópico próprio também pode ser ★");
 /* efeitos */
 ok(await p.evaluate(()=>{const it=BYKEY["CM-1"];const P=partSubs(it);return P.pt&&P.subs.every(t=>subList(it).find(x=>x.t===t).hy)}),name+": na parte 1 do tema grande vêm os ★ HY");
 ok(await p.evaluate(()=>{const it=BYKEY["CM-1"],T=today();upd("CM-1",s=>{s.sd=it.subs.map((_,i)=>i);s.last=T;s.step=1;const sv={};it.subs.forEach((_,i)=>sv["i"+i]=fromNum(dnum(T)-10));s.sv=sv});const R=pickSubs(it,"r-rev");const H=subList(it).filter(x=>x.hy).map(x=>x.t);return R.length&&R.slice(0,Math.min(R.length,H.length)).every(t=>H.includes(t))}),name+": no rodízio da revisão, os ★ HY vêm antes (revisados no mesmo dia)");
 ok(await p.evaluate(()=>/High Yield/.test(buildPrompt(BYKEY["CM-1"],5,{}))&&/Metas pressóricas/.test(buildPrompt(BYKEY["CM-1"],5,{}))),name+": o gerador pede para preferir os ★ HY");
 ok(await p.evaluate(()=>{notes["CM-1"]="## Resumo\nTexto.";const b=notesPDF(["CM-1"],[],{});const t=new TextDecoder("latin1").decode(b);return /HY/.test(t)}),name+": o PDF do caderno marca o tema HY e os ★");
 ok(await p.evaluate(()=>{const s=JSON.parse(JSON.stringify(get("CM-1")));return typeof s.hy==="object"&&!Array.isArray(s.hy)}),name+": s.hy vai com o tema (conta e backup), sem listas aninhadas");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
