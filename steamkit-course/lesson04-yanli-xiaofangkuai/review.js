import {enterMicroscope,cancelMicroscopeTransition} from './microscope-transition.js';
import {LESSON} from './lesson.js';
import {models,mountModel} from './review-model.js';
import {batchContent,bindBatch,cleanupBatch,BATCH_MAX} from './batch-scenes.js';
import {NEW_MAX,kitchen,methods,micro,why,ions,conclusion,bindNew,cleanupNew} from './new-scenes.js';
// Stable scene ids preserve all 22 existing interactions; visible page 3 is new scene 23.
const SCENES=[1,50,55,51,5,52,60,61,62,63,39,38,41,40,42,44,56,22];
const $=s=>document.querySelector(s);
const visiblePage=()=>SCENES.indexOf(state.page)+1;
const adjacentScene=delta=>SCENES[visiblePage()-1+delta];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const all=m=>m.balls.map((_,i)=>i),grid=models['grid-4'],cross=models['cross-3d'],row=models['row-five'];
const choose=(m,predicate)=>m.balls.flatMap((p,i)=>predicate(p,i)?[i]:[]);
const EPS=.01,layer=choose(grid,p=>p[1]<-EPS),twoLayers=choose(grid,p=>p[1]<EPS);
const center=choose(grid,p=>p.every(v=>Math.abs(v)<EPS));
const crossInGrid=choose(grid,p=>p.filter(v=>Math.abs(v)>EPS).length<=1);
const axes=[0,2,1];
const axisLine=a=>choose(grid,p=>p.every((v,k)=>k===axes[a]||Math.abs(v)<EPS));
const bottomCenter=choose(grid,p=>p[1]<-EPS&&Math.abs(p[0])+Math.abs(p[2])<EPS);
const layerStages=[bottomCenter,choose(grid,p=>p[1]<-EPS&&Math.abs(p[2])<EPS),choose(grid,p=>p[1]<-EPS&&p[2]<EPS),layer];
const maxSteps={...BATCH_MAX,...NEW_MAX,60:0,61:4,62:3,63:4,39:3,2:1,4:1,6:1,8:2,9:3,10:3,11:2,14:3,15:2,16:1,19:3,21:3};
const state={page:1,step:0,guess:null,axis:0,notes:false,toc:false,sound:true,record:false,rowError:false,recordValues:{}};
let deck,controllers=new Map(),pour=null,scope=0,storingFailed=false;
try{state.recordValues=JSON.parse(localStorage.getItem('salt-review-record')||'{}');if(!state.recordValues||typeof state.recordValues!=='object')state.recordValues={};}catch{state.recordValues={};}
const sound=window.createCourseSound(window.AudioContext||window.webkitAudioContext);
const specs=new Map();
function host(key,spec,style=''){
 specs.set(key,spec);
 return `<div class="model-host" data-model-key="${key}" data-model="${spec.id}" style="${style}"><canvas tabindex="0" role="img" aria-label="黑白真实连接球与标准杆模型，可旋转、缩放"></canvas><span class="model-status" role="status">三维模型加载中…</span><button class="model-reset" aria-label="恢复本模型初始视角" title="恢复视角"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1.5 7M4 4v6h6"/></svg><span>恢复视角</span></button></div>`;
}
const title=(t,sub='')=>`<h1 class="review-title">${t}</h1>${sub?`<p class="review-sub">${sub}</p>`:''}`;
const dots=(n,i)=>`<div class="step-dots" aria-label="第${i+1}步，共${n}步">${Array.from({length:n},(_,k)=>`<i class="${k<=i?'on':''}"></i>`).join('')}</div>`;
function count(spec){
 const m=models[spec.id],ids=spec.balls??all(m),set=new Set(ids);
 const rods=spec.struts??m.struts.flatMap((e,i)=>set.has(e.a)&&set.has(e.b)?[i]:[]);
 return `<div class="part-count" aria-label="${ids.length}球，${rods.length}杆"><span><b>${ids.length}</b>颗球</span><span><b>${rods.length}</b>根杆</span></div>`;
}
const legend=()=>'<div class="legend"><span class="dot black"></span>钠<span class="dot white"></span>氯</div>';
function modelScene(heading,spec,copy,{sub='',key='main',style='',counts=true}={}){
 return title(heading,sub)+host(key,spec,style)+`<div class="model-copy">${copy}${counts?count(spec):''}${legend()}</div>`;
}
function plusButton(label){
 const max=maxSteps[state.page]||0;
 return state.step<max?`<button class="review-next-step round plus" data-action="advance" aria-label="${label}" title="${label}"><span aria-hidden="true">＋</span></button>`:'';
}
function stepButtons(label='下一步'){
 const max=maxSteps[state.page]||0;
 if([2,4,8].includes(state.page))return '';
 return state.step<max?`<button class="review-next-step round" data-action="advance" aria-label="${label}" title="${label}"><span aria-hidden="true">▶</span></button>`:'';
}
function chapter(n,heading,sub){
 return `<span class="chapter-number">${n}</span><div class="chapter-copy"><small>${sub}</small><h1>${heading}</h1><div class="chapter-rule"></div></div>`+
 host('chapter',{id:n===1?'cross-3d':'grid-4',height:22},'left:1030px;top:270px;width:480px;height:440px');
}
function content(){
 const p=state.page,s=state.step;
 if(p===50)return kitchen(state,title);
 if(p===55)return methods(state,title);
 if(p===54)return why(state,title);
 if(p===60)return title('第 1 步：搭一个氯化钠')+host('nacl1',{id:'nacl-pair',height:9,yaw:.35,pitch:.25},'left:100px;top:200px;width:820px;height:600px')+
  '<div class="build-key"><p><span class="dot black"></span>黑球 = 钠 <b class="ionf">Na⁺</b></p><p><span class="dot white"></span>白球 = 氯 <b class="ionf">Cl⁻</b></p><p><span class="rod"></span>蓝短棍 = 把它们连在一起</p></div>';
 if(p===61){
  const stages=[[0,1],[0,1,2],[0,1,2,3],[0,1,2,3,4],[0,1,2,3,4,5]];
  return title('第 2 步：搭更多氯化钠')+host('nacl-row',{id:'row-six',balls:stages[s],height:16,yaw:0,pitch:.2},'left:60px;top:200px;width:1480px;height:600px')+plusButton('再接一颗');
 }
 if(p===62){
  const stages=[[0],[0,1,2],[0,1,2,3,4],[0,1,2,3,4,5,6]];
  return title('第 3 步：一个钠，周围有几个氯？')+host('cross3',{id:'cross-3d',balls:stages[s],height:17},'left:150px;top:200px;width:820px;height:620px')+
   `<div class="neighbor-tally">${s===0?'':['左右：2 个','上下：2 个','前后：2 个'].slice(0,s).map((t,i)=>`<p class="${i===s-1?'pop':''}">${t}</p>`).join('')}${s===3?'<p class="tally-total pop">一共 6 个邻居！</p>':''}</div>`+plusButton('再接一对');
 }
 if(p===39){
  const m=models['lattice-5'],o=m.balls[62],sp=5.23606797749979;
  const lim=[[1,1,1],[2,1,1],[2,1,2],[2,2,2]][s];
  const ids=m.balls.flatMap((q,i)=>q.every((v,k)=>Math.abs(Math.round((v-o[k])/sp))<=lim[k])?[i]:[]);
  return title('小盐晶体，是怎样长大的？')+host('grow-build',{id:'lattice-5',balls:ids,height:40,yaw:.42,pitch:.24},'left:250px;top:180px;width:1100px;height:660px')+plusButton('向外拼一层');
 }
 if(p===56)return title('拼搭你喜欢的盐粒')+host('fav-a',{id:'twin-octa',height:19,yaw:.5,pitch:.28},'left:60px;top:170px;width:730px;height:640px')+host('fav-b',{id:'cube-octa',height:28,yaw:.55,pitch:.32},'left:810px;top:170px;width:730px;height:640px');
 if(p===63){
  const stages=['cross-3d','grid-1','grid-2','grid-3','grid-4'].map(id=>choose(grid,(q,i)=>models[id].balls.some(b=>b.every((v,k)=>Math.abs(v-q[k])<1e-6))));
  return title('第 4 步：把十字变成小方块')+host('cube',{id:'grid-4',balls:stages[s],height:21},'left:300px;top:190px;width:1000px;height:640px')+stepButtons('接着搭');
 }
 if(p===51)return s===0?micro(state,title,window.originalRevisions.photos(deck.slides[5])):why(state,title);
 if(p===52)return ions(state,title)+'';
 if(p===53)return conclusion(title,host);
 if(p===22)return homework();
 const revised=batchContent({state,deck,title,host,modelScene,stepButtons,dots,legend});
 if(revised!==null)return revised;
 if(p===1)return `<img class="cover-logo" src="assets/zometool-logo.png" alt="Zometool"><img class="cover-banner" src="media/cover_banner.png" alt="" draggable="false"><div class="banner-text"><h1>盐粒为什么是小方块</h1></div>`;
 if(p===2)return window.photoPour.render(state);
 if(p===23)return title('我们在显微镜下看看')+'<img class="microscope-photo" src="assets/p05-shape8.png" alt="原课件真实照片：三个孩子围着显微镜观察">';
 if(p===3)return title('显微镜下，猜猜哪一张是盐？')+window.originalRevisions.photos(deck.slides[5]);
 if(p===4)return title('盐为什么是小方块？')+`<img class="guess-rabbit" src="media/thinking-rabbit-redrawn.webp" alt="正在思考的黄色小兔">`+
  (!s?'<button class="review-next-step guess-start" data-action="advance">我来猜一猜</button>':`<div class="guess-list">${['工厂把盐切成小方块','里面的小粒子排得有规律','我有别的猜想'].map((t,i)=>`<button data-guess="${i}" class="${state.guess===i?'selected':''}" aria-pressed="${state.guess===i}"><b>${'ABC'[i]}</b>${t}</button>`).join('')}</div>`);
 if(p===5)return chapter(1,'盐里面，<br>藏着什么？','先找规律，再动手');
 if(p===6)return title('认识两位小伙伴')+(!s?'<img class="ions-heap" src="media/page09-salt/heap.png" alt="一小堆白色盐粒">':`
  <svg class="ions-intro" viewBox="0 0 1200 450" role="img" aria-label="黑色小个子钠，白色大个子氯；颜色和大小为示意">
   <defs><radialGradient id="black-ion" cx="30%" cy="24%"><stop stop-color="#818995"/><stop offset=".55" stop-color="#454a51"/><stop offset="1" stop-color="#282d35"/></radialGradient><radialGradient id="white-ion" cx="30%" cy="24%"><stop stop-color="#fff"/><stop offset=".55" stop-color="#f0f0ed"/><stop offset="1" stop-color="#bcc5d0"/></radialGradient></defs>
   <g transform="translate(280 200)"><g class="ion-motion" style="--dx:320px"><circle r="79" fill="url(#black-ion)" stroke="#92a2b8" stroke-width="2"/></g><text class="ion-label ion-label-move" x="0" y="194" text-anchor="middle">小个子钠</text></g>
   <g transform="translate(920 200)"><g class="ion-motion" style="--dx:-320px"><circle r="115" fill="url(#white-ion)"/></g><text class="ion-label ion-label-move" x="0" y="194" text-anchor="middle">大个子氯</text></g>
  </svg><p class="micro-boundary">黑白是我们约定的颜色 · 教具球一样大</p>`)+stepButtons('看看里面');
 if(p===7)return modelScene('把材料准备好',{id:'cross-3d',height:18},
  '<h2>今天一起用</h2><p>黑球 13 颗<br>白球 14 颗<br>蓝短杆 54 根</p><p class="quiet">搭完一小步，材料继续用。<br>小零件不入口。</p>',{sub:'用黑球和白球，代表两种小粒子',counts:false});
 if(p===8){
  const spec={id:'row-five',balls:all(row).slice(0,3+s),height:9.4,yaw:0,pitch:0};
  return title('动手串一排，接下来是谁？','先在桌上搭，再来选下一颗。')+host('row',spec,'left:150px;top:270px;width:1300px;height:315px')+
   `<p class="row-feedback" role="status">${s===2?'一黑一白，继续排。':state.rowError?'看看前一颗：旁边要换一种颜色。':s===1?'接好了，再来一颗！':'黑、白、黑……'}</p>`+
   (s<2?`<div class="choice-row"><button class="ball-choice" data-row="black"><span class="dot black"></span>黑球</button><button class="ball-choice" data-row="white"><span class="dot white"></span>白球</button></div>`:
   '<p class="micro-boundary">5 颗球 · 4 根蓝短杆</p>');
 }
 if(p===9){
  const labels=['从一颗黑球开始','左右各接一颗','再接上下两颗','补上前后两颗'];
  const spec={id:'cross-3d',balls:all(cross).slice(0,[1,3,5,7][s]),height:19};
  return modelScene('动手搭十字，再向前后伸出去',spec,`<h2>${labels[s]}</h2><p>${s===3?'立体十字搭好了！':'照着这一小步，<br>你也来搭一搭。'}</p>${dots(4,s)}`)+stepButtons();
 }
 if(p===10){
  const focus=[0,1,2,5,6,3,4].slice(0,[1,3,5,7][s]);
  return modelScene('搭好了，再数一数',{id:'cross-3d',focus,height:19},
   `${['左右：2 个','前后：2 个','上下：2 个'].slice(0,s).map(t=>`<span class="count-pair">${t}</span>`).join('')}${s===3?'<p class="count-total">一共 6 个邻居</p>':`<h2>${s?'还有哪里？':'从左右开始数'}</h2>`}`,{counts:false})+stepButtons('继续数');
 }
 if(p===11)return modelScene('换个方向，规律变了吗？',{id:'grid-4',height:22,focus:axisLine(s)},
  `<h2>${['左右','前后','上下'][s]}</h2><p>沿这条直线，<br>一黑一白。</p>${dots(3,s)}`,{counts:false})+stepButtons('换个方向');
 if(p===12)return chapter(2,'怎样搭出<br>一块盐方块？','把规律，变成你的作品');
 if(p===13)return modelScene('今天，要搭出这一块',{id:'grid-4',height:22},
  '<h2>三层小方块</h2><p>每层三排，<br>每排三颗。</p><p class="quiet">接下来：先一层，再三层。</p>');
 if(p===14){
  const spec={id:'grid-4',balls:layerStages[s],height:22,pitch:.52};
  return modelScene('先搭一层：三排，每排三颗',spec,
   `<h2>${['先放一颗白球','搭出第一排','再接第二排','补齐第三排'][s]}</h2><p>${s===3?'这一层完成了！':'相邻的球，<br>记得换颜色。'}</p>${dots(4,s)}`)+stepButtons();
 }
 if(p===15){
  const spec={id:'grid-4',balls:[layer,twoLayers,all(grid)][s],height:22,pitch:.36};
  return modelScene('再叠两层，就成小方块',spec,
   `<h2>${['已经有第一层','叠上第二层','第三层，完成！'][s]}</h2><p>${s===2?'拿起你的作品，<br>转一转看看。':'上下相邻的球，<br>也要换颜色。'}</p>${dots(3,s)}`)+stepButtons('叠上一层');
 }
 if(p===16){
  const spec={id:'grid-4',balls:s?all(grid):choose(grid,p=>p.every(v=>v<EPS)),height:22};
  return modelScene('继续长，还是这套规律',spec,
   `<h2>${s?'大了一圈！':'从小方块出发'}</h2><p>左右、前后、上下，<br>都按规律继续排。</p>`,{sub:'这次只观察，不用拆掉你的作品。'})+stepButtons('看它长大');
 }
 if(p===17){
  const focus=state.axis===0?null:state.axis===1?crossInGrid:axisLine(state.axis-2);
  return modelScene('转一转，找找藏在里面的邻居',{id:'grid-4',height:22,focus},
   `<h2>找到中间那颗黑球</h2><p>它的邻居，<br>是什么颜色？</p><div class="axis-buttons">${['整体','找中心','左右','前后','上下'].map((t,i)=>`<button data-axis="${i}" aria-pressed="${state.axis===i}" class="${state.axis===i?'active':''}">${t}</button>`).join('')}</div>`,{counts:false});
 }
 if(p===18)return title('真的盐晶体，长什么样？')+
  `<div class="photo-pair"><figure><img src="media/page20-real/halite-cube.webp" alt="具有立方边面的石盐晶体实拍"><figcaption>找一找方形的边和面</figcaption></figure><figure><img src="media/page20-real/halite-cluster.webp" alt="多个石盐晶体连在一起的晶簇实拍"><figcaption>有的连在一起，也有不完整的</figcaption></figure></div><p class="science-short">常见方块外形，不是每一粒都完美。</p>`;
 if(p===19)return title('现在，你会怎么回答？')+host('answer',{id:'grid-4',height:22},'left:80px;top:260px;width:820px;height:500px')+
  `<div class="answer-lines">${[
   '里面两种小粒子，<br><b>按规律交替排。</b>',
   '左右、前后、上下，<br><b>都能继续排。</b>',
   '这种有序的结构，<br>帮助我们理解盐<br><b>常见的方块外形。</b>'
  ].slice(0,s).map(t=>`<p>${t}</p>`).join('')}${!s?'<p>举起你的作品，<br>先说说你的发现。</p>':''}</div>`+stepButtons('说说发现');
 if(p===20)return modelScene('举起你的盐方块，说给大家听',{id:'grid-4',height:22},
  '<h2>你的作品会说话</h2><p>是不是三层？</p><p>颜色交替了吗？</p><p>六个邻居在哪里？</p>',{counts:false});
 if(p===21){
  const octa=models['octa-3'],blue=octa.struts.flatMap((e,i)=>e.color==='BLUE'?[i]:[]),green=octa.struts.flatMap((e,i)=>e.color==='GREEN'?[i]:[]);
  const spec={id:'octa-3',height:18,struts:blue.concat(green.slice(0,[0,4,8,12][s]))};
  return modelScene('方块里，藏着八面体',spec,`<h2>${s===3?'看见了吗？':'连起六个邻居'}</h2><p>这是里面的轮廓，<br>不是整粒盐的外形。</p><p class="quiet">绿色只标出邻居围成的形状。</p>`,{counts:false})+
   '<span class="optional-tag">隐藏发现 · 选看</span>'+stepButtons('连起轮廓');
 }
 if(p===22)return title('把发现带回家','任选一项，下次带回来分享。')+
  `<div class="task-grid">
   <article class="task-card"><small>观察</small><h2>谁的形状不一样？</h2><p>放大看看粗盐、白糖、冰糖，画出你看到的轮廓。</p><strong>带回来：3 张近照</strong></article>
   <article class="task-card"><small>设计制作</small><h2>介绍你的盐方块</h2><p>转一转今天的作品，指给家人看：颜色怎样排？</p><strong>带回来：一小段视频</strong></article>
   <article class="task-card"><small>探究一个变量</small><h2>开口不同，会怎样？</h2><p>同样的盐水、杯子和位置。<br>一杯敞口，一杯盖子留缝。</p><strong>带回来：观察记录</strong></article>
  </div><p class="task-safety">成人准备盐水，冷却后再观察；实验材料不入口。<br>同一天拍照，记下变化，不急着猜输赢。</p><button class="record-open" data-action="record">打开实验记录 ↗</button>`+(state.record?recordPanel():'');
 return '';
}
function homework(){
 return title('今日作业')+
  `<div class="task-grid">
   <article class="task-card"><small>观察</small><h2>谁是小方块？</h2><p>用放大镜看看粗盐、白糖、冰糖，画出它们的样子。</p><strong>带回来：3 张近照</strong></article>
   <article class="task-card"><small>设计制作</small><h2>搭一块更大的盐方块</h2><p>用黑球和白球往外搭，相邻的颜色一定要交替。</p><strong>带回来：作品视频</strong></article>
   <article class="task-card"><small>探究</small><h2>哪杯长出的盐晶体大？</h2><p>两杯一样的盐水：一杯放窗台，一杯放冰箱。</p><strong>带回来：观察记录</strong></article>
  </div><p class="task-safety">请大人帮忙准备盐水；实验材料不入口。</p><button class="record-open" data-action="record">打开实验记录 ↗</button>`+(state.record?recordPanel():'');
}
const fieldNames={prediction:'我预测：哪杯长出的晶体更大？',date:'观察日期',open:'窗台那杯：看到了什么？',covered:'冰箱那杯：看到了什么？'};
function recordPanel(){return `<section class="record-panel" role="dialog" aria-label="我的盐晶体观察记录"><h2>我的盐晶体观察记录</h2><button class="close" data-action="record">关闭 ×</button><div class="record-fields">${Object.entries(fieldNames).map(([k,label])=>`<label>${label}${['open','covered'].includes(k)?`<textarea data-record="${k}">${esc(state.recordValues[k])}</textarea>`:`<input data-record="${k}" type="${k==='date'?'date':'text'}" value="${esc(state.recordValues[k])}">`}</label>`).join('')}</div><p id="save-status">${storingFailed?'此浏览器无法保存，请下载记录。':'输入后保存在当前浏览器；换设备请下载记录。'}</p><div class="record-actions"><button data-action="download">下载记录 ↓</button></div></section>`;}
function resize(){
 const r=$('#viewport').getBoundingClientRect();
 $('#stage').style.transform=`scale(${Math.min(r.width/1600,r.height/900)})`;
}
new ResizeObserver(resize).observe($('#viewport'));
function updatePanels(){
 $('#directory').hidden=!state.toc;$('#notes').hidden=!state.notes;
 if(state.toc)$('#directory').innerHTML=`<h2>盐粒为什么是小方块？</h2><button class="close" data-action="toc">关闭 ×</button><div class="toc-grid">${LESSON.map((l,i)=>`<button class="toc-item ${state.page===SCENES[i]?'active':''}" data-go="${SCENES[i]}"><b>${String(i+1).padStart(2,'0')}</b>${esc(l.title)}</button>`).join('')}</div>`;
 if(state.notes){
  const l=LESSON[visiblePage()-1];
  $('#notes').innerHTML=`<button class="close" data-action="notes">关闭 ×</button><h3>第 ${visiblePage()} 页 · ${esc(l.title)} · ${l.minutes} 分钟</h3>${l.notes.map(([tag,text])=>`<p class="note-line"><b>【${esc(tag)}】</b>${esc(text)}</p>`).join('')}`;
 }
}
function render(animate=false){
 cancelMicroscopeTransition();
 const ticket=++scope;
 pour?.dispose();pour=null;cleanupBatch();cleanupNew();window.originalRevisions.cleanupScene();
 specs.clear();
 const html=content();
 const old=new Map(controllers);controllers=new Map();
 // Retain the same canvas/camera through each page's construction steps.
 for(const {host} of old.values())host.remove();
 $('#slide').innerHTML=html;$('#slide').className='slide dark v2 scene-'+state.page+' step-'+state.step;
 $('#stage').dataset.page=state.page;$('#stage').dataset.visiblePage=visiblePage();$('#stage').dataset.step=state.step;
 for(const [key,spec] of specs){
  const fresh=$(`[data-model-key="${key}"]`),prior=old.get(key);
  if(prior&&prior.page===state.page&&prior.id===spec.id){
   fresh.replaceWith(prior.host);controllers.set(key,prior);old.delete(key);prior.controller.update(spec,animate);
  }else controllers.set(key,{host:fresh,page:state.page,id:spec.id,controller:mountModel(fresh,spec)});
 }
 for(const {controller} of old.values())controller.dispose();
 const resets=[...$('#slide').querySelectorAll('.model-host:not([data-interactive="false"]) .model-reset')];
 if(resets.length){const h=document.createElement('button');h.className='ctl-home';h.title='回正面';h.setAttribute('aria-label','回正面');h.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="7" width="11" height="11" rx="2"/><path d="M15 6a5.5 5.5 0 0 1 5 5M20 11l1.6-2.4M20 11l-2.6-1"/></svg>';h.onclick=()=>{resets.forEach(b=>b.click());if(state.sound)sound.play('select');};$('#slide').append(h);}
 window.originalRevisions.bindScene();bindBatch({state,advance});bindNew({state,sound:k=>{if(state.sound)sound.play(k);}});
 if(false){
  const scene=$('.p02-scene'),images=[...scene.querySelectorAll('img')];
  const ready=()=>{
   if(ticket!==scope||!scene.isConnected||!images.every(i=>i.complete&&i.naturalWidth))return;
   scene.classList.remove('p02-loading');
   if(!pour&&state.step===0)pour=window.photoPour.bind(scene,{onFinish(){if(ticket===scope){state.step=1;render();}},canInteract:()=>!state.notes&&!state.toc});
  };
  images.forEach(i=>i.addEventListener('load',ready,{once:true}));ready();
 }
 $('#stepback').hidden=!(state.step>0&&![52].includes(state.page));
 $('#pagecount').textContent=`${visiblePage()} / ${LESSON.length}`;
 $('#progress').value=visiblePage();$('#prev').disabled=state.page===1;$('#next').disabled=visiblePage()===LESSON.length;
 updatePanels();resize();
}
function goReset(){state.methods=new Set();}
const MODEL_PAGES=new Set([60,61,62,63,38,39,42,44,56]);
function navCue(n){return n===1?'cover':[5,41].includes(n)?'chapter':n===22?'finish':MODEL_PAGES.has(n)?'model':'page';}
function go(n){
 if(!SCENES.includes(n))return;
 if(n!==state.page)goReset();
 const macro=state.page===23&&n===3?$('#slide').cloneNode(true):null;
 cancelMicroscopeTransition();
 state.page=n;state.step=0;state.axis=0;state.rowError=false;state.record=false;state.toc=false;
 history.replaceState(null,'',`#salt/${visiblePage()}`);render();if(macro)enterMicroscope(macro);if(state.sound&&navigator.userActivation?.hasBeenActive)sound.play(navCue(n));
}
function advance(){
 if(state.step>=(maxSteps[state.page]||0))return;
 state.step++;render(true);if(state.sound)sound.play(state.page===39?'grow':[61,62,63].includes(state.page)?'plus':'reveal');
}
function downloadRecord(){
 const text='我的盐晶体观察记录\\n'.replace('\\n','\n')+Object.entries(fieldNames).map(([k,t])=>`${t}\n${state.recordValues[k]||'（未填写）'}`).join('\n\n')+'\n\n比较条件：同一批、同样多的盐水，同样的杯子；只改变放的地方（窗台 / 冰箱）。\n成人准备，实验材料不入口。\n';
 const url=URL.createObjectURL(new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='盐晶体观察记录.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('click',e=>{
 if(e.target.closest('.salt-grain')){advance();if(state.sound)sound.play('grow');return;}
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.go){go(+b.dataset.go);return;}
 if(b.dataset.guess!==undefined){state.guess=+b.dataset.guess;render();if(state.sound)sound.play('select');return;}
 if(b.dataset.row){
  if(state.step>=2)return;
  if(b.dataset.row===(state.step===0?'white':'black')){state.step++;state.rowError=false;render(true);if(state.sound)sound.play('step');}
  else{state.rowError=true;$('.row-feedback').textContent='看看前一颗：旁边要换一种颜色。';}
  return;
 }
 if(b.dataset.axis!==undefined){state.axis=+b.dataset.axis;render();return;}
 const a=b.dataset.action;
 if(a==='advance')advance();
 if(a==='back'){state.step=Math.max(0,state.step-1);render();}
 if(a==='notes'){state.notes=!state.notes;state.toc=false;updatePanels();}
 if(a==='toc'){state.toc=!state.toc;state.notes=false;updatePanels();}
 if(a==='record'){state.record=!state.record;render();if(state.record)$('[data-record]')?.focus();}
 if(a==='download')downloadRecord();
});
document.addEventListener('input',e=>{
 const key=e.target.dataset.record;if(!key)return;
 state.recordValues[key]=e.target.value;
 try{localStorage.setItem('salt-review-record',JSON.stringify(state.recordValues));storingFailed=false;}catch{storingFailed=true;}
 $('#save-status').textContent=storingFailed?'此浏览器无法保存，请下载记录。':'已保存到当前浏览器；也可以下载记录。';
});
$('#stepback').onclick=()=>{state.step=Math.max(0,state.step-1);render();};
$('#prev').onclick=()=>go(adjacentScene(-1));$('#next').onclick=()=>go(adjacentScene(1));
$('#toc').onclick=()=>{state.toc=!state.toc;state.notes=false;updatePanels();};
$('#notebutton').onclick=()=>{state.notes=!state.notes;state.toc=false;updatePanels();};
$('#sound').onclick=()=>{state.sound=!state.sound;sound.setEnabled(state.sound);$('#sound').textContent='声音：'+(state.sound?'开':'关');$('#sound').setAttribute('aria-pressed',state.sound);};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{/* Fullscreen may be denied inside embedding contexts. */}};
document.addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea')||e.target.closest('.p02-bottle-handle'))return;
 const key=e.key.toLowerCase();
 if(key==='escape'){state.toc=false;state.notes=false;if(state.record){state.record=false;render();}else updatePanels();return;}
 if(key==='g'){e.preventDefault();$('#toc').click();return;}if(key==='n'){e.preventDefault();$('#notebutton').click();return;}
 if(key==='m'){$('#sound').click();return;}if(key==='f'){$('#fullscreen').click();return;}
 if(state.toc||state.record)return;
 if(key==='arrowright'||key==='pagedown'){e.preventDefault();go(adjacentScene(1));}
 if(key==='arrowleft'||key==='pageup'){e.preventDefault();go(adjacentScene(-1));}
 if(e.target.closest('button')&&(key===' '||key==='enter'))return;
 if(key===' '){e.preventDefault();advance();}
 if(key==='backspace'){e.preventDefault();state.step=Math.max(0,state.step-1);render();}
 if(key==='r'){state.step=0;state.rowError=false;state.axis=0;render();}
});
window.addEventListener('hashchange',()=>{const n=SCENES[Number(location.hash.split('/')[1])-1];if(n!==state.page)go(n);});
window.__rerender=()=>render();
window.courseware={go:display=>go(SCENES[display-1]),advance,getState:()=>({...state,displayPage:visiblePage(),max:maxSteps[state.page]||0}),modelCounts:()=>[...controllers.values()].map(({host})=>({id:host.dataset.model,balls:+host.dataset.balls,struts:+host.dataset.struts}))};
try{
 const response=await fetch('original-deck.json');if(!response.ok)throw Error('课件资料加载失败：'+response.status);deck=await response.json();
 const n=Number(location.hash.split('/')[1]);go(n>=1&&n<=SCENES.length?SCENES[n-1]:1);
}catch(e){$('#slide').innerHTML=`<div class="error">课件暂时未加载完成，请刷新重试。<br>${esc(e.message)}</div>`;console.error(e);}
