(()=>{'use strict';
const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];
const stage=$('#stage'),slides=$$('.slide'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const {View,views}=ClassroomGeometry;
let current=0,zviews=[],sound=false,audio=null,timers=[],bits=[],last=performance.now();
const cv=$('#confetti'),cx=cv.getContext('2d');
function cue(kind='pop'){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const tones=kind==='win'?[523,659,784,1046]:[660];tones.forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.1;o.type='triangle';o.frequency.value=hz;g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.3)})}catch{}}
function later(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id}
function celebrate(sl=slides[current]){cue('win');sl.classList.remove('celebrating');void sl.offsetWidth;sl.classList.add('celebrating');later(()=>sl.classList.remove('celebrating'),1500);if(reduce)return;for(let i=0;i<100;i++)bits.push({x:800+(Math.random()-.5)*650,y:190,vx:(Math.random()-.5)*350,vy:-80-Math.random()*220,a:Math.random()*6,w:7+Math.random()*8,col:['#e8742a','#2f6bd8','#48ad70','#f6d55b','#b17ce1'][i%5]})}
function frame(t){const dt=Math.min(.05,(t-last)/1000);last=t;const s=slides[current];for(const v of views)if(s.contains(v.host))v.tick(dt);cx.clearRect(0,0,1600,900);for(const b of bits){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=480*dt;b.a+=dt*2;cx.save();cx.translate(b.x,b.y);cx.rotate(b.a);cx.fillStyle=b.col;cx.fillRect(-b.w/2,-b.w/4,b.w,b.w/2);cx.restore()}bits=bits.filter(b=>b.y<920);requestAnimationFrame(frame)}
function fit(){const r=$('#viewport').getBoundingClientRect(),k=Math.min(r.width/1600,r.height/900);stage.style.transform=`translate(-50%,-50%) scale(${k})`}
addEventListener('resize',fit);

/* 康威「开普勒的执念」几何：12 根短红棍从中心白球指出，棍头正好是二十面体的 12 个顶点
   （红棍只能插白球的五边形孔，五边形孔方向=二十面体顶点方向）；
   顶点之间用蓝中棍两两相连（边长=蓝中棍 midLen）；
   青色层：八面体 6 个顶点在 ±坐标轴上，距离 D=一半边长×φ²，
   每个二十面体白球正好落在八面体的一条棱上（黄金分割点），
   向棱两端各伸出一根青色棍：短的到"大坐标"轴端，中的到"小坐标"轴端——
   每个二十面体球 1 短 1 中共 2 根，每个新球 2 短 2 中共 4 根，合计 24 根。 */
const vec=p=>new THREE.Vector3(...p),midLen=Math.hypot(...ZOMEPARTS.blue.dir),PHIc=(1+Math.sqrt(5))/2,s11=midLen/2;
const icoV=[[0,1,PHIc],[0,-1,PHIc],[0,1,-PHIc],[0,-1,-PHIc],[1,PHIc,0],[-1,PHIc,0],[1,-PHIc,0],[-1,-PHIc,0],[PHIc,0,1],[PHIc,0,-1],[-PHIc,0,1],[-PHIc,0,-1]].map(p=>p.map(x=>x*s11));
const icoAdj=icoV.map(()=>[]),icoE=[];for(let a=0;a<12;a++)for(let b=a+1;b<12;b++){if(Math.abs(Math.hypot(...icoV[a].map((x,i)=>x-icoV[b][i]))-midLen)<1e-6){icoE.push([a,b]);icoAdj[a].push(b);icoAdj[b].push(a)}}
const icoF=[];for(let a=0;a<12;a++)for(const b of icoAdj[a])for(const c of icoAdj[b])if(a<b&&b<c&&icoAdj[c].includes(a))icoF.push([a,b,c]);
const octFs=[];for(const sx of[1,-1])for(const sy of[1,-1])for(const sz of[1,-1])octFs.push([sx>0?0:1,sy>0?2:3,sz>0?4:5]);
function orient(up,front,yaw){const U=up.clone().normalize(),F=front.clone().addScaledVector(U,-front.dot(U)).normalize(),R=U.clone().cross(F);return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(R,U,F).transpose()).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw))}
const oq=orient(new THREE.Vector3(0,0,1),new THREE.Vector3(-1,1,0),-.12);
const G=(m,n)=>{m.grow=n;return m};
const mkM=(balls,struts,edges,faces,elev)=>({balls,struts,faces:faces||[],edges:edges||[],orient:oq.clone(),center:vec([0,0,0]),elev:elev||32,dashes:[],labels:[]});
const hedgeParts=tips=>{const balls=[[vec([0,0,0]),'white']],struts=icoV.map(p=>[vec([0,0,0]),vec(p),'red']);if(tips)icoV.forEach(p=>balls.push([vec(p),'white']));return{balls,struts}};
const hedgeM=st=>{const tips=st===undefined?true:st>=2;const {balls,struts}=hedgeParts(tips);return G(mkM(balls,struts),2)};
const OCTD=s11*(1+PHIc);
const octAxes=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(a=>a.map(x=>x*OCTD));
const icoCoreM=st=>{const s2=st===undefined?2:st;const {balls,struts}=hedgeParts(true);
  if(s2>=2)icoE.forEach(([a,b])=>struts.push([vec(icoV[a]),vec(icoV[b]),'blue']));
  return G(mkM(balls,struts,s2>=2?icoE:[],s2>=2?icoF:[]),2)};
const axIdx=(a,s)=>a*2+(s>0?0:1);
const octShellM=st=>{const s2=st===undefined?3:st;const {balls,struts}=hedgeParts(true);
  if(s2>=2)icoE.forEach(([a,b])=>struts.push([vec(icoV[a]),vec(icoV[b]),'blue']));
  if(s2>=3){octAxes.forEach(p=>balls.push([vec(p),'white']));
    icoV.forEach(p=>{const nz=p.map((x,i)=>[Math.abs(x),i]).filter(e=>e[0]>1e-6).sort((u,v)=>u[0]-v[0]);
      const a1=nz[0][1],a2=nz[1][1];
      struts.push([vec(p),vec(octAxes[axIdx(a2,Math.sign(p[a2]))]),'cyan']);
      struts.push([vec(p),vec(octAxes[axIdx(a1,Math.sign(p[a1]))]),'cyan'])})}
  return G(mkM(balls,struts,s2>=2?icoE:[],s2>=2?icoF.concat(s2>=3?octFs:[]):[]),3)};
const specs={hedge:hedgeM,icoCore:icoCoreM,octShell:octShellM};Object.assign(Zome3D._M,specs);

function zomeHost(h){try{const v=Zome3D.mount(h,h.dataset.zome,{fitW:h.clientWidth*.78,fitH:h.clientHeight*.77,from:h.dataset.from,stage:+(h.dataset.stage||0)||undefined,zoom:+(h.dataset.zoom||1)});h._z=v;zviews.push({h,v});return v}catch(error){console.error('Zometool model failed',error);const image=document.createElement('img');image.src='a/zome-'+(['tet','ico','oct'].find(n=>h.dataset.zome.startsWith(n))||'oct')+'.png';image.alt='Zometool 完整作品参考图';image.className='zome-fallback';h.append(image);const sl=h.closest('.slide');const b=$('[data-zome-step]',sl);if(b){b.disabled=true;b.textContent='模型未载入'}return null}}
function solidHost(h){if(!h._v)h._v=new View(h);else{h._v.clearHi();h._v.home()}return h._v}
function setPressed(b,active){b.setAttribute('aria-pressed',String(active))}
function enter(s){
 $$('.solid-host',s).forEach(solidHost);$$('.zome-host',s).forEach(zomeHost);
 $$('[data-zome-step]',s).forEach(b=>{b.disabled=false;b.textContent='下一步'});
 $$('.vertex-answer',s).forEach(o=>o.hidden=true);s._vertexIndex=0;s.classList.remove('celebrating');
 $$('.el-card',s).forEach(c=>{c.classList.remove('matched','wrong');const im=$('.el-shape',c);if(im)im.hidden=true});
 $$('.el-chip',s).forEach(ch=>ch.classList.remove('picked','used'));s._elSel=null;s._elDone=0;
 $$('[data-rules]',s).forEach(b=>{b.disabled=false;b.textContent='看一看'});
 $$('.rule-card',s).forEach(r=>r.hidden=true);
 $$('[data-reveal-five]',s).forEach(b=>{b.disabled=false;b.textContent='点一层'});s._fiveIndex=0;
 $$('.five-unit',s).forEach(u=>u.classList.remove('shown'));
 $$('[data-vote]',s).forEach(b=>b.classList.remove('chosen'));
 $$('[data-vote-reveal]',s).forEach(x=>x.hidden=true);
}
function leave(){timers.forEach(clearTimeout);timers=[];for(const {h,v} of zviews){v.dispose();h._z=null}zviews=[];bits=[];cx.clearRect(0,0,1600,900);$$('.zome-fallback',slides[current]).forEach(x=>x.remove())}
function go(i){i=Math.max(0,Math.min(slides.length-1,i));leave();slides.forEach((s,n)=>{s.hidden=n!==i;s.classList.remove('on')});current=i;const s=slides[i];s.classList.add('on');enter(s);$('#prev').disabled=i===0;$('#next').disabled=i===slides.length-1;$('#count').textContent=`${i+1} / ${slides.length}`;$('#progress i').style.width=(i+1)/slides.length*100+'%';$('#notes').replaceChildren();const close=document.createElement('button');close.className='overlay-close';close.textContent='关闭 ×';close.onclick=()=>toggle('notes','btnNotes',false);const title=document.createElement('h3');title.textContent=`${i+1}. ${s.dataset.title}`;$('#notes').append(close,title);$('.notes',s).textContent.split('\n').forEach(line=>{const p=document.createElement('p');p.textContent=line;$('#notes').append(p)});$$('#overview [data-i]').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.i===i)));try{history.replaceState(null,'','#'+(i+1))}catch{} }
window.__go=go;
function toggle(id,bid,value){const e=$('#'+id),on=value??e.hidden;e.hidden=!on;$('#'+bid).setAttribute('aria-pressed',String(on));if(on&&id==='overview')$('#overview [aria-current=true]')?.focus();if(!on)$('#'+bid).focus()}
$('#prev').onclick=()=>go(current-1);$('#next').onclick=()=>go(current+1);$('#btnGrid').onclick=()=>toggle('overview','btnGrid');$('#btnNotes').onclick=()=>toggle('notes','btnNotes');$('#btnSound').onclick=()=>{sound=!sound;$('#btnSound').textContent='声音：'+(sound?'开':'关');setPressed($('#btnSound'),sound);if(sound)cue()};$('#btnFull').onclick=()=>{const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();p?.catch(()=>{})};
let lastSec='',grid;const close=document.createElement('button');close.className='overlay-close';close.textContent='关闭目录 ×';close.onclick=()=>toggle('overview','btnGrid',false);$('#overview').append(close);const title=document.createElement('h3');title.textContent='课程目录';$('#overview').append(title);slides.forEach((s,i)=>{if(s.dataset.sec!==lastSec){lastSec=s.dataset.sec;const h=document.createElement('h4');h.textContent=lastSec;grid=document.createElement('div');grid.className='grid';$('#overview').append(h,grid)}const b=document.createElement('button');b.dataset.i=i;const n=document.createElement('b');n.textContent=i+1;b.append(n,document.createTextNode(s.dataset.title));b.onclick=()=>{go(i);toggle('overview','btnGrid',false)};grid.append(b)});

/* Children act first; teacher-controlled reveals follow. */
$$('[data-celebrate]').forEach(b=>b.onclick=()=>celebrate(b.closest('.slide')));
for(const [key,fn] of [['data-zome-home','home']])$$('['+key+']').forEach(b=>b.onclick=()=>$$('.zome-host',b.closest('.slide')).forEach(h=>h._z?.[fn]()));
$$('[data-zome-step]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=$('.zome-host',s),v=h._z;if(!v)return;const n=v.grow();cue();if(n>=v.maxStage){b.disabled=true;b.textContent='完成！';celebrate(s)}else{b.textContent='下一步'}});
$$('[data-pair-vertices]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),outs=$$('.vertex-answer',s);$$('.zome-host',s).forEach((h,i)=>{const v=h._z;if(!v)return;const n=v.vertex(s._vertexIndex%v.inspect().balls);outs[i].textContent='每个角 '+n+' 个三角形';outs[i].hidden=false});s._vertexIndex++;cue()});
$$('[data-rules]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');$$('.rule-card',s).forEach(r=>r.hidden=false);b.disabled=true;b.textContent='八面体，完成！';cue();});
$$('[data-reveal-five]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),units=$$('.five-unit',s);units[s._fiveIndex++].classList.add('shown');cue();b.textContent='再点一层';if(s._fiveIndex===units.length){b.disabled=true;b.textContent='5 层到齐！';celebrate(s)}});
$$('[data-vote]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');$$('[data-vote]',s).forEach(x=>x.classList.toggle('chosen',x===b));$$('[data-vote-reveal]',s).forEach(x=>x.hidden=false);cue()});

const EL_PAIR={fire:'tet',earth:'cube',air:'oct',water:'ico',uni:'dod'};
$$('[data-el-pick]').forEach(ch=>ch.onclick=()=>{const s=ch.closest('.slide');if(ch.classList.contains('used'))return;s._elSel=ch;$$('.el-chip',s).forEach(x=>x.classList.toggle('picked',x===ch));cue()});
$$('[data-el-card]').forEach(c=>c.onclick=()=>{const s=c.closest('.slide');if(c.classList.contains('matched'))return;const sel=s._elSel;
  if(!sel)return;
  if(EL_PAIR[c.dataset.el]===sel.dataset.solid){c.classList.add('matched');const im=$('.el-shape',c);if(im)im.hidden=false;sel.classList.add('used');sel.classList.remove('picked');s._elSel=null;s._elDone=(s._elDone||0)+1;cue();celebrate(s);
    if(s._elDone===5){const f=$('.el-final',s);if(f)f.hidden=false}}
  else{c.classList.remove('wrong');void c.offsetWidth;c.classList.add('wrong');cue()}});

$$('.zoomable').forEach(im=>im.onclick=()=>{const clone=document.createElement('img');clone.src=im.src;clone.alt=im.alt;const x=document.createElement('button');x.className='overlay-close';x.textContent='关闭 ×';$('#lightbox').replaceChildren(clone,x);$('#lightbox').hidden=false;x.focus()});$('#lightbox').onclick=()=>$('#lightbox').hidden=true;
$$('.solid-host,.zome-host').forEach(h=>h.addEventListener('keydown',e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();e.stopPropagation();if(h._v){h._v.targetAngles=null;h._v.ay+=e.key==='ArrowRight'?.18:e.key==='ArrowLeft'?-.18:0;h._v.ax+=e.key==='ArrowDown'?.12:e.key==='ArrowUp'?-.12:0;h._v.draw()}if(h._z){h._angle=(h._angle||0)+(e.key==='ArrowLeft'?-15:15);h._z.setAngle(h._angle)}}));
addEventListener('keydown',e=>{if(e.key==='Escape'){$('#lightbox').hidden=true;toggle('overview','btnGrid',false);toggle('notes','btnNotes',false);return}if(e.target.closest('input,textarea,select,[contenteditable=true]'))return;if(!$('#overview').hidden)return;if(e.target.closest('button,[tabindex]')&&[' ','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const k=e.key.toLowerCase();if(['arrowright','pagedown',' '].includes(k)){e.preventDefault();go(current+1)}else if(['arrowleft','pageup'].includes(k)){e.preventDefault();go(current-1)}else if(k==='home')go(0);else if(k==='end')go(slides.length-1);else if(k==='n')$('#btnNotes').click();else if(k==='g')$('#btnGrid').click();else if(k==='f')$('#btnFull').click();else if(k==='m')$('#btnSound').click()});
fit();const n=parseInt(location.hash.replace(/^#p?/,''));go(Number.isFinite(n)&&n>0?n-1:0);requestAnimationFrame(frame);
})();
