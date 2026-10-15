const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const EMENTA={disciplinas:[{nome:"NCS 6",tipo:"Tutoria",cargaHoraria:"120 h",professor:"Dra. Ana",tutor:"",horarios:"seg 8h",ementa:"Hematologia e cardiologia",
  eixos:[{nome:"Eixo de Hematologia",area:"CM",especialidade:"Hematologia e oncologia",sps:[{nome:"SP 2.1 Hemostasia e Distúrbios da Coagulação",objetivos:["Descrever a cascata da coagulação","Diferenciar PTI de PTT"],temas:["CM-37","XX-9"],novos:["Cascata da coagulação"]},{nome:"SP 2.2 Anemias",objetivos:[],temas:["CM-34"],novos:[]}]},
         {nome:"Eixo de Cardiologia",area:"",especialidade:"",sps:[{nome:"SP 3.1 Insuficiência cardíaca",objetivos:[],temas:["CM-6"],novos:["Anatomia do coração"]}]}]}]};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1366,height:900}});await ctx.route(/googleapis|gstatic/,r=>r.abort());
await ctx.addInitScript(mock+`;window.__mock({},5);const _u=window.claude.use;window.claude.use=async n=>{if(n!=="sample")return _u(n);const f=async()=>({text:"x"});f.json=async(p)=>{window.__ementaPrompt=p;return ${JSON.stringify(EMENTA)}};return f};`);
await ctx.addInitScript(()=>{if(!sessionStorage.getItem('__seeded')){sessionStorage.setItem('__seeded','1');localStorage.clear();localStorage.setItem("resid-fac-v1",JSON.stringify({sems:[{id:"s",name:"6° Semestre",archived:false}],discs:[{id:"old",semId:"s",name:"Cardio antiga",items:["T:CM-6","O:a"]}],provas:[{id:"p0",discId:"old",name:"P1",date:"2026-12-01",items:["T:CM-6"],done:[]}],own:{a:{t:"Anatomia do mediastino",discId:"old"}}}))}});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
// dados no formato antigo (preparados antes de o app abrir)
await p.goto('file://'+__dirname+'/../src/checklist-residencia.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});await p.waitForTimeout(300);
await p.click('#tabF');await p.click('#facSems .fdsum');await p.waitForTimeout(100);
ok(await p.evaluate(()=>/2 conteúdos/.test(document.getElementById("facSems").textContent)&&document.querySelectorAll("#facSems .flist li.t").length===2&&fac.discs[0].sps.length===0&&!fac.discs[0].eixos&&fac.discs[0].div===""),"dados antigos: carregam e aparecem como conteúdo avulso (sem divisões)");
ok(await p.evaluate(()=>BYKEY["F-a"]&&BYKEY["F-a"].area===FAC_AREA),"tema próprio antigo sem área fica em Faculdade · sem área");
// manual: disciplina e SP (a SP é um conteúdo, ligada ao tema da residência)
await p.click('#fs-s .fstools button:has-text("+ Disciplina")');await p.fill('#facNewDisc-s','NCS 6');await p.click('#fs-s .fnewdisc button[type=submit]');await p.waitForTimeout(150);
const did=await p.evaluate(()=>fac.discs.find(d=>d.name==="NCS 6").id);
ok(await p.evaluate(did=>discOf(did).div==="sp"&&facAddC===did&&facNew["ckind"+did]==="sp"&&!!document.querySelector('#fck-'+did+'-sp[aria-pressed=true]'),did),"disciplina NCS já nasce com SPs e abre o + SP");
await p.fill('#fq-c'+did,'SP 2.1 Hemostasia e Distúrbios da Coagulação');await p.waitForTimeout(200);
const sug=await p.$$eval(`#fd-${did} .fclink .chip`,x=>x.map(y=>y.textContent));ok(sug.some(t=>/Distúrbios da coagulação/.test(t)),"sugestões de ligação pelo nome da SP: "+sug.join(" | "));
await p.click(`#fd-${did} .fclink .chip:has-text("Distúrbios da coagulação")`);await p.waitForTimeout(100);
await p.click(`#fd-${did} .fcreate button`);await p.waitForTimeout(150);
const sid=await p.evaluate(()=>fac.discs.find(d=>d.name==="NCS 6").sps[0].id);
ok(await p.evaluate(sid=>ownLinks(sid).map(L=>L.k).join()==="CM-37"&&refTopic("O:"+sid).k==="CM-37",sid),"SP criada já ligada a Distúrbios da coagulação");
await p.evaluate(()=>{facAddC=null;render()});
await p.click('#fspadd-'+sid);await p.fill('#fq-sp'+sid,'Cascata da coagulação');await p.waitForTimeout(150);
const cl=await p.textContent(`#sp-${sid} .fcreate`);ok(/CM · Hematologia e oncologia/.test(cl),"criar conteúdo dentro da SP mostra para onde vai: "+cl.replace(/\s+/g," ").slice(0,90));
await p.click(`#sp-${sid} .fcreate button`);await p.waitForTimeout(150);
const own=await p.evaluate(()=>{const it=FAC_ITEMS.find(x=>x.t==="Cascata da coagulação");return it&&{area:it.area.code,sp:it.sp,origin:it.origin}});
ok(own&&own.area==="CM"&&own.sp==="Hematologia e oncologia"&&/NCS 6 · SP 2.1/.test(own.origin),"conteúdo FAC herdou a área do tema ligado à SP: "+JSON.stringify(own));
// objetivos
await p.fill('#fo-'+sid,'- Descrever a cascata da coagulação\n- Diferenciar PTI de PTT');await p.click(`#sp-${sid} .fobjadd button`);await p.waitForTimeout(150);
const cs=await p.evaluate(()=>(get("CM-37").cs||[]).map(c=>c.t+"|"+!!c.fac));ok(cs.length===2&&cs.every(x=>x.endsWith("|true")),"objetivos viraram subtópicos do tema ligado à SP: "+cs.join(", "));
await p.click(`#sp-${sid} .fobj li:has-text("Descrever") label`);await p.waitForTimeout(100);
ok(await p.evaluate(()=>{const c=(get("CM-37").cs||[]).find(x=>/Descrever/.test(x.t));return c&&c.d&&isIng(get("CM-37"))&&!get("CM-37").last}),"marcar objetivo marca o subtópico e põe o tema em Estudando (revisão só ao concluir)");
// Temas
await p.click(`#sp-${sid} .fobj li:has-text("Diferenciar") button:has-text("questões")`);await p.waitForTimeout(500);
ok(await p.evaluate(()=>view==="temas"&&genFocus["CM-37"]==="Diferenciar PTI de PTT"&&openKey==="CM-37"),"'questões' do objetivo abre o tema com o foco das questões nele");
const tm=await p.evaluate(()=>{const r=document.getElementById("t-CM-37");const o=document.querySelector('#areas [id^="t-F-"]');return {badge:r&&r.querySelector(".fbadge")&&r.querySelector(".fbadge").textContent,own:o&&o.closest("details").querySelector(".code").textContent,ownTxt:o&&o.textContent}});
ok(/Faculdade · SP 2.1/.test(tm.badge||""),"tema da residência ligado mostra 'Faculdade · SP 2.1': "+tm.badge);
ok(await p.evaluate(()=>{const it=FAC_ITEMS.find(x=>x.t==="Cascata da coagulação");const li=document.getElementById("t-"+it.key);if(!li){openAreas.add("CM");render()}const li2=document.getElementById("t-"+it.key);return !!li2&&li2.closest("details").querySelector(".code").textContent==="CM"&&/FAC · NCS 6 · SP 2.1/.test(li2.textContent)}),"tema FAC aparece em CM com selo 'FAC · NCS 6 · SP 2.1'");
ok(await p.evaluate(()=>{const h=[...document.querySelectorAll(".sphead")].find(x=>/Hematologia e oncologia/.test(x.textContent));return h&&/\+1 FAC/.test(h.textContent)}),"cabeçalho da especialidade mostra +1 FAC");
ok(await p.evaluate(()=>weighted()===weighted()&&TOTAL===185),"% dominado continua contando só os 185 temas");
// mudar a área do conteúdo da faculdade (dentro dele, em Área na Residência)
await p.click('#tabF');await p.waitForTimeout(100);
const cid=await p.evaluate(()=>{const it=FAC_ITEMS.find(x=>x.t==="Cascata da coagulação");openKey=it.key;render();return it.key.slice(2)});await p.waitForTimeout(100);
await p.selectOption('#fm-a'+cid,'PED|*');await p.waitForTimeout(100);await p.fill('#fmi-a'+cid,'Hematologia básica');await p.press('#fmi-a'+cid,'Tab');await p.waitForTimeout(150);
ok(await p.evaluate(()=>{const it=FAC_ITEMS.find(x=>x.t==="Cascata da coagulação");return it.area.code==="PED"&&it.sp==="Hematologia básica"}),"mudar a área do conteúdo o move na aba Residência (PED · Hematologia básica)");
await p.evaluate(()=>{openKey=null;render()});
await p.evaluate(()=>setView("temas"));ok(await p.evaluate(()=>[...document.querySelectorAll(".sphead .spname")].some(x=>x.textContent==="Hematologia básica")),"especialidade personalizada aparece como grupo em PED");
await p.click('#tabF');await p.waitForTimeout(100);
// prova agrupada por SP
await p.evaluate(did=>{facOpenProv.add('s');facNew.provs={d:did};render()},did);await p.fill('#fpn-s','Avaliação Hemato');await p.fill('#fpd-s',await p.evaluate(()=>fromNum(dnum(today())+20)));await p.click('#fsp-s form.fpform button[type=submit]');await p.waitForTimeout(150);
const pr=await p.evaluate(()=>fac.provas.find(x=>x.name==="Avaliação Hemato"));ok(pr&&pr.items.length===2,"prova nova já inclui os temas das SPs ("+(pr&&pr.items.length)+")");
const gid=await p.evaluate(()=>document.querySelector('.fpgh input').id);await p.click('#'+gid);await p.waitForTimeout(100);
ok(await p.evaluate(()=>fac.provas.find(x=>x.name==="Avaliação Hemato").items.length===0),"desmarcar a SP na prova tira todos os temas dela");
// desligar a SP do tema: os objetivos voltam para a própria SP
await p.evaluate(sid=>{facOpenSP.add(sid);render()},sid);await p.waitForTimeout(100);
await p.click(`#sp-${sid} .flklist button:has-text("desligar")`);await p.click(`#sp-${sid} .flklist button:has-text("Toque de novo")`);await p.waitForTimeout(150);
const after=await p.evaluate(sid=>({res:(get("CM-37").cs||[]).filter(c=>c.fac).length,fac:subList(BYKEY["F-"+sid]).filter(x=>/cascata|PTI/.test(x.t)).length}),sid);
ok(after.res===0&&after.fac===2,"desligar a SP leva os objetivos para ela mesma: "+JSON.stringify(after));
// excluir SP apaga o tema FAC só dela
await p.click(`#sp-${sid} .fspact button:has-text("excluir")`);await p.click(`#sp-${sid} .fspact button:has-text("Toque de novo")`);await p.waitForTimeout(150);
ok(await p.evaluate(sid=>!FAC_ITEMS.some(x=>x.t==="Cascata da coagulação")&&!BYKEY["F-"+sid]&&!fac.own[sid],sid),"excluir a SP apaga ela e o conteúdo da faculdade que só ela usava");
// nomes dos níveis
await p.click('#fs-s button:has-text("Ajustes")');await p.click('#fs-s button:has-text("Nomes dos níveis")');await p.fill('#flv-sp','Problema');await p.fill('#flv-disc','Módulo');await p.click('.flv button[type=submit]');await p.waitForTimeout(100);
ok(await p.evaluate(()=>/\+ Módulo/.test(document.getElementById("facSems").textContent)&&/\+ Problema/.test(document.getElementById("facSems").textContent)),"nomes dos níveis personalizados aparecem nos botões");
// colar ementa
await p.click('#fs-s .fstools button:has-text("Colar ementa")');await p.fill('#fimpText','6º semestre NCS 6 Eixo de Hematologia SP 2.1 ...');await p.click('.fimp button:has-text("Organizar")');await p.waitForTimeout(300);
ok(await p.evaluate(()=>facImport.status==="review"&&/Distúrbios da coagulação/.test(window.__ementaPrompt)&&/Problema/.test(window.__ementaPrompt)),"ementa enviada ao Claude com a lista de temas e os nomes dos níveis");
const rv=await p.textContent('.fimp');ok(/Cascata da coagulação/.test(rv)&&/Descrever|objetivos/.test(rv)&&!/XX-9/.test(rv),"revisão mostra SPs, temas e novos (chave inválida descartada)");
const ej=await p.evaluate(()=>{const s=document.querySelectorAll('.fimp .fmapsel');return [...s].map(x=>x.value)});ok(ej[0]==="CM|Hematologia e oncologia"&&ej[1]==="CM|Cardiologia","área dos eixos na revisão: "+ej.join(" / "));
await p.click('.fimp button:has-text("Salvar no semestre")');await p.waitForTimeout(200);
const r1=await p.evaluate(()=>{const d=fac.discs.filter(x=>x.name==="NCS 6");return {n:d.length,eixos:d[0].eixos,links:d[0].sps.map(s=>ownLinks(s.id).map(L=>L.k).join("+")),sps:d[0].sps.map(s=>s.name+":"+s.items.length+":"+s.objs.length),own:FAC_ITEMS.map(x=>x.t+"@"+x.area.code),info:d[0].info.tipo+"/"+d[0].info.prof}});
ok(r1.n===1&&!r1.eixos&&r1.sps.length===3&&r1.links.join()==="CM-37,CM-34,CM-6","ementa juntou na NCS 6 existente, sem duplicar: "+JSON.stringify(r1));
ok(r1.own.includes("Cascata da coagulação@CM")&&r1.own.includes("Anatomia do coração@CM"),"temas novos criados no lugar certo");
await p.evaluate(e=>{ementaApply(fac.sems[0].id,ementaParse(e))},EMENTA);
const r2=await p.evaluate(()=>({sps:fac.discs.find(x=>x.name==="NCS 6").sps.length,own:FAC_ITEMS.filter(x=>x.t==="Cascata da coagulação").length,objs:fac.discs.find(x=>x.name==="NCS 6").sps.find(s=>/2\.1/.test(s.name)).objs.length}));
ok(r2.sps===3&&r2.own===1&&r2.objs===2,"importar a mesma ementa de novo não duplica nada: "+JSON.stringify(r2));
ok(!errs.length,"sem erros JS "+errs.join("|"));await p.screenshot({path:'fac2.png',fullPage:false});await b.close()})();
