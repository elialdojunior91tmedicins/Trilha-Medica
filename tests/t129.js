// t129: Lote 18 › Caderno (seção 7) — modelos de página (Doença, Resumo de SP), cabeçalho com selos, seções vazias somem na leitura, Pegadinhas em destaque,
// + Seção livre, cartão do trecho (seção ou texto selecionado, com "Melhorar com o Claude") e a leitura da véspera da prova
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  const tap=async sel=>{await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:"center"}),sel);await (mob?p.tap(sel):p.click(sel));await p.waitForTimeout(200)};
  await p.evaluate(()=>{const t=dnum(today());fac={sems:[{id:"s",name:"6º",archived:false}],discs:[{id:"d",semId:"s",name:"NCS",items:[],div:"sp",sps:[{id:"sp1",name:"SP 2.1 – Hipertensão",items:["T:CM-1"],objs:["Definir HAS e seus estágios","Tratar a HAS no adulto"]}]}],
      provas:[{id:"p",discId:"d",name:"P2 NCS",date:fromNum(t+3),items:["T:CM-1"],done:[]}],own:{}};saveFac();upd("CM-1",x=>{x.last=fromNum(t-5);x.step=0;x.l=1});commit();
    detTab["CM-1"]="notas";openTopic("CM-1");render()});await p.waitForTimeout(250);
  /* 1. página vazia: começar com um modelo */
  let r=await p.evaluate(()=>({d:!!document.getElementById("nm-doenca-CM-1"),sp:!!document.getElementById("nm-sp-CM-1")}));
  ok(r.d&&r.sp,name+": página vazia oferece Modelo Doença e Modelo Resumo de SP (tema ligado a uma SP)");
  await tap('#nm-doenca-CM-1');
  r=await p.evaluate(()=>({t:notes["CM-1"],nm:get("CM-1").nm,mode:noteMode["CM-1"]}));
  ok(/^## Definição e causa[\s\S]*## Quadro clínico[\s\S]*## Diagnóstico[\s\S]*## Tratamento[\s\S]*## Diferenciais[\s\S]*## Pegadinhas/.test(r.t)&&r.nm==="doenca"&&r.mode==="editar",name+": Modelo Doença põe as seções prontas e abre o editor");
  /* 2. leitura: só as seções preenchidas, Pegadinhas em destaque, cabeçalho com selos */
  r=await p.evaluate(()=>{replaceNote("CM-1",notes["CM-1"].replace("## Definição e causa\n","## Definição e causa\nPA ≥ **140/90** em duas ocasiões.\n").replace("## Pegadinhas\n> ","## Pegadinhas\n> Medir nos dois braços."));noteMode["CM-1"]="ler";render();
    const v=document.querySelector('#t-CM-1 .mdview[data-nk="CM-1"]'),S=[...v.querySelectorAll("details.mdsec")].map(d=>d.querySelector("summary").textContent+(d.classList.contains("peg")?"*":""));const P=document.querySelector('#t-CM-1 .npath');
    return {S,crumb:P&&P.querySelector(".ncrumb").textContent,sel:P&&[...P.querySelectorAll(".nsel")].map(x=>x.textContent),btn:v.querySelectorAll(".ntrecho").length}});
  ok(r.S.join()==="Definição e causa,Pegadinhas*",name+": na leitura só aparecem as seções preenchidas; Pegadinhas em destaque ("+r.S.join()+")");
  ok(/^Caderno › Cardiologia › /.test(r.crumb)&&r.sel.some(x=>/^RES · peso \d$/.test(x))&&r.sel.includes("FAC · SP 2.1")&&r.sel.includes("Modelo Doença"),name+": cabeçalho com o caminho e os selos ("+r.sel.join(" · ")+")");
  ok(r.btn===2,name+": cada seção tem + Criar cartão do trecho");
  /* 3. cartão a partir da seção (lacuna no termo em negrito) e Melhorar com o Claude */
  await p.evaluate(()=>document.querySelector('#t-CM-1 .mdview .ntrecho').click());await p.waitForTimeout(200);
  r=await p.evaluate(()=>{const c=document.querySelector('.cderr[data-eid="tr-CM-1"]');return c&&{h:c.querySelector(".dhead b").textContent,q:c.querySelector(".osq").innerHTML,a:c.querySelector(".osa").innerHTML}});
  ok(r&&r.h==="Cartões deste trecho"&&/\[\.\.\.\]/.test(r.q)&&/<b>140\/90<\/b>/.test(r.a),name+": seção vira cartão com lacuna no termo em negrito "+JSON.stringify(r&&r.q));
  r=await p.evaluate(async()=>{window.__P="";sampleFn.json=async(i)=>{window.__P=i;return [{tipo:"lacuna",question:"<b>Hipertensão arterial.</b> Diagnóstico: PA ≥ [...] em duas ocasiões.",answer:"<b>140/90 mmHg</b>",reference:""}]};
    await cdErrClaude(trE["CM-1"]);const c=document.querySelector('.cderr[data-eid="tr-CM-1"]');return {p:/TRECHO da anotação/.test(window.__P),q:c.querySelector(".osq").innerHTML}});
  ok(r.p&&/140\/90 mmHg|\[\.\.\.\]/.test(r.q),name+": Melhorar com o Claude usa o pedido próprio do trecho");
  const n0=await p.evaluate(()=>cards.length);await tap('#cdSave-tr-CM-1');
  r=await p.evaluate(n0=>({n:cards.length-n0,k:cards[cards.length-1].k,msg:(document.querySelector('#t-CM-1 .notes .pnote')||{}).textContent}),n0);
  ok(r.n===1&&r.k==="CM-1"&&/cartão guardado/.test(r.msg||""),name+": guardar cria o cartão no tema");
  /* 4. texto selecionado vira cartão */
  r=await p.evaluate(async()=>{const v=document.querySelector('#t-CM-1 .mdview[data-nk="CM-1"] .mdsb p')||document.querySelector('#t-CM-1 .mdview[data-nk="CM-1"] .mdsb');const rg=document.createRange();rg.selectNodeContents(v);const sl=getSelection();sl.removeAllRanges();sl.addRange(rg);
    await new Promise(r=>setTimeout(r,120));const b=document.getElementById("trSelBtn");return !!b});
  ok(r,name+": selecionar um trecho mostra + Criar cartão com o trecho selecionado");
  await p.evaluate(()=>document.getElementById("trSelBtn").click());await p.waitForTimeout(150);
  ok(await p.evaluate(()=>!!document.querySelector('.cderr[data-eid="tr-CM-1"]')&&/140\/90/.test(trE["CM-1"].trecho)),name+": o trecho selecionado vira rascunho de cartão");
  await p.evaluate(()=>{delete cdErr["tr-CM-1"];delete trE["CM-1"];getSelection().removeAllRanges();render()});
  /* 5. + Seção livre */
  await tap('#nsec-CM-1');r=await p.evaluate(()=>({end:/## Nova seção\n?$/.test(notes["CM-1"]),mode:noteMode["CM-1"]}));
  ok(r.end&&r.mode==="editar",name+": + Seção livre acrescenta uma seção e abre o editor");
  /* 6. modelo Resumo de SP */
  r=await p.evaluate(()=>{notes["CM-2"]="";fac.discs[0].sps[0].items.push("T:CM-2");saveFac();detTab["CM-2"]="notas";openTopic("CM-2");render();const b=document.getElementById("nm-sp-CM-2");if(b)b.click();return {t:notes["CM-2"]||"",nm:get("CM-2").nm}});
  ok(/^## Definir HAS e seus estágios[\s\S]*## Tratar a HAS no adulto[\s\S]*## Pegadinhas/.test(r.t)&&r.nm==="sp",name+": Modelo Resumo de SP usa os objetivos da SP como seções");
  /* 7. leitura da véspera */
  r=await p.evaluate(()=>{setView("inicio");render();const li=document.getElementById("pf-rd-p");return li&&li.textContent});
  ok(/^Revisar para a prova P2 NCS \(em 3 dias\): leia as 1 página/.test(r||""),name+": semana da prova: Revisar para a prova oferece a leitura das anotações ("+r+")");
  await p.evaluate(()=>[...document.querySelectorAll('#pf-rd-p button')][0].click());await p.waitForTimeout(250);
  r=await p.evaluate(()=>{const c=document.getElementById("nProvaRead");return c&&{v:view,h:c.querySelector("h2").textContent,pages:c.querySelectorAll(".nprp").length,peg:!!c.querySelector("details.mdsec.peg")}});
  ok(r&&r.v==="notas"&&r.h==="Leitura da prova · P2 NCS"&&r.pages===1&&r.peg,name+": a leitura junta as páginas da prova no Caderno");
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
  await ctx.close()}
ok(errs.length===0,"sem erros de JavaScript"+(errs.length?": "+errs.slice(0,3).join(" | "):""));
await b.close()})();
