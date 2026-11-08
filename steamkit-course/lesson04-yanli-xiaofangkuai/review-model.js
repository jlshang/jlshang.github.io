import {renderModel} from './kit-model-view.js';
import {MODELS} from './kit-model-data.js';
import {LATTICE_MODEL} from './lattice-hd-model.js';
import {COORDINATION_MODELS} from './coordination-models.js';
import {PART_MODELS} from './part-models.js';
import {EXTRA_MODELS} from './model-extras.js';
import {planInsertion,sampleInsertion} from './insertion-motion.js';
export const models={...MODELS,...PART_MODELS,...EXTRA_MODELS,...COORDINATION_MODELS,'lattice-5':LATTICE_MODEL};
const syncGroups=new Map();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export function mountModel(host,spec){
 const model=models[spec.id],canvas=host.querySelector('canvas');
 canvas.width=1100;canvas.height=Math.round(1100*parseFloat(host.style.height||555)/parseFloat(host.style.width||1000));
 const interactive=spec.interactive!==false;host.dataset.interactive=String(interactive);
 if(!interactive){canvas.tabIndex=-1;canvas.setAttribute('aria-label','固定视角的Zometool模型，不可旋转或缩放');host.querySelector('.model-reset').hidden=true;}
 const base={yaw:spec.yaw??.56,pitch:spec.pitch??.30,height:spec.height??21,orthographic:true};
 let view={...base},current={visibleBalls:[],visibleStruts:[],ballOffsets:{},strutOffsets:{}},frame=0,disposed=false,target=[],targetRods=[],focus=null;
 const pointers=new Map();let pinch=0;
 function draw(){
  if(disposed||!host.isConnected)return;
  try{
   renderModel(canvas,spec.id,{...view,...current,focusBalls:focus,highlight:spec.highlight||[],ghostOpacity:spec.ghostOpacity??.12});
   host.dataset.focus=JSON.stringify(focus);host.dataset.highlight=JSON.stringify(spec.highlight||[]);host.dataset.ghostOpacity=spec.ghostOpacity??.12;host.dataset.ready='true';host.dataset.yaw=view.yaw;host.dataset.height=view.height;
  }catch(e){host.dataset.ready='error';host.querySelector('.model-status').textContent='三维显示失败，请刷新重试';console.error(e);}
 }
 function share(){if(!spec.syncView)return;for(const peer of syncGroups.get(spec.syncView)||[])if(peer!==receiver)peer({...view});}
 const receiver=next=>{view={...next};draw();};
 if(spec.syncView){if(!syncGroups.has(spec.syncView))syncGroups.set(spec.syncView,new Set());syncGroups.get(spec.syncView).add(receiver);}
 function update(next,animate=true){
  cancelAnimationFrame(frame);focus=next.focus??null;spec={...spec,...next};
  const balls=next.balls??model.balls.map((_,i)=>i),set=new Set(balls);
  const rods=next.struts??model.struts.flatMap((e,i)=>set.has(e.a)&&set.has(e.b)?[i]:[]);
  const same=JSON.stringify(target)===JSON.stringify(balls)&&JSON.stringify(targetRods)===JSON.stringify(rods);
  target=[...balls];targetRods=[...rods];host.dataset.balls=balls.length;host.dataset.struts=rods.length;
  if(!animate||reduced()||same||!current.visibleBalls.length){
   current={visibleBalls:balls,visibleStruts:rods,ballOffsets:{},strutOffsets:{}};
   host.dataset.settled='true';draw();return;
  }
  let plan=planInsertion(model,current.visibleBalls,balls,current,rods);
  if(next.transition==='shell'){
   const priorB=new Set(current.visibleBalls),priorR=new Set(current.visibleStruts),origin=model.balls[62];
   const offset=i=>model.balls[i].map((v,k)=>(v-origin[k])*.22);
   const entries=[...balls.filter(i=>!priorB.has(i)).map(index=>({part:'ball',index,offset:offset(index),start:0,duration:1100})),...rods.filter(i=>!priorR.has(i)).map(index=>({part:'strut',index,offset:offset(model.struts[index].a),start:0,duration:1100}))];
   plan={initialBalls:[...priorB],initialStruts:[...priorR],balls,struts:rods,entries,duration:1100};
  }
  const start=performance.now();
  host.dataset.settled='false';
  function tick(now){
   if(disposed)return;
   current=sampleInsertion(plan,(now-start)*1.6);draw();
   if(current.done)host.dataset.settled='true';else frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
 }
 const distance=()=>{const p=[...pointers.values()];return p.length===2?Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y):0;};
 canvas.onpointerdown=e=>{
  if(!interactive)return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);pinch=distance();
 };
 canvas.onpointermove=e=>{
  const p=pointers.get(e.pointerId);if(!p)return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===2){const d=distance();if(pinch&&d)view.height=Math.max(base.height*.75,Math.min(base.height*1.7,view.height*pinch/d));pinch=d;}
  else{view.yaw-=(e.clientX-p.x)*.009;view.pitch=Math.max(-1.25,Math.min(1.25,view.pitch+(e.clientY-p.y)*.009));}
  draw();share();
 };
 canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=e=>{pointers.delete(e.pointerId);pinch=distance();};
 canvas.addEventListener('wheel',e=>{if(!interactive)return;e.preventDefault();view.height=Math.max(base.height*.75,Math.min(base.height*1.7,view.height*Math.exp(e.deltaY*.001)));draw();share();},{passive:false});
 canvas.onkeydown=e=>{
  if(!interactive)return;
  if(!e.key.startsWith('Arrow'))return;
  e.preventDefault();e.stopPropagation();
  if(e.key==='ArrowLeft')view.yaw+=.12;if(e.key==='ArrowRight')view.yaw-=.12;
  if(e.key==='ArrowUp')view.pitch=Math.min(1.25,view.pitch+.1);if(e.key==='ArrowDown')view.pitch=Math.max(-1.25,view.pitch-.1);
  draw();share();
 };
 let introFrame=0;
 function tweenView(from,to,dur,done){
  cancelAnimationFrame(introFrame);let t0=0,n=0;
  const step=now=>{if(disposed)return;if(n++<2){t0=now;introFrame=requestAnimationFrame(step);return;}
   const t=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-t,3);
   view={...view,yaw:from.yaw+(to.yaw-from.yaw)*e,pitch:from.pitch+(to.pitch-from.pitch)*e,height:from.height+(to.height-from.height)*e};draw();
   if(t<1)introFrame=requestAnimationFrame(step);else{host.dataset.intro='done';done&&done();}};
  introFrame=requestAnimationFrame(step);
 }
 host.querySelector('.model-reset').onclick=()=>{tweenView({...view},{...base},1200,share);};
 update(spec,false);
 // Gentle entrance: fade in while turning half a turn and settling slightly closer; ease-out cubic over 2.4s.
 if(spec.intro!==false&&!reduced()){
  const from={...base,yaw:base.yaw-Math.PI,pitch:base.pitch+.1,height:base.height*1.15};
  view={...from};draw();host.dataset.intro='running';
  canvas.style.opacity='0';canvas.style.transition='opacity 1.4s ease-out';requestAnimationFrame(()=>requestAnimationFrame(()=>{canvas.style.opacity='1';}));
  tweenView(from,base,2400);
 }
 return {update,dispose(){disposed=true;cancelAnimationFrame(frame);cancelAnimationFrame(introFrame);pointers.clear();if(spec.syncView){const set=syncGroups.get(spec.syncView);set?.delete(receiver);if(!set?.size)syncGroups.delete(spec.syncView);}},draw};
}
