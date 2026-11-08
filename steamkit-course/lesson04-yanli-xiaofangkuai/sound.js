/* Course sounds: real CC0 recordings from the project library (sfx/, see CREDITS.txt),
   with a short synthesized fallback when a file cannot play. No audio starts before a user gesture. */
(function(root){
'use strict';
// Every file path is written out literally so the single-file packer can map it.
const FILES={
 page1:'sfx/page1.mp3',page2:'sfx/page2.mp3',page3:'sfx/page3.mp3',
 swoosh:'sfx/swoosh.mp3',whoosh:'sfx/whoosh.mp3',magic:'sfx/magic.mp3',sparkle:'sfx/sparkle.mp3',
 plop:'sfx/plop.mp3',pop:'sfx/pop.mp3',click:'sfx/click.mp3',tick:'sfx/tick.mp3',
 correct:'sfx/correct.mp3',bell:'sfx/bell.mp3',boing:'sfx/boing.mp3',yay:'sfx/yay.mp3',fanfare:'sfx/fanfare.mp3'
};
// Lesson-level cue names -> one or more files (an array plays in sequence with a small offset).
const CUES={
 page:['page1','page2','page3'],          // rotates so page turns don't sound identical
 chapter:[['swoosh',0],['magic',260]],     // chapter title pages
 model:[['whoosh',0]],                     // pages that open with a 3D model entrance
 cover:[['sparkle',0]],
 finish:[['bell',0]],
 nav:['page1','page2','page3'],
 select:[['plop',0]],pin:[['pop',0]],tick:[['tick',0]],click:[['click',0]],
 reveal:[['pop',0]],step:[['pop',0]],plus:[['pop',0],['tick',120]],
 correct:[['correct',0]],good:[['bell',0]],wrong:[['boing',0]],reset:[['click',0]],
 snap:[['plop',0]],repel:[['boing',0]],cheer:[['yay',0],['magic',150]],grow:[['magic',0]]
};
const VOL={page1:.55,page2:.55,page3:.55,swoosh:.5,whoosh:.45,magic:.45,sparkle:.5,plop:.6,pop:.6,click:.5,tick:.45,correct:.55,bell:.45,boing:.45,yay:.45,fanfare:.4};
function createSound(Ctor){
 let enabled=true,ctx=null,turn=0;const pool={};
 const ignore=p=>{if(p&&typeof p.catch==='function')p.catch(()=>{});};
 const profiles={reveal:[620,830,.105],select:[520,680,.075],nav:[440,520,.07],reset:[560,420,.085]};
 function synth(kind){
  if(!Ctor)return false;
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
 function file(name,kind){
  if(typeof Audio==='undefined')return synth(kind);
  try{
   const base=pool[name]||(pool[name]=new Audio(FILES[name]));
   const a=base.paused?base:base.cloneNode();a.volume=VOL[name]??.5;a.currentTime=0;
   const p=a.play();if(p&&p.catch)p.catch(()=>synth(kind));return true;
  }catch(_){return synth(kind);}
 }
 function play(kind='select'){
  if(!enabled)return false;
  const cue=CUES[kind]||CUES.select;
  if(typeof cue[0]==='string'){const name=cue[turn++%cue.length];return file(name,kind);}
  cue.forEach(([name,delay])=>delay?setTimeout(()=>enabled&&file(name,kind),delay):file(name,kind));
  return true;
 }
 function setEnabled(value){enabled=!!value;if(!enabled){Object.values(pool).forEach(a=>{try{a.pause();}catch(_){}});if(ctx&&ctx.state==='running'){try{ignore(ctx.suspend());}catch(_){}}}}
 return {play,setEnabled,isEnabled:()=>enabled};
}
if(typeof module!=='undefined'&&module.exports)module.exports=createSound;
else root.createCourseSound=createSound;
})(typeof window!=='undefined'?window:globalThis);
