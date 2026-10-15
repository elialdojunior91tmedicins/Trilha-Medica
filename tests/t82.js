// t82: ligar conteúdo da faculdade a um tema da residência sem substituir (mesmo registro; tema inteiro ou subtópicos)
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
 const T=await p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);
   fac={sems:[{id:"s6",name:"6º semestre",archived:false}],discs:[{id:"d1",semId:"s6",name:"NCS 6 - Tutoria",items:[],info:{},links:[],eixos:[],sps:[{id:"sp1",name:"SP 2.3",eixoId:null,items:["O:a","O:b"],objs:[]}]}],
     provas:[{id:"p1",discId:"d1",name:"D2",date:D(10),items:["O:a","O:b"],done:[]}],own:{a:{t:"SP 2.3 – Anemias hemolíticas",discId:"d1",spId:"sp1"},b:{t:"SP 2.2 – Anemias carenciais",discId:"d1",spId:"sp1"}}};
   registerOwn();state["F-a"]={l:1,last:D(-2),step:0,qt:5,qc:3,qd:{[D(-2)]:[5,3]}};notes["F-a"]="Minha nota da tutoria";
   const e={id:"ea",k:"F-a",w:"Confundi esferocitose",r:"Coombs negativo",t:"c",s:"",d:today()};errors.push(e);putErr(e);
   saveFac();commit();facOpenSem.add("s6");facOpenDisc.add("d1");facOpenSP.add("sp1");backStack=[];setView("fac");
   const k="CM-34";return {k,t:BYKEY[k].t,subs:subList(BYKEY[k]).map(x=>x.t),qt0:get(k).qt||0}});
 /* 1. abrir o conteúdo e ligar a dois subtópicos pela tela */
 await p.evaluate(()=>{const b=[...document.querySelectorAll('#facSems li.t .item')].find(x=>x.querySelector('.topic').textContent==="SP 2.3 – Anemias hemolíticas");b.scrollIntoView({block:"center"});b.click()});await p.waitForTimeout(200);
 ok(await p.isVisible('#flk-a'),name+": conteúdo da faculdade oferece Ligar a um tema");
 await click('#flk-a');await p.fill('#fq-lnk-a',T.t.split(/\s+/)[0]);await p.waitForTimeout(200);
 const picked=await p.evaluate(k=>{const li=[...document.querySelectorAll('.flink .fres li')].find(l=>l.querySelector('b').textContent===BYKEY[k].t);if(!li)return false;li.querySelector('button').click();return true},T.k);
 await p.waitForTimeout(200);ok(picked,name+": a busca acha o tema da residência e só mostra temas/subtópicos da residência");
 await click('#flka-a-0');await click('#flkgo-a');
 ok(await p.evaluate(()=>/pelo menos um subtópico/.test(document.querySelector('.flink .err').textContent)),name+": só alguns subtópicos sem marcar nenhum avisa");
 await click('#flks-a-0');await click('#flks-a-1');await click('#flkgo-a');
 const r1=await p.evaluate(([k,s0,s1,qt0])=>{const L=fac.own.a.link;return {link:!!L&&L.k===k&&L.subs.join("|")===[s0,s1].join("|"),fGone:!state["F-a"]&&!BYKEY["F-a"]&&!FAC_ITEMS.some(i=>i.key==="F-a"),
   qt:get(k).qt===qt0+5,note:/Da faculdade: SP 2.3/.test(notes[k]||"")&&!notes["F-a"],err:errors.find(e=>e.id==="ea").k===k,
   subsDone:subList(BYKEY[k]).filter(x=>x.t===s0||x.t===s1).every(x=>x.done),label:refLabel("O:a")==="SP 2.3 – Anemias hemolíticas"}},[T.k,T.subs[0],T.subs[1],T.qt0]);
 ok(await p.evaluate(()=>!trash.some(x=>x.kind==="note")&&!document.querySelector("#trToast:not([hidden])")),name+": a anotação muda de lugar sem ir para a lixeira");
 ok(Object.values(r1).every(Boolean),name+": ligado aos 2 subtópicos; progresso, questões, nota e erro passam para o tema; nome da faculdade mantido "+JSON.stringify(r1));
 const row=await p.evaluate(()=>{const li=[...document.querySelectorAll('#facSems li.t')].find(l=>l.querySelector('.topic').textContent==="SP 2.3 – Anemias hemolíticas");return li&&{chip:!!li.querySelector('.facchip.lnk'),meta:li.querySelector('.meta').textContent}});
 ok(row&&row.chip&&/ligado a/.test(row.meta)&&/2\/2 subtópicos ligados/.test(row.meta),name+": na Faculdade aparece com o nome dela, selo FAC ↔ RES e os subtópicos ligados "+JSON.stringify(row));
 /* 2. outro conteúdo ligado ao tema inteiro; progresso em comum */
 await p.evaluate(k=>{linkOwn("b",k,[])},T.k);await p.waitForTimeout(100);
 const r2=await p.evaluate(([k,s0])=>{const pr=fac.provas[0],A=itemStudied(pr,"O:a"),B=itemStudied(pr,"O:b");
   const x=subList(BYKEY[k]).find(y=>y.t===s0);toggleSub(BYKEY[k],x);const A2=itemStudied(pr,"O:a"),B2=itemStudied(pr,"O:b");return {A,B,A2,B2,same:refTopic("O:b").k===k&&refTopic("O:a").k===k}},[T.k,T.subs[0]]);
 ok(r2.A&&r2.B&&!r2.A2&&r2.B2&&r2.same,name+": os dois apontam para o mesmo tema; desmarcar um subtópico ligado tira só o conteúdo ligado a ele "+JSON.stringify(r2));
 /* 3. dentro do tema da residência: caixa Na faculdade */
 await p.evaluate(k=>{detTab[k]="estudo";openTopic(k)},T.k);await p.waitForTimeout(250);
 const inf=await p.evaluate(()=>{const g=document.querySelector('.flinkinfo');return g&&{t:g.textContent,boxes:g.querySelectorAll('input[type=checkbox]').length}});
 ok(inf&&/SP 2.3 – Anemias hemolíticas/.test(inf.t)&&/SP 2.2 – Anemias carenciais/.test(inf.t)&&/tema inteiro/.test(inf.t)&&inf.boxes===2,name+": no tema da residência, Na faculdade lista os dois conteúdos e os subtópicos ligados");
 await click('#lki-a-0');ok(await p.evaluate(([k,s0])=>subList(BYKEY[k]).find(y=>y.t===s0).done,[T.k,T.subs[0]]),name+": marcar o subtópico ali marca no tema (mesmo registro)");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 if(name==="fone"||name==="note")await p.screenshot({path:`t82-${name}.png`});
 /* 4. desligar */
 await p.evaluate(()=>unlinkOwn("a"));await p.waitForTimeout(100);
 ok(await p.evaluate(k=>!fac.own.a.link&&!!BYKEY["F-a"]&&!(state["F-a"]&&state["F-a"].last)&&get(k).qt>=5&&refTopic("O:a").k==="F-a",T.k),name+": desligar volta a ser conteúdo só da faculdade, do zero; o tema fica com o progresso");
 /* 5. ligação inválida é limpa; dados válidos */
 await p.evaluate(()=>{fac.own.b.link={k:"XX-999",subs:[]};registerOwn()});
 ok(await p.evaluate(()=>!fac.own.b.link&&!!BYKEY["F-b"]),name+": ligação para tema que não existe é descartada");
 ok(await p.evaluate(()=>JSON.stringify(fac).indexOf("undefined")<0&&Object.values(fac.own).every(o=>!o.link||Array.isArray(o.link.subs))),name+": dados da Faculdade válidos");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
