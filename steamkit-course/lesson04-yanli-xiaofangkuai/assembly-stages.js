import {MODELS} from './kit-model-data.js';
import {LATTICE_MODEL} from './lattice-hd-model.js';

// Subsets of existing verified parts, in their final world coordinates. No scaling
// or changed geometry. Display insertion paths live in insertion-motion.js;
// they are not a physical assembly certification. Camera fits the final model.
const samePoint=(a,b)=>a.every((x,k)=>Math.abs(x-b[k])<1e-7);
const grid=MODELS['grid-4'];
const subset=(model,points)=>model.balls.flatMap((p,i)=>points.some(q=>samePoint(p,q))?[i]:[]);
const spacing=LATTICE_MODEL.landmarks.blueSpacing||5.23606797749979;
const center=LATTICE_MODEL.balls[62];
const layerBounds=[
 [-1,1,-1,1,-1,1],[-2,1,-1,1,-1,1],[-2,2,-1,1,-1,1],
 [-2,2,-2,1,-1,1],[-2,2,-2,2,-1,1],[-2,2,-2,2,-2,1],[-2,2,-2,2,-2,2]
];
export const ASSEMBLIES={
 14:{model:'cross-3d',height:17,
  labels:['从一颗黑球开始','左右各接一颗白球','上下再接两颗','前后再接两颗'],
  stages:[[0],[0,1,2],[0,1,2,3,4],[0,1,2,3,4,5,6]]},
 16:{model:'grid-4',height:21,
  labels:['接着刚才的六个邻居','沿原来的方向接着搭','相邻的球，颜色交替','继续补齐空位','3 层 × 3 排 × 3 颗：小方块搭好啦！'],
  stages:['cross-3d','grid-1','grid-2','grid-3','grid-4'].map(id=>subset(grid,MODELS[id].balls))},
 19:{model:'lattice-5',height:39,
  labels:['从一小块晶体开始','左侧添一层','右侧添一层','下方添一层','上方添一层','后方添一层','前方添一层：小晶体长大了'],
  stages:layerBounds.map(bounds=>LATTICE_MODEL.balls.flatMap((p,i)=>p.every((x,k)=>{
   const v=(x-center[k])/spacing;return v>=bounds[k*2]-1e-7&&v<=bounds[k*2+1]+1e-7;
  })?[i]:[]))}
};
export function stageInfo(page,step){
 const spec=ASSEMBLIES[page],balls=spec.stages[step],model=spec.model==='lattice-5'?LATTICE_MODEL:MODELS[spec.model];
 const set=new Set(balls);
 return {...spec,balls,struts:model.struts.flatMap((e,i)=>set.has(e.a)&&set.has(e.b)?[i]:[]),label:spec.labels[step]};
}
// The shared particles are the intersection of blue-rod nearest neighbours,
// not a hand-picked pair of visually overlapping balls.
const shared=MODELS['shared-octa'];
export const SHARED_CENTERS=shared.ballColors.flatMap((c,i)=>c==='black'?[i]:[]);
const neighbors=i=>new Set(shared.struts.filter(e=>e.color==='BLUE'&&(e.a===i||e.b===i)).map(e=>e.a===i?e.b:e.a));
export const SHARED_BALLS=[...neighbors(SHARED_CENTERS[0])].filter(i=>neighbors(SHARED_CENTERS[1]).has(i));
