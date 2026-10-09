const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
const only=process.argv[2];
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,[w,h,mob]] of Object.entries(DEV)){if(only&&!only.split(",").includes(name))continue;const ipad=name==="ipad578"||name.startsWith("tab");
const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const txt=s=>p.$eval(s,x=>x.textContent);
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
 fac={sems:[{id:"s",name:"6° Semestre",archived:false}],discs:[{id:"d",semId:"s",name:"NCS 6",items:[],info:{},
 eixos:[{id:"e1",name:"Eixo de Hematologia",area:"CM",spec:"Hematologia e oncologia"}],
 sps:[{id:"sp1",name:"SP 2.1 Hemostasia",eixoId:"e1",items:["T:CM-37","O:c"],objs:["Descrever a cascata"],fech:D(3)},{id:"sp2",name:"SP 2.2 Anemias",eixoId:"e1",items:["T:CM-34"],objs:[]}]}],
 provas:[],own:{c:{t:"Cascata da coagulação",discId:"d",spId:"sp1"}}};state["CM-37"]={l:1,last:D(-3),step:1};saveFac();fac.discs[0].sps.forEach(syncObjs);
 facOpenSem.add("s");facOpenDisc.add("d");facOpenSP.add("sp2");redoPlan();setView("fac")});await p.waitForTimeout(250);
ok(/fecha em 3 dias/.test(await txt('#sp-sp1 .meta')),name+": selo fecha em 3 dias na SP");
const pan=await txt('#facProvas');ok(/Fechamentos de SP/.test(pan)&&/SP 2.1 Hemostasia/.test(pan)&&/1 de 3 prontos \(0 de 1 objetivos\)/.test(pan),name+": fechamento no painel "+(pan.match(/\d de \d prontos[^.]*/)||[""])[0]);
const plan=await p.evaluate(()=>ensurePlan().items.filter(x=>x.cls==="r-fac").map(x=>x.txt+"|"+(x.subs||[]).join(",")));
ok(plan.length===1&&/Fechamento SP 2\.1 · em 3 dias/.test(plan[0]),name+": 1 vaga no plano do dia "+JSON.stringify(plan));
// data pela SP
await p.fill('#fech-sp2',await p.evaluate(()=>fromNum(dnum(today())+2)));await p.dispatchEvent('#fech-sp2','change');await p.waitForTimeout(150);
ok(await p.evaluate(()=>fac.discs[0].sps[1].fech===fromNum(dnum(today())+2)),name+": data salva pela SP");
const plan2=await p.evaluate(()=>ensurePlan().items.filter(x=>x.cls==="r-fac").map(x=>x.txt));ok(plan2.length===2&&plan2.some(t=>/SP 2\.2/.test(t)),name+": plano refeito com a nova SP "+JSON.stringify(plan2));
// estudar o próximo
await p.evaluate(()=>{const b=[...document.querySelectorAll('#fpsp-sp1 .btn')].find(x=>/Estudar/.test(x.textContent));b.click()});await p.waitForTimeout(300);
const st=await p.evaluate(()=>({run:!!foRun,open:openKey,li:!!document.querySelector('#viewFac li.t.open')}));ok(st.run&&st.li&&["CM-37","F-c"].includes(st.open),name+": estudar o próximo da SP "+JSON.stringify(st));
await p.evaluate(()=>{foRun=null;try{localStorage.removeItem("resid-focus-run")}catch(e){}render()});
// objetivo pronto: marcar o subtópico conta
await p.evaluate(()=>{const it=BYKEY["CM-37"];const L=subList(it);const o=L.find(x=>x.t==="Descrever a cascata");if(o){upd("CM-37",s=>{s.sd=[...(s.sd||[]),L.indexOf(o)]})}render()});
// antecedência escolhida
await p.evaluate(()=>{fac.discs[0].sps[1].fech=fromNum(dnum(today())+5);saveFac();facOpenSP.add("sp2");redoPlan()});await p.waitForTimeout(100);
ok(/7 dias antes \(sugerido\)/.test(await p.$eval('#flead-sp2',x=>x.options[x.selectedIndex].textContent)),name+": sugestão de 7 dias");
ok(await p.evaluate(()=>ensurePlan().items.some(x=>/SP 2\.2/.test(x.txt||""))),name+": com 7 dias, SP que fecha em 5 entra no plano");
await p.selectOption('#flead-sp2','3');await p.waitForTimeout(150);
ok(await p.evaluate(()=>fac.discs[0].sps[1].lead===3&&!ensurePlan().items.some(x=>/SP 2\.2/.test(x.txt||""))),name+": com 3 dias, sai do plano");
await p.selectOption('#flead-sp2','7');await p.waitForTimeout(100);ok(await p.evaluate(()=>fac.discs[0].sps[1].lead===undefined),name+": voltar a 7 limpa a escolha");
// tirar a data
await p.evaluate(()=>{facOpenSP.add("sp1");render()});await p.evaluate(()=>{[...document.querySelectorAll('#sp-sp1 .fspfd .link')].find(x=>/tirar/.test(x.textContent)).click()});await p.waitForTimeout(150);
ok(await p.evaluate(()=>!fac.discs[0].sps[0].fech),name+": tirar a data");ok(!/SP 2\.1/.test(await txt('#facProvas')),name+": sai do painel");
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
if(name==="fone"||name==="note")await p.screenshot({path:`fech-${name}.png`,fullPage:false});
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
