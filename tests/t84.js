// t84: Início — saudação do dia (#iHero): data, Bom dia/Boa tarde/Boa noite + nome, o que espera hoje, prova perto, feito real ou frase do dia, botão da fila
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined,colorScheme:name==="note"?"dark":"light"});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
  /* conta vazia: frase do dia, sem botão de fila */
  await p.evaluate(()=>{backStack=[];setView("inicio")});await p.waitForTimeout(100);
  const r0=await p.evaluate(()=>({t:document.querySelector('#iHero').textContent,line:document.querySelector('#iHero .hline').textContent,feat:document.querySelector('#iHero .hline').classList.contains('feat'),
    want:HERO_FRASES[dnum(today())%HERO_FRASES.length],n:HERO_FRASES.length,uniq:new Set(HERO_FRASES).size,date:document.querySelector('#iHero .hdate').textContent}));
  ok(r0.line===r0.want&&!r0.feat,name+": sem feitos, mostra a frase do dia: "+r0.line);
  ok(r0.n===60&&r0.uniq===60,name+": 60 frases diferentes (uma por dia, sem repetir por 2 meses)");
  ok(/^[A-ZÁ-Ú][a-zá-ú-]+, \d{1,2} de [a-zç]+$/.test(r0.date),name+": data por extenso: "+r0.date);
  /* saudação pela hora e nome do Perfil */
  const hi=await p.evaluate(()=>{const g=Date.prototype.getHours,out=[];for(const hh of [7,14,21,2]){Date.prototype.getHours=function(){return hh};out.push(heroHi())}Date.prototype.getHours=g;
    ui.profile.name="Eli Junior";saveUI();render();const a=document.querySelector('#iHero .hhi').textContent;ui.profile.name="";saveUI();render();const b2=document.querySelector('#iHero .hhi').textContent;ui.profile.name="Eli Junior";saveUI();render();return {out,a,b:b2}});
  ok(hi.out.join("|")==="Bom dia|Boa tarde|Boa noite|Boa noite",name+": Bom dia, Boa tarde e Boa noite pela hora");
  ok(/^(Bom dia|Boa tarde|Boa noite), Eli\.$/.test(hi.a)&&/^(Bom dia|Boa tarde|Boa noite)\.$/.test(hi.b),name+": usa o primeiro nome; sem nome, só a saudação: "+hi.a+" / "+hi.b);
  ok(await p.evaluate(()=>heroSummary({errs:5,cards:0,notes:0,revs:3})==="3 revisões e 5 erros esperam por você hoje."&&heroSummary({errs:0,cards:0,notes:0,revs:1})==="1 revisão espera por você hoje."
    &&heroSummary({errs:1,cards:2,notes:1,revs:4})==="4 revisões, 1 erro, 2 cartões e 1 anotação para reler esperam por você hoje."),name+": resumo do que espera hoje, no singular e no plural");
  /* com pendências: botão da saudação começa a fila; o Revisar hoje não repete o botão */
  await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
    state["CM-1"]={l:1,last:D(-3),step:0,sd:[]};state["CM-2"]={l:1,last:D(-5),step:0,sd:[]};
    const e={id:"e1",k:"CM-3",w:"Errei a dose",r:"Dose certa",t:"c",s:"",d:D(-2),due:today()};errors.push(e);putErr(e);
    ui.profile.exams=[{id:"x1",name:"ENARE",date:D(12)}];ui.profile.mainEx="x1";saveUI();commit()});await p.waitForTimeout(150);
  const r1=await p.evaluate(()=>{const C=qCounts();return {C,sum:document.querySelector('#iHero .hsum').textContent,want:heroSummary(C),btn:(document.querySelector('#heroGo')||{}).textContent,iq:!!document.querySelector('#iqGo'),ex:(document.querySelector('#iHero .hexam')||{}).textContent}});
  ok(r1.C.revs>=2&&r1.C.errs>=1&&r1.sum===r1.want&&/esperam por você hoje/.test(r1.sum),name+": mostra o que espera hoje: "+r1.sum);
  ok(r1.btn==="Começar a fila →"&&!r1.iq,name+": botão Começar a fila na saudação, sem botão repetido em Revisar hoje");
  ok(r1.ex==="Faltam 12 dias para ENARE.",name+": contagem até a prova principal: "+r1.ex);
  if(name==="fone"||name==="note"||name==="monitor"){await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:`t84-${name}.png`})}
  const pos=await p.evaluate(()=>{const H=document.querySelector('#iHero').getBoundingClientRect(),B=document.querySelector('#iBoard').getBoundingClientRect(),V=document.querySelector('#viewInicio').getBoundingClientRect();
    const Q=document.querySelector('#iQueue').getBoundingClientRect();return {above:H.top<B.top&&B.top<Q.top,full:Math.abs(H.width-V.width)<2,scroll:document.documentElement.scrollWidth<=innerWidth}});
  ok(pos.above&&pos.full&&pos.scroll,name+": a saudação abre o Início, na largura toda, sem rolagem lateral "+JSON.stringify(pos));
  const col=await p.evaluate(()=>{const c=getComputedStyle(document.querySelector('#iHero .hhi')).color,bg=getComputedStyle(document.querySelector('#iHero')).backgroundImage;return {c,bg}});
  ok(/gradient/.test(col.bg)&&(col.c.match(/\d+/g)||[]).slice(0,3).every(v=>+v>200),name+": fundo em degradê marinho e título claro "+col.c);
  await click('#heroGo');
  ok(await p.evaluate(()=>!!dayQ&&!!document.querySelector('#qBar')),name+": tocar começa a fila do dia");
  await p.evaluate(()=>{backStack=[];setView("inicio")});await p.waitForTimeout(120);
  const r2=await p.evaluate(()=>({btn:(document.querySelector('#heroGo')||{}).textContent,sum:document.querySelector('#iHero .hsum').textContent,sair:/Sair da fila/.test(document.querySelector('#iQueue').textContent),iq:!!document.querySelector('#iqGo')}));
  ok(r2.btn==="Continuar a fila →"&&/Fila do dia em andamento/.test(r2.sum)&&r2.sair&&!r2.iq,name+": durante a fila: Continuar na saudação; Sair da fila continua em Revisar hoje "+JSON.stringify(r2));
  await p.evaluate(()=>{qStop();render()});
  /* esconder a saudação devolve o botão ao Revisar hoje; ordem salva antiga põe a saudação no topo */
  ok(await p.evaluate(()=>{ui.prefs.ihide=["iHero"];saveUI();render();const a=!!document.querySelector('#iqGo')&&document.querySelector('#iHero').classList.contains('ihid');ui.prefs.ihide=[];saveUI();render();return a}),name+": sem a saudação, o Começar a fila volta ao Revisar hoje");
  ok(await p.evaluate(()=>{ui.prefs.iorder=["iQueue","iBoard","iToday"];const o=iOrder();delete ui.prefs.iorder;return o[0]==="iHero"&&o[1]==="iQueue"}),name+": quem já tinha ordem própria recebe a saudação no topo");
  /* feitos reais no lugar da frase */
  const ft=await p.evaluate(()=>{const t=dnum(today());for(let i=0;i<6;i++){const d=fromNum(t-i);hist[d]={...(hist[d]||{}),e:1}}hist[fromNum(t-1)].q=40;hist[fromNum(t-1)].c=29;render();
    return {F:heroFeats(),line:document.querySelector('#iHero .hline').textContent,feat:document.querySelector('#iHero .hline').classList.contains('feat')}});
  ok(ft.F.some(x=>/^6 dias seguidos estudando/.test(x))&&ft.F.some(x=>x==="Ontem você fez 40 questões, com 73% de acerto.")&&ft.feat&&ft.F.includes(ft.line),name+": feitos reais trocam a frase: "+ft.line);
  const sp=await p.evaluate(()=>{const t=dnum(today()),k=ALL.find(i=>i.sp).key,sp=BYKEY[k].sp;state[k]={...(state[k]||{}),qd:{[fromNum(t-50)]:[20,10],[fromNum(t-5)]:[20,15]},qt:40,qc:25};return {F:heroFeats(),sp}});
  ok(sp.F.includes(`Seu acerto em ${sp.sp} subiu de 50% para 75% no último mês.`),name+": acerto que subiu numa especialidade");
  /* tudo em dia: próximo passo */
  ok(await p.evaluate(()=>{const s=heroSummary({errs:0,cards:0,notes:0,revs:0}),n=nextSteps()[0];return n?s===`Revisões em dia. Próximo: ${n.t}.`:s==="Tudo feito por hoje. Bom trabalho."}),name+": em dia, a saudação aponta o próximo tema");
  await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
