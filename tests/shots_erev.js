// Capturas do cartão "Revisar erros" (não é teste): erros feitos pelo caminho real (qDraft de questão de prova) — antes e depois de "Mostrar o correto".
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');
const OUT=process.argv[2]||'/tmp';
(async()=>{const b=await chromium.launch();
for(const [name,w,h,mob] of [["fone",390,844,true],["note",1366,900,false]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,deviceScaleFactor:mob?2:1});await ctx.route(/googleapis|gstatic/,r=>r.abort());
  await ctx.addInitScript(mock+`;window.__mock({},2);`);const p=await ctx.newPage();p.on('pageerror',e=>console.log("ERRO",e.message));
  await p.goto('http://localhost:8765/tests/preview.html');await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
  await p.evaluate(()=>{errors.length=0;
    const Q=[{k:"CM-12",src:"ENARE 2024",mine:"A",q:{enunciado:"Mulher de 24 anos procura atendimento por epistaxes recorrentes e menorragia desde a menarca. Refere que a mãe também apresenta sangramentos após extrações dentárias. Ao exame, sem petéquias, sem hepatoesplenomegalia. Hemograma com plaquetas de 280.000/mm³. TP 12 s (controle 12 s) e TTPA 31 s (controle 30 s). Tempo de sangramento prolongado. Qual a conduta mais adequada para a investigação?",
      alternativas:[{letra:"A",texto:"Tranquilizar a paciente, pois o coagulograma normal exclui coagulopatia hereditária",porque:"Incorreta. TP e TTPA normais não excluem doença de von Willebrand, pois o FVIII pode estar normal nas formas leves."},{letra:"B",texto:"Dosar antígeno do fator de von Willebrand, atividade do FvW (cofator de ristocetina) e fator VIII",porque:""},{letra:"C",texto:"Solicitar mielograma",porque:"Incorreta. Não há citopenia nem sinal de doença medular."},{letra:"D",texto:"Pesquisar inibidor do fator VIII com teste de mistura",porque:"Incorreta. O TTPA é normal; não há o que corrigir."}],
      correta:"B",comentario:"Correta. A doença de von Willebrand é o distúrbio hemorrágico hereditário mais comum e se manifesta por sangramento mucocutâneo. O coagulograma pode ser normal. A investigação inicial é o painel do FvW (antígeno, atividade e FVIII).",conceito:"",pc:"Coagulograma normal NÃO descarta doença de von Willebrand.",th:""}},
     {k:"CM-1",src:"Simulado misto",mine:"C",q:{enunciado:"Homem de 58 anos, hipertenso e diabético, chega com dor torácica em aperto há 40 minutos, sudorese e náuseas. PA 150x90 mmHg, FC 96 bpm. ECG: supradesnivelamento de ST de 3 mm em V1 a V4. O hospital não tem hemodinâmica; o serviço de referência fica a 3 horas de transporte. Qual a conduta?",
      alternativas:[{letra:"A",texto:"Transferir para angioplastia primária",porque:"Incorreta. O tempo porta-balão previsto passa de 120 minutos."},{letra:"B",texto:"Trombólise com tenecteplase nos primeiros 30 minutos",porque:""},{letra:"C",texto:"Dosar troponina e repetir o ECG em 3 horas antes de decidir",porque:"Incorreta. No IAM com supra o diagnóstico é pelo ECG; esperar troponina atrasa a reperfusão."},{letra:"D",texto:"Anticoagulação plena e observação",porque:"Incorreta. Não faz reperfusão."}],
      correta:"B",comentario:"No IAMCSST, quando a angioplastia primária não pode ser feita em até 120 minutos do diagnóstico, a trombólise deve ser feita em até 30 minutos da chegada (porta-agulha).",conceito:"",pc:"",th:"Sem hemodinâmica em 120 min: trombolisar em até 30 min."}}];
    Q.forEach(x=>{const D=qDraft(x.q,x.mine,x.src);const e=eNew(x.k,D.w,D.r,D.t,D.s,"",D.p,{pc:D.pc,dd:D.dd,qf:D.qf});e.due=today();putErr(e)});
    backStack=[];setView("erros");render()});
  await p.waitForTimeout(300);
  const shot=async f=>{const c=await p.$('.card.erev');await c.scrollIntoViewIfNeeded();await p.waitForTimeout(100);await c.screenshot({path:`${OUT}/${name}-${f}.png`})};
  await shot("0-inicio");
  await p.click('#erGo');await p.waitForTimeout(300);await shot("1-frente");
  await p.click('#erShow');await p.waitForTimeout(300);await shot("2-verso");
  await p.evaluate(()=>{const b=document.querySelector('.eqfull button');b&&b.click()});await p.waitForTimeout(300);await shot("3-questao");await p.click("#erBad");await p.waitForTimeout(300);await shot("4-frente2");await p.click("#erShow");await p.waitForTimeout(300);await shot("5-verso2");
  if(name==="fone"){const T=await p.evaluate(()=>{const e=errors.find(y=>y.id===erRun.ids[erRun.i]);return {w:e.w,p:e.p,dd:e.dd,r:e.r,pc:e.pc,t:e.t}});console.log(JSON.stringify(T,null,1))}
  await ctx.close()}
await b.close()})();
