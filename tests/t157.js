// t157: toque e arrumação (17/11/2026).
// 1. Telas de toque: links de texto e botões "?" respondem a um toque até ~18px acima/abaixo do texto (área invisível; aparência igual).
// 2. Celular: Refazer plano, o tempo de hoje e Hoje não deu ficam em "Ajustar o dia"; nos outros aparelhos continuam à vista.
// 3. Revisadas hoje: com mais de 8, mostra as 6 mais recentes e "Ver todas as N".
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const S=require('./seed10.js');
const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabDeitado:[1180,820,true],note:[1366,768,false]};
(async()=>{const b=await chromium.launch();
for(const [name,[w,h,mob]] of Object.entries(DEV)){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined});
  await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());
  await ctx.addInitScript(mock+";window.__mock({},2);window.__qLegacy=false;");
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof render==="function"&&document.querySelector('#iHero')&&document.querySelector('#iHero').firstChild,null,{timeout:15000});
  await p.evaluate(`(${S.toString()})()`);await p.evaluate(()=>{backStack=[];setView("temas");if(typeof tSeg!=="undefined")tSeg="hoje";render()});await p.waitForTimeout(200);
  const phone=await p.evaluate(()=>document.documentElement.dataset.layout==="phone");
  // 1. área de toque
  const hit=await p.evaluate(()=>{const L=[...document.querySelectorAll('.link,.hlpb')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.height<30&&r.top>40&&r.bottom<innerHeight-120});
    let tot=0,good=0;const bad=[];for(const e of L.slice(0,12)){const r=e.getBoundingClientRect(),x=r.left+r.width/2;tot++;
      const ok=[r.top+r.height/2-16,r.top+r.height/2+16].every(y=>{const t=document.elementFromPoint(x,y);return t===e||e.contains(t)||(t&&t!==e&&t.closest('.link,.hlpb'))});/* encostado noutro link, o toque vai para o vizinho mais perto: não cai no vazio */if(ok)good++;else bad.push((e.id||e.textContent).slice(0,30))}
    return {tot,good,bad}});
  if(mob)ok(hit.tot>0&&hit.good===hit.tot,`${name}: ${hit.good} de ${hit.tot} links/“?” respondem a um toque 16px acima e abaixo do texto (ou ao link vizinho encostado)${hit.bad.length?" → "+hit.bad.join(" | "):""}`);
  else ok(hit.tot===0||hit.good<hit.tot,`${name}: no computador (mouse) a área clicável continua a do texto`);
  // 2. Ajustar o dia
  const vis=s=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&e.getBoundingClientRect().width>0},s);
  const st={adj:await vis('#pAdj'),redo:await vis('#planRedo'),time:await vis('#pTimeChg'),hnd:await vis('#pHnd')};
  if(phone){ok(st.adj&&!st.redo&&!st.time&&!st.hnd,`${name}: as três ações ficam em "Ajustar o dia" ${JSON.stringify(st)}`);
    await p.tap('#pAdj');await p.waitForTimeout(120);
    const box=await p.evaluate(()=>[...document.querySelectorAll('#pAdjBox button')].map(x=>x.textContent));
    ok(box.length===3&&box[0]==="Refazer plano"&&/tempo/.test(box[1])&&box[2]==="Hoje não deu"&&(await p.evaluate(()=>document.getElementById('pAdj').getAttribute('aria-expanded')))==="true",`${name}: ao abrir, mostra Refazer plano, o tempo de hoje e Hoje não deu ${JSON.stringify(box)}`);
    await p.tap('#pAdjHnd');await p.waitForTimeout(120);
    const arm=await p.evaluate(()=>({t:(document.getElementById('pAdjHnd')||{}).textContent,off:isOffDay()}));
    ok(/Toque de novo/.test(arm.t)&&!arm.off,`${name}: Hoje não deu pede confirmação e o menu fica aberto ${JSON.stringify(arm)}`);
    await p.tap('#pAdj');await p.waitForTimeout(120);
    ok(await p.evaluate(()=>!document.getElementById('pAdjBox')&&!hndArm&&!isOffDay()),`${name}: Fechar desarma e não vira folga`);
    await p.tap('#pAdj');await p.tap('#pAdjTime');await p.waitForTimeout(120);
    ok(await p.evaluate(()=>!!document.querySelector('.pdseg')&&!document.getElementById('pAdjBox')),`${name}: o tempo de hoje abre a escolha de horas`);
    await p.evaluate(()=>{tdOpen=false;render()})}
  else ok(!st.adj&&st.redo&&st.time&&st.hnd,`${name}: fora do celular, as três ações continuam à vista ${JSON.stringify(st)}`);
  // 3. Revisadas hoje
  const r=await p.evaluate(()=>{const P=ensurePlan();P.revd=ALL.slice(0,12).map(i=>i.key);render();const n=()=>document.querySelectorAll('#revdone .rtag').length,b=()=>document.getElementById('rdAllB');
    const a={n:n(),lab:b()&&b().textContent,first:(document.querySelector('#revdone .rtag')||{}).textContent||""};b().click();const c={n:n(),lab:b().textContent};b().click();
    P.revd=ALL.slice(0,8).map(i=>i.key);render();const d={n:n(),btn:!!b()};P.revd=[];render();return {a,c,d,k7:ALL[6].t}});
  ok(r.a.n===6&&r.a.lab==="Ver todas as 12"&&r.a.first.includes(r.k7),`${name}: 12 revisadas → 6 mais recentes e "Ver todas as 12" ${JSON.stringify(r.a)}`);
  ok(r.c.n===12&&/só as 6/.test(r.c.lab),`${name}: "Ver todas" mostra as 12 ${JSON.stringify(r.c)}`);
  ok(r.d.n===8&&!r.d.btn,`${name}: com 8, mostra todas, sem botão`);
  ok(errs.length===0,`${name}: sem erro de página${errs.length?" → "+[...new Set(errs)].slice(0,3).join(" | "):""}`);
  await ctx.close()}
await b.close()})();
