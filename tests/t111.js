// t111: Estatísticas (Residência · Faculdade, 7/30/90 dias, veredictos, 4 blocos) e melhorias dos gráficos (Lote 10)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const S=require('./seed10.js');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
  /* vazio: aviso de poucos dados, sem erro */
  await p.evaluate(()=>{backStack=[];setView("stats")});await p.waitForTimeout(150);
  ok(await p.isVisible('#stLow')&&await p.evaluate(()=>document.querySelectorAll('#stVerd .stv').length===4),name+": conta nova: aviso de poucos dados e os 4 veredictos");
  /* entrada: ≡ Menu no celular, barra lateral nas outras telas */
  if(name==="fone")ok(!(await p.isVisible('#tabS')),name+": Estatísticas não fica na barra de baixo");
  if(await p.evaluate(()=>sideFull())){ok(await p.isVisible('#tabS'),name+": Estatísticas na barra lateral");await click('#tabS');ok(await p.evaluate(()=>view==="stats"),name+": a barra lateral abre Estatísticas")}
  else{await p.evaluate(()=>{backStack=[];setView("inicio");navMenuOpen()});await p.waitForTimeout(400);
    ok(await p.isVisible('#go-stats'),name+": Estatísticas no ≡ Menu");await click('#go-stats');await p.waitForTimeout(350);ok(await p.evaluate(()=>view==="stats"),name+": o menu abre Estatísticas")}
  /* com dados */
  await p.evaluate(`(${S.toString()})()`);await p.evaluate(()=>{backStack=[];setView("stats")});await p.waitForTimeout(200);
  const r=await p.evaluate(()=>({low:!!document.querySelector('#stLow'),v:[...document.querySelectorAll('#stVerd .stv')].map(x=>x.className+"|"+x.textContent),blocks:["#stB1","#stB2","#stB3","#stB4"].map(s=>!!document.querySelector(s)),
    bars:document.querySelectorAll('#stB2 .stb').length,cur:/até hoje/.test(document.querySelector('#stB2 svg').textContent),goal:!!document.querySelector('#stB3 .goal'),quad:!!document.querySelector('#stB4 .stquad'),focus:document.querySelectorAll('#stB4 .stfi').length,
    tab:document.querySelector('#stB1 .sttab').textContent}));
  ok(!r.low&&r.v.every(x=>/stv (ok|warn|bad|na)/.test(x)),name+": com 8 semanas de dados some o aviso; veredictos coloridos "+r.v.map(x=>x.split("|")[1].slice(0,40)).join(" / "));
  ok(r.blocks.every(Boolean)&&r.bars===8&&r.cur&&r.goal,name+": 4 blocos; temas por semana (8 barras, \"até hoje\"); horas com a linha da meta");
  ok(r.quad&&r.focus>=2,name+": quadrante tempo × acerto e foco sugerido ("+r.focus+")");
  ok(/Acerto nas questões/.test(r.tab)&&/ainda erraria/.test(r.tab)&&/[▲▼=]/.test(r.tab),name+": tabela deste período × anterior");
  /* em 2 colunas (computador, iPad deitado) a aba usa a largura toda e os gráficos acompanham o cartão (10/2026) */
  {const L=await p.evaluate(()=>{const v=document.querySelector('#viewStats'),two=twoCols(),svg=document.querySelector('#stB2 svg');return {two,vw:v.clientWidth,ww:v.parentElement.clientWidth,vb:svg?+svg.getAttribute("viewBox").split(" ")[2]:0,sw:svg?Math.round(svg.getBoundingClientRect().width):0}});
   ok(!L.two||L.vw>=L.ww-2&&L.vw>800&&L.vb>320&&L.sw/L.vb<1.25,name+": Estatísticas na largura toda, gráfico sem texto gigante "+JSON.stringify(L))}
  await click('#stPer-7');ok(await p.evaluate(()=>stPer===7&&/7 dias/.test(document.querySelector('#stB1 .stlead').textContent)&&localStorage.getItem("resid-stper")==="7"),name+": período 7 dias (lembrado)");
  await click('#stPer-30');
  await click('#stAdj');ok(await p.evaluate(()=>view==="config"&&wpTab==="cur"&&!!document.querySelector('#wpCard')),name+": \"Ajustar a semana\" leva ao planejamento");
  await p.evaluate(()=>{backStack=[];setView("stats")});await p.waitForTimeout(100);
  {const sp=await p.evaluate(()=>{const b=[...document.querySelectorAll('#stB4 .stfi button')].find(x=>x.textContent==="Ver temas");if(!b)return null;b.click();return {view,area:tf.area,sp:tf.sp}});
    ok(sp&&sp.view==="temas"&&sp.area!=="all"&&sp.sp!=="all",name+": \"Ver temas\" abre a Residência filtrada na especialidade "+JSON.stringify(sp));await p.evaluate(()=>{tf.area="all";tf.sp="all"})}
  /* faculdade */
  await p.evaluate(`(${S.fac.toString()})()`);await p.evaluate(()=>{backStack=[];setView("stats")});await click('#stSide-fac');
  const f=await p.evaluate(()=>({side:stSide,v:[...document.querySelectorAll('#stVerd .stv b')].map(x=>x.textContent),notas:document.querySelectorAll('#stF1 .stnr').length,prov:document.querySelectorAll('#stF2 .stpr').length,disc:document.querySelectorAll('#stF3 .stnr').length,split:[...document.querySelectorAll('#stF4 .stsplit i')].map(i=>i.className)}));
  ok(f.side==="fac"&&f.notas===2&&f.prov>=2&&f.disc===2,name+": Faculdade: notas, provas dos próximos 30 dias e foco por disciplina "+JSON.stringify(f));
  ok(f.split.includes("sp-b")&&f.split.includes("sp-f")&&f.split.includes("sp-r"),name+": divisão do tempo com \"as duas\" (tema ligado conta nos dois lados)");
  const tt=await p.evaluate(()=>{const F=stFac(30),R=stRes(30);return {tot:F.T.tot,sum:F.T.r+F.T.f+F.T.b+F.T.n,same:F.T.tot===R.T.tot}});ok(tt.tot===tt.sum&&tt.same,name+": o total de horas nunca soma duas vezes");
  await click('#stSide-res');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": Estatísticas sem rolagem lateral");
  if(name==="fone"||name==="note")await p.screenshot({path:`t111-${name}.png`,fullPage:true});
  /* Perfil: link e PDF */
  await p.evaluate(()=>{backStack=[];goSub("perfil")});await click('#pfStats');ok(await p.evaluate(()=>view==="stats"),name+": Perfil › Ver Estatísticas");
  await click('#stPdf');ok(await p.evaluate(()=>view==="perfil"&&pdfOpt.open&&!!document.querySelector('.pdfpan')),name+": Exportar PDF abre o painel no Perfil");
  /* gráficos */
  await p.evaluate(()=>{ui.prefs.qgoal=120;saveUI();backStack=[];setView("quest");if(typeof setQSeg==="function")setQSeg("res")});await p.waitForTimeout(250);
  const q=await p.evaluate(()=>({cur:!!document.querySelector('#qEvo .qebar.cur'),hoje:/até hoje/.test(document.querySelector('#qEvo svg').textContent),goal:!!document.querySelector('#qEvo .qegoal'),
    ax:[...document.querySelectorAll('#qEvo .qeax')].map(x=>x.textContent).filter(t=>/%$/.test(t)),key:/vermelho/.test(document.querySelector('#qEvo').textContent),rows:document.querySelectorAll('#qChart .qchrow').length,tr:document.querySelectorAll('#qChart .qtr').length}));
  ok(q.cur&&q.hoje&&q.goal&&q.key,name+": Evolução: semana atual mais clara (\"até hoje\"), linha da meta e legenda das cores dos pontos");
  ok(!q.ax.includes("0%")&&q.ax.length>=2,name+": Evolução: eixo do acerto ajustado aos dados "+q.ax.join(","));
  ok(q.rows>=5&&q.tr>=1,name+": Acerto por especialidade com tendência ▲▼ ("+q.tr+")");
  await click('#qchS-gain');ok(await p.evaluate(()=>qChSort==="gain"&&localStorage.getItem("resid-qchsort")==="gain"),name+": ordem \"onde ganhar mais pontos\"");
  const few=await p.evaluate(()=>{const A=AREAS.flatMap(a=>a.specs).find(S=>S.items.every(i=>!get(i.key).qt)),k=A.items[0].key;const s=get(k);s.qd={[today()]:[3,1]};s.qt=3;s.qc=1;state[k]=s;commit();qArea="all";qSpec="all";qMore=true;render();return [...document.querySelectorAll('#qChart .qchrow.few')].some(x=>/poucas questões/.test(x.textContent))});
  ok(few,name+": linhas com poucas questões esmaecidas e marcadas");
  await p.evaluate(()=>{const b=document.querySelector('#qChart .qchrow');b.click()});ok(await p.evaluate(()=>qArea!=="all"),name+": tocar na linha filtra a especialidade");
  await p.evaluate(()=>{qArea="all";qSpec="all";backStack=[];setView("temas");setTSeg("prog")});await p.waitForTimeout(200);
  const a=await p.evaluate(()=>({rows:[...document.querySelectorAll('#areaChart .arow')].map(x=>x.textContent),act:!!document.querySelector('#actChart')}));
  ok(a.rows.length===5&&a.rows.every(t=>/de \d+ temas/.test(t))&&a.rows.some(t=>/Clínica Médica/.test(t))&&!a.act,name+": Progresso por área com nome inteiro e \"N de M temas\"; sem \"Atividade nos últimos 14 dias\"");
  await p.evaluate(()=>{ui.prefs.fgoal=60;saveUI();backStack=[];setView("foco")});await p.waitForTimeout(200);
  const fo=await p.evaluate(()=>({days:document.querySelectorAll('.fowk .fod').length,gh:document.querySelectorAll('.fowk .fogh').length,lab:(document.querySelector('.foglt')||{}).textContent||""}));
  ok(fo.days===7&&fo.gh>=1&&/meta 1/.test(fo.lab),name+": Foco › Esta semana: 7 dias, semana passada como contorno e meta rotulada "+JSON.stringify(fo));
  await p.evaluate(()=>{errors.length=0;errors.push(...[1,2].map(i=>({id:"e"+i,k:"CM-1",w:"x",r:"y",t:"conhecimento",s:"",d:today(),rev:0,box:0,due:today(),miss:0})));backStack=[];setView("erros")});await p.waitForTimeout(200);
  ok(await p.evaluate(()=>!!document.querySelector('.ewlow')&&/Poucos dados/.test(document.querySelector('.ewlow').textContent)),name+": Erros por semana avisa poucos dados");
  await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
