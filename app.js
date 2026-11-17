/* ===== 1. CONTENT: 공통 시설 데이터 (자료 기반) ===== */
const CATS = {all:'도시 전체',housing:'주거',energy:'전력',mobility:'교통',civic:'행정',health:'보건'};
const HOUSE_ECO = ['옥상 태양광 패널과 옥상 녹화','패시브 디자인: 맞통풍·고단열 창호·외부 차양','저탄소 콘크리트·재활용 자재'];
const HOUSE_ACC = ['완만한 경사로와 문턱 없는 출입구','낮은 버튼·음성 안내 엘리베이터','보행자와 차량 동선 분리','※ 개념 설계이며 세대 수·치수는 구조 검토 후 조정'];
const FAC = [
 {id:'energy_hub',cat:'energy',zone:'중앙',name:'중앙 에너지 발전소',
  sum:'태양광·풍력·수소 발전과 ESS를 묶은 친환경 에너지 통합 센터입니다. 보안구역이라 일반 출입은 제한돼요.',
  pts:['재생에너지 발전과 ESS 저장을 한곳에서 관제','지능형 스마트 그리드: AI가 수요를 예측해 자동 분배','둘레의 녹지 완충구역이 열·오염 부담을 줄임 (사고 대비 안전시설은 별도 필요)']},
 {id:'civic',cat:'civic',zone:'중간',name:'행정 클러스터',
  sum:'시청·의회·공공기관이 함께 모인 행정 거점입니다. 녹지와 교통축으로 연결돼요.',
  pts:['시청: 민원실 원스톱 서비스, 시민 동선과 업무 동선 분리','의회: 회의장·의원실·공청회장으로 시민 참여 공간 확보','공공기관: 대민 기능은 저층, 업무는 상층, 중정으로 개방감']},
 {id:'health_hub',cat:'health',zone:'중간',name:'종합 의료 거점',
  sum:'중앙 허브가 생활권 클리닉과 이어져 응급에 대응합니다.',
  pts:['허브 + 분산 클리닉 구조','이동형·컨테이너형·재난 클리닉','재난 때 긴급 클리닉 배치']},
 {id:'clinic',cat:'health',zone:'외곽',name:'지역 클리닉',
  sum:'생활권 가까이에서 기본 진료를 맡는 분산 시설입니다.',
  pts:['걸어서 닿는 기본 의료','허브와 연결된 환자 이송','생활권마다 분산 배치해 접근성 격차 완화']},
 {id:'housing_A',cat:'housing',zone:'외곽',name:'주거 A 역원추형',pair:true,
  sum:'위로 갈수록 넓어지는 원형 구조에 층별 테라스를 더한 수직형 공동주거입니다.',
  tabs:{구조:['원형 평면, 위로 넓어지는 슬래브와 층별 테라스','중앙 코어에 엘리베이터·계단·설비 집중','하층 로비·공용 / 중층 주거 / 상층 주거+옥상 정원'],지속가능성:HOUSE_ECO,접근성:HOUSE_ACC}},
 {id:'housing_B',cat:'housing',zone:'외곽',name:'주거 B 돔형',pair:true,
  sum:'반구형 유리 돔과 원형 테라스를 결합한 3층 규모의 저층 공동주거입니다.',
  tabs:{구조:['1층 아치형 출입구·공용 / 2층 주거 / 3층 돔 휴게공간','금속 프레임 돔과 원형 슬래브, 코어의 연결 검토','돔의 채광·환기·단열 고려'],지속가능성:HOUSE_ECO,접근성:HOUSE_ACC}},
 {id:'wind',cat:'energy',zone:'외곽',name:'풍력 발전',
  sum:'도시 외곽의 바람이 잘 통하는 개방 공간에 설치합니다.',
  pts:['태양광이 어려운 시간대의 전력 보완','태양광은 건물 옥상·공공시설 지붕·BIPV로 분산','생산한 전력은 스마트 그리드로 연결']},
 {id:'ess_h2',cat:'energy',zone:'발전소 인근',name:'ESS·그린수소',
  sum:'만든 전력을 저장해 두었다가 필요할 때 꺼내 쓰는 시설입니다.',
  pts:['ESS: 수요가 많을 때 공급, 정전 대비 비상전력','그린수소: 재생에너지로 물을 전기분해해 생산','수소 연료전지 발전, 장기 에너지 저장']},
 {id:'v2g',cat:'energy',zone:'중간',name:'V2G 충전소',
  sum:'전기차를 충전할 뿐 아니라 배터리 전력을 전력망에 돌려줍니다.',
  pts:['차량 배터리 전력을 전력망으로 역공급','전력 수요가 높은 시간대에 활용','도시의 분산형 에너지 저장 수단']},
 {id:'ring',cat:'mobility',zone:'순환망',name:'3중 순환망 + 방사축',
  sum:'3중 순환도로와 8개 방사형 대로가 중심으로 쏠리는 교통을 나눕니다. 주황 원은 지역 생활 중심지예요.',
  pts:['중심을 거치지 않고 지역 간 이동하는 순환형 대중교통','전기·수소버스, 자율주행 셔틀, 보행자·자전거 분리','보행로에는 압전·태양광 자가발전 보도블록'],
  note:'경로와 거리는 개념 설명용이며 실제 이동시간이 아닙니다.'}
];
const CATMAP = Object.fromEntries(FAC.map(f=>[f.id,f.cat]));

/* ===== 2. STATE ===== */
const S = {view:'home',filter:'all',sel:null,tab:'구조'};
const $ = (q,el=document)=>el.querySelector(q);

/* ===== 3. VIEW 전환 ===== */
function show(v){
  S.view=v;
  document.querySelectorAll('.view').forEach(e=>e.classList.toggle('on',e.id==='view-'+v));
  document.querySelectorAll('#nav button').forEach(b=>{b.classList.toggle('on',b.dataset.view===v);b.toggleAttribute('aria-current',b.dataset.view===v)});
  gl&&City.setActive(v==='explore');
  if(v==='lab')labStart();
}
$('#nav').addEventListener('click',e=>{const b=e.target.closest('button');b&&show(b.dataset.view)});
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');g&&show(g.dataset.go)});

/* ===== 4. 3D 도시 + 필터 + 상세 패널 ===== */
const gl = City.init($('#stage'), id=>select(id));
if(!gl) $('#stage').innerHTML='<p class="fallback">이 기기에서는 3D 화면을 쓸 수 없어요. 목록에서 시설을 골라 설명을 확인해 보세요.</p>';
$('#zin').onclick=()=>gl&&City.zoom(.8);
$('#zout').onclick=()=>gl&&City.zoom(1.25);
$('#zhome').onclick=()=>{closePanel();gl&&City.home()};
$('#dn').onclick=e=>{const b=e.currentTarget,on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);b.textContent=on?'☀':'☾';gl&&City.setNight(on)};

function drawFilters(){
  const box=$('#filters');box.innerHTML='';
  for(const k in CATS){
    const b=document.createElement('button');b.className='chip';b.textContent=CATS[k];b.setAttribute('aria-pressed',S.filter===k);
    b.onclick=()=>{S.filter=k;drawFilters();gl&&City.setFilter(k,CATMAP)};box.append(b);
  }
  box.append(document.createElement('hr'));
  FAC.filter(f=>f.pair?true:true).filter(f=>S.filter==='all'||f.cat===S.filter).forEach(f=>{
    const b=document.createElement('button');b.className='chip fac';b.textContent=f.name;b.setAttribute('aria-pressed',S.sel===f.id);
    b.onclick=()=>select(f.id);box.append(b);
  });
}
function select(id){
  const f=FAC.find(x=>x.id===id);S.sel=id;
  if(f.tabs&&!(S.tab in f.tabs))S.tab='구조';
  const li=a=>`<ul>${a.map(p=>`<li>${p}</li>`).join('')}</ul>`;
  const pair=f.pair?`<div class="seg" aria-label="A/B 비교">${['housing_A','housing_B'].map(k=>`<button data-id="${k}" aria-pressed="${k===id}">${k==='housing_A'?'A 역원추형':'B 돔형'}</button>`).join('')}</div>`:'';
  const tabs=f.tabs?`<div class="seg">${Object.keys(f.tabs).map(k=>`<button data-t="${k}" aria-pressed="${k===S.tab}">${k}</button>`).join('')}</div>${li(f.tabs[S.tab])}`:li(f.pts);
  $('#panel-body').innerHTML=`<span class="tag">${CATS[f.cat]} · ${f.zone}</span><h2 style="margin-top:.5rem">${f.name}</h2><p>${f.sum}</p>${pair}${tabs}${f.note?`<p class="muted">${f.note}</p>`:''}`;
  $('#panel').classList.add('open');
  drawFilters();gl&&City.fly(id);
}
$('#panel-body').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.id)select(b.dataset.id);
  else if(b.dataset.t){S.tab=b.dataset.t;select(S.sel)}
});
function closePanel(){S.sel=null;$('#panel').classList.remove('open');$('#panel-body').innerHTML='<p class="muted">건물을 누르거나 목록에서 고르면 카메라가 이동해요.</p>';drawFilters();gl&&City.clear()}
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
$('#calm').onchange=e=>{document.body.classList.toggle('calm',e.target.checked);gl&&City.setCalm(e.target.checked)};

/* ===== INIT ===== */
closePanel();
