// t99: Provas na íntegra em tela inteira (Modo prova e Modo estudo), como no simulado: botão, Esc sai, lembrado; só com 2 colunas
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabDeitado:[1180,820,true],note:[1366,768,false],full:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name.startsWith("ipad")||name.startsWith("tab");const two=["tabDeitado","note","full"].includes(name);
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(200)};
 await p.evaluate(()=>{const alt=["A","B","C","D"].map(l=>({letra:l,texto:"Alternativa "+l}));const Q=(n,k)=>({n,k,g:"b",q:{enunciado:"Paciente com hemartroses recorrentes. Questão "+n,alternativas:alt,correta:"A",comentario:"c"}});
   const ex=exClean({id:"exF",name:"Distúrbios da Hemostasia",banca:"ENARE",ano:"2024",at:new Date().toISOString(),qs:[1,2,3].map(n=>Q(n,"CM-34"))});exams.unshift(ex);exPut(ex);
   exPg("exF").mode="p";exRun={id:"exF",view:"q",i:0,cad:{}};backStack=[];qSeg="praticar";setView("quest")});await p.waitForTimeout(250);
 const btn=await p.$('#exFullB');
 if(!two){ok(!btn,name+": sem botão de tela inteira (só no computador e no iPad deitado)");await ctx.close();continue}
 ok(!!btn&&/Tela inteira/.test(await btn.textContent()),name+": Modo prova tem o botão ⛶ Tela inteira");
 await click('#exFullB');
 const r1=await p.evaluate(()=>{const v=document.querySelector('#viewQuest'),c=v.querySelector('.qexam');return {vfull:v.classList.contains("vfull"),card:!!c.offsetParent,sim:!!(document.querySelector('.qsim')||{}).offsetParent,
   others:[...v.querySelectorAll('.card')].filter(x=>x.offsetParent&&!x.closest('.qexam')).length,stem:!!document.querySelector('.qexam .qstem').offsetParent,ls:localStorage.getItem("resid-exfull"),
   hint:/Esc sai da tela inteira/.test(document.querySelector('.qexam').textContent),bt:document.querySelector('#exFullB').textContent}});
 ok(r1.vfull&&r1.card&&r1.stem&&!r1.sim&&r1.others===0&&r1.ls==="1",name+": tela inteira mostra só a prova "+JSON.stringify(r1));
 ok(r1.hint&&/Sair da tela inteira/.test(r1.bt),name+": avisa o Esc e o botão vira Sair da tela inteira");
 if(name==="note"||name==="full")await p.screenshot({path:`t99-prova-${name}.png`});
 /* responder e navegar continuam funcionando */
 await p.keyboard.press('b');await p.waitForTimeout(150);await p.keyboard.press('ArrowRight');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>exPg("exF").a[0]&&exPg("exF").a[0].l==="B"&&exRun.i===1&&document.querySelector('#viewQuest').classList.contains("vfull")),name+": teclas A–E e → continuam na tela inteira");
 /* Esc sai */
 await p.keyboard.press('Escape');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>!document.querySelector('#viewQuest').classList.contains("vfull")&&!fullOn.ex&&localStorage.getItem("resid-exfull")==="0"&&!!(document.querySelector('.qsim')||{}).offsetParent),name+": Esc sai da tela inteira");
 /* Modo estudo também, e o app lembra */
 await p.evaluate(()=>{exPg("exF").mode="e";exRun={id:"exF",view:"q",i:2,cad:{}};render()});await p.waitForTimeout(150);await click('#exFullB');
 await p.keyboard.press('a');await p.waitForTimeout(200);
 const r2=await p.evaluate(()=>({vfull:document.querySelector('#viewQuest').classList.contains("vfull"),ans:!!exPg("exF").a[2],corr:/Modo estudo/.test(document.querySelector('.qexam').textContent)}));
 ok(r2.vfull&&r2.ans&&r2.corr,name+": Modo estudo em tela inteira, com a correção na hora "+JSON.stringify(r2));
 if(name==="note")await p.screenshot({path:`t99-estudo-${name}.png`});
 await p.evaluate(()=>{exRun=null;render();exRun={id:"exF",view:"q",i:0,cad:{}};render()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>document.querySelector('#viewQuest').classList.contains("vfull")),name+": ao voltar para a prova, a tela inteira continua (o app lembra)");
 /* fora da prova, nada fica escondido */
 await p.evaluate(()=>{exRun=null;render()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>!document.querySelector('#viewQuest').classList.contains("vfull")&&!document.querySelector('.fullhide')),name+": sem prova aberta, a aba volta ao normal");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
