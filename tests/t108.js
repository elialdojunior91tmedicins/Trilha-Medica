// t108: explicação do erro sem as marcas da prova ("— Gabarito: A) …", "Por que está correta:"), "Por que não a sua" à parte,
// pista que é só a pergunta não aparece; rascunho novo já sai limpo.
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const CM="— Gabarito: A) O DLBCL costuma ser mais agressivo Por que está correta: DLBCL é agressivo e o folicular é indolente; o DLBCL pode ser curado. Alternativa B — por que está incorreta: O DLBCL é potencialmente curável em muitos pacientes. Alternativa C — por que está incorreta: o folicular é indolente.";
(async()=>{const b=await chromium.launch();const errs=[];
for(const [name,w,h,mob] of [["fone",390,844,true],["note",1366,768,false]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});
  const D=await p.evaluate(CM=>{const q={enunciado:"Qual característica distingue o DLBCL do linfoma folicular típico?",alternativas:[{letra:"A",texto:"O DLBCL costuma ser mais agressivo",porque:""},{letra:"B",texto:"O DLBCL nunca é curável",porque:""},{letra:"C",texto:"O folicular é sempre agudo",porque:""}],correta:"A",comentario:CM,conceito:""};
    const S=qSplit(q);return {d:qDraft(q,"B","Prova"),cm:S.comentario,pb:S.alternativas[1].porque,t:[cmTidy("Correta. A DvW é comum."),cmTidy("Por que está incorreta: O teste corrigiu."),cmTidy("Texto comum, sem marcas.")]}},CM);
  ok(D.cm==="DLBCL é agressivo e o folicular é indolente; o DLBCL pode ser curado."&&D.pb==="O DLBCL é potencialmente curável em muitos pacientes.",name+": comentário e porquê sem \"Gabarito: A)\" nem \"Por que está…\" "+JSON.stringify([D.cm,D.pb]));
  ok(D.t[0]==="A DvW é comum."&&D.t[1]==="O teste corrigiu."&&D.t[2]==="Texto comum, sem marcas.",name+": cmTidy "+JSON.stringify(D.t));
  ok(D.d.p===""&&/^DLBCL é agressivo/.test(D.d.r)&&/Por que não [^:]*: O DLBCL é potencialmente curável/.test(D.d.r)&&!/Gabarito|Por que está/.test(D.d.r),name+": rascunho limpo e sem pista quando o enunciado é só a pergunta "+JSON.stringify(D.d.r));
  /* erro antigo, salvo com as marcas */
  await p.evaluate(()=>{errors=[{id:"eo",k:"CM-12",w:"Marquei X; a certa era Y",p:"Qual característica distingue o DLBCL do folicular?",
    r:"— Gabarito: A) O DLBCL costuma ser mais agressivo Por que está correta: DLBCL é agressivo.\nPor que não O DLBCL nunca é…: Por que está incorreta: É curável em muitos pacientes.",t:"conhecimento",s:"Prova",d:today(),rev:0,box:0,due:today()}];
    saveErrsLocal();backStack=[];setView("erros");render()});await p.waitForTimeout(150);
  const L=await p.evaluate(()=>{const c=document.querySelector('.ecard[data-eid="eo"]');return {r:c.querySelector(".r").textContent,why:!!c.querySelector(".r b.ewhy"),pista:!c.querySelector(".epista").hidden}});
  ok(L.r==="DLBCL é agressivo.Por que não a suaÉ curável em muitos pacientes."&&L.why&&!L.pista,name+": cartão do erro limpo, \"Por que não a sua\" destacado, pista-pergunta escondida "+JSON.stringify(L));
  await p.evaluate(()=>document.getElementById("erGo").click());await p.waitForTimeout(150);await p.evaluate(()=>document.getElementById("erShow").click());await p.waitForTimeout(150);
  const R=await p.evaluate(()=>{const c=document.querySelector('.erfc');return c&&{r:c.querySelector(".r").textContent,why:!!c.querySelector(".r b.ewhy")}});
  ok(R&&R.r===L.r&&R.why,name+": revisão mostra igual "+JSON.stringify(R));
  ok(await p.evaluate(()=>eOneLine(errors[0].r)==="DLBCL é agressivo. Por que não O DLBCL nunca é…: É curável em muitos pacientes."),name+": linha única (PDF, anotação) sem as marcas");
  await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
