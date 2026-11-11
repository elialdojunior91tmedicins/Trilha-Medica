/* ===================== FACULDADE =====================
   fac = {sems:[{id,name,archived}], discs:[{id,semId,name,items:[ref]}], provas:[{id,discId,name,date,items:[ref],done:[ref]}], own:{id:{t,discId}}}
   ref: "T:CM-6" tema da residência · "S:CM-6:<subtópico>" subtópico · "O:<id>" tema próprio (chave de progresso "F-<id>") */
let FAC_WIN=21, RES_MIN_WEEK=2;const LSF="resid-fac-v1", FAC_VESP=3, FAC_AREA={code:"FAC",name:"Faculdade",specs:[]};
let fac={sems:[],discs:[],provas:[],own:{}}, facStore=null, facTimer=null, facSel=null, facShowArch=false, facOpenDisc=new Set(), facQuery={}, facProvaOpen=new Set(), facProvaAll=new Set(), facArm=null, facNew={}, facReplace=null, facLinkSt=null, facOpenSP=new Set(), facDetOpen=new Set(), facEdit=null, facEditDisc=new Set(), facClosedEixo=new Set(), facSemMenu=false, facShowPast=new Set(), facOpenSem=new Set(), facOpenProv=new Set(), facSemAdj=null, facAddC=null, facNewDiscFor=null, facDraft={}, facFocus=false, facMapCustom=null, facImport={status:"closed",text:"",prop:null,msg:"",done:""}, facSynced=false, facTouched=false;
const FAC_ITEMS=[];
const fuid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const discOf=id=>fac.discs.find(d=>d.id===id), semOf=id=>fac.sems.find(s=>s.id===id);
function registerOwn(){facNormalize();FAC_ITEMS.forEach(it=>delete BYKEY[it.key]);FAC_ITEMS.length=0;
  for(const id in fac.own){const o=fac.own[id];if(ownLinks(id).length)continue;const P=ownPlace(o);
    const it={key:"F-"+id,num:0,t:o.t,area:P.A||FAC_AREA,sp:P.spec,subs:[],w0:1,own:true,origin:P.origin,originFull:P.originFull};FAC_ITEMS.push(it);BYKEY[it.key]=it}}
function facValid(x){return x&&Array.isArray(x.sems)&&Array.isArray(x.discs)&&Array.isArray(x.provas)&&x.own&&typeof x.own==="object"}
function saveFac(){facTouched=true;registerOwn();try{localStorage.setItem(LSF,JSON.stringify(fac))}catch(e){}
  if(!facStore)return;clearTimeout(facTimer);facTimer=setTimeout(async()=>{facTimer=0;try{liveW.fac=stab(fac);await facStore.set({...fac,updatedAt:new Date().toISOString()})}catch(e){setSave("Não foi possível salvar a Faculdade na conta; ficou salva neste navegador")}},700)}
function refTopic(r){if(!r)return null;if(r.startsWith("T:"))return {k:r.slice(2)};if(r.startsWith("O:")){const id=r.slice(2),Ls=ownLinks(id);return Ls.length?{k:Ls[0].k,own:id,subs:Ls[0].subs,links:Ls}:{k:"F-"+id}}
  if(r.startsWith("S:")){const i=r.indexOf(":",2);return {k:r.slice(2,i),sub:r.slice(i+1)}}return null}
function refOk(r){const x=refTopic(r);return !!(x&&BYKEY[x.k])}
/* todos os temas de um conteúdo: o próprio, ou cada tema da residência ligado a ele (o 1º é o principal) */
function refTopics(r){const x=refTopic(r);if(!x)return [];return x.links?x.links.map(L=>({k:L.k,own:x.own,subs:L.subs})):[x]}
function refLabel(r){const x=refTopic(r),it=x&&BYKEY[x.k];if(!it)return "";return x.own?fac.own[x.own].t:x.sub?x.sub:it.t}
function refKind(r){return r.startsWith("O:")?"Próprio":r.startsWith("S:")?"Subtópico":"Residência"}
function activeSems(){return fac.sems.filter(s=>!s.archived).map(s=>s.id)}
function upcomingProvas(){const t=today(),act=new Set(activeSems());
  return fac.provas.filter(p=>{const d=discOf(p.discId);return d&&!p.adi&&act.has(d.semId)&&p.date>=t}).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0)}
function itemStudied(p,r){if((p.done||[]).includes(r))return true;const T=refTopics(r);if(!T.length)return true;return T.every(x=>topicStudied(p,x))}
/* um tema (ou os subtópicos ligados dele) estudado na janela da prova */
function topicStudied(p,x){if(!BYKEY[x.k])return true;const s=get(x.k),start=fromNum(dnum(p.date)-(p.win||FAC_WIN));
  if(!(s.last&&s.last>=start))return false;const subs=x.subs&&x.subs.length?x.subs:x.sub?[x.sub]:[];
  if(subs.length){const L=subList(BYKEY[x.k]);return subs.every(t=>{const sb=L.find(y=>y.t===t);return !sb||sb.done})}return true}
/* ligado a vários temas: quais ainda faltam para esta prova */
const refMissing=(p,r)=>refTopics(r).filter(x=>!topicStudied(p,x));
function provaPending(p){return p.items.filter(r=>refOk(r)&&!itemStudied(p,r))}
/* prova de uma ou várias disciplinas (prova conjunta): discId = a principal; discIds = todas, só quando há mais de uma.
   sps = SPs ligadas à prova: o que entrar nelas depois entra na prova também (facLinkSync, em saveFac). */
function provaDids(p){const a=Array.isArray(p.discIds)?p.discIds.filter(id=>typeof id==="string"):[];if(p.discId&&!a.includes(p.discId))a.unshift(p.discId);return [...new Set(a)]}
const provaHas=(p,id)=>provaDids(p).includes(id);
const provaDiscs=p=>provaDids(p).map(discOf).filter(Boolean);
const provaDiscName=p=>provaDiscs(p).map(d=>d.name).join(" + ");
const provaSps=p=>Array.isArray(p.sps)?p.sps:[];
function provaSetDids(p,ids){ids=[...new Set(ids)];p.discId=ids[0];if(ids.length>1)p.discIds=ids;else delete p.discIds}
function facLinkSync(){fac.provas.forEach(p=>{if(!Array.isArray(p.items))p.items=[];if(p.discIds!==undefined)provaSetDids(p,provaDids(p));
  if(p.sps===undefined)return;const ds=provaDiscs(p),ok=[];
  provaSps(p).forEach(id=>{if(typeof id!=="string")return;for(const d of ds){const s=d.sps.find(x=>x.id===id);if(s){ok.push(id);s.items.forEach(r=>{if(!p.items.includes(r))p.items.push(r)});break}}});
  if(ok.length)p.sps=[...new Set(ok)];else delete p.sps})}
/* em outra prova? (para não repetir o conteúdo da D2 na D3) */
const refElse=(p,r)=>fac.provas.filter(x=>x.id!==p.id&&x.items.includes(r));
function spElse(p,s){const refs=s.items.filter(refOk);return fac.provas.filter(x=>x.id!==p.id&&(provaSps(x).includes(s.id)||(refs.length&&refs.every(r=>x.items.includes(r)))))}
function spInProva(p,s){const refs=s.items.filter(refOk);return provaSps(p).includes(s.id)||(!!refs.length&&refs.every(r=>p.items.includes(r)))}
function provaSetSp(p,s,on){const ids=new Set(provaSps(p));
  if(on){ids.add(s.id);s.items.forEach(r=>{if(!p.items.includes(r))p.items.push(r)})}
  else{ids.delete(s.id);const keep=new Set(provaDiscs(p).flatMap(d=>d.sps.filter(x=>x!==s&&ids.has(x.id)).flatMap(x=>x.items)));p.items=p.items.filter(r=>!s.items.includes(r)||keep.has(r))}
  if(ids.size)p.sps=[...ids];else delete p.sps}
/* conteúdo de uma disciplina que ainda não está em nenhuma prova (para começar uma prova nova) */
function unassigned(d,p){const refs=[],sps=[];d.sps.forEach(s=>{if(s.items.some(refOk)&&!spElse(p,s).length){sps.push(s.id);s.items.filter(refOk).forEach(r=>refs.push(r))}});
  d.items.filter(refOk).forEach(r=>{if(!refElse(p,r).length)refs.push(r)});return {refs:[...new Set(refs)],sps}}
/* provas em que um conteúdo novo pode entrar: as que incluem a disciplina e ainda não passaram */
const discProvas=d=>fac.provas.filter(p=>provaHas(p,d.id)&&p.date>=today()).sort(byDate);
function daysTo(date){return dnum(date)-dnum(today())}
function inLabel(d){return d===0?"hoje":d===1?"amanhã":`em ${d} dias`}

/* selo na aba Residência */
function facBadge(key){for(const p of upcomingProvas()){if(p.items.some(r=>refTopics(r).some(x=>x.k===key))){const d=discOf(p.discId);return {p,d}}}return null}

/* ---------- busca com siglas (evita duplicatas) ---------- */
const STOP=new Set("de da do das dos e a o as os na no nas nos em com por para um uma ao aos".split(" "));
const SYN={icc:"insuficiencia cardiaca",ic:"insuficiencia cardiaca",iam:"infarto",sca:"coronariana",dac:"coronariana",has:"hipertensao",hipertensao:"hipertens",dm:"diabetes",dm1:"diabetes",dm2:"diabetes",cad:"cetoacidose",ehh:"hiperosmolar",avc:"avc",ave:"avc",tep:"tep",tvp:"tvp",tev:"tev",dpoc:"dpoc",pac:"pneumonia",itu:"trato urinario",ist:"ist",dst:"ist",tb:"tuberculose",hiv:"hiv",aids:"hiv",les:"lupus",ar:"artrite reumatoide",drc:"renal cronica",lra:"renal aguda",ira:"renal aguda",pcr:"pcr",acls:"acls",hda:"digestiva alta",hdb:"digestiva baixa",drge:"drge",dii:"inflamatoria intestinal",sop:"ovarios policisticos",dip:"inflamatoria pelvica",dpp:"descolamento",rpm:"rotura prematura",tpp:"parto prematuro",dmg:"diabetes gestacional",rn:"rn",tce:"tce",trm:"raquimedular",fa:"fibrilacao atrial",bav:"bav",atls:"atls",sus:"sus",aps:"atencao primaria",esf:"esf",pnab:"pnab",raps:"raps",caps:"caps",sua:"sangramento uterino",hpp:"hemorragia pos-parto",nic:"nic",hpv:"hpv",aplv:"aplv",dnpm:"desenvolvimento neuropsicomotor",ivas:"ivas",oma:"otite media",gnpe:"gnpe",ptt:"ptt",pti:"pti",civd:"civd",lma:"lma",lla:"lla",lmc:"lmc",llc:"llc",tdah:"tdah",tea:"autista",tag:"ansiedade",isrs:"isrs",dor:"dor",ecg:"ecg",nnt:"nnt",rr:"risco relativo",or:"odds ratio",vpp:"vpp",vpn:"vpn",siadh:"siadh",pbe:"pbe",chc:"hepatocelular",ccr:"colorretal",hpb:"prostatica",aaa:"aneurisma",daop:"daop"};
function qTokens(q){return norm(q).replace(/[^a-z0-9\s-]/g," ").split(/\s+/).filter(t=>t&&!STOP.has(t)).map(t=>SYN[t]||t)}
function facSearch(q){const toks=qTokens(q);if(!toks.length)return [];
  const score=txt=>{const n=norm(txt);let hit=0;for(const t of toks)if(n.includes(t)||(t.length>4&&n.includes(t.slice(0,t.length-1))))hit++;return hit/toks.length};
  const res=[];
  for(const it of ALL){const sc=score(it.t+" "+(it.sp||""));if(sc>=0.6)res.push({ref:"T:"+it.key,label:it.t,ctx:`${it.area.code} · ${it.sp}`,sc:sc+0.2,kind:"Tema da residência",w:wOf(it)});
    for(const x of subList(it)){const s2=score(x.t);if(s2>=0.6)res.push({ref:"S:"+it.key+":"+x.t,label:x.t,ctx:`Subtópico de ${it.t}`,sc:s2,kind:"Subtópico",w:wOf(it)})}}
  for(const it of FAC_ITEMS){const sc=score(it.t);if(sc>=0.6)res.push({ref:"O:"+it.key.slice(2),label:it.t,ctx:`Seu tema · ${it.sp}`,sc:sc+0.3,kind:"Seu tema"})}
  return res.sort((a,b)=>b.sc-a.sc||(b.w||0)-(a.w||0)).slice(0,8)}
function exactDup(q){const n=norm(q).trim();return FAC_ITEMS.find(it=>norm(it.t).trim()===n)||ALL.find(it=>norm(it.t).trim()===n)}

/* ---------- estrutura: disciplina › eixo › SP ----------
   disc = {id, semId, name, info:{tipo,ch,prof,tutor,horario,local,ementa,objetivos}, items:[ref] (conteúdo avulso, versão antiga),
           eixos:[{id,name,area,spec}], sps:[{id,name,eixoId,items:[ref],objs:[texto]}]}
   O eixo define área e especialidade: os temas da faculdade criados nele aparecem na aba Residência nesse lugar, com o selo FAC.
   Os objetivos da SP viram subtópicos (cs com fac=<id da SP>) do primeiro tema ligado a ela. */
const LV_DEF={disc:"Disciplina",eixo:"Eixo",sp:"SP"};
const lv=sem=>({...LV_DEF,...((sem&&sem.lv)||{})});
/* Lote 11: "S:CM-50:<subtópico>" que foi para outro tema da psiquiatria passa a apontar para ele (e o TDAH ganha o nome novo) */
function facPsyMig(){const fx=r=>{if(typeof r!=="string"||!r.startsWith("S:CM-50:"))return r;const t=r.slice(8),k=PSY_TXT[t];return k?`S:${k}:${PSY_REN[t]||t}`:r};
  const L=a=>Array.isArray(a)?a.map(fx):a;fac.discs.forEach(d=>{d.items=L(d.items);(d.sps||[]).forEach(s=>s.items=L(s.items))});(fac.provas||[]).forEach(p=>{p.items=L(p.items);if(p.done)p.done=L(p.done)});
  for(const id in fac.own){const o=fac.own[id];if(!o||!Array.isArray(o.links))continue;const add=[],drop=new Set();
    o.links.forEach(Ln=>{if(Ln.k!=="CM-50"||!Array.isArray(Ln.subs)||!Ln.subs.length)return;const keep=[];
      Ln.subs.forEach(t=>{const k=PSY_TXT[t];if(!k){keep.push(t);return}const had=o.links.find(z=>z.k===k);if(had){if(had.subs.length)had.subs.push(PSY_REN[t]||t);return}
        let x=add.find(z=>z.k===k);if(!x){x={k,subs:[]};add.push(x)}x.subs.push(PSY_REN[t]||t)});
      if(keep.length!==Ln.subs.length){if(keep.length)Ln.subs=keep;else drop.add(Ln)}});
    if(drop.size||add.length)o.links=[...o.links.filter(Ln=>!drop.has(Ln)),...add]}}
function facNormalize(){fac.discs.forEach(d=>{if(!Array.isArray(d.items))d.items=[];if(!Array.isArray(d.sps))d.sps=[];
  if(!d.info||typeof d.info!=="object")d.info={};if(d.links&&!Array.isArray(d.links))delete d.links;d.sps.forEach(s=>{if(!Array.isArray(s.items))s.items=[];if(!Array.isArray(s.objs))s.objs=[];if(s.links&&!Array.isArray(s.links))delete s.links;if(s.fech!==undefined&&!/^\d{4}-\d{2}-\d{2}$/.test(s.fech))delete s.fech;if(s.fdone&&!Array.isArray(s.fdone))delete s.fdone;if(s.lead!==undefined&&!(Number.isInteger(s.lead)&&s.lead>=1&&s.lead<=30))delete s.lead})});
  facMigrateSP();facPsyMig();facXNorm();
  for(const id in fac.own){const o=fac.own[id];if(!o)continue;if(o.link!==undefined){if(o.link&&!o.links)o.links=[o.link];delete o.link}
    if(o.links!==undefined){const seen=new Set();o.links=(Array.isArray(o.links)?o.links:[]).filter(L=>L&&typeof L==="object"&&typeof L.k==="string"&&RESKEY(L.k)&&!seen.has(L.k)&&seen.add(L.k))
      .map(L=>({k:L.k,subs:Array.isArray(L.subs)?[...new Set(L.subs.filter(t=>typeof t==="string"&&t))]:[]}));if(!o.links.length)delete o.links}}
  facLinkSync()}
/* estrutura de 10/2026: a SP é um conteúdo de estudo (fac.own com o mesmo id da SP, sempre o 1º item dela); o eixo sai e a área dele vai para as SPs;
   UC opcional por semestre (sem.ucs, disc.ucId); disc.div = "sp" (dividida em SPs) ou "" (só lista de conteúdos) */
function facMigrateSP(){
  fac.sems.forEach(s=>{if(s.ucs!==undefined){s.ucs=(Array.isArray(s.ucs)?s.ucs:[]).filter(u=>u&&typeof u.id==="string"&&typeof u.name==="string"&&u.name.trim()).map(u=>({id:u.id,name:u.name.trim().slice(0,40)}));if(!s.ucs.length)delete s.ucs}
    if(s.lv&&typeof s.lv==="object"&&s.lv.eixo!==undefined){delete s.lv.eixo;if(!Object.keys(s.lv).length)delete s.lv}});
  fac.discs.forEach(d=>{const sem=semOf(d.semId);if(d.ucId!==undefined&&!(sem&&(sem.ucs||[]).some(u=>u.id===d.ucId)))delete d.ucId;
    const ex=Array.isArray(d.eixos)?d.eixos:[];
    d.sps.forEach(s=>{const e=s.eixoId&&ex.find(x=>x.id===s.eixoId),area=e&&e.area?{area:e.area,spec:e.spec||""}:null;
      if(typeof s.name!=="string"||!s.name.trim())s.name="SP";
      let o=fac.own[s.id];if(!o||typeof o!=="object"){o=fac.own[s.id]={t:s.name.slice(0,120),discId:d.id,spId:s.id};if(area){o.area=area.area;o.spec=area.spec}
        /* temas da residência que estavam na SP viram ligações dela (a SP passa a contar por eles; nas provas, a SP entra no lugar) */
        const conv=s.items.filter(r=>(r.startsWith("T:")||r.startsWith("S:"))&&refOk(r)),Ls=[];
        conv.forEach(r=>{const x=refTopic(r);if(!x||!RESKEY(x.k))return;let L=Ls.find(y=>y.k===x.k);if(!L){L={k:x.k,subs:[],whole:false};Ls.push(L)}if(x.sub)L.subs.push(x.sub);else L.whole=true});
        Ls.forEach(L=>{L.subs=L.whole?[]:[...new Set(L.subs)];delete L.whole});
        if(Ls.length){o.links=Ls;s.items=s.items.filter(r=>!conv.includes(r));
          fac.provas.forEach(p=>{const hit=p.items.filter(r=>conv.includes(r));if(!hit.length)return;const dn=hit.every(r=>(p.done||[]).includes(r));
            p.items=[...new Set(p.items.map(r=>conv.includes(r)?"O:"+s.id:r))];p.done=(p.done||[]).filter(r=>!conv.includes(r));if(dn&&!p.done.includes("O:"+s.id))p.done.push("O:"+s.id)})}}
      else{o.discId=d.id;o.spId=s.id;if(typeof o.t!=="string"||!o.t.trim())o.t=s.name.slice(0,120)}
      const self="O:"+s.id;if(s.items[0]!==self)s.items=[self,...s.items.filter(r=>r!==self)];
      if(area)s.items.forEach(r=>{if(!r.startsWith("O:"))return;const x=fac.own[r.slice(2)];if(x&&!x.area&&!x.links){x.area=area.area;x.spec=area.spec}});
      if(s.eixoId!==undefined)delete s.eixoId});
    if(d.eixos!==undefined)delete d.eixos;
    if(d.div!=="sp"&&d.div!=="")d.div=d.sps.length||/\b(ncs|tutoria|tbl)\b/.test(norm(String(d.name||"")))?"sp":""})}
const isSelf=(s,r)=>r==="O:"+s.id;
/* conteúdo da faculdade LIGADO a um tema da residência (fac.own[id].link={k,subs}): mantém o nome da faculdade, mas o progresso é o do tema
   (um registro só). subs vazio = o tema inteiro; com subtópicos, o conteúdo conta como estudado quando eles estão marcados. */
const RESKEY=k=>!!BYKEY[k]&&!BYKEY[k].own;
function linkDone(L){const s=get(L.k);if(!s.last)return false;if(!L.subs.length)return true;const SL=subList(BYKEY[L.k]);return L.subs.every(t=>{const y=SL.find(z=>z.t===t);return !y||y.done})}
function ownLinks(id){const o=fac.own[id];return o&&Array.isArray(o.links)?o.links.filter(L=>L&&RESKEY(L.k)):[]}
function ownLink(id){return ownLinks(id)[0]||null}
const ownLinksTo=k=>Object.keys(fac.own).filter(id=>ownLinks(id).some(L=>L.k===k));
const discRefs=d=>[...new Set([...(d.items||[]),...(d.sps||[]).flatMap(s=>s.items)])];
const refsInUse=()=>new Set(fac.discs.flatMap(discRefs));
function spOf(id){for(const d of fac.discs){const s=(d.sps||[]).find(x=>x.id===id);if(s)return {d,s}}return null}
const refOfItem=it=>it.own?"O:"+it.key.slice(2):"T:"+it.key;
const spShort=n=>{const m=String(n||"").match(/^\s*([A-Za-zÀ-ú]{1,12}\.?\s*\d+(?:[.,]\d+)*)/);return m?m[1].trim():(String(n||"").length>28?String(n).slice(0,26)+"…":String(n||""))};
const spClean=n=>String(n||"").replace(/^\s*(sp|ncs|ap|aula|problema|tutoria|m[oó]dulo)\s*[\d.]+\s*[-–:·.]?\s*/i,"").trim()||String(n||"");
function areaMapLabel(m){const A=AREAS.find(a=>a.code===m.area);return A?`${A.code} · ${m.spec||"Faculdade"}`:"Só na Faculdade"}
/* sugere área e especialidade pelo nome do eixo (ex.: "Eixo de Hematologia" -> CM · Hematologia e oncologia) */
function suggestMap(name){const n=norm(name);
  const hint=/pediatr|neonat|puericult|infancia|crianca/.test(n)?"PED":/obstet|ginec|gestac|saude da mulher|mama/.test(n)?"GO":/cirurg|trauma|ortoped|urolog/.test(n)?"CIR":/coletiva|preventiv|\bsus\b|epidemio|atencao primaria|familia|comunidade|iesc/.test(n)?"PREV":null;
  let best=null,bs=0;
  AREAS.forEach(a=>a.specs.forEach(sp=>{let sc=0;norm(sp.name).split(/[^a-z]+/).filter(w=>w.length>4&&!STOP.has(w)).forEach(w=>{if(n.includes(w.slice(0,Math.max(5,w.length-2))))sc++});
    if(sc&&hint===a.code)sc+=.5;if(sc>bs){bs=sc;best={area:a.code,spec:sp.name}}}));
  return best&&bs>=1?best:{area:"",spec:""}}
/* lugar de um tema próprio: área/especialidade do eixo da SP (ou o que foi escolhido nele) */
/* lugar de um conteúdo da faculdade na aba Residência: a área escolhida nele; dentro de uma SP, a área da SP */
function ownPlace(o){const d=discOf(o.discId);let area=o.area,spec=o.spec,spName="";
  const f=o.spId&&spOf(o.spId),self=f&&fac.own[f.s.id]===o;if(f&&!self){spName=f.s.name;const so=fac.own[f.s.id];if(!area&&so&&so.area){area=so.area;spec=so.spec}if(!area){const L0=ownLinks(f.s.id)[0],it=L0&&BYKEY[L0.k];if(it&&it.area&&it.area.code){area=it.area.code;spec=it.sp}}}
  const A=AREAS.find(a=>a.code===area);
  const dn=(f&&f.d.name)||(d&&d.name);
  return {A,spec:A?(spec||"Faculdade"):(dn||"Faculdade"),origin:[dn,spName&&spShort(spName)].filter(Boolean).join(" · "),originFull:[dn,spName].filter(Boolean).join(" · ")}}
/* temas ligados a SPs dos semestres ativos (para o selo na aba Residência) */
function facLinkMap(){const m={},act=new Set(activeSems());
  fac.discs.forEach(d=>{if(!act.has(d.semId))return;(d.sps||[]).forEach(s=>s.items.forEach(r=>refTopics(r).forEach(x=>{if(!m[x.k])m[x.k]={d,s}})));
    (d.items||[]).forEach(r=>refTopics(r).forEach(x=>{if(!m[x.k])m[x.k]={d,s:null}}))});return m}
/* objetivos -> subtópicos do tema principal da SP */
const primaryRef=s=>s.items.find(r=>(r.startsWith("T:")||r.startsWith("O:"))&&refOk(r));
function syncObjs(s){const r=primaryRef(s);if(!r)return false;const k=refTopic(r).k,it=BYKEY[k];if(!it)return false;
  const s0=JSON.stringify(get(k).cs||[]);let moved=false;
  // objetivos que ficaram num tema que não é mais o principal (ligação trocada, estrutura antiga) saem de lá
  s.items.forEach(r2=>refTopics(r2).forEach(x=>{if(x.k!==k&&state[x.k]&&(state[x.k].cs||[]).some(c=>c.fac===s.id)){dropObjs(s,x.k);moved=true}}));
  ["F-"+s.id].forEach(fk=>{if(fk!==k&&state[fk]&&(state[fk].cs||[]).some(c=>c.fac===s.id)){dropObjs(s,fk);moved=true}});
  upd(k,x=>{const cs=(x.cs||[]).filter(c=>c.fac!==s.id||s.objs.includes(c.t));
    s.objs.forEach(t=>{if(!cs.some(c=>c.t===t)&&!it.subs.includes(t))cs.push({t,d:false,fac:s.id})});
    if(cs.length)x.cs=cs;else delete x.cs});
  return moved||JSON.stringify(get(k).cs||[])!==s0}
/* uma vez por carga (com a conta já lida): objetivos no lugar certo depois da migração */
function facSyncAll(){let ch=false;fac.discs.forEach(d=>(d.sps||[]).forEach(s=>{if(s.objs.length||s.items.length>1)if(syncObjs(s))ch=true}));if(ch)persist()}
function dropObjs(s,k){if(!state[k]||!state[k].cs)return;upd(k,x=>{x.cs=(x.cs||[]).filter(c=>c.fac!==s.id);if(!x.cs.length)delete x.cs})}

/* ---------- ações ---------- */
function addSem(name){const s={id:fuid(),name,archived:false};fac.sems.push(s);facOpenSem.add(s.id);saveFac();render()}
function addDisc(semId,name,ucId){const d={id:fuid(),semId,name,items:[],sps:[],info:{},div:/\b(ncs|tutoria|tbl)\b/.test(norm(name))?"sp":""};const sm=semOf(semId);if(ucId&&sm&&(sm.ucs||[]).some(u=>u.id===ucId))d.ucId=ucId;
  fac.discs.push(d);facOpenDisc.add(d.id);facAddC=d.id;facNew["ckind"+d.id]=d.div==="sp"?"sp":"c";facNewDiscFor=null;saveFac();render();setTimeout(()=>{const x=document.getElementById("fq-c"+d.id);if(x){x.scrollIntoView({behavior:"smooth",block:"center"});x.focus({preventScroll:true})}},60)}
/* nova SP = um conteúdo de estudo com o mesmo id (o 1º item dela); opções: area {area,spec}, links [chaves da residência], pid (prova) */
function addSP(d,a,b){const legacy=typeof b==="string",name=String(legacy?b:a||"").trim().slice(0,120),o2=legacy?{}:(b||{});if(!name)return null;
  const id=fuid(),s={id,name,items:["O:"+id],objs:[]},o={t:name,discId:d.id,spId:id};if(o2.area&&o2.area.area&&!(o2.links&&o2.links.length)){o.area=o2.area.area;o.spec=o2.area.spec||""}
  fac.own[id]=o;d.sps.push(s);if(d.div!=="sp")d.div="sp";(o2.links||[]).forEach(k=>linkOwnRaw(id,k,[]));
  const p=o2.pid&&fac.provas.find(x=>x.id===o2.pid);if(p)provaSetSp(p,s,true);
  facOpenSP.add(id);facQuery["c"+d.id]="";saveFac();commit();return s}
/* conteúdo direto da disciplina (da faculdade) vira SP, com tudo o que já tinha */
function toSP(d,r){if(!r.startsWith("O:"))return;const id=r.slice(2),o=fac.own[id];if(!o||d.sps.some(s=>s.id===id))return;
  d.items=d.items.filter(x=>x!==r);d.sps.push({id,name:o.t,items:[r],objs:[]});o.spId=id;o.discId=d.id;if(d.div!=="sp")d.div="sp";
  fac.provas.forEach(p=>{if(p.items.includes(r)&&provaHas(p,d.id))p.sps=[...new Set([...provaSps(p),id])]});facOpenSP.add(id);saveFac();commit()}
const SP_RE=/^\s*(sp|problema|situa[cç][aã]o[- ]problema)\s*\d/i;
/* mover um conteúdo (para outra disciplina, para fora da SP ou para dentro de outra SP), levando progresso, anotações e erros */
function moveRef(d,s,r,to){const kind=to.slice(0,1),tid=to.slice(2),f=kind==="s"&&spOf(tid),td=kind==="d"?discOf(tid):f&&f.d,ts=f?f.s:null;if(!td)return;
  if(s&&!s.pseudo){s.items=s.items.filter(x=>x!==r);const x=refTopic(r);if(x)dropObjs(s,x.k)}else d.items=d.items.filter(x=>x!==r);
  if(ts){if(!ts.items.includes(r))ts.items.push(r)}else if(!td.items.includes(r))td.items.push(r);
  if(r.startsWith("O:")){const o=fac.own[r.slice(2)];if(o){o.discId=td.id;if(ts)o.spId=ts.id;else delete o.spId}}
  if(td!==d)fac.provas.forEach(p=>{if(p.items.includes(r)&&!provaHas(p,td.id)&&!discRefs(d).includes(r)){p.items=p.items.filter(x=>x!==r);p.done=(p.done||[]).filter(x=>x!==r)}});
  if(s&&!s.pseudo)syncObjs(s);if(ts)syncObjs(ts);facOpenSem.add(td.semId);facOpenDisc.add(td.id);if(ts)facOpenSP.add(ts.id);saveFac();commit()}
function moveSP(d,s,tid){const td=discOf(tid);if(!td||td===d)return;
  fac.provas.forEach(p=>{if(provaHas(p,td.id))return;if(provaSps(p).includes(s.id))provaSetSp(p,s,false);else p.items=p.items.filter(r=>!s.items.includes(r))});
  d.sps=d.sps.filter(x=>x!==s);td.sps.push(s);if(td.div!=="sp")td.div="sp";s.items.forEach(r=>{if(r.startsWith("O:")){const o=fac.own[r.slice(2)];if(o)o.discId=td.id}});
  facOpenSem.add(td.semId);facOpenDisc.add(td.id);facOpenSP.add(s.id);saveFac();commit()}
function moveEl(d,s,r,L){const w=el(`<label class="fmove">Mover para <select class="fmapsel"></select></label>`),se=w.querySelector("select");se.id=("fmv-"+(r?r+"-"+(s&&!s.pseudo?s.id:d.id):s.id)).replace(/[^\w-]/g,"_");
  const add=(p,v,txt)=>{const o=document.createElement("option");o.value=v;o.textContent=txt;p.appendChild(o)};add(se,"","Escolha…");
  fac.sems.filter(x=>!x.archived||x.id===d.semId).forEach(sm=>{const g=document.createElement("optgroup");g.label=sm.name;semDiscs(sm.id).forEach(x=>{
      if(r){if(x!==d||(s&&!s.pseudo))add(g,"d:"+x.id,x===d?`${x.name} (fora da ${L.sp})`:x.name);x.sps.forEach(sp=>{if(sp!==s)add(g,"s:"+sp.id,`${x.name} › ${spShort(sp.name)}`)})}
      else if(x!==d)add(g,"d:"+x.id,x.name)});if(g.children.length)se.appendChild(g)});
  se.onchange=()=>{const v=se.value;if(!v)return;if(r)moveRef(d,s,r,v);else moveSP(d,s,v.slice(2))};if(se.options.length<2)w.hidden=true;return w}
/* área de um conteúdo da faculdade (não ligado) na aba Residência */
function areaEl(id){const o=fac.own[id],pl=ownPlace(o),w=el(`<span class="fmove farea">Área na Residência </span>`);
  w.appendChild(mapPicker({area:pl.A?pl.A.code:"",spec:pl.A?pl.spec:""},x=>{if(x.area){o.area=x.area;o.spec=x.spec||""}else{delete o.area;delete o.spec}
    saveFac();commit()},"a"+id));return w}
/* ações do conteúdo aberto: mover, virar SP, renomear, tirar */
function rowActs(d,s,r,L,onRemove){const w=el(`<div class="frmrow fracts"></div>`),inSP=s&&!s.pseudo,own=r.startsWith("O:")&&fac.own[r.slice(2)];
  w.appendChild(moveEl(d,s,r,L));
  if(own&&!inSP){const b=el(`<button class="link" type="button"></button>`);b.id="ftosp-"+r.slice(2);b.textContent=`Transformar em ${L.sp}`;b.title=`Vira uma ${L.sp}: ganha objetivos, fechamento e “cai na prova”`;b.onclick=()=>toSP(d,r);w.appendChild(b)}
  if(own){const k="o"+r.slice(2);if(facEdit===k)w.appendChild(nameEdit(k,own.t,v=>{own.t=v.slice(0,120)}));else{const b=el(`<button class="link" type="button">renomear</button>`);b.onclick=()=>{openEdit(k);render()};w.appendChild(b)}}
  if(own&&!ownLinks(r.slice(2)).length)w.appendChild(areaEl(r.slice(2)));
  w.appendChild(armBtn("x"+(inSP?s.id:d.id)+r,inSP?`tirar da ${L.sp}`:"tirar da disciplina","Toque de novo para tirar (se for da residência, ele continua lá)",inSP?(()=>spRemove(d,s,r)):(onRemove||(()=>removeFromDisc(d,r)))));
  return w}
function provaPut(pid,ref){const p=pid&&fac.provas.find(x=>x.id===pid);if(p&&!p.items.includes(ref))p.items.push(ref);return p}
function addToDisc(d,ref,pid){if(!d.items.includes(ref))d.items.push(ref);provaPut(pid,ref);facQuery[d.id]="";saveFac();render()}
function createOwn(d,t){const id=fuid();fac.own[id]={t:t.trim().slice(0,120),discId:d.id};d.items.push("O:"+id);facQuery[d.id]="";saveFac();render();return id}
function spAdd(d,s,ref){if(!s.items.includes(ref))s.items.push(ref);facQuery["sp"+s.id]="";saveFac();syncObjs(s);commit()}
function spCreateOwn(d,s,t,links){t=t.trim().slice(0,120);if(!t)return;const dup=exactDup(t);if(dup){spAdd(d,s,refOfItem(dup));return}
  const id=fuid();fac.own[id]={t,discId:d.id,spId:s.id};s.items.push("O:"+id);facQuery["sp"+s.id]="";(links||[]).forEach(k=>linkOwnRaw(id,k,[]));saveFac();syncObjs(s);commit();return id}
function dropRefEverywhere(d,ref){// tira o conteúdo das provas da disciplina e apaga o tema próprio se ninguém mais usa
  if(!discRefs(d).includes(ref))fac.provas.filter(p=>provaHas(p,d.id)&&!provaDiscs(p).some(x=>x!==d&&discRefs(x).includes(ref))).forEach(p=>{p.items=p.items.filter(r=>r!==ref);p.done=(p.done||[]).filter(r=>r!==ref)});
  if(ref.startsWith("O:")&&!refsInUse().has(ref))purgeOwn(ref.slice(2))}
function spRemove(d,s,ref){s.items=s.items.filter(r=>r!==ref);const x=refTopic(ref);if(x)dropObjs(s,x.k);dropRefEverywhere(d,ref);saveFac();syncObjs(s);persist();render()}
function delSP(d,s){toTrash("sp",s.name,d.name,{discId:d.id,s:JSON.parse(JSON.stringify(s)),os:ownSnap(s.items),pv:fac.provas.filter(p=>provaHas(p,d.id)).map(p=>({id:p.id,items:[...p.items],done:[...(p.done||[])],sp:provaSps(p).includes(s.id)}))});trSkip=true;
  try{const refs=[...s.items];refs.forEach(r=>{const x=refTopic(r);if(x)dropObjs(s,x.k)});d.sps=d.sps.filter(x=>x!==s);refs.forEach(r=>dropRefEverywhere(d,r))}finally{trSkip=false}saveFac();persist();render()}
function removeFromDisc(d,ref){d.items=d.items.filter(r=>r!==ref);dropRefEverywhere(d,ref);saveFac();persist();render()}
/* apaga um tema próprio e tudo que é dele (também na conta) */
function purgeOwn(id){const k="F-"+id;delete fac.own[id];delete state[k];if(notes[k])saveNote(k,"");
  errors.filter(e=>e.k===k).forEach(e=>{if(errStore)errStore.doc(e.id).delete().catch(()=>{})});errors=errors.filter(e=>e.k!==k);saveErrsLocal();
  if(dayPlan&&dayPlan.items.some(x=>x.k===k)){dayPlan.items=dayPlan.items.filter(x=>x.k!==k);savePlan()}}
/* passa anotações, erros, cartões, questões para refazer, sessões de foco e progresso do conteúdo próprio (F-id) para o tema da residência */
function ownMergeInto(id,toK){const fk="F-"+id,to={k:toK};
  if(notes[fk]){const cur=(notes[to.k]||"").replace(/\s+$/,"");saveNote(to.k,(cur?cur+"\n\n---\n\n":"")+"## Da faculdade: "+fac.own[id].t+"\n"+notes[fk]);trSkip=true;try{saveNote(fk,"")}finally{trSkip=false}}// a anotação mudou de lugar: não vai para a lixeira
  errors.forEach(e=>{if(e.k===fk){e.k=to.k;putErr(e)}});saveErrsLocal();
  const fs=state[fk];if(fs){upd(to.k,x=>{if(fs.last&&(!x.last||fs.last>x.last)){x.last=fs.last;x.step=fs.step||0}x.l=Math.max(x.l||0,fs.l||0);x.qc=(x.qc||0)+(fs.qc||0);x.qt=(x.qt||0)+(fs.qt||0);if(fs.qd){const m={...(x.qd||{})};for(const d in fs.qd){const a=m[d]||[0,0],b2=fs.qd[d]||[0,0];m[d]=[a[0]+(b2[0]||0),a[1]+(b2[1]||0)]}x.qd=m}
    const cs=[...(x.cs||[]),...(fs.cs||[]).filter(c=>!(x.cs||[]).some(y=>y.t===c.t))];if(cs.length)x.cs=cs});delete state[fk];if(!state[to.k].qt){delete state[to.k].qt;delete state[to.k].qc;delete state[to.k].qd}}
  if(dayPlan)dayPlan.items.forEach(x=>{if(x.k===fk)x.k=to.k});
  cards.forEach(c=>{if(c.k===fk){c.k=toK;cdPut(c)}});redo.forEach(x=>{if(x.k===fk){x.k=toK;rdPut(x)}});
  foSess.forEach(x=>{if(x.ref==="T:"+fk){x.ref="T:"+toK;foPut(x)}});}
function replaceOwn(id,ref){const from="O:"+id,to=refTopic(ref);if(!to)return;
  const swap=a=>[...new Set(a.map(r=>r===from?ref:r))];
  fac.discs.forEach(d=>{d.items=swap(d.items);(d.sps||[]).forEach(s=>s.items=swap(s.items))});
  fac.provas.forEach(p=>{p.items=swap(p.items);p.done=(p.done||[]).map(r=>r===from?ref:r);if(p.rv&&p.rv[from]){p.rv[ref]=[...new Set([...(p.rv[ref]||[]),...p.rv[from]])].sort();delete p.rv[from]}});
  ownMergeInto(id,to.k);
  delete fac.own[id];facReplace=null;saveFac();commit()}
/* ligar sem substituir: o nome fica, o progresso passa a ser o do tema (o que o conteúdo próprio já tinha vai para o tema) */
/* ligar sem substituir: o nome fica, o progresso passa a ser o do(s) tema(s) da residência. O 1º tema ligado é o principal e recebe o que o
   conteúdo já tinha (anotações, erros, cartões, questões, foco). from = o tema que está sendo trocado (Trocar ligação) */
function linkOwnRaw(id,k,subs,from){const o=fac.own[id],it=BYKEY[k];if(!o||!RESKEY(k))return false;const fk="F-"+id,had=state[fk]&&state[fk].last;
  const Ls=ownLinks(id);if(!Ls.length)ownMergeInto(id,k);const nL={k,subs:[...new Set(subs||[])]};
  let put=false;const arr=[];Ls.forEach(L=>{if(L.k===k||(from&&L.k===from)){if(!put){arr.push(nL);put=true}}else arr.push(L)});if(!put)arr.push(nL);o.links=arr;
  if(had&&nL.subs.length)upd(k,x=>{const L=subList(it);nL.subs.forEach(t=>{const y=L.find(z=>z.t===t);if(!y||y.done)return;
    if(y.i!==undefined){const sd=new Set(x.sd||[]);sd.add(y.i);x.sd=[...sd].sort((a,b)=>a-b);x.sv=2}else x.cs=(x.cs||[]).map((c,j)=>j===y.j?{...c,d:true}:c)})});
  return true}
function linkOwn(id,k,subs,from){const pk=refTopic("O:"+id);if(!linkOwnRaw(id,k,subs,from))return;facLinkSt=null;saveFac();const f=fac.own[id]&&fac.own[id].spId&&spOf(fac.own[id].spId);
  if(f){if(pk&&pk.k!==refTopic("O:"+id).k)dropObjs(f.s,pk.k);syncObjs(f.s)}commit()}
/* desligar: volta a ser um conteúdo só da faculdade, começando do zero (o tema da residência fica com todo o progresso) */
/* desligar um tema (ou todos, sem k): sem nenhum, volta a ser um conteúdo só da faculdade, começando do zero (os temas ficam com o progresso) */
function unlinkOwn(id,k){const o=fac.own[id];if(!o||!o.links)return;const gone=o.links.filter(L=>!k||L.k===k).map(L=>L.k);o.links=k?o.links.filter(L=>L.k!==k):[];if(!o.links.length)delete o.links;facLinkSt=null;saveFac();
  const f=o.spId&&spOf(o.spId);if(f){gone.forEach(x=>dropObjs(f.s,x));syncObjs(f.s)}commit()}
/* ---------- colar a ementa: o Claude organiza, você revisa ---------- */
function ementaPrompt(sem,txt){const L=lv(sem);
  const specs=AREAS.flatMap(a=>a.specs.map(s=>`${a.code} | ${s.name}`)).join("\n");
  const temas=ALL.map(it=>`${it.key} | ${it.t} | ${it.area.code} · ${it.sp}`).join("\n");
  return `Você organiza a ementa de um curso de medicina e liga cada situação-problema aos temas de um checklist de residência médica.
O curso usa os níveis: ${L.disc} (ex.: NCS – Tutoria) › ${L.sp} (ex.: SP 2.1 Hemostasia e Distúrbios da Coagulação). Em "eixos", agrupe as ${L.sp}s pela especialidade (ex.: Eixo de Hematologia); o grupo serve só para escolher a área.
Semestre: ${sem.name}.

Texto colado pelo aluno:
"""
${txt.slice(0,20000)}
"""

Áreas e especialidades disponíveis (área | especialidade):
${specs}

Temas do checklist (chave | tema | área · especialidade):
${temas}

Responda SOMENTE com JSON neste formato:
{"disciplinas":[{"nome":"","tipo":"","cargaHoraria":"","professor":"","tutor":"","horarios":"","ementa":"","eixos":[{"nome":"","area":"","especialidade":"","sps":[{"nome":"","objetivos":[""],"temas":[""],"novos":[""]}]}]}]}

Regras:
- Use só o que está no texto. O que não houver fica "" ou []. Nunca invente objetivos, professores ou horários.
- Mantenha nomes e códigos como no texto (ex.: "SP 2.1 Hemostasia e Distúrbios da Coagulação").
- "area" e "especialidade": escolha da lista pela especialidade do eixo (ex.: Eixo de Hematologia = CM | Hematologia e oncologia). Ciclo básico ou sem correspondente: "" e "".
- "temas": chaves do checklist claramente relacionadas à ${L.sp} (no máximo 4).
- "novos": conteúdos da ${L.sp} que não existem no checklist (ex.: anatomia, fisiologia, cascata da coagulação), com nomes curtos; nunca repita o que já está em "temas".
- Sem eixo ou especialidade no texto: use um único eixo com "nome":"" contendo as ${L.sp}s.`}
function ementaParse(j){const A=v=>Array.isArray(v)?v:[],S=v=>typeof v==="string"?v.trim():"";
  const ds=A(j&&j.disciplinas).map(d=>({inc:true,nome:S(d.nome).slice(0,80),
    info:{tipo:S(d.tipo),ch:S(d.cargaHoraria),prof:S(d.professor),tutor:S(d.tutor),horario:S(d.horarios),ementa:S(d.ementa).slice(0,6000)},
    eixos:A(d.eixos).map(e=>{const ar=AREAS.find(a=>a.code===S(e.area)),sp=ar&&ar.specs.find(x=>norm(x.name)===norm(S(e.especialidade)));
      const m=ar?{area:ar.code,spec:sp?sp.name:S(e.especialidade)}:suggestMap(S(e.nome));
      return {inc:true,nome:S(e.nome).slice(0,80),area:m.area,spec:m.spec,
        sps:A(e.sps).map(s=>({inc:true,nome:S(s.nome).slice(0,120),objs:A(s.objetivos).map(S).filter(Boolean).slice(0,30),
          temas:[...new Set(A(s.temas).map(S).filter(k=>BYKEY[k]&&!BYKEY[k].own))].slice(0,6),
          novos:[...new Set(A(s.novos).map(S).filter(Boolean).map(t=>t.slice(0,120)))].slice(0,8)})).filter(s=>s.nome)}})})).filter(d=>d.nome||d.eixos.length);
  return ds}
function ementaApply(semId,ds){const made={};let nd=0,ns=0,nt=0;
  ds.filter(x=>x.inc).forEach(pd=>{let d=fac.discs.find(x=>x.semId===semId&&norm(x.name)===norm(pd.nome||"Disciplina"));
    if(!d){d={id:fuid(),semId,name:pd.nome||"Disciplina",items:[],sps:[],info:{},div:""};fac.discs.push(d);nd++}
    for(const k in pd.info)if(pd.info[k]&&!d.info[k])d.info[k]=pd.info[k];facOpenDisc.add(d.id);
    pd.eixos.filter(x=>x.inc).forEach(pe=>{const area=pe.area?{area:pe.area,spec:pe.spec||""}:null;
      pe.sps.filter(x=>x.inc).forEach(ps=>{let s=d.sps.find(x=>norm(x.name)===norm(ps.nome));
        if(!s){const id=fuid();s={id,name:ps.nome,items:["O:"+id],objs:[]};fac.own[id]={t:ps.nome,discId:d.id,spId:id,...(area?{area:area.area,spec:area.spec}:{})};d.sps.push(s);ns++}
        d.div="sp";ps.temas.forEach(k=>{if(RESKEY(k))linkOwnRaw(s.id,k,[])});
        ps.novos.forEach(t=>{const key=norm(t).trim(),dup=exactDup(t);let r=dup?refOfItem(dup):made[key];
          if(!r){const id=fuid();fac.own[id]={t,discId:d.id,spId:s.id,...(area?{area:area.area,spec:area.spec}:{})};r=made[key]="O:"+id;nt++}if(!s.items.includes(r))s.items.push(r)});
        ps.objs.forEach(o=>{if(!s.objs.includes(o))s.objs.push(o)})})})});
  saveFac();fac.discs.filter(d=>d.semId===semId).forEach(d=>d.sps.forEach(syncObjs));commit();
  return {nd,ns,nt}}
async function ementaRun(sem){const I=facImport;if(!sampleFn||!I.text.trim())return;
  I.status="loading";I.msg="";I.ctl=new AbortController();render();
  try{const j=await sampleFn.json(ementaPrompt(sem,I.text),{signal:I.ctl.signal,cache:false,modelTier:"default"});
    const ds=ementaParse(j);if(!ds.length){I.status="error";I.msg="Não encontrei disciplinas nesse texto. Confira se colou a ementa ou o cronograma inteiro.";render();return}
    I.prop=ds;I.status="review";render()}
  catch(e){const code=e&&e.code;if(code==="cancelled"){I.status=I.prop?"review":"edit";render();return}
    I.status="error";I.msg=GEN_OFF.includes(code)?"O Claude não está disponível nesta visualização. Cadastre à mão abaixo.":(GEN_ERR[code]||"Não foi possível organizar agora. Tente de novo ou cadastre à mão.");render()}}

/* ---------- renderização ---------- */
function searchBox(d,mode){// mode: "disc" (adicionar conteúdo), {replace:id} ou {link:id}
  const key=mode==="disc"?d.id:mode.link?"lnk-"+mode.link:"rep-"+mode.replace;const q=facQuery[key]||"";
  const box=el(`<div class="fsearch"><input class="etext" type="search" placeholder="${mode==="disc"?"Adicionar conteúdo: digite o assunto (ex.: ICC, Critérios de Duke, Anatomia do coração)":mode.link?"Buscar o tema da residência (ex.: anemias)":"Buscar o tema da residência equivalente"}" aria-label="Buscar conteúdo"><ul class="fres"></ul></div>`);
  const inp=box.querySelector("input");inp.id="fq-"+key;inp.value=q;inp.oninput=()=>{facQuery[key]=inp.value;render()};
  const ul=box.querySelector("ul");
  if(q.trim().length>=2){
    let res=facSearch(q);if(mode!=="disc")res=res.filter(r=>!r.ref.startsWith("O:"));if(mode.link){const has=new Set(ownLinks(mode.link).map(L=>L.k).filter(k=>!(facLinkSt&&facLinkSt.from===k)));res=res.filter(r=>{const x=refTopic(r.ref);return x&&RESKEY(x.k)&&!has.has(x.k)})}
    res.forEach(r=>{const has=mode==="disc"&&d.items.includes(r.ref);
      const li=el(`<li><div class="frl"><b></b><span></span></div><button class="mini" type="button"></button></li>`);
      li.querySelector("b").textContent=r.label;li.querySelector("span").textContent=r.kind+" · "+r.ctx;
      const b=li.querySelector("button");b.textContent=has?"Já está na disciplina":mode==="disc"?"Usar este":mode.link?"Ligar a este":"Substituir por este";b.disabled=has;
      b.onclick=()=>{if(mode==="disc")addToDisc(d,r.ref);else if(mode.link){const x=refTopic(r.ref);facLinkSt={...(facLinkSt&&facLinkSt.id===mode.link?facLinkSt:{}),id:mode.link,k:x.k,all:!x.sub,subs:x.sub?[x.sub]:[]};facQuery[key]="";render()}else replaceOwn(mode.replace,r.ref)};ul.appendChild(li)});
    if(mode==="disc"){const dup=exactDup(q),near=res.length>0;
      const li=el(`<li class="fcreate"><div class="frl"><b></b><span></span></div><button class="mini" type="button"></button></li>`);
      li.querySelector("b").textContent=`Criar tema próprio: “${q.trim()}”`;
      li.querySelector("span").textContent=dup?"Já existe um tema com esse nome: use o resultado acima.":near?"Há conteúdos parecidos acima. Confira antes de criar para evitar duplicata.":"Nada parecido encontrado.";
      const b=li.querySelector("button");b.textContent=near?"Criar mesmo assim":"Criar";b.disabled=!!dup;b.onclick=()=>createOwn(d,q);ul.appendChild(li)}
    if(!res.length&&mode!=="disc")ul.appendChild(el(`<li class="empty" style="padding:4px 0">Nada encontrado. Tente outro termo ou a sigla.</li>`));
  }
  return box}

function ownDetailRow(it){const open=openKey===it.key,s=get(it.key),dd=dueIn(s);
  const li=el(`<li class="t${open?" open":""}" id="t-${it.key}"><button class="item" aria-expanded="${open}"><span class="num">FAC</span><span class="topic"></span><span class="lvl" data-l="${lvKey(s)}">${lvName(s)}</span><span class="meta"></span></button></li>`);
  li.querySelector(".topic").textContent=it.t;const m=li.querySelector(".meta");
  if(dd!==null)m.appendChild(el(`<span class="${dd<=0?"late":""}">${dueLabel(dd)}</span>`));
  const [sd,st]=subCount(it);if(st)m.appendChild(el(`<span>${sd}/${st} subtópicos</span>`));if(notes[it.key])m.appendChild(el(`<span>com anotações</span>`));
  if(!m.children.length)m.appendChild(el(`<span>tema próprio</span>`));
  li.querySelector(".item").onclick=()=>{openKey=open?null:it.key;formErr="";subErr="";render()};
  if(open){const det=renderDetail(it);det.appendChild(dupBox(it));li.appendChild(det)}
  return li}
/* tema da faculdade repetido de um tema da residência: troca, levando tudo junto */
function dupBox(it){const id=it.key.slice(2),o=fac.own[id],w=el(`<div class="fdup"></div>`);w.appendChild(linkPickEl(id));if(!(o&&o.spId===id))w.appendChild(dupBox0(it,id));return w}
/* conteúdo ligado a vários temas: anotações, erros e cartões de cada um, juntos (só leitura; cada tema guarda os seus) */
function linkedAllEl(x){const g=el(`<div class="grp flinkall"><span class="glabel">Temas ligados</span></div>`);
  x.links.forEach((L,i)=>{const it=BYKEY[L.k];if(!it)return;const n=(notes[L.k]||"").trim(),ne=errors.filter(e=>e.k===L.k&&!e.arch).length,nc=cards.filter(c=>c.k===L.k).length;
    const r=el(`<div class="flarow"><div class="flah"><b></b><span class="ks"></span><button class="link" type="button">abrir</button></div></div>`);r.querySelector("b").textContent=it.t;
    r.querySelector(".ks").textContent=[i?"":"principal",linkDone(L)?"estudado":"a estudar",n?"com anotação":"sem anotação",ne?`${ne} ${ne===1?"erro":"erros"}`:"",nc?`${nc} ${nc===1?"cartão":"cartões"}`:""].filter(Boolean).join(" · ");
    r.querySelector(".link").onclick=()=>openTopic(L.k);
    if(n){const dd=el(`<details class="plain"><summary>Ver a anotação</summary><div class="mdview"></div></details>`);dd.querySelector(".mdview").innerHTML=mdC(n);r.appendChild(dd)}
    g.appendChild(r)});
  g.appendChild(el(`<p class="how hx">Cada tema guarda as próprias anotações, erros e cartões. Aqui aparece tudo junto; para editar, abra o tema.</p>`));return g}
function linkPickEl(id){const Ls=ownLinks(id),o=fac.own[id]||{},g=el(`<div class="grp flink"><span class="glabel"></span><p class="gtext how"></p></div>`);
  g.querySelector(".glabel").textContent=Ls.length?"Ligado à residência":"Ligar a um tema da residência";
  g.querySelector(".how").textContent=Ls.length?"O progresso é o dos temas abaixo: estudar, revisar ou fazer questões em qualquer um deles avança aqui também. Com mais de um tema, conta como estudado quando todos estiverem estudados.":"Mantém este nome aqui na Faculdade, mas o progresso passa a ser o do tema da residência: estudar, revisar ou fazer questões em qualquer um dos dois avança os dois. Dá para ligar ao tema inteiro ou só a alguns subtópicos, e a mais de um tema.";
  if(Ls.length){const ul=el(`<ul class="flklist"></ul>`);Ls.forEach((L,i)=>{const it=BYKEY[L.k],li=el(`<li><span class="frl"><b></b><span></span></span><span class="flkb"></span></li>`);
      li.querySelector("b").textContent=it.t;li.querySelector(".frl span").textContent=[i||Ls.length<2?"":"principal",L.subs.length?`${L.subs.length} ${L.subs.length===1?"subtópico":"subtópicos"}`:"tema inteiro",linkDone(L)?"estudado":"a estudar"].filter(Boolean).join(" · ");
      const b=li.querySelector(".flkb"),op=el(`<button class="link" type="button">abrir</button>`);op.onclick=()=>openTopic(L.k);
      const ch=el(`<button class="link" type="button">trocar</button>`);ch.id=`flkch-${id}-${i}`;ch.onclick=()=>{facLinkSt={id,k:L.k,from:L.k,all:!L.subs.length,subs:[...L.subs]};render()};
      b.append(op,ch,armBtn("unl"+id+"-"+i,"desligar",Ls.length>1?"Toque de novo para desligar este tema":"Toque de novo: volta a ser só da faculdade, começando do zero",()=>unlinkOwn(id,L.k)));ul.appendChild(li)});g.appendChild(ul)}
  const st=facLinkSt&&facLinkSt.id===id?facLinkSt:null;
  if(!st){if(!Ls.length&&o.t){const sug=facSearch(spClean(o.t)).filter(r=>r.ref.startsWith("T:")&&RESKEY(r.ref.slice(2))).slice(0,3);
      if(sug.length){const w=el(`<div class="fsug"><span class="ks">Parecidos na residência:</span><div class="chips"></div></div>`);sug.forEach((r,i)=>{const b=el(`<button class="chip" type="button"></button>`);b.id=`flsg-${id}-${i}`;b.textContent="+ "+r.label;b.title="Ligar ao tema inteiro";b.onclick=()=>linkOwn(id,r.ref.slice(2),[]);w.querySelector(".chips").appendChild(b)});g.appendChild(w)}}
    const b=el(`<button class="btn" type="button" style="align-self:flex-start" id="flk-${id}"></button>`);b.textContent=Ls.length?"Ligar a mais um tema":"Ligar a um tema";b.onclick=()=>{facLinkSt={id,k:null,subs:[],all:true};render()};g.appendChild(b);return g}
  if(!st.k){g.appendChild(searchBox(null,{link:id}));const c=el(`<button class="link" type="button">Cancelar</button>`);c.onclick=()=>{facLinkSt=null;render()};g.appendChild(c);return g}
  const it=BYKEY[st.k],L=subList(it),f=el(`<div class="flinkpick"><p class="gtext"></p><div class="seg"></div><ul class="psubs"></ul><div class="btns"></div></div>`);
  f.querySelector("p").innerHTML=`<b></b> · ${esc(it.area.code)}${it.sp?" · "+esc(it.sp):""}`;f.querySelector("b").textContent=it.t;
  [[true,"Tema inteiro"],[false,"Só alguns subtópicos"]].forEach(([v,t])=>{const b=el(`<button type="button" aria-pressed="${st.all===v}"></button>`);b.textContent=t;b.id=`flka-${id}-${v?1:0}`;b.onclick=()=>{st.all=v;render()};f.querySelector(".seg").appendChild(b)});
  const ul=f.querySelector("ul");if(st.all)ul.remove();else{if(!L.length)ul.appendChild(el(`<li class="empty" style="padding:0">Este tema não tem subtópicos: ligue ao tema inteiro.</li>`));
    L.forEach((x,n)=>{const cid=`flks-${id}-${n}`,li=el(`<li><input type="checkbox" id="${cid}"${st.subs.includes(x.t)?" checked":""}><label for="${cid}"></label></li>`);li.querySelector("label").textContent=x.t;
      li.querySelector("input").onchange=e=>{st.subs=e.target.checked?[...st.subs,x.t]:st.subs.filter(y=>y!==x.t)};ul.appendChild(li)})}
  const go=el(`<button class="btn primary" type="button" id="flkgo-${id}">Ligar</button>`),back=el(`<button class="btn" type="button">Escolher outro tema</button>`),cc=el(`<button class="link" type="button">Cancelar</button>`),err=el(`<p class="err" role="alert"></p>`);
  go.onclick=()=>{if(!st.all&&!st.subs.length){err.textContent="Marque pelo menos um subtópico, ou escolha Tema inteiro.";return}linkOwn(id,st.k,st.all?[]:st.subs,st.from)};
  back.onclick=()=>{st.k=null;st.subs=[];render()};cc.onclick=()=>{facLinkSt=null;render()};f.querySelector(".btns").append(go,back,cc);f.appendChild(err);g.appendChild(f);return g}
function dupBox0(it,id){const rp=el(`<div class="grp"><span class="glabel">Duplicata?</span><p class="gtext how">Se este conteúdo já existe na lista da residência, substitua: SPs, provas, anotações, erros e progresso passam para o tema existente.</p></div>`);
  if(facReplace===id)rp.appendChild(searchBox(null,{replace:id}));else{const b=el(`<button class="btn" type="button" style="align-self:flex-start">Substituir por tema existente</button>`);b.onclick=()=>{facReplace=id;render()};rp.appendChild(b)}
  return rp}

/* seletor de área/especialidade de um eixo */
function mapPicker(m,onPick,id){const w=el(`<span class="fmapw"></span>`);
  const s=document.createElement("select");s.className="fmapsel";s.id="fm-"+id;s.setAttribute("aria-label","Área e especialidade");
  const add=(v,t,g)=>{const o=document.createElement("option");o.value=v;o.textContent=t;(g||s).appendChild(o)};
  add("","Sem área (fica só na Faculdade)");
  AREAS.forEach(a=>{const g=document.createElement("optgroup");g.label=a.name;a.specs.forEach(sp=>add(a.code+"|"+sp.name,a.code+" · "+sp.name,g));add(a.code+"|*",a.code+" · outra especialidade…",g);s.appendChild(g)});
  const A=AREAS.find(a=>a.code===m.area),known=A&&A.specs.some(x=>x.name===m.spec),custom=A&&!known;
  s.value=!A?"":known?A.code+"|"+m.spec:A.code+"|*";w.appendChild(s);
  if(custom||facMapCustom===id){const i=el(`<input class="etext fmapin" maxlength="50" placeholder="Nome da especialidade">`);i.id="fmi-"+id;i.value=custom?(m.spec||""):"";
    i.onchange=()=>{const v=i.value.trim();if(v){facMapCustom=null;onPick({area:s.value.split("|")[0],spec:v})}};w.appendChild(i)}
  s.onchange=()=>{const v=s.value;if(!v){facMapCustom=null;onPick({area:"",spec:""});return}const [a,sp]=v.split("|");
    if(sp==="*"){facMapCustom=id;onPick({area:a,spec:""})}else{facMapCustom=null;onPick({area:a,spec:sp})}};
  return w}
/* texto que vira campo de edição ao tocar em "renomear" */
function openEdit(k){facEdit=k;facDraft={};facFocus=!!k}
function closeEdit(){facEdit=null;facDraft={};facFocus=false}
function nameEdit(id,val,save){const f=el(`<form class="fren"><input class="etext" maxlength="120" aria-label="Novo nome"><button class="mini" type="submit">Salvar</button><button class="mini" type="button">Cancelar</button></form>`);
  const i=f.querySelector("input");i.id="fr-"+id;i.value=facDraft.name!=null?facDraft.name:val;i.oninput=()=>{facDraft.name=i.value};
  f.onsubmit=e=>{e.preventDefault();const v=i.value.trim();if(v){save(v)}closeEdit();saveFac();render()};
  f.querySelectorAll("button")[1].onclick=()=>{closeEdit();render()};
  if(facFocus){facFocus=false;setTimeout(()=>{if(i.isConnected&&document.activeElement!==i)i.focus()},0)}return f}
function armBtn(key,label,confirmLabel,act,cls="link"){const b=el(`<button class="${cls}" type="button"></button>`);const arm=facArm===key;b.textContent=arm?confirmLabel:label;if(arm)b.classList.add("warn");
  b.onclick=()=>{if(arm){facArm=null;act()}else{facArm=key;render()}};return b}

