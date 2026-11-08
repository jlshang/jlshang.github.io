/* Teacher-controlled photo layers. No original full photo underneath the empty table. */
(() => {
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function render(s){
  const finished=s.step>0;
  return `
   <div class="p02-paper" aria-hidden="true"><svg class="p02-waves" viewBox="0 0 1600 900" preserveAspectRatio="none"><path class="p02-wave-back" d="M0 694C155 735 250 771 405 787S712 842 901 810S1245 807 1397 739S1531 651 1600 674V900H0Z"/><path class="p02-wave-front" d="M0 773C148 700 314 756 475 804S650 773 854 797S1080 880 1252 819S1455 721 1600 747V900H0Z"/></svg></div>
   <span class="p02-kicker">猜一猜</span><h1 class="p02-title">厨房里有一瓶白色的调料</h1><span class="p02-page-number" aria-hidden="true">02</span>
   <section class="p02-scene p02-manual p02-loading" data-poured="${finished}" aria-label="拖动调料瓶倾斜倒盐，松手停止">
    <img class="p02-background" src="media/page02-photo/background.webp" alt="">
    <div class="p02-bottle"><img src="media/page02-photo/bottle-complete.png" alt="玻璃调料瓶" draggable="false"></div>
    <img class="p02-pile" style="opacity:${finished?1:0};transform:scale(${finished?1:0})" src="media/page02-photo/salt.png" alt="${finished?'倒出的白色颗粒':''}" draggable="false">
    <svg class="p02-manual-grains" viewBox="0 0 1015 674" aria-hidden="true">${Array.from({length:20},(_,i)=>`<circle cx="${552+i%5*3}" cy="${318+i%7*9}" r="${1.4+i%3*.5}" style="--fall-delay:${-i*.071}s"/>`).join('')}</svg>
    ${!finished?'<button class="p02-bottle-handle" aria-label="向右拖动调料瓶倒盐；也可按住空格或回车，松开停止"></button>':''}
   </section>
   ${!finished?'<p class="p02-drag-hint">拖动瓶子，倒一倒。</p>':''}
   ${finished?'<p class="p02-question" role="status">你能区分这是糖还是盐吗？</p>':''}`;
 }
 // Pure controller state: only an explicit tilt/play action can produce grains.
 function createState(){
  let amount=0,angle=0,automatic=false,done=false;
  return {
   tilt(value){if(!done){automatic=false;angle=clamp(value,0,120);}},
   play(){if(!done){automatic=true;angle=120;}},
   stop(){automatic=false;angle=0;},
   tick(ms){if(!done&&angle>=100){amount=clamp(amount+clamp(ms,0,80)/1300,0,1);if(amount===1){done=true;angle=0;automatic=false;}}return this.snapshot();},
   snapshot(){return {amount,angle,automatic,done,pouring:!done&&angle>=100};}
  };
 }
 function bind(scene,{onFinish,canInteract=()=>true,onActivity=()=>{}}){
  const handle=scene.querySelector('.p02-bottle-handle');
  if(!handle)return {play(){},dispose(){}};
  const bottle=scene.querySelector('.p02-bottle'),pile=scene.querySelector('.p02-pile');
  const state=createState();let frame=0,last=0,disposed=false,pointer=null,startX=0,notified=false;
  const listeners=[];
  function listen(el,type,fn){el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));}
  function ready(){return !disposed&&scene.isConnected&&!scene.classList.contains('p02-loading')&&canInteract();}
  function paint(){
   const s=state.snapshot(),t=s.angle/120;
   bottle.style.transform=`translate(${3.9409*t}%,${-23.7389*t}%) rotate(${s.angle}deg)`;
   pile.style.opacity=s.amount>0?'1':'0';
   pile.style.transform=`scale(${Math.sqrt(s.amount)})`;
   scene.classList.toggle('p02-manual-pouring',s.pouring);
   scene.dataset.pourAmount=String(s.amount);scene.dataset.poured=String(s.done);
   onActivity(s.pouring||s.automatic);
  }
  function cancel(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}
  function stop(){cancel();state.stop();paint();}
  function tick(now){
   frame=0;if(!ready()){stop();return;}
   const s=state.tick(last?now-last:0);last=now;paint();
   if(s.done){if(!notified){notified=true;onFinish();}return;}
   if(s.pouring)frame=requestAnimationFrame(tick);
  }
  function schedule(){paint();if(state.snapshot().pouring&&!frame){last=0;frame=requestAnimationFrame(tick);}}
  function release(e){
   if(pointer===null||e.pointerId!==pointer)return;
   const id=pointer;pointer=null;stop();
   if(handle.hasPointerCapture?.(id))handle.releasePointerCapture(id);
  }
  listen(handle,'pointerdown',e=>{
   if(!ready()||e.button!==0||pointer!==null)return;
   e.preventDefault();stop();pointer=e.pointerId;startX=e.clientX;handle.setPointerCapture(pointer);
  });
  listen(handle,'pointermove',e=>{
   if(pointer!==e.pointerId||!ready())return;
   const width=scene.getBoundingClientRect().width;
   state.tilt((e.clientX-startX)/Math.max(1,width)*640);schedule();
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(handle,type,release);
  listen(handle,'keydown',e=>{
   if(e.key!==' '&&e.key!=='Enter')return;
   e.preventDefault();e.stopPropagation();if(!ready()||e.repeat)return;
   state.tilt(120);schedule();
  });
  listen(handle,'keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();e.stopPropagation();stop();}});
  listen(handle,'blur',stop);
  listen(window,'blur',stop);
  listen(document,'visibilitychange',()=>{if(document.hidden)stop();});
  paint();
  return {play(){if(ready()){state.play();schedule();}},dispose(){disposed=true;cancel();state.stop();listeners.forEach(f=>f());},snapshot:()=>state.snapshot()};
 }
 window.photoPour={render,createState,bind};
})();
