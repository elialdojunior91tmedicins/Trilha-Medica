// t142 (Lote 21, item 3): cartões do erro mais completos, Salvar × Juntar ao lote, melhoria em lote com antes e depois, árvore, estudo por recorte e editor
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
 /* 1. rascunho do app usa a questão inteira, o ponto-chave e os dados decisivos */
 const eid=await p.evaluate(()=>{cards=[];const k=ALL[0].key,q={enunciado:"Homem de 34 anos, HIV com CD4 de 120, com placas brancas na borda lateral da língua que não saem na raspagem. Qual o agente?",
     alternativas:[{letra:"A",texto:"Candida albicans",porque:"A candidíase sai na raspagem com espátula, deixando base eritematosa."},{letra:"B",texto:"Vírus Epstein-Barr",porque:""},{letra:"C",texto:"HPV",porque:"Causa papilomas."}],
     correta:"B",comentario:"A leucoplasia pilosa oral é causada pela reativação do EBV e não sai na raspagem.",conceito:"Placa branca lateral na língua que não sai na raspagem = leucoplasia pilosa por EBV.",pontoChave:"Não sai na raspagem: pense em leucoplasia pilosa (EBV), não em candidíase."};
   const D=qDraft(q,"A","Simulado");const e=eNew(k,D.w,D.r,D.t,D.s,"",D.p,{pc:D.pc||"Não sai na raspagem: pense em leucoplasia pilosa (EBV), não em candidíase.",dd:"HIV com CD4 120 · placa que não sai na raspagem",qf:D.qf});
   eGoTopic(k);backStack=[];setView("erros");eMenu=e.id;render();return e.id});await p.waitForTimeout(200);
 await click('#ecd-'+eid);
 const D=await p.evaluate(id=>{const w=document.querySelector(`.cderr[data-eid="${id}"]`);return w&&{q:[...w.querySelectorAll('.osq')].map(x=>x.textContent),a:[...w.querySelectorAll('.osa')].map(x=>x.textContent),btn:[...w.querySelectorAll('.btns .btn')].map(x=>x.textContent)}},eid);
 ok(D&&/CD4 120/.test(D.q[0])&&/Qual o agente\?/.test(D.q[0])&&/Epstein-Barr/.test(D.a[0])&&/leucoplasia pilosa/.test(D.a[0]),name+": discriminador com dados decisivos, a pergunta da questão e o ponto-chave "+JSON.stringify(D&&D.q[0]));
 ok(D&&/raspagem com espátula/.test(D.a[1]),name+": 'por que não a sua' com o porquê da alternativa marcada");
 ok(D&&D.btn[0]==="Salvar 2 cartões"&&D.btn[1]==="Juntar ao lote de melhorias",name+": prévia com Salvar e Juntar ao lote de melhorias "+JSON.stringify(D&&D.btn));
 await click('#cdLot-'+eid);
 ok(await p.evaluate(()=>cards.length===2&&cards.every(x=>x.dr===1)&&!cdDue().length),name+": juntar ao lote guarda como rascunho, fora da revisão");
 ok(await p.evaluate(()=>!!document.querySelector('#toastGo')),name+": aviso com atalho para Cartões");
 ok(await p.evaluate(id=>!eByCard(errors.find(e=>e.id===id)),eid),name+": erro com cartão só em rascunho continua na revisão de erros");
 /* 2. melhoria em lote: antes e depois, aprovar um só */
 await p.evaluate(()=>{window.__pr=null;sampleFn.json=async(pr)=>{window.__pr=pr;const ids=[...pr.matchAll(/código (cd[a-z0-9]+)/g)].map(m=>m[1]);return ids.map((id,i)=>({codigo:id,question:`<b>Leucoplasia pilosa.</b> Pergunta melhor ${i}?`,answer:`<b>Resposta ${i}.</b><br><br><i>Explicação ${i}.</i>`,reference:"<i>Oral hairy leukoplakia</i>, em <b>UpToDate</b>."}))}});
 await p.evaluate(()=>cdGoCards());await p.waitForTimeout(250);
 ok(await p.evaluate(()=>/2 cartões/.test((document.querySelector('#cdLotBox .cdlotn')||{}).textContent||"")),name+": linha 'N cartões esperando o Claude'");
 await click('#cdLotGo');await p.waitForTimeout(200);
 const PR=await p.evaluate(()=>window.__pr||"");
 ok(/MARCADA PELO ESTUDANTE/.test(PR)&&/\[CORRETA\]/.test(PR)&&/Ponto-chave:/.test(PR)&&/porquê: A candidíase/.test(PR)&&(PR.match(/código cd/g)||[]).length===2,name+": um pedido só com a questão inteira, marcada, certa, porquês, ponto-chave e código de cada cartão");
 ok(await p.evaluate(()=>cdLot&&cdLot.st==="review"&&document.querySelectorAll('.cdbai').length===2),name+": antes e depois de cada cartão");
 await click('#cdAp-1');await click('#cdLotApply');
 ok(await p.evaluate(()=>{const a=cards.filter(x=>!x.dr),d=cards.filter(x=>x.dr);return a.length===1&&a[0].src==="claude"&&/Pergunta melhor 0/.test(a[0].q)&&/UpToDate/.test(a[0].ref)&&d.length===1}),name+": aprovado troca o rascunho e entra na revisão; o outro continua no lote");
 ok(await p.evaluate(()=>cdDue().length===1),name+": só o aprovado entra na fila");
 await click('#cdLotSee');const did=await p.evaluate(()=>cards.find(x=>x.dr).id);await click('#cdUse-'+did);
 ok(await p.evaluate(()=>!cards.some(x=>x.dr)&&!document.querySelector('#cdLotBox')),name+": 'Usar como está' tira do lote");
 /* 3. árvore e estudo por recorte */
 await p.evaluate(()=>{const k1=ALL[0].key,k2=ALL.find(i=>i.area.code!==ALL[0].area.code).key,T=today();
   const a=cdAdd(k2,"<b>X.</b> vence hoje?","<b>Sim.</b>","eu",{h:1}),b=cdAdd(k2,"<b>Y.</b> não vence?","<b>Não.</b>","eu",{h:1});window.__a=a.id;window.__b=b.id;window.__k2=k2});await p.waitForTimeout(400);
 await p.evaluate(()=>{const T=today(),k1=ALL[0].key,a=cards.find(x=>x.id===window.__a),b=cards.find(x=>x.id===window.__b);
   a.f={st:2,s:5,d:5,last:fromNum(dnum(T)-5),reps:2,lapses:0,first:"2026-10-01"};a.due=T;b.f={st:2,s:20,d:5,last:fromNum(dnum(T)-2),reps:2,lapses:0,first:"2026-10-01"};b.due=fromNum(dnum(T)+18);window.__bdue=b.due;cdPut(a);cdPut(b);
   cards.filter(x=>x.k===k1).forEach(x=>{x.f.st=2;x.f.s=10;x.f.last=T;x.due=fromNum(dnum(T)+9)});cdSaveLocal();render()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>{const t=document.querySelector('#cdTree');return !!t&&t.querySelectorAll('.cdtn.lv0').length===2&&/2 cartões · 1 hoje/.test(t.textContent)}),name+": árvore por grande área com total e quantos vencem hoje");
 const ak=await p.evaluate(()=>BYKEY[window.__k2].area.code);
 await click('#cdT-a_'+ak.replace(/[^a-zA-Z0-9-]/g,"_"));
 ok(await p.evaluate(()=>document.querySelectorAll('#cdTree .cdtn.lv1').length>=1),name+": abrir a área mostra as especialidades");
 await click('#cdS-a_'+ak.replace(/[^a-zA-Z0-9-]/g,"_"));
 ok(await p.evaluate(()=>cdRun&&cdRun.ids[0]===window.__a&&cdRun.extra.includes(window.__b)&&!cdRun.extra.includes(window.__a)),name+": estudar a área: o vencido entra como revisão e o resto como treino extra");
 await p.evaluate(()=>{cdRun.show=true;render()});await click('#cdR3');
 ok(await p.evaluate(()=>cards.find(x=>x.id===window.__a).due!==today()),name+": o vencido avança na agenda (FSRS)");
 ok(await p.evaluate(()=>/TREINO EXTRA/.test(document.querySelector('.oscard .qn').textContent)),name+": o extra aparece marcado como treino extra");
 await p.evaluate(()=>{cdRun.show=true;render()});await click('#cdR4');
 ok(await p.evaluate(()=>{const x=cards.find(x=>x.id===window.__b);return x.due===window.__bdue&&x.f.reps===2}),name+": treino extra não mexe na agenda");
 await p.evaluate(()=>{cdRun=null;render()});
 /* 4. editor completo */
 await p.evaluate(()=>{const x=cards.find(x=>x.id===window.__a);x.a="<b>Sim.</b><br><br><i>Porque <b>sim</b>.<br><br><b>Note:</b> cuidado.</i>";cdEditOpen(x)});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>cdEd.a==="**Sim.**"&&cdEd.x==="Porque **sim**."&&cdEd.n==="cuidado."),name+": editor separa resposta, explicação e Note");
 await p.fill('#cde-x','Porque **sim**.\nMais conteúdo acrescentado.');await p.fill('#cde-r','*Livro*, em **Harrison**.');await click('#cdeSave');
 ok(await p.evaluate(()=>{const x=cards.find(x=>x.id===window.__a);return /Mais conteúdo acrescentado/.test(x.a)&&/<b>Note:<\/b> cuidado/.test(x.a)&&/<i>Livro<\/i>, em <b>Harrison<\/b>/.test(x.ref)&&!cdEd}),name+": salvar o editor guarda explicação a mais, Note e referência");
 ok(await p.evaluate(()=>{const c=cdClean({...cards[0],dr:1});return c.dr===1}),name+": o rascunho passa pela limpeza (conta e backup)");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
