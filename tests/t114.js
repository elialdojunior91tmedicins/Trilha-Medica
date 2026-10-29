// t114: Lote 13 — caderno único (busca única com Livre · Temas · Todas, "Temas estudados sem anotação" como filtro, 1ª página ligada vira a página do tema,
// "+ Nova página ligada" no tema) e tema repaginado (Revisão em destaque, Subtópicos com %, Nível + Peso com explicações recolhidas, Seu desempenho, gerador sem "confira na diretriz").
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,w,h,mob] of [["fone",390,844,true],["tablet",820,1180,true],["note",1366,900,false]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  /* 1. tema repaginado: Estudo */
  await p.evaluate(()=>{upd("CM-1",x=>{x.last=fromNum(dnum(today())-10);x.step=0;x.qc=6;x.qt=10;x.qd={[fromNum(dnum(today())-1)]:[10,6]}});commit();detTab["CM-1"]="estudo";openTopic("CM-1")});await p.waitForTimeout(300);
  const E=await p.evaluate(()=>{const d=document.querySelector('#t-CM-1 .detail'),vis=[...d.children].filter(c=>!c.hidden&&c.dataset.tab==="estudo");
    return {order:vis.map(c=>c.classList.contains("drev")?"rev":c.classList.contains("dsubs")?"subs":c.classList.contains("dduo")?"duo":"x").join(),
      st:d.querySelector('.drev').dataset.st,pill:d.querySelector('.drev .dpill').textContent,next:!!d.querySelector('.drev .dnext b'),pct:d.querySelector('.dsubs .dpct').textContent,
      how:d.querySelectorAll('.dduo details.dhow').length,open:[...d.querySelectorAll('.dduo details.dhow')].some(x=>x.open)}});
  ok(E.order.startsWith("rev,subs,duo")&&E.st==="late"&&/atrasada/.test(E.pill)&&E.next&&E.pct==="0%"&&E.how===2&&!E.open,name+": Estudo = Revisão (atrasada) › Subtópicos (%) › Nível + Peso recolhidos "+JSON.stringify(E));
  /* 2. Questões */
  await p.evaluate(()=>{detTab["CM-1"]="questoes";render()});await p.waitForTimeout(200);
  const Q=await p.evaluate(()=>{const d=document.querySelector('#t-CM-1 .detail'),pf=d.querySelector('.dperf');return {big:pf&&pf.querySelector('.dbig').textContent,c:pf&&pf.querySelector('.dbig').dataset.c,
    bars:pf?pf.querySelectorAll('.dwb').length:0,form:!!(pf&&pf.querySelector('#qc-CM-1')),gen:d.querySelector('.dgen .glabel')?.textContent||"",
    dir:/[Cc]onfira[^.]*diretriz/.test(d.querySelector('.dgen')?.textContent||"")}});
  ok(Q.big==="60%"&&Q.c==="bad"&&Q.bars===8&&Q.form,name+": Seu desempenho com % grande, 8 semanas e registro "+JSON.stringify(Q));
  ok(sampleOffOk(Q),name+": gerador sem “confira na diretriz” "+JSON.stringify(Q));
  /* 3. Anotações: sem página do tema → nova página ligada vira a página do tema */
  await p.evaluate(()=>{detTab["CM-1"]="notas";render()});await p.waitForTimeout(200);
  const N=await p.evaluate(()=>({lab:document.querySelector('#t-CM-1 .notes .nhead .glabel').textContent,btn:!!document.querySelector('#frlNew-CM-1'),hint:document.querySelector('#t-CM-1 .frlinked .how')?.textContent||""}));
  ok(/Página do tema/.test(N.lab)&&N.btn&&/vira a página do tema/.test(N.hint),name+": Anotações com Página do tema e + Nova página ligada "+JSON.stringify(N));
  await p.click('#frlNew-CM-1');await p.waitForTimeout(350);
  const V=await p.evaluate(()=>({view:document.querySelector('#viewNotas').hidden===false,ks:freeEdit&&freeEdit.ks.join()}));
  ok(V.view&&V.ks==="CM-1",name+": abre o editor do caderno já ligado ao tema "+JSON.stringify(V));
  await p.fill('#frT','Aula de HAS');await p.fill('#frB','- PA ≥ 140/90');await p.fill('#frTags','aula, cardio');
  await p.evaluate(()=>{const b=[...document.querySelectorAll('#nFind button')].find(x=>/^Salvar/.test(x.textContent));b.click()});await p.waitForTimeout(250);
  const R=await p.evaluate(()=>({note:notes["CM-1"]||"",free:freeN.filter(f=>f.ks.includes("CM-1")).length,msg:document.querySelector('#frMsg')?.textContent||""}));
  ok(/## Aula de HAS/.test(R.note)&&/140\/90/.test(R.note)&&R.free===0&&/Virou a página do tema/.test(R.msg),name+": 1ª página ligada vira a página do tema "+JSON.stringify(R));
  {const G=await p.evaluate(()=>({tg:(get("CM-1").tg||[]).join()}));ok(G.tg==="aula,cardio",name+": a página do tema guarda as etiquetas "+JSON.stringify(G))}
  /* 4. com página do tema, a nova fica como página ligada */
  await p.evaluate(()=>frOpenFor("CM-1",null));await p.waitForTimeout(300);await p.fill('#frT','Caso clínico');await p.fill('#frB','Paciente de 50 anos');
  await p.evaluate(()=>{const b=[...document.querySelectorAll('#nFind button')].find(x=>/^Salvar/.test(x.textContent));b.click()});await p.waitForTimeout(250);
  await p.evaluate(()=>{detTab["CM-1"]="notas";setView("temas");openTopic("CM-1")});await p.waitForTimeout(300);
  const L=await p.evaluate(()=>({n:freeN.filter(f=>f.ks.includes("CM-1")).length,lab:document.querySelector('#t-CM-1 .frlinked .glabel')?.textContent,edit:[...document.querySelectorAll('#t-CM-1 .frl .link')].map(x=>x.textContent).join()}));
  ok(L.n===1&&/Outras páginas ligadas · 1/.test(L.lab)&&/Editar no Caderno/.test(L.edit),name+": segunda página aparece em Outras páginas ligadas "+JSON.stringify(L));
  /* 5. caderno: busca única, tipo e filtro de cobertura */
  await p.evaluate(()=>{freeEdit=null;setView("notas")});await p.waitForTimeout(250);if(!(await p.$('#nNoNoteB'))){await p.click('#nFBtn');await p.waitForTimeout(200)}
  const C=await p.evaluate(()=>({ty:[...document.querySelectorAll('[id^="nTy-"]')].map(b=>b.id).join(),q:!!document.querySelector('#frq'),nonote:!!document.querySelector('#nNoNoteB'),dup:document.querySelectorAll('#nfh').length<=1}));
  ok(C.ty==="nTy-all,nTy-free,nTy-topic"&&C.q&&C.nonote&&C.dup,name+": busca única com Todas · Livre · Temas e filtro sem anotação "+JSON.stringify(C));
  await p.fill('#frq','caso clínico');await p.waitForTimeout(300);
  const S=await p.evaluate(()=>document.querySelector('#nFind').textContent.includes("Caso clínico"));ok(S,name+": a busca acha a página livre");
  await p.fill('#frq','');await p.waitForTimeout(300);await p.evaluate(()=>{nType="all";nFOpen=true;render()});await p.evaluate(()=>document.querySelector('#nFPanel [data-tag="cardio"]').click());await p.waitForTimeout(200);
  const TG=await p.evaluate(()=>({topics:[...document.querySelectorAll('#nlist .ncard')].map(c=>c.id).join(),free:document.querySelectorAll('#nFind li.ncard').length,loc:document.querySelector('#nc-CM-1 .nloc')?.textContent||""}));
  ok(TG.topics==="nc-CM-1"&&TG.free===0&&/#cardio/.test(TG.loc),name+": etiqueta filtra páginas dos temas e livres "+JSON.stringify(TG));
  await p.evaluate(()=>{freeTag="all";detTab["CM-1"]="notas";setView("temas");openTopic("CM-1")});await p.waitForTimeout(250);
  const TT=await p.evaluate(()=>[...document.querySelectorAll('#t-CM-1 .ntags .ntag')].map(b=>b.textContent).join("|"));ok(/#aula/.test(TT)&&/#cardio/.test(TT),name+": etiquetas aparecem no tema "+TT);
  await p.fill('#ntg-CM-1','prova');await p.press('#ntg-CM-1','Enter');await p.waitForTimeout(200);ok(await p.evaluate(()=>get("CM-1").tg.includes("prova")),name+": adiciona etiqueta pelo tema");
  await ctx.close()}
ok(!errs.length,"sem erros de página "+errs.join(" | "));await b.close()})();
function sampleOffOk(Q){return !Q.dir&&(!Q.gen||/Gerar questões com o Claude/.test(Q.gen))}
