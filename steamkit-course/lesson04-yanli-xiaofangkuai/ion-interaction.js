// Deterministic teaching animation adapted from the original 17-second video.
// Not a physics simulation: force exists before contact; radii/timing are illustrative.
let dispose=()=>{};
export const cleanupIonInteraction=()=>{dispose();dispose=()=>{};};
export function ionMarkup(){return `<section class="ion-lab" data-phase="emerging" data-count="2" aria-label="钠钠与氯氯的相吸相斥互动"><svg viewBox="0 0 1200 470" role="img" aria-label="小个子钠钠和大个子氯氯"><defs><radialGradient id="lab-na" cx="30%" cy="24%"><stop stop-color="#858d97"/><stop offset=".55" stop-color="#454a51"/><stop offset="1" stop-color="#282d35"/></radialGradient><radialGradient id="lab-cl" cx="30%" cy="24%"><stop stop-color="#fff"/><stop offset=".55" stop-color="#f0f0ed"/><stop offset="1" stop-color="#bcc5d0"/></radialGradient></defs><g class="ion-actors"></g><text class="pair-names" x="280" y="420" text-anchor="middle">小个子“钠钠”</text><text class="pair-names" x="920" y="420" text-anchor="middle">大个子“氯氯”</text></svg><p class="ion-result" role="status"></p><div class="ion-choices"><button data-pair="na-na">钠钠碰钠钠</button><button data-pair="cl-cl">氯氯碰氯氯</button><button data-pair="na-cl">钠钠碰氯氯</button></div></section>`;}
export function bindIonInteraction(){
 cleanupIonInteraction();
 const root=document.querySelector('.ion-lab');if(!root)return;
 const actors=root.querySelector('.ion-actors'),result=root.querySelector('.ion-result'),names=root.querySelectorAll('.pair-names');
 let frame=0,dead=false;const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 function paint(items){actors.innerHTML=items.map(({kind,x,r,y=230,opacity=1,arrow=''})=>`<g class="lab-ion" data-kind="${kind}" data-x="${x.toFixed(2)}" transform="translate(${x} ${y})" opacity="${opacity}"><circle r="${r}" fill="url(#lab-${kind})" stroke="#9aa8bb" stroke-width="2"/><text y="10" text-anchor="middle" fill="${kind==='na'?'white':'#26364d'}" font-size="27" font-weight="700">${kind==='na'?'钠钠':'氯氯'}</text>${arrow?`<text x="${arrow==='←'?-r-45:r+45}" y="14" text-anchor="middle" fill="#efb16e" font-size="42">${arrow}</text>`:''}</g>`).join('');root.dataset.count=items.length;}
 const introStart=performance.now();
 root.dataset.busy='true';root.querySelectorAll('button').forEach(b=>b.disabled=true);
 function emerge(now){
  if(dead||!root.isConnected)return;
  const t=reduce()?1:smooth((now-introStart)/1000);
  paint([{kind:'na',x:600-320*t,y:240-10*t,r:79*(.18+.82*t),opacity:t},{kind:'cl',x:600+320*t,y:240-10*t,r:115*(.18+.82*t),opacity:t}]);
  if(t<1)frame=requestAnimationFrame(emerge);
  else{root.dataset.phase='intro';root.dataset.busy='false';root.querySelectorAll('button').forEach(b=>b.disabled=false);}
 }
 emerge(introStart);
 function run(kind){
  cancelAnimationFrame(frame);names.forEach(e=>e.style.display='none');
  root.dataset.case=kind;root.dataset.busy='true';root.dataset.phase='approach';result.textContent='';
  root.querySelectorAll('[data-pair]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pair===kind)));
  const mixed=kind==='na-cl',a=kind.split('-')[0],b=kind.split('-')[1],start=performance.now();
  const ra=a==='na'?50:70,rb=b==='na'?50:70;
  function tick(now){
   if(dead||!root.isConnected)return;
   const elapsed=reduce()?8000:now-start;
   if(!mixed){
    const close=ra+rb+12;let d;
    if(elapsed<800)d=520+(close-520)*smooth(elapsed/800);
    else d=close+(660-close)*smooth((elapsed-800)/700);
    const away=elapsed>=800;root.dataset.phase=away?'repel':'approach';
    result.textContent=away?'同种离子，互相排斥':'';
    paint([{kind:a,x:600-d/2,r:ra,arrow:away?'←':''},{kind:b,x:600+d/2,r:rb,arrow:away?'→':''}]);
    if(elapsed<1500)frame=requestAnimationFrame(tick);else root.dataset.busy='false';
   }else{
    if(elapsed<1000){const d=520+(140-520)*smooth(elapsed/1000);paint([{kind:a,x:600-d/2,r:ra,arrow:'→'},{kind:b,x:600+d/2,r:rb,arrow:'←'}]);result.textContent='不同种离子，互相吸引';}
    else{
     root.dataset.phase='extend';result.textContent='钠钠、氯氯，交替排下去';
     const grown=Math.min(6,Math.floor((elapsed-1000)/650)),n=2+grown,t=smooth(((elapsed-1000)%650)/650),items=[];
     const left=600-(n-1)*70;
     for(let i=0;i<n;i++)items.push({kind:i%2?'cl':'na',x:left+i*140,r:i%2?70:50});
     if(n<8)items.push({kind:n%2?'cl':'na',x:left+n*140+110*(1-t),r:n%2?70:50,opacity:t});
     paint(items);
    }
    if(elapsed<4900)frame=requestAnimationFrame(tick);else{root.dataset.busy='false';root.dataset.phase='complete';}
   }
  }
  tick(start);
 }
 const buttons=[...root.querySelectorAll('[data-pair]')];const listeners=buttons.map(button=>{const fn=()=>run(button.dataset.pair);button.addEventListener('click',fn);return [button,fn];});
 dispose=()=>{dead=true;cancelAnimationFrame(frame);listeners.forEach(([b,f])=>b.removeEventListener('click',f));};
}
