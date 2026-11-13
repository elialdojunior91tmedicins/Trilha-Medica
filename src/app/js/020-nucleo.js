/* especialidades de cada área (as chaves AREA-n não mudam; só a ordem de exibição e a numeração) */
const SPECS={
CM:[["Cardiologia",[1,2,5,6,7,8,10,11,12]],["Endocrinologia",[3,4,31,32,33]],["Pneumologia",[17,18,19,20]],
  ["Infectologia",[13,14,15,48,46,47,55,56,51]],["Emergência e terapia intensiva",[9,16,49]],["Neurologia",[21,22,23,24,25,52,58]],
  ["Nefrologia",[57,26,27,28,29,30]],["Hematologia e oncologia",[34,35,36,37,53]],["Gastroenterologia e hepatologia",[40,41,59,38,39]],
  ["Reumatologia",[42,43,44,45,65]],["Psiquiatria",[50,60,61,62]],["Dermatologia",[63,64]],["Cuidados paliativos",[54]]],
CIR:[["Trauma",[1,2,3,4,5,6,7,8]],["Abdome agudo",[9,10,15,16,17]],["Vias biliares e pâncreas",[11,12,13,14]],
  ["Aparelho digestivo e coloproctologia",[18,19,22,23,21,26]],["Hérnias e perioperatório",[20,24,25]],["Cirurgia vascular",[27,28]],
  ["Cirurgia pediátrica",[31,32]],["Urologia",[30]],["Cabeça e pescoço",[29]],["Ortopedia",[33,34,35]],["Oftalmologia",[36]]],
PED:[["Neonatologia",[6,7,8,9,10,11,12]],["Puericultura",[1,2,3,4,5,20,25]],["Doenças respiratórias",[13,14,15,16]],
  ["Infectologia pediátrica",[17,18,19,26]],["Nefrologia pediátrica",[21,22]],["Emergências e violência",[30,29,23,24]],
  ["Cardiologia e reumatologia pediátrica",[28,32,33]],["Hematologia pediátrica",[27]],["Alergia e imunologia",[31]]],
GO:[["Obstetrícia: pré-natal, parto e puerpério",[1,2,31,32,14]],["Obstetrícia: intercorrências clínicas",[3,4,12,13,33]],
  ["Obstetrícia: hemorragias",[5,6,7,8]],["Obstetrícia: complicações e medicina fetal",[9,10,11,15,16]],
  ["Ginecologia: oncologia e mastologia",[17,18,19,20,30]],["Ginecologia: endócrina e reprodutiva",[21,24,25,26,27,28]],
  ["Ginecologia: infecções genitais",[22,23]],["Ginecologia: violência sexual",[29]]],
PREV:[["SUS e políticas de saúde",[1,2,3,6,7,8,29,30]],["Atenção primária e MFC",[4,5,27,28]],["Vigilância em saúde",[9,10,11,24]],
  ["Indicadores e perfil de saúde",[12,13,23,31]],["Epidemiologia clínica e estudos",[14,15,16,17,21,22]],
  ["Testes, rastreamento e prevenção",[18,19,20]],["Ética e documentos médicos",[25,26]]]};
(()=>{AREAS.forEach(a=>{const by=Object.fromEntries(a.items.map(it=>[it.key,it]));
    a.specs=SPECS[a.code].map(([name,ix])=>({name,items:ix.map(i=>{const it=by[a.code+"-"+i];it.sp=name;return it})}));
    if(a.specs.reduce((n,x)=>n+x.items.length,0)!==a.items.length||new Set(a.specs.flatMap(x=>x.items)).size!==a.items.length)console.error("Especialidades incompletas em",a.code);
    a.items=a.specs.flatMap(x=>x.items)});
  let k=0;AREAS.forEach(a=>a.items.forEach(it=>it.num=++k))})();
const spKey=it=>it.area.code+":"+it.sp;
let openSpecs=new Set();/* tudo começa recolhido: área › especialidades › temas */
const areaLabel=it=>it.area.name+(it.sp?" — "+it.sp:"");
const ALL=AREAS.flatMap(a=>a.items), BYKEY=Object.fromEntries(ALL.map(i=>[i.key,i])), TOTAL=ALL.length;

let state={}, filter="all", query="", store=null, saveTimer=null, openKey=null, openAreas=new Set(), formErr="", clearArm=null;
const LS2="resid-checklist-v2", LS1="resid-checklist-v1";
const ETYPES={conhecimento:"Não sabia o conteúdo",interpretacao:"Li errado / desatenção",confusao:"Confundi ou esqueci"};
const ETIPS={conhecimento:"A maioria dos seus erros é por falta de conteúdo. Volte à teoria desses temas antes de fazer mais questões.",
  interpretacao:"A maioria dos seus erros é de leitura. Antes das alternativas, sublinhe o que o enunciado pede: conduta, diagnóstico, exceto, mais provável.",
  confusao:"A maioria dos seus erros vem de confundir ou esquecer. Monte quadros comparativos e revise estes erros com mais frequência."};
const E_PAGE=60;let eLimit=E_PAGE;
let errors=[], errStore=null, view="inicio", eArea="all", eSp="all", eOrder="sp", nSp="all", eType="all", eQuery="", eTopicKey=null, drafts={}, eErr="", delArm=null;
const LSE="resid-erros-v1", LSP="resid-prompt-v1", LSN="resid-notas-v1";
let notes={}, notesStore=null, noteTimers={}, subDraft={}, subErr="", genFocus={};
const $=s=>document.querySelector(s);
const normRaw=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
/* caches: textos longos (anotações) não são reprocessados a cada redesenho */
const normCache=new Map(), mdCache=new Map();
function norm(s){if(s.length<200)return normRaw(s);let v=normCache.get(s);if(v===undefined){if(normCache.size>600)normCache.clear();v=normRaw(s);normCache.set(s,v)}return v}
function mdC(src){let v=mdCache.get(src);if(v===undefined){if(mdCache.size>400)mdCache.clear();v=md(src);mdCache.set(src,v)}return v}
/* busca: espera uma pausa curta na digitação antes de redesenhar */
function debounced(fn,ms=180){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}

/* datas locais */
let dayOff=0;// usado só para simular os próximos dias (prévia da semana)
function today(){const d=new Date();if(dayOff)d.setDate(d.getDate()+dayOff);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function dnum(s){const [y,m,d]=s.split("-").map(Number);return Math.round(Date.UTC(y,m-1,d)/864e5)}
function fromNum(x){return new Date(x*864e5).toISOString().slice(0,10)}
function br(s){const [y,m,d]=s.split("-");return d+"/"+m}
const get=k=>state[k]||{l:0};
let synced=false;const touchedEarly=new Set();
function upd(k,fn){const s={...get(k)},l0=s.last,st0=s.step;fn(s);if(s.last&&s.ing)delete s.ing;if((s.last!==l0||s.step!==st0)&&"adj" in s){delete s.adj;delete s.adjFrom}if((s.last!==l0||s.step!==st0)&&s.rc)delete s.rc;
  if(s.last===today()&&!(s.ed||[]).includes(s.last))s.ed=[...(s.ed||[]),s.last].slice(-200);// dias de estudo/revisão do tema
  state[k]=s;if(!synced)touchedEarly.add(k)}
let estChanged=false;
const wOf=it=>get(it.key).w||it.w0;
function incEl(w,withText,noHy){const e=el(`<span class="inc" data-w="${w}" title="Incidência ${INC[w].toLowerCase()}"><i></i><i></i><i></i>${withText?`<b>${INC[w]}</b>`:""}</span>`);e.setAttribute("aria-label","Incidência "+INC[w].toLowerCase());
  if(w!==3||noHy)return e;/* Lote 21: tema de peso 3 = High Yield */const f=document.createDocumentFragment(),h=el(`<span class="hyb" title="High Yield: dos temas que mais caem">HY</span>`);f.append(e,h);return f}
/* intervalo da revisão: o da tabela, ajustado pelo acerto nas questões do tema (desligável em Configurações) */
function adaptAcc(s){if(!s.qt)return null;const from=fromNum(dnum(today())-90);let q=0,c=0;const m=s.qd||{};for(const d in m)if(d>=from&&Array.isArray(m[d])){q+=m[d][0]||0;c+=m[d][1]||0}
  if(q<5){q=s.qt||0;c=s.qc||0}return q>=5?{a:c/q,q}:null}
/* auditoria 26/10: o acerto baixo pesa num lugar só (o ponto fraco); aqui ele só alonga a revisão de quem vai bem */
function adaptF(s){if(ui.prefs.adapt===false||!((s.step||0)>=1))return 1;const r=adaptAcc(s);if(!r)return 1;const a=r.a;return a>=.85&&r.q>=8?1.4:a>=.75?1.2:1}
function interval(s){const b=INT[Math.min(s.step||0,INT.length-1)];if(s.adjFrom===s.last&&s.adj)return b;const f=adaptF(s);return f===1?b:Math.max(1,Math.min(150,Math.round(b*f)))}
/* semana de estudos (Configurações › Plano): dias de temas novos, de simulado e de folga (0 = domingo) */
let WK_NEW=new Set([0,1,2,3,4,5,6]),WK_SIM=new Set(),WK_OFF=new Set();
const WD_FULL=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
const wdOf=n=>((n+4)%7+7)%7;// dnum 0 = 01/01/1970, uma quinta
/* planejamento semanal (10/2026): tempo de cada dia = a semana planejada (ui.prefs.wplans[segunda]) ou a semana padrão (ui.prefs.wday) */
const WP_MIN=[0,30,60,120,180],WP_LAB={0:"Folga",30:"30 min",60:"1 h",120:"2 h",180:"3 h+"};let HAS_OFF=false;
const wpMon=n=>n-((wdOf(n)+6)%7);
/* Lote 18: dia com aula fixa (grade da Faculdade) perde 1 degrau de tempo a cada 2 h de aula (mín. 30 min); o dia que você escolheu à mão (wp.o) vale como está */
function dayMin(n){const P=ui.prefs,wp=P.wplans&&P.wplans[fromNum(wpMon(n))],a=wp?wp.m:P.wday,w=wdOf(n);if(!Array.isArray(a))return 180;
  return wp&&Array.isArray(wp.o)&&wp.o.includes(w)?a[w]:gradeAdj(a[w],n)}
/* quantos temas cabem no dia: folga 0 · 30 min só o leve (1 vaga só para a faculdade) · 1 h 1 · 2 h 2 · 3 h+ o número do plano */
function dayCap(n){const m=dayMin(n);return m<=0?0:m<=30?1:m<=60?1:m<=120?Math.min(2,PLAN_N):PLAN_N}
const isOffDay=()=>dayMin(dnum(today()))===0;
const isNewDay=()=>dayMin(dnum(today()))>=60;
const isSimDay=()=>WK_SIM.has(wdOf(dnum(today())))&&!isOffDay();
function offShift(n){let g=0;while(dayMin(n)===0&&g<7){n++;g++}return n}
function nextStudyLabel(){const t=dnum(today()),n=offShift(t+1);return n===t+1?"amanhã":(wdOf(n)===0||wdOf(n)===6?"no ":"na ")+WD_FULL[wdOf(n)]}
const newDaysWeek=()=>Math.max(1,ui.prefs.wday.filter(m=>m>=60).length);
const weekCap=()=>{const W=ui.prefs.wday;let c=0;for(let d=0;d<7;d++){const m=W[d];c+=m<=30?0:m<=60?1:m<=120?Math.min(2,PLAN_N):PLAN_N}return Math.max(1,c)};
/* revisão que cairia num dia de folga passa para o próximo dia de estudo; no dia de folga nada vence */
function dueIn(s){if(!s.last)return null;const t=dnum(today()),raw=dnum(s.last)+interval(s)+(s.adjFrom===s.last?(s.adj||0):0);if(!HAS_OFF)return raw-t;
  const eff=offShift(raw);if(dayMin(t)===0&&eff<=t)return offShift(t)-t;return eff-t}
function acc(s){return s.qt? s.qc/s.qt : null}
/* questões por dia em cada tema (qd = {"AAAA-MM-DD":[questões, acertos]}), para relatórios por matéria e período */
function addQ(x,t,c,day,src){x.qt=Math.max(0,(x.qt||0)+t);x.qc=Math.max(0,(x.qc||0)+c);const d=day||today(),m={...(x.qd||{})},v=m[d]||[0,0];m[d]=[v[0]+t,v[1]+c];
  const ks=Object.keys(m).sort();if(ks.length>400)ks.slice(0,ks.length-400).forEach(k=>delete m[k]);x.qd=m;
  const sk=src&&qSrcKey(src);if(sk){const b={...(x.qb||{})},m2={...(b[sk]||{})},v2=m2[d]||[0,0];m2[d]=[Math.max(0,v2[0]+t),Math.max(0,v2[1]+c)];
    const k2=Object.keys(m2).sort();if(k2.length>200)k2.slice(0,k2.length-200).forEach(z=>delete m2[z]);b[sk]=m2;x.qb=b}}
function qPeriod(keys,from){let q=0,c=0,und=0,est=0;keys.forEach(k=>{const s=get(k);if(s.qe&&(!from||s.qe.d>=from))est+=s.qe.q||0;if(!from){q+=s.qt||0;c+=s.qc||0;return}
  let dq=0;for(const d in s.qd||{}){const v=s.qd[d];if(!Array.isArray(v))continue;dq+=v[0]||0;if(d>=from){q+=v[0]||0;c+=v[1]||0}}und+=Math.max(0,(s.qt||0)-dq)});return {q,c,und,est}}
const isDue=s=>{const d=dueIn(s);return d!==null&&d<=0};
/* ponto fraco (auditoria 26/10): acerto RECENTE (últimos 30 dias, mín. 5 questões); sem questões recentes, o acerto total. Quem melhorou sai sozinho */
function accRecent(s){const from=fromNum(dnum(today())-30);let q=0,c=0;const m=s.qd||{};for(const d in m)if(d>=from&&Array.isArray(m[d])){q+=m[d][0]||0;c+=m[d][1]||0}return q>=WEAK_MIN?{q,c,a:c/q}:null}
const isWeak=s=>{const r=accRecent(s);return r?r.a<WEAK_PCT:s.qt>=WEAK_MIN&&acc(s)<WEAK_PCT};
/* o ponto fraco do dia vai para a fila (5 questões), não ocupa vaga do plano; o mesmo tema descansa WEAK_REST dias (s.wkd) e a escolha segue "onde focar" */
const WEAK_REST=7;
function weakToday(){if(isOffDay()||examCrunch().active||provaWeek().length)return null;const P=ensurePlan();if(P.wk&&P.wk.d===today()&&BYKEY[P.wk.k])return P.wk;
  const t=dnum(today()),c=focusRank(ALL.filter(i=>{const s=get(i.key);return isWeak(s)&&!(s.wkd&&t-dnum(s.wkd)<WEAK_REST)}))[0]
    ||ALL.filter(i=>{const s=get(i.key);return isWeak(s)&&!(s.wkd&&t-dnum(s.wkd)<WEAK_REST)}).sort((a,b)=>wOf(b)-wOf(a))[0];
  if(!c)return null;P.wk={d:today(),k:c.key,q0:get(c.key).qt||0};try{localStorage.setItem(LSDP,JSON.stringify(dayPlan))}catch(e){}return P.wk}
function weakLeft(){const W=weakToday();if(!W)return 0;const n=Math.max(0,(get(W.k).qt||0)-W.q0);if(n>=WEAK_DAY_Q&&get(W.k).wkd!==today())upd(W.k,x=>{x.wkd=today()});return Math.max(0,WEAK_DAY_Q-n)}
const isNew=s=>!s.last&&!(s.l>0);
const calmOn=()=>{try{return !!ui.prefs.calm}catch(e){return false}};
function dueLabel(d){return d<0?(calmOn()?`pendente há ${-d} d`:`atrasada ${-d} d`):d===0?"revisar hoje":d===1?"revisar amanhã":`revisar em ${d} d`}

/* Lote 11 (10/2026): a psiquiatria (CM-50) foi dividida em 4 temas. PSY_MAP: índice antigo do subtópico → [tema, índice novo] */
const PSY_MAP={0:["CM-50",0],1:["CM-50",1],2:["CM-62",1],3:["CM-62",2],4:["CM-50",2],5:["CM-50",4],6:["CM-50",5],7:["CM-62",3],8:["CM-50",6],9:["CM-62",4],10:["CM-50",7],11:["CM-62",5],12:["CM-62",0],13:["CM-60",1],14:["CM-60",3],15:["CM-61",0],16:["CM-61",1]};
const PSY_TXT={"ISRS e efeitos adversos":"CM-62","Síndrome serotoninérgica":"CM-62","Benzodiazepínicos":"CM-62","Lítio: uso e toxicidade":"CM-62","Síndrome neuroléptica maligna":"CM-62","Agitação psicomotora e emergências psiquiátricas":"CM-62",
  "Álcool: abstinência e Wernicke":"CM-60","Cocaína, opioides e outras drogas":"CM-60","Transtornos alimentares":"CM-61","TDAH no adulto":"CM-61"},PSY_REN={"TDAH no adulto":"TDAH na criança e no adulto"};
function psySplit(out){const s=out["CM-50"];if(!s||s.p11)return false;const oldSd=Array.isArray(s.sd)?s.sd:[],oldDn=s.dn&&typeof s.dn==="object"?s.dn:{},T={};
  const put=(k,f,i,v)=>{const t=T[k]=T[k]||{sd:[],dn:{}};if(f==="sd")t.sd.push(i);else t.dn[i]=v};
  oldSd.forEach(i=>{const m=PSY_MAP[i];if(m)put(m[0],"sd",m[1])});for(const i in oldDn){const m=PSY_MAP[i];if(m)put(m[0],"dn",m[1],oldDn[i])}
  const me=T["CM-50"]||{sd:[],dn:{}};s.sd=me.sd.sort((a,b)=>a-b);if(!s.sd.length)delete s.sd;s.dn=me.dn;if(!Object.keys(s.dn).length)delete s.dn;s.p11=1;
  ["CM-60","CM-61","CM-62"].forEach(k=>{if(out[k])return;const t=T[k];const n={p11:1};
    if(t&&t.sd.length){n.sd=t.sd.sort((a,b)=>a-b);n.sv=2}if(t&&Object.keys(t.dn).length)n.dn=t.dn;
    if(s.last){n.last=s.last;n.step=s.step||0;if(s.l)n.l=s.l;if(Array.isArray(s.ed))n.ed=[...s.ed]}else if(n.sd)n.ing={d:today(),m:"a"};
    if(n.sd||n.last)out[k]=n});
  return true}
function migrate(obj){const out={};for(const k in obj||{}){const v=obj[k];if(!BYKEY[k])continue;const s=typeof v==="number"?{l:v}:{...v};
    // subtópicos marcados na ordem antiga (sem sv=2) são convertidos para a nova ordem didática
    if(Array.isArray(s.sd)&&s.sv!==2){const P=SUB_PERM[k];if(P)s.sd=[...new Set(s.sd.map(i=>P[i]).filter(i=>Number.isInteger(i)))].sort((a,b)=>a-b);s.sv=2;if(!s.sd.length)delete s.sd}
    // questões registradas antes de existir a data por tema (qd): estimadas na data do último estudo
    if(s.qt>0&&s.last&&!s.qe){let dq=0,dc=0;for(const d in s.qd||{}){const v=s.qd[d];if(Array.isArray(v)){dq+=v[0]||0;dc+=v[1]||0}}
      const uq=s.qt-dq;if(uq>0){const uc=Math.max(0,Math.min(uq,(s.qc||0)-dc)),m={...(s.qd||{})},v=m[s.last]||[0,0];m[s.last]=[v[0]+uq,v[1]+uc];s.qd=m;s.qe={d:s.last,q:uq};estChanged=true}}
    out[k]=s}if(psySplit(out))estChanged=true;return out}
function renamePlanLabels(dp){if(!dp||!Array.isArray(dp.items))return dp;const rn=(k,t)=>(SUB_RENAME[k]&&SUB_RENAME[k][t])||t;
  dp.items.forEach(x=>{x.subs=[...new Set((x.subs||[]).map(t=>rn(x.k,t)))];if(x.chk)x.chk=x.chk.map(t=>rn(x.k,t));if(x.prev&&x.prev.subs)x.prev.subs=x.prev.subs.map(t=>rn(x.prev.k,t))});
  if(dp.rchk)for(const k in dp.rchk)dp.rchk[k]=dp.rchk[k].map(t=>rn(k,t));return dp}

/* plano do dia */
let PLAN_N=3;
function buildPlan(){
  const plan=[],used=new Set();if(isOffDay())return plan;const NEWD=isNewDay(),DM=dayMin(dnum(today())),PLAN_N=dayCap(dnum(today()));
  const add=(it,cls,txt)=>{if(plan.length<PLAN_N&&!used.has(it.key)){used.add(it.key);plan.push({it,cls,txt})}};
  const rev=ALL.filter(i=>isDue(get(i.key))).sort(revPri),BR=revBrake();let nNew=0;
  const addN=(it,cls,txt)=>{if(nNew>=BR.cap||used.has(it.key)||plan.length>=PLAN_N)return;nNew++;add(it,cls,txt)};
  const weak=ALL.filter(i=>isWeak(get(i.key))).sort((a,b)=>(acc(get(a.key))-acc(get(b.key)))-(wOf(a)-wOf(b))*0.1);
  // temas novos: maior incidência primeiro, alternando entre as áreas
  const fresh=[];
  for(const w of [3,2,1]){const pools=AREAS.map(a=>a.items.filter(i=>{const s=get(i.key);return isNew(s)&&!s.ing&&wOf(i)===w}));
    while(fresh.length<PLAN_N&&pools.some(p=>p.length))pools.forEach(p=>{if(p.length&&fresh.length<PLAN_N)fresh.push(p.shift())});}
  const F=facPlanPicks(),CR=examCrunch();if(CR.active)F.slots=PLAN_N;
  spPlanPicks().forEach(o=>{if(plan.length<PLAN_N&&!used.has(o.it.key)){used.add(o.it.key);plan.push({it:o.it,cls:"r-fac",txt:`Fechamento ${o.lab} · ${inLabel(o.d)}`,sub:o.x.sub})}});
  F.picks.slice(0,F.slots).forEach(o=>{if(plan.length<PLAN_N&&!used.has(o.it.key)){used.add(o.it.key);plan.push({it:o.it,cls:"r-fac",txt:`${o.p.name} · ${inLabel(o.d)}`,sub:o.x.sub})}});
  // semana da prova: o conteúdo já estudado volta como "Revisar para a prova"
  provaRvPicks().forEach(o=>{if(plan.length<PLAN_N&&!used.has(o.it.key)){used.add(o.it.key);plan.push({it:o.it,cls:"r-pfr",txt:`Revisar · prova ${inLabel(o.d)}`,pid:o.p.id,ref:o.r,n:o.n})}});
  if(CR.active)return plan;// modo provas: nada da residência
  if(DM<=30)return plan;// dia de 30 min: só a faculdade; o ponto fraco está na fila do dia (auditoria 26/10)
  if(provaWeek().length)return plan;// semana da prova: sem tema novo nem ponto fraco; as vagas livres ficam para as revisões da residência
  /* Lote 20E: plano alinhado ao eixo: 1 da faculdade (SP da semana) · 1 do eixo · 1 livre (o que sobra segue como antes) */
  if(axOn()){const AX=axNow(),E=axToday(AX),[nf,ne]=axMix();
    if(nf&&!plan.some(x=>x.cls==="r-fac")){const f=axFacPick(AX,used);if(f)add(f.it,"r-fac",`SP da semana · ${f.lab}`)}
    if(E&&NEWD)for(let i=0;i<ne;i++){const r=axResPick(E,used);if(r)addN(r.it,r.cls,r.txt)}}
  // temas em andamento ("Estudando") vêm antes de abrir tema novo
  if(NEWD)ALL.filter(i=>{const s=get(i.key);return isIng(s)&&(!subList(i).length||subList(i).some(x=>!x.done))}).sort((a,b)=>(get(a.key).ing.d<get(b.key).ing.d?-1:get(a.key).ing.d>get(b.key).ing.d?1:0)||wOf(b)-wOf(a))
    .forEach(i=>{const [d,t]=subCount(i),pt=partSubs(i).pt;addN(i,"r-cont",pt?`Continuar · Parte ${pt[0]} de ${pt[1]}`:t?`Continuar · ${d} de ${t} subtópicos`:"Continuar")});
  if(NEWD)fresh.forEach(i=>{const pt=partSubs(i).pt;addN(i,"r-new",(wOf(i)===3?"Novo · incidência muito alta":"Tema novo")+(pt?` · ${pt[1]} partes`:""))});
  return plan;// ponto fraco: na fila do dia (weakToday), não ocupa vaga do plano
}

function weighted(){let tw=0,dw=0;ALL.forEach(i=>{const w=wOf(i);tw+=w;if((get(i.key).l||0)>=1||get(i.key).last)dw+=w});return Math.round(dw/tw*100)}
/* c[0..3] por nível; c[4] = quantos dos não iniciados estão em "Estudando" */
function counts(items){const c=[0,0,0,0,0];items.forEach(it=>{const s=get(it.key);c[s.l||0]++;if(isIng(s)&&!(s.l>0))c[4]++});return c}
function bar(el,c,tot){const w=[c[3],c[2],c[1]].map(v=>(v/tot*100)+"%");[...el.children].forEach((i,k)=>i.style.width=w[k])}
function subList(it){const s=get(it.key),sd=s.sd||[],dn=s.dn||{},df=DN_DEF[it.key]||[],hy=s.hy||{},hd=HY_DEF[it.key]||[];
  return [...it.subs.map((t,i)=>({t,done:sd.includes(i),i,dn:dn[i]||(df.includes(i)?"c":""),hy:hy[i]==="u"||hy[i]!=="n"&&hd.includes(i),hyc:!hy[i]&&hd.includes(i)})),...(s.cs||[]).map((c,j)=>({t:c.t,done:!!c.d,j,dn:c.dn||"",hy:c.hy==="u"}))]}
function setHy(it,x,on){upd(it.key,s=>{if(x.i!==undefined){const h={...(s.hy||{})};const def=(HY_DEF[it.key]||[]).includes(x.i);if(on===def)delete h[x.i];else h[x.i]=on?"u":"n";if(Object.keys(h).length)s.hy=h;else delete s.hy}
  else s.cs=(s.cs||[]).map((c,j)=>{if(j!==x.j)return c;const o={...c};if(on)o.hy="u";else delete o.hy;return o})});commit()}
const hyFirst=L=>[...L.filter(x=>x.hy),...L.filter(x=>!x.hy)];
/* subtópico denso: conta como dois no tamanho da parte do dia. dn: "u" = você marcou, "n" = você tirou, "c" = sugerido pelo Claude (vale até você mudar) */
const dnHeavy=x=>x.dn==="u"||x.dn==="c";
const subW=x=>dnHeavy(x)?2:1;
const PART_BIG=6,PART_CAP=4;
/* partes do tema: até 6 subtópicos (peso até 6) = uma parte só; maior que isso, partes de peso 3 a 4, na ordem da lista */
function subParts(L){const W=L.reduce((a,x)=>a+subW(x),0);if(!L.length)return [];if(L.length<=PART_BIG&&W<=PART_BIG)return [L];
  const n=Math.ceil(W/PART_CAP),tg=W/n,P=Array.from({length:n},()=>[]);let acc=0;
  L.forEach(x=>{const w=subW(x),i=Math.min(n-1,Math.floor((acc+w/2)/tg));P[i].push(x);acc+=w});return P.filter(p=>p.length)}
/* subtópicos do dia para um tema novo ou em andamento: o tema inteiro (pequeno) ou a próxima parte (grande); pt = [parte, total] */
function partSubs(it){const L=hyFirst(subList(it)),P=subParts(L);if(!P.length)return {subs:[],pt:null};
  if(P.length===1){const open=L.filter(x=>!x.done);return {subs:(open.length?open:L).map(x=>x.t),pt:null}}
  const i=P.findIndex(p=>p.some(x=>!x.done));if(i<0)return {subs:[],pt:null};
  const pick=P[i].filter(x=>!x.done);let w=pick.reduce((a,x)=>a+subW(x),0);
  for(let j=i+1;j<P.length&&w<3;j++)for(const x of P[j]){if(x.done)continue;if(w+subW(x)>PART_CAP){w=99;break}pick.push(x);w+=subW(x)}
  return {subs:pick.map(x=>x.t),pt:[i+1,P.length]}}
function setDn(it,x,v){upd(it.key,s=>{if(x.i!==undefined){const d={...(s.dn||{})};if(v)d[x.i]=v;else delete d[x.i];if(Object.keys(d).length)s.dn=d;else delete s.dn}
  else s.cs=(s.cs||[]).map((c,j)=>{if(j!==x.j)return c;const o={...c};if(v)o.dn=v;else delete o.dn;return o})});commit()}
function subCount(it){const L=subList(it);return [L.filter(x=>x.done).length,L.length]}
function toggleSub(it,x){let promo=false,unpromo=false;const s0=get(it.key),fresh=!s0.last;const fb=!x.done&&!fresh&&facBadge(it.key);const bump=fb&&daysTo(fb.p.date)<=FAC_WIN&&s0.last<today();
  upd(it.key,s=>{if(s.pre&&s.pre.d!==today())delete s.pre;if(bump)s.last=today();
    if(x.i!==undefined){const sd=new Set(s.sd||[]);sd.has(x.i)?sd.delete(x.i):sd.add(x.i);s.sd=[...sd].sort((a,b)=>a-b);s.sv=2;if(!s.sd.length)delete s.sd}
    else{s.cs=(s.cs||[]).map((c,j)=>j===x.j?{...c,d:!c.d}:c)}
    const tot=it.subs.length+(s.cs||[]).length,dn=(s.sd||[]).length+(s.cs||[]).filter(c=>c.d).length;
    if(fresh){// tema ainda não estudado: o primeiro subtópico põe em "Estudando"; o último conclui e começa as revisões
      if(tot&&dn>=tot){s.pre={d:today(),l:s.l||0,ing:s.ing||null};s.last=today();s.step=0;s.l=Math.max(s.l||0,1);promo=true}
      else if(dn>0){if(!s.ing)s.ing={d:today(),m:"a"}}
      else if(s.ing&&s.ing.m!=="m")delete s.ing}
    else if(s.pre&&s.pre.d===today()&&"ing" in s.pre&&dn<tot){// desmarcou depois de concluir hoje: volta a "Estudando"
      delete s.last;delete s.step;s.l=s.pre.l||0;if(dn>0||(s.pre.ing&&s.pre.ing.m==="m"))s.ing=s.pre.ing||{d:today(),m:"a"};delete s.pre;
      if(s.ed){s.ed=s.ed.filter(d=>d!==today());if(!s.ed.length)delete s.ed}unpromo=true}});
  if(unpromo){const h=hist[today()];if(h&&h.e>0){h.e--;try{localStorage.setItem(LSH,JSON.stringify(hist))}catch(e){}}}
  if(promo){logAct("e");bkFixNote(it.key)}if(!x.done)adoptTopic(it.key,x.t);commit()}
/* botões de nível do tema */
function setLevel(it,v){const k=it.key,s=get(k);
  if(v===0){if(s.last||(s.sd||[]).length||(s.cs||[]).some(c=>c.d)){resetStudy(k);return}upd(k,x=>{x.l=0;delete x.ing});commit();return}
  if(v==="i"){upd(k,x=>{if(x.last){delete x.last;delete x.step;delete x.pre;delete x.adj;delete x.adjFrom}x.l=0;x.ing={d:(x.ing&&x.ing.d)||today(),m:"m"}});commit();return}
  if(v===1){let first=false;upd(k,x=>{if(!x.last){x.last=today();x.step=0;first=true}x.l=1});if(first){logAct("e");adoptTopic(k);bkFixNote(k)}commit();return}
  upd(k,x=>x.l=v);commit()}

function el(html){const t=document.createElement("template");t.innerHTML=html.trim();return t.content.firstChild}

/* histórico de atividade (por dia): e=temas estudados, r=revisões, q=questões, c=acertos */
let hist={};const LSH="resid-hist-v1";
function logAct(f,n,c,day){const d=day||today(),h=hist[d]||(hist[d]={});h[f]=Math.max(0,(h[f]||0)+(n||1));if(c)h.c=Math.max(0,(h.c||0)+c);
  const keys=Object.keys(hist).sort();if(keys.length>400)keys.slice(0,keys.length-400).forEach(k=>delete hist[k]);
  try{localStorage.setItem(LSH,JSON.stringify(hist))}catch(e){}}
function lastDays(n){const t=dnum(today());return Array.from({length:n},(_,i)=>fromNum(t-n+1+i))}
/* Lote 20E: uma regra só de sequência (Perfil, PDF, Estatísticas, saudação, meta do Foco): dia de folga planejada (ou "Hoje não deu")
   sem estudo CONGELA (não soma nem quebra); estudar na folga soma +1. Hoje ainda sem estudo não quebra. */
const offDay=d=>dayMin(dnum(d))===0;
function runStreak(act){let n=0,t=dnum(today()),g=0;if(!act(fromNum(t)))t--;while(g++<800){const d=fromNum(t);if(act(d))n++;else if(!offDay(d))break;t--}return n}
function streak(){return runStreak(d=>{const h=hist[d];return !!(h&&(h.e||h.r||h.q))})}
const pct=(a,b)=>b?Math.round(a/b*100):0;
const band=p=>p>=80?["good","Bom"]:p>=60?["warn","Regular"]:["bad","Fraco"];

/* ===================== GERAL: fila do dia, avisos, busca, resumo da semana, primeiros passos, calendário, Anki ===================== */
const SITE_URL="https://elialdojunior91tmedicins.github.io/Trilha-Medica/";
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},lsSet=(k,v)=>{try{v===null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
