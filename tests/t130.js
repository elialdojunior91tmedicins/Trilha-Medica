// t130: Lote 18 › Foco (seção 8) — sons de fundo com gravações reais (chuva, riacho, lareira, cafeteria): baixados só quando escolhidos, tocados em loop
// durante o foco, guardados no aparelho; sem internet, um som gerado no lugar; ruídos branco e marrom continuam gerados; créditos das gravações
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch({args:["--autoplay-policy=no-user-gesture-required"]});const errs=[];
for(const [name,w,h,mob] of [["note",1366,900,false],["fone",390,844,true]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());const got=[];
  await ctx.route(/\/sounds\/(\w+)\.mp3$/,r=>{const f=r.request().url().match(/sounds\/(\w+)\.mp3$/)[1];got.push(f);if(f==="riacho")return r.fulfill({status:404,body:""});r.fulfill({contentType:"audio/mpeg",body:fs.readFileSync(path.join(__dirname,"..","sounds",f+".mp3"))})});
  await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  await p.evaluate(()=>{backStack=[];setView("foco");const m=document.querySelector(".fomore");if(m)m.open=true;render()});
  let r=await p.evaluate(()=>{const d=document.querySelector(".fomore");if(d)d.open=true;return [...document.querySelectorAll('.fonoise .chip')].map(x=>x.dataset.fn+":"+x.textContent)});
  ok(r.join()==="off:Desligado,r:Chuva,s:Riacho,f:Lareira,w:Ruído branco,b:Ruído marrom",name+": opções de som: 3 gravações e 2 ruídos ("+r.join(" | ")+")");
  ok(!got.length,name+": nenhuma gravação é baixada ao abrir o Foco");
  await p.evaluate(()=>[...document.querySelectorAll('.fonoise .chip')].find(x=>x.dataset.fn==="r").click());
  await p.waitForFunction(()=>foRecBuf.r||foRecErr.r,null,{timeout:15000}).catch(()=>{});
  r=await p.evaluate(()=>({buf:!!foRecBuf.r,dur:foRecBuf.r&&Math.round(foRecBuf.r.duration),err:!!foRecErr.r,st:(document.querySelector(".fonst")||{}).textContent,cred:!!document.querySelector(".focred")}));
  ok(r.buf&&r.dur===60&&!r.err&&got.join()==="chuva",name+": escolher Chuva baixa só a gravação da chuva (60 s, em loop) "+JSON.stringify(r));
  ok(r.st==="Gravação real."&&r.cred,name+": mostra que é gravação real e os créditos");
  r=await p.evaluate(async()=>{foPick.mode="p";foStart();render();await new Promise(r=>setTimeout(r,300));const n=foNoise;const out={on:!!n,rec:n&&n.rec,type:n&&n.type,loop:n&&n.s.loop,ls:n&&n.s.loopStart};foRun=null;foSaveRun();render();await new Promise(r=>setTimeout(r,700));out.off=!foNoise;return out});
  ok(r.on&&r.rec&&r.type==="r"&&r.loop&&r.ls>0&&r.off,name+": durante o foco toca a gravação em loop; para quando o foco para "+JSON.stringify(r));
  r=await p.evaluate(async()=>{const c=await caches.open("nexus-sons");return !!(await c.match("sounds/chuva.mp3"))});
  ok(r,name+": a gravação fica guardada no aparelho (não baixa de novo)");
  /* sem a gravação (sem internet): som gerado no lugar */
  await p.evaluate(()=>[...document.querySelectorAll('.fonoise .chip')].find(x=>x.dataset.fn==="s").click());
  await p.waitForFunction(()=>foRecErr.s,null,{timeout:8000}).catch(()=>{});
  r=await p.evaluate(async()=>{const st=(document.querySelector(".fonst")||{}).textContent;foStart();render();await new Promise(r=>setTimeout(r,300));const n=foNoise;const o={st,on:!!n,rec:n&&n.rec};foRun=null;foSaveRun();render();return o});
  ok(/sem internet\?\): tocando um som gerado no lugar/.test(r.st||"")&&r.on&&r.rec===false,name+": sem a gravação, avisa e toca um som gerado "+JSON.stringify(r));
  r=await p.evaluate(async()=>{ui.prefs.fnoise="w";saveUI();foStart();render();await new Promise(r=>setTimeout(r,300));const n=foNoise;const o={on:!!n,rec:n&&n.rec};foRun=null;foSaveRun();render();return o});
  ok(r.on&&r.rec===false,name+": ruído branco continua gerado no app");
  await ctx.close()}
ok(errs.length===0,"sem erros de JavaScript"+(errs.length?": "+errs.slice(0,3).join(" | "):""));
await b.close()})();
