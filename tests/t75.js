const {chromium}=require('playwright');const fs=require('fs');const mock=fs.readFileSync(__dirname+'/mockdb.js','utf8');const ok=(c,m)=>console.log((c?"OK   ":"FALHA")+" "+m);
const DEV={fone:[390,844,true],ipad578:[578,820,true],tabEmPe:[820,1180,true],tabDeitado:[1180,820,true],note:[1366,768,false],monitor:[1920,1080,false]};
(async()=>{const b=await chromium.launch();const errs=[];
const open=async(name,pre)=>{const [w,h,mob]=DEV[name];const ipad=name==="ipad578"||name.startsWith("tab");
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:mob,isMobile:mob,screen:name==="ipad578"?{width:1180,height:820}:undefined,userAgent:ipad?"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)":undefined});
  await ctx.route(/googleapis|gstatic/,r=>r.abort());await ctx.addInitScript((pre||"")+mock+`;window.__mock({},2);`);
  const p=await ctx.newPage();p.on('pageerror',e=>errs.push(name+":"+e.message));await p.goto('file://'+__dirname+'/preview.html');
  await p.waitForFunction(()=>typeof saveFac==='function'&&synced&&downloadsFn,null,{polling:100});await p.waitForTimeout(150);
  return {ctx,p,mob,click:s=>mob?p.tap(s):p.click(s)}};
/* migração do campo único antigo */
{const {ctx,p}=await open("note",`try{localStorage.setItem("resid-ui-v1",JSON.stringify({prefs:{},profile:{name:"E",goal:"ENARE 2027",goalDate:"2027-10-20"}}))}catch(e){};`);
 ok(await p.evaluate(()=>exList().length===1&&exMain().name==="ENARE 2027"&&exMain().date==="2027-10-20"&&ui.profile.goalDate==="2027-10-20"),"migra a prova antiga para a lista");
 await p.evaluate(()=>{ui.profile.exams=[];saveUI()});ok(await p.evaluate(()=>exList().length===0&&!ui.profile.goalDate),"remover todas não recria a antiga");await ctx.close()}
for(const name of Object.keys(DEV)){const {ctx,p,click,mob}=await open(name);
 const setup=()=>p.evaluate(()=>{const D=n=>fromNum(dnum(today())+n);hist={};for(let i=1;i<=27;i+=3)hist[D(-i)]={e:2};
   state={};ALL.slice(0,30).forEach((it,i)=>state[it.key]={l:1,last:D(-(i%10)),step:i%3});
   fac={sems:[{id:"s",name:"6",archived:false}],discs:[{id:"d",semId:"s",name:"NCS 6",items:[],info:{},links:[],eixos:[],sps:[{id:"sp1",name:"SP 1 Dor torácica",eixoId:"",items:[],objs:[],fech:D(10)}]}],provas:[{id:"p1",discId:"d",name:"Prova 1",date:D(24),items:[]}],own:[]};
   commit();saveFac&&saveFac();setView("inicio")});
 await setup();
 // Perfil: cadastrar duas provas
 await p.evaluate(()=>goSub("perfil"));await p.waitForTimeout(100);
 await p.evaluate(()=>document.querySelector('#pfExAdd').click());await p.waitForTimeout(100);
 let id1=await p.evaluate(()=>exList()[0].id);await p.fill('#pfExName-'+id1,'ENARE');await p.press('#pfExName-'+id1,'Tab');
 const d1=await p.evaluate(()=>fromNum(dnum(today())+120));await p.fill('#pfExDate-'+id1,d1);await p.dispatchEvent('#pfExDate-'+id1,'change');await p.waitForTimeout(100);
 await p.evaluate(()=>document.querySelector('#pfExAdd').click());await p.waitForTimeout(100);
 let id2=await p.evaluate(()=>exList()[1].id);await p.fill('#pfExName-'+id2,'USP-SP');await p.press('#pfExName-'+id2,'Tab');
 const d2=await p.evaluate(()=>fromNum(dnum(today())+60));await p.fill('#pfExDate-'+id2,d2);await p.dispatchEvent('#pfExDate-'+id2,'change');await p.waitForTimeout(100);
 ok(await p.evaluate(([a,b])=>exList().length===2&&exMain().name==="ENARE"&&ui.profile.goalDate===a&&exList()[1].date===b,[d1,d2]),name+": cadastra duas provas, a primeira é a principal");
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": Perfil sem rolagem lateral");await p.screenshot({path:`pf-${name}.png`});
 // Início
 await p.evaluate(()=>{backStack=[];setView("inicio")});await p.waitForTimeout(100);
 ok(await p.evaluate(()=>/ENARE/.test(document.querySelector('#iMeta .imetab').textContent)&&/\+1 prova/.test(document.querySelector('#iMeta .imetab').textContent)),name+": meta mostra a principal e as outras");
 ok(await p.evaluate(()=>/precisa de/.test(document.querySelector('#iMeta .iproj').textContent)),name+": ritmo necessário");
 await p.evaluate(()=>document.querySelector('#projTog').scrollIntoView({block:"center"}));await click('#projTog');await p.waitForTimeout(150);
 const M=await p.evaluate(()=>{const M=projModel();return {n:M.W.length,sum:M.W.reduce((a,w)=>a+w.nw,0),total:M.total,rows:document.querySelectorAll('#projWeeks .pjrow:not(.pjhead)').length,
   fac:M.W.findIndex(w=>w.ev.some(e=>e.k==="fac")),sp:M.W.findIndex(w=>w.ev.some(e=>e.k==="sp")),res:M.W.findIndex(w=>w.ev.some(e=>e.k==="res"&&!e.main)),nw:M.W.map(w=>w.nw),rv:M.W.reduce((a,w)=>a+w.rv,0),chips:document.querySelectorAll('#projWeeks .pjchip').length}});
 ok(M.rows===Math.min(8,M.n)&&M.n>=17&&M.n<=19,name+": semanas até a prova "+M.n+" (mostra "+M.rows+")");
 ok(M.sum===M.total,name+": temas novos somam o que falta "+M.sum+"/"+M.total);
 ok(M.fac>0&&M.nw[M.fac]<M.nw[M.fac+2]&&M.nw[M.fac-1]<=M.nw[M.fac+2],name+": semana de prova da faculdade tem menos temas "+M.nw.slice(0,8).join(","));
 ok(M.sp>=0&&M.res>0,name+": fechamento de SP e a outra prova de residência marcados");
 ok(M.rv>40,name+": revisões previstas "+M.rv);
 await p.screenshot({path:`proj-${name}.png`});
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+": sem rolagem lateral com as semanas");
 await p.evaluate(()=>document.querySelector('#projAll').click());await p.waitForTimeout(100);ok(await p.evaluate(()=>document.querySelectorAll('#projWeeks .pjrow:not(.pjhead)').length===projModel().W.length),name+": ver todas as semanas");
 // trocar a principal
 await p.evaluate(()=>goSub("perfil"));await p.waitForTimeout(100);await p.evaluate(id=>document.getElementById('pfExMain-'+id).click(),id2);await p.waitForTimeout(100);
 ok(await p.evaluate(d=>exMain().name==="USP-SP"&&ui.profile.goalDate===d&&projModel().W.length<=10,d2),name+": trocar a principal muda o prazo");
 // sem data: só ritmo
 await p.evaluate(id=>{const x=exList().find(e=>e.id===id);delete x.date;saveUI();backStack=[];setView("inicio")},id2);await p.waitForTimeout(100);
 ok(await p.evaluate(()=>/Sem data de prova/.test(document.querySelector('#iMeta .iproj').textContent)&&/data ainda não definida/.test(document.querySelector('#iMeta').textContent)),name+": sem data mostra só o ritmo");
 ok(await p.evaluate(()=>{const M=projModel();return M.end===null&&M.W.reduce((a,w)=>a+w.nw,0)===M.total}),name+": sem data, semanas pelo ritmo");
 // atrasado
 await p.evaluate(id=>{const x=exList().find(e=>e.id===id);x.date=fromNum(dnum(today())+21);saveUI();render()},id2);await p.waitForTimeout(100);
 ok(await p.evaluate(()=>/ficariam sem ver/.test(document.querySelector('#iMeta .iproj').textContent)),name+": avisa quantos temas ficariam de fora");
 // calendário com as provas de residência
 const ics=await p.evaluate(async()=>{let out="";const o=downloadsFn;downloadsFn={save:async x=>{out=await x.data.text()}};await icsSave();downloadsFn=o;return out});
 ok(/Prova de residência: ENARE/.test(ics)&&/Prova de residência: USP-SP/.test(ics),name+": calendário leva as provas de residência");
 // remover
 await p.evaluate(()=>goSub("perfil"));await p.waitForTimeout(100);await p.evaluate(()=>document.querySelectorAll('#viewPerfil .exdel')[1].click());await p.waitForTimeout(100);
 ok(await p.evaluate(()=>exList().length===1&&exMain().name==="ENARE"),name+": remover a principal passa para a outra");
 await ctx.close()}
ok(!errs.length,"sem erros JS "+errs.join(" | "));await b.close()})();
