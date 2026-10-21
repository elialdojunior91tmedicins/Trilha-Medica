// t86: barra lateral de altura inteira no computador e no iPad deitado (marca, busca, abas, resumos e perfil no rodapé); celular e iPad em pé como antes
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab"),full=name==="tabDeitado"||name==="note"||name==="monitor";
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
  await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});
  await p.evaluate(()=>{ui.profile.name="Elialdo Junior";saveUI();render()});await p.waitForTimeout(200);
  const r=await p.evaluate(()=>{const nav=document.querySelector('.appnav'),nb=nav.getBoundingClientRect(),vi=document.querySelector('#viewInicio').getBoundingClientRect();
    const inNav=id=>nav.contains(document.getElementById(id)),br=document.querySelector('h1.brand');
    return {brand:nav.contains(br),srch:inNav("srchBtn"),prof:inNav("profBtn"),cfg:inNav("cfgBtn"),top:Math.round(nb.top),bottom:Math.round(nb.bottom),left:Math.round(nb.left),right:Math.round(nb.right),vl:Math.round(vi.left),
      name:(document.querySelector('#sfName')||{}).textContent,foot:getComputedStyle(document.querySelector('#sFoot')).display,head:getComputedStyle(document.querySelector('body>.wrap>header')).display,scroll:document.documentElement.scrollWidth<=innerWidth}});
  if(full){
    ok(r.brand&&r.srch&&r.prof&&r.cfg,name+": marca, busca, perfil e configurações dentro da barra lateral");
    ok(r.top===0&&r.left===0&&Math.abs(r.bottom-h)<=1,name+": barra presa à esquerda, de cima a baixo "+JSON.stringify([r.top,r.bottom,r.left]));
    ok(r.vl>=r.right+16,name+": o conteúdo começa depois da barra, sem encostar");
    ok(r.name==="Elialdo Junior"&&r.foot==="flex"&&r.head==="none",name+": perfil no rodapé com o nome; cabeçalho antigo escondido");
    const lb=await p.evaluate(()=>{const l=document.querySelector('.appnav .blogo').getBoundingClientRect();return l.width});ok(lb>=40,name+": logo visível na barra ("+Math.round(lb)+"px)");
    await p.click('#sfWho');await p.waitForTimeout(150);ok(await p.evaluate(()=>view==="perfil"),name+": tocar no nome abre o Perfil");
    await p.click('#cfgBtn');await p.waitForTimeout(150);ok(await p.evaluate(()=>view==="config"),name+": engrenagem abre Configurações");
    await p.click('#srchBtn');await p.waitForTimeout(150);ok(await p.evaluate(()=>!!document.querySelector('#gsearch')),name+": Buscar abre a busca");await p.keyboard.press('Escape');
    const tabs=await p.evaluate(()=>[...document.querySelectorAll('.appnav .tab')].filter(t=>t.offsetParent).map(t=>{const b=t.getBoundingClientRect();return Math.round(b.height)}));
    ok(tabs.length===8&&tabs.every(x=>x>=36&&x<=52),name+": 8 abas em linha (ícone + nome) "+tabs.join(","));
    if(name==="note")await p.screenshot({path:`t86-${name}.png`});
  }else{
    ok(!r.brand&&!r.srch&&!r.prof&&!r.cfg&&r.head!=="none",name+": celular/iPad em pé: marca e botões continuam no topo");
    ok(r.foot==="none",name+": sem rodapé de perfil na barra");
  }
  ok(r.scroll,name+": sem rolagem lateral");
  await ctx.close()}
/* girar o aparelho: computador → largura de celular devolve tudo ao topo */
{const ctx=await b.newContext({viewport:{width:1366,height:800}});await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push("resize:"+e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});
  ok(await p.evaluate(()=>document.querySelector('.appnav').contains(document.querySelector('h1.brand'))),"largo: marca na barra");
  await p.setViewportSize({width:600,height:800});await p.waitForTimeout(300);
  ok(await p.evaluate(()=>document.querySelector('body>.wrap>header').contains(document.querySelector('h1.brand'))&&document.querySelector('#hacts').children.length===3),"estreito: marca e os 3 botões voltam ao topo");
  await p.setViewportSize({width:1366,height:800});await p.waitForTimeout(300);
  ok(await p.evaluate(()=>document.querySelector('#sfProf').contains(document.querySelector('#profBtn'))),"largo de novo: perfil volta ao rodapé");await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
