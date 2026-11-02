(()=>{'use strict';
const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];
const stage=$('#stage'),slides=$$('.slide'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const {View,Fold,Tiling,geo,views}=ClassroomGeometry;
let current=0,zviews=[],zfolds=[],sound=true,audio=null,timers=[],bits=[],last=performance.now();
const cv=$('#confetti'),cx=cv.getContext('2d');
function cue(kind='pop'){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const t0=audio.currentTime;
  const tone=(hz,at,dur,type='triangle',vol=.06,to=null)=>{const o=audio.createOscillator(),g=audio.createGain(),t=t0+at;o.type=type;o.frequency.setValueAtTime(hz,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+dur+.05)};
  if(kind==='win')[523,659,784,1046].forEach((hz,i)=>tone(hz,i*.1,.25));
  else if(kind==='page'){const n=audio.sampleRate*.22,buf=audio.createBuffer(1,n,audio.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/n);const src=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();src.buffer=buf;f.type='bandpass';f.frequency.setValueAtTime(600,t0);f.frequency.exponentialRampToValueAtTime(2400,t0+.2);f.Q.value=1.2;g.gain.value=.12;src.connect(f);f.connect(g);g.connect(audio.destination);src.start(t0)}
  else if(kind==='tick')tone(1320,0,.08,'sine',.05);
  else if(kind==='wrong'){tone(330,0,.18,'square',.03,220);tone(247,.14,.22,'square',.03,165)}
  else if(kind==='fly')tone(400,0,.45,'sine',.05,1400);
  else if(kind==='select')tone(880,0,.12,'sine',.05,1100);
  else tone(660,0,.25)}catch{}}
function later(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id}
function celebrate(sl=slides[current]){cue('win');sl.classList.remove('celebrating');void sl.offsetWidth;sl.classList.add('celebrating');later(()=>sl.classList.remove('celebrating'),1500);if(reduce)return;for(let i=0;i<100;i++)bits.push({x:800+(Math.random()-.5)*650,y:190,vx:(Math.random()-.5)*350,vy:-80-Math.random()*220,a:Math.random()*6,w:7+Math.random()*8,col:['#e8742a','#2f6bd8','#48ad70','#f6d55b','#b17ce1'][i%5]})}
function frame(t){const dt=Math.min(.05,(t-last)/1000);last=t;const s=slides[current];for(const v of views)if(s.contains(v.host))v.tick(dt);cx.clearRect(0,0,1600,900);for(const b of bits){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=480*dt;b.a+=dt*2;cx.save();cx.translate(b.x,b.y);cx.rotate(b.a);cx.fillStyle=b.col;cx.fillRect(-b.w/2,-b.w/4,b.w,b.w/2);cx.restore()}bits=bits.filter(b=>b.y<920);requestAnimationFrame(frame)}
function fit(){const r=$('#viewport').getBoundingClientRect(),k=Math.min(r.width/1600,r.height/900);stage.style.transform=`translate(-50%,-50%) scale(${k})`}
addEventListener('resize',fit);

/* Exact equal-edge green-rod lattices, with the same ball orientation as the reference lessons. */
/* Medium rods throughout: K = G1/√2·φ, so tet/oct edges are G2 (medium green) and ico/cube edges are B2 (medium blue). */
const vec=p=>new THREE.Vector3(...p),K=Math.hypot(...ZOMEPARTS.green.dir)/Math.SQRT2*(1+Math.sqrt(5))/2;
const tp=[[0,0,0],[1,1,0],[1,0,1],[0,1,1]].map(p=>p.map(x=>x*K));
const te=[[0,1],[1,2],[2,0],[0,3],[1,3],[2,3]],tf=[[0,1,2],[0,1,3],[1,2,3],[2,0,3]];
const op=[[0,0,0],[1,1,0],[2,0,0],[1,-1,0],[1,0,1],[1,0,-1]].map(p=>p.map(x=>x*K));
const oe=[[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4],[0,5],[1,5],[2,5],[3,5]],of=[[0,1,4],[1,2,4],[2,3,4],[3,0,4],[0,1,5],[1,2,5],[2,3,5],[3,0,5]];
function orient(up,front,yaw){const U=up.clone().normalize(),F=front.clone().addScaledVector(U,-front.dot(U)).normalize(),R=U.clone().cross(F);return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(R,U,F).transpose()).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw))}
const tcenter=tp.slice(0,3).map(vec).reduce((s,v)=>s.add(v),new THREE.Vector3()).multiplyScalar(1/3),tup=vec(tp[3]).sub(tcenter).normalize(),tfront=vec(tp[0]).sub(tcenter).normalize();
const tq=orient(tup,tfront,.18),oq=orient(new THREE.Vector3(0,0,1),new THREE.Vector3(-1,1,0),-.12);
const PHIc=(1+Math.sqrt(5))/2;
const icoBase=[[0,1,PHIc],[0,-1,PHIc],[0,1,-PHIc],[0,-1,-PHIc],[1,PHIc,0],[-1,PHIc,0],[1,-PHIc,0],[-1,-PHIc,0],[PHIc,0,1],[PHIc,0,-1],[-PHIc,0,1],[-PHIc,0,-1]].map(p=>p.map(x=>x*K/2));
const icoAdj=icoBase.map(()=>[]),icoE=[];
for(let a=0;a<12;a++)for(let b=a+1;b<12;b++){const d=Math.hypot(icoBase[a][0]-icoBase[b][0],icoBase[a][1]-icoBase[b][1],icoBase[a][2]-icoBase[b][2]);if(Math.abs(d-K)<1e-6){icoE.push([a,b]);icoAdj[a].push(b);icoAdj[b].push(a)}}
const icoF=[];for(let a=0;a<12;a++)for(const b of icoAdj[a])for(const c of icoAdj[b])if(a<b&&b<c&&icoAdj[c].includes(a))icoF.push([a,b,c]);
const icoRing=icoAdj[0],icoOrd=[0,...icoRing];for(let i=0;i<12;i++)if(i!==0&&!icoRing.includes(i))icoOrd.push(i);
const icoInv={};icoOrd.forEach((o,i)=>{icoInv[o]=i});
const iP=icoOrd.map(i=>icoBase[i]);
const iE=icoE.map(([a,b])=>[icoInv[a],icoInv[b]]).sort((e1,e2)=>((Math.max(...e1)<6?0:1)-(Math.max(...e2)<6?0:1)));
const iF=icoF.map(f=>f.map(i=>icoInv[i]));
const iC=[0,0,0];for(let i=0;i<6;i++)for(let j=0;j<3;j++)iC[j]+=iP[i][j]/6;
const iq=orient(vec(icoBase[0]),vec(icoBase[icoOrd[1]]),0.35);

function model(P,E,F,count,edges,quaternion,center,elev=17,kind='green'){return{balls:P.slice(0,count).map(p=>[vec(p),'white']),struts:E.slice(0,edges).map(([a,b])=>[vec(P[a]),vec(P[b]),kind]),faces:F.filter(f=>f.every(i=>i<count)),edges:E.slice(0,edges),orient:quaternion.clone(),center:vec(center),elev,dashes:[],labels:[]}}
const G=(m,n)=>{m.grow=n;return m};
const cubeB=()=>{const P=[0,1].flatMap(a=>[0,1].flatMap(b=>[0,1].map(c=>[a,b,c]))).map(p=>p.map(x=>x*K));const E=[];for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){const d=Math.hypot(...P[i].map((x,k)=>x-P[j][k]));if(Math.abs(d-K)<1e-6)E.push([i,j])}return model(P,E,[],8,12,oq,[K/2,K/2,K/2],22,'blue')};
const sqG=()=>model(op,oe,[],4,4,oq,[K,0,0],28,'blue');
const withScaf=(m,C,color,verts)=>{const have=new Set(m.balls.map(b=>b[0].toArray().join()));const c=vec(C);const addB=verts.map(p=>vec(p)).filter(p=>!have.has(p.toArray().join())).map(p=>[p,'white']);return{balls:[...m.balls,...addB,[c,'white']],struts:[...m.struts,...verts.map(p=>[c.clone(),vec(p).clone(),color])],faces:m.faces,edges:m.edges,orient:m.orient,center:m.center,elev:m.elev,dashes:[],labels:[],grow:m.grow}};
const S=(k)=>k+'S';

const tetGm=s=>{const st=s===undefined?2:s;return st===1?G(model(tp,te,[[0,1,2]],3,3,tq,[K/2,K/2,K/2],23),2):G(model(tp,te,tf,4,6,tq,[K/2,K/2,K/2],23),2)};
const octGm=s=>{const st=s===undefined?3:s;return st===1?G(model(op,oe,[[0,1,2,3]],4,4,oq,[K,0,0],23),3):st===2?G(model(op,oe,of.slice(0,4),5,8,oq,[K,0,0],23),3):G(model(op,oe,of,6,12,oq,[K,0,0],23),3)};
const icoGm=s=>{const st=s===undefined?2:s;return st===1?G(model(iP,iE,iF,6,10,iq,iC,25,'blue'),2):G(model(iP,iE,iF,12,30,iq,[0,0,0],17,'blue'),2)};
const midLen=Math.hypot(...ZOMEPARTS.blue.dir);
const triFlatM=k=>{const R=midLen,c=[0,0,0];const ring=[];for(let i=0;i<6;i++){const a=Math.PI/2+i*Math.PI/3;ring.push([c[0]+R*Math.cos(a),c[1]+R*Math.sin(a),0])}
  const nb=Math.min(k+1,6);const balls=[[vec(c),'white']];for(let i=0;i<nb;i++)balls.push([vec(ring[i]),'white']);
  const struts=[];for(let i=0;i<nb;i++)struts.push([vec(c),vec(ring[i]),'blue']);
  for(let i=0;i<nb-1;i++)struts.push([vec(ring[i]),vec(ring[i+1]),'blue']);
  if(k===6)struts.push([vec(ring[5]),vec(ring[0]),'blue']);
  const m={balls,struts,faces:[],edges:[],orient:oq.clone(),center:vec([0,0,0]),elev:35,dashes:[],labels:[]};return G(m,6)};
const sqFlatM=k=>{const R=midLen,c=[0,0,0];const g=[];for(let j=0;j<3;j++)for(let i=0;i<3;i++)g.push([c[0]+(i-1)*R,c[1]+(j-1)*R,0]);
  const cells=[[[0,0],[1,0],[1,1],[0,1]],[[1,0],[2,0],[2,1],[1,1]],[[0,1],[1,1],[1,2],[0,2]],[[1,1],[2,1],[2,2],[1,2]]];
  const shown=cells.slice(0,k);const vset=new Set(),E=[];
  shown.forEach(cell=>cell.forEach(p=>vset.add(p.join())));
  const vs=[...vset].map(k2=>k2.split(',').map(Number));
  shown.forEach(cell=>{for(let i=0;i<4;i++){const a=vs.findIndex(q=>q[0]===cell[i][0]&&q[1]===cell[i][1]),b=vs.findIndex(q=>q[0]===cell[(i+1)%4][0]&&q[1]===cell[(i+1)%4][1]);if(a<b)E.push([a,b]);else E.push([b,a])}});
  const dup=new Set(),E2=[];E.forEach(([a,b])=>{const k2=a<b?a+'|'+b:b+'|'+a;if(!dup.has(k2)){dup.add(k2);E2.push([a,b])}});
  const m={balls:vs.map(p=>[vec([p[0]*R,p[1]*R,0]),'white']),struts:E2.map(([a,b])=>[vec([vs[a][0]*R,vs[a][1]*R,0]),vec([vs[b][0]*R,vs[b][1]*R,0]),'blue']),faces:[],edges:E2,orient:oq.clone(),center:vec([0,0,0]),elev:35,dashes:[],labels:[]};return G(m,4)};
/* Regular dodecahedron with medium blue (B2) edges: its balls sit at the face centres of the icosahedron. */
function dodM(){const B2=Math.hypot(...ZOMEPARTS.blue.dir);const C=icoF.map(f=>f.map(i=>vec(icoBase[i])).reduce((a,b)=>a.add(b),new THREE.Vector3()).multiplyScalar(1/3));
  let e=1e9;for(let a=0;a<20;a++)for(let b=a+1;b<20;b++)e=Math.min(e,C[a].distanceTo(C[b]));const k=B2/e;C.forEach(p=>p.multiplyScalar(k));
  const E=[];for(let a=0;a<20;a++)for(let b=a+1;b<20;b++)if(Math.abs(C[a].distanceTo(C[b])-B2)<1e-6)E.push([a,b]);
  return{balls:C.map(p=>[p,'white']),struts:E.map(([a,b])=>[C[a],C[b],'blue']),faces:[],edges:E,orient:orient(C[0].clone(),C[E.find(x=>x[0]===0)[1]].clone(),.3),center:new THREE.Vector3(),elev:16,dashes:[],labels:[]}}
/* 密铺 patches in medium blue (B2): 6 triangles / 4 squares / 3 hexagons around one ball, growing ring by ring. Lies face-on to the camera. */
function tileM(k,R){const B2=Math.hypot(...ZOMEPARTS.blue.dir),cells=[];
  if(k===3){const inR=(x,y)=>Math.hypot(x,y)<=R+1e-6;for(let i=-R-1;i<=R+1;i++)for(let j=-R-1;j<=R+1;j++){const x0=i+j*.5,y0=j*Math.sqrt(3)/2,P=[[x0,y0],[x0+1,y0],[x0+.5,y0+Math.sqrt(3)/2],[x0+1.5,y0+Math.sqrt(3)/2]];
    if(inR(...P[0])&&inR(...P[1])&&inR(...P[2]))cells.push([P[0],P[1],P[2]]);if(inR(...P[1])&&inR(...P[2])&&inR(...P[3]))cells.push([P[1],P[3],P[2]])}}
  else if(k===4){for(let i=-R;i<R;i++)for(let j=-R;j<R;j++)cells.push([[i,j],[i+1,j],[i+1,j+1],[i,j+1]])}
  else{for(let q=-R-1;q<=R+1;q++)for(let r=-R-1;r<=R+1;r++){const cx=1.5*q-1,cy=Math.sqrt(3)*(r+q/2);const d=Math.min(...[[0,0],[1,0],[1,-1]].map(([hq,hr])=>{const dq=q-hq,dr=r-hr;return(Math.abs(dq)+Math.abs(dr)+Math.abs(dq+dr))/2}));if(d>R-1)continue;const p=[];for(let m=0;m<6;m++){const a=Math.PI/3*m;p.push([cx+Math.cos(a),cy+Math.sin(a)])}cells.push(p)}}
  const key=p=>p.map(x=>x.toFixed(3)).join(),idx=new Map(),pts=[],E=[],ek=new Set();
  const id=p=>{const kk=key(p);if(!idx.has(kk)){idx.set(kk,pts.length);pts.push(vec([p[0]*B2,p[1]*B2,0]))}return idx.get(kk)};
  cells.forEach(c=>c.forEach((p,i)=>{const a=id(p),b=id(c[(i+1)%c.length]),kk=Math.min(a,b)+'|'+Math.max(a,b);if(!ek.has(kk)){ek.add(kk);E.push([a,b])}}));
  return{balls:pts.map(p=>[p,'white']),struts:E.map(([a,b])=>[pts[a],pts[b],'blue']),faces:[],edges:E,orient:new THREE.Quaternion(),center:new THREE.Vector3(),elev:22,dashes:[],labels:[],grow:3}}
const specs={
 triFlat:triFlatM,
 sqFlat:sqFlatM,
 tetBase:()=>model(tp,te,[[0,1,2]],3,3,tq,[K/2,K/2,K/2],23),
 tet:()=>model(tp,te,tf,4,6,tq,[K/2,K/2,K/2],23),
 octBase:()=>model(op,oe,[[0,1,2,3]],4,4,oq,[K,0,0],23),
 octTop:()=>model(op,oe,of.slice(0,4),5,8,oq,[K,0,0],23),
 oct:()=>model(op,oe,of,6,12,oq,[K,0,0],23),
 icoCap:()=>model(iP,iE,iF,6,10,iq,iC,25,'blue'),
 ico:()=>model(iP,iE,iF,12,30,iq,[0,0,0],17,'blue'),
 tetG:tetGm,
 octG:octGm,
 icoG:icoGm,
 cubeB:cubeB,
 sqG:sqG,
 tetGS:s=>{const m=tetGm(s);const cv=[[0,0,0],[1,0,0],[0,1,0],[0,0,1],[1,1,0],[1,0,1],[0,1,1],[1,1,1]].map(p=>p.map(x=>x*K));const cvv=cv.map(p=>vec(p));const have=new Set(m.balls.map(b=>b[0].toArray().join()));const addB=cvv.filter(p=>!have.has(p.toArray().join())).map(p=>[p,'white']);const E=[];for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){if(Math.abs(cvv[i].distanceTo(cvv[j])-K)<1e-6)E.push([cvv[i].clone(),cvv[j].clone(),'blue'])}return{balls:[...m.balls,...addB],struts:[...m.struts,...E],faces:m.faces,edges:m.edges,orient:m.orient,center:m.center,elev:m.elev,dashes:[],labels:[],grow:m.grow}},
 octGS:s=>withScaf(octGm(s),[K,0,0],'blue',op),
 icoGS:s=>withScaf(icoGm(s),[0,0,0],'red',iP),
 dod:()=>dodM(),
 tile3:s=>tileM(3,s),tile4:s=>tileM(4,s),tile6:s=>tileM(6,s)
};Object.assign(Zome3D._M,specs);
window.lessonModels=()=>Object.fromEntries(Object.entries(specs).map(([name,fn])=>{const m=fn();return[name,{positions:m.balls.map(b=>b[0].toArray()),edges:m.edges,faces:m.faces}]}));
function zomeHost(h){try{const v=Zome3D.mount(h,h.dataset.zome,{fitW:h.clientWidth*.78,fitH:h.clientHeight*.77,from:h.dataset.from,stage:+(h.dataset.stage||0)||undefined,zoom:+(h.dataset.zoom||1)});h._z=v;zviews.push({h,v});if(h.dataset.intro!==undefined&&!reduce)v.intro(null,1900,Math.PI*0.6,1.15);return v}catch(error){console.error('Zometool model failed',error);const image=document.createElement('img');image.src='a/zome-'+(['tet','ico','oct'].find(n=>h.dataset.zome.startsWith(n))||'oct')+'.png';image.alt='Zometool 完整作品参考图';image.className='zome-fallback';h.append(image);const sl=h.closest('.slide');const b=$('[data-connect]',sl);if(b){b.disabled=true;b.textContent='模型未载入'}return null}}
function solidHost(h){if(!h._v)h._v=new View(h);else{h._v.clearHi();h._v.home()}return h._v}
function setPressed(b,active){b.setAttribute('aria-pressed',String(active))}
function enter(s){
 if($('[data-model-switch]',s))$('.zome-host',s).dataset.zome='cubeB';
 if($('[data-euler-pick]',s))$('.zome-host',s).dataset.zome='tet';
 $$('.zome-host.tile',s).forEach(h=>h.dataset.stage=1);
 $$('.solid-host',s).forEach(solidHost);$$('.zome-host',s).forEach(zomeHost);
 $$('[data-character]',s).forEach(b=>{$('span',b).hidden=true;b.classList.remove('revealed');setPressed(b,false)});
 $$('[data-connect]',s).forEach(b=>{b.disabled=false;b.textContent='接上去'});
 $$('[data-count-solid]',s).forEach(b=>{b._index=0;b.textContent='一个面'});$$('[data-face-output]',s).forEach(o=>o.textContent='');
 $$('.vertex-answer',s).forEach(o=>o.hidden=true);s._vertexIndex=0;s._faceIndex=0;s.classList.remove('grouped','celebrating');
 $$('.five-unit',s).forEach(u=>u.classList.remove('shown'));const fiveBtn=$('[data-reveal-five]',s);if(fiveBtn){fiveBtn.disabled=false;fiveBtn.textContent='伙伴集合！';s._fiveIndex=0}
 $$('.el-card',s).forEach(c=>{c.classList.remove('matched','wrong');const im=$('img',c);if(im)im.hidden=true});
 $$('.el-chip',s).forEach(ch=>ch.classList.remove('picked','used','wrong'));$$('.el-card',s).forEach(c=>c.classList.remove('picked'));s._selCard=s._selChip=null;s.classList.remove('want-chip','want-card');s._elDone=0;
 const elHint=$('.el-hint',s);if(elHint)elHint.textContent='';const elFinal=$('.el-final',s);if(elFinal)elFinal.hidden=true;const elClue=$('.el-clue',s);if(elClue)elClue.hidden=false;
 $$('.rule-card:not(.euler-card)',s).forEach(r=>r.hidden=true);$$('.zome-host.tile',s).forEach(h=>h._z?.home());s._ruleIdx=0;const ruleBtn=$('[data-rules]',s);if(ruleBtn){ruleBtn.disabled=false;ruleBtn.textContent='描述特点'}
 $$('.model-name',s).forEach(x=>x.classList.remove('shown'));$$('[data-spin-toggle]',s).forEach(x=>{setPressed(x,false);x.textContent='停下来'});$$('.solid-host[data-spin]',s).forEach(h=>{if(h._v)h._v.spin=+h.dataset.spin});$$('.feat',s).forEach(x=>{x.hidden=true;x.classList.remove('dim')});s._ff=s._fv=undefined;$$('[data-feat-face],[data-feat-vertex]',s).forEach(x=>setPressed(x,false));
 s._hist=0;s._histDone=false;$$('.hist-fig',s).forEach(x=>x.classList.remove('on'));$$('.hist-say,.hist-node',s).forEach(x=>x.classList.remove('on'));s.classList.remove('hist-burst-on','hist-done');const hf=$('.hist-fill',s);if(hf)hf.style.width='0px';const hn=$('[data-hist-next]',s);if(hn)hn.disabled=false;
 $$('[data-model-switch]',s).forEach((x,i)=>setPressed(x,i===0));const nameBtn=$('[data-names]',s);if(nameBtn){nameBtn.disabled=false;nameBtn.textContent='看名字'}
 s.classList.remove('nat-on');const natBtn=$('[data-nature]',s);if(natBtn){natBtn.disabled=false;natBtn.textContent='揭晓答案'}
 const tm=$('[data-tile-more]',s);if(tm){tm.disabled=false;tm.textContent='再拼一圈';tm._busy=false}
 $$('.zfold-host',s).forEach(h=>{try{const f=new ZomeFold(h,{k:+h.dataset.k,n:+h.dataset.n,color:h.dataset.color,foldColor:h.dataset.foldColor,t:h.dataset.static!==undefined?1:0,elev:h.dataset.elev?+h.dataset.elev:undefined,fit:h.dataset.fit?+h.dataset.fit:undefined,markApex:h.dataset.static===undefined});h._f=f;zfolds.push(f)}catch(e){console.error('fold failed',e)}});
 $$('[data-zf]',s).forEach((b,i)=>setPressed(b,i===0));$$('.zf-answer',s).forEach(o=>{o.hidden=true;o.textContent=''});$$('[data-zf-fold]',s).forEach(b=>{b.textContent='聚拢';b.classList.remove('is-on')});s._zfFolded=false;
 $$('[data-zome-step]',s).forEach(b=>{b.disabled=false;b.textContent='下一步'});
 const cmpBtn=$('[data-compare-step]',s);if(cmpBtn){cmpBtn.disabled=false;cmpBtn.textContent='看它们的面'}s._cmp=0;s._faceIndex=0;s._vertexIndex=0;$$('.vertex-answer',s).forEach(o=>o.hidden=true);
 $$('[data-img-step]',s).forEach(b=>{b.disabled=false;b.textContent='再加一个'});s._imgIdx=0;const si=$('.step-img',s);if(si&&s.dataset.imgList)si.src='a/vz/'+s.dataset.imgList.split(',')[0]+'.png';const se=$('.step-end',s);if(se)se.hidden=true;
 s._eu=0;$$('[data-euler-row]',s).forEach(tr=>{tr.classList.remove('filled','cur');$$('.cell',tr).forEach(c=>c.hidden=true)});const r0=$('[data-euler-row]',s);if(r0)r0.classList.add('cur');$$('[data-euler-pick]',s).forEach((x,k)=>setPressed(x,k===0));const eb=$('.count-badge',s);if(eb)eb.hidden=true;$$('[data-euler-count]',s).forEach(x=>setPressed(x,false));$$('[data-euler-next]',s).forEach(x=>x.disabled=false);
 $$('.mini-fold',s).forEach(h=>{if(!h._fold)h._fold=new Fold(h);h._fold.setup(+h.dataset.k,+h.dataset.n);h._fold.t=h._fold.target=1;h._fold.draw()});
 $$('.tiling-host',s).forEach(h=>{if(!h._tiling)h._tiling=new Tiling(h);h._tiling.setup(+h.dataset.tiling,1)});const tBtn=$('[data-tiling-more]',s);if(tBtn){tBtn.disabled=false;tBtn.textContent='再拼一圈'}
 if(s.dataset.foldDefault){const host=$('.fold-host',s);if(!host._fold)host._fold=new Fold(host);const [k,n]=s.dataset.foldDefault.split(',').map(Number);pickFold(s,k,n)}
}
function leave(){timers.forEach(clearTimeout);timers=[];zfolds.forEach(f=>f.dispose());zfolds=[];$$('.zfold-host',slides[current]).forEach(h=>h._f=null);for(const {h,v} of zviews){v.dispose();h._z=null}zviews=[];bits=[];cx.clearRect(0,0,1600,900);$$('.zome-fallback',slides[current]).forEach(x=>x.remove())}
function go(i){i=Math.max(0,Math.min(slides.length-1,i));if(i!==current)cue('page');leave();slides.forEach((s,n)=>{s.hidden=n!==i;s.classList.remove('on')});current=i;const s=slides[i];s.classList.add('on');enter(s);$('#prev').disabled=i===0;$('#next').disabled=i===slides.length-1;$('#count').textContent=`${i+1} / ${slides.length}`;$('#progress i').style.width=(i+1)/slides.length*100+'%';$('#notes').replaceChildren();const close=document.createElement('button');close.className='overlay-close';close.textContent='关闭 ×';close.onclick=()=>toggle('notes','btnNotes',false);const title=document.createElement('h3');title.textContent=`${i+1}. ${s.dataset.title}`;$('#notes').append(close,title);$('.notes',s).textContent.split('\n').forEach(line=>{const p=document.createElement('p');p.textContent=line;$('#notes').append(p)});$$('#overview [data-i]').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.i===i)));try{history.replaceState(null,'','#'+(i+1))}catch{} }
window.__go=go;
function toggle(id,bid,value){const e=$('#'+id),on=value??e.hidden;e.hidden=!on;$('#'+bid).setAttribute('aria-pressed',String(on));if(on&&id==='overview')$('#overview [aria-current=true]')?.focus();if(!on)$('#'+bid).focus()}
$('#prev').onclick=()=>go(current-1);$('#next').onclick=()=>go(current+1);$('#btnGrid').onclick=()=>toggle('overview','btnGrid');$('#btnNotes').onclick=()=>toggle('notes','btnNotes');$('#btnSound').onclick=()=>{sound=!sound;$('#btnSound').textContent='声音：'+(sound?'开':'关');setPressed($('#btnSound'),sound);if(sound)cue()};$('#btnFull').onclick=()=>{const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();p?.catch(()=>{})};
let lastSec='',grid;const close=document.createElement('button');close.className='overlay-close';close.textContent='关闭目录 ×';close.onclick=()=>toggle('overview','btnGrid',false);$('#overview').append(close);const title=document.createElement('h3');title.textContent='课程目录';$('#overview').append(title);slides.forEach((s,i)=>{if(s.dataset.sec!==lastSec){lastSec=s.dataset.sec;const h=document.createElement('h4');h.textContent=lastSec;grid=document.createElement('div');grid.className='grid';$('#overview').append(h,grid)}const b=document.createElement('button');b.dataset.i=i;const n=document.createElement('b');n.textContent=i+1;b.append(n,document.createTextNode(s.dataset.title));b.onclick=()=>{go(i);toggle('overview','btnGrid',false)};grid.append(b)});


const EL_SVG={
 fire:`<svg viewBox="0 0 268 300" preserveAspectRatio="xMidYMid slice"><rect width="268" height="300" fill="#FFF3E0"/>
  <path d="M134,-6 L138,6 L150,10 L138,14 L134,26 L130,14 L118,10 L130,6 Z" fill="#FFD34D"/><path d="M226,40 L229,48 L237,51 L229,54 L226,62 L223,54 L215,51 L223,48 Z" fill="#FFC24D"/><path d="M36,52 L39,60 L47,63 L39,66 L36,74 L33,66 L25,63 L33,60 Z" fill="#FFCE3C"/>
  <circle cx="52" cy="120" r="6" fill="#FFB84D" opacity=".85"/><circle cx="222" cy="150" r="8" fill="#FFD98F" opacity=".9"/><circle cx="200" cy="70" r="4" fill="#FF9D3C" opacity=".8"/>
  <path d="M134 268 C88 258 62 220 70 178 C75 148 94 134 90 104 C112 120 124 104 126 76 C144 92 158 100 161 128 C178 114 181 88 175 62 C204 90 217 124 213 160 C240 150 246 128 243 108 C263 138 268 172 259 204 C247 248 202 272 156 272 Z" fill="#FF8A2A"/>
  <path d="M135 264 C100 256 80 224 87 190 C91 168 106 155 103 130 C120 144 132 130 134 106 C148 122 159 130 161 154 C176 142 179 120 174 100 C196 124 206 152 202 182 C226 174 231 156 229 140 C245 166 249 196 241 222 C231 256 196 266 160 266 Z" fill="#FFB646"/>
  <path d="M136 260 C112 254 98 232 102 208 C105 190 117 178 115 160 C128 172 138 160 140 142 C151 154 160 162 162 180 C173 170 175 152 171 138 C188 156 195 176 192 198 C209 192 213 177 212 164 C224 184 227 206 220 226 C212 250 188 260 160 260 Z" fill="#FFD34D"/>
  <circle cx="118" cy="196" r="9" fill="#FFF" opacity=".55"/><circle cx="176" cy="176" r="6" fill="#FFF" opacity=".5"/></svg>`,
 earth:`<svg viewBox="0 0 268 300" preserveAspectRatio="xMidYMid slice"><rect width="268" height="300" fill="#FBF0DC"/>
  <path d="M134,-6 L138,6 L150,10 L138,14 L134,26 L130,14 L118,10 L130,6 Z" fill="#8FBF6A"/><path d="M230,44 L233,52 L241,55 L233,58 L230,66 L227,58 L219,55 L227,52 Z" fill="#C9A05A"/><path d="M34,58 L37,66 L45,69 L37,72 L34,80 L31,72 L23,69 L31,66 Z" fill="#C9A05A"/>
  <ellipse cx="134" cy="238" rx="122" ry="36" fill="#B97B42"/>
  <ellipse cx="134" cy="224" rx="92" ry="42" fill="#C88A4A"/>
  <circle cx="96" cy="212" r="12" fill="#9A6534"/><circle cx="176" cy="216" r="14" fill="#9A6534"/><circle cx="136" cy="228" r="9" fill="#9A6534"/>
  <path d="M70 210 q8 -24 26 -30 q-2 22 -12 34 Z" fill="#8F5A2E"/><path d="M204 206 q12 -22 30 -26 q-4 20 -16 30 Z" fill="#8F5A2E"/>
  <rect x="130" y="182" width="8" height="30" rx="4" fill="#3A9A5B"/>
  <path d="M134 186 C128 168 114 162 100 162 C112 150 130 152 136 166 C140 150 154 144 168 148 C158 158 148 164 144 180 Z" fill="#48AD70"/>
  <path d="M186 178 a12 12 0 0 1 24 0 Z" fill="#E8742A"/><rect x="195" y="178" width="5" height="12" rx="2" fill="#F7E6CE"/><circle cx="193" cy="172" r="2.6" fill="#FFF"/><circle cx="202" cy="170" r="2.6" fill="#FFF"/></svg>`,
 air:`<svg viewBox="0 0 268 300" preserveAspectRatio="xMidYMid slice"><rect width="268" height="300" fill="#EDF7FD"/>
  <path d="M134,-6 L138,6 L150,10 L138,14 L134,26 L130,14 L118,10 L130,6 Z" fill="#FFFFFF"/><path d="M228,42 L231,50 L239,53 L231,56 L228,64 L225,56 L217,53 L225,50 Z" fill="#BFE4F4"/><path d="M36,50 L39,58 L47,61 L39,64 L36,72 L33,64 L25,61 L33,58 Z" fill="#BFE4F4"/>
  <ellipse cx="84" cy="102" rx="42" ry="24" fill="#FFFFFF"/><ellipse cx="122" cy="94" rx="36" ry="20" fill="#FFFFFF"/><ellipse cx="64" cy="94" rx="26" ry="16" fill="#FFFFFF"/>
  <ellipse cx="196" cy="182" rx="44" ry="24" fill="#FFFFFF"/><ellipse cx="232" cy="174" rx="30" ry="17" fill="#FFFFFF"/>
  <path d="M14 150 C60 128 116 132 152 152 C190 172 236 170 262 152" stroke="#A9DFF1" stroke-width="11" fill="none" stroke-linecap="round"/>
  <path d="M24 214 C68 196 118 200 150 216 C184 232 228 230 258 214" stroke="#C6ECF8" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M96 252 C76 240 68 222 74 206 C92 214 102 232 100 250 Z" fill="#6FCF6F"/>
  <path d="M196 246 C216 234 238 236 250 250 C234 256 212 256 196 246 Z" fill="#6FCF6F" opacity=".85"/>
  <circle cx="84" cy="98" r="6" fill="#DFF2FB"/><circle cx="200" cy="178" r="6" fill="#DFF2FB"/></svg>`,
 water:`<svg viewBox="0 0 268 300" preserveAspectRatio="xMidYMid slice"><rect width="268" height="300" fill="#E3F3FC"/>
  <path d="M134,-6 L138,6 L150,10 L138,14 L134,26 L130,14 L118,10 L130,6 Z" fill="#FFFFFF"/><path d="M228,40 L231,48 L239,51 L231,54 L228,62 L225,54 L217,51 L225,48 Z" fill="#9BD8EE"/><path d="M34,46 L37,54 L45,57 L37,60 L34,68 L31,60 L23,57 L31,54 Z" fill="#9BD8EE"/>
  <path d="M134 176 C112 176 96 160 96 140 C96 126 106 112 118 100 C124 94 130 86 134 78 C138 86 144 94 150 100 C162 112 172 126 172 140 C172 160 156 176 134 176 Z" fill="#5FB4E4"/>
  <path d="M134 168 C117 168 104 155 104 139 C104 127 113 115 123 105 C128 99 132 93 134 88 C136 93 140 99 145 105 C155 115 164 127 164 139 C164 155 151 168 134 168 Z" fill="#8AC9EC"/>
  <circle cx="122" cy="118" r="8" fill="#FFF" opacity=".75"/>
  <path d="M8 246 C46 228 82 236 116 250 C152 264 196 264 232 250 C258 240 280 242 268 250 L268 300 L8 300 Z" fill="#5FB4E4"/>
  <path d="M8 266 C50 252 92 260 128 272 C164 284 204 282 240 270 C258 264 272 264 268 268 L268 300 L8 300 Z" fill="#39A8DD"/>
  <circle cx="60" cy="216" r="7" fill="#BFE4F4"/><circle cx="212" cy="206" r="9" fill="#BFE4F4"/><circle cx="166" cy="230" r="5" fill="#BFE4F4"/></svg>`,
 uni:`<svg viewBox="0 0 268 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="uniSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7B5CD6"/><stop offset="1" stop-color="#B58BEA"/></linearGradient></defs><rect width="268" height="300" fill="url(#uniSky)"/>
  <circle cx="36" cy="40" r="2.5" fill="#FFF" opacity=".9"/><circle cx="120" cy="24" r="2" fill="#FFF" opacity=".8"/><circle cx="228" cy="36" r="3" fill="#FFE08A"/><circle cx="246" cy="120" r="2" fill="#FFF" opacity=".7"/><circle cx="22" cy="130" r="2.5" fill="#FFF" opacity=".8"/><circle cx="70" cy="200" r="2" fill="#FFF" opacity=".6"/><circle cx="210" cy="240" r="2.5" fill="#FFF" opacity=".8"/>
  <path d="M60,70 L64,80 L74,84 L64,88 L60,98 L56,88 L46,84 L56,80 Z" fill="#FFE08A"/><path d="M208,180 L212,190 L222,194 L212,198 L208,208 L204,198 L194,194 L204,190 Z" fill="#FFE08A"/><path d="M100,150 L103,158 L111,161 L103,164 L100,172 L97,164 L89,161 L97,158 Z" fill="#FFF" opacity=".9"/>
  <path d="M186 60 a26 26 0 1 0 20 44 a20 20 0 1 1 -20 -44 Z" fill="#FFE08A"/>
  <ellipse cx="196" cy="238" rx="40" ry="13" fill="none" stroke="#F2B200" stroke-width="5" transform="rotate(-16 196 238)"/>
  <circle cx="196" cy="234" r="20" fill="#FF9F6B"/><circle cx="190" cy="228" r="6" fill="#FFD0B3" opacity=".9"/>
  <path d="M30 250 C50 236 74 234 92 244" stroke="#7FC5E8" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/></svg>`};
$$('.el-scene').forEach(el=>{el.innerHTML=EL_SVG[el.dataset.elScene]||''});

/* Children act first; teacher-controlled reveals follow. */
$$('[data-character]').forEach(b=>b.onclick=()=>{$('span',b).hidden=false;b.classList.add('revealed');setPressed(b,true);cue()});
$$('[data-celebrate]').forEach(b=>b.onclick=()=>celebrate(b.closest('.slide')));
$$('[data-connect]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),v=$('.zome-host',s)._z;if(!v)return;b.disabled=true;b.textContent='正在连接…';v.growIn(()=>{b.textContent='接好了！';cue()})});
for(const [key,fn] of [['data-zome-home','home'],['data-zome-spin','spin'],['data-zome-flip','flip']])$$('['+key+']').forEach(b=>b.onclick=()=>$$('.zome-host',b.closest('.slide')).forEach(h=>h._z?.[fn]()));
$$('[data-count-solid]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=$(`[data-solid=${b.dataset.countSolid}]`,s),v=h._v;if(b._index>=v.g.F.length)b._index=0;v.face(b._index++);$(`[data-face-output=${b.dataset.countSolid}]`,s).textContent=b._index+' 个';b.textContent=b._index===v.g.F.length?'再数一次':'下一个面';cue()});
$$('[data-pair-faces]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');$$('.zome-host',s).forEach(h=>{const v=h._z;if(v)v.face(s._faceIndex%v.inspect().faces)});s._faceIndex++;cue()});
$$('[data-pair-vertices]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),outs=$$('.vertex-answer',s);$$('.zome-host',s).forEach((h,i)=>{const v=h._z;if(!v)return;const n=v.vertex(s._vertexIndex%v.inspect().balls);outs[i].textContent=n+' 个三角形';outs[i].hidden=false});s._vertexIndex++;cue()});
$$('[data-family-groups]').forEach(b=>b.onclick=()=>{b.closest('.slide').classList.add('grouped');cue()});
$$('[data-spin-solids]').forEach(b=>b.onclick=()=>$$('.solid-host',b.closest('.slide')).forEach(h=>{h._v.targetAngles=[-.3,h._v.ay+1.7]}));
function pickFold(s,k,n){const f=$('.fold-host',s)._fold;f.setup(k,n);s._tested=false;$('.fold-answer',s).hidden=true;$('[data-fold-toggle]',s).textContent='合起来';$$('[data-fold-k]',s).forEach(b=>setPressed(b,+b.dataset.foldK===k&&+b.dataset.foldN===n))}
$$('[data-fold-k]').forEach(b=>b.onclick=()=>pickFold(b.closest('.slide'),+b.dataset.foldK,+b.dataset.foldN));
$$('[data-fold-toggle]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),f=$('.fold-host',s)._fold;if(s._tested){pickFold(s,f.k,f.n);return}f.target=f.canFold()?1:0;s._tested=true;const o=$('.fold-answer',s);o.hidden=false;o.textContent=f.canFold()?'围成角啦！':f.sum>360.1?'挤到一起了':'平了！';b.textContent='再看一次';cue()});
$$('[data-fold-home]').forEach(b=>b.onclick=()=>{const f=$('.fold-host',b.closest('.slide'))._fold;f.ax=-.62;f.ay=.3;f.draw()});
$$('[data-reveal-five]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),units=$$('.five-unit',s);units[s._fiveIndex++].classList.add('shown');cue();b.textContent='下一位';if(s._fiveIndex===units.length){b.disabled=true;b.textContent='全员到齐！';celebrate(s)}});

$$('[data-zome-step]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=$('.zome-host',s),v=h._z;if(!v)return;const n=v.grow();cue();if(n>=v.maxStage){b.disabled=true;b.textContent='完成！';celebrate(s)}else{b.textContent='下一步'}});
$$('[data-tiling-more]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');const ts=$$('.tiling-host',s);ts.forEach(h=>{h._tiling.more();h.classList.remove('pop');void h.offsetWidth;h.classList.add('pop')});cue();if(ts.every(h=>h._tiling.rings>=3)){b.disabled=true;b.textContent='拼满啦！'}});
$$('[data-tiling-home]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');$$('.tiling-host',s).forEach(h=>h._tiling.setup(+h.dataset.tiling,1));const mb=$('[data-tiling-more]',s);if(mb){mb.disabled=false;mb.textContent='再拼一圈'}cue()});
$$('[data-cmp-face]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');const k=s._faceIndex||0;$$('.zome-host',s).forEach(h=>{const v=h._z;if(v)v.face(k%v.inspect().faces)});s._faceIndex=k+1;$$('.vertex-answer',s).forEach(o=>o.hidden=true);cue()});
$$('[data-cmp-vertex]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),outs=$$('.vertex-answer',s);const k=s._vertexIndex||0;$$('.zome-host',s).forEach((h,i)=>{const v=h._z;if(!v)return;const n=v.vertex(k%v.inspect().balls);outs[i].textContent=n+' 个三角形';outs[i].hidden=false});s._vertexIndex=k+1;cue()});
$$('[data-img-step]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');const list=s.dataset.imgList.split(',');s._imgIdx=Math.min((s._imgIdx||0)+1,list.length-1);const img=$('.step-img',s);img.src='a/vz/'+list[s._imgIdx]+'.png';img.classList.remove('pop');void img.offsetWidth;img.classList.add('pop');const end=$('.step-end',s);if(end)end.hidden=!(s._imgIdx===list.length-1&&s.dataset.endNote);cue();if(s._imgIdx===list.length-1){b.disabled=true;b.textContent='到顶了！'}});
function eulerHost(s,name){const h=$('.zome-host',s);if(h.dataset.zome===name&&h._z)return h._z;zviews=zviews.filter(z=>z.h!==h);if(h._z){h._z.dispose();h._z=null}h.innerHTML='';h.dataset.zome=name;return zomeHost(h)}
function eulerRow(s){return $(`[data-euler-row][data-model="${$('.zome-host',s).dataset.zome}"]`,s)}
$$('[data-euler-pick]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');s._counting=(s._counting||0)+1;eulerHost(s,b.dataset.eulerPick);$$('[data-euler-pick]',s).forEach(x=>setPressed(x,x===b));$$('[data-euler-row]',s).forEach(tr=>tr.classList.toggle('cur',tr.dataset.model===b.dataset.eulerPick));const bd=$('.count-badge',s);bd.hidden=true;$$('[data-euler-count]',s).forEach(x=>setPressed(x,false));cue('select')});
const COUNT_NAME={v:'顶点',e:'棱',f:'面'},COUNT_FN={v:'countBalls',e:'countEdges',f:'countFaces'};
$$('[data-euler-count]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),v=$('.zome-host',s)._z,bd=$('.count-badge',s),k=b.dataset.eulerCount,nm=COUNT_NAME[k];if(!v)return;const run=s._counting=(s._counting||0)+1;bd.hidden=false;bd.textContent=nm+' 0';
  $$('[data-euler-count]',s).forEach(x=>setPressed(x,x===b));
  v[COUNT_FN[k]](n=>{if(s._counting!==run)return;bd.textContent=nm+' '+n;cue('tick')},n=>{if(s._counting===run){bd.textContent=`${nm} ${n} 个`;bd.classList.remove('pop');void bd.offsetWidth;bd.classList.add('pop');cue()}})});
$$('[data-euler-next]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),tr=eulerRow(s);if(!tr||tr.classList.contains('filled'))return;
  $$('.cell',tr).forEach((c,k)=>later(()=>{c.hidden=false;cue()},k*350));tr.classList.add('filled');
  const rows=$$('[data-euler-row]',s);if(rows.every(r=>r.classList.contains('filled'))){later(()=>celebrate(s),1500)}});
$$('[data-zome-scaf]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=$('.zome-host',s);const on=h._scaf=!h._scaf;b.textContent=on?'去掉脚手架':'加脚手架';setPressed(b,on);const st=h._z?h._z.stage():1;zviews=zviews.filter(z=>z.h!==h);if(h._z){h._z.dispose();h._z=null}h.innerHTML='';try{const v=Zome3D.mount(h,h.dataset.zome+(on?'S':''),{fitW:h.clientWidth*.78,fitH:h.clientHeight*.77,stage:st});h._z=v;h._angle=0;zviews.push({h,v});v.home&&v.home()}catch(e){console.warn('scaf remount failed',e)}cue()});
$$('[data-fold-next]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),f=$('.fold-host',s)._fold;const max=f.k===4?4:3;const n=(f.n%max)+1;pickFold(s,f.k,n);cue()});
$$('[data-rules]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');$$('.rule-card',s).forEach(r=>r.hidden=false);b.disabled=true;cue();});
$$('[data-spin-toggle]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),stop=b.getAttribute('aria-pressed')!=='true';$$('.solid-host',s).forEach(h=>{if(h._v){h._v.spin=stop?0:+(h.dataset.spin||.35)}});setPressed(b,stop);b.textContent=stop?'转起来':'停下来';cue()});
$$('[data-feat-face],[data-feat-vertex]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),isF=b.hasAttribute('data-feat-face'),k=isF?(s._ff=(s._ff??-1)+1):(s._fv=(s._fv??-1)+1);
  $$('.solid-host',s).forEach(h=>{const v=h._v;if(!v)return;if(isF)v.face(v.frontFace(k));else v.vertex(v.frontVertex(k))});
  const f=$(isF?'.feat-face':'.feat-vertex',s);f.hidden=false;f.classList.remove('pop');void f.offsetWidth;f.classList.add('pop');$$('.feat',s).forEach(x=>x.classList.toggle('dim',x!==f));setPressed(b,true);$$(isF?'[data-feat-vertex]':'[data-feat-face]',s).forEach(x=>setPressed(x,false));$$('[data-spin-toggle]',s).forEach(x=>{setPressed(x,true);x.textContent='转起来'});cue()});
const HIST_X=[210,560,910,1260],HIST_T0=110;
function histShow(s,n){n=Math.min(4,n);for(let i=s._hist||0;i<n;i++){const k=i;later(()=>{$(`[data-hist="${k}"]`,s).classList.add('on');$(`[data-hist-say="${k}"]`,s).classList.add('on');$(`[data-hist-node="${k}"]`,s).classList.add('on');$('.hist-fill',s).style.width=(HIST_X[k]-HIST_T0)+'px';cue()},(k-(s._hist||0))*450)}
  s._hist=Math.max(s._hist||0,n)}
function histFinal(s){s._histDone=true;$('.hist-fill',s).style.width='100%';platoBurst(s);later(()=>celebrate(s),500);$('[data-hist-next]',s).disabled=true}
function platoBurst(s){cue('fly');s.classList.remove('hist-burst-on');void s.offsetWidth;s.classList.add('hist-burst-on');$$('.hist-solid',s).forEach(h=>{if(h._v){h._v.spin=0.8}});cue('win')}
$$('[data-hist-next]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');if((s._hist||0)>=4){if(!s._histDone)histFinal(s);return}histShow(s,(s._hist||0)+1)});
$$('[data-hist-reset]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');go(current)});
$$('.hist-fig').forEach(f=>f.onclick=()=>{const s=f.closest('.slide'),i=+f.dataset.hist;if(i===2&&s._histDone){platoBurst(s);return}histShow(s,i+1)});
$$('[data-model-switch]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=$('.zome-host',s);if(!h||h.dataset.zome===b.dataset.modelSwitch)return;zviews=zviews.filter(z=>z.h!==h);if(h._z){h._z.dispose();h._z=null}h.innerHTML='';h.dataset.zome=b.dataset.modelSwitch;zomeHost(h);$$('[data-model-switch]',s).forEach(x=>setPressed(x,x===b));cue()});
$$('[data-names]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');$$('.model-name',s).forEach((x,i)=>later(()=>{x.classList.add('shown');cue()},i*260));b.disabled=true});
$$('[data-nature]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');s.classList.add('nat-on');b.disabled=true;cue();celebrate(s)});
$$('[data-tile-more]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');if(b._busy)return;let last=false;
  $$('.zome-host',s).forEach(h=>{const cur=h._z?h._z.stage():+(h.dataset.stage||1);if(cur>=3)return;const next=cur+1;last=next>=3;
    zviews=zviews.filter(z=>z.h!==h);if(h._z){h._z.dispose();h._z=null}h.innerHTML='';h.dataset.stage=next;
    const v=Zome3D.mount(h,h.dataset.zome,{fitW:h.clientWidth*.78,fitH:h.clientHeight*.77,stage:next,from:h.dataset.zome+'@'+cur});h._z=v;zviews.push({h,v});
    v.jumpStage(cur);b._busy=true;v.growIn(()=>{v.zoomTo(next);b._busy=false})});
  cue();if(last){b.disabled=true;b.textContent='拼满啦！'}});
$$('[data-tile-home]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');$$('.zome-host',s).forEach(h=>{zviews=zviews.filter(z=>z.h!==h);if(h._z){h._z.dispose();h._z=null}h.innerHTML='';h.dataset.stage=1;zomeHost(h);h._z?.home()});const mb=$('[data-tile-more]',s);if(mb){mb.disabled=false;mb.textContent='再拼一圈'}cue()});
const ZF_NAME={'3,3':'正四面体','3,4':'正八面体','3,5':'正二十面体','4,3':'立方体','5,3':'正十二面体'},ZF_SHAPE={3:'三角形',4:'正方形',5:'正五边形',6:'正六边形'};
function zfReset(s){s._zfFolded=false;$$('[data-zf-fold]',s).forEach(x=>{x.textContent='聚拢';x.classList.remove('is-on')});$$('.zf-answer',s).forEach(o=>o.hidden=true)}
$$('[data-zf]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=$('.zfold-host',s),f=h&&h._f;if(!f)return;f.set(+b.dataset.k,+b.dataset.n,b.dataset.color,0,b.dataset.foldColor);$$('[data-zf]',s).forEach(x=>setPressed(x,x===b));zfReset(s);cue()});
$$('[data-zf-fold]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),f=$('.zfold-host',s)?._f;if(!f)return;const o=$('.zf-answer',s);
  if(s._zfFolded){f.unfold();zfReset(s);b.classList.remove('is-on');cue();return}
  const r=f.fold();if(r==='folded')cue('fly');else cue('wrong');o.hidden=false;o.classList.toggle('bad',r!=='folded');
  if(r==='folded'){s._zfFolded=true;b.textContent='摊开';b.classList.add('is-on');o.textContent=`鼓起来了！是${ZF_NAME[f.k+','+f.n]}的一个角`;later(()=>celebrate(s),900)}
  else o.textContent=r==='over'?`${f.n} 个${ZF_SHAPE[f.k]}挤不下，叠在一起了`:`${f.n} 个${ZF_SHAPE[f.k]}平平的，鼓不起来`;cue()});
$$('[data-zf-home]').forEach(b=>b.onclick=()=>$('.zfold-host',b.closest('.slide'))?._f?.home());
const EL_PAIR={fire:'tet',earth:'cube',air:'oct',water:'ico',uni:'dod'};
function elSelect(el){const s=el.closest('.slide');if(el.classList.contains('matched')||el.classList.contains('used'))return;
  const isCard=el.classList.contains('el-card'),key=isCard?'_selCard':'_selChip',row=isCard?'.el-card':'.el-chip';
  if(s[key]===el){el.classList.remove('picked');s[key]=null}else{$$(row,s).forEach(x=>x.classList.remove('picked'));el.classList.add('picked');s[key]=el}
  s.classList.toggle('want-chip',!!s._selCard&&!s._selChip);s.classList.toggle('want-card',!!s._selChip&&!s._selCard);cue('select');
  const c=s._selCard,ch=s._selChip;if(!c||!ch)return;
  s._selCard=s._selChip=null;s.classList.remove('want-chip','want-card');
  if(EL_PAIR[c.dataset.el]===ch.dataset.solid){c.classList.remove('picked');ch.classList.remove('picked');c.classList.add('matched');const im=$('img',c);if(im)im.hidden=false;ch.classList.add('used');s._elDone=(s._elDone||0)+1;celebrate(s);
    if(s._elDone===5){const f=$('.el-final',s);if(f)f.hidden=false}}
  else{cue('wrong');[c,ch].forEach(x=>{x.classList.remove('wrong');void x.offsetWidth;x.classList.add('wrong')});later(()=>[c,ch].forEach(x=>x.classList.remove('picked','wrong')),650)}}
$$('[data-el-card],[data-el-pick]').forEach(el=>el.onclick=()=>elSelect(el));

$$('.zoomable').forEach(im=>im.onclick=()=>{const clone=document.createElement('img');clone.src=im.src;clone.alt=im.alt;const x=document.createElement('button');x.className='overlay-close';x.textContent='关闭 ×';$('#lightbox').replaceChildren(clone,x);$('#lightbox').hidden=false;x.focus()});$('#lightbox').onclick=()=>$('#lightbox').hidden=true;
$$('.solid-host,.zome-host').forEach(h=>h.addEventListener('keydown',e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();e.stopPropagation();if(h._v){h._v.targetAngles=null;h._v.ay+=e.key==='ArrowRight'?.18:e.key==='ArrowLeft'?-.18:0;h._v.ax+=e.key==='ArrowDown'?.12:e.key==='ArrowUp'?-.12:0;h._v.draw()}if(h._z){h._angle=(h._angle||0)+(e.key==='ArrowLeft'?-15:15);h._z.setAngle(h._angle)}}));
addEventListener('keydown',e=>{if(e.key==='Escape'){$('#lightbox').hidden=true;toggle('overview','btnGrid',false);toggle('notes','btnNotes',false);return}if(e.target.closest('input,textarea,select,[contenteditable=true]'))return;if(!$('#overview').hidden)return;if(e.target.closest('button,[tabindex]')&&[' ','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const k=e.key.toLowerCase();if(['arrowright','pagedown',' '].includes(k)){e.preventDefault();go(current+1)}else if(['arrowleft','pageup'].includes(k)){e.preventDefault();go(current-1)}else if(k==='home')go(0);else if(k==='end')go(slides.length-1);else if(k==='n')$('#btnNotes').click();else if(k==='g')$('#btnGrid').click();else if(k==='f')$('#btnFull').click();else if(k==='m')$('#btnSound').click()});
function syncTips(root=document){$$('.controls button,.side-pick button',root).forEach(b=>{const t=b.textContent.trim();if(t){b.title=t;b.setAttribute('aria-label',t)}})}
new MutationObserver(ms=>ms.forEach(m=>{const b=m.target.nodeType===1?m.target.closest('button'):m.target.parentElement?.closest('button');if(b&&b.closest('.controls,.side-pick'))syncTips(b.parentElement)})).observe(stage,{subtree:true,childList:true,characterData:true});syncTips();
fit();const n=parseInt(location.hash.replace(/^#p?/,''));go(Number.isFinite(n)&&n>0?n-1:0);requestAnimationFrame(frame);
})();
