const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
const only=process.argv[2];
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,[w,h,mob]] of Object.entries(DEV)){if(only&&!only.split(",").includes(name))continue;const ipad=name==="ipad578"||name.startsWith("tab");const big=["tabDeitado","note","monitor"].includes(name);
const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const txt=s=>p.$eval(s,x=>x.textContent);const box=s=>p.$eval(s,x=>{const r=x.getBoundingClientRect();return {t:r.top+scrollY,b:r.bottom+scrollY,l:r.left,r:r.right}});
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);for(let i=0;i<30;i++)foSess.push({id:"h"+i,d:D(-i*2),s:new Date(Date.now()-i*2*864e5-3*3600e3).toISOString(),sec:1500+i*60,m:"p",ref:"",lab:""});
  ui.prefs.fevery=2;ui.prefs.flong=12;ui.prefs.fb=3;saveUI();foSeries={n:0,t:0};commit();setView("foco")});await p.waitForTimeout(200);
// 2. vínculo rápido
const chips=await p.$$eval('.foquick .chip',a=>a.length);ok(chips>=3,name+": chips do plano para vincular ("+chips+")");
await click('.foquick .chip');await p.waitForTimeout(80);const ref=await p.evaluate(()=>foPick.ref);ok(/^T:/.test(ref),name+": um toque vincula "+ref);
// 9. layout
if(big){const t=await box('.fotimer'),l=await box('.folistc'),wk=await box('.foweekc');ok(l.t-t.b<40,name+": sessões logo abaixo do relógio");ok(wk.l>t.r-5,name+": semana na coluna da direita")}
else{const t=await box('.fotimer'),wk=await box('.foweekc'),l=await box('.folistc');ok(t.b<=wk.t&&wk.t<l.t,name+": ordem relógio, semana, sessões")}
// 6. distração + 1. depois da sessão (ciclo completo simulado)
await click('#foStart');await p.waitForTimeout(80);await click('#foDist');await click('#foDist');await p.waitForTimeout(80);ok(/Me distraí · 2/.test(await txt('#foDist')),name+": conta distrações");
const k=ref.slice(2);
await p.evaluate(()=>{foRun.t0=Date.now()-foRun.plan-500;foTick()});await p.waitForTimeout(150);
const st=await p.evaluate(()=>({ph:foRun&&foRun.ph,lb:foRun&&foRun.lb,plan:foRun&&foRun.plan,dz:foSess[0].dz,n:foSeries.n}));ok(st.ph==="b"&&!st.lb&&st.plan===3*60000&&st.dz===2&&st.n===1,name+": ciclo salvo com distrações e pausa curta "+JSON.stringify(st));
ok(!!(await p.$('.foafter'))&&/O que você estudou\?/.test(await txt('.foafter')),name+": cartão depois da sessão");
ok(/2 distrações/.test(await txt('.fomsg')),name+": mensagem com distrações");
const fa=await box('.foafter'),ft=await box('.fotimer');ok(fa.t<ft.t,name+": cartão acima do relógio");
// 3. pausa longa no 2º ciclo
await click('#foSkip');await p.waitForTimeout(80);ok(/●|/.test("")&&await p.$$eval('.fodots i.on',a=>a.length)===1,name+": bolinhas mostram 1 ciclo feito");
await click('#foStart');await p.waitForTimeout(80);await p.evaluate(()=>{foRun.t0=Date.now()-foRun.plan-500;foTick()});await p.waitForTimeout(150);
const st2=await p.evaluate(()=>({ph:foRun&&foRun.ph,lb:foRun&&foRun.lb,plan:foRun&&foRun.plan}));ok(st2.ph==="b"&&st2.lb&&st2.plan===12*60000,name+": pausa longa no 2º ciclo "+JSON.stringify(st2));
ok(/Pausa longa/.test(await txt('#foh')),name+": rótulo pausa longa");
await click('#foSkip');await p.waitForTimeout(80);
// registrar estudo
const before=await p.evaluate(k=>get(k).last||"",k);
const sb=await p.$('#foaStudy');if(sb){await click('#foaStudy');await p.waitForTimeout(100);ok(await p.evaluate(k=>get(k).last===today(),k),name+": estudei hoje pelo cartão")}
else ok(await p.$('#foaRevG')!==null||/já registrado/.test(await txt('.foafter')),name+": cartão oferece revisão ou já registrado ("+before+")");
await click('#foaQ');await p.waitForTimeout(80);await p.fill('#foaQt','10');await p.fill('#foaQc','7');await click('.foaq .btn');await p.waitForTimeout(100);
ok(await p.evaluate(k=>(get(k).qt||0)>=10,k),name+": questões registradas pelo cartão");
const sub=await p.$('.foasubs input');if(sub){await sub.click();await p.waitForTimeout(80);ok(await p.evaluate(k=>subCount(BYKEY[k])[0]>=1,k),name+": subtópico marcado pelo cartão")}
await p.evaluate(()=>{[...document.querySelectorAll('.foafter .dhead .link')][0].click()});await p.waitForTimeout(80);ok(!(await p.$('.foafter')),name+": fechar o cartão");
// 5. ruído
await p.evaluate(()=>{[...document.querySelectorAll('.fonoise .chip')].find(x=>x.dataset.fn==="b").click()});await p.waitForTimeout(80);ok(await p.evaluate(()=>ui.prefs.fnoise==="b"&&!!document.getElementById("foVol")),name+": som de fundo escolhido");
await click('#foStart');await p.waitForTimeout(150);ok(await p.evaluate(()=>!!foNoise||!(window.AudioContext||window.webkitAudioContext)),name+": ruído toca no foco");
await click('#foPauseB');await p.waitForTimeout(100);ok(await p.evaluate(()=>!foNoise),name+": ruído para ao pausar");
await click('#foPauseB');await p.waitForTimeout(80);
// 4. tela inteira
if(big){await click('#foFullB');await p.waitForTimeout(120);const hid=await p.evaluate(()=>[".foweekc",".folistc",".foheat"].every(s=>!document.querySelector(s).offsetParent));ok(hid,name+": tela inteira esconde o resto");
  if(!mob){await p.keyboard.press(' ');await p.waitForTimeout(80);ok(await p.evaluate(()=>foRun&&!foRun.t0),name+": espaço pausa");await p.keyboard.press(' ');await p.keyboard.press('d');await p.waitForTimeout(80);ok(await p.evaluate(()=>foRun.dist===1),name+": tecla D conta distração");
    await p.keyboard.press('Escape');await p.waitForTimeout(80);ok(await p.evaluate(()=>!fullOn.fo),name+": Esc sai")}else{await click('#foFullB');await p.waitForTimeout(80)}}
else ok(!(await p.evaluate(()=>{const b=document.getElementById("foFullB");return b&&b.offsetParent})),name+": sem botão tela inteira");
await p.evaluate(()=>{foDiscard()});await p.waitForTimeout(80);
// 7 e 8
ok(await p.$$eval('.fohm i',a=>a.length)===84,name+": mapa com 84 dias");ok(/Seu melhor horário/.test(await txt('.foheat')),name+": melhor horário");
await p.selectOption('#foWGoal','600');await p.waitForTimeout(80);ok(/na meta da semana/.test(await txt('.foweekx')),name+": meta semanal");ok(/Recorde semanal|Novo recorde/.test(await txt('.foweekx')),name+": recorde semanal");
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
await p.screenshot({path:`foco3-${name}.png`,fullPage:false});
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
