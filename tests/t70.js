const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,[w,h,mob]] of Object.entries(DEV)){const ipad=name==="ipad578"||name.startsWith("tab");const big=["tabDeitado","note","monitor"].includes(name);
const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&sampleFn,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);const visible=s=>p.evaluate(s=>{const x=document.querySelector(s);return !!x&&x.offsetParent!==null},s);
await p.evaluate(()=>{notes["CM-1"]="## a\n- b";for(let i=0;i<4;i++)cdAdd("CM-1","Pergunta "+i+"?","Resposta "+i,"eu");
  sampleFn.json=async(input)=>{const n=+input.match(/simulado com (\d+)/)[1];return Array.from({length:n},(_,i)=>({enunciado:"Caso "+i,alternativas:[{letra:"A",texto:"a"},{letra:"B",texto:"b"},{letra:"C",texto:"c"}],correta:"B",comentario:"c",conceito:"k",alerta:""}))};
  const D=n=>fromNum(dnum(today())+n);["CM-1","CM-4","CM-6"].forEach(k=>state[k]={l:1,last:D(-2),qt:10,qc:3});commit();setView("notas");if(typeof setNSeg==="function")setNSeg("revisar")});await p.waitForTimeout(150);
// cartões
await click('#cdGo');await p.waitForTimeout(150);ok(await visible('#cdFullB')===big,name+": botão nos cartões "+(big?"aparece":"não aparece"));
if(big){await click('#cdFullB');await p.waitForTimeout(150);const st=await p.evaluate(()=>({others:[...document.querySelectorAll('#viewNotas section.card')].filter(c=>!c.classList.contains("ncards")&&c.offsetParent!==null).length,w:document.querySelector('.ncards').getBoundingClientRect().width}));
  ok(st.others===0&&st.w>500,name+": cartões em tela inteira "+JSON.stringify(st));await p.screenshot({path:`fullcd-${name}.png`});
  if(!mob){await p.keyboard.press(' ');await p.waitForTimeout(60);ok(await p.evaluate(()=>cdRun.show),name+": espaço mostra a resposta");await p.keyboard.press('1');await p.waitForTimeout(60);ok(await p.evaluate(()=>cdRun.i===1&&cdRun.ok===1),name+": 1 = Lembrei");
    await p.keyboard.press('Escape');await p.waitForTimeout(80);ok(await p.evaluate(()=>!fullOn.cd),name+": Esc sai")}
  else{await click('#cdFullB');await p.waitForTimeout(80);ok(await p.evaluate(()=>!fullOn.cd),name+": botão sai")}
  await p.evaluate(()=>{fullSet("cd",true);cdRun=null;render()});ok(await p.evaluate(()=>[...document.querySelectorAll('#viewNotas section.card')].filter(c=>c.offsetParent!==null).length>1),name+": sem sessão, aba normal");}
// simulado
await p.evaluate(()=>{cdRun=null;setView("quest");if(typeof setQSeg==="function")setQSeg("praticar")});await p.waitForTimeout(150);
ok(!(await visible('#simFullB')),name+": sem botão antes de começar");
await click('#simGo');await p.waitForTimeout(500);ok(await visible('#simFullB')===big,name+": botão no simulado "+(big?"aparece":"não aparece"));
if(big){await click('#simFullB');await p.waitForTimeout(150);const st=await p.evaluate(()=>({others:[...document.querySelectorAll('#viewQuest section.card')].filter(c=>!c.classList.contains("qsim")&&c.offsetParent!==null).length,w:document.querySelector('.qsim').getBoundingClientRect().width}));
  ok(st.others===0&&st.w>500,name+": simulado em tela inteira "+JSON.stringify(st));await p.screenshot({path:`fullsim-${name}.png`});
  if(!mob){await p.keyboard.press('b');await p.waitForTimeout(80);ok(await p.evaluate(()=>sim.ans[0]==="B"),name+": tecla B responde");await p.keyboard.press(' ');await p.waitForTimeout(80);ok(await p.evaluate(()=>sim.i===1),name+": espaço vai para a próxima");}
  await p.evaluate(()=>{sim=null;render()});ok(await p.evaluate(()=>[...document.querySelectorAll('#viewQuest section.card')].filter(c=>c.offsetParent!==null).length>1),name+": novo simulado volta ao normal");
  await p.reload();await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});ok(await p.evaluate(()=>fullOn.sim&&fullOn.cd),name+": escolha lembrada")}
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
