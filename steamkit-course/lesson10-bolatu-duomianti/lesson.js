(()=>{'use strict';
const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];
const stage=$('#stage'),slides=$$('.slide'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const {View,Fold,Tiling,geo,views}=ClassroomGeometry;
let current=0,zviews=[],sound=false,audio=null,timers=[],bits=[],last=performance.now();
const cv=$('#confetti'),cx=cv.getContext('2d');
function cue(kind='pop'){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const tones=kind==='win'?[523,659,784,1046]:[660];tones.forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.1;o.type='triangle';o.frequency.value=hz;g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.3)})}catch{}}
function later(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id}
function celebrate(sl=slides[current]){cue('win');sl.classList.remove('celebrating');void sl.offsetWidth;sl.classList.add('celebrating');later(()=>sl.classList.remove('celebrating'),1500);if(reduce)return;for(let i=0;i<100;i++)bits.push({x:800+(Math.random()-.5)*650,y:190,vx:(Math.random()-.5)*350,vy:-80-Math.random()*220,a:Math.random()*6,w:7+Math.random()*8,col:['#e8742a','#2f6bd8','#48ad70','#f6d55b','#b17ce1'][i%5]})}
function frame(t){const dt=Math.min(.05,(t-last)/1000);last=t;const s=slides[current];for(const v of views)if(s.contains(v.host))v.tick(dt);cx.clearRect(0,0,1600,900);for(const b of bits){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=480*dt;b.a+=dt*2;cx.save();cx.translate(b.x,b.y);cx.rotate(b.a);cx.fillStyle=b.col;cx.fillRect(-b.w/2,-b.w/4,b.w,b.w/2);cx.restore()}bits=bits.filter(b=>b.y<920);requestAnimationFrame(frame)}
function fit(){const r=$('#viewport').getBoundingClientRect(),k=Math.min(r.width/1600,r.height/900);stage.style.transform=`translate(-50%,-50%) scale(${k})`}
addEventListener('resize',fit);

/* Exact equal-edge green-rod lattices, with the same ball orientation as the reference lessons. */
const vec=p=>new THREE.Vector3(...p),K=Math.hypot(...ZOMEPARTS.green.dir)/Math.SQRT2;
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
 icoGS:s=>withScaf(icoGm(s),[0,0,0],'red',iP)
};Object.assign(Zome3D._M,specs);
window.lessonModels=()=>Object.fromEntries(Object.entries(specs).map(([name,fn])=>{const m=fn();return[name,{positions:m.balls.map(b=>b[0].toArray()),edges:m.edges,faces:m.faces}]}));
function zomeHost(h){try{const v=Zome3D.mount(h,h.dataset.zome,{fitW:h.clientWidth*.78,fitH:h.clientHeight*.77,from:h.dataset.from,stage:+(h.dataset.stage||0)||undefined,zoom:+(h.dataset.zoom||1)});h._z=v;zviews.push({h,v});return v}catch(error){console.error('Zometool model failed',error);const image=document.createElement('img');image.src='a/zome-'+(['tet','ico','oct'].find(n=>h.dataset.zome.startsWith(n))||'oct')+'.png';image.alt='Zometool 完整作品参考图';image.className='zome-fallback';h.append(image);const sl=h.closest('.slide');const b=$('[data-connect]',sl);if(b){b.disabled=true;b.textContent='模型未载入'}return null}}
function solidHost(h){if(!h._v)h._v=new View(h);else{h._v.clearHi();h._v.home()}return h._v}
function setPressed(b,active){b.setAttribute('aria-pressed',String(active))}
function enter(s){
 $$('.solid-host',s).forEach(solidHost);$$('.zome-host',s).forEach(zomeHost);
 $$('[data-character]',s).forEach(b=>{$('span',b).hidden=true;b.classList.remove('revealed');setPressed(b,false)});
 $$('[data-connect]',s).forEach(b=>{b.disabled=false;b.textContent='接上去'});
 $$('[data-count-solid]',s).forEach(b=>{b._index=0;b.textContent='一个面'});$$('[data-face-output]',s).forEach(o=>o.textContent='');
 $$('.vertex-answer',s).forEach(o=>o.hidden=true);s._vertexIndex=0;s._faceIndex=0;s.classList.remove('grouped','celebrating');
 $$('.five-unit',s).forEach(u=>u.classList.remove('shown'));const fiveBtn=$('[data-reveal-five]',s);if(fiveBtn){fiveBtn.disabled=false;fiveBtn.textContent='伙伴集合！';s._fiveIndex=0}
 $$('.el-card',s).forEach(c=>{c.classList.remove('matched','wrong');const im=$('img',c);if(im)im.hidden=true});
 $$('.el-chip',s).forEach(ch=>ch.classList.remove('picked','used'));s._elSel=null;s._elDone=0;
 const elHint=$('.el-hint',s);if(elHint)elHint.textContent='';const elFinal=$('.el-final',s);if(elFinal)elFinal.hidden=true;const elClue=$('.el-clue',s);if(elClue)elClue.hidden=false;
 $$('.rule-card',s).forEach(r=>r.hidden=true);s._ruleIdx=0;const ruleBtn=$('[data-rules]',s);if(ruleBtn){ruleBtn.disabled=false;ruleBtn.textContent='揭晓猜想'}
 $$('[data-zome-step]',s).forEach(b=>{b.disabled=false;b.textContent='下一步'});
 const cmpBtn=$('[data-compare-step]',s);if(cmpBtn){cmpBtn.disabled=false;cmpBtn.textContent='看它们的面'}s._cmp=0;s._faceIndex=0;s._vertexIndex=0;$$('.vertex-answer',s).forEach(o=>o.hidden=true);
 $$('[data-img-step]',s).forEach(b=>{b.disabled=false;b.textContent='再加一个'});s._imgIdx=0;const si=$('.step-img',s);if(si&&s.dataset.imgList)si.src='a/vz/'+s.dataset.imgList.split(',')[0]+'.png';const se=$('.step-end',s);if(se)se.hidden=true;
 s._eu=0;$$('[data-euler-row]',s).forEach(tr=>{tr.classList.remove('filled');$$('.cell',tr).forEach(c=>c.hidden=true)});const euBtn=$('[data-euler-next]',s);if(euBtn){euBtn.disabled=false;euBtn.textContent='数下一个'}$$('.euler-final',s).forEach(x=>x.hidden=true);
 $$('.mini-fold',s).forEach(h=>{if(!h._fold)h._fold=new Fold(h);h._fold.setup(+h.dataset.k,+h.dataset.n);h._fold.t=h._fold.target=1;h._fold.draw()});
 $$('.tiling-host',s).forEach(h=>{if(!h._tiling)h._tiling=new Tiling(h);h._tiling.setup(+h.dataset.tiling,1)});const tBtn=$('[data-tiling-more]',s);if(tBtn){tBtn.disabled=false;tBtn.textContent='再拼一圈'}
 if(s.dataset.foldDefault){const host=$('.fold-host',s);if(!host._fold)host._fold=new Fold(host);const [k,n]=s.dataset.foldDefault.split(',').map(Number);pickFold(s,k,n)}
}
function leave(){timers.forEach(clearTimeout);timers=[];for(const {h,v} of zviews){v.dispose();h._z=null}zviews=[];bits=[];cx.clearRect(0,0,1600,900);$$('.zome-fallback',slides[current]).forEach(x=>x.remove())}
function go(i){i=Math.max(0,Math.min(slides.length-1,i));leave();slides.forEach((s,n)=>{s.hidden=n!==i;s.classList.remove('on')});current=i;const s=slides[i];s.classList.add('on');enter(s);$('#prev').disabled=i===0;$('#next').disabled=i===slides.length-1;$('#count').textContent=`${i+1} / ${slides.length}`;$('#progress i').style.width=(i+1)/slides.length*100+'%';$('#notes').replaceChildren();const close=document.createElement('button');close.className='overlay-close';close.textContent='关闭 ×';close.onclick=()=>toggle('notes','btnNotes',false);const title=document.createElement('h3');title.textContent=`${i+1}. ${s.dataset.title}`;$('#notes').append(close,title);$('.notes',s).textContent.split('\n').forEach(line=>{const p=document.createElement('p');p.textContent=line;$('#notes').append(p)});$$('#overview [data-i]').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.i===i)));try{history.replaceState(null,'','#'+(i+1))}catch{} }
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
 uni:`<svg viewBox="0 0 268 300" preserveAspectRatio="xMidYMid slice"><rect width="268" height="300" fill="#232F52"/>
  <circle cx="36" cy="40" r="2.5" fill="#FFF" opacity=".9"/><circle cx="120" cy="24" r="2" fill="#FFF" opacity=".8"/><circle cx="228" cy="36" r="3" fill="#FFE08A"/><circle cx="246" cy="120" r="2" fill="#FFF" opacity=".7"/><circle cx="22" cy="130" r="2.5" fill="#FFF" opacity=".8"/><circle cx="70" cy="200" r="2" fill="#FFF" opacity=".6"/><circle cx="210" cy="240" r="2.5" fill="#FFF" opacity=".8"/>
  <path d="M60,70 L64,80 L74,84 L64,88 L60,98 L56,88 L46,84 L56,80 Z" fill="#FFE08A"/><path d="M208,180 L212,190 L222,194 L212,198 L208,208 L204,198 L194,194 L204,190 Z" fill="#FFE08A"/><path d="M100,150 L103,158 L111,161 L103,164 L100,172 L97,164 L89,161 L97,158 Z" fill="#FFF" opacity=".9"/>
  <path d="M186 60 a26 26 0 1 0 20 44 a20 20 0 1 1 -20 -44 Z" fill="#FFE08A"/>
  <ellipse cx="196" cy="238" rx="40" ry="13" fill="none" stroke="#F2B200" stroke-width="5" transform="rotate(-16 196 238)"/>
  <circle cx="196" cy="234" r="20" fill="#B17CE1"/><circle cx="190" cy="228" r="6" fill="#CBA8EC" opacity=".9"/>
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
$$('[data-compare-step]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');const hosts=$$('.zome-host',s);const outs=$$('.vertex-answer',s);s._cmp=((s._cmp||0)+1)%2;
  if(s._cmp===1){hosts.forEach(h=>{const v=h._z;if(v)v.face((s._faceIndex||0)%v.inspect().faces)});s._faceIndex=(s._faceIndex||0)+1;b.textContent='数一数顶点';outs.forEach(o=>o.hidden=true)}
  else{hosts.forEach((h,i)=>{const v=h._z;if(v){const n=v.vertex((s._vertexIndex||0)%v.inspect().balls);outs[i].textContent=n+' 个三角形';outs[i].hidden=false}});s._vertexIndex=(s._vertexIndex||0)+1;b.textContent='再看一次面'}cue()});
$$('[data-img-step]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');const list=s.dataset.imgList.split(',');s._imgIdx=Math.min((s._imgIdx||0)+1,list.length-1);const img=$('.step-img',s);img.src='a/vz/'+list[s._imgIdx]+'.png';img.classList.remove('pop');void img.offsetWidth;img.classList.add('pop');const end=$('.step-end',s);if(end)end.hidden=!(s._imgIdx===list.length-1&&s.dataset.endNote);cue();if(s._imgIdx===list.length-1){b.disabled=true;b.textContent='到顶了！'}});
$$('[data-euler-next]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');const rows=[['tet',4,6,4],['cube',8,12,6],['oct',6,12,8],['dod',20,30,12],['ico',12,30,20]];const i=s._eu||0;const tr=$(`[data-euler-row="${i}"]`,s);$$('.cell',tr).forEach(c=>c.hidden=false);tr.classList.add('filled');const v=$('.solid-host',s)._v;if(v)v.set(rows[i][0]);cue();s._eu=i+1;
  if(s._eu>=5){$$('.euler-final',s).forEach(x=>x.hidden=false);b.disabled=true;b.textContent='全都是 2！';celebrate(s)}else{b.textContent='再数一个'}});
$$('[data-zome-scaf]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=$('.zome-host',s);const on=h._scaf=!h._scaf;b.textContent=on?'去掉脚手架':'加脚手架';const st=h._z?h._z.stage():1;zviews=zviews.filter(z=>z.h!==h);if(h._z){h._z.dispose();h._z=null}h.innerHTML='';try{const v=Zome3D.mount(h,h.dataset.zome+(on?'S':''),{fitW:h.clientWidth*.78,fitH:h.clientHeight*.77,stage:st});h._z=v;h._angle=0;zviews.push({h,v});v.home&&v.home()}catch(e){console.warn('scaf remount failed',e)}cue()});
$$('[data-fold-next]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),f=$('.fold-host',s)._fold;const max=f.k===4?4:3;const n=(f.n%max)+1;pickFold(s,f.k,n);cue()});
$$('[data-rules]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');$$('.rule-card',s).forEach(r=>r.hidden=false);b.disabled=true;b.textContent='就是它们！';cue();});
$$('[data-el-pick]').forEach(ch=>ch.onclick=()=>{const s=ch.closest('.slide');if(ch.classList.contains('used'))return;s._elSel=ch;$$('.el-chip',s).forEach(x=>x.classList.toggle('picked',x===ch));cue()});
const EL_PAIR={fire:'tet',earth:'cube',air:'oct',water:'ico',uni:'dod'};
$$('[data-el-card]').forEach(c=>c.onclick=()=>{const s=c.closest('.slide');if(c.classList.contains('matched'))return;const sel=s._elSel;
  if(!sel)return;
  if(EL_PAIR[c.dataset.el]===sel.dataset.solid){c.classList.add('matched');const im=$('img',c);if(im)im.hidden=false;sel.classList.add('used');sel.classList.remove('picked');s._elSel=null;s._elDone=(s._elDone||0)+1;cue();celebrate(s);
    if(s._elDone===5){const f=$('.el-final',s);if(f)f.hidden=false}}
  else{c.classList.remove('wrong');void c.offsetWidth;c.classList.add('wrong');cue()}});

$$('.zoomable').forEach(im=>im.onclick=()=>{const clone=document.createElement('img');clone.src=im.src;clone.alt=im.alt;const x=document.createElement('button');x.className='overlay-close';x.textContent='关闭 ×';$('#lightbox').replaceChildren(clone,x);$('#lightbox').hidden=false;x.focus()});$('#lightbox').onclick=()=>$('#lightbox').hidden=true;
$$('.solid-host,.zome-host').forEach(h=>h.addEventListener('keydown',e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();e.stopPropagation();if(h._v){h._v.targetAngles=null;h._v.ay+=e.key==='ArrowRight'?.18:e.key==='ArrowLeft'?-.18:0;h._v.ax+=e.key==='ArrowDown'?.12:e.key==='ArrowUp'?-.12:0;h._v.draw()}if(h._z){h._angle=(h._angle||0)+(e.key==='ArrowLeft'?-15:15);h._z.setAngle(h._angle)}}));
addEventListener('keydown',e=>{if(e.key==='Escape'){$('#lightbox').hidden=true;toggle('overview','btnGrid',false);toggle('notes','btnNotes',false);return}if(e.target.closest('input,textarea,select,[contenteditable=true]'))return;if(!$('#overview').hidden)return;if(e.target.closest('button,[tabindex]')&&[' ','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const k=e.key.toLowerCase();if(['arrowright','pagedown',' '].includes(k)){e.preventDefault();go(current+1)}else if(['arrowleft','pageup'].includes(k)){e.preventDefault();go(current-1)}else if(k==='home')go(0);else if(k==='end')go(slides.length-1);else if(k==='n')$('#btnNotes').click();else if(k==='g')$('#btnGrid').click();else if(k==='f')$('#btnFull').click();else if(k==='m')$('#btnSound').click()});
fit();const n=parseInt(location.hash.replace(/^#p?/,''));go(Number.isFinite(n)&&n>0?n-1:0);requestAnimationFrame(frame);
})();
