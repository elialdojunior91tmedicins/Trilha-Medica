// t144 (Lote 21, item 6): Revisar erros refeito — o app organiza o erro (eOrg), frente sem resposta, verso na ordem, 3 notas, caso novo, contraste, teimoso, regras de hoje
const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],note:[1366,900,false]};
(async()=>{const b=await chromium.launch();const errs=[];
for(const name of Object.keys(DEV)){const [w,h,mob]=DEV[name];
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob});
 await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript(mock+`;window.__mock({},2);`);
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('http://localhost:8765/tests/preview.html');
 await p.waitForFunction(()=>typeof liveOn!=="undefined"&&liveOn,null,{polling:100,timeout:15000});await p.waitForTimeout(200);
 const click=async s=>{await p.evaluate(s=>{const x=document.querySelector(s);if(x)x.scrollIntoView({block:"center"})},s);await (mob?p.tap(s):p.click(s));await p.waitForTimeout(150)};
 /* 1. o app organiza ao salvar */
 const O=await p.evaluate(()=>{errors=[];const k=ALL.find(i=>/HIV/.test(i.t)).key;window.__k=k;const q={enunciado:"Um homem de 38 anos vivendo com HIV (CD4 = 210 células/mm³) apresenta VDRL sérico 1:64. Relata cefaleia e alteração da acuidade auditiva há 3 semanas. Punção lombar: pleocitose linfocítica (28 células/mm³), proteína 82 mg/dL e VDRL liquoroso reagente. Qual é o tratamento de escolha?",
     alternativas:[{letra:"A",texto:"Penicilina benzatina 2,4 milhões UI semanal por 3 semanas",porque:"A benzatina não atinge nível terapêutico no liquor."},{letra:"B",texto:"Doxiciclina por 28 dias",porque:"É alternativa só na alergia, fora do SNC."},{letra:"C",texto:"Penicilina G cristalina IV 18 a 24 milhões UI/dia por 14 dias",porque:""}],
     correta:"C",comentario:"Gabarito: C. Por que está correta: VDRL reagente no liquor com pleocitose confirma neurossífilis, que exige penicilina cristalina IV. Alternativa A — por que está incorreta: a benzatina não atinge o liquor.",pc:"Neurossífilis exige penicilina G cristalina IV 18 a 24 milhões UI/dia por 14 dias."};
   const D=qDraft(q,"A","Simulado HIV");const e=eNew(k,D.w,D.r,D.t,D.s,"",D.p,{pc:D.pc,dd:D.dd,qf:D.qf});window.__e=e.id;return e.ra});
 ok(O&&/cristalina/i.test(O.regra)&&O.src==="app",name+": a regra vem do ponto-chave e fica marcada como do app");
 ok(O&&O.dados.some(d=>/liquor|pleocitose|VDRL/i.test(d))&&!O.dados.some(d=>/^38 anos$|homem de 38/i.test(d)),name+": dados decisivos do caso, sem a idade solta "+JSON.stringify(O&&O.dados));
 ok(O&&/benzatina/i.test(O.naoSua)&&/^Logo: \*\*Penicilina G cristalina/.test(O.passos[O.passos.length-1])&&/✓$/.test(O.passos[O.passos.length-1]),name+": por que não a sua e o último passo com ✓");
 /* erros antigos com a questão ganham a organização; o do usuário não muda */
 ok(await p.evaluate(()=>{const a=errors[0];const old={...JSON.parse(JSON.stringify(a)),id:"old1"};delete old.ra;const mine={...JSON.parse(JSON.stringify(a)),id:"mine1",ra:{regra:"Minha regra",dados:[],passos:[],naoSua:"",src:"eu",at:today()}};errors.push(old,mine);eOrgAll();
   return !!errors.find(e=>e.id==="old1").ra&&errors.find(e=>e.id==="mine1").ra.regra==="Minha regra"}),name+": erros antigos com a questão ganham a organização; o corrigido por você fica");
 await p.evaluate(()=>{errors=errors.filter(e=>e.id===window.__e);errors[0].due=today();saveErrsLocal();backStack=[];setView("erros");render()});await p.waitForTimeout(200);
 /* 2. tela de entrada */
 const E0=await p.evaluate(()=>({go:$("#erGo").textContent,sum:document.querySelector('.erev .qrdsum').textContent,txt:document.querySelector('.erev').textContent}));
 ok(/Revisar 1 erro · ≈ \d+ min/.test(E0.go)&&!/CM ·/.test(E0.sum)&&/Cada erro volta como pergunta/.test(E0.txt),name+": entrada com tempo, especialidade sem código e a frase "+JSON.stringify(E0.go));
 await click('#erGo');
 /* 3. frente: caso e pergunta, nada da resposta */
 const F=await p.evaluate(()=>{const c=document.querySelector('.erv2');return {caso:/pleocitose/.test(c.querySelector('.ercx').textContent),ask:/Qual é o tratamento/.test(c.querySelector('.erask').textContent),resp:!!c.querySelector('.ercs,.errg'),hint:/Responda de cabeça/.test(c.textContent),certa:/cristalina/i.test(c.textContent),prog:c.querySelector('.erprog span').textContent,tema:c.querySelector('.ertema').textContent}});
 ok(F.caso&&F.ask&&!F.resp&&F.hint&&!F.certa&&F.prog==="1 de 1"&&F.tema,name+": frente com o caso inteiro e a pergunta, sem a resposta "+JSON.stringify(F));
 await click('#erAlts');ok(await p.evaluate(()=>erRun.peek&&document.querySelectorAll('.eralts li').length===3),name+": Ver alternativas mostra sem marcar");
 await click('#erShow');
 const V=await p.evaluate(()=>{const c=document.querySelector('.erv2');return {ok:c.querySelector('.ercok p').textContent,no:c.querySelector('.ercno p').textContent,rg:!!c.querySelector('.errg'),src:c.querySelector('.ersrc').textContent,ps:c.querySelectorAll('.erps li').length,nao:!!c.querySelector('.ernao'),marks:c.querySelectorAll('mark.erdd').length,full:!!c.querySelector('.erfullq'),good:$("#erGood").disabled}});
 ok(/cristalina IV 18 a 24 milhões UI\/dia por 14 dias/.test(V.ok)&&/benzatina 2,4 milhões/.test(V.no),name+": verso com Certa × Você marcou, texto inteiro");
 ok(V.rg&&V.src==="montado pelo app"&&V.ps>=2&&V.nao&&V.full,name+": a regra (montado pelo app), o raciocínio, por que não a sua e a questão completa recolhida "+JSON.stringify(V));
 ok(V.marks>=1,name+": dados decisivos marcados no caso depois de abrir");
 ok(V.good===true,name+": com as alternativas vistas, Acertei fica desligado");
 /* tocar num dado tira; corrigir à mão */
 const n0=await p.evaluate(()=>errors[0].ra.dados.length);await p.evaluate(()=>document.querySelector('mark.erdd').click());await p.waitForTimeout(150);
 ok(await p.evaluate(n0=>errors[0].ra.dados.length===n0-1&&errors[0].ra.src==="eu",n0),name+": tocar no dado tira e a organização passa a ser sua");
 await click('#erEdB');await p.fill('#ere-regra','VDRL no liquor = neurossífilis: cristalina IV.');await click('#erEdOk');
 ok(await p.evaluate(()=>errors[0].ra.regra==="VDRL no liquor = neurossífilis: cristalina IV."&&document.querySelector('.ersrc').textContent==="corrigido por você"),name+": Corrigir salva a regra como sua");
 /* 4. notas: Em parte */
 const b0=await p.evaluate(()=>eBox(errors[0]));await click('#erPart');
 ok(await p.evaluate(b0=>{const e=errors[0];return e.due===fromNum(dnum(today())+Math.max(2,Math.floor(E_INT[Math.min(b0+1,4)]/2)))&&eBox(e)===b0&&!e.miss},b0),name+": Em parte = mesmo degrau, volta na metade do Acertei, não conta erro");
 ok(await p.evaluate(()=>{const P=b=>eNext({box:b},1),A=b=>eNext({box:b},2);return [0,1,2,3,4].map(P).join()==="2,3,7,15,15"&&[0,1,2,3,4].every(b=>P(b)<A(b))}),name+": Em parte sempre antes do Acertei (2, 3, 7, 15)");
 const T=await p.evaluate(()=>{const x=document.querySelector('#erToday');return x&&x.textContent});
 ok(/As regras de hoje/.test(T||"")&&/neurossífilis/.test(T||""),name+": fim da sessão com as regras de hoje");
 /* 5. teimoso, Errei e Acertei */
 await p.evaluate(()=>{const e=errors[0];e.miss=1;e.due=today();erRun={ids:[e.id],i:0,show:true,ok:0,done:0,res:[]};render()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>/3ª vez que este erro volta/.test((document.querySelector('#erTeim')||{}).textContent||"")),name+": aviso de teimoso na hora");
 await p.keyboard.press('1');await p.waitForTimeout(150);
 ok(await p.evaluate(()=>{const e=errors[0];return e.miss===2&&e.due===fromNum(dnum(today())+1)}),name+": tecla 1 = Errei, volta amanhã");
 /* 6. caso novo com a mesma regra (questão irmã) a partir da 3ª revisão */
 await p.evaluate(()=>{const e=errors[0];e.rev=2;e.due=today();exams.push(exClean({id:"exs",name:"Prova irmã",banca:"X",ano:"2025",qs:[{n:1,k:e.k,g:"b",q:{enunciado:"Mulher de 30 anos com HIV, VDRL 1:32 e confusão mental. Liquor com VDRL reagente e pleocitose. Qual a conduta?",alternativas:[{letra:"A",texto:"Penicilina G cristalina IV por 14 dias"},{letra:"B",texto:"Benzatina"}],correta:"A",comentario:"Neurossífilis: penicilina cristalina IV, VDRL liquor reagente."}}]}));
   erRun={ids:[e.id],i:0,show:false,ok:0,done:0,res:[]};render()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>/Caso novo com a mesma regra/.test(document.querySelector('.erv2').textContent)&&/confusão mental/.test(document.querySelector('.ercx').textContent)),name+": a partir da 3ª revisão, caso novo do acervo com a mesma regra");
 await click('#erShow');ok(await p.evaluate(()=>/Resposta deste caso/.test(document.querySelector('.ercok').textContent)&&/cristalina/.test(document.querySelector('.ercok p').textContent)),name+": o verso mostra a resposta do caso novo");
 /* 7. Claude: antes e depois, com contraste */
 await p.evaluate(()=>{const e=errors[0];e.t="confusao";e.rev=0;e.ra.src="app";erRun={ids:[e.id],i:0,show:true,ok:0,done:0,res:[]};window.__pr="";
   sampleFn.json=async pr=>{window.__pr=pr;return [{codigo:e.id,regra:"Regra do Claude.",dados:["VDRL liquoroso reagente"],passos:["**VDRL no liquor** → neurossífilis.","Logo: **cristalina** ✓"],naoSua:"Benzatina não chega ao liquor.",contraste:{h:["Neurossífilis","Sífilis latente"],rows:[{l:"Liquor",a:"VDRL reagente",b:"normal"},{l:"Tratamento",a:"cristalina IV",b:"benzatina IM"}]},caso2:{e:"Caso novo.",ask:"Conduta?",ans:"Cristalina"}}]};render()});await p.waitForTimeout(150);
 await click('#erAI');await p.waitForTimeout(200);
 ok(await p.evaluate(()=>/MARCADA/.test(window.__pr)&&/peça o contraste/.test(window.__pr)&&!!document.querySelector('#eLotBox .cdbai')),name+": Melhorar com o Claude mostra antes e depois");
 await click('#eLotApply');
 ok(await p.evaluate(()=>{const e=errors[0];return e.ra.src==="claude"&&e.ra.regra==="Regra do Claude."&&e.ra.contraste&&e.ra.contraste.rows.length===2&&document.querySelectorAll('.erct tbody tr').length===2}),name+": aprovado vira do Claude, com o quadro de contraste no verso");
 /* 8. erro escrito à mão */
 await p.evaluate(()=>{const e=eNew(window.__k,"Marquei sífilis secundária; a certa era terciária","Gomas = terciária.","conhecimento","Anotação","","lesões gomosas na pele");erRun={ids:[e.id],i:0,show:false,ok:0,done:0,res:[]};render()});await p.waitForTimeout(150);
 ok(await p.evaluate(()=>{const c=document.querySelector('.erv2');return /O que você errou/.test(c.textContent)&&/Marquei sífilis secundária/.test(c.textContent)&&!/a certa era/.test(c.textContent)&&/lesões gomosas/.test(c.textContent)&&/O que seria o certo/.test(c.textContent)}),name+": erro à mão: o que você errou e a pista, sem 'a certa era'");
 ok(await p.evaluate(()=>{const c=eRaClean({regra:"x",dados:["a",3],passos:[],naoSua:"",src:"zz",contraste:{h:["a","b"],rows:[{l:"x",a:"1",b:"2"}]}});return c.src==="app"&&c.dados.length===1&&!Array.isArray(c.contraste.rows[0])}),name+": limpeza do e.ra sem listas dentro de listas (Firestore)");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral");
 await ctx.close()}
ok(!errs.length,"sem erros de JavaScript "+errs.join(" | "));await b.close()})();
