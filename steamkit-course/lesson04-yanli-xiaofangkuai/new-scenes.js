// v2 scenes: kitchen (50), microscope + why (51), ion drag chain (52), conclusion (53).
// v3 scenes: kitchen answer wall (50), microscope 对/错 (51), why guesses (54), ion drag chain (52), conclusion (53).
export const NEW_MAX={50:1,55:0,51:1,54:0,52:1,53:0};
const WALL_OPTIONS=[['闻一闻','media/ico_smell.png'],['尝一尝','media/ico_taste.png'],['看一看','media/ico_look.png']];
const ICON_IMG={'闻一闻':'media/ico_smell.png','尝一尝':'media/ico_taste.png','看一看':'media/ico_look.png'};
const wallState=new Map();

export function kitchen(state,title,stepBtn){
 const art=`<img class="kitchen-art" src="media/salt_shaker.png" alt="卡通调料罐和倒出来的一堆白色颗粒（卡通形象）" draggable="false">`+(state.saltShown?'<p class="salt-name">盐？糖？</p>':'');
 if(state.step===0)return title('厨房里的白色调料，你猜是什么？')+art+stepBtn;
 return title('厨房里的白色调料，你猜是什么？')+art+
  `<p class="kitchen-ask">有什么办法知道？</p>`+
  `<div class="awall" aria-live="polite"><span class="aempty">孩子说的办法，贴在这里</span></div>`+
  `<div class="acombo"><form class="acform"><div class="acfield"><input maxlength="8" aria-label="孩子说的办法" autocomplete="off" placeholder="输入或选一个办法"><button type="button" class="acopen" aria-label="展开选项" aria-expanded="false">▲</button></div><button type="submit" class="acadd" aria-label="贴上去" title="贴上去">贴上去</button></form><ul class="aclist" hidden>${WALL_OPTIONS.map(([n,i])=>`<li><button type="button" data-wall="${n}"><img src="${i}" alt="">${n}</button></li>`).join('')}</ul></div>`+
  `<button class="review-next-step round areset" aria-label="清空"><span aria-hidden="true">↺</span></button>`;
}
function bindWall(sound){
 const root=document.querySelector('#slide');const wall=root.querySelector('.awall');if(!wall)return()=>{};
 const form=root.querySelector('.acform'),inp=root.querySelector('.acfield input'),list=root.querySelector('.aclist'),op=root.querySelector('.acopen');
 const icon=n=>ICON_IMG[n]?`<img src="${ICON_IMG[n]}" alt="">`:'💡';
 const close=()=>{list.hidden=true;op.setAttribute('aria-expanded','false');};
 const paint=()=>{
  wall.querySelectorAll('.anote').forEach(n=>n.remove());
  let k=0;for(const [name,c] of wallState){
   const n=document.createElement('div');n.className='anote';n.style.setProperty('--rot',((k++*37)%9-4)+'deg');
   n.innerHTML=`<span class="anote-icon">${icon(name)}</span><b>${name}</b><span class="acount">${c>1?'× '+c:''}</span>`;wall.append(n);
  }
  wall.classList.toggle('has',wallState.size>0);
 };
 const pin=name=>{wallState.set(name,(wallState.get(name)||0)+1);paint();const notes=[...wall.querySelectorAll('.anote')];const n=notes[[...wallState.keys()].indexOf(name)];n?.classList.add('bump');sound?.('pin');};
 const onOpen=()=>{list.hidden=!list.hidden;op.setAttribute('aria-expanded',String(!list.hidden));};
 const onFocus=()=>{list.hidden=false;op.setAttribute('aria-expanded','true');};
 const onInput=()=>{const v=inp.value.trim();list.querySelectorAll('li').forEach(li=>li.hidden=!!v&&!li.textContent.includes(v));};
 const onList=e=>{const b=e.target.closest('[data-wall]');if(!b)return;close();pin(b.dataset.wall);inp.value='';};
 const onSubmit=e=>{e.preventDefault();const v=inp.value.trim();if(!v)return;close();pin(v);inp.value='';inp.blur();onInput();};
 const onDown=e=>{if(!e.target.closest('.acombo'))close();};
 const onReset=()=>{wallState.clear();paint();sound?.('reset');};
 op.addEventListener('click',onOpen);inp.addEventListener('focus',onFocus);inp.addEventListener('input',onInput);list.addEventListener('click',onList);form.addEventListener('submit',onSubmit);root.addEventListener('pointerdown',onDown);
 const reset=root.querySelector('.areset');reset.addEventListener('click',onReset);
 paint();
 return ()=>{root.removeEventListener('pointerdown',onDown);};
}

const METHOD_REACT={
 smell:{mark:'!',say:'闻不出来',pop:'<img src="media/nosmell.png" alt="小兔闻了闻，皱眉摇头（卡通形象）"><p><b>闻不出来！</b><span>盐和糖，几乎都没有气味</span></p>',cls:'warn'},
 taste:{mark:'',say:'不能尝！',pop:'<img src="media/notaste.png" alt="小兔捂住嘴巴摇头（卡通形象）"><p><b>不认识的东西，不能尝！</b><span>做实验的第一条规矩</span></p>',cls:'no'},
 look:{mark:'✓',say:'好办法！',pop:'<span class="react-scope"><img src="media/scope.png" alt="卡通显微镜"></span><p><b>好办法！放大看一看</b></p>',cls:'ok'}};
export function methods(state,title){
 const cards=[['smell','media/ico_smell.png','闻一闻'],['taste','media/ico_taste.png','尝一尝'],['look','media/ico_look.png','看一看']];
 return title('哪个办法，又安全又管用？')+`<div class="method-row big">${cards.map(([k,img,t],n)=>`<button class="method-card m-${k}" data-method="${k}" style="--i:${n}"><img class="method-img" src="${img}" alt=""><strong>${t}</strong></button>`).join('')}</div><div class="react-pop" aria-live="polite"></div>`;
}
function bindMethods(sound){
 const root=document.querySelector('#slide');const pop=root.querySelector('.react-pop');if(!pop)return()=>{};
 const h=e=>{const b=e.target.closest('[data-method]');if(!b)return;const k=b.dataset.method,r=METHOD_REACT[k];
  if(!b.classList.contains('shown')){b.classList.add('shown');b.insertAdjacentHTML('beforeend',(k==='taste'?'<i class="ban-stamp" aria-hidden="true"></i>':`<i class="m-badge">${r.mark}</i>`));}
  pop.className='react-pop show '+r.cls;pop.innerHTML=r.pop;void pop.offsetWidth;pop.classList.add('in');
  sound?.(k==='look'?'good':'wrong');};
 root.addEventListener('click',h);return ()=>root.removeEventListener('click',h);
}

export function micro(state,title,photos){
 return title('显微镜下，哪个是盐？')+photos.replace('dc-photo-choice-scene','dc-photo-choice-scene v3-micro').replace(/<div class="dc-choice-rabbit"[\s\S]*?<\/svg><\/div>/,'')+'<div class="verdict" aria-live="polite"></div>';
}
function bindMicro(sound){
 const btns=[...document.querySelectorAll('[data-photo-choice]')],v=document.querySelector('.verdict');if(!v)return()=>{};
 const h=e=>{const ok=e.currentTarget.dataset.photoChoice==='left';btns.forEach(b=>{b.classList.toggle('picked',b===e.currentTarget);b.classList.toggle('ok',b===e.currentTarget&&ok);b.classList.toggle('no',b===e.currentTarget&&!ok);});
  const f=e.currentTarget.closest('figure').getBoundingClientRect(),st=document.querySelector('#stage').getBoundingClientRect(),k=st.width/1600;
  v.className='verdict show '+(ok?'ok':'no');v.innerHTML=ok?'✓':'✗';v.style.left=((f.left-st.left)/k+(f.width/k)/2-110)+'px';v.style.top=((f.top-st.top)/k+(f.height/k)+24)+'px';
  sound?.(ok?'correct':'wrong');
  if(ok)setTimeout(()=>{if(document.querySelector('.v3-micro'))window.courseware.advance();},1300);};
 btns.forEach(b=>b.addEventListener('click',h));return ()=>btns.forEach(b=>b.removeEventListener('click',h));
}

export function why(state,title){
 const guesses=['工厂把盐切成了小方块','盐里面的小粒子，排得整整齐齐','我有别的猜想'];
 return `<img class="why-art slide-in" src="assets/p06-shape5.jpeg" alt="显微镜下的盐粒" draggable="false"><div class="why-guesses big"><p class="why-ask">为什么小方块的是盐？</p>${guesses.map((t,i)=>{const n=(state.votes||[])[i]||0;return `<button data-guess="${i}" class="${n?'selected':''}" style="--i:${i}"><b>${'ABC'[i]}</b>${t}<span class="vote-n${n?' on':''}">${n}</span></button>`;}).join('')}</div>`+((state.votes||[]).some(Boolean)?'<button class="review-next-step round" data-action="votereset" aria-label="清零"><span aria-hidden="true">↺</span></button>':'');
}

// ---------- Page 52: one grain zooms into ions; drag to build Na-Cl chain ----------
const R={na:40,cl:52},GAP=26;
const START=[
 ['na',200,300],['cl',400,500],['na',640,290],['cl',850,530],['na',1060,320],
 ['cl',1270,300],['na',1410,580],['cl',1000,770],['na',560,730],['cl',230,760]
];
const face=(kind)=>{
 const r=R[kind],eye=r*.22,ey=-r*.12,col=kind==='na'?'#fff':'#26364d';
 return `<circle cx="${-r*.3}" cy="${ey}" r="${eye*.55}" fill="${col}"/><circle cx="${r*.3}" cy="${ey}" r="${eye*.55}" fill="${col}"/><path d="M${-r*.22} ${r*.2}Q0 ${r*.42} ${r*.22} ${r*.2}" fill="none" stroke="${col}" stroke-width="${kind==='na'?4:5}" stroke-linecap="round"/>`;
};
export function ions(state,title){
 if(state.step===0)return title('一粒盐里面，是什么？')+
  `<div class="grain-stage"><svg class="salt-grain" data-action="advance" tabindex="0" style="cursor:zoom-in" viewBox="0 0 300 300" role="img" aria-label="一粒小方块盐"><path d="M50 95L150 45L250 95L150 145Z" fill="#ffffff"/><path d="M50 95L150 145V255L50 205Z" fill="#d6e2ee"/><path d="M150 145L250 95V205L150 255Z" fill="#eaf1f7"/></svg></div>`;
 return title('钠<span class="ionf p">（Na⁺）</span>和氯<span class="ionf p">（Cl⁻）</span>')+(state.ionReset?'':'<div class="zoom-flash" aria-hidden="true"></div>')+'<button class="review-next-step round ion-reset" data-action="ionreset" aria-label="撤销，重新排"><span aria-hidden="true">↺</span></button>'+`<svg id="ion-field" class="ion-field" viewBox="0 0 1600 900" role="application" aria-label="拖动钠和氯：同类会弹开，钠和氯会吸住连起来">
   
   <g id="ion-rods"></g>
   ${START.map(([k,x,y],i)=>`<g class="ion ion-${k}" data-ion="${i}" data-kind="${k}" style="transform:translate(${x}px,${y}px)"><g class="ion-idle" style="--d:${(i*.37).toFixed(2)}s"><circle class="ion-glow" r="${R[k]+16}"/><circle class="ion-hit" r="${R[k]*1.35}" fill="transparent"/><image href="${k==='na'?'media/ion_na.png':'media/ion_cl.png'}" x="${-R[k]*2.05}" y="${-R[k]*1.95}" width="${R[k]*4.1}" height="${R[k]*4.1}" preserveAspectRatio="xMidYMid meet"/><text y="${R[k]*1.9+30}" text-anchor="middle"><tspan class="ionf">${k==='na'?'Na⁺':'Cl⁻'}</tspan></text></g></g>`).join('')}
  </svg>
  <p class="ion-hint" role="status"></p>`;
}

let cleanupIon=()=>{};
export function cleanupNew(){cleanupIon();cleanupIon=()=>{};}
export function bindNew({state,sound}){
 cleanupNew();
 if(state.page===52)cleanupIon=bindIons(sound);
 if(state.page===50)cleanupIon=bindWall(sound);
 if(state.page===51)cleanupIon=bindMicro(sound);
 if(state.page===55){cleanupIon=bindMethods(sound);}
 if(false){const h=e=>{const b=e.target.closest('[data-method]');if(!b)return;(state.methods||(state.methods=new Set())).add(b.dataset.method);sound?.(b.dataset.method==='look'?'good':'wrong');window.__rerender?.();};document.querySelector('#slide').addEventListener('click',h);cleanupIon=()=>document.querySelector('#slide')?.removeEventListener('click',h);}
 if(state.page===53)confetti();
}

function confetti(){
 const host=document.querySelector('.confetti');if(!host)return;
 const colors=['#f6c343','#e8742a','#5fb0f0','#f27aa8','#7fd38b'];
 host.innerHTML=Array.from({length:46},(_,i)=>`<i style="left:${(i*37)%100}%;background:${colors[i%5]};animation-delay:${(i%12)*.07}s;--dx:${(i%7-3)*30}px;--rot:${(i*47)%360}deg"></i>`).join('');
}

function bindIons(sound){
 const svg=document.getElementById('ion-field');if(!svg)return()=>{};
 const hint=document.querySelector('.ion-hint');
 const play=k=>{try{sound?.(k);}catch{}};
 const nodes=[...svg.querySelectorAll('.ion')];
 const ions=nodes.map((el,i)=>({i,el,kind:el.dataset.kind,r:R[el.dataset.kind],x:START[i][1],y:START[i][2]}));
 let chains=ions.map(o=>[o]);
 const chainOf=o=>chains.find(c=>c.includes(o));
 const rods=svg.querySelector('#ion-rods');
 let done=false,drag=null,timers=[];
 const later=(f,ms)=>timers.push(setTimeout(f,ms));
 function place(o,animate=true){o.el.classList.toggle('moving',animate);o.el.style.transform=`translate(${o.x}px,${o.y}px)`;}
 function drawRods(){
  rods.innerHTML=chains.flatMap(c=>c.slice(1).map((b,k)=>{const a=c[k];return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="ion-rod"/>`;})).join('');
 }
 const toSvg=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());};
 const clampChain=c=>{
  const minX=Math.min(...c.map(o=>o.x-o.r*1.7)),maxX=Math.max(...c.map(o=>o.x+o.r*1.7));
  const minY=Math.min(...c.map(o=>o.y-o.r)),maxY=Math.max(...c.map(o=>o.y+o.r*1.9+44));
  let dx=0,dy=0;
  if(minX<40)dx=40-minX;else if(maxX>1560)dx=1560-maxX;
  if(minY<230)dy=230-minY;else if(maxY>880)dy=880-maxY;
  c.forEach(o=>{o.x+=dx;o.y+=dy;});
 };
 function layout(c,anchor){ // horizontal line, keeps `anchor` fixed
  const k=c.indexOf(anchor);
  for(let j=k+1;j<c.length;j++){c[j].x=c[j-1].x+c[j-1].r+c[j].r+GAP;c[j].y=anchor.y;}
  for(let j=k-1;j>=0;j--){c[j].x=c[j+1].x-c[j+1].r-c[j].r-GAP;c[j].y=anchor.y;}
  clampChain(c);
 }
 function repelFrom(moving,other){ // push `other` chain away from `moving` ion
  const c=chainOf(other);
  let vx=other.x-moving.x,vy=other.y-moving.y,d=Math.hypot(vx,vy)||1;
  const need=moving.r+other.r+120-d;
  c.forEach(o=>{o.x+=vx/d*need;o.y+=vy/d*need;});
  clampChain(c);c.forEach(o=>place(o));
  other.el.classList.remove('shake');void other.el.getBBox();other.el.classList.add('shake');
  moving.el.classList.remove('shake');void moving.el.getBBox();moving.el.classList.add('shake');
  hint.textContent='';
  play('repel');
 }
 const ends=c=>c.length===1?[c[0]]:[c[0],c[c.length-1]];
 function nearestEnd(c,maxGap){
  let best=null;
  for(const a of ends(c))for(const other of chains){if(other===c)continue;for(const b of ends(other)){
   const d=Math.hypot(a.x-b.x,a.y-b.y)-a.r-b.r;
   if(d<maxGap&&(!best||d<best.d))best={a,b,d,other};
  }}
  return best;
 }
 function down(e){
  if(done)return;
  const g=e.target.closest('.ion');if(!g)return;
  const o=ions[+g.dataset.ion],p=toSvg(e);
  drag={o,c:chainOf(o),last:p,id:e.pointerId};
  drag.c.forEach(m=>m.el.classList.add('dragging'));
  svg.setPointerCapture(e.pointerId);e.preventDefault();
 }
 function move(e){
  if(!drag||e.pointerId!==drag.id)return;
  const p=toSvg(e),dx=p.x-drag.last.x,dy=p.y-drag.last.y;drag.last=p;
  drag.c.forEach(m=>{m.x+=dx;m.y+=dy;place(m,false);});
  drawRods();
  svg.querySelectorAll('.ion.target').forEach(n=>n.classList.remove('target'));
  const hit=nearestEnd(drag.c,70);
  if(hit&&hit.a.kind!==hit.b.kind)hit.b.el.classList.add('target');
  // same kinds that come too close get pushed away right away
  for(const m of drag.c)for(const o of ions){
   if(drag.c.includes(o)||o.kind!==m.kind)continue;
   if(Math.hypot(o.x-m.x,o.y-m.y)<m.r+o.r+18){repelFrom(m,o);drawRods();}
  }
 }
 function up(e){
  if(!drag||e.pointerId!==drag.id)return;
  const c=drag.c;drag.c.forEach(m=>m.el.classList.remove('dragging'));drag=null;
  svg.querySelectorAll('.ion.target').forEach(n=>n.classList.remove('target'));
  const hit=nearestEnd(c,70);
  if(hit&&hit.a.kind!==hit.b.kind){
   const t=hit.other,b=hit.b,a=hit.a;
   // attach on the side of b that faces the dragged chain
   let right=b===t[t.length-1]&&(t.length>1||a.x>=b.x);
   if(t.length>1&&b===t[0])right=false;
   let moving=c.slice();
   if(right&&moving[0]!==a)moving.reverse();
   if(!right&&moving[moving.length-1]!==a)moving.reverse();
   const merged=right?t.concat(moving):moving.concat(t);
   chains=chains.filter(x=>x!==t&&x!==c);chains.push(merged);
   layout(merged,b);merged.forEach(o=>place(o));
   [a,b].forEach(o=>{o.el.classList.remove('snap');void o.el.getBBox();o.el.classList.add('snap');});
   play('snap');
   hint.textContent='';
   later(drawRods,0);
   drawRods();
   if(merged.length===ions.length)later(finish,450);
  }else if(hit&&hit.a.kind===hit.b.kind){repelFrom(hit.a,hit.b);}
  drawRods();
 }
 function finish(){
  done=true;
  const c=chains[0],anchor=c[0];
  const width=c[c.length-1].x-c[0].x;anchor.x=800-width/2;anchor.y=500;layout(c,anchor);c.forEach(o=>place(o));
  later(()=>{drawRods();svg.classList.add('complete');hint.innerHTML='<b>钠、氯、钠、氯……一个隔一个！</b>';play('cheer');},380);
  const host=document.createElement('div');host.className='confetti';document.querySelector('#slide').append(host);confetti();
 }
 // keep rods synced while the CSS transitions run
 let raf=0;const tick=()=>{if(!svg.isConnected)return;drawRods();raf=requestAnimationFrame(tick);};
 const syncRods=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);later(()=>cancelAnimationFrame(raf),600);};
 svg.addEventListener('transitionrun',syncRods);
 svg.addEventListener('pointerdown',down);svg.addEventListener('pointermove',move);
 svg.addEventListener('pointerup',up);svg.addEventListener('pointercancel',up);
 return ()=>{timers.forEach(clearTimeout);cancelAnimationFrame(raf);svg.removeEventListener('pointerdown',down);};
}

export function conclusion(title,host){
 return title('排得整整齐齐，就长成小方块！')+
  host('answer-cube',{id:'grid-4',height:16},'left:70px;top:215px;width:700px;height:560px')+
  `<figure class="celebrate-art"><img src="media/celebrate.webp" alt="小兔举起方方的盐粒，阿基米德爷爷竖起大拇指（卡通形象）"></figure>
  <div class="answer-two"><p><span>里面</span>钠和氯一个隔一个，排成方格</p><p><span>外面</span>一层层长大，还是小方块</p></div><div class="confetti"></div>`;
}
