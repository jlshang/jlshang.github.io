// Navigation-only macro → microscope reveal. The micro photos are the existing quiz images.
let active=null;
export function cancelMicroscopeTransition(){
 if(!active)return;
 const {overlay,slide,animations}=active;active=null;
 animations.forEach(a=>a.cancel());overlay.remove();slide.inert=false;
 document.querySelector('#stage').dataset.microscopeTransition='idle';
}
export function enterMicroscope(snapshot){
 cancelMicroscopeTransition();
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const stage=document.querySelector('#stage'),slide=document.querySelector('#slide');
 const overlay=document.createElement('div');overlay.className='microscope-transition';overlay.setAttribute('aria-hidden','true');
 snapshot.removeAttribute('id');snapshot.className='slide dark microscope-macro';
 snapshot.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
 const lens=document.createElement('div');lens.className='microscope-lens';overlay.append(snapshot,lens);stage.append(overlay);slide.inert=true;
 const opts={duration:1900,fill:'both',easing:'linear'};
 const animations=[
 snapshot.animate([{transform:'translateY(0) scale(1)',opacity:1,offset:0},{transform:'translateY(-108px) scale(4.8)',opacity:1,offset:.45},{transform:'translateY(-108px) scale(5.2)',opacity:0,offset:.60},{transform:'translateY(-108px) scale(5.2)',opacity:0}],opts),
 lens.animate([{'--aperture':'1000px',opacity:0,offset:0},{'--aperture':'250px',opacity:1,offset:.32},{'--aperture':'0px',opacity:1,offset:.50},{'--aperture':'0px',opacity:1,offset:.55},{'--aperture':'1100px',opacity:0,offset:1}],opts),
 slide.animate([{opacity:0,clipPath:'circle(0% at 50% 50%)',offset:0},{opacity:0,clipPath:'circle(0% at 50% 50%)',offset:.50},{opacity:1,clipPath:'circle(12% at 50% 50%)',offset:.63},{opacity:1,clipPath:'circle(100% at 50% 50%)',offset:1}],opts)
 ];
 stage.dataset.microscopeTransition='entering';
 active={overlay,slide,animations};
 animations[2].finished.then(()=>{if(active?.overlay===overlay)cancelMicroscopeTransition();}).catch(()=>{});
}
