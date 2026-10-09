const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
const U="data/users/u1/progress";
(async()=>{const b=await chromium.launch();const errs=[];
const open=async(name,seed,pre)=>{const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript((pre||"")+mock+`;window.__mock(${JSON.stringify(seed||{})},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('file://'+__dirname+'/preview.html');
  await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&downloadsFn,null,{polling:100});await p.waitForTimeout(200);
  return {ctx,p,mob,click:s=>mob?p.tap(s):p.click(s)}};
const vis=(p,s)=>p.evaluate(s=>{const x=document.querySelector(s);if(!x)return false;const r=x.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(x).visibility!=="hidden"},s);

/* 1. conta antiga (v2) é dividida em um documento por tema */
{const D=new Date();D.setDate(D.getDate()-3);const d3=D.toISOString().slice(0,10);
 const {ctx,p}=await open("note",{[U]:{version:2,topics:{"CM-1":{l:2,last:d3},"CM-4":{l:1,last:d3}},hist:{[d3]:{e:2}}}});
 await p.waitForTimeout(1200);let S=await p.evaluate(()=>window.__store);
 ok(S[U].split===true&&!S[U].topics,"v2 migra para documento dividido");ok(S[U+"/topics/CM-1"]&&S[U+"/topics/CM-1"].l===2&&S[U+"/topics/CM-4"],"cada tema em seu documento");
 ok(S[U].hist&&S[U].hist[d3],"histórico continua no documento principal");
 await p.evaluate(()=>{state["CM-6"]={l:1,last:today()};delete state["CM-4"];commit()});await p.waitForTimeout(1200);S=await p.evaluate(()=>window.__store);
 ok(S[U+"/topics/CM-6"]&&!S[U+"/topics/CM-4"],"grava só o tema novo e apaga o removido");
 const n=await p.evaluate(()=>{let c=0;const o=topicStore.doc;return c});
 /* recarregar lendo a conta dividida */
 const seed=S;await ctx.close();
 const r=await open("note",seed);ok(await r.p.evaluate(()=>state["CM-1"]&&state["CM-1"].l===2&&state["CM-6"]&&!state["CM-4"]),"lê a conta dividida");
 /* versão antiga do app grava tudo junto por cima: junta ficando com o mais novo */
 const s2=JSON.parse(JSON.stringify(seed));s2[U]={version:2,topics:{"CM-1":{l:1,last:d3},"CM-9":{l:1,last:d3}},hist:{}};s2[U+"/topics/CM-1"]={l:3,last:"2099-01-01"};
 await r.ctx.close();const r2=await open("note",s2);await r2.p.waitForTimeout(1200);
 ok(await r2.p.evaluate(()=>state["CM-1"].l===3&&!!state["CM-9"]&&!!state["CM-6"]),"junta conta antiga e dividida sem perder temas");
 ok(await r2.p.evaluate(()=>window.__store["data/users/u1/progress"].split===true),"volta a dividir");await r2.ctx.close()}

/* 2. primeiros passos */
for(const name of ["fone","monitor"]){const {ctx,p,click,mob}=await open(name,{},"window.__wantOnb=true;try{localStorage.removeItem('resid-onb-seen')}catch(e){};");
 ok(await vis(p,'#onb'),name+": primeiros passos aparece numa conta vazia");await p.screenshot({path:`onb-${name}.png`});
 await p.fill('#onbDate','2027-03-10');await p.click('#onb .btn.primary');await p.waitForTimeout(80);
 await p.evaluate(()=>[...document.querySelectorAll('#onb .onbopts button')][1].click());await p.waitForTimeout(80);
 await p.selectOption('#onbF','180');await p.selectOption('#onbN','4');await p.click('#onbFin');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>!document.querySelector('#onb')&&ui.profile.goalDate==="2027-03-10"&&ui.prefs.fgoal===180&&ui.prefs.planN===4&&ui.prefs.onb===1),name+": guarda data, meta e temas por dia");
 ok(await p.evaluate(()=>!!bulk&&view==="temas"),name+": abre a marcação do que já estudou");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");await ctx.close()}
{const {ctx,p}=await open("fone",{[U]:{version:2,topics:{"CM-1":{l:1,last:"2026-01-01"}}}},"window.__wantOnb=true;try{localStorage.removeItem('resid-onb-seen')}catch(e){};");
 ok(!(await vis(p,'#onb')),"primeiros passos não aparece para quem já tem dados");await ctx.close()}

/* 3. demais recursos em todos os aparelhos */
for(const name of Object.keys(DEV)){const {ctx,p,click,mob}=await open(name,{});
 await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);["CM-1","CM-4","CM-6","CM-9"].forEach(k=>state[k]={l:1,last:D(-30),step:0});
   for(let i=0;i<3;i++){const e=eNew("CM-1","Achei que era A "+i,"É B "+i,"conhecimento","ENARE");e.due=today();putErr(e)}
   for(let i=0;i<2;i++)cdAdd("CM-4","Pergunta insuficiência "+i+"?","Resposta "+i,"eu");notes["CM-1"]="## Insuficiência cardíaca\n- diurético";
   hist[D(-40)]={e:1};commit();setView("inicio")});await p.waitForTimeout(200);
 // avisos
 ok(await p.evaluate(()=>/Você vai usar o site/.test(document.querySelector('#iNotice').textContent)),name+": aviso do artefato");
 ok(await p.evaluate(()=>/nunca fez um backup/.test(document.querySelector('#iNotice').textContent)),name+": lembrete de backup");
 await p.evaluate(()=>[...document.querySelectorAll('#iNotice .inote.warn button')][1].click());await p.waitForTimeout(80);
 ok(await p.evaluate(()=>!/backup/.test(document.querySelector('#iNotice').textContent)&&localStorage.getItem("resid-bksnooze")>today()),name+": lembrar em 7 dias");
 await p.evaluate(()=>document.querySelector('#iNotice .inote .link').click());await p.waitForTimeout(80);
 ok(await p.evaluate(()=>!document.querySelector('#iNotice .inote')),name+": Entendi esconde o aviso");
 // fila
 ok(await p.evaluate(()=>{const t=document.querySelector('#iQueue').textContent;return /Erros/.test(t)&&/Cartões/.test(t)}),name+": fila mostra erros e cartões");
 await p.screenshot({path:`inicio-${name}.png`,fullPage:false});
 await p.evaluate(()=>document.querySelector('#iqGo').scrollIntoView({block:"center"}));await click('#iqGo');await p.waitForTimeout(250);
 ok(await p.evaluate(()=>view==="erros"&&!!erRun),name+": fila começa pelos erros");ok(await vis(p,'#qBar'),name+": barra da fila aparece");
 const bar=await p.evaluate(()=>{const r=document.querySelector('#qBar').getBoundingClientRect(),n=document.querySelector('.appnav');const nr=n&&n.offsetParent!==null?n.getBoundingClientRect():null;return {b:r.bottom,h:innerHeight,overlap:nr?(r.bottom>nr.top+1&&r.top<nr.bottom):false,w:r.width}});
 ok(bar.b<=bar.h+1&&!bar.overlap,name+": barra não cobre a navegação "+JSON.stringify(bar));await p.screenshot({path:`qbar-${name}.png`});
 await click('#qNext');await p.waitForTimeout(250);ok(await p.evaluate(()=>view==="notas"&&!!cdRun),name+": próximo = cartões");
 await p.evaluate(()=>{while(dayQ&&dayQ.i<dayQ.ids.length-1)qNext();qNext()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>!dayQ&&view==="inicio"&&!document.querySelector('#qBar')&&/concluída/.test(document.querySelector('#iQueue').textContent)),name+": fila termina no Início");
 await p.evaluate(()=>{erRun=null;cdRun=null;render()});
 // busca
 await click('#srchBtn');await p.waitForTimeout(100);ok(await vis(p,'#gsearch'),name+": busca abre");
 await p.fill('#gsq','insuf');await p.waitForTimeout(300);
 const g=await p.evaluate(()=>[...document.querySelectorAll('#gsres .gsg .glabel')].map(x=>x.textContent));ok(g.some(x=>/^Temas/.test(x))&&g.some(x=>/^Anotações/.test(x))&&g.some(x=>/^Cartões/.test(x)),name+": busca acha temas, anotações e cartões "+g.join(", "));
 await p.screenshot({path:`busca-${name}.png`});
 ok(await p.evaluate(()=>{const r=document.querySelector('#gsearch .gsbox').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth}),name+": busca cabe na tela");
 await p.evaluate(()=>[...document.querySelectorAll('#gsres .gsg')].find(x=>/^Anotações/.test(x.querySelector('.glabel').textContent)).querySelector('button').click());await p.waitForTimeout(200);
 ok(await p.evaluate(()=>!document.querySelector('#gsearch')&&openKey==="CM-1"),name+": resultado abre o tema");
 if(!mob){await p.evaluate(()=>{openKey=null;setView("inicio")});await p.keyboard.press('Control+k');await p.waitForTimeout(100);ok(await vis(p,'#gsearch'),name+": Ctrl+K abre a busca");await p.keyboard.press('Escape');await p.waitForTimeout(80);ok(!(await vis(p,'#gsearch')),name+": Esc fecha")}
 // personalizar o Início
 await p.evaluate(()=>{openKey=null;backStack=[];setView("inicio")});await p.waitForTimeout(100);
 await p.evaluate(()=>document.querySelector('#iCustB').click());await p.waitForTimeout(80);await p.evaluate(()=>document.querySelector('#icb-iStats').click());await p.waitForTimeout(80);
 ok(await p.evaluate(()=>{const s=document.querySelector('#iStats');return s&&s.offsetParent===null&&ui.prefs.ihide.includes("iStats")}),name+": esconder cartão do Início");
 await p.evaluate(()=>{const li=document.querySelector('#icb-iQueue').closest('li');li.querySelectorAll('button')[0].click()});await p.waitForTimeout(80);
 ok(await p.evaluate(()=>iOrder()[0]==="iQueue"),name+": mudar a ordem");
 await p.evaluate(()=>[...document.querySelectorAll('.icust .link')].pop().click());await p.waitForTimeout(80);ok(await p.evaluate(()=>!ui.prefs.ihide&&iOrder()[0]==="iBoard"),name+": voltar ao padrão");
 // resumo da semana (simula domingo)
 ok(await p.evaluate(()=>{const g=Date.prototype.getDay;Date.prototype.getDay=function(){return 0};hist[today()]={...(hist[today()]||{}),q:10,c:7};const c=iWeekCard();Date.prototype.getDay=g;return !!c&&/Questões/.test(c.textContent)&&/70%/.test(c.textContent)}),name+": resumo da semana");
 // calendário e Anki
 const got=await p.evaluate(async()=>{const out=[];const o=downloadsFn.save;downloadsFn={save:async x=>{out.push({f:x.filename,t:await x.data.text()})}};
   const sid=fac.sems.length?fac.sems[0].id:null;ui.profile.exams=[{id:"e1",name:"ENARE",date:fromNum(dnum(today())+90)},{id:"e2",name:"USP"}];saveUI();await icsSave();const m1=await ankiSave("cards");const m2=await ankiSave("errs");downloadsFn={save:o};return {out,m1,m2}});
 ok(got.out[0]&&/BEGIN:VEVENT/.test(got.out[0].t)&&/Prova de residência/.test(got.out[0].t)&&/TRIGGER:-P1D/.test(got.out[0].t),name+": calendário .ics");
 ok(got.out[1]&&/^#separator:tab/.test(got.out[1].t)&&got.out[1].t.split("\n").length===5&&/2 cartões/.test(got.m1),name+": Anki cartões");
 ok(got.out[2]&&got.out[2].t.split("\n").length===6&&/erro/.test(got.out[2].t),name+": Anki erros "+(got.out[2]&&got.out[2].t.split("\n").length)+" "+got.m2);
 // ajuda "?"
 await p.evaluate(()=>{setView("erros")});await p.waitForTimeout(100);await p.evaluate(()=>document.querySelector('#viewErros .hlpb').click());await p.waitForTimeout(150);
 ok(await p.evaluate(()=>{const d=[...document.querySelectorAll('#helpList details')].find(x=>x.open);return view==="help"&&d&&/Caderno de erros/.test(d.querySelector('summary').textContent)}),name+": ? abre a ajuda certa");
 // ⋯ ações do erro
 await p.evaluate(()=>{goBack&&goBack();backStack=[];setView("erros")});await p.waitForTimeout(100);
 ok(await p.evaluate(()=>{const c=document.querySelector('#elist .ecard');return c&&c.querySelectorAll('.mini').length===1}),name+": erro mostra só ⋯ Ações");
 // anotações paginadas
 await p.evaluate(()=>{ALL.slice(0,45).forEach(it=>notes[it.key]="## "+it.t+"\n- x");setView("notas");if(typeof setNSeg==="function")setNSeg("todas")});await p.waitForTimeout(200);
 const nn=await p.evaluate(()=>document.querySelectorAll('#viewNotas .nitem, #viewNotas .ncard, #nlist > li').length);
 ok(await vis(p,'#nMore'),name+": anotações mostram 'Mostrar mais'");await p.evaluate(()=>document.querySelector('#nMore').click());await p.waitForTimeout(150);
 ok(!(await vis(p,'#nMore')),name+": depois mostra todas");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
