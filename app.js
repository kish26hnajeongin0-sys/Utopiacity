'use strict';
/* ===== 1. CONTENT: 공통 시설 데이터 ===== */
const CATS = {all:'도시 전체',housing:'주거',energy:'전력',mobility:'교통',civic:'행정',health:'보건'};
const COLOR = {housing:'#6AB7F9',energy:'#5AE8D0',mobility:'#F4B26D',civic:'#E8F0F8',health:'#EF839A'};
const FAC = [
 {id:'energy_hub',cat:'energy',zone:'중앙',icon:'⚡',name:'에너지 관제·연구',r:0,a:0,
  sum:'도시 전력을 모아 관리하는 중심 시설입니다. 접근은 제한됩니다.',
  pts:['태양광·풍력 생산 연결','ESS가 남는 전력을 저장','스마트 그리드로 공급 경로 조절']},
 {id:'civic',cat:'civic',zone:'중간',icon:'🏛',name:'행정 클러스터',r:105,a:-70,
  sum:'시청·의회·공공기관이 모인 도시 운영의 거점입니다.',
  pts:['건물별 공간이 한 곳에 모임','시민이 정책을 선택해 보는 공간','모든 생활권에서 접근하기 쉬운 위치']},
 {id:'health_hub',cat:'health',zone:'중간',icon:'✚',name:'종합 의료 거점',r:105,a:60,
  sum:'중앙 허브가 생활권 클리닉과 이어져 응급에 대응합니다.',
  pts:['허브 + 분산 클리닉 구조','이동형·컨테이너형 클리닉','재난 때 긴급 배치']},
 {id:'clinic',cat:'health',zone:'외곽',icon:'⛑',name:'지역 클리닉',r:235,a:115,
  sum:'생활권 가까이에서 기본 진료를 맡는 분산 시설입니다.',
  pts:['걸어서 닿는 의료','허브와 연결된 환자 이송','폭우·재난 시 위치 변경 가능']},
 {id:'ring',cat:'mobility',zone:'순환망',icon:'⟳',name:'3중 순환망 + 방사축',r:195,a:20,
  sum:'동심원 도로와 방사형 대중교통, 녹지축이 도시를 엮습니다.',
  pts:['안쪽·중간·바깥 3개 순환도로','중심으로 향하는 방사축','우회·환승 선택지 제공'],roads:true},
 {id:'housing',cat:'housing',zone:'외곽',icon:'🏠',name:'공동주거',r:200,a:215,
  sum:'외곽 생활권의 주거 단지입니다. A와 B 두 가지 형태를 비교해 보세요.',
  variants:{
   A:{t:'A 역원추형',pts:['위로 갈수록 넓어지는 원형 테라스','중앙 코어에 수직 동선과 설비 집중','테라스 차양으로 여름 햇빛 차단']},
   B:{t:'B 돔형',pts:['곡면 외피로 바람 흐름이 부드러움','채광이 고른 둥근 평면','상부 정원을 공동체 공간으로 활용']}}}
];

/* ===== 2. STATE ===== */
const S = {view:'home',filter:'all',sel:null,variant:'A',zoom:1,pan:{x:0,y:0}};
const $ = (q,el=document)=>el.querySelector(q);
const NS='http://www.w3.org/2000/svg';
const mk=(t,a={},p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p&&p.append(e);return e};
const pos=f=>[300+f.r*Math.cos(f.a*Math.PI/180),300+f.r*Math.sin(f.a*Math.PI/180)];

/* ===== 3. VIEW 전환 ===== */
function show(v){
  S.view=v;
  document.querySelectorAll('.view').forEach(e=>e.classList.toggle('on',e.id==='view-'+v));
  document.querySelectorAll('#nav button').forEach(b=>{b.classList.toggle('on',b.dataset.view===v);b.toggleAttribute('aria-current',b.dataset.view===v)});
  if(v==='lab')labStart();
}
$('#nav').addEventListener('click',e=>{const b=e.target.closest('button');b&&show(b.dataset.view)});
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');g&&show(g.dataset.go)});

/* ===== 4. SCENE: 2.5D(SVG) 도시 지도 ===== */
const map=$('#map'), world=mk('g',{},map);
function drawMap(){
  [240,150,60].forEach((r,i)=>mk('circle',{cx:300,cy:300,r,class:i?'zone ring':'zone ring'},world));
  const roads=[105,195,270].map(r=>mk('circle',{cx:300,cy:300,r,class:'road'},world));
  for(let a=0;a<360;a+=45){const x=300+270*Math.cos(a*Math.PI/180),y=300+270*Math.sin(a*Math.PI/180);mk('line',{x1:300,y1:300,x2:x,y2:y,class:'axis'},world)}
  FAC.forEach(f=>{
    const [x,y]=pos(f);
    const g=mk('g',{class:'node',tabindex:0,role:'button','aria-label':f.name,'data-id':f.id,transform:`translate(${x} ${y})`},world);
    mk('circle',{r:24,stroke:COLOR[f.cat]},g);
    mk('text',{class:'ico'},g).textContent=f.icon;
    mk('text',{class:'lbl',y:42},g).textContent=f.name;
    g.addEventListener('click',()=>select(f.id));
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(f.id)}});
  });
  world._roads=roads;
}
function applyView(){world.setAttribute('transform',`translate(${S.pan.x} ${S.pan.y}) translate(300 300) scale(${S.zoom}) translate(-300 -300)`)}
function zoomBy(k){S.zoom=Math.min(2.5,Math.max(.6,S.zoom*k));applyView()}
$('#zin').onclick=()=>zoomBy(1.25);
$('#zout').onclick=()=>zoomBy(.8);
$('#zhome').onclick=()=>{S.zoom=1;S.pan={x:0,y:0};applyView()};
map.addEventListener('wheel',e=>{e.preventDefault();zoomBy(e.deltaY<0?1.1:.9)},{passive:false});
let drag=null;
map.addEventListener('pointerdown',e=>{if(e.target.closest('.node'))return;drag={x:e.clientX,y:e.clientY,p:{...S.pan}};map.setPointerCapture(e.pointerId)});
map.addEventListener('pointermove',e=>{if(!drag)return;const k=600/map.clientWidth;S.pan.x=Math.max(-200,Math.min(200,drag.p.x+(e.clientX-drag.x)*k));S.pan.y=Math.max(-200,Math.min(200,drag.p.y+(e.clientY-drag.y)*k));applyView()});
map.addEventListener('pointerup',()=>drag=null);

/* ===== 5. FILTER + 상세 패널 ===== */
function drawFilters(){
  const box=$('#filters');box.innerHTML='';
  for(const k in CATS){const b=document.createElement('button');b.className='chip';b.textContent=CATS[k];b.setAttribute('aria-pressed',S.filter===k);b.onclick=()=>{S.filter=k;drawFilters();paint()};box.append(b)}
}
function paint(){
  document.querySelectorAll('.node').forEach(n=>{
    const f=FAC.find(x=>x.id===n.dataset.id);
    n.classList.toggle('dim',S.filter!=='all'&&f.cat!==S.filter);
    n.classList.toggle('sel',S.sel===f.id);
  });
  world._roads.forEach(r=>r.classList.toggle('hl',S.sel==='ring'||S.filter==='mobility'));
}
function select(id){
  S.sel=id;const f=FAC.find(x=>x.id===id);
  const v=f.variants?f.variants[S.variant]:null;
  const pts=v?v.pts:f.pts;
  $('#panel-body').innerHTML=`
    <span class="tag">${CATS[f.cat]} · ${f.zone}</span>
    <h2 style="margin-top:.5rem">${f.name}</h2><p>${f.sum}</p>
    ${f.variants?`<div class="seg" role="group" aria-label="A/B 비교">${Object.keys(f.variants).map(k=>`<button data-v="${k}" aria-pressed="${k===S.variant}">${f.variants[k].t}</button>`).join('')}</div>`:''}
    <ul>${pts.map(p=>`<li>${p}</li>`).join('')}</ul>
    ${f.roads?'<p class="muted">추천 경로(예: 주거 → 의료 거점)는 외측 순환 + 방사축을 쓰는 개념 경로이며 실제 이동시간이 아닙니다.</p>':''}`;
  $('#panel-body').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{S.variant=b.dataset.v;select(id)});
  $('#panel').classList.add('open');paint();
}
function closePanel(){S.sel=null;$('#panel').classList.remove('open');paint()}
$('#close').onclick=closePanel;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanel()});

/* ===== 6. SIMULATION: 정전 시나리오 (교육용 가정치) ===== */
const BASE={med:40,loc:35,risk:80};
const LABELS={med:['의료 필수 전력',1],loc:['생활권 분산 전력',1],risk:['중앙 의존 위험',0]};
const OPTS=[
 {id:'ess',t:'ESS 예비전력 투입',d:'저장해 둔 전력을 곧바로 공급합니다.',r:{med:60,loc:55,risk:60},why:'저장된 전력이 공백을 메워 주지만, 용량이 끝나면 다시 중앙 공급에 기대게 됩니다.'},
 {id:'med',t:'의료시설 우선 공급',d:'한정된 전력을 병원과 클리닉에 먼저 보냅니다.',r:{med:90,loc:40,risk:65},why:'꼭 필요한 시설은 지키지만, 주거 생활권의 전력은 상대적으로 부족해집니다.'},
 {id:'v2g',t:'V2G 연계 사용',d:'전기차 배터리를 생활권 전력망에 연결합니다.',r:{med:70,loc:75,risk:45},why:'흩어진 배터리가 생활권마다 전력을 보태 줘서 중앙 의존이 가장 크게 줄어듭니다.'}
];
const lab=$('#lab-body'), step=$('#lab-step');
function labStart(){
  step.textContent='시나리오 LAB · 정전 · 1 / 3 상황';
  lab.innerHTML=`<h2>중앙 공급 이상!</h2><p>중앙 에너지 공급의 일부에 문제가 생겨 주요 시설의 전력이 부족합니다.</p>${bars(BASE,null)}<button class="cta" id="go">대응 고르기</button><p class="disc">교육용 시뮬레이션입니다. 실제 도시 성능 예측이 아닙니다.</p>`;
  $('#go').onclick=labChoose;
}
function labChoose(){
  step.textContent='시나리오 LAB · 정전 · 2 / 3 선택';
  lab.innerHTML=`<h2>어떻게 대응할까요?</h2>`+OPTS.map(o=>`<button class="opt" data-o="${o.id}"><b>${o.t}</b>${o.d}</button>`).join('');
  lab.querySelectorAll('.opt').forEach(b=>b.onclick=()=>labResult(OPTS.find(o=>o.id===b.dataset.o)));
}
function labResult(o){
  step.textContent='시나리오 LAB · 정전 · 3 / 3 결과';
  lab.innerHTML=`<h2>${o.t}</h2>${bars(BASE,o.r)}<p>${o.why}</p><p class="disc">점수는 교육용 가상 규칙에서 나온 값이며 실측 데이터가 아닙니다.</p><button class="ghost" id="again">다시 실험하기</button>`;
  $('#again').onclick=labChoose;
}
function bars(b,after){
  return Object.keys(LABELS).map(k=>{
    const [n,goodHigh]=LABELS[k],cls=goodHigh?'good':'bad';
    return `<div class="bar"><div class="row"><span>${n}</span><span>${b[k]}${after?' → '+after[k]:''}</span></div><div class="track ${cls}"><i style="width:${b[k]}%"></i><em style="width:${after?after[k]:b[k]}%"></em></div></div>`;
  }).join('');
}

/* ===== 7. 접근성 ===== */
$('#calm').onchange=e=>document.body.classList.toggle('calm',e.target.checked);

/* ===== INIT ===== */
drawMap();drawFilters();paint();applyView();
