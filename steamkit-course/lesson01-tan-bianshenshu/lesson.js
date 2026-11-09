(()=>{'use strict';
const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];
const stage=$('#stage'),slides=$$('.slide'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const CV=window.CarbonView,C=window.CARBON;
let current=0,views=[],sound=true,audio=null,timers=[],bits=[],last=performance.now();
const cv=$('#confetti'),cx=cv.getContext('2d');

/* ---------- sound: CC0 samples (Freesound), WebAudio synth fallback ---------- */
const SMP={};["page","select","correct","wrong","fly","tick"].forEach(k=>{try{const e=new Audio("a/sfx/"+k+".mp3");e.preload="auto";SMP[k]=e}catch(x){}});
function sfxPlay(k,vol=.8){const e=SMP[k];if(!e||e.error)return false;try{const c=e.cloneNode();c.volume=vol;const p=c.play();p&&p.catch&&p.catch(()=>{});return true}catch(x){return false}}
const CMAP={pop:'select',select:'select',page:'page',tick:'tick',wrong:'wrong',fly:'fly',correct:'correct'},CVOL={page:.55,tick:.6,pop:.75,select:.75};
function cue(kind='pop'){if(!sound)return;if(kind!=='win'&&kind!=='soft'&&sfxPlay(CMAP[kind]||'select',CVOL[kind]||.85))return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const t0=audio.currentTime;
 const tone=(hz,at,dur,type='triangle',vol=.06,to=null)=>{const o=audio.createOscillator(),g=audio.createGain(),t=t0+at;o.type=type;o.frequency.setValueAtTime(hz,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+dur+.05)};
 if(kind==='win')[523,659,784,1046].forEach((hz,i)=>tone(hz,i*.09,.22));
 else if(kind==='soft')tone(740,0,.1,'sine',.03,900);
 else if(kind==='tick')tone(1320,0,.08,'sine',.05);
 else if(kind==='wrong'){tone(330,0,.18,'square',.03,220);tone(247,.14,.22,'square',.03,165)}
 else if(kind==='fly')tone(400,0,.45,'sine',.05,1400);
 else tone(880,0,.12,'sine',.05,1100)}catch{}}
function later(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id}
function celebrate(sl=slides[current]){cue('win');sl.classList.remove('celebrating');void sl.offsetWidth;sl.classList.add('celebrating');later(()=>sl.classList.remove('celebrating'),1500);if(reduce)return;
 for(let i=0;i<110;i++)bits.push({x:800+(Math.random()-.5)*700,y:170,vx:(Math.random()-.5)*380,vy:-90-Math.random()*240,a:Math.random()*6,w:7+Math.random()*8,col:['#e8742a','#2f6bd8','#3a9a5b','#ffc60a','#fbf6ec'][i%5]})}
function frame(t){const dt=Math.min(.05,(t-last)/1000);last=t;cx.clearRect(0,0,1600,900);for(const b of bits){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=480*dt;b.a+=dt*2;cx.save();cx.translate(b.x,b.y);cx.rotate(b.a);cx.fillStyle=b.col;cx.fillRect(-b.w/2,-b.w/4,b.w,b.w/2);cx.restore()}bits=bits.filter(b=>b.y<920);requestAnimationFrame(frame)}requestAnimationFrame(frame);
function fit(){const r=$('#viewport').getBoundingClientRect(),k=Math.min(r.width/1600,r.height/900);stage.style.transform=`translate(-50%,-50%) scale(${k})`}addEventListener('resize',fit);fit();
function pop(el){el.hidden=false;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}

/* ---------- models ---------- */
const N=C.hexNormal,NEG=N.map(x=>-x),LIFT=C.layers.lift;
const sub=(m,nb,ns)=>({b:m.b.slice(0,nb),s:m.s.slice(0,ns)});
const add=(p,q,k=1)=>p.map((x,i)=>x+k*q[i]);
const L0=C.layers.layer;
const SUP={nb:true,b:[],s:[]};C.layers.supports.forEach(i=>{const p=L0.b[i];SUP.b.push(p,add(p,LIFT));SUP.s.push([SUP.b.length-2,SUP.b.length-1,'yellow'])});
const D2=C.diamond[2],UNIT=C.unit[4];
const SPEC={
 hand3:{up:N,elev:38,yaw:12,fit:.78,frame:C.hand3,steps:[sub(C.hand3,1,0),sub(C.hand3,2,1),sub(C.hand3,3,2),C.hand3,C.hand3]},
 ring:{up:N,elev:48,yaw:12,fit:.78,frame:C.ring[4],steps:C.ring},
 hex:{up:N,elev:62,yaw:12,fit:.86,steps:[C.hex]},
 pent:{up:C.pentNormal,elev:62,yaw:0,fit:.86,steps:[C.pent]},
 net:{up:N,elev:50,yaw:12,fit:.85,frame:C.net[4],steps:C.net},
 layers:{up:N,elev:20,yaw:12,fit:.8,frame:{b:L0.b.concat(L0.b.map(p=>add(p,LIFT)))}},
 layers2:{up:N,elev:20,yaw:12,fit:.78,frame:{b:L0.b.concat(L0.b.map(p=>add(p,LIFT)))}},
 unit:{up:NEG,elev:16,yaw:20,fit:.72,frame:UNIT,steps:C.unit},
 diamond:{up:NEG,elev:16,yaw:20,fit:.82,frame:D2,steps:C.diamond},
};
function mountZome(h){
 const name=h.dataset.model,sp=SPEC[name],st=+(h.dataset.step||0);
 let groups;
 if(name==='layers')groups=[{model:L0},{model:L0,offset:LIFT},{model:SUP}];
 else if(name==='layers2')groups=[{model:L0},{model:L0,offset:LIFT}];
 else groups=[{model:sp.steps[Math.min(st,sp.steps.length-1)]}];
 const frame=h.dataset.step!==undefined&&name==='diamond'?sp.steps[st]:sp.frame;
 const v=CV.mount(h,{groups,up:sp.up,elev:sp.elev,yaw:sp.yaw,fit:sp.fit*(h.classList.contains('mini')?1.1:1),frame,center:centroid(sp.frame||groups[0].model)});
 if(name==='layers'){v.showGroup(1,false);v.showGroup(2,false)}
 h._v=v;h._step=st;views.push(v);
 if(!reduce&&h.dataset.still===undefined)v.intro(name==='layers'||name==='layers2'?'drop':name==='unit'?'swing':name.startsWith('diam')?'zoom':name==='net'||name==='ring'?'rise':'spin');
 return v}
function centroid(m){const c=[0,0,0];m.b.forEach(p=>{c[0]+=p[0];c[1]+=p[1];c[2]+=p[2]});return c.map(x=>x/m.b.length)}
const host=s=>$('.zome-host',s);
function stepTo(s,h,k,captions){const sp=SPEC[h.dataset.model];h._step=k;h._v.setModel(sp.steps[Math.min(k,sp.steps.length-1)],true);const cap=$('.step-cap',s);if(cap&&captions){cap.textContent=captions[k]||'';pop(cap)}}

/* ---------- page interactions ---------- */
// p2 / p15 tallies
$$('[data-tally]').forEach(c=>c.onclick=()=>{const n=$('.tally-n',c);c._n=(c._n||0)+1;n.textContent=c._n;c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump');cue('select')});
$$('[data-tally-reset]').forEach(b=>b.onclick=()=>{$$('[data-tally]',b.closest('.slide')).forEach(c=>{c._n=0;$('.tally-n',c).textContent=''});cue('tick')});
// p3 draw
$$('[data-draw]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),p=$('.paper',s),sv=$('.scribble',s);p.classList.remove('drawing');sv.classList.remove('drawing');void p.offsetWidth;p.classList.add('drawing');sv.classList.add('drawing');cue('tick')});
// p3 continuous zoom: 笔迹 → 石墨 → 碳原子
(function(){const svg=$('.flakes-big');if(!svg)return;let h='';let seed=7;const R=()=>(seed=(seed*9301+49297)%233280)/233280;
 for(let i=0;i<46;i++){const x=R()*1500-120,y=R()*640-10,w=180+R()*260,a=(R()-.5)*22,n=3+Math.floor(R()*4);let g='';for(let j=0;j<n;j++){const c=78+Math.round(R()*40),dx=(R()-.5)*30,hh=12+R()*8;g+=`<path d="M${dx} ${j*15} l${w*.08} -${hh*.6} l${w*.9} 0 l${w*.06} ${hh*.6} l-${w*.1} ${hh*.5} l-${w*.86} 0z" fill="rgb(${c},${c+4},${c+12})" stroke="#2a2e35" stroke-width="2.5"/><path d="M${dx+w*.1} ${j*15-hh*.45} l${w*.85} 0" stroke="#ffffff60" stroke-width="3"/>`}h+=`<g transform="translate(${x} ${y}) rotate(${a})">${g}</g>`}
 svg.innerHTML=h;
 const f=$('.atom-field');let k='';seed=3;for(let i=0;i<22;i++){const x=R()*1240,y=R()*520,sz=130+R()*70,r=(R()-.5)*40;k+=`<img src="a/atom.webp" alt="" style="left:${x-20}px;top:${y-20}px;width:${sz}px;--r:${r}deg;animation-delay:${-R()*3}s">`}f.innerHTML=k})();
const ZF=[[640,382],[690,330]];  // zoom focus points (inside the stroke, inside a flake)
function zoomReset(s){const L=$$('.zl',s);L.forEach((l,i)=>{l.style.transition='none';l.style.transform='none';l.style.clipPath=i?'circle(0px at 50% 50%)':'none';l.style.zIndex=i;l.classList.remove('tagged')});s._z=0}
$$('[data-zoom]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),L=$$('.zl',s),k=s._z||0;if(k>=2)return;s._z=k+1;const cur=L[k],nxt=L[k+1],[fx,fy]=ZF[k];
 nxt.style.transition='none';nxt.style.transform='none';nxt.style.clipPath=`circle(70px at ${fx}px ${fy}px)`;
 cur.style.transformOrigin=`${fx}px ${fy}px`;cur.style.transition='transform 1.9s cubic-bezier(.5,0,.3,1)';
 const ring=$('.zoom-ring',s);ring.style.left=fx+'px';ring.style.top=fy+'px';ring.classList.remove('go');void ring.offsetWidth;ring.classList.add('go');
 void nxt.offsetWidth;nxt.style.transition='clip-path 1.9s cubic-bezier(.7,0,.35,1)';
 requestAnimationFrame(()=>{cur.style.transform='scale(4)';nxt.style.clipPath=`circle(1600px at ${fx}px ${fy}px)`});cue('fly');
 later(()=>{nxt.classList.add('tagged');cue('correct');if(k===1){b.disabled=true;later(()=>celebrate(s),300)}},1900)});
// p5 hands
$$('[data-hands]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),bs=$$('.hand-badge',s),k=s._h=(s._h||0)+1;if(k>4)return;bs[k-1].classList.add('show');$('.big-count',s).textContent=k;cue(k===4?'correct':'tick');if(k===4){b.disabled=true;later(()=>celebrate(s),400)}});
$$('[data-hands-reset]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide');s._h=0;$$('.hand-badge',s).forEach(x=>x.classList.remove('show'));$('.big-count',s).textContent='';$('[data-hands]',s).disabled=false;cue('tick')});
// Q 版碳的手
function mountArms(h){const p15=h.dataset.start==='cross';const v=ArmView.mount(h,{body:'a/atom_body.webp',start:h.dataset.start,size:p15?330:330,dy:p15?10:40,reach:p15?.92:.85,colors:p15?['#ff8a2a','#f4f5f8','#f4f5f8','#f4f5f8']:[],spin:p15?.28:0,elev:p15?22:0,yaw0:p15?.35:0});h._b=v;views.push(v);return v}
$$('[data-arm-spread]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=$('.arm-host',s);h._b.set('two');b.disabled=true;pop($('[data-cap="1"]',s));cue('fly');$('[data-arm-add]',s).classList.add('nudge')});
$$('[data-arm-add]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=$('.arm-host',s);if(!$('[data-arm-spread]',s).disabled){h._b.set('two');$('[data-arm-spread]',s).disabled=true}b.classList.remove('nudge');h._b.set('three0');cue('select');later(()=>{h._b.set('three');cue('fly')},700);b.disabled=true;$('[data-cap="1"]',s).hidden=true;later(()=>{pop($('[data-cap="2"]',s));celebrate(s)},1700)});
$$('[data-release]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=$('.arm-host',s);h._b.set('tet');b.disabled=true;cue('fly');later(()=>{$('[data-guess="tet"]',s).classList.add('right');celebrate(s)},1400)});
// p8 three hands
const HAND_CAP=['白球的三角孔朝上','隔一个孔，插一根蓝短棍','再隔一个孔，插第 2 根','3 只手，平平地分开','朝上的孔空着：第 4 只手'];
$$('[data-hand-next]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=host(s),k=h._step+1;if(k>4)return;if(k<=3){stepTo(s,h,k,HAND_CAP);cue('fly')}else{h._step=4;h._v.setMarker(C.hand3.b[0],N,true);const cap=$('.step-cap',s);cap.textContent=HAND_CAP[4];pop(cap);cue('correct');later(()=>celebrate(s),500);b.disabled=true}});
// p9 ring
$$('[data-ring-next]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=host(s),k=h._step+1;if(k>4)return;h._step=k;cue('fly');
 h._v.setModel(C.ring[k],true,()=>{if(k<4)return;b.disabled=true;const R=C.ring[4].b,ring=[0,1,4,5,6,3].map(i=>R[i]);let n=0;const out=$('.big-count',s);
  const step=()=>{n++;h._v.highlight(0,ring.slice(0,n),[]);out.textContent=n;cue('tick');if(n<6)later(step,420);else{const sp=[];for(let i=0;i<6;i++)sp.push([ring[i],ring[(i+1)%6]]);h._v.highlight(0,ring,sp);pop($('.done-cap',s));later(()=>celebrate(s),250)}};later(step,350)})});
// p9 arcs around the hexagon
$$('[data-arcs]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),v=host(s)._v,P=C.hex.b;b.disabled=true;let n=0;const out=$('.big-count',s);
 const step=()=>{const i=n;v.addArc(P[i],P[(i+5)%6],P[(i+1)%6]);n++;out.textContent=n;cue('tick');if(n<6)later(step,550);else later(()=>{pop($('.arc-cap',s));celebrate(s)},400)};step()});
// p11 net
$$('[data-net-next]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=host(s),k=h._step+1;if(k>4)return;h._step=k;h._v.setModel(C.net[k],true);cue('fly');if(k===4){b.disabled=true;$('[data-net-name]',s).classList.add('nudge')}});
$$('[data-net-name]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=host(s);if(h._step<4){h._step=4;h._v.setModel(C.net[4],true);$('[data-net-next]',s).disabled=true}b.classList.remove('nudge');pop($('.name-tag',s));cue('correct');later(()=>celebrate(s),300)});
// p12 layers
const SLIDE_DIR=C.hand3.b[1].map((x,i)=>x-C.hand3.b[0][i]);
$$('[data-layer-next]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),v=host(s)._v;b.disabled=true;cue('fly');v.dropIn(1,LIFT.map(x=>x*3.2),()=>{v.showGroup(2,true);cue('select')});s._layer=1;$('[data-layer-push]',s).classList.add('nudge')});
$$('[data-layer-push]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),v=host(s)._v;if(!s._layer){$('[data-layer-next]',s).click();return}b.classList.remove('nudge');v.showGroup(2,false);v.slideGroup(1,SLIDE_DIR,6.5,2600);pop($('.slide-cap',s));cue('fly');setPressed(b,true)});
$$('[data-layer-why]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),p=$('.side-view',s);p.hidden=false;p.classList.remove('show');void p.offsetWidth;p.classList.add('show');cue('correct')});
$$('.side-view .row').forEach(r=>r.innerHTML='<img src="a/atom.webp" alt="">'.repeat(3));
// p13 choice
$$('[data-choice]').forEach(c=>c.onclick=()=>{const s=c.closest('.slide');if(s._done)return;const ok=c.dataset.choice==='yes';c.classList.remove('wrong','right');void c.offsetWidth;c.classList.add(ok?'right':'wrong');cue(ok?'correct':'wrong');if(ok){s._done=1;$$('.choice',s).forEach(x=>{if(x!==c)x.classList.add('dim')});later(()=>celebrate(s),300)}else later(()=>c.classList.remove('wrong'),1100)});
// p14 labels
$$('[data-labs]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),L=$$('.later-lab',s),k=s._f||0;if(k>=L.length)return;L[k].classList.add('show');s._f=k+1;cue('select');if(s._f===L.length){b.disabled=true;$('.vs-q',s).classList.add('show')}});
// p16 unit
const UNIT_CAP=['找一个三角孔','插一根黄短棍，再翻过来','围着中间，找 3 个三角孔','再插第 3 根','正中间的孔留空'];
$$('[data-unit-next]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=host(s),k=h._step+1;if(k>4)return;h._v.setMarker(null,null,false);stepTo(s,h,k,UNIT_CAP);cue('fly');
 if(k===4){b.disabled=true;later(()=>{h._v.setMarker(UNIT.b[0],NEG,true);cue('select')},1300);later(()=>{const nb=UNIT.b.slice(1),pairs=[];for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)pairs.push([nb[i],nb[j]]);h._v.setMarker(null,null,false);h._v.setDashes(pairs);const cap=$('.step-cap',s);cap.textContent='4 个邻居，站成一个三角锥';pop(cap);celebrate(s)},3600)}});
// p17 diamond
$$('[data-dia-next]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),h=host(s),k=h._step+1;if(k>2)return;h._step=k;h._v.setModel(C.diamond[k],true);h._v.refit(C.diamond[k],1400);cue('fly');if(k===2){b.disabled=true;later(()=>celebrate(s),1800)}});
// p18 chair
const CHAIR=C.chair.map(i=>D2.b[i]),CHAIR_S=CHAIR.map((p,i)=>[p,CHAIR[(i+1)%6]]);
$$('[data-chair]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),v=host(s)._v;v.highlight(0,CHAIR,CHAIR_S,true);cue('correct');s._chair=1});
$$('[data-chair-side]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),v=host(s)._v;if(!s._chair){v.highlight(0,CHAIR,CHAIR_S,true);s._chair=1}
 const c=centroid({b:CHAIR}),a=CHAIR[0].map((x,i)=>x-CHAIR[3][i]),n=cross(CHAIR[0].map((x,i)=>x-c[i]),CHAIR[2].map((x,i)=>x-c[i])),side=cross(n,a);v.lookFrom(side,1500,.85);later(()=>{pop($('.chair-cap',s));cue('correct')},1500)});
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
// p19 push
$$('[data-push]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),[g,d]=$$('.zome-host',s);g._v.moveGroup(1,add(LIFT,SLIDE_DIR,1.6));d._v.shakeGroup(0,.5,900);cue('fly');$$('.push-res',s).forEach((x,i)=>later(()=>{x.classList.add('show','pop');cue(i?'wrong':'select')},500+i*700));b.disabled=true});
// p20 family
$$('[data-fam-next]').forEach(b=>b.onclick=()=>{const s=b.closest('.slide'),f=$$('.fam',s),k=s._f||0;if(k>=f.length)return;f[k].classList.add('show');s._f=k+1;cue('select');if(s._f===f.length){b.disabled=true;later(()=>celebrate(s),400)}});
// p21 recap
$$('[data-recap]').forEach(c=>c.onclick=()=>{c.classList.add('open');cue('select');const s=c.closest('.slide');if($$('[data-recap]',s).every(x=>x.classList.contains('open')))later(()=>celebrate(s),500)});
// common
$$('[data-home]').forEach(b=>b.onclick=()=>{$$('.zome-host',b.closest('.slide')).forEach(h=>h._v&&h._v.home());cue('tick')});
$$('[data-replay]').forEach(b=>b.onclick=()=>{cue('tick');go(current,true)});
function setPressed(b,on){b.setAttribute('aria-pressed',String(on))}

/* ---------- enter / leave ---------- */
function enter(s){
 s.classList.remove('celebrating');
 $$('.zome-host',s).forEach(h=>{h.dataset.step=h.dataset.step||'0';h._step=+h.dataset.step;if(h.classList.contains('later')){h.classList.remove('show');return}mountZome(h)});
 $$('.zome-host.later',s).forEach(h=>{h._v=null});
 $$('.arm-host',s).forEach(mountArms);if($('.zoomer',s))zoomReset(s);
 $$('.model-name.later').forEach(x=>x.classList.remove('show'));
 $$('.ang-n,.push-res',s).forEach(x=>x.classList.remove('show','pop'));
 $$('.caption.step-cap',s).forEach(c=>{c.textContent=s.querySelector('[data-hand-next]')?HAND_CAP[0]:s.querySelector('[data-unit-next]')?UNIT_CAP[0]:'';c.hidden=false});
 $$('.done-cap,.slide-cap,.reveal-cap,.chair-cap,.name-tag,.side-view,.arc-cap',s).forEach(x=>x.hidden=true);
 $$('[data-cap]',s).forEach(x=>x.hidden=true);
 $$('.big-count',s).forEach(x=>x.textContent='');
 $$('.hand-badge,.c-badge:not(.keep),.fam,.later-lab,.vs-q',s).forEach(x=>x.classList.remove('show'));$$('.choice',s).forEach(x=>x.classList.remove('right','wrong','dim'));
 $$('.recap',s).forEach(x=>x.classList.remove('open'));
 $$('.guess-card',s).forEach(x=>x.classList.remove('right'));
 $$('.paper,.scribble:not(.on)',s).forEach(x=>x.classList.remove('drawing'));
 $$('.controls .action',s).forEach(b=>{b.disabled=false;b.classList.remove('nudge');b.removeAttribute('aria-pressed')});
 s._h=s._a=s._f=s._layer=s._chair=s._done=0;if(!$('.zoomer',s))s._z=0;
 // p16: point at the first hole
 const u=$('[data-model="unit"]',s);if(u&&u._v)later(()=>u._v.setMarker(UNIT.b[0],N,true),900);
}
function leave(){timers.forEach(clearTimeout);timers=[];views.forEach(v=>v.dispose());views=[];$$('.zome-host,.arm-host').forEach(h=>{h._v=null;h._b=null});bits=[];cx.clearRect(0,0,1600,900)}
function go(i,force){i=Math.max(0,Math.min(slides.length-1,i));if(i!==current)cue('page');leave();slides.forEach((s,n)=>{s.hidden=n!==i;s.classList.remove('on')});current=i;const s=slides[i];void s.offsetWidth;s.classList.add('on');enter(s);
 $('#prev').disabled=i===0;$('#next').disabled=i===slides.length-1;$('#count').textContent=`${i+1} / ${slides.length}`;$('#progress i').style.width=(i+1)/slides.length*100+'%';
 const nt=$('#notes');nt.replaceChildren();const close=document.createElement('button');close.className='overlay-close';close.textContent='关闭 ×';close.onclick=()=>toggle('notes','btnNotes',false);const title=document.createElement('h3');title.textContent=`${i+1}. ${s.dataset.title}（${s.dataset.minutes} 分钟）`;nt.append(close,title);$('.notes',s).textContent.trim().split('\n').forEach(line=>{const p=document.createElement('p');p.textContent=line.trim();nt.append(p)});
 $$('#overview [data-i]').forEach(b=>b.setAttribute('aria-current',String(+b.dataset.i===i)));try{history.replaceState(null,'','#'+(i+1))}catch{}}
window.__go=go;
function toggle(id,btn,force){const el=$('#'+id),on=force??el.hidden;el.hidden=!on;setPressed($('#'+btn),on)}
// overview
(function(){const ov=$('#overview');const close=document.createElement('button');close.className='overlay-close';close.textContent='关闭 ×';close.onclick=()=>toggle('overview','btnGrid',false);const h=document.createElement('h3');const total=slides.reduce((a,s)=>a+ +s.dataset.minutes,0);h.textContent=`碳的变身术 · ${slides.length} 页 · 约 ${total} 分钟`;ov.append(close,h);let sec=null,grid=null;
 slides.forEach((s,i)=>{if(s.dataset.sec!==sec){sec=s.dataset.sec;const h4=document.createElement('h4');h4.textContent=sec;grid=document.createElement('div');grid.className='grid';ov.append(h4,grid)}const b=document.createElement('button');b.dataset.i=i;b.innerHTML=`<b>${i+1}</b>`;b.append(s.dataset.title);b.onclick=()=>{toggle('overview','btnGrid',false);go(i)};grid.append(b)})})();
$('#prev').onclick=()=>go(current-1);$('#next').onclick=()=>go(current+1);
$('#btnGrid').onclick=()=>toggle('overview','btnGrid');$('#btnNotes').onclick=()=>toggle('notes','btnNotes');
$('#btnSound').onclick=()=>{sound=!sound;$('#btnSound').textContent='声音：'+(sound?'开':'关');setPressed($('#btnSound'),sound);if(sound)cue()};
$('#btnFull').onclick=()=>{const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();p?.catch(()=>{})};
addEventListener('keydown',e=>{if(e.key==='Escape'){toggle('overview','btnGrid',false);toggle('notes','btnNotes',false);return}if(e.target.closest('input,textarea,select'))return;if(!$('#overview').hidden)return;if(e.target.closest('button')&&[' ','Enter'].includes(e.key))return;const k=e.key.toLowerCase();
 if(['arrowright','pagedown',' '].includes(k)){e.preventDefault();go(current+1)}else if(['arrowleft','pageup'].includes(k)){e.preventDefault();go(current-1)}else if(k==='home')go(0);else if(k==='end')go(slides.length-1);else if(k==='n')$('#btnNotes').click();else if(k==='g')$('#btnGrid').click();else if(k==='f')$('#btnFull').click();else if(k==='m')$('#btnSound').click()});
const start=Math.max(0,Math.min(slides.length-1,(parseInt(location.hash.slice(1))||1)-1));current=-1;go(start);
})();
