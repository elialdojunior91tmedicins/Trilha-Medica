const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync('mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,[w,h,mob]] of Object.entries(DEV)){const ipad=name==="ipad578"||name.startsWith("tab");const big=["tabDeitado","note","monitor"].includes(name);
const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('file://'+__dirname+'/preview.html');await p.waitForFunction(()=>typeof saveFac==='function'&&synced,null,{polling:100});
const click=s=>mob?p.tap(s):p.click(s);
await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);for(let i=0;i<5;i++)errors.push({id:"x"+i,k:ALL[i].key,t:"conhecimento",w:"errei "+i,r:"certo "+i,s:"",d:D(-3),box:0,due:D(0)});commit();setView("erros")});await p.waitForTimeout(150);
ok(!(await p.$('#erFullB')),name+": sem botão fora da revisão");
await click('#erGo');await p.waitForTimeout(150);
const vis=await p.evaluate(()=>{const b=document.getElementById("erFullB");return !!b&&b.offsetParent!==null});ok(vis===big,name+": botão tela inteira "+(big?"aparece":"não aparece"));
if(big){await click('#erFullB');await p.waitForTimeout(150);
  const st=await p.evaluate(()=>({list:!!document.getElementById("elist").offsetParent,ins:!!document.getElementById("insight").offsetParent,rev:document.querySelector(".erev").getBoundingClientRect().width,txt:document.getElementById("erFullB").textContent}));
  ok(!st.list&&!st.ins&&st.rev>500&&/Sair/.test(st.txt),name+": tela inteira esconde lista e mostra só a revisão "+JSON.stringify(st));
  await p.screenshot({path:`full-${name}.png`});
  if(!mob){await p.keyboard.press(' ');await p.waitForTimeout(80);ok(await p.evaluate(()=>erRun.show),name+": espaço mostra o correto");await p.keyboard.press('1');await p.waitForTimeout(80);ok(await p.evaluate(()=>erRun.i===1&&erRun.ok===1),name+": tecla 1 = Agora sei");
    await p.keyboard.press(' ');await p.keyboard.press('2');await p.waitForTimeout(80);ok(await p.evaluate(()=>erRun.i===2&&erRun.ok===1),name+": tecla 2 = Ainda erraria");}
  // escolha lembrada
  await p.evaluate(()=>{erRun=null;render()});ok(await p.evaluate(()=>!!document.getElementById("elist").offsetParent),name+": fechar a revisão volta às duas colunas");
  ok(await p.evaluate(()=>localStorage.getItem("resid-erfull")==="1"),name+": escolha salva no aparelho");await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);errors.push({id:"y",k:"CM-1",t:"conhecimento",w:"a",r:"b",s:"",d:D(-3),box:0,due:D(0)});commit();setView("erros")});
  await click('#erGo');await p.waitForTimeout(150);ok(await p.evaluate(()=>!document.getElementById("elist").offsetParent),name+": abre em tela inteira da próxima vez");
  if(!mob){await p.keyboard.press('Escape');await p.waitForTimeout(100);ok(await p.evaluate(()=>!!document.getElementById("elist").offsetParent&&!erFull),name+": Esc sai da tela inteira")}
  else{await click('#erFullB');await p.waitForTimeout(100);ok(await p.evaluate(()=>!erFull),name+": botão sai da tela inteira")}}
else{ok(await p.evaluate(()=>!!document.querySelector('.erfc')),name+": revisão normal")}
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join("|"));await b.close()})();
