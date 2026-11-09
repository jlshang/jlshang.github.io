// Yellow Zometool strut from vZome's lifelike part (same source as lesson 11), placed with icosahedral symmetry.
import * as T from './vendor/three.module.js';
const Y={"v": [0.25464, 0.97568, -0.19098, 0.19098, 1.0, -0.30902, 0.69098, 0.80902, 0.0, 0.56366, 0.85765, 0.0, -0.42705, -0.5, 0.0, 0.0, 1.0, 0.0, 0.5, 0.80902, -0.30902, -0.5, -0.80902, -0.30902, -0.5, -0.80902, 0.30902, 0.19098, 1.0, 0.30902, 0.0, -1.0, 0.0, 0.5, 0.80902, 0.30902, -0.19098, -1.0, 0.30902, -0.69098, -0.80902, 0.0, -0.25464, -0.97568, 0.19098, -0.19098, -1.0, -0.30902, -0.25464, -0.97568, -0.19098, -0.11803, -0.61803, -0.19098, -0.56366, -0.85765, 0.0, 0.0, 0.0, 0.0, 0.25464, 0.97568, 0.19098, -0.11803, -0.61803, 0.19098, 0.11803, 0.61803, -0.19098, 0.11803, 0.61803, 0.19098, 0.42705, 0.5, 0.0], "t": [0, 1, 2, 0, 2, 3, 5, 6, 7, 7, 8, 5, 9, 2, 10, 9, 10, 8, 2, 1, 7, 2, 7, 10, 5, 11, 12, 5, 12, 13, 14, 12, 15, 14, 15, 16, 17, 16, 18, 17, 18, 4, 10, 7, 6, 11, 5, 8, 20, 9, 1, 20, 1, 0, 6, 5, 13, 6, 13, 15, 4, 21, 17, 1, 9, 8, 1, 8, 7, 3, 2, 9, 3, 9, 20, 16, 15, 13, 16, 13, 18, 20, 0, 22, 20, 22, 23, 3, 20, 23, 3, 23, 24, 18, 13, 12, 18, 12, 14, 8, 10, 11, 23, 22, 24, 21, 14, 16, 21, 16, 17, 4, 18, 14, 4, 14, 21, 11, 6, 15, 11, 15, 12, 6, 11, 10, 0, 3, 24, 0, 24, 22], "tipSet": [4, 12, 13, 14, 15, 16, 17, 18, 19, 21], "midSet": [10, 7, 6, 8, 11, 5], "dir": [1.618033988749895, 4.23606797749979, 0.0]};
const PHI=(1+Math.sqrt(5))/2;let GROUP=null;
function icoGroup(){
 if(GROUP)return GROUP;const p=PHI,ip=1/PHI;
 const gens=[new T.Matrix3().set(0,0,1,1,0,0,0,1,0),new T.Matrix3().set(-1,0,0,0,-1,0,0,0,1),new T.Matrix3().set(.5,-p/2,ip/2,p/2,ip/2,-.5,ip/2,.5,p/2)];
 const key=m=>m.elements.map(x=>x.toFixed(4)).join();const out=[new T.Matrix3()],seen=new Set([key(out[0])]);
 for(let i=0;i<out.length&&out.length<60;i++)for(const g of gens){const m=new T.Matrix3().multiplyMatrices(g,out[i]);const k=key(m);if(!seen.has(k)){seen.add(k);out.push(m);}}
 return GROUP=out;
}
function rotFor(from,to){const f=from.clone().normalize(),t=to.clone().normalize();let best=null,bd=-2;for(const m of icoGroup()){const d=f.clone().applyMatrix3(m).dot(t);if(d>bd){bd=d;best=m;}}return best;}
export function yellowStrut(a,b){
 const A=new T.Vector3(...a),L=new T.Vector3(...b).sub(A),R=rotFor(new T.Vector3(...Y.dir),L);
 const tip=new Set(Y.tipSet),mid=new Set(Y.midSet),full=new T.Vector3(...Y.dir),pos=[];
 for(let i=0;i<Y.v.length/3;i++){const v=new T.Vector3(Y.v[3*i],Y.v[3*i+1],Y.v[3*i+2]).applyMatrix3(R).add(A);
  if(tip.has(i))v.add(L);else if(mid.has(i))v.addScaledVector(L,.5);pos.push(v.x,v.y,v.z);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(Y.t);
 const n=g.toNonIndexed();n.computeVertexNormals();return n;
}
