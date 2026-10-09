const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[390,844,true],[1366,900,false]]){
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const tag=mob?"celular":"computador";const seg=async s=>{if(mob)await p.evaluate(s=>{tSeg=s;render()},s);await p.waitForTimeout(120)};
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);state={};
  state["CM-1"]={l:2,last:D(-1),step:2,qt:12,qc:11,sd:[0,1]};// pronto para Dominado
  state["CM-2"]={l:3,last:D(-1),step:3,qt:30,qc:20,qd:{[D(-2)]:[10,5],[D(-60)]:[20,15]}};// dominado com queda
  state["CM-4"]={l:1,last:D(-2),step:0,qt:10,qc:4};
  foSess=[{id:"f",d:today(),s:"",sec:4800,m:"p",ref:"T:CM-4",lab:""}];commit();setView("temas")});
// 5. mapa
await seg("prog");ok(await p.$$eval('#resMap .rmc',a=>a.length)===185,tag+": mapa com 185 temas");
ok(await p.evaluate(()=>document.querySelectorAll('#resMap .rmc.l3').length===1&&document.querySelectorAll('#resMap .rmc.l2').length===1&&document.querySelectorAll('#resMap .rmc.weak').length===1),tag+": cores por nível e ponto fraco");
await click('#resMap .rmc.l3');await p.waitForTimeout(250);ok(await p.evaluate(()=>openKey==="CM-2"),tag+": toque no quadrado abre o tema");
// 8. subtópicos no gráfico
await p.evaluate(()=>{openKey=null;setView("temas")});await seg("prog");ok(await p.$$eval('#areaChart .hsub',a=>a.length)===5,tag+": barra de subtópicos por área");
// 7. sugestões
await seg("lista");const sug=await p.$$eval('#lvSug li',a=>a.map(x=>x.textContent));ok(sug.length===2&&/Pronto para Dominado/.test(sug[0])&&/acerto caiu/.test(sug[1]),tag+": sugestões "+sug.map(x=>x.slice(0,60)).join(" | "));
await click('#lvSug li:first-child .btn.primary');await p.waitForTimeout(150);ok(await p.evaluate(()=>get("CM-1").l===3),tag+": marcar como Dominado");
await click('#lvSug li:first-child .btns .btn:last-child');await p.waitForTimeout(150);ok(await p.evaluate(()=>get("CM-2").lvDis===today()&&document.getElementById("lvSug").hidden),tag+": agora não esconde");
// 6. linha do tema
await p.evaluate(()=>{openAreas.add("CM");openSpecs.add("CM:"+BYKEY["CM-4"].sp);render()});await p.waitForTimeout(150);
const meta=await p.$eval('#t-CM-4 .meta',x=>x.textContent);ok(/40% em 10 questões/.test(meta)&&/⏱ 1h20/.test(meta),tag+": linha mostra acerto e foco: "+meta);
ok(await p.$eval('#t-CM-4 .meta .st',x=>x.classList.contains("bad")),tag+": acerto colorido");
ok(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,tag+": sem rolagem horizontal");
await seg("prog");await p.evaluate(()=>document.querySelector('#resMap').scrollIntoView());await p.screenshot({path:`map-${mob?"fone":"desk"}.png`});
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
