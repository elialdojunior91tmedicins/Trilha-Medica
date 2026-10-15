// t98: o cartão de busca e filtros da Residência em Questões, Erros e Anotações (painel fechado e lembrado por aba, área/especialidade com contagem,
// etiquetas dos ativos com ×, Limpar tudo, Ordem, "Ver resultados" no celular, exportar no rodapé dos Erros)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabDeitado:[1180,820,true],note:[1366,768,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name.startsWith("ipad")||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(200)};
 await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);["CM-1","CM-4","CM-34","PED-3","GO-2"].forEach((k,i)=>{state[k]={l:1,last:D(-3-i),step:0,qt:10+i,qc:3+i*2,qd:{[D(-2)]:[10+i,3+i*2]}};notes[k]="## Resumo\n"+(i<2?"> pegadinha\n":"")+"texto "+k});
   errors.push({id:"e1",k:"CM-1",w:"Errei a dose",r:"Dose certa",t:"conhecimento",s:"ENARE 2024",d:D(-2)},{id:"e2",k:"PED-3",w:"Li errado",r:"x",t:"interpretacao",s:"USP",d:D(-10)},{id:"e3",k:"CM-4",w:"Confundi",r:"y",t:"confusao",s:"ENARE 2024",d:D(-1)});commit()});
 const T=[["quest","q","qFind","#qlistT .qname",5,"PED"],["erros","e","eFind","#elist .etopic",3,"PED"],["notas","n","nFind","#nlist .ncard .etopic",5,"PED"]];
 for(const [v,pre,card,rows,total,area] of T){
  await p.evaluate(v=>{backStack=[];setView(v);if(v==="quest")setQSeg("temas");if(v==="notas")setNSeg("todas")},v);await p.waitForTimeout(250);
  const n=()=>p.$$eval(rows,a=>a.filter(x=>x.checkVisibility()).length);
  /* 1. cartão com busca, Filtros fechado e Ordem */
  const r1=await p.evaluate(([pre,card])=>({c:!!document.getElementById(card),s:!!document.querySelector('#'+card+' .tfsearch .search'),tog:(document.getElementById(pre+"FBtn")||{}).getAttribute?.("aria-expanded"),panel:!!document.getElementById(pre+"FPanel"),sort:!!document.querySelector('#'+card+' .tfsort select')}),[pre,card]);
  ok(r1.c&&r1.s&&r1.tog==="false"&&!r1.panel&&r1.sort,`${name} ${v}: cartão com busca, Filtros fechado e Ordem `+JSON.stringify(r1));
  ok(await n()===total,`${name} ${v}: lista completa (${await n()})`);
  /* 2. abre e lembra */
  await click('#'+pre+'FBtn');ok(await p.evaluate(pre=>!!document.getElementById(pre+"FPanel")&&localStorage.getItem({q:"resid-qfpanel",e:"resid-efpanel",n:"resid-nfpanel"}[pre])==="1",pre),`${name} ${v}: Filtros abre o painel e a aba lembra`);
  /* 3. Grande área com contagem */
  const opt=await p.evaluate(([pre,a])=>{const o=[...document.querySelectorAll('#'+pre+'Area option')].find(x=>x.value===a);return o?o.textContent:""},[pre,area]);
  ok(/^Pediatria \(1\)$/.test(opt),`${name} ${v}: Grande área mostra a contagem: ${opt}`);
  await p.selectOption('#'+pre+'Area',area);await p.waitForTimeout(200);
  ok(await n()===1,`${name} ${v}: filtrar pela área`);
  const pills=await p.$$eval('#'+card+' .tfpill span',a=>a.map(x=>x.textContent));ok(pills.join()==="Pediatria"&&await p.evaluate(pre=>document.querySelector('#'+pre+'FBtn .tfn').textContent==="1",pre),`${name} ${v}: etiqueta do filtro ativo e número no botão`);
  ok(await p.evaluate(pre=>!document.getElementById(pre+"Sp").disabled,pre),`${name} ${v}: Especialidade liberada depois da área`);
  /* 4. × tira; Limpar tudo */
  await click('#'+card+' .tfpill');ok(await n()===total&&!(await p.$('#'+card+' .tfpill')),`${name} ${v}: × tira o filtro`);
  await p.selectOption('#'+pre+'Area','CM');await p.waitForTimeout(150);await click('#'+pre+'Clear');ok(await n()===total,`${name} ${v}: Limpar tudo`);
  /* 5. Ver resultados (celular) */
  if(name==="fone"){ok(await p.evaluate(()=>{const d=[...document.querySelectorAll('.tfdone')].find(x=>x.checkVisibility());return !!d}),`${name} ${v}: botão Ver resultados no celular`);
    await p.evaluate(()=>[...document.querySelectorAll('.tfdone')].find(x=>x.checkVisibility()).click());await p.waitForTimeout(250);
    ok(await p.evaluate(pre=>!document.getElementById(pre+"FPanel"),pre),`${name} ${v}: Ver resultados fecha o painel`)}
  else{ok(await p.evaluate(()=>![...document.querySelectorAll('.tfdone')].some(x=>x.checkVisibility())),`${name} ${v}: sem Ver resultados fora do celular`);await click('#'+pre+'FBtn')}
  if(name==="fone"||name==="note"){await p.evaluate(card=>{document.getElementById(card).scrollIntoView({block:"start"});scrollBy(0,-16)},card);await p.waitForTimeout(120);await p.screenshot({path:`t98-${v}-${name}.png`})}
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} ${v}: sem rolagem lateral`)}
 /* Erros: tipo de erro, ordem e exportar no rodapé */
 await p.evaluate(()=>{backStack=[];setView("erros")});await click('#eFBtn');
 await p.evaluate(()=>document.querySelector('#eFPanel [data-et="confusao"]').click());await p.waitForTimeout(150);
 ok(await p.evaluate(()=>eType==="confusao"&&[...document.querySelectorAll('#elist .etopic')].length===1&&[...document.querySelectorAll('#eFind .tfpill span')].map(x=>x.textContent).join()==="Confundi ou esqueci"),name+": erros: tipo de erro filtra e vira etiqueta");
 await p.selectOption('#eOrder','new');await p.waitForTimeout(150);ok(await p.evaluate(()=>eOrder==="new"),name+": erros: Ordem");
 ok(await p.evaluate(()=>!!document.querySelector('#eFind .tfres #ePdf')&&/1 erro/.test(document.querySelector('#eRes').textContent)),name+": erros: contagem e Exportar PDF no rodapé");
 /* Anotações: Mostrar só */
 await p.evaluate(()=>{eType="all";backStack=[];setView("notas");setNSeg("todas")});await p.waitForTimeout(150);if(!(await p.$('#nFPanel')))await click('#nFBtn');
 await p.evaluate(()=>document.querySelector('#nFPanel [data-nf="peg"]').click());await p.waitForTimeout(200);
 ok(await p.evaluate(()=>[...document.querySelectorAll('#nlist .ncard .etopic')].length===2&&/2 de 5 anotações/.test(document.querySelector('#nFCount').textContent)),name+": anotações: Com pegadinhas e contagem no topo");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
