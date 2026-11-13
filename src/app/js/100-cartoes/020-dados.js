/* Aba Cartões (13/11/2026): contas da lista, do criador e dos Números. Funções puras (sem tela); testes em tests/unit/cartoes.test.js.
   Desenho: docs/superpowers/specs/2026-11-13-aba-cartoes-design.md */
const cdTxt=h=>String(h||"").replace(/<br\s*\/?>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();
function cdState(x){if(x.dr)return "rascunho";if(x.su)return "suspenso";if(!x.f||!x.f.st)return "novo";return x.f.st===2?"revisao":"aprendendo"}
function cdOrigin(x){if(x.eid)return "erro";if(x.og==="tr")return "trecho";if(x.og==="q")return "questao";if(x.kind==="man")return "manual";
  if(x.kind&&CDK[x.kind])return "questao";return x.src==="claude"?"claude":"manual"}
/* colar vários: um cartão por linha, "pergunta :: resposta" ou separado por tabulação (o .txt do Anki e da planilha) */
function cdParsePaste(txt){const ok=[],bad=[];String(txt||"").split(/\r?\n/).forEach((l,i)=>{if(!l.trim())return;
  let j=l.indexOf("::"),w=2;const t=l.indexOf("\t");if(j<0||(t>=0&&t<j)){j=t;w=1}
  const q=j<0?"":l.slice(0,j).trim(),a=j<0?"":l.slice(j+w).trim();if(q&&a)ok.push({q,a,line:i+1});else bad.push(i+1)});return {ok,bad}}
const cdWords=s=>new Set(norm(cdTxt(s)).split(/[^a-z0-9]+/).filter(w=>w.length>2));
function cdDupOf(k,q,exceptId){const A=cdWords(q),nq=norm(cdTxt(q)).replace(/[^a-z0-9]+/g," ").trim();if(!nq)return null;
  return cards.find(x=>{if(x.k!==k||x.id===exceptId)return false;const nx=norm(cdTxt(x.q)).replace(/[^a-z0-9]+/g," ").trim();if(nx===nq)return true;
    const B=cdWords(x.q);if(!A.size||!B.size)return false;let n=0;A.forEach(w=>{if(B.has(w))n++});return n/Math.max(A.size,B.size)>=CD_DUP})||null}
const cdIvl=x=>x.f&&x.f.last?dnum(x.due)-dnum(x.f.last):0;
/* lista Todos: F={q,area,k,st,org,leech,sort}; ordem "due" (padrão: em revisão pela data, depois novos, depois suspensos e rascunhos) | "lapses" | "new" */
function cdFilter(L,F){F=F||{};const q=F.q?norm(F.q.trim()):"";
  const R=L.filter(x=>{const it=BYKEY[x.k];if(!it)return false;if(F.k&&x.k!==F.k)return false;if(F.area&&!(it.area&&it.area.code===F.area))return false;
    if(F.st&&cdState(x)!==F.st)return false;if(F.org&&cdOrigin(x)!==F.org)return false;if(F.leech&&!((x.f&&x.f.lapses||0)>=CD_LEECH))return false;
    if(q&&!norm(cdTxt(x.q)+" "+cdTxt(x.a)).includes(q))return false;return true});
  const at=x=>x.at||x.id,rank=x=>{const s=cdState(x);return s==="revisao"||s==="aprendendo"?0:s==="novo"?1:2};
  if(F.sort==="lapses")return R.sort((a,b)=>(b.f.lapses||0)-(a.f.lapses||0)||(a.due<b.due?-1:a.due>b.due?1:0));
  if(F.sort==="new")return R.sort((a,b)=>at(a)<at(b)?1:at(a)>at(b)?-1:0);
  return R.sort((a,b)=>rank(a)-rank(b)||(rank(a)===1?(at(a)<at(b)?-1:1):(a.due<b.due?-1:a.due>b.due?1:0)))}
const cdLeeches=n=>cards.filter(x=>cdLive(x)&&(x.f.lapses||0)>=CD_LEECH).sort((a,b)=>b.f.lapses-a.f.lapses||(a.due<b.due?-1:1)).slice(0,n);
/* Números: a=dnum inicial, b=dnum final. "Lembrou" = Difícil/Bom/Fácil, só revisões de cartões que já estavam em revisão (r:1);
   maduro = m:1 (intervalo de 21 dias ou mais antes de responder) */
function cdStats(L,a,b){const S={n:0,pass:0,young:{n:0,pass:0},mat:{n:0,pass:0},byDay:{},first:""};
  L.forEach(x=>(x.rv||[]).forEach(r=>{if(!S.first||r.d<S.first)S.first=r.d;const t=dnum(r.d);if(t<a||t>b)return;S.byDay[r.d]=(S.byDay[r.d]||0)+1;
    if(!r.r)return;const p=r.g>=2?1:0,G=r.m?S.mat:S.young;S.n++;S.pass+=p;G.n++;G.pass+=p}));return S}
function cdStreak(byDay,T){let t=dnum(T);if(!byDay[T])t--;let n=0;while(byDay[fromNum(t)]){n++;t--}return n}
function cdMix(L){const M={novo:0,aprendendo:0,jovem:0,maduro:0,suspenso:0};L.forEach(x=>{if(!BYKEY[x.k]||x.dr)return;const s=cdState(x);
  if(s==="revisao")M[cdIvl(x)>=CD_MAT?"maduro":"jovem"]++;else M[s]++});return M}
