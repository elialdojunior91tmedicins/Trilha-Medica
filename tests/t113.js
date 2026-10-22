// t113: Lote 12 — referências nas questões geradas, Refazer espaçado (2 acertos em dias diferentes, embaralhado, fila do dia, teimosas, filtros, fonte do simulado, % no fim) e "Seus temas nas questões"
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
const Q=(n,c="B")=>({enunciado:"Caso "+n+": paciente com PA 150/95 em duas medidas",alternativas:[{letra:"A",texto:"Normal",porque:"não"},{letra:"B",texto:"HAS estágio 1",porque:""},{letra:"C",texto:"HAS estágio 3",porque:"não"},{letra:"D",texto:"Crise",porque:"não"}],correta:c,comentario:"Pela diretriz, 140–159/90–99 é estágio 1.",conceito:"HAS ≥140/90",alerta:"",fonte:"Diretrizes Brasileiras de Hipertensão Arterial, SBC, 2020",link:"https://www.scielo.br/j/abc/a/Z6m5gGNQCvrW3WLV7csqbqh/"});
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic|jsdelivr|cdnjs/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
  /* 1. referências */
  const r1=await p.evaluate(Q=>{const site=(window.__site=true,fixedFormat(5));window.__site=false;const art=fixedFormat(5);window.__noRefCheck=false;
    const v=validQs([Q,{...Q,fonte:""},{...Q,link:"javascript:alert(1)"}]);window.__noRefCheck=true;
    const f=qFonteEl(v[0]);return {site:/pesquise na internet/.test(site)&&/"link"/.test(site),art:/não tem acesso à internet/.test(art)&&/troque a questão/.test(art),
      nv:v.length,lk:v[0].link,lk2:v[1].link,fa:f&&f.querySelector("a.qflink")&&f.querySelector("a").href,ft:f&&f.textContent,
      dp:!/conferir na diretriz vigente/.test(DEFAULT_PROMPT)&&/Nunca mande o estudante "conferir na diretriz"/.test(DEFAULT_PROMPT),up:promptUp(DEFAULT_PROMPT_1026A)===DEFAULT_PROMPT}},Q(1));
  ok(r1.site&&r1.art,name+": no site o pedido manda pesquisar e trazer o link; no artefato, sem internet, troca a questão sem fonte segura");
  ok(r1.nv===2&&/^https:\/\/www\.scielo/.test(r1.lk)&&!r1.lk2,name+": artefato descarta questão sem referência; link só se for http(s)");
  ok(r1.fa&&/Referência/.test(r1.ft)&&/Abrir a referência/.test(r1.ft),name+": a referência aparece com o link para a página");
  ok(r1.dp&&r1.up,name+": instruções padrão sem 'confira na diretriz' (quem tinha o padrão antigo passa para o novo)");
  /* 2. Refazer */
  const r2=await p.evaluate(()=>{redo=[];rdAdd("CM-1",{enunciado:"X1",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"B",comentario:"",conceito:"",alerta:""},"sim");
    const x=redo[0],d0=x.due,dl0=rdDueList().length;dayOff=1;const dl1=rdDueList().length;const g1=rdHit(x),due1=x.due,ok1=x.ok;const g1b=rdHit(x),ok1b=x.ok;
    dayOff=4;const g2=rdHit(x);const left=!redo.find(y=>y.id===x.id);dayOff=0;
    rdAdd("CM-2",{enunciado:"X2",alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"}],correta:"B",comentario:"",conceito:"",alerta:""},"gen");const y=redo[redo.length-1];rdHit(y);rdMiss(y);
    return {d0,today:today(),dl0,dl1,g1,due1,ok1,g1b,ok1b,g2,left,src:x.src,y:{ok:y.ok,wr:y.wr,n:y.n,due:y.due}}});
  ok(r2.d0>r2.today&&r2.dl0===0&&r2.dl1===1&&r2.src==="sim",name+": questão errada volta no dia seguinte (e guarda de onde veio)");
  ok(!r2.g1&&r2.ok1===1&&!r2.g1b&&r2.ok1b===1,name+": 1º acerto não tira da lista; acertar de novo no mesmo dia não conta");
  ok(r2.g2&&r2.left,name+": 2º acerto em outro dia tira da lista");
  ok(!r2.y.ok&&r2.y.wr===1&&r2.y.n===2,name+": errou no Refazer: zera os acertos e conta como teimosia");
  const r3=await p.evaluate(()=>{window.__noShuffle=false;const x={id:"rx",k:"CM-1",d:today(),n:1,q:{enunciado:"E",alternativas:"ABCD".split("").map(l=>({letra:l,texto:"t"+l})),correta:"C",comentario:"",conceito:"",alerta:""}};
    let moved=false;for(let i=0;i<20&&!moved;i++){const v=rdView(x);const t=v.alternativas.find(a=>a.letra===v.correta).texto;if(t!=="tC")return {bad:1};if(v.correta!=="C")moved=true}window.__noShuffle=true;return {moved}});
  ok(r3.moved&&!r3.bad,name+": alternativas embaralhadas no Refazer, mantendo a correta");
  /* fila do dia e cartão */
  await p.evaluate(async Q=>{await Promise.all(redo.map(x=>rdDel(x.id)));redo=[];const D=n=>fromNum(dnum(today())+n);
    redo.push(rdClean({id:"a1",k:"CM-1",d:D(-2),n:3,q:Q,due:D(0),src:"sim",wr:2}),rdClean({id:"a2",k:"CM-2",d:D(-1),n:1,q:{...Q,enunciado:"outra"},due:D(2),src:"gen"}),rdClean({id:"a3",k:"CM-3",d:D(-3),n:1,q:{...Q,enunciado:"mais uma"},src:"exam"}));
    rdSaveLocal();rdF={due:true,src:"all",rep:false};backStack=[];setView("inicio")},Q(2));
  const r4=await p.evaluate(()=>({c:qCounts().redo,txt:document.querySelector('#iQueue').textContent}));
  ok(r4.c===2&&/refazer/i.test(r4.txt),name+": fila do dia tem o passo das questões para refazer ("+r4.c+")");
  await p.evaluate(()=>qGoStep("redo"));await p.waitForTimeout(250);
  ok(await p.evaluate(()=>view==="quest"&&rdRun&&rdRun.ids.join()==="a3,a1"||rdRun&&rdRun.ids.length===2),name+": o passo abre o Refazer com as que vencem hoje");
  await click('.rdplay .alt:nth-child(1)');
  ok(await p.evaluate(()=>!!document.querySelector('.rdplay .verdict')),name+": responde no Refazer");
  await p.evaluate(()=>{rdRun={ids:["a1"],i:0,ans:null,hit:0,okc:0,done:0,res:[],view:{}};render()});await p.waitForTimeout(150);
  await p.evaluate(()=>{const v=rdRun.view.a1||rdView(redo.find(x=>x.id==="a1"));const wrong=v.alternativas.find(a=>a.letra!==v.correta).letra;const b=[...document.querySelectorAll('.rdplay .alt')].find(x=>x.textContent.trim().startsWith(wrong));b.click()});await p.waitForTimeout(150);
  ok(await p.isVisible('#rdTeim'),name+": errou de novo uma teimosa: sugere o caderno de erros");
  if(await p.evaluate(()=>twoCols())){await click('#rdFullB');const fv=await p.evaluate(()=>({v:document.querySelector('#viewQuest').classList.contains('vfull'),hid:document.querySelector('.qsim').closest('.fullhide')!==null||document.querySelector('.qsim').classList.contains('fullhide')}));
    ok(fv.v&&fv.hid,name+": Refazer em tela inteira esconde o resto da aba");await p.keyboard.press('Escape');await p.waitForTimeout(150);ok(await p.evaluate(()=>!fullOn.rd&&!document.querySelector('#viewQuest').classList.contains('vfull')),name+": Esc sai da tela inteira")}
  else ok(!(await p.$('#rdFullB')),name+": sem tela inteira no celular e no iPad em pé (como no simulado)");
  await click('#rdNext');ok(await p.evaluate(()=>/Você acertou 0% ao refazer/.test(document.querySelector('#rdEnd').textContent)),name+": no fim, o % de acerto ao refazer");
  await p.evaluate(()=>{rdRun=null;render()});await p.waitForTimeout(100);
  const r5=await p.evaluate(()=>{const c=document.querySelector('.qredo');return {dd:c.querySelector('.todaydate').textContent,n:c.querySelectorAll('.rdlist li').length}});
  await click('#rdFAll');await p.evaluate(()=>{rdList=true;render()});await p.waitForTimeout(100);
  const r6=await p.evaluate(()=>document.querySelectorAll('.qredo .rdlist li').length);
  await p.selectOption('#rdFSrc','gen');await p.waitForTimeout(150);const r7=await p.evaluate(()=>document.querySelectorAll('.qredo .rdlist li').length);
  await p.selectOption('#rdFSrc','all');await click('#rdFRep');const r8=await p.evaluate(()=>[...document.querySelectorAll('.qredo .rdlist li')].map(l=>l.textContent));
  ok(/para hoje/.test(r5.dd)&&r6===3&&r7===1&&r8.length===2&&r8.some(t=>/teimosa/.test(t)),name+": filtros para hoje/todas, de onde veio e erradas 2+ vezes "+JSON.stringify([r5.dd,r6,r7,r8.length]));
  /* simulado: fonte Para refazer */
  await p.waitForTimeout(600);const r9=await p.evaluate(()=>{const L=simSrcList().map(x=>x[0]),T=simTopics("redo",[]).map(i=>i.key),I=rdSimItems(5),pr=simPrompt(I);
    const x=redo.find(y=>y.id===I[0].rd),ok0=x.ok||0;sim={status:"run",items:[{k:x.k,rd:x.id}],qs:[{...x.q,k:x.k,rd:x.id}],i:0,ans:{},t:{},shown:Date.now(),start:Date.now(),gen:true,src:"redo",msg:""};simAnswer(x.q.correta);const after=(redo.find(y=>y.id===x.id)||{ok:9}).ok;sim=null;
    return {L,T:T.length,I:I.length,pr:/errou uma questão sobre este ponto/.test(pr),hit:after===ok0+1||after===9}});
  ok(r9.L.includes("redo")&&r9.T===3&&r9.I===3&&r9.pr&&r9.hit,name+": simulado misto com a fonte Para refazer (caso novo; acertar conta no Refazer)");
  /* 3. Seus temas nas questões */
  await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);upd("CM-1",x=>{addQ(x,8,5,D(-10),"ENARE");addQ(x,6,5,D(-3),"Claude")});commit();rdF.due=true;rdList=false;backStack=[];setView("quest");setQSeg("temas")});await p.waitForTimeout(200);
  ok(await p.evaluate(()=>/Seus temas nas questões/.test(document.querySelector('#qFind').textContent)&&!!document.querySelector('#qFind #qlistT .qrow')),name+": filtro e lista de temas num cartão só");
  await p.evaluate(()=>{const b=[...document.querySelectorAll('#qlistT .qrow .qt')].find(x=>/Hipertensão arterial/.test(x.textContent));b.scrollIntoView({block:"center"});b.click()});await p.waitForTimeout(200);
  const r10=await p.evaluate(()=>{const P=document.querySelector('#qtp-CM-1');return P?{w:P.querySelectorAll('.qtpc').length,src:P.querySelector('.qtpsrc')&&P.querySelector('.qtpsrc').textContent,acts:[...P.querySelectorAll('.qtpacts button')].map(b=>b.textContent),view}:null});
  ok(r10&&r10.w===8&&/ENARE/.test(r10.src)&&/Claude/.test(r10.src)&&r10.view==="quest",name+": tocar no tema abre o painel ali mesmo (semanas e banca)");
  ok(r10&&["Praticar este tema","Pôr no simulado misto","Registrar questões","Abrir na Residência"].every(t=>r10.acts.includes(t)),name+": ações do painel "+(r10&&r10.acts.join(" / ")));
  await click('#qtpSim-CM-1');ok(await p.evaluate(()=>simPick.has("CM-1")&&simCfg.src==="pick"&&simTopics("pick",[]).length===1),name+": Pôr no simulado misto marca o tema em Escolher temas");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  if(name==="fone"||name==="note")await p.screenshot({path:`t113-${name}.png`});
  await click('#qtpGo-CM-1');ok(await p.evaluate(()=>view==="temas"&&openKey==="CM-1"&&detTab["CM-1"]==="questoes"),name+": Praticar este tema abre a aba Questões do tema");
  await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
