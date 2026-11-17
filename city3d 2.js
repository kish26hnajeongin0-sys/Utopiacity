'use strict';
/* RADIAL CITY · 3D 장면 (Three.js r128, 전역 THREE) — 개념 배치도 기반 교육용 모델 */
const City=(()=>{
  const P=(r,a)=>[r*Math.cos(a*Math.PI/180),r*Math.sin(a*Math.PI/180)];
  const C={mint:0x5AE8D0,blue:0x6AB7F9,amber:0xF4B26D,rose:0xEF839A,beige:0xE6D9C2,white:0xEEF3F7,glass:0x9FD0F0};
  /* at: 위치(x,z) · d: 카메라 거리 · rad: 선택 링 · h: 높이 */
  const L={
    energy_hub:{at:[0,0],d:110,rad:46,h:46,n:'중앙 에너지 발전소'},
    civic:{at:P(128,-70),d:75,rad:20,h:40,n:'행정 클러스터'},
    health_hub:{at:P(128,115),d:55,rad:14,h:15,n:'종합 의료 거점'},
    clinic:{at:P(190,250),d:45,rad:9,h:11,n:'지역 클리닉'},
    housing_A:{at:P(182,18),d:60,rad:14,h:27,n:'주거 A 역원추형'},
    housing_B:{at:P(180,-28),d:55,rad:13,h:17,n:'주거 B 돔형'},
    wind:{at:P(232,20),d:95,rad:14,h:28,n:'풍력 발전'},
    ess_h2:{at:P(70,200),d:55,rad:12,h:14,n:'ESS·그린수소'},
    v2g:{at:P(133,305),d:55,rad:12,h:12,n:'V2G 충전소'},
    ring:{at:[0,0],d:430,rad:0,h:0}
  };
  let scene,camera,renderer,controls,city,hemi,sun,marker,bMat,fly=null,active=false,night=false,calm=false,sel=null,filt='all',mrad=0,onPick;
  const roads=[],rotors=[];
  const mat=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.8,metalness:.05},o));
  const mesh=(g,m,x,y,z,p)=>{const e=new THREE.Mesh(g,m);e.position.set(x,y,z);p&&p.add(e);return e};
  const box=(w,h,d,m,x,y,z,p)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y+h/2,z,p);
  const cyl=(rt,rb,h,m,x,y,z,p,s)=>mesh(new THREE.CylinderGeometry(rt,rb,h,s||32),m,x,y+h/2,z,p);
  let seed=7;const rnd=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};

  function label(text,y,p){
    const c=document.createElement('canvas');c.width=512;c.height=96;const x=c.getContext('2d');
    x.fillStyle='rgba(8,19,33,.88)';x.fillRect(0,0,512,96);x.strokeStyle='#5AE8D0';x.lineWidth=5;x.strokeRect(3,3,506,90);
    x.fillStyle='#E8F0F8';x.font='bold 42px "Noto Sans KR",sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,50);
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));
    s.scale.set(28,5.25,1);s.position.y=y;s.renderOrder=5;p.add(s);return s;
  }

  /* ---- 시설 모델 (자료의 형태·구성 반영) ---- */
  const B={
    energy_hub(g){ // 중앙 발전소: 보안 외벽 + 관제탑 + 수소·저장탱크 + 태양광
      const wh=mat(C.white);
      cyl(44,44,1,mat(0x20344b),0,0,0,g,64);
      mesh(new THREE.CylinderGeometry(42,42,4,64,1,true),new THREE.MeshStandardMaterial({color:0x8895a5,side:THREE.DoubleSide}),0,2,0,g);
      cyl(5,6,34,mat(0xb8c7d6),0,0,0,g);
      mesh(new THREE.SphereGeometry(3,16,12),new THREE.MeshBasicMaterial({color:C.mint}),0,36,0,g);
      [[-18,-14],[18,-14],[-18,16],[16,18]].forEach(p=>cyl(5,5,10,wh,p[0],1,p[1],g));
      [[-28,0],[28,2],[0,28],[2,-30]].forEach(p=>{box(14,.6,8,mat(0x1f4f9a,{metalness:.5}),p[0],2.5,p[1],g).rotation.x=-.4});
    },
    civic(g){ // 시청(고층) · 의회 · 공공기관 + 광장
      const gl=mat(0x6f9fc4,{metalness:.4,roughness:.3}),st=mat(0xcfd6dc);
      box(32,.5,26,mat(0xb9bfa8),0,0,0,g);
      box(7,34,7,gl,-7,0,-4,g);box(13,10,10,st,8,0,-6,g);box(12,12,12,gl,6,0,8,g);
      cyl(3,3,.3,mat(0x3f8f4f),-9,.5,9,g);
    },
    health_hub(g){
      const wh=mat(C.white),r=mat(C.rose);
      box(16,9,12,wh,0,0,0,g);box(6,1,1.6,r,0,9,0,g);box(1.6,1,6,r,0,9,0,g);
      [[-11,5],[11,5],[-11,-5]].forEach(p=>box(5,3,4,wh,p[0],0,p[1],g));
    },
    clinic(g){
      const wh=mat(C.white),r=mat(C.rose);
      box(8,5,6,wh,0,0,0,g);box(3,.6,.9,r,0,5,0,g);box(.9,.6,3,r,0,5,0,g);box(4,2.5,3,wh,6,0,3,g);
    },
    housing_A(g){ // 역원추형: 위로 넓어지는 원형 슬래브 + 중앙 코어
      const be=mat(C.beige),gl=mat(C.glass,{transparent:true,opacity:.55,metalness:.3});
      cyl(4,4,.4,mat(0xcfc7b0),0,0,0,g);cyl(2.2,2.2,22,be,0,0,0,g);
      for(let i=0;i<7;i++){const r=4+i*1.1,y=2+i*2.8;cyl(r,r,.5,be,0,y,0,g);cyl(r-1.2,r-1.2,2,gl,0,y+.5,0,g)}
      cyl(10.4,10.4,.3,mat(0x3f8f4f),0,19.3,0,g);
    },
    housing_B(g){ // 돔형: 3층 원형 + 유리 돔
      const be=mat(C.beige),gl=mat(C.glass,{transparent:true,opacity:.5,metalness:.3});
      cyl(2,2,9,be,0,0,0,g);cyl(9,9,.6,be,0,0,0,g);
      for(let i=0;i<2;i++){const y=.6+i*3.1;cyl(8.2,8.2,2.6,gl,0,y,0,g);cyl(9.4,9.4,.5,be,0,y+2.6,0,g)}
      const dg=new THREE.SphereGeometry(7.6,28,14,0,Math.PI*2,0,Math.PI/2);
      mesh(dg,gl,0,6.8,0,g);mesh(dg,new THREE.MeshBasicMaterial({color:0x34495e,wireframe:true}),0,6.8,0,g);
    },
    wind(g){ // 외곽 풍력 8기
      const a0=P(232,20),wh=mat(C.white);
      for(let i=0;i<8;i++){
        const q=P(232,20+45*i),t=new THREE.Group();t.position.set(q[0]-a0[0],0,q[1]-a0[1]);
        cyl(.5,.9,20,wh,0,0,0,t,8);
        const hub=new THREE.Group();hub.position.set(0,20,1);
        for(let k=0;k<3;k++){const pv=new THREE.Group();pv.rotation.z=k*2.094;box(.5,9,.2,wh,0,0,0,pv);hub.add(pv)}
        rotors.push(hub);t.add(hub);g.add(t);
      }
    },
    ess_h2(g){ // ESS 컨테이너 + 수소 저장탱크
      const wh=mat(C.white);
      [-6,0,6].forEach(x=>box(5,3,2.6,wh,x,0,0,g));
      [-5,3].forEach(x=>cyl(2.4,2.4,7,mat(0xbfe9d2),x,0,8,g));
    },
    v2g(g){ // 태양광 지붕 충전소 + 전기차
      const bl=mat(0x1f4f9a,{metalness:.5});
      box(16,.4,9,bl,0,5,0,g);
      [[-7,-3.5],[7,-3.5],[-7,3.5],[7,3.5]].forEach(p=>cyl(.3,.3,5,mat(0x8895a5),p[0],0,p[1],g,8));
      [-4,4].forEach(x=>box(3.6,1.2,1.8,mat(C.mint),x,0,0,g));
    }
  };

  function build(){
    city=new THREE.Group();scene.add(city);
    hemi=new THREE.HemisphereLight(0xdff0ff,0x40604a,.95);scene.add(hemi);
    sun=new THREE.DirectionalLight(0xffffff,.85);sun.position.set(150,220,90);scene.add(sun);
    mesh(new THREE.CylinderGeometry(340,340,2,96),mat(0x0f2a44),0,-1.6,0,city);
    mesh(new THREE.CylinderGeometry(262,262,1,96),mat(0x4e8f58),0,-.5,0,city);
    mesh(new THREE.CylinderGeometry(92,92,.3,64),mat(0x6fb56c),0,.05,0,city);   // 녹지 완충 구역
    [P(72,40),P(80,150)].forEach(p=>cyl(10,10,.2,mat(0x4aa3df),p[0],0,p[1],city));
    /* 3중 순환망 + 8개 방사축 + 지역 생활 중심지 */
    [[100,5,0x2b7de0],[150,4,0x8b6fd6],[215,7,0x707987]].forEach(a=>{
      const m=mat(a[2],{roughness:.6}),e=new THREE.Mesh(new THREE.RingGeometry(a[0]-a[1]/2,a[0]+a[1]/2,128),m);
      e.rotation.x=-Math.PI/2;e.position.y=.2;e.userData.fid='ring';roads.push(m);city.add(e);
    });
    const rm=mat(0xb4bcc6);roads.push(rm);
    for(let k=0;k<8;k++){
      const gg=new THREE.Group();gg.rotation.y=-k*Math.PI/4;gg.userData.fid='ring';box(218,.3,4,rm,153,.05,0,gg);city.add(gg);
      const p=P(150,45*k),nd=cyl(5,5,.7,mat(C.amber,{emissive:C.amber,emissiveIntensity:.4}),p[0],.2,p[1],city);nd.userData.fid='ring';
    }
    /* 지구별 건물: 창문 텍스처 + 유형별 디테일 모델을 하나의 지오메트리로 병합 */
    const winTex=lit=>{
      const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
      g.fillStyle=lit?'#000':'#fff';g.fillRect(0,0,256,256);
      for(let i=0;i<4;i++)for(let j=0;j<4;j++){
        const x=i*64,y=j*64;
        if(lit){if(rnd()<.5){g.fillStyle='#ffd58a';g.fillRect(x+10,y+14,44,32)}}
        else{const gr=g.createLinearGradient(0,y+14,0,y+46);gr.addColorStop(0,'#7fa3c8');gr.addColorStop(1,'#35506f');g.fillStyle=gr;g.fillRect(x+10,y+14,44,32);g.fillStyle='rgba(255,255,255,.55)';g.fillRect(x+31,y+14,2,32)}
      }
      const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
    };
    bMat=new THREE.MeshStandardMaterial({map:winTex(false),emissiveMap:winTex(true),emissive:0x000000,vertexColors:true,roughness:.65,metalness:.1});
    const bag={p:[],n:[],u:[],c:[],i:[]},base=new THREE.Matrix4(),tmp=new THREE.Color();let vc=0;
    const flat=g=>{const u=g.attributes.uv;for(let k=0;k<u.count;k++)u.setXY(k,.5,.03);return g};
    const push=(g,col)=>{
      g.applyMatrix4(base);tmp.setHex(col);
      const p=g.attributes.position,nr=g.attributes.normal,u=g.attributes.uv,ix=g.index.array;
      for(let k=0;k<p.count;k++){bag.p.push(p.getX(k),p.getY(k),p.getZ(k));bag.n.push(nr.getX(k),nr.getY(k),nr.getZ(k));bag.u.push(u.getX(k),u.getY(k));bag.c.push(tmp.r,tmp.g,tmp.b)}
      for(let k=0;k<ix.length;k++)bag.i.push(ix[k]+vc);
      vc+=p.count;g.dispose();
    };
    const bx=(w,h,d,x,y,z,col,plain)=>{ // 창문이 있는 벽 / plain=창 없는 면
      const g=new THREE.BoxGeometry(w,h,d),u=g.attributes.uv;g.translate(x,y+h/2,z);
      if(plain)flat(g);
      else for(let f=0;f<6;f++)for(let k=0;k<4;k++){const j=f*4+k;
        if(f===2||f===3)u.setXY(j,.5,.03);else u.setXY(j,u.getX(j)*(f<2?d:w)/12,u.getY(j)*h/12.8)}
      push(g,col);
    };
    const cy=(rt,rb,h,x,y,z,col,sg)=>{const g=new THREE.CylinderGeometry(rt,rb,h,sg||12);if(sg===4)g.rotateY(Math.PI/4);g.translate(x,y+h/2,z);push(flat(g),col)};
    const prism=(len,r,x,y,z,col)=>{const g=new THREE.CylinderGeometry(r,r,len,3);g.rotateY(Math.PI/2);g.rotateZ(Math.PI/2);g.translate(x,y+r/2,z);push(flat(g),col)};
    const dome=(r,x,y,z,col)=>{const g=new THREE.SphereGeometry(r,24,10,0,Math.PI*2,0,Math.PI/2);g.translate(x,y,z);push(flat(g),col)};
    const pick=a=>a[Math.floor(rnd()*a.length)];
    const make=(t,w,h,fr)=>{
      bx(fr*2,.15,fr*2,0,0,0,0xbcc2b6,true); // 보도 포장
      if(t==='commerce'){ // 유리 포디움 + 3단 셋백 타워 + 옥상 설비
        const ph=3.5+rnd()*2,pw=w*1.5,h1=h*.55,h2=h*.28,h3=h*.17;
        bx(pw*1.25,ph,pw,0,0,0,0xcfd8e3);bx(pw*1.25+.6,.3,pw+.6,0,ph,0,0xffffff,true);
        bx(w,h1,w,0,ph,0,0x6aa7d9);bx(w*.78,h2,w*.78,0,ph+h1,0,0x5b97cc);bx(w*.52,h3,w*.52,0,ph+h1+h2,0,0x4f89bf);
        bx(w*.3,1.6,w*.3,0,ph+h,0,0x8a94a3,true);
        if(h>20)cy(.12,.12,7,0,ph+h+1.6,0,0xdde4ea,6);
      }else if(t==='housing'){ // 판상형 + 발코니 띠 + 옥상녹화·태양광 + 계단실
        const D=w*.9,Lg=w*2.2,col=pick([0xe8dcc0,0xdad3c2,0xefe4cf]);
        bx(Lg,h,D,0,0,0,col);
        for(let y=4.8;y<h-1;y+=6.4)bx(Lg+.2,.2,D+1.4,0,y,0,0xf2eee4,true);
        bx(Lg-.8,.4,D-.8,0,h,0,0x5fae6a,true);
        [-1,1].forEach(s=>bx(Lg*.28,.2,D*.55,s*Lg*.25,h+.4,0,0x1f4f9a,true));
        bx(3,h+2.5,3,0,0,-D/2-.5,0xd9d2c3);bx(w*.9,3,w*.9,-Lg*.25,0,D/2+w*.45,0xc8bfa8);
      }else if(t==='industry'){ // 톱날 지붕 공장 + 저장탱크 + 굴뚝 + 하역장
        const Lg=w*1.7,D=w*1.1;
        bx(Lg,h,D,0,0,0,0xaab4be);
        for(let k=-1;k<=1;k++)prism(Lg,D/5.2,0,h,k*D/3,0x7d8793);
        [-1,1].forEach(s=>cy(1.8,1.8,h+2,s*Lg*.3,0,D/2+2.2,0xf0f4f7,16));
        cy(.7,.9,h+9,-Lg*.35,0,-D/2+1,0xb5654a,10);bx(Lg*.4,2.4,2.5,0,0,D/2+1.2,0x7d8793,true);
      }else if(t==='edu'){ // ㄷ자 배치 교사동 + 시계탑 + 잔디 마당
        const W=w*1.5,c1=pick([0xcbbce6,0xd6c8ee]);
        bx(w*.8,h,W*1.2,-W*.8,0,0,c1);bx(w*.8,h,W*1.2,W*.8,0,0,c1);bx(W*2.4,h*.8,w*.8,0,0,-W*.55,c1);
        bx(2.2,h+4,2.2,0,0,-W*.55,0xe6dff5);cy(0,1.6,3,0,h+4,-W*.55,0xb05a4a,4);
        bx(W,.2,W*.9,0,0,W*.35,0x6fb56c,true);
      }else{ // 문화시설: 원형 홀 + 유리 띠 + 기둥 + 돔
        const r=w*.85;
        cy(r+2.2,r+2.2,.6,0,0,0,0xe6e0d4,28);cy(r,r,h,0,.6,0,0xf0d6dc,28);cy(r+.08,r+.08,h*.35,0,.6+h*.3,0,0x3b4f66,28);
        for(let k=0;k<8;k++){const b=k*Math.PI/4;cy(.3,.3,h,(r+1)*Math.cos(b),.6,(r+1)*Math.sin(b),0xf6efe8,8)}
        cy(r+1.6,r+1.6,.3,0,.6+h,0,0xffffff,28);dome(r*.8,0,.9+h,0,0x9fd0f0);
      }
    };
    const S=['housing','commerce','commerce','industry','edu','housing','culture','housing'];
    const T={housing:[6,14,3,5],commerce:[14,32,3.5,5.5],industry:[4,8,5,8],edu:[5,9,3.5,5],culture:[3,6,5,7]};
    const FR={commerce:w=>w*1.2,housing:w=>w*1.35,industry:w=>w*1.1+2.5,edu:w=>w*1.9,culture:w=>w*.85+2.5};
    const placed=[],m4=new THREE.Matrix4(),q=new THREE.Quaternion();
    for(let s=0;s<8;s++){
      const t=T[S[s]];let i=0,k=0;
      while(i<56&&k++<600){
        const w=t[2]+rnd()*(t[3]-t[2]),h=t[0]+rnd()*(t[1]-t[0]),fr=FR[S[s]](w);
        const z0=rnd()<.45?[102.5,148]:[152,211.5],lo=z0[0]+fr,hi=z0[1]-fr;
        if(hi<=lo)continue;
        const r=lo+rnd()*(hi-lo),dl=Math.asin(Math.min(1,(3+fr)/r))*180/Math.PI;
        if(45-2*dl<=0)continue;
        const a=45*s+dl+rnd()*(45-2*dl),p=P(r,a);
        if(Object.values(L).some(l=>l.rad&&Math.hypot(l.at[0]-p[0],l.at[1]-p[1])<l.rad+fr+2))continue;
        if(placed.some(o=>Math.hypot(o[0]-p[0],o[1]-p[1])<o[2]+fr+1.5))continue;
        placed.push([p[0],p[1],fr]);
        base.makeRotationY(-a*Math.PI/180).setPosition(p[0],0,p[1]);
        make(S[s],w,h,fr);i++;
      }
    }
    const bg=new THREE.BufferGeometry();
    bg.setAttribute('position',new THREE.Float32BufferAttribute(bag.p,3));
    bg.setAttribute('normal',new THREE.Float32BufferAttribute(bag.n,3));
    bg.setAttribute('uv',new THREE.Float32BufferAttribute(bag.u,2));
    bg.setAttribute('color',new THREE.Float32BufferAttribute(bag.c,3));
    bg.setIndex(new THREE.Uint32BufferAttribute(bag.i,1));
    city.add(new THREE.Mesh(bg,bMat));
    /* 나무 */
    const tm=new THREE.InstancedMesh(new THREE.ConeGeometry(2,6,6),mat(0x2f7d43),260);let tn=0,g=0;
    while(tn<260&&g++<2000){
      const p=P(tn<200?48+rnd()*44:222+rnd()*34,rnd()*360);
      if(Object.values(L).some(l=>l.rad&&Math.hypot(l.at[0]-p[0],l.at[1]-p[1])<l.rad+4))continue;
      const sc=.7+rnd()*.7;m4.compose(new THREE.Vector3(p[0],3*sc,p[1]),q.identity(),new THREE.Vector3(sc,sc,sc));tm.setMatrixAt(tn++,m4);
    }
    tm.count=tn;city.add(tm);
    /* 시설 + 라벨 */
    for(const id in L){
      const l=L[id];if(!B[id])continue;
      const gp=new THREE.Group();B[id](gp);gp.position.set(l.at[0],0,l.at[1]);gp.userData.fid=id;
      l.s=label(l.n,l.h+6,gp);city.add(gp);
    }
    marker=new THREE.Mesh(new THREE.RingGeometry(1,1.25,64),new THREE.MeshBasicMaterial({color:C.mint,side:THREE.DoubleSide,transparent:true,opacity:.9}));
    marker.rotation.x=-Math.PI/2;marker.visible=false;scene.add(marker);
  }

  function paintRoads(){
    const on=filt==='mobility'||sel==='ring';
    roads.forEach(m=>{m.emissive.copy(m.color);m.emissiveIntensity=on?.9:(night?.45:0)});
  }
  function setNight(b){
    night=b;const bg=b?0x050c16:0xbcd8ee;
    scene.background=new THREE.Color(bg);scene.fog=new THREE.Fog(bg,520,1150);
    hemi.intensity=b?.35:.95;hemi.color.setHex(b?0x6f8fc0:0xdff0ff);sun.intensity=b?.25:.85;
    bMat.emissive.setHex(b?0xffe2a8:0);paintRoads();
  }
  function goTo(tx,ty,tz,dist,instant){
    const p1=new THREE.Vector3(tx,ty,tz),c1=p1.clone().add(new THREE.Vector3(.55,.5,.75).normalize().multiplyScalar(dist));
    if(calm||instant){camera.position.copy(c1);controls.target.copy(p1);fly=null;return}
    fly={t0:performance.now(),p0:controls.target.clone(),c0:camera.position.clone(),p1,c1};
  }
  function flyTo(id){
    const l=L[id];if(!l)return;sel=id;mrad=l.rad;
    marker.visible=!!l.rad;marker.position.set(l.at[0],.5,l.at[1]);marker.scale.setScalar(Math.max(mrad,1));
    goTo(l.at[0],l.h/3,l.at[1],l.d);paintRoads();
  }
  function home(instant){sel=null;marker.visible=false;goTo(0,0,0,470,instant);paintRoads()}
  function zoom(k){
    const v=camera.position.clone().sub(controls.target);
    camera.position.copy(controls.target).add(v.setLength(Math.min(650,Math.max(25,v.length()*k))));
  }
  function setFilter(cat,map){
    filt=cat;for(const id in L){const l=L[id];if(l.s)l.s.material.opacity=(cat==='all'||map[id]===cat)?1:.2}
    paintRoads();
  }
  function resize(el){
    const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  function pick(e){
    const r=renderer.domElement.getBoundingClientRect(),rc=new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);
    const h=rc.intersectObjects(city.children,true)[0];if(!h)return;
    let o=h.object;while(o&&!(o.userData&&o.userData.fid))o=o.parent;
    if(o)onPick(o.userData.fid);
  }
  function loop(t){
    requestAnimationFrame(loop);if(!active)return;
    if(fly){
      const k=Math.min(1,(performance.now()-fly.t0)/900),e=k*k*(3-2*k);
      controls.target.lerpVectors(fly.p0,fly.p1,e);camera.position.lerpVectors(fly.c0,fly.c1,e);if(k>=1)fly=null;
    }
    if(!calm){rotors.forEach(r=>{r.rotation.z+=.03});if(marker.visible)marker.scale.setScalar(Math.max(mrad,1)*(1+.08*Math.sin(t/300)))}
    const tg=controls.target,d=Math.hypot(tg.x,tg.z);if(d>280){tg.x*=280/d;tg.z*=280/d}
    controls.update();renderer.render(scene,camera);
  }
  function init(el,cb){
    if(!window.THREE||!THREE.OrbitControls)return false;
    try{renderer=new THREE.WebGLRenderer({antialias:true})}catch(e){return false}
    onPick=cb;calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));el.appendChild(renderer.domElement);
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(50,1,1,2500);
    controls=new THREE.OrbitControls(camera,renderer.domElement);
    Object.assign(controls,{enableDamping:true,dampingFactor:.08,minDistance:25,maxDistance:650,maxPolarAngle:1.45,screenSpacePanning:false});
    build();setNight(false);home(true);
    new ResizeObserver(()=>resize(el)).observe(el);
    let dn=null;const dom=renderer.domElement;
    dom.addEventListener('pointerdown',e=>{dn=[e.clientX,e.clientY]});
    dom.addEventListener('pointerup',e=>{if(dn&&Math.hypot(e.clientX-dn[0],e.clientY-dn[1])<6)pick(e)});
    requestAnimationFrame(loop);return true;
  }
  return {init,fly:flyTo,home:()=>home(false),zoom,setFilter,setNight,
    setCalm:b=>{calm=b},setActive:b=>{active=b},clear:()=>{sel=null;marker.visible=false;paintRoads()}};
})();
