import {photoShapeMarkup} from './photo-shape-transition.js';
import {models} from './review-model.js';
import {stageInfo,SHARED_BALLS} from './assembly-stages.js';
import {coordinationStage} from './coordination-models.js';
import {bindIonInteraction,ionMarkup,cleanupIonInteraction} from './ion-interaction.js';
export const BATCH_MAX={7:1,31:2,32:3,35:0,36:4,37:1,38:0,39:1,40:1,41:0,42:3,43:0,44:2,46:1,47:0};
const all=m=>m.balls.map((_,i)=>i);
const defs=`<defs><radialGradient id="na" cx="30%" cy="25%"><stop stop-color="#818995"/><stop offset=".6" stop-color="#454a51"/><stop offset="1" stop-color="#282d35"/></radialGradient><radialGradient id="cl" cx="30%" cy="25%"><stop stop-color="#fff"/><stop offset=".6" stop-color="#f0f0ed"/><stop offset="1" stop-color="#bcc5d0"/></radialGradient></defs>`;
const sphere=(x,y,r,kind,label)=>`<g class="science-ion"><circle cx="${x}" cy="${y}" r="${r}" fill="${kind==='unknown'?'#faf7f0':`url(#${kind})`}" stroke="#92a2b8" stroke-width="2"/><text x="${x}" y="${y+10}" text-anchor="middle" fill="${kind==='na'?'#fff':'#26364d'}" font-size="${kind==='cl'?28:22}" font-weight="700">${label}</text></g>`;
const svg=body=>`<svg class="batch-native" viewBox="0 0 1600 900" role="img">${defs}${body}</svg>`;
function queue(s,small=false){
 let body='<path d="M193.75 421.25H1287.5" stroke="#8ca4bd" stroke-width="4"/>';
 for(let i=0;i<6;i++){
  const known=i<4||s>=i-3,kind=known?(i%2?'cl':'na'):'unknown';
  body+=sphere(193.75+218.75*i,421.25,known?(kind==='cl'?88.4:42.5):42.5,kind,known?(kind==='cl'?'氯氯':'钠钠'):'?');
 }
 return svg(body)+(!small?`<p class="queue-prompt">${s<2?'再往后，接下来是谁？':'钠钠、氯氯交替排列'}</p>${s<2?`<button class="queue-reveal" data-action="advance" style="left:${193.75+218.75*(s+4)-50}px" aria-label="揭晓第${s+1}个空位">?</button>`:''}`:'');
}
function neighbors(deck,s){
 const balls=deck.slides[11].geometry['9'].filter(s=>s.type==='ellipse'&&['#347BC4','#F5CA48'].includes(s.fill));
 const c=balls.find(s=>s.fill==='#347BC4'),cx=c.x+c.w/2,cy=c.y+c.h/2;
 let body='';
 [['33','38'],['13','48'],['28','43']].forEach((pair,j)=>pair.forEach(id=>{
  const b=balls.find(x=>x.id===id),x=b.x+b.w/2,y=b.y+b.h/2;
  body+=s>j?`<g class="neighbor-reveal"><path d="M${cx} ${cy}L${x} ${y}" stroke="#729fc3" stroke-width="4"/>${sphere(x,y,b.w/2,'cl','氯氯')}</g>`:`<circle cx="${x}" cy="${y}" r="${b.w/2}" fill="none" stroke="#728099" stroke-width="2" stroke-dasharray="5 9"/>`;
 }));
 return svg(body+sphere(cx,cy,c.w/2,'na','钠钠'))+`<div class="neighbor-counts">${['左右：2 个','前后：2 个','上下：2 个'].slice(0,s).map(t=>`<p>${t}</p>`).join('')}${s===3?'<p class="count-total">一共 6 个邻居</p>':s===0?'<p>先猜一猜<br>再按方向数一数</p>':''}</div>`;
}
function assembly(c,page){
 const {state:s,title,host,stepButtons}=c,info=stageInfo(page,s.step);
 if(page===14){
  const counts=['左右：2 个','上下：2 个','前后：2 个'].slice(0,s.step).map((t,i)=>`<p class="${s.forward!==false&&i===s.step-1?'pop':''}">${t}</p>`).join('');
  return title('搭一搭，数一数：几个邻居？')+`<p class="batch-caption">${info.label}</p>`+host('assembly',{id:info.model,balls:info.balls,struts:info.struts,height:info.height},'left:150px;top:225px;width:940px;height:570px')+`<div class="neighbor-tally">${s.step===0?'<p class="ask">黑球周围，<br>能接几颗白球？</p>':counts}${s.step===3?'<p class="tally-total pop">一共 6 个邻居！</p>':''}</div>`+stepButtons('接下一对');
 }
 return title('按同一个规律，继续向外搭')+`<p class="batch-caption">${info.label}</p>`+host('assembly',{id:info.model,balls:info.balls,struts:info.struts,height:info.height},'left:300px;top:225px;width:1000px;height:570px')+stepButtons('下一步');
}
function octaSpec(s){
 const m=models['octa-3'];
 const subset=s?models['octa-'+s].struts:m.struts.filter(e=>e.color==='BLUE');
 const struts=m.struts.flatMap((e,i)=>subset.some(q=>q.a===e.a&&q.b===e.b||q.b===e.a&&q.a===e.b)?[i]:[]);
 return {id:'octa-3',height:18,struts};
}
export function batchContent(c){
 const {state,title,host,modelScene,stepButtons,deck}=c,p=state.page,s=state.step;
 if(p===5)return `<span class="chapter-number">1</span><h1 class="chapter-title">盐里面，藏着什么？</h1><img class="chapter-art-std" src="media/ch1.png" alt="小兔举着放大镜看盐块，阿基米德爷爷在旁边思考（卡通形象）" draggable="false">`;
 if(p===6)return title('认识两位小伙伴')+(!s?'<img class="ions-heap" src="media/page09-salt/heap.png" alt="一小堆盐粒">':'<img class="ions-heap intro-heap" src="media/page09-salt/heap.png" alt="" aria-hidden="true">'+ionMarkup())+stepButtons('看看里面');
 if(p===31)return queue(s);
 if(p===32)return title('钠钠周围有多少个氯氯邻居？')+neighbors(deck,s)+stepButtons('继续探索');
 if(p===7){
  const cards=[['black','黑球代表钠','13 颗',4.6],['white','白球代表氯','14 颗',4.6],['blue','蓝色短棍 B0','54 根',9],['green','绿色短棍 G0','24 根',11]];
  return title('把材料准备好')+`<section class="materials-tray ${s?'unpacked':''}" data-unpacked="${!!s}"><img class="materials-box" src="media/steam-kit-reference.png" alt="原版STEAM Kit材料箱">${s?cards.map(([kind,label,num,height],i)=>`<article class="material-card" data-material="${kind}" style="--slot:${i};left:${380+i*275}px"><div class="material-visual">${host('part-'+kind,{id:'material-'+kind,height,yaw:kind==='green'?.6:0,pitch:kind==='green'?.25:0,...(['blue','green'].includes(kind)?{balls:[],struts:[0]}:{})},'left:0px;top:0px;width:250px;height:245px')}</div><h2>${label}</h2><p class="material-quantity">${num}</p></article>`).join(''):''}</section>`+stepButtons('拿出材料');
 }
 if(p===9)return assembly(c,14);
 if(p===35)return title('六个邻居搭好了，接下来呢？')+host('bridge',{id:'cross-3d',height:18,interactive:false},'left:125px;top:245px;width:650px;height:480px')+'<div class="bridge-copy-v2"><small>从局部到整体</small><h2>不改规律，<br>继续向外搭</h2></div>';
 if(p===36)return assembly(c,16);
 if(p===37)return title('真实粒子的相对大小示意')+'<div class="size-source"><img src="media/ion-size-right-only.png" alt="原图右半幅：钠离子与氯离子相对大小参考"></div><section class="size-compare"><h2>钠钠和氯氯，比比个头</h2><p>氯氯个头大，钠钠个头小</p></section>'+ (s?'<div class="extracted-ions" data-motion="extract"><div class="extract-na"><span>Na⁺</span></div><div class="extract-cl"><span>Cl⁻</span></div></div>':'')+stepButtons('对比大小');
 if(p===38){
  const m=models['lattice-5'],origin=m.balls[62],axis=[null,0,2,1][state.axis];
  const highlight=state.axis?m.balls.flatMap((p,i)=>p.every((v,k)=>k===axis||Math.abs(v-origin[k])<.01)?[i]:[]):[];
  return title('放进更大的晶格，规则还在吗？')+host('clear-lattice',{id:'lattice-5',height:34,yaw:.32,pitch:.18,focus:state.axis?highlight:null,ghostOpacity:.09},'left:90px;top:215px;width:970px;height:580px')+`<section class="lattice-guide"><h2>相邻的球，<br>颜色怎样排？</h2><div class="lattice-axis-row">${['左右','前后','上下'].map((t,i)=>`<button data-axis="${i+1}" aria-pressed="${state.axis===i+1}">${t}</button>`).join('')}</div></section>`;
 }
 if(p===39){
  const initial=stageInfo(19,0),full=stageInfo(19,6),spec=s?full:initial;
  const sharedView={id:'lattice-5',height:39,yaw:.42,pitch:.24,syncView:'growth-compare'};
  return title('小盐晶体，是怎样长大的？')+`<p class="batch-caption">${s?'整个外圈一起添一层':'从一小块晶体开始'}</p><section class="growth-comparison" data-phase="${s?'growing':'initial'}">`+host('growth',{...sharedView,balls:spec.balls,struts:spec.struts,transition:'shell'},'left:475px;top:235px;width:650px;height:540px')+host('growth-original',{...sharedView,balls:initial.balls,struts:initial.struts},'left:100px;top:235px;width:650px;height:540px')+'<div class="comparison-label small-label">原来的小晶体</div><div class="comparison-label large-label">添一圈后的大晶体</div><svg class="comparison-arrow" viewBox="0 0 160 60" aria-label="小晶体到大晶体"><path d="M8 30H140M115 8L140 30L115 52"/></svg></section>'+stepButtons('向外添一层');
 }
 if(p===40)return photoShapeMarkup(s);
 if(p===41)return '<span class="chapter-number">2</span><h1 class="chapter-title">所有的盐，都是方块吗？</h1><img class="chapter-art-std" src="media/ch2.webp" alt="阿基米德爷爷指着方块里的八面体，小兔惊喜地看着（卡通形象）" draggable="false">';
 if(p===42)return title('盐粒里面，藏着一个八面体')+host('octa-growing',octaSpec(s),'left:290px;top:190px;width:1020px;height:640px')+stepButtons('继续拼搭');
 if(p===43)return title('两组邻居，可以共用粒子')+host('shared',{id:'shared-octa',height:21,highlight:SHARED_BALLS},'left:240px;top:230px;width:1120px;height:520px')+'<p class="shared-explanation">橙圈中的两颗球，两组邻居都用到了</p>';
 if(p===44)return title('换一个中心，还能找到八面体吗？')+host('na-center',coordinationStage('na',s),'left:150px;top:260px;width:600px;height:440px')+host('cl-center',coordinationStage('cl',s),'left:850px;top:260px;width:600px;height:440px')+'<p class="coord-label left">钠在中间，六个氯在周围</p><p class="coord-label right">氯在中间，六个钠在周围</p>'+stepButtons('继续拼搭');
 if(p===46)return title('今日作业')+`<div class="homework-copy"><h2>任务 1</h2><p>拼搭氯化钠晶体结构，对比氯离子和钠离子为中心的八面体配位环境。</p>${s?'<div class="homework-extra"><h2>任务 2（选做）</h2><p>家人协助，配制饱和盐水。静置观察，看看盐晶体会不会出现。连续几天拍照，记录大小和形状变化。</p></div>':''}</div>${host('homework-native',{id:'shared-octa',height:20,highlight:SHARED_BALLS},'left:970px;top:190px;width:500px;height:370px')}${s?'<img class="homework-photo" src="assets/p26-shape6.png" alt="观察盐晶体的实拍">':''}`+stepButtons('看看选做任务');
 if(p===47)return title('实验记录：我的盐晶体长大了吗？')+'<p class="review-sub">每天在相近的时间观察：有没有晶体？形状、大小有什么变化？</p><div class="experiment-photos"><img src="assets/p27-shape5.png" alt="原版盐晶体观察示例一"><img src="assets/p27-shape6.png" alt="原版盐晶体观察示例二"></div>';
 return null;
}
let frame=0;
export function bindBatch({state}){
 if(state.page===6&&state.step===1)bindIonInteraction();
 if(state.page===39&&state.step===1&&document.querySelector('.growth-comparison')){
  const root=document.querySelector('.growth-comparison'),g=root.querySelector('[data-model-key="growth"]');
  function wait(){if(!root.isConnected)return;if(g.dataset.settled==='true'){root.dataset.phase='compare';root.classList.add('compare-ready');}else frame=requestAnimationFrame(wait);}
  frame=requestAnimationFrame(wait);
 }
}
export function cleanupBatch(){cancelAnimationFrame(frame);cleanupIonInteraction();}
