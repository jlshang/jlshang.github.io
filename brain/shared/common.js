/* Shared engine for every game: language, level picker, question runner, results, progress, rest reminders.
   Senior-friendly rules applied everywhere: no countdown pressure, gentle feedback, small level steps,
   progress is never lost, an "easier level" is always one tap away, and a rest reminder every few games. */
(function(){
  var me=document.currentScript, ROOT=(me&&me.dataset.root)||'./';
  function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
  var LANG=store('lang')==='zh'?'zh':'en';
  document.documentElement.lang=LANG==='zh'?'zh-CN':'en';
  function T(o){return (o&&typeof o==='object'&&!Array.isArray(o)&&('en' in o))?o[LANG]:o}
  function speak(t){try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.rate=0.85;u.lang=LANG==='zh'?'zh-CN':'en-US';speechSynthesis.speak(u)}catch(e){}}
  function el(html){var d=document.createElement('div');d.innerHTML=html.trim();return d.firstChild}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  function rand(a,b){return a+Math.floor(Math.random()*(b-a+1))}
  function pick(a){return a[Math.floor(Math.random()*a.length)]}
  function I(n){return (window.ICON&&ICON[n])||''}
  function dailyQueue(){try{return JSON.parse(sessionStorage.getItem('dailyQueue')||'[]')}catch(e){return[]}}
  function langBtn(){return '<button class="icon-btn lang-btn" onclick="Brain.toggleLang()" aria-label="Switch language">'+I('globe')+(LANG==='zh'?'EN':'中文')+'</button>'}
  function param(k){var m=new RegExp('[?&]'+k+'=([^&]*)').exec(location.search);return m?decodeURIComponent(m[1]):null}
  var MAXL=10;
  function prog(id){var p=store('prog-'+id)||{max:1,stars:{}};p.stars=p.stars||{};return p}

  /* soft synthesized sound effects shared by the games (no audio files) */
  var AC=null,MUTED=!!store('muted');
  function tone(f,d,type,vol,delay,slide){if(MUTED)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();var t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();
    o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.1,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.05)}catch(e){}}
  var SFX={tap:()=>tone(880,.08,'triangle',.07),pop:()=>{tone(600,.12,'sine',.1,0,1400)},splash:()=>{tone(300,.25,'sine',.08,0,120);tone(900,.15,'triangle',.04,.03,300)},
    hop:()=>tone(420,.22,'sine',.1,0,900),soft:()=>tone(260,.3,'sine',.08,0,200),
    ok:()=>{tone(784,.16,'triangle',.1);tone(988,.16,'triangle',.1,.09);tone(1319,.3,'triangle',.1,.18)},
    win:()=>{[523,659,784,1047,1319].forEach((f,i)=>tone(f,.25,'triangle',.09,i*.1))},sparkle:()=>{tone(1760,.12,'sine',.05);tone(2349,.2,'sine',.05,.06)}};
  var Brain={ROOT:ROOT,LANG:LANG,T:T,speak:speak,shuffle:shuffle,rand:rand,pick:pick,el:el,store:store,langBtn:langBtn,I:I,MAXL:MAXL,prog:prog,
    sfx:function(n){SFX[n]&&SFX[n]()},
    soundBtn:function(){var b=el('<button class="icon-btn" aria-label="sound"></button>');function d(){b.innerHTML=I(MUTED?'mute':'speaker')}d();
      b.onclick=function(){MUTED=!MUTED;store('muted',MUTED);d();if(!MUTED)SFX.tap()};return b},
    toast:function(html,host,ms){var t=el('<div class="toast">'+html+'</div>');(host||document.body).appendChild(t);setTimeout(function(){t.classList.add('bye')},ms||1600);setTimeout(function(){t.remove()},(ms||1600)+500)},
    toggleLang:function(){store('lang',LANG==='zh'?'en':'zh');location.reload()},

    /* SVG shapes for observation/logic games */
    shape:function(k,color,rot){var g;
      if(k==='circle')g='<circle cx="50" cy="50" r="40"/>';
      else if(k==='square')g='<rect x="12" y="12" width="76" height="76" rx="16"/>';
      else if(k==='triangle')g='<path d="M50 10L92 86H8z" stroke-linejoin="round"/>';
      else if(k==='arrow')g='<path d="M50 8L88 50H64v42H36V50H12z"/>';
      else if(k==='drop')g='<path d="M50 8C66 32 82 48 82 64a32 32 0 0 1-64 0c0-16 16-32 32-56z"/>';
      else if(k==='moon')g='<path d="M62 10a40 40 0 1 0 28 60A34 34 0 0 1 62 10z"/>';
      else if(k==='star')g='<path d="M50 6l13 27 30 4-22 21 5 30-26-14-26 14 5-30L7 37l30-4z" stroke-linejoin="round"/>';
      else if(k==='heart')g='<path d="M50 88C18 64 8 46 8 32 8 18 19 8 32 8c8 0 14 4 18 10 4-6 10-10 18-10 13 0 24 10 24 24 0 14-10 32-42 56z"/>';
      else if(k==='diamond')g='<path d="M50 6l40 44-40 44-40-44z"/>';
      else g='<path d="M50 6l38 22v44L50 94 12 72V28z"/>'; /* hexagon */
      return '<svg viewBox="0 0 100 100"><g fill="'+color+'" transform="rotate('+(rot||0)+' 50 50)">'+g+'</g></svg>'},
    SHAPES:['circle','square','triangle','star','heart','diamond','hexagon','drop'],
    COLORS:['#D0633A','#6A5AC8','#2F6DB0','#2C8468','#A8487A','#B9801F'],

    /* Page setup + intro with level picker. start(level) is called when the player taps Start. */
    run:function(o,start){
      Brain.cur=o; o.path=window.PATH;
      Brain.topbar(o.title);
      var L=+param('level');
      if(L&&param('go')){Brain.level=L;Brain.setLevelLabel();return start(L)}
      Brain.intro(o).then(function(l){Brain.level=l;Brain.setLevelLabel();start(l)});
    },
    setLevelLabel:function(){var h=document.querySelector('.topbar h1');if(h)h.innerHTML=T(Brain.cur.title)+' <span class="lv">'+T({en:'Level ',zh:'第 '})+Brain.level+T({en:'',zh:' 关'})+'</span>'},

    intro:function(o){
      var title=T(o.title),rules=T(o.rules),p=prog(o.id),sel=Math.min(+param('level')||p.max,p.max);
      document.title=title+' · '+T({en:'Brain Buddy',zh:'脑力伙伴'});
      var q=dailyQueue(), step=q.length?'<p class="muted" style="margin:0">'+T({en:"Today's workout",zh:'今日训练'})+'</p>':'';
      var ov=el('<div class="overlay"><div class="wrap stack center intro"><div style="display:flex;justify-content:flex-end">'+langBtn()+'</div>'+step+
        '<div class="badge" style="--c:var(--'+(o.cat||'primary')+')">'+I(o.icon||'brain')+'</div><h1>'+title+'</h1>'+
        '<div class="card rules">'+rules+(o.goal?'<div class="goal">'+I('flag')+'<span>'+T(o.goal)+'</span></div>':'')+'</div>'+
        '<button class="btn secondary block" data-a="hear">'+I('speaker')+T({en:'Hear the instructions',zh:'听一听规则'})+'</button>'+
        '<div class="card"><div class="levels-head"><b>'+T({en:'Choose a level',zh:'选择关卡'})+'</b><span class="muted">'+T({en:'Unlocked ',zh:'已解锁 '})+p.max+' / '+MAXL+'</span></div><div class="levels"></div></div>'+
        '<button class="btn block" data-a="go"></button>'+
        '<a class="btn ghost block" href="'+ROOT+'index.html">'+T({en:'Back to Home',zh:'返回首页'})+'</a></div></div>');
      document.body.appendChild(ov);
      var box=ov.querySelector('.levels'),go=ov.querySelector('[data-a=go]');
      function draw(){box.innerHTML='';for(var i=1;i<=MAXL;i++){(function(i){
        var s=p.stars[i]||0,locked=i>p.max,b=el('<button class="lvl'+(i===sel?' sel':'')+(locked?' locked':'')+'"'+(locked?' disabled aria-label="locked"':'')+'><b>'+(locked?'<span class="lk">'+I('lock')+'</span>':i)+'</b><i>'+[1,2,3].map(function(k){return '<span class="'+(s>=k?'on':'')+'"></span>'}).join('')+'</i></button>');
        b.onclick=function(){sel=i;draw()};box.appendChild(b)})(i)}
        go.innerHTML=T({en:'Start Level '+sel,zh:'开始第 '+sel+' 关'})+I('arrow')}
      draw();
      var plain=rules.replace(/<[^>]+>/g,' ');
      return new Promise(function(res){
        ov.querySelector('[data-a=hear]').onclick=function(){speak(plain)};
        go.onclick=function(){try{speechSynthesis.cancel()}catch(e){}ov.remove();res(sel)};
      });
    },
    topbar:function(title){
      var b=el('<div class="topbar"><h1>'+T(title)+'</h1><div class="tools">'+langBtn()+'<a class="icon-btn" href="'+ROOT+'index.html" aria-label="'+T({en:'Home',zh:'首页'})+'">'+I('home')+'</a></div></div>');
      var w=document.querySelector('.wrap'),bar=el('<div class="progress"><i></i></div>');w.prepend(bar);w.prepend(b);
    },
    progress:function(done,total){var i=document.querySelector('.progress>i');if(i)i.style.width=Math.min(100,100*done/total)+'%'},
    say:function(box,ok,msg){
      box.className='feedback '+(ok?'good':'try');
      box.textContent=msg?T(msg):(ok?pick(T({en:['Great job!','Well done!','Nice!','You got it!'],zh:['真棒！','答对了！','很好！','厉害！']})):T({en:'Not quite, try again!',zh:'差一点，再试试！'}));
    },
    status:function(r,n,score,label){var s=document.getElementById('st');if(!s)return;
      s.innerHTML='<span>'+T(label||{en:'Question '+r+' of '+n,zh:'第 '+r+' 题 / 共 '+n+' 题'})+'</span><span>'+T({en:'Correct: ',zh:'答对：'})+score+'</span>';Brain.progress(r-1,n)},

    /* Generic question runner.
       make(r,L) returns {q:html, study?:html, choices:[{html,v}], answer:v, cols?, tile?, explain?}.
       opts.retry: a wrong tap can be retried; the point only counts on a first try. */
    quiz:function(o){
      var L=Brain.level,N=o.rounds||8,r=0,score=0,w=document.querySelector('.wrap');
      w.insertAdjacentHTML('beforeend','<div class="status" id="st"></div><div id="qa"></div><div id="fb" class="feedback"></div><div id="ch"></div>');
      var qa=document.getElementById('qa'),fb=document.getElementById('fb'),ch=document.getElementById('ch');
      function next(){
        if(r>=N)return Brain.finish({score:score,total:N});
        r++;fb.textContent='';fb.className='feedback';ch.innerHTML='';
        var q=o.make(r,L);Brain.status(r,N,score);
        if(q.study){qa.innerHTML='<div class="card center qcard">'+q.study+'</div>';
          var b=el('<button class="btn block">'+T(q.ready||{en:"I'm ready",zh:'我记住了'})+'</button>');ch.appendChild(b);b.onclick=function(){ask(q)};}
        else ask(q);
      }
      function ask(q){
        qa.innerHTML='<div class="card center qcard">'+q.q+'</div>';ch.innerHTML='';
        var grid=el('<div class="choices'+(q.tile?' tiles-grid':'')+'" style="grid-template-columns:repeat('+(q.cols||2)+',1fr)"></div>');ch.appendChild(grid);
        var tried=false,lock=false;
        q.choices.forEach(function(c){
          var b=el('<button class="choice'+(q.tile?' tile-choice':'')+'"></button>');b.innerHTML=c.html;b._v=c.v;
          b.onclick=function(){if(lock||b.classList.contains('wrong'))return;
            if(c.v===q.answer){lock=true;if(!tried)score++;b.classList.add('right');Brain.say(fb,true,q.explain&&!tried?q.goodMsg:null);Brain.status(r,N,score);Brain.progress(r,N);setTimeout(next,q.explain?1500:1000)}
            else if(o.retry){tried=true;b.classList.add('wrong');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');Brain.say(fb,false,q.hint)}
            else{lock=true;b.classList.add('wrong');[].forEach.call(grid.children,function(x){if(x._v===q.answer)x.classList.add('right')});
              Brain.say(fb,false,q.explain||{en:'The right answer is highlighted.',zh:'正确答案已经标出来了。'});Brain.progress(r,N);setTimeout(next,2800)}
          };grid.appendChild(b)});
      }
      next();
    },

    /* End screen with level progression. Passing = 60% or more. */
    finish:function(o){
      var g=Brain.cur||{},id=o.id||g.id,path=o.path||g.path,L=Brain.level||1;
      var pct=o.total?o.score/o.total:1,pass=o.pass!==undefined?o.pass:pct>=0.6,stars=o.stars!==undefined?o.stars:(pct>=.9?3:pct>=.75?2:pass?1:0);
      var p=prog(id);if(stars>(p.stars[L]||0))p.stars[L]=stars;var unlocked=false;
      if(pass&&L>=p.max&&L<MAXL){p.max=L+1;unlocked=true}store('prog-'+id,p);
      if(o.big!==undefined){}var hist=store('history')||[];var today=new Date().toISOString().slice(0,10);
      hist.push({game:id,level:L,score:o.score,total:o.total,date:today});store('history',hist.slice(-800));
      var playedToday=hist.filter(function(h){return h.date===today}).length;
      var q=dailyQueue(), wasDaily=q[0]===path; if(wasDaily) q.shift();
      try{sessionStorage.setItem('dailyQueue',JSON.stringify(q))}catch(e){}
      var head=T(pct>=.9?{en:'Excellent work!',zh:'太棒了！'}:pass?{en:'Level complete!',zh:'过关啦！'}:{en:'Good practice!',zh:'练得不错！'});
      var sub=pass?(unlocked?T({en:'Level '+(L+1)+' is now unlocked.',zh:'第 '+(L+1)+' 关已经解锁。'}):(L===MAXL?T({en:'You have finished every level!',zh:'所有关卡都完成啦！'}):'')):
        T(o.failMsg||{en:'Get '+Math.ceil(o.total*.6)+' right to pass. Take your time, you can try again.',zh:'答对 '+Math.ceil(o.total*.6)+' 题就能过关，慢慢来，可以再试一次。'});
      var base=ROOT+path,btns='';
      if(q.length)btns+='<a class="btn block" href="'+ROOT+q[0]+'">'+T({en:'Next game',zh:'下一个游戏'})+I('arrow')+'</a>';
      else if(pass&&L<MAXL)btns+='<a class="btn block" href="'+base+'?level='+(L+1)+'&go=1">'+T({en:'Play Level '+(L+1),zh:'玩第 '+(L+1)+' 关'})+I('arrow')+'</a>';
      btns+='<a class="btn secondary block" href="'+base+'?level='+L+'&go=1">'+T({en:'Play this level again',zh:'这一关再玩一次'})+'</a>';
      if(!pass&&L>1)btns+='<a class="btn secondary block" href="'+base+'?level='+(L-1)+'&go=1">'+T({en:'Try an easier level',zh:'换简单一点的关卡'})+'</a>';
      var rest=playedToday>0&&playedToday%4===0?'<div class="card rest">'+I('cup2')+'<span>'+T({en:'You have played for a while. Stand up, stretch, and have a glass of water.',zh:'已经玩了一会儿啦，起来走一走、喝口水，休息一下眼睛吧。'})+'</span></div>':'';
      var done=wasDaily&&!q.length?'<div class="card rest" style="color:var(--primary)">'+I('flag')+'<span>'+T({en:"You finished today's workout!",zh:'今天的训练完成啦！'})+'</span></div>':'';
      var ov=el('<div class="overlay"><div class="wrap stack center intro"><div class="stars">'+[1,2,3].map(function(k){return '<span class="'+(stars>=k?'on':'')+'">'+I('star')+'</span>'}).join('')+'</div>'+
        '<h1>'+head+'</h1><p class="muted" style="margin:4px 0 0">'+T({en:'Level ',zh:'第 '})+L+T({en:'',zh:' 关'})+'</p>'+
        '<div class="card"><div class="big">'+(o.big!==undefined?o.big:o.score+' / '+o.total)+'</div>'+(o.note?'<p class="muted" style="margin:6px 0 0">'+T(o.note)+'</p>':'')+(sub?'<p style="margin:8px 0 0;font-weight:600">'+sub+'</p>':'')+'</div>'+
        done+rest+btns+'<a class="btn ghost block" href="'+ROOT+'index.html">'+T({en:'Home',zh:'首页'})+'</a></div></div>');
      document.body.appendChild(ov); speak(head+' '+sub);
    }
  };
  window.Brain=Brain;
})();
