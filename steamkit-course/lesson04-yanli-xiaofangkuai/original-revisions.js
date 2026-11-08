/* Requested amendments to the accepted ORIGINAL edition only. */
(() => {
 // Original illustrated artwork, clipped into its existing hanging units.
 // Never typeset replacement letters: 小方块 stays ONE plaque, including its cords.
 function cover(){
  const pieces=[
   ['salt','盐','M237 103H250V181Q257 191 252 219L282 213L292 239Q323 246 325 274L316 305Q342 360 311 373L197 383Q157 377 160 340L170 300Q160 282 174 270Q157 245 178 231L215 220L231 220V181H237Z'],
   ['grain','粒','M388 0H400V173Q411 181 403 205L419 219Q460 198 483 225Q505 228 506 252L498 282Q525 341 492 356L420 373Q392 368 376 361Q343 364 335 340L343 295Q328 274 342 257Q330 238 351 225L360 209L382 199V174H388Z'],
   ['why','为','M552 0H565V176Q574 184 566 207Q587 192 610 209L624 231Q661 234 665 269L658 317Q654 360 628 368L581 360L552 351Q532 366 511 346L506 324L526 282Q506 276 512 248L527 221L548 209V177H552Z'],
   ['what','什','M710 0H723V188Q733 195 724 223L758 220Q800 216 801 252V266Q831 278 818 308L799 318L799 347Q790 373 764 372L738 357Q694 376 688 346V311Q654 300 663 278L700 226V191H710Z'],
   ['reason','么','M873 0H885V196Q896 205 886 235L910 245Q941 254 939 281L955 311Q975 344 950 360L900 369L861 369Q823 364 827 334L839 313Q812 301 825 273L855 239L864 228V199H873Z'],
   ['is','是','M1020 0H1033V190Q1044 198 1034 222L1054 222Q1072 238 1070 263L1080 278L1082 305Q1103 330 1078 351L1053 362L991 357Q966 366 950 344L959 314L958 296Q957 277 971 268L969 249Q964 223 990 218L1014 216V192H1020Z'],
   ['plaque','小方块','M521 347H533V385Q541 390 535 404L547 412L782 398L791 378V313H806V376Q816 383 808 395L820 400L835 399Q862 400 867 429L872 513Q871 543 840 546L502 559Q466 556 465 527L456 450Q454 419 482 412L509 410L518 399Q509 390 521 383Z'],
   ['question','？','M901 417Q916 390 959 389Q1012 387 1033 430Q1050 468 1016 501L980 522L968 544Q975 580 943 597Q909 609 888 579Q874 551 898 526L909 509Q905 486 933 466L948 456Q941 441 932 457Q909 473 894 452Z']
  ];
  const source='media/page01-reference-cover.png';
  return `<section class="page01-cover dc-animated-cover" data-ready="false"><img class="dark-cover-logo" src="assets/p01-shape5.png" alt="Zometool"><img class="dark-cover-rabbit" src="media/cover-rabbit.png" alt="原封面拿放大镜的黄色兔子" draggable="false"><img class="dc-cover-art-source" src="${source}" alt="" aria-hidden="true"><svg class="dc-cover-art" viewBox="0 0 1667 943" preserveAspectRatio="xMidYMid meet" role="img" aria-label="盐粒为什么是小方块？"><defs>${pieces.map(([id,,path])=>`<clipPath id="cover-tag-${id}"><path d="${path}"/></clipPath>`).join('')}</defs><g class="dc-cover-scale" transform="translate(15 0) scale(.94)">${pieces.map(([id,label],i)=>`<g class="dc-cover-tag" data-tag="${id}" data-label="${label}" style="--drop-delay:${(i*.14).toFixed(2)}s"><image href="${source}" width="1667" height="943" clip-path="url(#cover-tag-${id})"/></g>`).join('')}</g></svg></section>`;
 }
 // Reuse page7's original character pixels. Only its face/sign and pose are
 // code overlays; this is not a newly generated mascot or a new model.
 function choiceRabbit(){
  return `<div class="dc-choice-rabbit" data-phase="hidden" data-mood="" aria-hidden="true"><svg viewBox="0 0 430 420">
   <defs><clipPath id="dc-rabbit-body"><path d="M0 265H260V410H0Z"/></clipPath><clipPath id="dc-rabbit-head"><path d="M0 0H260V237L236 251L207 253L169 267L110 278H0Z"/></clipPath></defs>
   <g class="dc-rabbit-facing"><g class="dc-rabbit-bounce"><image href="media/question-still.png" width="333" height="391" clip-path="url(#dc-rabbit-body)"/>
   <g class="dc-rabbit-head"><image href="media/question-still.png" width="333" height="391" clip-path="url(#dc-rabbit-head)"/>
   <g class="dc-rabbit-smile"><ellipse cx="182" cy="198" rx="20" ry="14" fill="#ffe000"/><path d="M168 191Q183 202 199 187Q193 225 176 208Z" fill="#613000"/><path d="M177 205Q185 199 193 204Q185 215 177 205" fill="#f48769"/><ellipse cx="116" cy="219" rx="15" ry="8" fill="#f4a83e"/><ellipse cx="222" cy="189" rx="12" ry="7" fill="#f4a83e"/></g></g>
   <g class="dc-rabbit-sign"><path d="M285 238V373" stroke="#9a652b" stroke-width="15" stroke-linecap="round"/><rect x="228" y="151" width="142" height="118" rx="19" fill="#fffdf5" stroke="currentColor" stroke-width="7"/><text x="299" y="242" text-anchor="middle" font-size="96" font-family="Arial,sans-serif" font-weight="bold" fill="currentColor" data-rabbit-symbol></text><ellipse cx="263" cy="298" rx="26" ry="17" transform="rotate(-20 263 298)" fill="#ffd500"/></g></g></g></svg></div>`;
 }
 let sceneCleanup=()=>{};
 function cleanupScene(){sceneCleanup();sceneCleanup=()=>{};}
 function bindPhotoChoices(root){
  const rabbit=root.querySelector('.dc-choice-rabbit'),symbol=root.querySelector('[data-rabbit-symbol]'),status=root.querySelector('[data-choice-status]');
  const buttons=[...root.querySelectorAll('[data-photo-choice]')],timers=new Set();
  let disposed=false;
  const cancel=()=>{timers.forEach(clearTimeout);timers.clear();};
  const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(!disposed&&root.isConnected)fn();},ms);timers.add(id);};
  const choose=e=>{
   cancel();
   const happy=e.currentTarget.dataset.photoChoice==='left';
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===e.currentTarget)));
   symbol.textContent=happy?'√':'X';
   status.textContent=happy?'小兔举起对号，很高兴。':'小兔举起叉号，失望地摇头后离开。';
   rabbit.dataset.mood=happy?'happy':'sad';
   // Reset animation before replaying, even if the same picture was clicked.
   rabbit.dataset.phase='hidden';void rabbit.getBoundingClientRect();
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   rabbit.dataset.phase=reduced?'reacting':'entering';
   if(!reduced)later(()=>rabbit.dataset.phase='reacting',460);
   if(!happy){
    later(()=>rabbit.dataset.phase=reduced?'hidden':'leaving',2260);
    if(!reduced)later(()=>rabbit.dataset.phase='hidden',2780);
   }
  };
  buttons.forEach(b=>b.addEventListener('click',choose));
  return ()=>{disposed=true;cancel();buttons.forEach(b=>b.removeEventListener('click',choose));};
 }
 function bindScene(){
  cleanupScene();
  const cover=document.querySelector('.dc-animated-cover');
  if(cover){
   const images=[...cover.querySelectorAll('img')],source=cover.querySelector('.dc-cover-art-source');
   const ready=()=>{
    if(!cover.isConnected||!images.every(i=>i.complete&&i.naturalWidth>0))return;
    // Asset recovery may replace the preload URL with a retry URL.
    cover.querySelectorAll('.dc-cover-tag image').forEach(i=>i.setAttribute('href',source.currentSrc||source.src));
    cover.dataset.ready='true';
   };
   images.forEach(i=>i.addEventListener('load',ready));ready();
   sceneCleanup=()=>images.forEach(i=>i.removeEventListener('load',ready));
  }
  const choices=document.querySelector('.dc-photo-choice-scene:not(.v3-micro)');
  if(choices)sceneCleanup=bindPhotoChoices(choices);
 }

 function photos(slide){
  return `<section class="dc-photo-choice-scene"><div class="dc-photo-duo">${['5','6'].map((id,i)=>{const p=slide.pictures.find(p=>p.id===id);return `<figure style="left:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px"><button type="button" class="dc-photo-choice" data-photo-choice="${i?'right':'left'}" aria-label="选择${i?'右':'左'}侧显微照片" aria-pressed="false"><img src="${p.src}" alt="原课件${i?'右':'左'}侧显微照片" draggable="false"></button></figure>`;}).join('')}</div>${choiceRabbit()}<span class="dc-choice-status" data-choice-status role="status" aria-live="polite"></span></section>`;
 }
 window.originalRevisions={cover,photos,bindScene,cleanupScene};
})();
