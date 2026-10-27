// t88: nível "Estudando" (item 3) e plano do dia em partes com subtópicos densos (item 4)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
(async()=>{const b=await chromium.launch();const errs=[];
for(const [vw,vh,mob] of [[1366,900,false],[390,844,true]]){const tag=mob?"celular":"computador";
const ctx=await b.newContext({viewport:{width:vw,height:vh},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},5);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&sampleFn,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);
// tema grande (mais de 6 subtópicos) e tema pequeno
const K=await p.evaluate(()=>({big:ALL.find(i=>i.subs.length>=10).key,small:ALL.find(i=>i.subs.length===4).key}));
// 1. primeiro subtópico: Estudando, sem revisões
let st=await p.evaluate(k=>{const it=BYKEY[k];toggleSub(it,subList(it)[0]);const s=get(k);return {lv:lvKey(s),last:s.last||null,ing:s.ing,due:dueIn(s),e:(hist[today()]||{}).e||0,name:lvName(s)}},K.small);
ok(st.lv==="i"&&!st.last&&st.ing&&st.ing.m==="a"&&st.due===null&&st.name==="Estudando",tag+": primeiro subtópico põe em Estudando sem revisão "+JSON.stringify(st));
ok(st.e===0,tag+": ainda não conta como tema estudado");
// 2. todos os subtópicos: conclui (Estudado, revisão amanhã) e desmarcar volta
st=await p.evaluate(k=>{const it=BYKEY[k];subList(it).filter(x=>!x.done).forEach(x=>toggleSub(it,subList(it).find(y=>y.t===x.t)));const s=get(k);return {lv:lvKey(s),last:s.last,ing:!!s.ing,due:dueIn(s),e:(hist[today()]||{}).e||0}},K.small);
ok(st.lv===1&&st.last&&!st.ing&&st.due>=1&&st.e===1,tag+": último subtópico conclui e agenda a revisão "+JSON.stringify(st));
st=await p.evaluate(k=>{const it=BYKEY[k];toggleSub(it,subList(it)[2]);const s=get(k);return {lv:lvKey(s),last:s.last||null,e:(hist[today()]||{}).e||0}},K.small);
ok(st.lv==="i"&&!st.last&&st.e===0,tag+": desmarcar no mesmo dia volta para Estudando "+JSON.stringify(st));
st=await p.evaluate(k=>{const it=BYKEY[k];subList(it).filter(x=>x.done).forEach(x=>toggleSub(it,subList(it).find(y=>y.t===x.t)));const s=get(k);return {lv:lvKey(s),ing:s.ing||null}},K.small);
ok(st.lv===0&&!st.ing,tag+": desmarcar tudo (automático) volta para Não iniciado");
// 3. botões de nível no tema
await p.evaluate(k=>openTopic(k),K.small);await p.waitForTimeout(300);
const btns=await p.$$eval(`#t-${K.small} .detail .seg button[data-lv]`,a=>a.map(x=>x.textContent));ok(btns.join()==="Não iniciado,Estudando,Estudado,Revisado,Dominado",tag+": botões de nível "+btns.join());
await click(`#t-${K.small} .detail button[data-lv="i"]`);await p.waitForTimeout(150);
st=await p.evaluate(k=>({lv:lvKey(get(k)),m:(get(k).ing||{}).m,row:document.querySelector(`#t-${k} .lvl`).textContent,dl:document.querySelector(`#t-${k} .lvl`).dataset.l}),K.small);
ok(st.lv==="i"&&st.m==="m"&&st.row==="Estudando"&&st.dl==="i",tag+": Estudando à mão, com selo na lista "+JSON.stringify(st));
st=await p.evaluate(k=>{const it=BYKEY[k];toggleSub(it,subList(it)[0]);toggleSub(it,subList(it)[0]);return {lv:lvKey(get(k))}},K.small);ok(st.lv==="i",tag+": marcado à mão não sai ao desmarcar os subtópicos");
await click(`#t-${K.small} .detail button[data-lv="1"]`);await p.waitForTimeout(150);
st=await p.evaluate(k=>({lv:lvKey(get(k)),last:get(k).last,ing:!!get(k).ing}),K.small);ok(st.lv===1&&st.last&&!st.ing,tag+": botão Estudado começa as revisões "+JSON.stringify(st));
await click(`#t-${K.small} .detail button[data-lv="i"]`);await p.waitForTimeout(150);ok(await p.evaluate(k=>!get(k).last&&lvKey(get(k))==="i",K.small),tag+": voltar para Estudando tira das revisões");
await click(`#t-${K.small} .detail button[data-lv="0"]`);await p.waitForTimeout(150);ok(await p.evaluate(k=>lvKey(get(k))===0,K.small),tag+": Não iniciado");
// 4. filtro de Situação e gráfico
await p.evaluate(k=>{const it=BYKEY[k];toggleSub(it,subList(it)[0]);setView("temas");render()},K.small);await p.waitForTimeout(200);
await p.evaluate(()=>{tfPanel=true;render()});ok(await p.evaluate(()=>!!document.getElementById("tflI")||[...document.querySelectorAll("button")].some(b=>/^Estudando · 1$/.test(b.textContent.trim()))),tag+": filtro Situação tem Estudando · 1");
ok(await p.evaluate(()=>{tf.lv=new Set(["i"]);render();return ALL.filter(matches).length===1}),tag+": filtrar Estudando mostra só o tema");
await p.evaluate(()=>{tf.lv=new Set();render()});
ok(await p.evaluate(()=>[...document.querySelectorAll("#glegend li")].some(li=>/Estudando/.test(li.textContent)&&/1/.test(li.querySelector("b").textContent))&&!!document.querySelector('#ring circle[stroke="var(--mi)"]')),tag+": legenda e anel com Estudando");
ok(await p.evaluate(()=>/1 em estudo/.test(new TextDecoder("latin1").decode(buildReport({res:true,fac:false,err:false,period:"all",mats:new Set()})))),tag+": PDF cita o tema em estudo");
await p.evaluate(k=>resetStudy(k),K.small);
// 5. plano em partes: tema grande
const pl=await p.evaluate(k=>{const it=BYKEY[k],P=subParts(subList(it)),sizes=P.map(x=>x.length);return {n:P.length,sizes,first:partSubs(it)}},K.big);
ok(pl.n>=2&&pl.sizes.every(x=>x>=3&&x<=4)&&pl.first.pt[0]===1&&pl.first.subs.length===pl.sizes[0],tag+": tema grande em partes de 3 a 4 "+JSON.stringify(pl.sizes));
ok(await p.evaluate(k=>partSubs(BYKEY[k]).pt===null&&partSubs(BYKEY[k]).subs.length===4,K.small),tag+": tema pequeno vem inteiro");
// densos: peso 2
const dn=await p.evaluate(k=>{const it=BYKEY[k];setDn(it,subList(it)[0],"u");setDn(it,subList(it)[1],"u");const P=subParts(subList(it));return {n:P.length,w:P.map(q=>q.reduce((a,x)=>a+subW(x),0))}},K.big);
ok(dn.w.every(w=>w<=4)&&dn.w[0]>=3,tag+": denso conta como dois na parte "+JSON.stringify(dn));
// estudar a parte 1 e ver a parte 2 no dia seguinte, antes dos temas novos
await p.evaluate(k=>{dayPlan=null;const P=ensurePlan();P.items=[{k,cls:"r-new",txt:"",subs:partSubs(BYKEY[k]).subs}];savePlan();const it=BYKEY[k];P.items[0].subs.forEach(t=>toggleSub(it,subList(it).find(y=>y.t===t)))},K.big);
st=await p.evaluate(k=>({lv:lvKey(get(k)),done:itemDone(ensurePlan().items[0])}),K.big);ok(st.lv==="i"&&st.done,tag+": parte 1 concluída, tema segue Estudando");
await p.evaluate(()=>render());await p.waitForTimeout(150);ok(await p.evaluate(()=>/Parte concluída/.test(document.querySelector("#plan .pcard .reason").textContent)),tag+": cartão diz Parte concluída");
const next=await p.evaluate(k=>{dayOff=1;try{dayPlan=null;const P=makeDayPlan();return P.items.map(x=>({k:x.k,cls:x.cls,txt:x.txt,n:x.subs.length}))}finally{dayOff=0;dayPlan=null}},K.big);
ok(next[0].k===K.big&&next[0].cls==="r-cont"&&/^Continuar · Parte 2 de \d+$/.test(next[0].txt),tag+": dia seguinte continua a parte 2 primeiro "+JSON.stringify(next[0]));
ok(next.slice(1).every(x=>x.k!==K.big),tag+": tema em andamento não aparece de novo como novo");
// prévia da semana e projeção
const wk=await p.evaluate(k=>{const W=weekPreview();return W.filter(d=>d.items.some(x=>x.k===k)).map(d=>d.items.find(x=>x.k===k).txt)},K.big);
ok(wk.length>=1&&wk.every(t=>/Continuar/.test(t)),tag+": prévia da semana segue as partes "+JSON.stringify(wk));
ok(await p.evaluate(()=>partsAvg()>1.3),tag+": projeção conta temas grandes como várias vagas");
// 6. Claude sugere densos; a escolha do usuário vence
let calls=[];await p.exposeFunction('__dn'+(mob?1:0),t=>calls.push(t));
await p.evaluate(([k,f])=>{sampleFn.json=async inp=>{window[f](inp);const m={};(inp.match(/^[A-Z]+-\d+(?= · )/gm)||[]).forEach(x=>m[x]=[1,2,3]);return {densos:m}}},[K.big,'__dn'+(mob?1:0)]);
await p.evaluate(k=>{const it=BYKEY[k];setDn(it,subList(it)[1],"n");dnEdit=null;openTopic(k)},K.big);await p.waitForTimeout(300);
await click(`#dnAsk-${K.big}`);await p.waitForTimeout(400);
st=await p.evaluate(k=>subList(BYKEY[k]).slice(0,4).map(x=>x.dn),K.big);ok(st[0]==="u"&&st[1]==="n"&&st[2]==="c"&&st[3]!=="c",tag+": sugestão não troca a sua escolha "+JSON.stringify(st));
ok(calls.length===1&&/DENSOS/.test(calls[0])&&calls[0].includes(K.big),tag+": pedido ao Claude com o tema");
ok(await p.evaluate(k=>!!document.querySelector(`#t-${k} .dnb[data-dn="c"]`)&&/Claude/.test(document.querySelector(`#t-${k} .dnb[data-dn="c"]`).textContent),K.big),tag+": selo tracejado do Claude");
await click(`#dnOk-${K.big}`);await p.waitForTimeout(150);ok(await p.evaluate(k=>subList(BYKEY[k])[2].dn==="u",K.big),tag+": confirmar sugestões");
await p.evaluate(k=>{const it=BYKEY[k];setDn(it,subList(it)[2],"n")},K.big);ok(await p.evaluate(k=>subList(BYKEY[k])[2].dn==="n",K.big),tag+": tocar no selo tira");
// modo marcar
await click(`#dnEd-${K.big}`);await p.waitForTimeout(150);const nb=await p.$$eval(`#t-${K.big} .dnb`,a=>a.length);ok(nb===await p.evaluate(k=>subList(BYKEY[k]).length,K.big),tag+": modo marcar mostra todos os subtópicos");
await p.screenshot({path:`t88-${mob?"fone":"desk"}-tema.png`,fullPage:false});
// lote em Configurações
ok(await p.evaluate(()=>dnPending().length===0&&ALL.every(i=>i.own||DN_DEF[i.key])),tag+": os 198 temas já vêm revisados pelo Claude");
ok(await p.evaluate(()=>{const it=BYKEY["CM-47"];return subList(it).filter(dnHeavy).length===5&&subParts(subList(it)).length===3}),tag+": Endemias vem em 3 partes");
await p.evaluate(()=>{goSub("config")});await p.waitForTimeout(300);ok(!(await p.$('#dnAll'))&&/todos já sugeridos/.test(await p.$eval('#dnAllBox',x=>x.textContent)),tag+": sem pendentes, sem botão de lote");
calls=[];await p.evaluate(()=>{Object.keys(DN_DEF).slice(0,60).forEach(k=>delete DN_DEF[k]);goSub("config")});await p.waitForTimeout(300);
const pend=await p.evaluate(()=>dnPending().length);await p.evaluate(()=>document.querySelectorAll('details.cfmore').forEach(d=>d.open=true));await p.waitForTimeout(100);await click('#dnAll');await p.waitForFunction(()=>dnAsk.all&&dnAsk.all.st!=="loading",null,{timeout:20000});
ok(calls.length===Math.ceil(pend/45)&&await p.evaluate(()=>dnPending().length===0),tag+`: lote em ${calls.length} partes (${pend} temas)`);
ok(/Pronto/.test(await p.$eval('#dnAllMsg',x=>x.textContent)),tag+": mensagem do lote");
// plano visível: cartão com Parte
await p.evaluate(()=>{dayPlan=null;setView("inicio")});await p.waitForTimeout(300);
ok(await p.evaluate(()=>[...document.querySelectorAll("#plan .reason")].some(x=>/Parte \d+ de \d+/.test(x.textContent))),tag+": Estudar hoje mostra a parte");
await p.screenshot({path:`t88-${mob?"fone":"desk"}-plano.png`,fullPage:false});
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),tag+": sem rolagem lateral");
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
