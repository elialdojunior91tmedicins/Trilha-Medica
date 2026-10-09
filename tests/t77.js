// t77: prova conjunta (várias disciplinas), D3 sem o conteúdo da D2, "Cai na prova" na SP e no + Conteúdo, nome do nível com número
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('file://'+__dirname+'/preview.html');
 await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&trashStore,null,{polling:100});await p.waitForTimeout(150);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(120)};
 const noScroll=async lab=>ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral ("+lab+")");
 await p.evaluate(()=>{fac={sems:[{id:"s",name:"6",archived:false}],discs:[
   {id:"d1",semId:"s",name:"NCS 6 - Tutoria",items:[],info:{},links:[],eixos:[],sps:[{id:"sp21",name:"SP 2.1 - Hemostasia",eixoId:null,items:["T:CM-1"],objs:[]},{id:"sp22",name:"SP 2.2 - Anemias carenciais",eixoId:null,items:["T:CM-4"],objs:[]},{id:"sp31",name:"SP 3.1 - Diabetes",eixoId:null,items:[],objs:[]}]},
   {id:"d2",semId:"s",name:"NCS 6 - Morfofuncional",items:["T:CM-9"],info:{},links:[],eixos:[],sps:[]},
   {id:"d3",semId:"s",name:"HMEC 6",items:[],info:{},links:[],eixos:[],sps:[]}],provas:[],own:{}};registerOwn();saveFac();
   backStack=[];facOpenSem.add("s");facOpenProv.add("s");setView("fac")});await p.waitForTimeout(150);
 /* 1. prova conjunta pelo formulário */
 await p.fill('#fpn-s','D2 NCS 6');await p.fill('#fpd-s',await p.evaluate(()=>fromNum(dnum(today())+13)));await p.dispatchEvent('#fpd-s','input');
 await click('#fpdisc-s-d2');
 ok(await p.evaluate(()=>facNew.provs.ds.join()==="d1,d2"),name+": escolhe duas disciplinas na prova nova");
 await click('#fsp-s form.fpform button[type=submit]');
 const D2=await p.evaluate(()=>{const x=fac.provas.find(y=>y.name==="D2 NCS 6");return x&&{id:x.id,ids:provaDids(x),items:[...x.items].sort(),sps:x.sps}});
 ok(D2&&D2.ids.join()==="d1,d2"&&D2.items.join()==="T:CM-1,T:CM-4,T:CM-9"&&D2.sps.join()==="sp21,sp22",name+": prova conjunta com o conteúdo das duas "+JSON.stringify(D2));
 ok(await p.evaluate(id=>document.querySelectorAll(`#fp-${id} .fpdh2`).length===2&&/NCS 6 - Tutoria \+ NCS 6 - Morfofuncional/.test(document.querySelector(`#fp-${id} .fphl span`).textContent),D2.id),name+": card mostra as duas disciplinas");
 await noScroll("prova conjunta");if(name==="fone")await p.screenshot({path:`t77-conj-${name}.png`,fullPage:false});
 /* 2. D3 só da Tutoria: começa sem o que já está na D2 e esconde a SP 2.x */
 await p.evaluate(()=>{facNew.provs={d:"d1"};render()});await p.waitForTimeout(80);
 await p.fill('#fpn-s','D3 NCS 6');await p.fill('#fpd-s',await p.evaluate(()=>fromNum(dnum(today())+55)));await p.dispatchEvent('#fpd-s','input');
 await click('#fsp-s form.fpform button[type=submit]');
 const D3=await p.evaluate(()=>fac.provas.find(y=>y.name==="D3 NCS 6").id);
 ok(await p.evaluate(id=>{const x=fac.provas.find(y=>y.id===id);return provaDids(x).join()==="d1"&&!x.items.length&&!x.sps},D3),name+": D3 começa sem o conteúdo da D2");
 const lab=()=>p.evaluate(id=>[...document.querySelectorAll(`#fp-${id} .fpgh label`)].map(l=>l.textContent).join("|"),D3);
 ok(!/SP 2\.1|SP 2\.2/.test(await lab())&&/SP 3\.1/.test(await lab()),name+": D3 não mostra as SPs da D2 ("+await lab()+")");
 ok(await p.evaluate(id=>/\(2\)/.test(document.querySelector('#fpall-'+id).textContent),D3),name+": link para mostrar o que está em outras provas (2)");
 await click('#fpall-'+D3);ok(/SP 2\.1.*também em D2 NCS 6/.test(await lab()),name+": mostra com o aviso 'também em D2'");
 await click('#fpall-'+D3);ok(!/SP 2\.1/.test(await lab()),name+": esconde de novo");
 /* 3. SP › Cai na prova; o que entra depois na SP vai para a prova */
 await p.evaluate(()=>{facOpenDisc.add("d1");facOpenSP.add("sp31");render()});await p.waitForTimeout(100);
 ok(await p.evaluate(()=>!!document.querySelector('#sp-sp31 .fsppv')&&document.querySelectorAll('#sp-sp31 .fsppv .chip').length===2),name+": SP mostra 'Cai na prova' com as duas provas");
 await click(`#spv-sp31-${D3}`);
 ok(await p.evaluate(id=>fac.provas.find(y=>y.id===id).sps.join()==="sp31",D3),name+": SP ligada à D3");
 await p.evaluate(()=>{const d=discOf("d1");spAdd(d,d.sps[2],"T:CM-6")});await p.waitForTimeout(100);
 ok(await p.evaluate(([a,b])=>fac.provas.find(y=>y.id===b).items.includes("T:CM-6")&&!fac.provas.find(y=>y.id===a).items.includes("T:CM-6"),[D2.id,D3]),name+": conteúdo novo da SP entra só na D3");
 ok(await p.evaluate(id=>document.querySelector(`#spv-sp31-${id}`).getAttribute("aria-pressed")==="true",D3),name+": chip da D3 marcado");
 await noScroll("SP");if(name==="fone"||name==="note")await p.screenshot({path:`t77-sp-${name}.png`});
 /* desmarcar um tema de uma SP ligada desliga a SP, mas mantém o resto */
 await p.evaluate(()=>{const d=discOf("d1");spAdd(d,d.sps[2],"T:CM-7")});await p.waitForTimeout(80);
 const cb=await p.evaluate(id=>{const li=[...document.querySelectorAll(`#fp-${id} .psubs li`)].find(l=>/^\S/.test(l.textContent)&&l.querySelector("input").checked);return li&&li.querySelector("input").id},D3);
 await click('#'+cb);
 ok(await p.evaluate(id=>{const x=fac.provas.find(y=>y.id===id);return !x.sps&&x.items.length===1},D3),name+": desmarcar um tema tira só ele (a SP deixa de puxar conteúdo novo)");
 /* 4. + Conteúdo direto: escolhe a prova (padrão = a próxima) */
 await p.evaluate(()=>{facOpenDisc.add("d2");facAddC="d2";render()});await p.waitForTimeout(100);
 ok(await p.evaluate(id=>{const s=document.querySelector('#fcpv-d2');return s&&s.value===id},D2.id),name+": + Conteúdo mostra 'Cai na prova' com a próxima prova");
 await p.evaluate(()=>{facQuery.cd2="Hipotireoidismo";render()});await p.waitForTimeout(100);
 await p.evaluate(()=>{const b=document.querySelector('#fd-d2 .fadder .fres li:not(.fcreate) button:not(:disabled)')||document.querySelector('#fd-d2 .fadder .fcreate button');b.click()});await p.waitForTimeout(120);
 ok(await p.evaluate(id=>{const x=fac.provas.find(y=>y.id===id),d=discOf("d2");return d.items.length===2&&x.items.includes(d.items[1])},D2.id),name+": conteúdo adicionado entra na prova escolhida");
 await noScroll("+ Conteúdo");
 /* 5. tirar e pôr disciplina na prova */
 await p.evaluate(()=>{facAddC=null;render()});await click(`#fpdd-${D2.id}-d2`);
 ok(await p.evaluate(id=>{const x=fac.provas.find(y=>y.id===id);return provaDids(x).join()==="d1"&&!x.discIds&&!x.items.some(r=>discRefs(discOf("d2")).includes(r))},D2.id),name+": tirar a Morfofuncional da prova tira o conteúdo dela");
 ok(await p.evaluate(id=>document.querySelector(`#fpdd-${id}-d1`).disabled,D2.id),name+": não deixa a prova sem disciplina");
 await click(`#fpdd-${D2.id}-d2`);
 ok(await p.evaluate(id=>{const x=fac.provas.find(y=>y.id===id);return provaDids(x).join()==="d1,d2"&&discRefs(discOf("d2")).every(r=>x.items.includes(r))},D2.id),name+": pôr de volta traz o conteúdo dela");
 /* 6. excluir a Tutoria: a D3 (só dela) vai para a lixeira; a D2 conjunta fica com a Morfofuncional */
 await p.evaluate(()=>{trash=[];const d=discOf("d1");const shared=fac.provas.filter(p=>provaHas(p,"d1")&&provaDids(p).filter(discOf).length>1);
   facEditDisc.add("d1");render();const btn=()=>[...document.querySelectorAll('#fd-d1 button')].find(x=>/^Excluir disciplina|^Toque de novo: apaga/.test(x.textContent));btn().click();btn().click()});await p.waitForTimeout(150);
 ok(await p.evaluate(([a,b])=>!discOf("d1")&&!fac.provas.some(y=>y.id===b)&&provaDids(fac.provas.find(y=>y.id===a)).join()==="d2"&&!fac.provas.find(y=>y.id===a).items.includes("T:CM-1"),[D2.id,D3]),name+": excluir disciplina mantém a prova conjunta com a outra");
 await p.evaluate(()=>trRestore(trash[0].id));await p.waitForTimeout(100);
 ok(await p.evaluate(([a,b])=>{const x=fac.provas.find(y=>y.id===a);return !!discOf("d1")&&fac.provas.some(y=>y.id===b)&&provaDids(x).join()==="d1,d2"&&x.items.includes("T:CM-1")&&(x.sps||[]).includes("sp21")},[D2.id,D3]),name+": desfazer devolve a disciplina às duas provas");
 /* 7. nome do nível com número */
 await p.evaluate(()=>{fac.sems[0].lv={sp:"SP 2.1 - Hemostasia"};saveFac();render()});await p.waitForTimeout(80);
 ok(await p.evaluate(()=>!!document.querySelector('#flvfix-s')),name+": avisa que o nome do nível ficou com número");
 await click('#flvfix-s');ok(await p.evaluate(()=>!fac.sems[0].lv&&!document.querySelector('#flvfix-s')),name+": volta aos nomes padrão");
 await p.evaluate(()=>{facSemAdj="s";openEdit("lv:s");render()});await p.waitForTimeout(80);
 await p.fill('#flv-sp','SP 2.1');await p.evaluate(()=>document.querySelector('.flv button[type=submit]').click());await p.waitForTimeout(80);
 ok(await p.evaluate(()=>!fac.sems[0].lv&&!document.querySelector('.flv .err').hidden),name+": não aceita número no nome do nível");
 /* dados válidos para a conta: sem undefined, sem arrays dentro de arrays */
 ok(await p.evaluate(()=>{const bad=v=>v===undefined||(Array.isArray(v)&&v.some(x=>Array.isArray(x)||bad(x)))||(v&&typeof v==="object"&&!Array.isArray(v)&&Object.values(v).some(bad));return !bad(JSON.parse(JSON.stringify(fac)))&&!fac.provas.some(x=>Object.values(x).some(v=>v===undefined))}),name+": dados da Faculdade válidos para a conta");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
