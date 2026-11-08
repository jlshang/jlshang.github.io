/* Lightweight, synthesized interaction cues; no audio is created until a gesture. */
(function(root){
'use strict';
function createSound(Ctor){
 let enabled=true,ctx=null;
 const profiles={reveal:[620,830,.105],select:[520,680,.075],nav:[440,520,.07],reset:[560,420,.085]};
 const ignore=p=>{if(p&&typeof p.catch==='function')p.catch(()=>{});};
 function play(kind='select'){
  if(!enabled||!Ctor)return false;
  try{
   ctx=ctx||new Ctor();if(ctx.state==='suspended')ignore(ctx.resume());
   const [start,end,duration]=profiles[kind]||profiles.select;
   const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime;
   osc.type='sine';osc.frequency.setValueAtTime(start,t);osc.frequency.exponentialRampToValueAtTime(end,t+duration);
   gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(.025,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
   osc.connect(gain);gain.connect(ctx.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};
   osc.start(t);osc.stop(t+duration+.01);return true;
  }catch(_){return false;}
 }
 function setEnabled(value){enabled=!!value;if(!enabled&&ctx&&ctx.state==='running'){try{ignore(ctx.suspend());}catch(_){}}}
 return {play,setEnabled,isEnabled:()=>enabled};
}
if(typeof module!=='undefined'&&module.exports)module.exports=createSound;
else root.createCourseSound=createSound;
})(typeof window!=='undefined'?window:globalThis);
