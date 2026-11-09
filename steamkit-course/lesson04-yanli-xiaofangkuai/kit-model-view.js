import * as T from './vendor/three.module.js';
import {toCreasedNormals} from './vendor/BufferGeometryUtils.js';
import {SHAPES} from './kit-hd-shapes.js';
import {MODELS} from './kit-model-data.js';
import {LATTICE_MODEL} from './lattice-hd-model.js';
import {stageInfo,SHARED_BALLS} from './assembly-stages.js';
import {planInsertion,sampleInsertion} from './insertion-motion.js';
import {COORDINATION_MODELS,coordinationStage} from './coordination-models.js';
import {PART_MODELS} from './part-models.js';
import {EXTRA_MODELS} from './model-extras.js';
import {yellowStrut} from './zome-yellow.js';
const allModels={...MODELS,...PART_MODELS,...EXTRA_MODELS,...COORDINATION_MODELS,'lattice-5':LATTICE_MODEL};

// One WebGL renderer, separate real scenes copied synchronously to each visible canvas.
// No photo recoloring, image masks, model stretching, or per-ball screen-space overlays.
const geometries={},materials={},ghostMaterials={},scenes=new Map(),views=new Map();
for(const [name,source] of Object.entries(SHAPES)){
 let g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(source.positions,3));
 g.setIndex(source.indices);g.computeVertexNormals();
 geometries[name]=toCreasedNormals(g,59*Math.PI/180);
}
for(const [name,color]of Object.entries({black:'#363636',white:'#ececec',BLUE:'#0081df',GREEN:'#07943a',YELLOW:'#f2c230',yellow:'#e9c23c',blueball:'#2f86d8'}))
 materials[name]=new T.MeshStandardMaterial({color,roughness:.62,metalness:0});
// Black balls on the dark page: a soft cool rim (Fresnel) lifts their silhouette without changing the ball colour.
materials.black.onBeforeCompile=sh=>{
 sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>',
  'float rimF=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),2.2);\n outgoingLight+=vec3(0.62,0.72,0.9)*rimF*0.85;\n#include <opaque_fragment>');
};
materials.black.customProgramCacheKey=()=>'black-rim';
for(const [name,material] of Object.entries(materials)){
 ghostMaterials[name]=material.clone();
 Object.assign(ghostMaterials[name],{transparent:true,opacity:.12,depthWrite:false});
}
let renderer;
function getRenderer(){
 if(!renderer){
  renderer=new T.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 }
 return renderer;
}
function buildScene(id){
 if(scenes.has(id))return scenes.get(id);
 const model=allModels[id],scene=new T.Scene(),group=new T.Group();
 model.balls.forEach((p,i)=>{
  const mesh=new T.Mesh(geometries.ball,materials[model.ballColors[i]]);
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.position.fromArray(p);mesh.userData={part:'ball',index:i,material:model.ballColors[i]};group.add(mesh);
 });
 model.struts.forEach((e,i)=>{
  if(e.color==='YELLOW'){const mesh=new T.Mesh(yellowStrut(model.balls[e.a],model.balls[e.b]),materials.YELLOW);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData={part:'strut',index:i,material:'YELLOW'};group.add(mesh);return;}
  const mesh=new T.Mesh(geometries[e.color==='BLUE'?'b0':'g0'],materials[e.color]);
  mesh.castShadow=true;mesh.receiveShadow=true;
  mesh.matrix.fromArray(e.rotation);mesh.matrix.setPosition(...model.balls[e.a]);
  mesh.matrixAutoUpdate=false;mesh.userData={part:'strut',index:i,material:e.color};group.add(mesh);
 });
 const center=new T.Box3().setFromObject(group).getCenter(new T.Vector3());
 group.position.copy(center).negate();scene.add(group);
 // Page-13 plastic palette and soft self-shadowing reveal the actual hole walls.
 // All lights follow the camera, so underside views keep the same neutral fill.
 const radius=new T.Box3().setFromObject(group).getBoundingSphere(new T.Sphere()).radius;
 scene.add(new T.AmbientLight(0xffffff,.85));
 const lights=[];
 for(const [x,y,z,intensity]of [[-3,5,6,2.6],[4,1,3,1.25],[0,3,-4,.8]]){
  const light=new T.DirectionalLight(0xffffff,intensity);
  light.userData.offset=new T.Vector3(x,y,z).multiplyScalar(radius);
  if(lights.length===0){
   light.castShadow=true;light.shadow.mapSize.set(id==='lattice-5'?4096:2048,id==='lattice-5'?4096:2048);
   Object.assign(light.shadow.camera,{left:-radius*1.1,right:radius*1.1,top:radius*1.1,bottom:-radius*1.1,near:.1,far:radius*20});
   light.shadow.bias=-.0001;light.shadow.normalBias=.005;
  }
  scene.add(light);lights.push(light);
 }
 const value={scene,group,model,lights};scenes.set(id,value);return value;
}
function focusLattice(axis){
 const {group,model}=buildScene('lattice-5'),dimension=[null,0,2,1][axis];
 const active=new Set();
 model.balls.forEach((p,i)=>{if(axis&&p.every((v,k)=>k===dimension||Math.abs(v-model.balls[62][k])<1e-8))active.add(i);});
 for(const mesh of group.children){
  const {part,index,material}=mesh.userData,e=part==='strut'?model.struts[index]:null;
  const on=!axis||(e?active.has(e.a)&&active.has(e.b):active.has(index));
  mesh.material=(on?materials:ghostMaterials)[material];mesh.castShadow=on;mesh.renderOrder=on?1:0;mesh.userData.active=!!axis&&on;
 }
}
export function renderModel(canvas,id,{yaw=.545,pitch=.274,height=17,orthographic=false,axis=0,visibleBalls=null,visibleStruts=null,ballOffsets={},strutOffsets={},highlight=[],focusBalls=null,ghostOpacity=.12,labels=null}={}){
 const {scene,lights,group,model}=buildScene(id),r=getRenderer(),w=canvas.width,h=canvas.height;
 if(id==='lattice-5')focusLattice(axis);
 for(const material of Object.values(ghostMaterials))material.opacity=ghostOpacity;
 const visible=visibleBalls===null?null:new Set(visibleBalls);
 const rods=visibleStruts===null?null:new Set(visibleStruts);
 for(const mesh of group.children){
  const {part,index}=mesh.userData,e=part==='strut'?model.struts[index]:null;
  if(focusBalls!==null||id!=='lattice-5'){
   const on=focusBalls===null||(e?focusBalls.includes(e.a)&&focusBalls.includes(e.b):focusBalls.includes(index));
   mesh.material=(on?materials:ghostMaterials)[mesh.userData.material];mesh.castShadow=on;
  }
  mesh.visible=e&&rods?rods.has(index):!visible||(e?visible.has(e.a)&&visible.has(e.b):visible.has(index));
  const offset=(e?strutOffsets:ballOffsets)[index]||[0,0,0];
  if(e&&e.color==='YELLOW'){mesh.matrixAutoUpdate=false;mesh.matrix.makeTranslation(...offset);}
  else if(e){
   mesh.matrix.fromArray(e.rotation);
   mesh.matrix.setPosition(...model.balls[e.a].map((v,k)=>v+offset[k]));
  }else mesh.position.fromArray(model.balls[index].map((v,k)=>v+offset[k]));
 }
 const distance=33.48;
 const camera=orthographic||id==='cross-flat'
  ?new T.OrthographicCamera(-height*w/h/2,height*w/h/2,height/2,-height/2,.1,300)
  :new T.PerspectiveCamera(2*Math.atan(height/2/distance)*180/Math.PI,w/h,.1,300);
 camera.position.set(distance*Math.sin(yaw)*Math.cos(pitch),distance*Math.sin(pitch),distance*Math.cos(yaw)*Math.cos(pitch));
 camera.lookAt(0,0,0);camera.updateMatrixWorld();
 if(!orthographic&&id!=='cross-flat'){camera.rotateZ(-.017);camera.updateMatrixWorld();}
 for(const light of lights)light.position.copy(light.userData.offset).applyQuaternion(camera.quaternion);
 r.setSize(w,h,false);r.render(scene,camera);
 const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);ctx.drawImage(r.domElement,0,0);
 // Annotation rings follow the actual shared/new particles in world space.
 // They are not replacement parts, recolouring masks, or physical rods.
 for(const index of highlight){
  if(visible&&!visible.has(index))continue;
  const p=new T.Vector3().fromArray(model.balls[index]).add(group.position);
  const edge=p.clone().add(new T.Vector3(1.3,0,0).applyQuaternion(camera.quaternion));
  p.project(camera);edge.project(camera);
  const x=(p.x+1)*w/2,y=(1-p.y)*h/2,radius=Math.abs(edge.x-p.x)*w/2;
  ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);
  ctx.strokeStyle='#fffaf2';ctx.lineWidth=8;ctx.stroke();
  ctx.strokeStyle='#d77916';ctx.lineWidth=4;ctx.stroke();
 }
 if(labels){
  ctx.textAlign='center';ctx.textBaseline='top';
  labels.forEach((text,index)=>{
   if(!text||(visible&&!visible.has(index)))return;
   const p=new T.Vector3().fromArray(model.balls[index]).add(group.position);
   const edge=p.clone().add(new T.Vector3(1.3,0,0).applyQuaternion(camera.quaternion));
   p.project(camera);edge.project(camera);
   const x=(p.x+1)*w/2,y=(1-p.y)*h/2,radius=Math.abs(edge.x-p.x)*w/2;
   ctx.font=`italic 700 ${Math.round(Math.max(26,radius*.9))}px "Times New Roman",serif`;
   ctx.lineWidth=6;ctx.strokeStyle='#1f2a44';ctx.strokeText(text,x,y+radius+10);
   ctx.fillStyle='#f5c542';ctx.fillText(text,x,y+radius+10);
  });
 }
}
export function resetViews(){views.clear();}
export function mountAll(container){
 for(const host of container.querySelectorAll('[data-kit-model]')){
  if(host.dataset.mounted)continue;host.dataset.mounted='true';
  const id=host.dataset.kitModel,key=host.dataset.viewKey;
  if(!views.has(key)){const planar=key.startsWith('22-');views.set(key,{yaw:id==='cross-flat'?0:planar?.55:.545,pitch:id==='cross-flat'?0:planar?.30:.274,orthographic:planar||host.dataset.assembly==='19'});}
  const view=views.get(key),canvas=host.querySelector('canvas'),model=allModels[id];
  canvas.width=Math.round(parseFloat(host.style.width)*2);
  canvas.height=Math.round(parseFloat(host.style.height)*2);
  const draw=()=>{
   if(!host.isConnected)return;
   const assembly=host.dataset.assembly?stageInfo(+host.dataset.assembly,+host.dataset.step)
    :host.dataset.previewAssembly?stageInfo(+host.dataset.previewAssembly,0):null;
   const coordination=host.dataset.coordination?coordinationStage(host.dataset.coordination,+host.dataset.step):null;
   try{renderModel(canvas,id,{...view,height:assembly?.height||coordination?.height||(id.startsWith('grid-')?22:id==='shared-octa'?20:17),
    visibleBalls:host._visibleBalls??assembly?.balls??coordination?.balls??null,
    visibleStruts:host._visibleStruts??coordination?.struts??null,ballOffsets:host._ballOffsets||{},strutOffsets:host._strutOffsets||{},
    highlight:id==='shared-octa'?SHARED_BALLS:coordination?.highlight||host._highlight||[]});
    host.dataset.ready='true';host.dataset.yaw=view.yaw;host.dataset.pitch=view.pitch;
    if(host.dataset.assembly==='19'&&host.parentElement.classList.contains('growth-complete'))host.parentElement.querySelector('[data-preview-assembly]')?._draw?.();
   }
   catch(error){host.dataset.ready='error';host.querySelector('.kit-model-status').textContent='三维显示未加载，请重播本页';console.error(error);}
  };
  host.dataset.balls=model.balls.length;host.dataset.struts=model.struts.length;
  if(host.dataset.coordination){
   const current=coordinationStage(host.dataset.coordination,+host.dataset.step);
   host.dataset.balls=current.balls.length;host.dataset.struts=current.struts.length;
   host.dataset.centerColor=model.ballColors[0];
   host.dataset.neighborColors=JSON.stringify(model.ballColors.slice(1));
  }
  if(host.dataset.previewAssembly){
   const initial=stageInfo(+host.dataset.previewAssembly,0);
   host.dataset.balls=initial.balls.length;host.dataset.struts=initial.struts.length;
  }
  if(id==='shared-octa')host.dataset.sharedBalls=JSON.stringify(SHARED_BALLS);
  host.dataset.materials=JSON.stringify({balls:[...new Set(model.ballColors)],struts:[...new Set(model.struts.map(e=>e.color))]});
  let drag=null;
  canvas.addEventListener('pointerdown',e=>{
   if(e.pointerType==='mouse'&&e.button!==0)return;
   drag={id:e.pointerId,x:e.clientX,y:e.clientY};if(e.isTrusted)canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
   if(!drag||drag.id!==e.pointerId)return;
   view.yaw-=(e.clientX-drag.x)*.009;
   view.pitch=Math.max(-1.3,Math.min(1.3,view.pitch+(e.clientY-drag.y)*.009));
   drag={id:e.pointerId,x:e.clientX,y:e.clientY};draw();
  });
  const stop=()=>{drag=null;};
  canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('lostpointercapture',stop);
  canvas.addEventListener('keydown',e=>{
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
   e.preventDefault();e.stopPropagation();
   if(e.key==='ArrowLeft')view.yaw+=.12;if(e.key==='ArrowRight')view.yaw-=.12;
   if(e.key==='ArrowUp')view.pitch=Math.max(-1.3,view.pitch-.12);
   if(e.key==='ArrowDown')view.pitch=Math.min(1.3,view.pitch+.12);draw();
  });
  host._draw=draw;
  if(key.startsWith('22-')&&id.startsWith('octa-')&&host.classList.contains('reveal'))animateOutline(host);else if(host.dataset.assembly)updateAssembly(host,+host.dataset.step,false);else if(host.dataset.coordination)updateCoordination(host,+host.dataset.step,false);else draw();
 }
}
export function updateAssembly(host,step,animate=true){
 if(!host?._draw)return;
 const info=stageInfo(+host.dataset.assembly,step),previous=host._visibleBalls||[];
 cancelAnimationFrame(host._assemblyFrame);host.dataset.step=step;host.dataset.settled='false';
 host._highlight=[];
 const scene=host.closest('.continuous-scene');
 scene?.classList.remove('growth-complete');
 const preview=scene?.querySelector('[data-preview-assembly]');
 preview?.setAttribute('aria-hidden','true');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const model=allModels[info.model];
 const plan=planInsertion(model,previous,info.balls,{visibleStruts:host._visibleStruts,
  ballOffsets:host._ballOffsets,strutOffsets:host._strutOffsets});
 const moving=animate&&!reduced&&step>0;
 // Faster page19 only; keep the same rigid paths and interruption snapshots.
 const playbackRate=+host.dataset.assembly===19?1.6:1;
 host.dataset.playbackRate=String(playbackRate);
 const started=performance.now();
 const tick=now=>{
  if(!host.isConnected)return;
  const pose=sampleInsertion(plan,moving?(now-started)*playbackRate:plan.duration);
  host._visibleBalls=pose.visibleBalls;host._visibleStruts=pose.visibleStruts;
  host._ballOffsets=pose.ballOffsets;host._strutOffsets=pose.strutOffsets;
  host.dataset.balls=pose.visibleBalls.length;host.dataset.struts=pose.visibleStruts.length;
  host.dataset.inserting=String(!pose.done);
  host._draw();
  if(!pose.done)host._assemblyFrame=requestAnimationFrame(tick);
  else{
   host.dataset.settled='true';
   if(+host.dataset.assembly===19&&step===info.stages.length-1){
    scene?.classList.add('growth-complete');preview?.setAttribute('aria-hidden','false');preview?._draw?.();
   }
  }
 };
 tick(started);
}
// Preserve each local view and animate only newly requested parts. A later phase
// can add outline rods without adding balls; do not reveal those rods early.
export function updateCoordination(host,step,animate=true){
 if(!host?._draw)return;
 const info=coordinationStage(host.dataset.coordination,step);
 const target=JSON.stringify([info.balls,info.struts]);
 host.dataset.step=step;
 if(animate&&host._coordinationTarget===target){host._draw();return;}
 cancelAnimationFrame(host._assemblyFrame);
 host._coordinationTarget=target;host.dataset.settled='false';
 const plan=planInsertion(allModels[info.id],host._visibleBalls||[],info.balls,{
  visibleStruts:host._visibleStruts,ballOffsets:host._ballOffsets,strutOffsets:host._strutOffsets
 },info.struts);
 const moving=animate&&step>0&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const started=performance.now();
 const tick=now=>{
  if(!host.isConnected)return;
  const pose=sampleInsertion(plan,moving?now-started:plan.duration);
  host._visibleBalls=pose.visibleBalls;host._visibleStruts=pose.visibleStruts;
  host._ballOffsets=pose.ballOffsets;host._strutOffsets=pose.strutOffsets;
  host.dataset.balls=pose.visibleBalls.length;host.dataset.struts=pose.visibleStruts.length;
  host.dataset.inserting=String(!pose.done);host.dataset.settled=String(pose.done);
  host._draw();
  if(!pose.done)host._assemblyFrame=requestAnimationFrame(tick);
 };
 tick(started);
}
// Page22 retains its comparison panels; only the newest green-edge group inserts.
export function animateOutline(host){
 const model=allModels[host.dataset.kitModel],number=+host.dataset.kitModel.split('-')[1];
 const previous=allModels[number===1?'cross-3d':`octa-${number-1}`];
 const key=e=>[e.a,e.b].sort((a,b)=>a-b).join(',');
 const edges=new Set(previous.struts.map(key)),balls=model.balls.map((_,i)=>i);
 const plan=planInsertion(model,balls,balls,{visibleStruts:model.struts.flatMap((e,i)=>edges.has(key(e))?[i]:[])});
 host.dataset.outlineAnimation='true';const started=performance.now(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const tick=now=>{if(!host.isConnected)return;const pose=sampleInsertion(plan,reduced?plan.duration:now-started);
  host._visibleBalls=pose.visibleBalls;host._visibleStruts=pose.visibleStruts;host._strutOffsets=pose.strutOffsets;host._ballOffsets=pose.ballOffsets;
  host.dataset.inserting=String(!pose.done);host.dataset.settled=String(pose.done);host._draw();
  if(!pose.done)host._assemblyFrame=requestAnimationFrame(tick);
 };tick(started);
}
export function inspect(id){
 const {group,model}=buildScene(id);
 return {balls:model.balls.length,struts:model.struts.length,ballColors:model.ballColors,
  appearance:{profile:'page13-soft-plastic-v2',roughness:.62,ambient:.85,softShadows:true},
  fixedCenter:id==='lattice-5'?62:null,
  activeBalls:group.children.filter(m=>m.userData.part==='ball'&&m.userData.active).map(m=>m.userData.index),
  activeStruts:group.children.filter(m=>m.userData.part==='strut'&&m.userData.active).map(m=>m.userData.index),
  parts:group.children.map(m=>({part:m.userData.part,color:m.material.color.getHexString(),
   vertices:m.geometry.attributes.position.count,scale:m.scale.toArray()}))};
}
