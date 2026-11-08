// Display choreography only, not a validated physical assembly sequence.
// Every part translates rigidly along a real incident rod axis; no scaling.
export function planInsertion(model,previous,target,snapshot={},strutIndices=null){
 const allowed=new Set(target),known=new Set(previous.filter(i=>allowed.has(i)));
 const targetStruts=model.struts.flatMap((e,i)=>allowed.has(e.a)&&allowed.has(e.b)&&(strutIndices===null||strutIndices.includes(i))?[i]:[]);
 const oldStruts=new Set((snapshot.visibleStruts??targetStruts.filter(i=>known.has(model.struts[i].a)&&known.has(model.struts[i].b))).filter(i=>targetStruts.includes(i)));
 const entries=[],ready=new Map([...known].map(i=>[i,0])),used=new Set();
 const vector=(a,b,f)=>model.balls[b].map((v,k)=>(v-model.balls[a][k])*f);
 for(const [part,indices,offsets] of [['ball',[...known],snapshot.ballOffsets],['strut',[...oldStruts],snapshot.strutOffsets]]){
  for(const index of indices){
   const offset=offsets?.[index];
   if(offset?.some(v=>Math.abs(v)>1e-8)){
    entries.push({part,index,offset:[...offset],start:0,duration:380});
    if(part==='ball')ready.set(index,380);
   }
  }
 }
 // A breadth-first attachment order keeps each new branch rooted in existing parts.
 let pending=target.filter(i=>!known.has(i)),wave=0;
 if(!known.size&&pending.length){known.add(pending.shift());ready.set([...known][0],0);}
 const initialBalls=[...known];
 while(pending.length){
  const roots=new Set(known),next=[];let attached=0;
  for(const index of pending){
   const edgeIndex=model.struts.findIndex((e,i)=>targetStruts.includes(i)&&((e.a===index&&roots.has(e.b))||(e.b===index&&roots.has(e.a))));
   if(edgeIndex<0){next.push(index);continue;}
   const edge=model.struts[edgeIndex],anchor=edge.a===index?edge.b:edge.a;
   const start=(ready.get(anchor)||0)+(attached%5)*35,offset=vector(anchor,index,.85);
   // A support rod may already be moving while its ball has not entered yet.
   // Resume its snapshot entry instead of restarting it at the approach offset.
   if(!oldStruts.has(edgeIndex))entries.push({part:'strut',index:edgeIndex,offset,start,duration:380});
   entries.push({part:'ball',index,offset,start:start+310,duration:420});
   used.add(edgeIndex);known.add(index);ready.set(index,start+730);attached++;
  }
  if(!attached)throw Error('Insertion target must be connected to the previous assembly');
  pending=next;wave++;
 }
 for(const index of targetStruts){
  if(oldStruts.has(index)||used.has(index))continue;
  const e=model.struts[index],start=Math.max(ready.get(e.a)||0,ready.get(e.b)||0)+50;
  entries.push({part:'strut',index,offset:vector(e.a,e.b,.55),start,duration:380});
 }
 return {initialBalls,initialStruts:[...oldStruts].filter(i=>targetStruts.includes(i)),
  balls:[...target],struts:targetStruts,entries,
  duration:Math.max(0,...entries.map(e=>e.start+e.duration))};
}
export function sampleInsertion(plan,elapsed){
 if(elapsed>=plan.duration)return {visibleBalls:plan.balls,visibleStruts:plan.struts,ballOffsets:{},strutOffsets:{},done:true};
 const balls=new Set(plan.initialBalls),struts=new Set(plan.initialStruts),ballOffsets={},strutOffsets={};
 for(const e of plan.entries){
  if(elapsed<e.start)continue;
  const t=Math.min(1,Math.max(0,(elapsed-e.start)/e.duration)),remaining=1-t*t*(3-2*t);
  (e.part==='ball'?balls:struts).add(e.index);
  (e.part==='ball'?ballOffsets:strutOffsets)[e.index]=e.offset.map(v=>v*remaining);
 }
 return {visibleBalls:[...balls],visibleStruts:[...struts],ballOffsets,strutOffsets,done:false};
}
