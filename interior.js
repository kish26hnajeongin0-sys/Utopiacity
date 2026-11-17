'use strict';
/* RADIAL CITY · 건물 내부 투어
   index.html의 app.js 바로 아래에 <script src="interior.js"></script> 한 줄만 추가하면 동작합니다.
   시설 패널에 "실내 투어 시작" 버튼이 생깁니다. (행정 클러스터, 주거 A, 주거 B) */
(function(){
  if(!window.THREE||!THREE.OrbitControls)return;
  const $=(q,e)=>(e||document).querySelector(q);
  const R=(n,x,z,w,d,c,t,o)=>Object.assign({n,x,z,w,d,c,t},o);
  const ring=(n,r0,r1,c,t)=>({n,shape:'ring',r0,r1,c,t,x:0,z:0});
  const disc=(n,r,c,t)=>({n,shape:'disc',r,c,t,x:0,z:0});
  function units(r0,r1,t){ // 코어 둘레에 방사형으로 놓인 세대 8개
    const o=[],a=Math.PI/4,rm=(r0+r1)/2;
    for(let i=0;i<8;i++){const q=(i+.5)*a;o.push({n:'세대',x:rm*Math.cos(q),z:rm*Math.sin(q),w:r1-r0-.6,d:2*rm*Math.sin(a/2)-.8,rot:-q,c:'#d9c8a8',t,nolabel:true})}
    return o;
  }
  const UNIT='코어 주변에 방사형으로 배치하고, 외곽 창으로 채광과 조망을 확보합니다.';
  const GREEN='#5fae6a',CORE='#8a94a3';

  /* ===== 공간 데이터 (업로드한 설계도 기반 개념 평면) ===== */
  const INT={
    civic:{title:'행정 클러스터',sets:[
      {name:'시청',levels:[{n:'1F',W:36,D:22,ent:[0,11],t:'민원실을 중심으로 시민 동선과 업무 동선을 나눈 평면입니다.',rooms:[
        R('민원실',-2,-5.5,18,9,'#5aa5e8','시민이 한 곳에서 행정 서비스를 받는 원스톱 공간'),
        R('시장실',14,-6.5,9,8,'#3f6fb5','시정 운영과 주요 의사결정 공간'),
        R('회의실',14.5,2,8,8,'#3fbf9a','정책 논의와 협업을 위한 공간'),
        R('공공 편의시설',4,7.5,13,6,'#8a94a3','시민과 직원의 편의를 위한 지원 공간'),
        R('계단·화장실',-14,-6,6,9,'#6b7684','수직 동선과 설비가 모인 공간')],
        paths:[{k:'c',pts:[[0,10],[0,0],[-2,-1]]},{k:'c',pts:[[0,0],[10.5,0]]},{k:'w',pts:[[-13,6],[-13,0],[0,0],[9.6,-5]]}]}]},
      {name:'의회',levels:[{n:'1F',W:28,D:28,ent:[0,14],t:'회의장과 공청회장이 시민 참여와 의사결정을 잇는 평면입니다.',rooms:[
        R('회의장',-8,-8,12,10,'#4f86c6','의사결정의 중심 공간',{seats:[4,6]}),
        R('의원실',8,-8,12,10,'#7aa2d6','의원 업무와 협의 공간'),
        R('공청회장',8,8,12,10,'#8fa8e0','시민 참여와 의견 수렴 공간',{seats:[4,6]}),
        R('행정 지원 공간',-8,8,12,10,'#d9b38c','의회 운영을 지원하는 업무 공간'),
        R('계단·복도',0,0,4,6,'#6b7684','층간 이동과 중앙 연결 공간')],
        paths:[{k:'c',pts:[[0,13],[0,0],[8,3]]},{k:'w',pts:[[-8,3],[-8,0],[2,0],[2.5,-6]]}]}]},
      {name:'공공기관',levels:[
        {n:'1F',W:30,D:24,ent:[0,12],t:'주요 대민 기능을 저층에 모아 접근성과 편의성을 높였습니다.',rooms:[
          R('민원 접수·안내',-10,-8,9,7,'#5aa5e8','민원 접수와 길 안내를 맡는 공간'),
          R('통합 민원룸',0,-8,10,7,'#3f6fb5','여러 민원을 한 번에 처리하는 공간'),
          R('시민 라운지',10,-8,9,7,'#7ec8c0','시민이 머물며 쉬는 열린 공간'),
          R('로비',0,2,8,10,'#8a94a3','주출입구와 각 공간을 잇는 중심 공간'),
          R('상담실',-10,6,9,7,'#d9b38c','민원 상담을 위한 공간'),
          R('휴게·카페',10,6,9,7,'#e0a96d','시민과 직원을 위한 휴게 공간')],
          paths:[{k:'c',pts:[[0,11],[0,-3],[0,-4.6]]}]},
        {n:'2F',W:30,D:24,ent:[0,12],t:'행정 업무 공간은 상층에 두어 집중도와 보안성을 확보합니다.',rooms:[
          R('행정 업무실',-10,-8,9,7,'#5aa5e8','행정 업무를 보는 공간'),
          R('회의실',0,-8,10,7,'#3fbf9a','정책 논의와 협업 공간'),
          R('교육·세미나실',10,-8,9,7,'#7ec8c0','교육과 세미나를 위한 공간'),
          R('중정',0,0,10,9,'#3f8f4f','1층 로비 위로 열린 중정으로 개방감과 소통을 높입니다.'),
          R('직원 지원 공간',0,9,24,5,'#d9b38c','직원 휴게와 지원 공간')]}]}]},
    housing_A:{title:'주거 A 역원추형',sets:[{name:'',levels:[
      {n:'하층',R:8,ent:[8,0],t:'좁은 하부에 주출입구와 로비, 공용시설을 둡니다.',rooms:[
        disc('중앙 코어',2.5,CORE,'엘리베이터·계단·설비를 모은 수직 동선 중심'),
        ring('로비',2.5,5.5,'#7ec8c0','건물의 진입부를 간결하게 정리하는 공간'),
        ring('공용시설',5.5,8,'#e0a96d','주민이 함께 쓰는 공용 공간')]},
      {n:'중층',R:11,ent:[11,0],t:'층이 올라갈수록 바닥과 테라스가 넓어집니다.',rooms:[
        disc('중앙 코어',3,CORE,'엘리베이터·계단·설비 집중')].concat(units(3.4,8,UNIT),[
        ring('원형 테라스',8,11,GREEN,'각 세대의 휴식 공간이자 깊은 처마가 되는 테라스')])},
      {n:'상층',R:14,ent:[14,0],t:'가장 넓은 상부층은 주거와 옥상 정원을 함께 계획합니다.',rooms:[
        disc('중앙 코어',3,CORE,'엘리베이터·계단·설비 집중')].concat(units(3.4,10.5,UNIT),[
        ring('테라스·옥상 정원',10.5,14,GREEN,'개방감을 높이는 공동체 공간')])}]}]},
    housing_B:{title:'주거 B 돔형',sets:[{name:'',levels:[
      {n:'1층',R:10,ent:[10,0],t:'아치형 출입구와 로비, 일부 공용시설을 외부 조경과 연결합니다.',rooms:[
        disc('중앙 코어',2.5,CORE,'계단·엘리베이터·설비를 한곳에 모은 코어'),
        ring('로비·공용공간',2.5,10,'#7ec8c0','아치형 출입구로 들어오는 열린 공용 공간')]},
      {n:'2층',R:10,ent:[10,0],t:'독립 세대와 원형 테라스를 배치합니다.',rooms:[
        disc('중앙 코어',2.5,CORE,'층간 이동을 단순하게 하는 코어')].concat(units(3,7.5,'큰 창으로 자연광이 들어오는 세대입니다.'),[
        ring('원형 테라스',7.5,10,GREEN,'소규모 화단과 휴식 공간이 있는 테라스')])},
      {n:'3층',R:10,ent:[10,0],dome:true,t:'유리 돔 아래 열린 휴게 공간입니다.',rooms:[
        disc('중앙 코어',2.5,CORE,'계단과 엘리베이터 코어'),
        ring('돔 휴게공간·실내정원',2.5,9.5,GREEN,'자연광이 들어오는 공동 휴게공간과 실내 정원')]}]}]}
  };

  /* ===== UI ===== */
  const css=document.createElement('style');
  css.textContent=`#int{position:absolute;inset:0;background:#081321;z-index:6}
#icv{position:absolute;inset:0}#icv canvas{display:block;width:100%;height:100%;touch-action:none}
#int .ir{position:absolute;left:.6rem;right:.6rem;display:flex;gap:.4rem;overflow-x:auto;align-items:center}
#int .r1{top:.6rem}#int .r2{top:3.7rem}#int .r3{bottom:.6rem}
#int button{background:#172B43;color:#E8F0F8;border:1px solid #2A4361;border-radius:10px;padding:0 .9rem;min-height:44px;font:inherit;cursor:pointer;flex:none}
#int button[aria-pressed=true]{border-color:#5AE8D0;color:#5AE8D0}
#int .ic{position:absolute;left:.6rem;bottom:4rem;max-width:22rem;background:rgba(23,43,67,.94);border:1px solid #2A4361;border-radius:12px;padding:.7rem .9rem;font-size:.9rem}
#int .ic p{margin:.2rem 0 0}#int .lg{display:block;margin-top:.4rem;color:#9FB3C8;font-size:.8rem}
#int .lg i{display:inline-block;width:18px;height:4px;margin:0 .3rem 2px 0;background:#6AB7F9}#int .lg i.a{background:#F4B26D;margin-left:.7rem}`;
  document.head.append(css);
  const stage=$('.stage');if(!stage)return;
  const ov=document.createElement('div');ov.id='int';ov.hidden=true;
  ov.innerHTML='<div id="icv"></div><div class="ir r1"><button id="iback">‹ 도시로 돌아가기</button><b id="ititle"></b></div><div class="ir r2" id="isets"></div><div class="ic" id="icard"></div><div class="ir r3"><button data-m="top">평면</button><button data-m="persp">투시</button><button data-m="eye">눈높이</button><button id="ipath" aria-pressed="true">동선</button></div>';
  stage.append(ov);

  /* ===== 3D ===== */
  let rend,scene,cam,ctl,root,pathG,rooms=[],dots=[],cur,si=0,li=0,mode='persp',lvS=30,sel=null,an=null,on=false,hadOpen=false;
  const calm=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('calm');
  function ensure(){
    if(rend)return true;
    try{rend=new THREE.WebGLRenderer({antialias:true})}catch(e){return false}
    rend.setPixelRatio(Math.min(devicePixelRatio,2));$('#icv').append(rend.domElement);
    scene=new THREE.Scene();scene.background=new THREE.Color(0x081321);
    scene.add(new THREE.HemisphereLight(0xdff0ff,0x405060,1));
    const d=new THREE.DirectionalLight(0xffffff,.7);d.position.set(20,40,15);scene.add(d);
    cam=new THREE.PerspectiveCamera(55,1,.1,500);
    ctl=new THREE.OrbitControls(cam,rend.domElement);
    Object.assign(ctl,{enableDamping:true,dampingFactor:.08,minDistance:.5,maxPolarAngle:1.55});
    new ResizeObserver(()=>{const e=$('#icv'),w=e.clientWidth,h=e.clientHeight;if(!w||!h)return;rend.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix()}).observe($('#icv'));
    let dn=null;const dom=rend.domElement;
    dom.addEventListener('pointerdown',e=>{dn=[e.clientX,e.clientY]});
    dom.addEventListener('pointerup',e=>{if(dn&&Math.hypot(e.clientX-dn[0],e.clientY-dn[1])<6)pick(e)});
    let last=performance.now();
    (function loop(t){
      requestAnimationFrame(loop);if(!on)return;
      const dt=Math.min(.1,(t-last)/1000);last=t;
      if(an){const k=Math.min(1,(t-an.t0)/700),e=k*k*(3-2*k);cam.position.lerpVectors(an.c0,an.c1,e);ctl.target.lerpVectors(an.p0,an.p1,e);if(k>=1)an=null}
      if(!calm())dots.forEach(o=>{o.o=(o.o+dt*4)%o.len;let i=0;while(i<o.cum.length-2&&o.cum[i+1]<o.o)i++;
        const a=o.pts[i],b=o.pts[i+1],k=(o.o-o.cum[i])/(o.cum[i+1]-o.cum[i]||1);o.m.position.set(a[0]+(b[0]-a[0])*k,.6,a[1]+(b[1]-a[1])*k)});
      ctl.update();rend.render(scene,cam);
    })(0);
    return true;
  }
  function label(text,x,y,z,sc){
    const c=document.createElement('canvas');c.width=384;c.height=72;const g=c.getContext('2d');
    g.fillStyle='rgba(8,19,33,.85)';g.fillRect(0,0,384,72);g.fillStyle='#E8F0F8';g.font='bold 34px "Noto Sans KR",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,192,38);
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));
    s.scale.set(sc*5.3,sc,1);s.position.set(x,y,z);s.renderOrder=5;root.add(s);
  }
  function clear(){
    if(root){scene.remove(root);root.traverse(o=>{o.geometry&&o.geometry.dispose();if(o.material){o.material.map&&o.material.map.dispose();o.material.dispose()}})}
    root=new THREE.Group();scene.add(root);rooms=[];dots=[];sel=null;
    pathG=new THREE.Group();pathG.visible=$('#ipath').getAttribute('aria-pressed')==='true';root.add(pathG);
  }
  function addPath(p){
    const mt=new THREE.MeshBasicMaterial({color:p.k==='c'?0x6AB7F9:0xF4B26D}),cum=[0];
    for(let i=0;i<p.pts.length-1;i++){
      const a=p.pts[i],b=p.pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);cum.push(cum[i]+L);
      const n=p.k==='c'?1:Math.max(1,Math.floor(L/1.4));
      for(let j=0;j<n;j++){
        const t=(j+.5)/n,m=new THREE.Mesh(new THREE.BoxGeometry(p.k==='c'?L:.8,.05,.5),mt);
        m.position.set(a[0]+dx*t,.12,a[1]+dz*t);m.rotation.y=-Math.atan2(dz,dx);pathG.add(m);
      }
    }
    const m=new THREE.Mesh(new THREE.SphereGeometry(.6,12,8),mt);pathG.add(m);
    dots.push({m,pts:p.pts,cum,len:cum[cum.length-1],o:Math.random()*cum[cum.length-1]});
  }
  function seats(m,r){
    const mt=new THREE.MeshStandardMaterial({color:0xe8f0f8}),rw=r.seats[0],cl=r.seats[1],sx=(r.w-3)/Math.max(cl-1,1),sz=(r.d-3)/Math.max(rw-1,1);
    for(let i=0;i<rw;i++)for(let j=0;j<cl;j++){
      const b=new THREE.Mesh(new THREE.BoxGeometry(1,.6,.8),mt);b.position.set((j-(cl-1)/2)*sx,.35,(i-(rw-1)/2)*sz);m.add(b);
    }
  }
  function load(){
    clear();const lv=cur.sets[si].levels[li],S=lv.R?lv.R*2:Math.max(lv.W,lv.D);lvS=S;
    const fg=lv.R?new THREE.CylinderGeometry(lv.R,lv.R,.4,64):new THREE.BoxGeometry(lv.W,.4,lv.D),f=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:0x172B43}));
    f.position.y=-.2;root.add(f);
    const wg=lv.R?new THREE.CylinderGeometry(lv.R,lv.R,3.2,64,1,true):new THREE.BoxGeometry(lv.W,3.2,lv.D),w=new THREE.LineSegments(new THREE.EdgesGeometry(wg,10),new THREE.LineBasicMaterial({color:0x6AB7F9}));
    w.position.y=1.6;root.add(w);
    lv.rooms.forEach(r=>{
      const h=r.h||1.2;let g;
      if(r.shape==='ring'){const s=new THREE.Shape();s.absarc(0,0,r.r1,0,Math.PI*2,false);const p=new THREE.Path();p.absarc(0,0,r.r0,0,Math.PI*2,true);s.holes.push(p);g=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:48});g.rotateX(-Math.PI/2)}
      else if(r.shape==='disc')g=new THREE.CylinderGeometry(r.r,r.r,h,48).translate(0,h/2,0);
      else g=new THREE.BoxGeometry(r.w,h,r.d).translate(0,h/2,0);
      const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:new THREE.Color(r.c),transparent:true,opacity:.6,roughness:.6}));
      m.position.set(r.x,0,r.z);m.rotation.y=r.rot||0;m.userData.room=r;
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g,10),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.7})));
      if(r.seats)seats(m,r);root.add(m);rooms.push(m);
      if(!r.nolabel){const lx=r.shape==='ring'?(r.r0+r.r1)/2:r.x,lz=r.shape==='ring'?0:r.z;label(r.n,lx,2.6,lz,1.1)}
    });
    if(lv.dome){
      const dg=new THREE.SphereGeometry(lv.R*.95,32,16,0,Math.PI*2,0,Math.PI/2);
      root.add(new THREE.Mesh(dg,new THREE.MeshBasicMaterial({color:0x9FD0F0,transparent:true,opacity:.12,side:THREE.DoubleSide})));
      root.add(new THREE.Mesh(dg,new THREE.MeshBasicMaterial({color:0x6AB7F9,wireframe:true,transparent:true,opacity:.35})));
    }
    (lv.paths||[]).forEach(addPath);
    ctl.maxDistance=S*2.5;setCam(mode,true);ui();
  }
  function setCam(m,instant){
    mode=m;const lv=cur.sets[si].levels[li],S=lvS,p1=new THREE.Vector3();let c1;
    if(m==='top')c1=new THREE.Vector3(0,S*1.5,.01);
    else if(m==='persp')c1=new THREE.Vector3(S*.55,S*.85,S*.85);
    else{const e=lv.ent||[0,S/2],d=Math.hypot(e[0],e[1])||1;c1=new THREE.Vector3(e[0]-e[0]/d*2.5,1.7,e[1]-e[1]/d*2.5);p1.set(0,1.4,0)}
    if(instant||calm()){cam.position.copy(c1);ctl.target.copy(p1);an=null}
    else an={t0:performance.now(),c0:cam.position.clone(),p0:ctl.target.clone(),c1,p1};
    document.querySelectorAll('#int [data-m]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===m));
  }
  function card(html){$('#icard').innerHTML=html}
  function ui(){
    const bx=$('#isets');bx.innerHTML='';
    if(cur.sets.length>1)cur.sets.forEach((s,i)=>{const b=document.createElement('button');b.textContent=s.name;b.setAttribute('aria-pressed',i===si);b.onclick=()=>{si=i;li=0;load()};bx.append(b)});
    cur.sets[si].levels.forEach((l,i)=>{if(cur.sets[si].levels.length<2)return;const b=document.createElement('button');b.textContent=l.n;b.setAttribute('aria-pressed',i===li);b.onclick=()=>{li=i;load()};bx.append(b)});
    const lv=cur.sets[si].levels[li],nm=(cur.sets[si].name+' '+lv.n).trim();
    card(`<b>${nm}</b><p>${lv.t||''} 공간을 누르면 설명이 나와요.</p>${lv.paths?'<span class="lg"><i></i>시민 동선<i class="a"></i>업무 동선</span>':''}`);
  }
  function pick(e){
    const r=rend.domElement.getBoundingClientRect(),rc=new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),cam);
    const h=rc.intersectObjects(rooms,true)[0];if(!h)return;
    let o=h.object;while(o&&!o.userData.room)o=o.parent;if(!o)return;
    rooms.forEach(m=>{m.material.opacity=.6;m.material.emissive.setHex(0)});o.material.opacity=.9;o.material.emissive.setHex(0x223344);
    card(`<b>${o.userData.room.n}</b><p>${o.userData.room.t}</p>`);
  }

  /* ===== 열기 / 닫기 ===== */
  function open(id){
    cur=INT[id];if(!cur)return;
    if(!ensure()){alert('이 기기에서는 3D를 표시할 수 없어요.');return}
    si=0;li=0;$('#ititle').textContent=cur.title+' · 실내 투어';
    hadOpen=$('#panel').classList.contains('open');$('#panel').classList.remove('open');
    ov.hidden=false;on=true;if(typeof City!=='undefined')City.setActive(false);
    load();
  }
  function close(){
    ov.hidden=true;on=false;
    if(typeof City!=='undefined'&&typeof S!=='undefined'&&S.view==='explore')City.setActive(true);
    if(hadOpen)$('#panel').classList.add('open');
  }
  $('#iback').onclick=close;
  ov.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>setCam(b.dataset.m));
  $('#ipath').onclick=e=>{const b=e.currentTarget,v=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',v);pathG&&(pathG.visible=v)};
  document.addEventListener('keydown',e=>{if(!ov.hidden&&e.key==='Escape'){e.stopImmediatePropagation();close()}},true);

  /* 시설 패널에 "실내 투어 시작" 버튼 붙이기 */
  const pb=$('#panel-body');
  new MutationObserver(()=>{
    if(typeof S==='undefined'||!INT[S.sel]||pb.querySelector('.int-btn'))return;
    const b=document.createElement('button');b.className='cta int-btn';b.textContent='실내 투어 시작';
    const id=S.sel;b.onclick=()=>open(id);pb.append(b);
  }).observe(pb,{childList:true});
})();
