// t152 (Banco de questões, B5): High Yield pelo banco. ★ HY na anotação (editor, leitura, Pegadinhas "Só HY", PDF, cartão do trecho com high-yield),
// acerto por banca no Resumo, sugestões de peso e de ★ pelo banco (só sugerem; aceitar vira escolha do usuário; "Agora não" esconde),
// conceito recorrente (chave do Claude, par sugerido pelo app, confirmar/recusar, selo, preset "HY recorrentes") e o celular sem rolagem lateral.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const SEED=`(async()=>{await bankBootP;
  const Q=(e,a,c,extra)=>({enunciado:e,alternativas:a.map((t,i)=>({letra:"ABCD"[i],texto:t})),correta:c,comentario:"",conceito:"",...(extra||{})});
  const low=ALL.find(it=>it.w0===1&&!it.own);window.__low=low.key;
  /* 3 provas novas (fora da base de 12), 60 questões cada, todas do tema pouco cobrado: o banco sugere subir o peso */
  /* provas realistas: 100 questões espalhadas pelos temas como na base (INC_DATA), e o tema pouco cobrado aparece 8 vezes em cada */
  const pool=[];ALL.filter(it=>!it.own&&it.key!==low.key).forEach(it=>{const n=(INC_DATA[it.key]||[0])[0]||0;for(let i=0;i<n;i++)pool.push(it.key)});
  const E=[];["USP 2019","USP 2020","USP 2021"].forEach((nm,j)=>{const qs=[];for(let i=0;i<100;i++)qs.push({n:i+1,k:i<8?low.key:pool[(i*37+j*11)%pool.length],g:"b",q:Q(nm+" questão "+i+": caso clínico número "+i+".",["Alternativa um "+nm+i,"Alternativa dois "+nm+i,"Alternativa três "+nm+i,"Alternativa quatro "+nm+i],"A")});
    E.push(exClean({id:"exu"+j,name:nm,banca:"USP",ano:String(2019+j),at:"2026-10-0"+(j+1)+"T10:00:00.000Z",of:1,niv:"R1",kst:"d",qs}))});
  /* duas provas com a mesma ideia em CM-1: uma com a chave do Claude, outra só com o conceito parecido */
  const con="Inibidores enzima conversora angiotensina reduzem progressao nefropatia diabetica albuminuria";
  E.push(exClean({id:"exr1",name:"ENARE 2025",banca:"ENARE",ano:"2025",at:"2026-10-05T10:00:00.000Z",of:1,niv:"R1",kst:"d",qs:[{n:1,k:"CM-1",g:"b",q:Q("Diabético com albuminuria e PA 150x90. Qual anti-hipertensivo?",["IECA","Hidroclorotiazida","Anlodipino","Atenolol"],"A",{conceito:con})}]}));
  E.push(exClean({id:"exr2",name:"SUS-SP 2023",banca:"SUS-SP",ano:"2023",at:"2026-10-06T10:00:00.000Z",of:1,niv:"R1",kst:"d",qs:[{n:4,k:"CM-1",g:"b",q:Q("Paciente com DM2 e microalbuminúria persistente. Melhor droga?",["Enalapril","Furosemida","Clonidina","Propranolol"],"A",{conceito:con+" persistente"})}]}));
  exams=E;exProg=[exPClean({id:"exr1",a:{0:{l:"A",d:"2026-11-10",s:40}}}),exPClean({id:"exu0",a:{0:{l:"A",d:"2026-11-01",s:60},1:{l:"B",d:"2026-11-01",s:60}}})];
  bankFeedAll();await new Promise(r=>setTimeout(r,50));render()})()`;
(async()=>{const b=await chromium.launch();const errs=[];
 const ctx=await b.newContext({viewport:{width:1366,height:900},acceptDownloads:true});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__qLegacy=false;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn&&bankBootP,null,{polling:100,timeout:15000});await p.evaluate(SEED);await p.waitForTimeout(200);

 /* 1. ★ HY na anotação */
 await p.evaluate(()=>{notes["CM-1"]="IECA é primeira linha no diabético com albuminúria\n- item comum";noteMode["CM-1"]="editar";detTab["CM-1"]="notas";openTopic("CM-1");render()});await p.waitForTimeout(250);
 await p.evaluate(()=>{const t=document.querySelector('#nt-CM-1');t.focus();t.setSelectionRange(3,3);[...document.querySelectorAll('#t-CM-1 .ntools .tool')].find(x=>x.textContent==="★").id="__hy"});
 await p.click('#__hy');await p.waitForTimeout(150);
 let r=await p.evaluate(()=>{const t=document.querySelector('#nt-CM-1');return {v:t.value,n:notes["CM-1"]}});
 ok(/^★ IECA é primeira linha/.test(r.v),"botão ★ do editor marca a linha como HY "+JSON.stringify(r.v.slice(0,40)));
 await p.evaluate(()=>{const t=document.querySelector('#nt-CM-1');t.focus();t.setSelectionRange(3,3)});await p.click('#__hy').catch(()=>{});await p.waitForTimeout(100);
 await p.evaluate(()=>{const b=[...document.querySelectorAll('#t-CM-1 .ntools .tool')].find(x=>x.textContent==="★");if(b)b.id="__hy";});await p.click('#__hy');await p.waitForTimeout(100);
 r=await p.evaluate(()=>document.querySelector('#nt-CM-1').value);ok(/^★ IECA/.test(r),"tocar de novo tira e põe (alternância) "+JSON.stringify(r.slice(0,20)));
 await p.evaluate(()=>{replaceNote("CM-1","★ IECA é primeira linha no diabético com albuminúria\n- ★ Metformina: suspender se TFG < 30\n- item comum\n> Pegadinha: BRA + IECA juntos — Por quê: mais hipercalemia\n==alvo < 130/80==");noteMode["CM-1"]="ler";render()});await p.waitForTimeout(200);
 r=await p.evaluate(()=>{const v=document.querySelector('#t-CM-1 .mdview');return {p:!!v&&!!v.querySelector('p.hyl .hys'),li:v?v.querySelectorAll('li.hyl').length:0,plain:v?[...v.querySelectorAll('li')].filter(l=>/item comum/.test(l.textContent)&&!l.classList.contains('hyl')).length:0}});
 ok(r.p&&r.li===1&&r.plain===1,"leitura: estrela dourada nas linhas ★ (parágrafo e item), o resto igual "+JSON.stringify(r));
 /* Pegadinhas: Só HY */
 await p.evaluate(()=>{setView("notas");setNSeg("pegadinhas");render()});await p.waitForTimeout(250);
 r=await p.evaluate(()=>{const b=document.getElementById("pgT-hy");return b&&b.textContent});ok(/Só HY · 2/.test(r||""),"Pegadinhas e destaques: tipo \"Só HY\" com a contagem "+r);
 await p.click('#pgT-hy');await p.waitForTimeout(200);
 r=await p.evaluate(()=>({t:pgF.t,n:document.querySelector('.npeg .todaydate')&&document.querySelector('.npeg .todaydate').textContent}));ok(r.t==="hy"&&/^2 de/.test(r.n||""),"filtrar só HY "+JSON.stringify(r));
 r=await p.evaluate(()=>{const L=pgAll(["CM-1"]).filter(o=>o.kind==="hy");let txt="";const save=downloadsFn.save;downloadsFn.save=async o=>{txt=String(o.filename)};return pgSheet(L).then(()=>{downloadsFn.save=save;return txt})});
 ok(/^pegadinhas-/.test(r),"folha de véspera sai com os itens HY");
 await p.evaluate(()=>{pgF.t="all";pgSave()});
 /* PDF das anotações: linha HY sem caractere perdido */
 r=await p.evaluate(()=>{const d=notesPDF(["CM-1"],[],{raw:true,title:"t"});const u=d.output();let s="";for(let i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return {hy:/\(HY\b[\s\S]{0,80}\xb7/.test(s),q:/\(\?/.test(s)&&/\?IECA/.test(s),iec:/IECA/.test(s)}});
 ok(r.hy&&!r.q,"PDF: a ★ vira \"HY ·\" (Helvetica não tem estrela) "+JSON.stringify(r));
 /* cartão do trecho com ★ leva high-yield */
 r=await p.evaluate(()=>{trStart("CM-1","★ IECA é primeira linha no diabético com albuminúria");const e=trE["CM-1"];const ids=cdErrSave(e);const x=cards.find(c=>c.id===ids[0]);return {hy:x&&x.hy,tags:x?apkgTags(x):[]}});
 ok(r.hy===1&&r.tags.includes("high-yield"),"cartão do trecho com ★ ganha a etiqueta high-yield no Anki "+JSON.stringify(r));

 /* 2. Resumo: acerto por banca no banco */
 await p.evaluate(()=>{setView("quest");qGo("resumo");render()});await p.waitForTimeout(300);
 r=await p.evaluate(()=>{const c=document.querySelector('.bkbc');return c&&{t:c.textContent,rows:c.querySelectorAll('.vrow').length}});
 ok(r&&/USP · 300 no banco/.test(r.t)&&/ENARE · 1 no banco/.test(r.t)&&r.rows>=2,"Resumo: acerto por banca (1ª vez) com quantas questões cada banca tem no banco "+JSON.stringify(r&&r.t.slice(0,160)));
 r=await p.evaluate(()=>{const c=document.querySelector('.bkbc');const u=[...c.querySelectorAll('.vrow')].find(v=>/USP/.test(v.textContent));return u&&u.querySelector('.hn').textContent});
 ok(r==="1/2","USP: 1 acerto em 2 feitas "+r);
 await p.click('#bkBc-d30');await p.waitForTimeout(200);r=await p.evaluate(()=>bkBcBy);ok(r==="d30","alterna para os últimos 30 dias");

 /* 3. High Yield pelo seu banco: sugestão de peso */
 r=await p.evaluate(()=>{const c=document.querySelector('.hycard');return c&&{t:c.textContent,b:!!document.getElementById("hyw-"+window.__low)}});
 ok(r&&/5 provas no banco: 5 fora das 12/.test(r.t)&&r.b,"cartão \"High Yield pelo seu banco\": provas novas e a sugestão de peso "+JSON.stringify(r&&r.t.slice(0,140)));
 r=await p.evaluate(()=>({w:wOf(BYKEY[window.__low]),sw:get(window.__low).w}));ok(r.w===1&&!r.sw,"sugestão não muda nada sozinha "+JSON.stringify(r));
 await p.click('#hyw-'+await p.evaluate(()=>window.__low));await p.waitForTimeout(200);
 r=await p.evaluate(()=>({w:wOf(BYKEY[window.__low]),sw:get(window.__low).w,again:hyWeightSugs().some(x=>x.k===window.__low)}));
 ok(r.w===3&&r.sw===3&&!r.again,"Aceitar: o peso vira escolha do usuário e a sugestão some "+JSON.stringify(r));
 r=await p.evaluate(()=>{const S=hyWeightSugs()[0];if(!S)return {none:true};const id="hyw-"+S.k+"-no";const b=document.getElementById(id);if(!b)return {nob:id};b.click();return {k:S.k,no:ui.prefs.hyno.includes(S.key),again:hyWeightSugs().some(x=>x.key===S.key)}});
 ok(r.none||(r.no&&!r.again),"Agora não: esconde e lembra (ui.prefs.hyno) "+JSON.stringify(r));
 /* no tema: "No seu banco" */
 await p.evaluate(()=>{detTab[window.__low]="estudo";openTopic(window.__low);render()});await p.waitForTimeout(250);
 r=await p.evaluate(()=>{const d=document.querySelector('#t-'+window.__low+' .hybank');return d&&d.textContent});ok(/No seu banco: caiu 24 vezes em 3 provas/.test(r||""),"no tema: o que o banco viu "+r);

 /* 4. ★ dos subtópicos pelo banco (questões com subtópico classificado) */
 r=await p.evaluate(async()=>{const it=BYKEY["CM-1"],L=subList(it),t=L.find(x=>!x.hy),sk=sbKey(t);
   const qs=[];for(let i=0;i<9;i++)qs.push({n:i+1,k:"CM-1",g:"b",sb:sk,sbg:1,q:{enunciado:"Subtópico "+i+": caso de hipertensão "+i,alternativas:[{letra:"A",texto:"um "+i},{letra:"B",texto:"dois "+i}],correta:"A"}});
   exams.push(exClean({id:"exsb",name:"Revalida 2019",banca:"REVALIDA",ano:"2019",at:"2026-10-07T10:00:00.000Z",of:1,niv:"Revalida",kst:"d",qs}));bankFeedAll();detTab["CM-1"]="estudo";openTopic("CM-1");render();
   await new Promise(r=>setTimeout(r,100));const b=document.getElementById("hys-CM-1");return {b:!!b,t:b?b.closest('.hysug').textContent:"",i:t.i}});
 ok(r.b&&/★ em/.test(r.t),"subtópicos: o banco sugere ★ no que mais caiu "+JSON.stringify(r.t.slice(0,120)));
 await p.click('#hys-CM-1');await p.waitForTimeout(200);
 r=await p.evaluate(i=>({u:(get("CM-1").hy||{})[i],sug:!!hySubSug("CM-1")&&hySubSug("CM-1").on.length}),r.i);ok(r.u==="u"&&!r.sug,"Aceitar liga a ★ como escolha do usuário "+JSON.stringify(r));

 /* 5. conceito recorrente */
 await p.evaluate(()=>{setView("quest");qGo("resumo");render()});await p.waitForTimeout(250);
 r=await p.evaluate(()=>{const c=document.querySelector('.crcard');return c&&{t:c.textContent,ok:!!document.getElementById("crOk-0")}});
 ok(r&&/Para conferir · 1/.test(r.t)&&r.ok,"Conceitos recorrentes: o app sugere o par parecido de provas diferentes "+JSON.stringify(r&&r.t.slice(0,160)));
 await p.click('#crOk-0');await p.waitForTimeout(250);
 r=await p.evaluate(()=>{const L=bank.filter(x=>x.ex==="exr1"||x.ex==="exr2");return {cr:L.map(x=>x.cr),crs:L.map(x=>x.crs),rec:L.map(x=>crRec(x)),card:document.querySelector('.crcard').textContent}});
 ok(r.cr[0]&&r.cr[0]===r.cr[1]&&r.crs.every(x=>x==="u")&&r.rec.every(n=>n===2)&&/1 conceito/.test(r.card),"É a mesma ideia: as duas ganham a mesma chave e viram recorrentes "+JSON.stringify(r.cr));
 r=await p.evaluate(()=>{const x=bank.find(y=>y.ex==="exr1");bankFeedAll();return {cr:x.cr,crs:x.crs,bk:bankBackup().bank.some(y=>y.id===x.id)}});
 ok(r.crs==="u"&&r.bk,"a prova não apaga a confirmação; o backup leva as confirmadas "+JSON.stringify(r));
 await p.click('#crSee');await p.waitForTimeout(250);
 r=await p.evaluate(()=>({part:qPart,rc:bkF.rc,rows:document.querySelectorAll('.bklist .bkrow').length,badge:document.querySelectorAll('.bklist .bkb.rc').length}));
 ok(r.part==="banco"&&r.rc&&r.rows===2&&r.badge===2,"Ver no banco: filtro de recorrentes, com o selo na linha "+JSON.stringify(r));
 await p.evaluate(()=>{bkF=bkFDef();render()});await p.waitForTimeout(150);
 await p.click('#bkP-hy');await p.waitForTimeout(200);r=await p.evaluate(()=>({rc:bkF.rc,n:document.querySelectorAll('.bklist .bkrow').length}));ok(r.rc&&r.n===2,"preset \"HY recorrentes\" "+JSON.stringify(r));
 /* recusar e a chave do Claude */
 r=await p.evaluate(()=>{const P={a:bank.find(x=>x.ex==="exu0"),b:bank.find(x=>x.ex==="exu1")};crReject(P);return crNo().includes(crPair(P.a,P.b))});ok(r,"Não é: o par fica guardado para não voltar");
 r=await p.evaluate(()=>{const ex=exams.find(e=>e.id==="exu1"),ex2=exams.find(e=>e.id==="exu2");
   cmApply(ex,[{n:5,comentario:"Porque sim.",chave:"Hipercalemia com IECA e BRA"}],[4]);cmApply(ex2,[{n:7,comentario:"Porque sim.",chave:"hipercalemia com ieca e bra"}],[6]);bankFeedAll();crReset();
   const a=bank.find(x=>x.ex==="exu1"&&x.ei===4),b=bank.find(x=>x.ex==="exu2"&&x.ei===6);return {ra:ex.qs[4].cr,a:a.cr,crs:a.crs,rec:crRec(a)&&crRec(b)}});
 ok(r.ra==="hipercalemia com ieca bra"&&r.a===r.ra&&r.crs==="c"&&r.rec===2,"Claude: a chave do comentário vai para a prova e para o banco; mesma chave em 2 provas = recorrente "+JSON.stringify(r));
 r=await p.evaluate(()=>cmPrompt(exams[0],[0]));ok(/"chave":/.test(r),"o pedido de comentário pede a chave do conceito");
 /* 6. sorteio: recorrente sobe */
 r=await p.evaluate(()=>{const C={info:new Map(bank.map(x=>[x.id,bkInfo(x)])),focus:new Map(),focusN:1,ax:new Set(),pv:null};const a=bank.find(x=>x.ex==="exr2"),z=bank.find(x=>x.ex==="exu0"&&x.ei===9);
   const R=Math.random;Math.random=()=>0;const v=[bkScore(a,C),bkScore(z,C)];Math.random=R;return v});
 ok(r[0]-r[1]>=20-1,"sorteio inteligente: +20 para o conceito recorrente "+JSON.stringify(r));

 /* 7. celular: Resumo sem rolagem lateral */
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{qGo("resumo");render()});await p.waitForTimeout(300);
 r=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cards:["bkbc","hycard","crcard"].map(c=>!!document.querySelector('.'+c))}));
 ok(r.sw<=392&&r.cards.every(Boolean),"celular: os 3 cartões do Resumo sem rolagem lateral "+JSON.stringify(r));
 ok(!errs.length,"sem erros de JavaScript "+errs.slice(0,3).join(" | "));
 await b.close()})();
