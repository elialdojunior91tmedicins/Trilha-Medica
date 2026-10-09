const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('file://'+__dirname+'/preview.html');
 await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&downloadsFn&&trashStore,null,{polling:100});await p.waitForTimeout(150);
 const click=s=>mob?p.tap(s):p.click(s);
 /* erro: apagar, aviso com Desfazer */
 await p.evaluate(()=>{const e=eNew("CM-1","Achei que era A","É B","conhecimento","ENARE");setView("erros");window.__eid=e.id;render()});await p.waitForTimeout(100);
 await p.evaluate(()=>delErr(window.__eid));await p.waitForTimeout(150);
 ok(await p.evaluate(()=>!errors.some(e=>e.id===window.__eid)&&trash.length===1&&trash[0].kind==="err"),name+": erro vai para a lixeira");
 ok(await p.evaluate(()=>{const t=document.querySelector('#trToast');if(!t)return false;const r=t.getBoundingClientRect();return r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth}),name+": aviso com Desfazer aparece na tela");
 ok(await p.evaluate(()=>Object.keys(window.__store).some(k=>/progress\/trash\//.test(k))),name+": lixeira gravada na conta");
 await click('#trToast .link');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>errors.some(e=>e.id===window.__eid)&&!trash.length&&!document.querySelector('#trToast')),name+": Desfazer devolve o erro");
 /* cartão, caderno livre e anotação; devolver pela página Configurações */
 await p.evaluate(()=>{const c=cdAdd("CM-4","Qual a dose?","1 mg/kg","eu");window.__cid=c.id;cdDel(c.id);
   const f={id:"fr1",t:"Resumo de choque",b:"Choque séptico: lactato > 2",tags:["uti"],ks:["CM-1"],at:new Date().toISOString()};freeN.push(f);frPut(f);frDel("fr1");
   saveNote("CM-6","## Hiponatremia\n- corrigir devagar, no máximo 8-10 mEq/L em 24 h");saveNote("CM-6","");saveNote("CM-6","nova linha");});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>trash.length===3&&["card","free","note"].every(k=>trash.some(x=>x.kind===k))),name+": cartão, caderno livre e anotação na lixeira");
 await p.evaluate(()=>{hideToast();goSub("config")});await p.waitForTimeout(150);
 await p.evaluate(()=>document.querySelector('#trashCard').scrollIntoView({block:"center"}));
 ok(await p.evaluate(()=>document.querySelectorAll('#trashCard .trlist li').length===3),name+": Configurações lista a lixeira");
 await p.screenshot({path:`trash-${name}.png`});
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 for(const k of ["card","free","note"]){const id=await p.evaluate(k=>trash.find(x=>x.kind===k).id,k);await p.evaluate(id=>document.getElementById('trR-'+id).scrollIntoView({block:"center"}),id);await click('#trR-'+id);await p.waitForTimeout(120)}
 ok(await p.evaluate(()=>cards.some(c=>c.id===window.__cid)&&freeN.some(f=>f.id==="fr1")&&/nova linha\n\n---\n\n## Hiponatremia/.test(notes["CM-6"])&&!trash.length),name+": restaura cartão, caderno livre e anotação (sem perder o texto novo)");
 /* disciplina com prova e SP */
 await p.evaluate(()=>{fac={sems:[{id:"s",name:"6",archived:false}],discs:[{id:"d1",semId:"s",name:"NCS 6",items:["T:CM-1"],info:{},links:[],eixos:[{id:"e1",name:"Cardio",area:"CM",spec:"Cardiologia"}],sps:[{id:"sp1",name:"SP 1",eixoId:"e1",items:["T:CM-4"],objs:["Diagnosticar IC"]},{id:"sp2",name:"SP 2",eixoId:"e1",items:["T:CM-9"],objs:[]}]}],provas:[{id:"p1",discId:"d1",name:"Prova 1",date:fromNum(dnum(today())+20),items:["T:CM-1","T:CM-4"]}],own:{}};registerOwn();saveFac();
   syncObjs(fac.discs[0].sps[0]);delSP(fac.discs[0],fac.discs[0].sps[1])});await p.waitForTimeout(100);
 ok(await p.evaluate(()=>fac.discs[0].sps.length===1&&trash.length===1&&trash[0].kind==="sp"),name+": SP vai para a lixeira");
 await p.evaluate(()=>trRestore(trash[0].id));ok(await p.evaluate(()=>fac.discs[0].sps.some(s=>s.id==="sp2")&&fac.discs[0].sps.find(s=>s.id==="sp2").eixoId==="e1"),name+": SP volta para o eixo");
 await p.evaluate(()=>{backStack=[];facOpenSem.add("s");facOpenDisc.add("d1");facEditDisc.add("d1");setView("fac")});await p.waitForTimeout(150);
 const del=async()=>p.evaluate(()=>{const b=[...document.querySelectorAll('#viewFac button')].find(x=>/^Excluir disciplina|^Toque de novo: apaga a disciplina/.test(x.textContent));if(b){b.click();return true}return false});
 ok(await del(),name+": botão excluir disciplina");await p.waitForTimeout(100);await del();await p.waitForTimeout(150);
 ok(await p.evaluate(()=>!fac.discs.length&&!fac.provas.length&&trash.length===1&&trash[0].kind==="disc"),name+": disciplina e prova vão juntas para a lixeira (um item só)");
 await p.evaluate(()=>trRestore(trash[0].id));await p.waitForTimeout(100);
 ok(await p.evaluate(()=>fac.discs.length===1&&fac.discs[0].sps.length===2&&fac.provas.length===1&&fac.provas[0].items.length===2&&(state["CM-4"]&&(state["CM-4"].cs||[]).some(c=>c.fac==="sp1"))),name+": disciplina volta com SPs, prova e objetivos");
 /* 30 dias e esvaziar */
 await p.evaluate(()=>{delErr(errors[0].id);trash[0].at=new Date(Date.now()-31*864e5).toISOString();trSaveLocal();goSub("config")});await p.waitForTimeout(100);
 ok(await p.evaluate(()=>!trash.length),name+": some depois de 30 dias");
 await p.evaluate(()=>{cdDel(cards[0].id);hideToast();render()});await p.waitForTimeout(80);await p.evaluate(()=>document.querySelector('#trEmpty').click());await p.waitForTimeout(60);await p.evaluate(()=>document.querySelector('#trEmpty').click());await p.waitForTimeout(80);
 ok(await p.evaluate(()=>!trash.length),name+": esvaziar com dois toques");
 /* intervalos pelo acerto */
 const iv=await p.evaluate(()=>{const T=today(),f=(qt,qc,step)=>interval({l:1,last:T,step,qt,qc,qd:{[T]:[qt,qc]}});const r={hi:f(20,18,2),mid:f(20,16,2),lo:f(20,8,2),weak:f(20,12,2),few:f(3,3,2),first:f(20,20,0),base:f(0,0,2)};
   r.adj=interval({l:1,last:T,step:2,qt:20,qc:20,qd:{[T]:[20,20]},adj:3,adjFrom:T});ui.prefs.adapt=false;r.off=f(20,18,2);ui.prefs.adapt=true;return r});
 ok(iv.hi===10&&iv.mid===8&&iv.lo===4&&iv.weak===5&&iv.few===7&&iv.first===1&&iv.base===7&&iv.adj===7&&iv.off===7,name+": intervalos ajustados "+JSON.stringify(iv));
 const tx=await p.evaluate(()=>{const T=today();state["CM-9"]={l:2,last:T,step:2,qt:20,qc:18,qd:{[T]:[20,18]}};openKey="CM-9";detTab["CM-9"]="estudo";backStack=[];setView("temas");if(typeof setTSeg==="function")setTSeg("lista");render();const d=document.querySelector('#t-CM-9');return d?d.textContent:""});
 ok(/Intervalo atual: 10 dias \(mais longo pelo seu acerto de 90%/.test(tx),name+": tema explica o ajuste");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
