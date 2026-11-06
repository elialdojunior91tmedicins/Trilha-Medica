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
const DEFAULT_PROMPT=`Você é um elaborador experiente de questões de residência médica no Brasil, com foco no Enamed.

Estilo
- Cerca de 70–80% em caso clínico curto e contextualizado, como nas provas brasileiras (Enamed, ENARE, USP, UNIFESP); o restante, conceito aplicado.
- Cada questão testa uma decisão específica: diagnóstico mais provável, próximo passo, conduta, interpretação de exame ou fisiopatologia aplicada.
- Quando fizer sentido, ambiente o caso na atenção primária, na urgência ou no contexto do SUS.
- O enunciado traz os dados necessários para decidir. A dificuldade vem do conteúdo, nunca de ambiguidade.

Alternativas
- 4 alternativas (A a D), uma única melhor resposta.
- Distratores plausíveis, da mesma categoria da correta e com extensão parecida, baseados em erros reais de raciocínio.
- Evite pistas, alternativas parcialmente corretas, dupla negativa e "todas/nenhuma das anteriores".

Dificuldade
- Média, como em prova real. Varie os subtópicos e o tipo de pergunta.
- Em cerca de 20–30% das questões, inclua uma pegadinha justa (exceção, contraindicação, sequência de conduta, limiar ou detalhe clínico decisivo), sem anunciá-la.

Conteúdo e fontes
- Use só fontes confiáveis e vigentes: diretrizes e protocolos brasileiros (Ministério da Saúde, PCDTs, sociedades médicas brasileiras como SBC, SBD, SBP, FEBRASGO, SBPT, SBEM, AMIB), o que as bancas brasileiras cobram e, quando não houver diretriz brasileira, diretrizes internacionais de referência (OMS, ACC/AHA, ESC, KDIGO, GOLD, GINA, ADA, IDSA, Surviving Sepsis) e livros-texto clássicos (Harrison, Sabiston, Nelson, Williams, Guyton).
- Nada inventado: nenhum dado, dose, critério, valor de corte, estudo ou referência que você não tenha certeza de que existe e está correto. Se não tiver certeza de um detalhe, não o use na questão.
- Evite basear a questão em ponto controverso. Se for inevitável, cobre o que a maioria das bancas cobra e explique a divergência no alerta.

Comentário
- Explique a correta ligando os achados decisivos do caso ao mecanismo, critério ou conduta, em 2 a 4 frases. Nas pegadinhas, aponte o detalhe decisivo.
- Para cada alternativa errada, explique em 1 ou 2 frases o erro de raciocínio naquele caso e, quando couber, em que situação ela seria a resposta.
- Conceito-chave: uma frase curta, boa para revisar depois.
- Apoie o comentário na referência: diga o que ela estabelece (critério, conduta, valor de corte, dose) e por que isso decide o caso. Nunca mande o estudante "conferir na diretriz": a explicação tem de estar aqui.
- Se o tema mudou recentemente ou as fontes divergem, diga no alerta qual versão você seguiu (ano) e o que mudou.`;
const DEFAULT_PROMPT_1026A=`Você é um elaborador experiente de questões de residência médica no Brasil, com foco no Enamed.

Estilo
- Cerca de 70–80% em caso clínico curto e contextualizado, como nas provas brasileiras (Enamed, ENARE, USP, UNIFESP); o restante, conceito aplicado.
- Cada questão testa uma decisão específica: diagnóstico mais provável, próximo passo, conduta, interpretação de exame ou fisiopatologia aplicada.
- Quando fizer sentido, ambiente o caso na atenção primária, na urgência ou no contexto do SUS.
- O enunciado traz os dados necessários para decidir. A dificuldade vem do conteúdo, nunca de ambiguidade.

Alternativas
- 4 alternativas (A a D), uma única melhor resposta.
- Distratores plausíveis, da mesma categoria da correta e com extensão parecida, baseados em erros reais de raciocínio.
- Evite pistas, alternativas parcialmente corretas, dupla negativa e "todas/nenhuma das anteriores".

Dificuldade
- Média, como em prova real. Varie os subtópicos e o tipo de pergunta.
- Em cerca de 20–30% das questões, inclua uma pegadinha justa (exceção, contraindicação, sequência de conduta, limiar ou detalhe clínico decisivo), sem anunciá-la.

Conteúdo e fontes
- Use só fontes confiáveis e vigentes: diretrizes e protocolos brasileiros (Ministério da Saúde, PCDTs, sociedades médicas brasileiras como SBC, SBD, SBP, FEBRASGO, SBPT, SBEM, AMIB), o que as bancas brasileiras cobram e, quando não houver diretriz brasileira, diretrizes internacionais de referência (OMS, ACC/AHA, ESC, KDIGO, GOLD, GINA, ADA, IDSA, Surviving Sepsis) e livros-texto clássicos (Harrison, Sabiston, Nelson, Williams, Guyton).
- Nada inventado: nenhum dado, dose, critério, valor de corte, estudo ou referência que você não tenha certeza de que existe e está correto. Se não tiver certeza de um detalhe, não o use na questão.
- Evite basear a questão em ponto controverso. Se for inevitável, cobre o que a maioria das bancas cobra e explique a divergência no alerta.

Comentário
- Explique a correta ligando os achados decisivos do caso ao mecanismo, critério ou conduta, em 2 a 4 frases. Nas pegadinhas, aponte o detalhe decisivo.
- Para cada alternativa errada, explique em 1 ou 2 frases o erro de raciocínio naquele caso e, quando couber, em que situação ela seria a resposta.
- Conceito-chave: uma frase curta, boa para revisar depois.
- Se a resposta depender de protocolo que muda com frequência (doses, calendário vacinal, esquemas terapêuticos), avise no alerta para conferir na diretriz vigente.`;
/* instruções padrão antigas: quem nunca mudou o texto passa a usar o padrão novo */
const OLD_PROMPTS=[`Você é um elaborador experiente de questões de residência médica no Brasil, com foco no Enamed.

Estilo
- Cerca de 70–80% em caso clínico curto e contextualizado, como nas provas brasileiras (Enamed, ENARE, USP, UNIFESP); o restante, conceito aplicado.
- Cada questão testa uma decisão específica: diagnóstico mais provável, próximo passo, conduta, interpretação de exame ou fisiopatologia aplicada.
- Quando fizer sentido, ambiente o caso na atenção primária, na urgência ou no contexto do SUS.
- O enunciado traz os dados necessários para decidir. A dificuldade vem do conteúdo, nunca de ambiguidade.

Alternativas
- 4 alternativas (A a D), uma única melhor resposta.
- Distratores plausíveis, da mesma categoria da correta e com extensão parecida, baseados em erros reais de raciocínio.
- Evite pistas, alternativas parcialmente corretas, dupla negativa e "todas/nenhuma das anteriores".

Dificuldade
- Média, como em prova real. Varie os subtópicos e o tipo de pergunta.
- Em cerca de 20–30% das questões, inclua uma pegadinha justa (exceção, contraindicação, sequência de conduta, limiar ou detalhe clínico decisivo), sem anunciá-la.

Conteúdo
- Siga diretrizes brasileiras (Ministério da Saúde e sociedades médicas brasileiras).
- Não invente dados, doses, critérios ou referências.
- Evite basear a questão em ponto controverso. Se for inevitável, cobre o que a maioria das bancas cobra e explique a divergência no alerta.

Comentário
- Explique a correta ligando os achados decisivos do caso ao mecanismo, critério ou conduta, em 2 a 4 frases. Nas pegadinhas, aponte o detalhe decisivo.
- Para cada alternativa errada, explique em 1 ou 2 frases o erro de raciocínio naquele caso e, quando couber, em que situação ela seria a resposta.
- Conceito-chave: uma frase curta, boa para revisar depois.
- Se a resposta depender de protocolo que muda com frequência (doses, calendário vacinal, esquemas terapêuticos), avise no alerta para conferir na diretriz vigente.`,`Você é um elaborador experiente de questões de residência médica no Brasil, com foco no Enamed.

Estilo
- Questões em formato de caso clínico curto e contextualizado, como nas provas brasileiras (Enamed, ENARE, USP, UNIFESP).
- Priorize raciocínio prático: conduta imediata, próximo passo, diagnóstico mais provável e interpretação de exames.
- Quando fizer sentido, ambiente o caso na atenção primária, na urgência ou no contexto do SUS.

Formato
- 4 alternativas (A a D), apenas uma correta.
- Distratores plausíveis, que testem confusões comuns do tema.
- Dificuldade média, como em prova real. Varie os subtópicos entre as questões.

Conteúdo
- Siga diretrizes brasileiras atuais (Ministério da Saúde e sociedades médicas brasileiras).
- Não invente dados, doses ou critérios. Se houver controvérsia, escolha o que a maioria das bancas cobra.

Comentário
- Explique por que a correta está certa e por que cada alternativa errada está errada, de forma direta.
- Resuma o conceito-chave cobrado em uma frase curta, boa para revisar depois.
- Se a resposta depender de protocolo que muda com frequência (doses, calendário vacinal, esquemas terapêuticos), avise no campo de alerta para conferir na diretriz vigente.`];
const promptKey=t=>String(t||"").replace(/\s+/g," ").trim();
OLD_PROMPTS.push(DEFAULT_PROMPT_1026A);
function promptUp(t){return OLD_PROMPTS.some(o=>promptKey(o)===promptKey(t))?DEFAULT_PROMPT:t}
/* referências (Lote 12): no site o pedido vai para uma conversa do Claude com busca na web → pesquisar, confirmar e trazer o link;
   no artefato o sample não tem internet → só referência que conhece com segurança, senão troca a questão (o app descarta questão sem fonte) */
const REF_RULES=()=>window.__site?`Referências (obrigatório): antes de responder, pesquise na internet e confirme cada referência em fonte oficial (Ministério da Saúde/gov.br, sociedades médicas, sites oficiais das diretrizes, PubMed). Confira o ano, a versão vigente e o trecho que sustenta a resposta. Nada inventado: se não conseguir confirmar a referência de uma questão, troque a questão por outra cujo conteúdo você confirmou. No comentário e em cada "porque", use o que a referência diz para justificar a correta e mostrar por que cada errada está errada.`
  :`Referências (obrigatório): você não tem acesso à internet agora, então só gere questões cujo conteúdo e referência você conhece com segurança. Nada inventado: se não tiver uma referência segura para uma questão, troque a questão por outra. Deixe "link" vazio, a não ser que tenha certeza do endereço oficial. No comentário e em cada "porque", use o que a referência diz para justificar a correta e mostrar por que cada errada está errada.`;
const fixedFormat=(nq)=>`Responda apenas com um array JSON de ${nq} objetos, sem nenhum outro texto, cada um neste formato:
{"enunciado": "texto do caso e da pergunta",
 "alternativas": [{"letra": "A", "texto": "...", "porque": "por que esta alternativa está errada neste caso (string vazia na correta)"}, {"letra": "B", "texto": "...", "porque": "..."}],
 "correta": "letra da alternativa correta",
 "comentario": "por que a correta é a melhor resposta",
 "conceito": "conceito-chave em uma frase",
 "alerta": "só quando o tema mudou recentemente ou as fontes divergem: qual versão você seguiu (ano) e o que mudou; nunca 'confira na diretriz'; string vazia se não houver",
 "fonte": "a referência específica que sustenta a resposta: nome da diretriz, consenso ou protocolo + sociedade ou órgão + ano + seção, tabela ou recomendação quando houver (ex.: Diretriz Brasileira de Insuficiência Cardíaca Crônica e Aguda, SBC, 2018, tabela de recomendações de betabloqueadores); ou livro-texto + edição + capítulo; ou manual do Ministério da Saúde + ano. Se a questão saiu do material do estudante, cite o material e a página ou slide",
 "link": "endereço (URL) da página oficial da referência que você consultou; string vazia se não houver"}
${REF_RULES()}
O app embaralha a ordem das alternativas: no comentário e no campo porque, não cite letras; refira-se ao conteúdo da alternativa.
Escreva tudo em português do Brasil.`;
let promptText=DEFAULT_PROMPT, promptEdited=false, settingsDoc=null, sampleFn=null, sampleOff=false, gen={}, qCount=10;
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
function upd(k,fn){const s={...get(k)},l0=s.last,st0=s.step;fn(s);if(s.last&&s.ing)delete s.ing;if((s.last!==l0||s.step!==st0)&&"adj" in s){delete s.adj;delete s.adjFrom}
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
/* filtros da lista: situação (vários juntos = "ou") e atalhos (todos juntos = "e"), mais área e especialidade */
let tf={lv:new Set(),due:false,weak:false,noq:false,high:false,pin:false,sem:false,area:"all",sp:"all"};
function tfNarrow(){return !!(tf.lv.size||tf.due||tf.weak||tf.noq||tf.high||tf.pin||tf.sem)}
function tfOn(){return tf.lv.size||tf.due||tf.weak||tf.noq||tf.high||tf.pin||tf.sem||tf.area!=="all"||tf.sp!=="all"}
function tfReset(){tf={lv:new Set(),due:false,weak:false,noq:false,high:false,pin:false,sem:false,area:"all",sp:"all"};filter="all"}
/* Lote 18: temas ligados aos conteúdos da faculdade dos semestres ativos (o "mapa do que importa" no que você vê agora) */
function semKeys(){const ks=new Set();activeSems().forEach(id=>semDiscs(id).forEach(d=>topicKeysOf(discRefs(d)).forEach(k=>ks.add(k))));return ks}
let semKS=null;
const tfLevel=s=>!s.last&&!(s.l>0)?(s.ing?"i":0):(s.l||1);
function matches(it){const s=get(it.key);
  if(tf.lv.size&&!tf.lv.has(tfLevel(s)))return false;
  if(tf.sem&&!(semKS||(semKS=semKeys())).has(it.key))return false;
  if(tf.due&&!isDue(s))return false;if(tf.weak&&!isWeak(s))return false;if(tf.noq&&s.qt)return false;if(tf.high&&(it.own||wOf(it)!==3))return false;if(tf.pin&&!s.pin)return false;
  if(tf.area!=="all"&&it.area.code!==tf.area)return false;if(tf.sp!=="all"&&it.sp!==tf.sp)return false;
  return !query||norm(it.t+" "+(it.sp||"")+" "+subList(it).map(x=>x.t).join(" ")+" "+(notes[it.key]||"")).includes(query)}

/* Lote 18: próximo passo de cada tema, numa linha curta na lista ([texto, classe]); null = em dia (a data da revisão já aparece) */
function topicNext(it){const s=get(it.key),dd=dueIn(s),L=subList(it),pt=L.length?partSubs(it).pt:null;
  if(isIng(s))return [pt?`Continuar · parte ${pt[0]} de ${pt[1]}`:"Terminar os subtópicos","go"];
  if(!s.last&&!(s.l>0))return [pt?`Começar · parte 1 de ${pt[1]}`:"Começar a estudar",""];
  if(dd!==null&&dd<0)return [calmOn()?`Revisar · pendente há ${-dd} d`:`Revisar · atrasada ${-dd} d`,"late"];if(dd===0)return ["Revisar hoje","late"];
  if(lvDrop(it.key))return ["Acerto caiu: faça questões","warn"];if(isWeak(s))return ["Acerto baixo: faça questões","warn"];
  if(!s.qt)return ["Faça questões do tema",""];if(lvMeets(s))return ["Pronto para Dominado","ok"];return null}
let subQ=null;// tema com a lista rápida de subtópicos aberta na Residência
/* subtópicos: padrão (índice em s.sd) + próprios (s.cs) */
/* Lote 21 item 7: ★ HY nos subtópicos. HY_DEF = ESTIMATIVA DO CLAUDE, PROVISÓRIA até o Banco de questões ter a contagem real por subtópico
   (ENAMED/Revalida/ENARE primeiro, demais bancas como complemento; teto: até 3 subtópicos = 1, 4 a 6 = 2, 7 ou mais = 1/3; feita em 05/11/2026 para os 198 temas). s.hy={índice:"u"|"n"} e cs[j].hy = toque do usuário, que sempre vence. */
const HY_DEF={"CM-1":[2,7,9,11,12,13],"CM-2":[0,2],"CM-5":[1,2],"CM-6":[2,5,9,11,14,15],"CM-7":[2,3,6,7,8,14],"CM-8":[1,5,6,9,13],"CM-10":[0,2],"CM-11":[0,1],"CM-12":[0,2],"CM-3":[1,4,6,8,9,17],"CM-4":[1,2],"CM-31":[0,1,4,6],"CM-32":[0,1],"CM-33":[0,3],"CM-17":[0,3],"CM-18":[1,2],"CM-19":[3,4,5,6,9],"CM-20":[0,1],"CM-13":[0,3,6,8,11],"CM-14":[1,3,10,14,15],"CM-15":[1,2,4,5,9,17],"CM-48":[1,2,3,9],"CM-46":[0,2,3,10],"CM-47":[0,2],"CM-55":[0,2,3],"CM-56":[0,1,4],"CM-51":[0,1,5],"CM-9":[1,2,6],"CM-16":[0,2,5,7],"CM-49":[3,4],"CM-21":[3,4,6,11,14],"CM-22":[0,1],"CM-23":[2,3],"CM-24":[0,4],"CM-25":[0,1],"CM-52":[0,1],"CM-58":[0,6],"CM-57":[0,2],"CM-26":[0,3],"CM-27":[0,1],"CM-28":[0,1],"CM-29":[2,4,5,11],"CM-30":[0,2,3,4],"CM-34":[0,1,2,5,11],"CM-35":[0,2],"CM-36":[0,2],"CM-37":[0,1],"CM-53":[0,1],"CM-40":[2,3],"CM-41":[0,2],"CM-59":[0,1],"CM-38":[1,2,5,6,9],"CM-39":[2,4,5,7],"CM-42":[0,1],"CM-43":[0,3],"CM-44":[0,2],"CM-45":[0,3],"CM-65":[0,2],"CM-50":[1,2],"CM-60":[1,2],"CM-61":[1,3],"CM-62":[0,4],"CM-63":[0,1],"CM-64":[3,7,9],"CM-54":[0,2],"CIR-1":[0,3,6],"CIR-2":[0,2],"CIR-3":[0,2,4,5],"CIR-4":[2,3,4,7],"CIR-5":[0,2,5],"CIR-6":[0,2],"CIR-7":[0,4],"CIR-8":[1,2,3],"CIR-9":[1],"CIR-10":[1,2,3],"CIR-15":[0,2,7],"CIR-16":[0],"CIR-17":[0],"CIR-11":[2,3,4],"CIR-12":[1,2],"CIR-13":[1,2,5],"CIR-14":[1,2],"CIR-18":[1,3,4,8],"CIR-19":[0,1],"CIR-22":[0,1],"CIR-23":[0,1],"CIR-21":[2,3,4],"CIR-26":[0,1],"CIR-20":[1,3,6],"CIR-24":[1,2,6],"CIR-25":[0,5,7],"CIR-27":[0,1],"CIR-28":[1],"CIR-31":[0,1],"CIR-32":[3,4],"CIR-30":[0,2],"CIR-29":[0,1],"CIR-33":[0,1],"CIR-34":[0,2],"CIR-35":[0,2],"CIR-36":[0,2],"PED-6":[2,4,6],"PED-7":[0,3,5],"PED-8":[0,1],"PED-9":[0,3],"PED-10":[0,1,2,3],"PED-11":[0],"PED-12":[0,1],"PED-1":[0,1,6],"PED-2":[0,1,7],"PED-3":[0,4,7,11,13],"PED-4":[2,3,4,9],"PED-5":[0],"PED-20":[0,1],"PED-25":[0,1],"PED-13":[4,5,6],"PED-14":[0,1],"PED-15":[3,4,8],"PED-16":[1,2,7,11],"PED-17":[1,3,4],"PED-18":[0,2,7,9],"PED-19":[0,3,4],"PED-26":[2],"PED-21":[0,2],"PED-22":[0,1],"PED-30":[0,1],"PED-29":[1,2],"PED-23":[0,1],"PED-24":[0,1],"PED-28":[0,1],"PED-32":[0,2],"PED-33":[0,2],"PED-27":[0,3],"PED-31":[0,2],"GO-1":[2,4,6,7],"GO-2":[3,4,5,6],"GO-31":[0,1],"GO-32":[0],"GO-14":[1,4],"GO-3":[1,4,6,9],"GO-4":[1,2,4,5],"GO-12":[0,1,2],"GO-13":[0,1],"GO-33":[0,2],"GO-5":[0,4,9],"GO-6":[1,5,7],"GO-7":[0,2,5],"GO-8":[0,1,3,4],"GO-9":[4,6,7],"GO-10":[0,1],"GO-11":[1,3,6],"GO-15":[0,1],"GO-16":[0],"GO-17":[0,1,5],"GO-18":[0,1],"GO-19":[0,1],"GO-20":[0,1,3],"GO-30":[0,2],"GO-21":[1,4,7,9],"GO-24":[0,3],"GO-25":[0,1],"GO-26":[1,2],"GO-27":[0,2],"GO-28":[1,2],"GO-22":[0,1],"GO-23":[0,3],"GO-29":[0,1],"PREV-1":[0,3,4],"PREV-2":[0,6,7],"PREV-3":[0,1],"PREV-6":[0,1],"PREV-7":[0,1],"PREV-8":[0,1],"PREV-29":[0,2],"PREV-30":[0,1],"PREV-4":[0,2],"PREV-5":[0,1,6],"PREV-27":[0,1],"PREV-28":[0,1],"PREV-9":[3,4,5],"PREV-10":[1,2],"PREV-11":[0,2],"PREV-24":[0,1],"PREV-12":[0,3,5],"PREV-13":[0,1],"PREV-23":[0,2],"PREV-31":[0],"PREV-14":[5,6,8],"PREV-15":[0,2],"PREV-16":[1,2,5],"PREV-17":[1,2],"PREV-21":[0,2],"PREV-22":[2,3],"PREV-18":[2,3,4],"PREV-19":[0,1,4],"PREV-20":[1,6],"PREV-25":[0,1,3],"PREV-26":[2,4]};
function subList(it){const s=get(it.key),sd=s.sd||[],dn=s.dn||{},df=DN_DEF[it.key]||[],hy=s.hy||{},hd=HY_DEF[it.key]||[];
  return [...it.subs.map((t,i)=>({t,done:sd.includes(i),i,dn:dn[i]||(df.includes(i)?"c":""),hy:hy[i]==="u"||hy[i]!=="n"&&hd.includes(i),hyc:!hy[i]&&hd.includes(i)})),...(s.cs||[]).map((c,j)=>({t:c.t,done:!!c.d,j,dn:c.dn||"",hy:c.hy==="u"}))]}
function setHy(it,x,on){upd(it.key,s=>{if(x.i!==undefined){const h={...(s.hy||{})};const def=(HY_DEF[it.key]||[]).includes(x.i);if(on===def)delete h[x.i];else h[x.i]=on?"u":"n";if(Object.keys(h).length)s.hy=h;else delete s.hy}
  else s.cs=(s.cs||[]).map((c,j)=>{if(j!==x.j)return c;const o={...c};if(on)o.hy="u";else delete o.hy;return o})});commit()}
const hyFirst=L=>[...L.filter(x=>x.hy),...L.filter(x=>!x.hy)];
/* subtópico denso: conta como dois no tamanho da parte do dia. dn: "u" = você marcou, "n" = você tirou, "c" = sugerido pelo Claude (vale até você mudar) */
const dnHeavy=x=>x.dn==="u"||x.dn==="c";
const subW=x=>dnHeavy(x)?2:1;
const PART_BIG=6,PART_CAP=4;
/* revisão do Claude (10/2026) dos 198 temas: subtópicos densos por índice. Valem como sugestão ("c") até você mudar; tema listado aqui já foi revisado */
const DN_DEF={"CM-1":[10],"CM-2":[2],"CM-5":[],"CM-6":[14,17],"CM-7":[13,15],"CM-8":[0,13],"CM-10":[0,1,2,3],"CM-11":[],"CM-12":[],"CM-3":[7,16],"CM-4":[],"CM-31":[6],"CM-32":[0,1],"CM-33":[],"CM-17":[2],"CM-18":[1],"CM-19":[],"CM-20":[3],"CM-13":[6],"CM-14":[7],"CM-15":[5,11],"CM-48":[9],"CM-46":[3],"CM-47":[0,1,2,3,4],"CM-51":[0,7],"CM-9":[],"CM-16":[11],"CM-49":[0],"CM-21":[0,14],"CM-22":[1],"CM-23":[0,2],"CM-24":[0],"CM-25":[],"CM-52":[0,1,3],"CM-26":[0],"CM-27":[2],"CM-28":[0,1,2],"CM-29":[2],"CM-30":[4,11],"CM-34":[2,5,7,11],"CM-35":[0,1,2,3],"CM-36":[0,1,2],"CM-37":[0,1,3],"CM-53":[],"CM-40":[0,3],"CM-41":[0,2],"CM-38":[2,6],"CM-39":[2,3],"CM-42":[0,2,4],"CM-43":[0,3],"CM-44":[0,3],"CM-45":[0,3],"CM-50":[1,6,7],"CM-55":[3],"CM-56":[0],"CM-57":[],"CM-58":[],"CM-59":[],"CM-60":[3],"CM-61":[],"CM-62":[],"CM-63":[],"CM-64":[],"CM-65":[],"CIR-35":[],"CIR-36":[],"CM-54":[0],"CIR-1":[0],"CIR-2":[],"CIR-3":[],"CIR-4":[7],"CIR-5":[5],"CIR-6":[0,2],"CIR-7":[0],"CIR-8":[2],"CIR-9":[1],"CIR-10":[],"CIR-15":[],"CIR-16":[],"CIR-17":[0],"CIR-11":[3],"CIR-12":[],"CIR-13":[2,6],"CIR-14":[0,2],"CIR-18":[],"CIR-19":[],"CIR-22":[],"CIR-23":[0,1],"CIR-21":[2,7],"CIR-26":[0,2],"CIR-20":[0],"CIR-24":[0],"CIR-25":[0],"CIR-27":[0,1],"CIR-28":[],"CIR-31":[],"CIR-32":[],"CIR-30":[0,1,2],"CIR-29":[0,1],"CIR-33":[],"CIR-34":[],"PED-6":[4],"PED-7":[5],"PED-8":[0],"PED-9":[0],"PED-10":[],"PED-11":[],"PED-12":[],"PED-1":[6],"PED-2":[0],"PED-3":[0],"PED-4":[],"PED-5":[],"PED-20":[2],"PED-25":[1],"PED-13":[],"PED-14":[],"PED-15":[4],"PED-16":[],"PED-17":[3],"PED-18":[0,2],"PED-19":[3],"PED-26":[],"PED-21":[2],"PED-22":[0,1],"PED-30":[1,2],"PED-29":[],"PED-23":[],"PED-24":[],"PED-28":[0,1],"PED-32":[0],"PED-33":[],"PED-27":[2],"PED-31":[],"GO-1":[6],"GO-2":[2,5],"GO-31":[1],"GO-32":[],"GO-14":[],"GO-3":[2,6],"GO-4":[1],"GO-12":[],"GO-13":[0],"GO-33":[0],"GO-5":[4],"GO-6":[7],"GO-7":[2,5],"GO-8":[4],"GO-9":[4],"GO-10":[1],"GO-11":[2,5],"GO-15":[],"GO-16":[],"GO-17":[7],"GO-18":[1,3],"GO-19":[1],"GO-20":[3,6],"GO-30":[1,2],"GO-21":[1,3],"GO-24":[0],"GO-25":[],"GO-26":[0,1],"GO-27":[],"GO-28":[],"GO-22":[],"GO-23":[],"GO-29":[1],"PREV-1":[],"PREV-2":[0],"PREV-3":[],"PREV-6":[],"PREV-7":[],"PREV-8":[],"PREV-29":[],"PREV-30":[],"PREV-4":[],"PREV-5":[],"PREV-27":[],"PREV-28":[],"PREV-9":[3],"PREV-10":[],"PREV-11":[],"PREV-24":[],"PREV-12":[1],"PREV-13":[],"PREV-23":[],"PREV-31":[],"PREV-14":[5,6],"PREV-15":[],"PREV-16":[],"PREV-17":[],"PREV-21":[],"PREV-22":[4],"PREV-18":[0],"PREV-19":[],"PREV-20":[],"PREV-25":[],"PREV-26":[4]};
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

/* anotações */
const NOTE_MAX=60000;
let noteAt={}, noteMode={}, noteAI={}, noteUndo={}, focusKey=null, nQuery="", nArea="all", nOpen=new Set(), downloadsFn=null;
function wordCount(t){return (t.match(/\S+/g)||[]).length}
function whenLabel(iso){if(!iso)return "";const d=new Date(iso);if(isNaN(d))return "";
  const loc=x=>x.getFullYear()+"-"+x.getMonth()+"-"+x.getDate();const day=loc(d)===loc(new Date())?"hoje":d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
  return day+" às "+d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
function saveNotesLocal(){try{localStorage.setItem(LSN,JSON.stringify(notes));localStorage.setItem(LSN+"-at",JSON.stringify(noteAt))}catch(e){}}
function setNoteStatus(k,t){document.querySelectorAll(`[data-ns="${k}"]`).forEach(s=>s.textContent=t)}
function noteFoot(k){const t=notes[k]||"";return t?`${wordCount(t)} palavras · editado ${whenLabel(noteAt[k])}`:"Salva automaticamente enquanto você escreve."}
function saveNote(k,v){const old=notes[k]||"";
  v=v.slice(0,NOTE_MAX);notes[k]=v;noteAt[k]=new Date().toISOString();if(!v.trim()){delete notes[k];delete noteAt[k];if(old.trim().length>=20)toTrash("note",topicName(k),"Anotação do tema",{k,t:old})}
  saveNotesLocal();
  document.querySelectorAll(`[data-nw="${k}"]`).forEach(s=>s.textContent=noteFoot(k));
  setNoteStatus(k,notesStore?"Salvando…":"Salvo neste navegador");
  clearTimeout(noteTimers[k]);if(!notesStore)return;
  noteTimers[k]=setTimeout(async()=>{noteTimers[k]=0;
    try{const d=notesStore.doc(k);if(notes[k])await d.set({t:notes[k],updatedAt:noteAt[k]});else await d.delete();
      setNoteStatus(k,"Salvo na sua conta");saveOk("nt:"+k)}
    catch(e){if(notes[k])saveFail("nt:"+k,`a anotação de ${topicName(k)}`,e,()=>saveNote(k,notes[k]));setNoteStatus(k,e&&e.code==="quota_exceeded"?"Espaço da conta cheio; ficou salvo neste navegador":"Não foi possível salvar na conta; ficou salvo neste navegador")}},900)}
function replaceNote(k,v){noteUndo[k]=notes[k]||"";saveNote(k,v)}

/* markdown simples → HTML seguro */
function esc(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function inl(s){const keep=[],ph=h=>{keep.push(h);return "\u0000"+(keep.length-1)+"\u0000"};
  s=String(s).replace(/\[\[([^\[\]\n|]{1,120})(?:\|([^\[\]\n]{1,120}))?\]\]/g,(m,a,b)=>ph(wkHTML(a.trim(),(b||"").trim()))).replace(/\{\{([eq]):([A-Za-z0-9:_-]{1,80})\}\}/g,(m,t,id)=>ph(nbHTML(t,id)));
  return esc(s).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/(^|[\s(])(https?:\/\/[^\s<]+)/g,'$1<a href="$2" target="_blank" rel="noopener">$2</a>').replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/==(.+?)==/g,"<mark>$1</mark>").replace(/(^|[\s(])_(.+?)_(?=[\s.,;:!?)]|$)/g,"$1<em>$2</em>").replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s.,;:!?)]|$)/g,"$1<em>$2</em>").replace(/\u0000(\d+)\u0000/g,(m,i)=>keep[+i])}
function md(src,o){o=o||{};
  const L=String(src).replace(/\r/g,"").split("\n"),out=[];let i=0;
  const isRow=l=>/^\s*\|.*\|\s*$/.test(l), isSep=l=>/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
  const cells=l=>l.trim().replace(/^\||\|$/g,"").split("|").map(c=>inl(c.trim()));
  while(i<L.length){const l=L[i];
    if(!l.trim()){i++;continue}
    if(/^\s*```/.test(l)){const lang=l.trim().slice(3).trim().toLowerCase(),b=[];i++;while(i<L.length&&!/^\s*```/.test(L[i])){b.push(L[i]);i++}i++;
      out.push(lang==="fluxo"?flowHTML(b):`<pre class="mdpre">${esc(b.join("\n"))}</pre>`);continue}
    let m;
    if(m=l.match(/^(#{1,3})\s+(.*)/)){const n=m[1].length;out.push(`\u0001${n}<h${n+2} class="mdh">${inl(m[2])}</h${n+2}>`);i++;continue}
    if(/^\s*(-{3,}|\*{3,})\s*$/.test(l)){out.push("<hr>");i++;continue}
    if(isRow(l)){const rows=[];while(i<L.length&&isRow(L[i])){rows.push(L[i]);i++}
      let head=null;if(rows.length>1&&isSep(rows[1])){head=cells(rows[0]);rows.splice(0,2)}
      const body=rows.filter(r=>!isSep(r)).map(cells);
      out.push(`<div class="mdtable"><table>${head?`<thead><tr>${head.map(c=>`<th>${c}</th>`).join("")}</tr></thead>`:""}<tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);continue}
    if(/^\s*>/.test(l)){const b=[];while(i<L.length&&/^\s*>/.test(L[i])){b.push(inl(L[i].replace(/^\s*>\s?/,"")));i++}
      out.push(`<div class="callout">${b.join("<br>")}</div>`);continue}
    if(/^\s*[-*\u2022](\s+|$)/.test(l)){const b=[];while(i<L.length&&/^\s*[-*\u2022](\s+|$)/.test(L[i])){const ind=L[i].match(/^\s*/)[0].replace(/\t/g,"  ").length,cls=ind>=4?"sub3":ind>=2?"sub2":"";b.push({cls,h:inl(L[i].replace(/^\s*[-*\u2022]\s*/,""))});i++}
      out.push(`<ul>${b.map((x,j)=>{const kid=o.fold&&b[j+1]&&(x.cls===""?b[j+1].cls!=="":x.cls==="sub2"&&b[j+1].cls==="sub3");return `<li${x.cls||kid?` class="${[x.cls,kid?"haskids":""].filter(Boolean).join(" ")}"`:""}>${kid?`<button type="button" class="lfold" aria-expanded="true" aria-label="Recolher os subitens"></button>`:""}${x.h}</li>`}).join("")}</ul>`);continue}
    if(/^\s*\d+[.)](\s+|$)/.test(l)){const b=[];while(i<L.length&&/^\s*\d+[.)](\s+|$)/.test(L[i])){b.push(`<li>${inl(L[i].replace(/^\s*\d+[.)]\s*/,""))}</li>`);i++}
      out.push(`<ol>${b.join("")}</ol>`);continue}
    const p=[];while(i<L.length&&L[i].trim()&&!/^(#{1,3}\s|\s*>|\s*[-*\u2022](\s+|$)|\s*\d+[.)](\s+|$)|\s*\||\s*```)/.test(L[i])&&!/^\s*(-{3,}|\*{3,})\s*$/.test(L[i])){p.push(inl(L[i]));i++}
    if(p.length)out.push(`<p>${p.join("<br>")}</p>`);else i++;
  }
  return mdFold(out,o.fold);
}
/* tópicos que recolhem: cada título (#, ##, ###) vira uma seção que abre e fecha; o app lembra o que ficou fechado */
const LSFOLD="resid-fold-v1";let foldSt={};try{const v=JSON.parse(localStorage.getItem(LSFOLD)||"{}");if(v&&typeof v==="object")foldSt=v}catch(e){}
function foldSave(){try{localStorage.setItem(LSFOLD,JSON.stringify(foldSt))}catch(e){}}
function mdFold(out,key){if(!key)return out.map(x=>x.replace(/^\u0001\d/,"")).join("");const closed=new Set(foldSt[key]||[]);let idx=0;
  const build=(from,lv)=>{let html="",i=from;while(i<out.length){const x=out[i],m=x.match(/^\u0001(\d)/);
      if(m){const n=+m[1];if(n<=lv)break;const my=idx++;const r=build(i+1,n);html+=`<details class="mdsec" data-fk="${esc(String(key))}" data-fi="${my}"${closed.has(my)?"":" open"}><summary>${x.slice(2)}</summary><div class="mdsb">${r.html}</div></details>`;i=r.i;continue}
      html+=x;i++}
    return {html,i}};
  return build(0,0).html}
document.addEventListener("toggle",e=>{const d=e.target;if(!d||!d.matches||!d.matches("details.mdsec[data-fk]"))return;const k=d.dataset.fk,i=+d.dataset.fi,set=new Set(foldSt[k]||[]);
  if(d.open)set.delete(i);else set.add(i);if(set.size)foldSt[k]=[...set];else delete foldSt[k];foldSave()},true);
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("button.lfold");if(b){e.preventDefault();const li=b.closest("li"),lv=li.classList.contains("sub2")?2:0,open=b.getAttribute("aria-expanded")!=="true";
    b.setAttribute("aria-expanded",open);b.setAttribute("aria-label",open?"Recolher os subitens":"Mostrar os subitens");li.classList.toggle("folded",!open);
    let n=li.nextElementSibling;while(n&&(lv===0?n.matches(".sub2,.sub3"):n.matches(".sub3"))){n.hidden=!open;if(open&&n.classList.contains("folded")){let m=n.nextElementSibling;while(m&&m.matches(".sub3")){m.hidden=true;m=m.nextElementSibling}}n=n.nextElementSibling}return}
  const a=e.target.closest&&e.target.closest("a.wk[data-wk]");if(a){e.preventDefault();wkGo(a.dataset.wk);return}
  const nb=e.target.closest&&e.target.closest("button.nbadge[data-nb]");if(nb){e.preventDefault();nbGo(nb.dataset.nb)}});
/* links entre temas: [[Nome do tema]] ou [[Nome|texto]] liga a um tema da residência, da faculdade ou a uma página do caderno livre */
let wkIdx=null,wkSig="";
function wkIndex(){const sig=FAC_ITEMS.length+"|"+freeN.map(f=>f.id+":"+f.t).join(",");if(wkIdx&&sig===wkSig)return wkIdx;wkSig=sig;const m=new Map(),all=[];
  [...ALL,...FAC_ITEMS].forEach(it=>{const n=norm(it.t).trim();if(!m.has(n))m.set(n,{kind:"t",id:it.key,t:it.t});all.push({n,r:{kind:"t",id:it.key,t:it.t}})});
  freeN.forEach(f=>{const n=norm(f.t||"").trim();if(n&&!m.has(n))m.set(n,{kind:"f",id:f.id,t:f.t});if(n)all.push({n,r:{kind:"f",id:f.id,t:f.t}})});
  if(typeof mdCache!=="undefined")mdCache.clear();wkIdx={m,all};return wkIdx}
function wkFind(name){const I=wkIndex(),n=norm(String(name||"")).trim();if(!n)return null;if(I.m.has(n))return I.m.get(n);
  const c=I.all.filter(x=>x.n.startsWith(n));return c.length===1?c[0].r:null}
function wkHTML(name,alias){const r=wkFind(name),lab=alias||name;
  return r?`<a class="wk" href="#" data-wk="${esc(r.kind+":"+r.id)}" title="${esc(r.kind==="f"?"Caderno livre: ":"Abrir ")+esc(r.t||"")}">${esc(lab)}</a>`:`<span class="wk miss" title="Nenhum tema ou página com este nome">${esc(lab)}</span>`}
function wkGo(ref){const i=ref.indexOf(":"),kind=ref.slice(0,i),id=ref.slice(i+1);
  if(kind==="t"&&BYKEY[id]){detTab[id]="notas";noteMode[id]="ler";openTopic(id);return}
  if(kind==="f"&&freeN.some(f=>f.id===id)){backStack=[];freeOpen.add(id);if(typeof setNSeg==="function")nSeg="livre";setView("notas");setTimeout(()=>{const x=document.getElementById("fr-"+id);if(x)x.scrollIntoView({block:"start",behavior:"smooth"})},60)}}
/* links de uma anotação (para "Mencionado em") */
function wkLinksIn(txt){const out=[];String(txt||"").replace(/\[\[([^\[\]\n|]{1,120})(?:\|[^\[\]\n]{1,120})?\]\]/g,(m,a)=>{const r=wkFind(a.trim());if(r)out.push(r);return m});return out}
function wkSources(){const L=[];Object.keys(notes).forEach(k=>{if(BYKEY[k]&&(notes[k]||"").trim())L.push({kind:"t",id:k,t:BYKEY[k].t,txt:notes[k]})});freeN.forEach(f=>{if((f.b||"").trim())L.push({kind:"f",id:f.id,t:f.t||"Sem título",txt:f.b})});return L}
function wkBack(ref){const name=ref.kind==="t"?(BYKEY[ref.id]||{}).t:(freeN.find(f=>f.id===ref.id)||{}).t,nn=norm(name||"").trim(),men=[],unl=[];
  wkSources().forEach(S=>{if(S.kind===ref.kind&&S.id===ref.id)return;const links=wkLinksIn(S.txt);
    if(links.some(r=>r.kind===ref.kind&&r.id===ref.id)){men.push(S);return}
    if(nn.length>=5){const at=wkPlainAt(S.txt,nn);if(at>=0)unl.push({...S,at,len:nn.length})}});
  return {men,unl}}
/* posição do nome escrito sem link (fora de [[…]], de links e de títulos de código), com limites de palavra */
function wkPlainAt(txt,nn){const t=norm(txt);let from=0;while(true){const i=t.indexOf(nn,from);if(i<0)return -1;from=i+1;
  const pre=t[i-1]||" ",post=t[i+nn.length]||" ";if(/[a-z0-9]/.test(pre)||/[a-z0-9]/.test(post))continue;
  const o=t.lastIndexOf("[[",i),c=t.lastIndexOf("]]",i);if(o>=0&&o>c)continue;const ln=t.lastIndexOf("\n",i)+1;if(/^\s*```/.test(t.slice(ln)))continue;return i}}
function wkLinkify(S,ref){const name=ref.kind==="t"?BYKEY[ref.id].t:(freeN.find(f=>f.id===ref.id)||{}).t||"",at=S.at,orig=S.txt.slice(at,at+S.len),tok=orig===name?`[[${name}]]`:`[[${name}|${orig}]]`,v=S.txt.slice(0,at)+tok+S.txt.slice(at+S.len);
  if(S.kind==="t")replaceNote(S.id,v);else{const f=freeN.find(x=>x.id===S.id);if(f){f.b=v;f.at=new Date().toISOString();frPut(f)}}render()}
function wkBackEl(ref){const B=wkBack(ref),w=el(`<div class="wkback"></div>`);
  const go=S=>{const b=el(`<button class="wkchip" type="button"></button>`);b.textContent=(S.kind==="f"?"📓 ":"")+S.t;b.onclick=()=>wkGo(S.kind+":"+S.id);return b};
  const h=el(`<div class="wkrow"><span class="glabel">Mencionado em</span></div>`);if(B.men.length){const c=el(`<div class="wkchips"></div>`);B.men.forEach(S=>c.appendChild(go(S)));h.appendChild(c)}
  else h.appendChild(el(`<span class="how">Nenhuma anotação liga para cá ainda. Em outra anotação, escreva <code>[[${esc(ref.kind==="t"?BYKEY[ref.id].t:"Nome")}]]</code> para criar um link.</span>`));w.appendChild(h);
  if(B.unl.length){const u=el(`<div class="wkrow"><span class="glabel">Citado sem link · ${B.unl.length}</span><ul class="wkunl"></ul></div>`),ul=u.querySelector("ul");
    B.unl.slice(0,8).forEach((S,j)=>{const li=el(`<li><span class="wkctx"></span><button class="mini" type="button">Transformar em link</button></li>`),cx=li.querySelector(".wkctx");cx.appendChild(go(S));
      const a=Math.max(0,S.at-50),q=el(`<q></q>`);q.textContent=(a?"…":"")+S.txt.slice(a,S.at+S.len+50).replace(/\s+/g," ")+"…";cx.appendChild(q);const b=li.querySelector("button");b.id=`wkl-${j}`;b.onclick=()=>wkLinkify(S,ref);ul.appendChild(li)});
    w.appendChild(u)}
  return w}
/* selos de erro e de questão dentro do texto: {{e:<id do erro>}} e {{q:<id da prova>:<nº>}} */
function nbInfo(t,id){if(t==="e"){const e=errors.find(x=>x.id===id);return e?{lab:`Erro · ${br(e.d).slice(0,5)}`,tip:eOneLine(e.r).slice(0,120),ok:true}:{lab:"Erro apagado",ok:false}}
  const [xid,ix]=id.split(":"),ex=exams.find(x=>x.id===xid),r=ex&&ex.qs[+ix];return r?{lab:`${ex.banca||ex.name}${ex.ano?" · "+ex.ano:""} · Q${r.n||+ix+1}`,tip:r.q.enunciado.replace(/\s+/g," ").slice(0,120),ok:true}:{lab:"Questão apagada",ok:false}}
function nbHTML(t,id){const I=nbInfo(t,id);return `<button type="button" class="nbadge n${t}${I.ok?"":" gone"}" data-nb="${esc(t+":"+id)}"${I.tip?` title="${esc(I.tip)}"`:""}${I.ok?"":" disabled"}>${t==="e"?"⚠":"?"} ${esc(I.lab)}</button>`}
function nbGo(ref){const t=ref[0],id=ref.slice(2);if(t==="e"){const e=errors.find(x=>x.id===id);if(e)eOpenOne(e);return}
  const [xid,ix]=id.split(":"),ex=exams.find(x=>x.id===xid);if(!ex||!ex.qs[+ix])return;exRun={id:xid,view:"rev",i:+ix,cad:{}};exEdit=null;backStack=[];qSeg="praticar";qPart="provas";setView("quest");setTimeout(()=>{const h=$("#exh");if(h)h.scrollIntoView({block:"start"})},60)}
/* o que pode virar selo num tema: erros ativos e questões de provas na íntegra desse tema */
function nbChoices(k){const KS=new Set(Array.isArray(k)?k:[k]),many=KS.size>1,E=errors.filter(e=>KS.has(e.k)&&!e.arch).sort(byNewest).slice(0,20).map(e=>({tok:`{{e:${e.id}}}`,lab:`Erro · ${br(e.d).slice(0,5)}${many&&BYKEY[e.k]?" · "+BYKEY[e.k].t:""}`,sub:eOneLine(e.w||e.r).slice(0,90)}));
  const Q=[];exams.forEach(ex=>ex.qs.forEach((r,i)=>{if(KS.has(r.k)&&Q.length<30){const a=exPg(ex.id).a[i];Q.push({tok:`{{q:${ex.id}:${i}}}`,lab:`${ex.banca||ex.name}${ex.ano?" · "+ex.ano:""} · Q${r.n||i+1}`,sub:(a?(a.l===r.q.correta?"✓ acertou · ":"✗ errou · "):"")+r.q.enunciado.replace(/\s+/g," ").slice(0,80),w:a&&a.l!==r.q.correta})}}));
  Q.sort((a,b)=>(b.w?1:0)-(a.w?1:0));return {E,Q}}


/* editor: [[ abre a lista de temas; Tab/Shift+Tab mudam o recuo; Selo insere {{e:…}} ou {{q:…}} */
function wkPopUpdate(ta,k,pop){const c=ta.selectionStart,v=ta.value,m=/\[\[([^\[\]\n|]{0,40})$/.exec(v.slice(0,c));
  if(!m||c!==ta.selectionEnd){pop.hidden=true;ta._wk=null;return}
  const q=norm(m[1]).trim(),I=wkIndex(),seen=new Set(),L=[];
  const push=x=>{const id=x.r.kind+":"+x.r.id;if(!seen.has(id)&&!(x.r.kind==="t"&&x.r.id===k)){seen.add(id);L.push(x.r)}};
  I.all.filter(x=>!q||x.n.startsWith(q)).forEach(push);if(q)I.all.filter(x=>x.n.includes(q)).forEach(push);
  const list=L.slice(0,7);ta._wk={start:c-m[1].length-2,sel:Math.min((ta._wk&&ta._wk.sel)||0,Math.max(0,list.length-1)),list};
  pop.innerHTML="";pop.hidden=false;
  if(!list.length){pop.appendChild(el(`<p class="how">${q?"Nenhum tema ou página com esse nome.":"Digite o nome do tema."} Esc fecha.</p>`));return}
  list.forEach((r,i)=>{const b=el(`<button type="button" class="wkopt" role="option"><b></b><span></span></button>`);b.id=`wko-${i}`;b.setAttribute("aria-selected",i===ta._wk.sel);
    b.querySelector("b").textContent=r.t;const it=r.kind==="t"&&BYKEY[r.id];b.querySelector("span").textContent=r.kind==="f"?"Caderno livre":it?`${it.area.code}${it.sp?" · "+it.sp:""}${it.own?" · FAC":""}`:"";
    b.onmousedown=e=>e.preventDefault();b.onclick=()=>wkPick(ta,k,pop,i);pop.appendChild(b)})}
function wkPick(ta,k,pop,i){const W=ta._wk;if(!W||!W.list[i])return;const r=W.list[i],c=ta.selectionStart,v=ta.value,after=v.slice(c).startsWith("]]")?c+2:c,tok=`[[${r.t}]]`;
  edit(ta,k,()=>({v:v.slice(0,W.start)+tok+v.slice(after),s:W.start+tok.length,e:W.start+tok.length}));pop.hidden=true;ta._wk=null}
function wkPopKey(e,ta,k,pop){const W=ta._wk;if(!W||pop.hidden)return false;
  if(e.key==="Escape"){pop.hidden=true;ta._wk=null;e.preventDefault();e.stopPropagation();return true}
  if(!W.list.length)return false;
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();W.sel=(W.sel+(e.key==="ArrowDown"?1:W.list.length-1))%W.list.length;pop.querySelectorAll(".wkopt").forEach((b,j)=>b.setAttribute("aria-selected",j===W.sel));return true}
  if(e.key==="Enter"||e.key==="Tab"){e.preventDefault();wkPick(ta,k,pop,W.sel);return true}return false}
function indentLines(ta,k,out){edit(ta,k,(v,s,e)=>{const ls=v.lastIndexOf("\n",s-1)+1;let le=v.indexOf("\n",e>s&&v[e-1]==="\n"?e-1:e);if(le<0)le=v.length;
  const lines=v.slice(ls,le).split("\n");let d0=0,dt=0;const nl=lines.map((l,i)=>{let n;if(out){const r=l.match(/^ {1,2}|^\t/);n=r?l.slice(r[0].length):l;const d=n.length-l.length;if(i===0)d0=d;dt+=d}else{n="  "+l;if(i===0)d0=2;dt+=2}return n});
  const blk=nl.join("\n");return {v:v.slice(0,ls)+blk+v.slice(le),s:Math.max(ls,s+d0),e:Math.max(ls,e+dt)}})}
function nbPickEl(ta,k,close,keys){const C=nbChoices(keys||k),w=el(`<div class="nbpick" role="dialog" aria-label="Marcar questão ou erro"><div class="dhead"><b>Marcar questão ou erro na linha</b><button class="link" type="button">Fechar</button></div></div>`);
  w.querySelector(".link").onclick=close;
  const grp=(lab,L,empty)=>{w.appendChild(el(`<span class="glabel">${lab}</span>`));if(!L.length){w.appendChild(el(`<p class="how">${empty}</p>`));return}
    const ul=el(`<ul class="nbopts"></ul>`);L.forEach((x,i)=>{const li=el(`<li><button type="button"><b></b><span></span></button></li>`),b=li.querySelector("button");b.querySelector("b").textContent=x.lab;b.querySelector("span").textContent=x.sub;
      b.onmousedown=e=>e.preventDefault();b.onclick=()=>{edit(ta,k,(v,s,e)=>{const ins=(s>0&&!/\s/.test(v[s-1])?" ":"")+x.tok;return {v:v.slice(0,s)+ins+v.slice(e),s:s+ins.length,e:s+ins.length}});close()};ul.appendChild(li)});w.appendChild(ul)};
  const fr=Array.isArray(keys);if(fr&&!keys.length){w.appendChild(el(`<p class="how">Ligue esta página a um ou mais temas (em Ligar a temas, abaixo) para listar os erros e as questões deles.</p>`));return w}
  grp(fr?"Erros dos temas ligados":"Erros deste tema",C.E,fr?"Nenhum erro ativo nos temas ligados.":"Nenhum erro ativo deste tema no caderno.");grp("Questões de provas na íntegra",C.Q,fr?"Nenhuma questão de prova importada nos temas ligados.":"Nenhuma questão de prova importada ligada a este tema.");return w}
/* edição na textarea */
function edit(ta,k,fn){const s=ta.selectionStart,e=ta.selectionEnd,v=ta.value;const r=fn(v,s,e);
  ta.value=r.v;ta.focus();ta.setSelectionRange(r.s,r.e);if(typeof k==="function")k(ta.value);else saveNote(k,ta.value)}
/* Lote 20C: pegadinha estruturada "> Pegadinha: … — Por quê: …" (a linha atual vira a pegadinha; o cursor fica no porquê) */
function pegInsert(ta,k){edit(ta,k,(v,s,e)=>{const ls=v.lastIndexOf("\n",s-1)+1;let le=v.indexOf("\n",e);if(le<0)le=v.length;const line=v.slice(ls,le);if(/^\s*>/.test(line))return {v,s,e};
  const body=line.replace(/^\s*[-*•]\s+/,"").trim(),ph="o que costuma enganar";if(!body){const ins=`> Pegadinha: ${ph} — Por quê: `;return {v:v.slice(0,ls)+ins+v.slice(le),s:ls+13,e:ls+13+ph.length}}
  const ins=`> Pegadinha: ${body} — Por quê: `;return {v:v.slice(0,ls)+ins+v.slice(le),s:ls+ins.length,e:ls+ins.length}})}
function wrap(ta,k,a,b,ph){edit(ta,k,(v,s,e)=>{const sel=v.slice(s,e)||ph;return {v:v.slice(0,s)+a+sel+b+v.slice(e),s:s+a.length,e:s+a.length+sel.length}})}
function prefix(ta,k,pre,numbered){edit(ta,k,(v,s,e)=>{const ls=v.lastIndexOf("\n",s-1)+1;let le=v.indexOf("\n",e);if(le<0)le=v.length;
  let n=0;const block=v.slice(ls,le).split("\n").map(l=>(numbered?(++n)+". ":pre)+l.replace(/^(#{1,3}\s|>\s?|[-*]\s|\d+[.)]\s)/,"")).join("\n");
  return {v:v.slice(0,ls)+block+v.slice(le),s:ls,e:ls+block.length}})}
function insertBlock(ta,k,txt){edit(ta,k,(v,s,e)=>{const before=v.slice(0,s),after=v.slice(e);
  const pre=before&&!before.endsWith("\n\n")?(before.endsWith("\n")?"\n":"\n\n"):"";const post=after&&!after.startsWith("\n")?"\n\n":"";
  const ins=pre+txt+post,end=before.length+pre.length+txt.length;return {v:before+ins+after,s:end,e:end}})}
const TPL_RESUMO=`## Conceito-chave
Uma ou duas frases com o essencial.

## Quadro clínico
-

## Diagnóstico
-

## Conduta
1.

## Pegadinhas de prova
>

## Fontes
- `;
const TPL_TABELA=`| Critério | Opção A | Opção B |
|---|---|---|
| Quadro clínico |  |  |
| Diagnóstico |  |  |
| Conduta |  |  |`;
function tplSubs(it){return subList(it).map(x=>`## ${x.t}\n- `).join("\n\n")}
