// popula ~6 semanas de uso para prints e o t111
module.exports=()=>{const t=dnum(today()),D=n=>fromNum(t-n);let id=0;
  const keys=ALL.map(i=>i.key);
  for(let i=0;i<60;i++){const k=keys[(i*7)%keys.length],s=get(k),dd=50-Math.floor(i*0.8);s.last=D(Math.max(0,dd-3));s.step=1;s.l=1;s.ed=[D(dd),D(Math.max(0,dd-3))];
    const qd={};for(let j=0;j<4;j++){const day=D(Math.max(0,dd-j*9));const q=6+(i%5),c=Math.round(q*(0.5+((i*13)%40)/100+(dd<25?0.08:0)));qd[day]=[q,c]}s.qd=qd;s.qt=Object.values(qd).reduce((a,v)=>a+v[0],0);s.qc=Object.values(qd).reduce((a,v)=>a+v[1],0);state[k]=s}
  for(let n=0;n<56;n++){const d=D(n);if(n%7===6)continue;hist[d]={e:n%3===0?1:n%2,r:2+(n%3),q:10+(n%9)*2,c:Math.round((10+(n%9)*2)*(n<28?0.72:0.64))}}
  foSess.length=0;for(let n=0;n<56;n++){if(n%7===6)continue;const k=keys[(n*7)%60];foSess.push({id:"f"+(id++),d:D(n),s:"09:00",sec:3600+((n*37)%5)*900,m:"p",ref:"T:"+k,lab:""});if(n%2)foSess.push({id:"f"+(id++),d:D(n),s:"14:00",sec:2700,m:"p",ref:"",lab:""})}
  errors.forEach(e=>{});commit();
  ui.profile.exams=[{id:"x1",name:"ENARE 2027",date:fromNum(t+330)}];ui.profile.mainEx="x1";saveUI()};
module.exports.fac=()=>{const t=dnum(today()),D=n=>fromNum(t-n);
  fac={sems:[{id:"s",name:"6º semestre",archived:false}],discs:[{id:"d",semId:"s",name:"Clínica Médica III",items:["O:o1","O:o2","O:o3","T:CM-1","T:CM-8"],sps:[]},{id:"d2",semId:"s",name:"Pediatria II",items:["O:o4","O:o5"],sps:[]}],
    own:{o1:{t:"Asma",discId:"d"},o2:{t:"DPOC",discId:"d"},o3:{t:"Pneumonias",discId:"d"},o4:{t:"Bronquiolite",discId:"d2"},o5:{t:"Desidratação",discId:"d2"}},
    provas:[{id:"p1",discId:"d",name:"P1 Clínica",date:D(20),items:["O:o1","O:o2"],done:[],res:{d:D(19),e:2,n:7.5,of:10}},{id:"p0",discId:"d2",name:"P1 Pediatria",date:D(40),items:["O:o4"],done:[],res:{d:D(39),e:1,n:6,of:10}},
      {id:"p2",discId:"d",name:"P2 Clínica",date:fromNum(t+9),items:["O:o3","T:CM-1","T:CM-8","O:o1"],done:[]},{id:"p3",discId:"d2",name:"P2 Pediatria",date:fromNum(t+20),items:["O:o4","O:o5"],done:[]}]};
  saveFac();const s=get("F-o1");s.last=D(5);s.step=0;s.ed=[D(12),D(5)];s.qd={[D(5)]:[10,7],[D(30)]:[8,5]};s.qt=18;s.qc=12;state["F-o1"]=s;
  [["D:d",5],["D:d2",8],["T:F-o1",12],["T:CM-1",3]].forEach(([r,n],i)=>foSess.push({id:"g"+i,d:D(n),s:"19:00",sec:4800,m:"p",ref:r,lab:""}));commit();render()};
