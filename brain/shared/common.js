/* Shared helpers for every game: language, intro screen, feedback, results, daily workout queue. */
(function(){
  var me=document.currentScript, ROOT=(me&&me.dataset.root)||'./';
  function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
  var LANG=store('lang')==='zh'?'zh':'en';
  document.documentElement.lang=LANG==='zh'?'zh-CN':'en';
  /* T({en:'..',zh:'..'}) returns the text for the current language; plain strings pass through */
  function T(o){return (o&&typeof o==='object'&&!Array.isArray(o)&&('en' in o))?o[LANG]:o}
  function speak(t){try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(t);u.rate=0.85;u.lang=LANG==='zh'?'zh-CN':'en-US';speechSynthesis.speak(u)}catch(e){}}
  function el(html){var d=document.createElement('div');d.innerHTML=html.trim();return d.firstChild}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
  function rand(a,b){return a+Math.floor(Math.random()*(b-a+1))}
  function pick(a){return a[Math.floor(Math.random()*a.length)]}
  function dailyQueue(){try{return JSON.parse(sessionStorage.getItem('dailyQueue')||'[]')}catch(e){return[]}}
  function langBtn(){return '<button class="btn secondary small lang-btn" onclick="Brain.toggleLang()" aria-label="Switch language">'+(LANG==='zh'?'English':'中文')+'</button>'}

  var Brain={ROOT:ROOT,LANG:LANG,T:T,speak:speak,shuffle:shuffle,rand:rand,pick:pick,el:el,store:store,langBtn:langBtn,
    toggleLang:function(){store('lang',LANG==='zh'?'en':'zh');location.reload()},
    intro:function(o){
      var title=T(o.title),rules=T(o.rules);
      document.title=title+' · '+T({en:'Brain Buddy',zh:'脑力伙伴'});
      var q=dailyQueue(), step=q.length?'<p class="muted">'+T({en:"Today's workout",zh:'今日训练'})+'</p>':'';
      var ov=el('<div class="overlay"><div class="wrap stack center"><div style="text-align:right">'+langBtn()+'</div>'+step+
        '<div class="huge" aria-hidden="true">'+(o.icon||'🧠')+'</div><h1>'+title+'</h1>'+
        '<div class="card" style="text-align:left;font-size:1.2rem">'+rules+'</div>'+
        '<button class="btn secondary block" data-a="hear">🔊 '+T({en:'Hear the instructions',zh:'听一听规则'})+'</button>'+
        '<button class="btn block" data-a="go">'+T({en:'Start',zh:'开始'})+'</button>'+
        '<a class="btn secondary block" href="'+ROOT+'index.html">'+T({en:'Back to Home',zh:'返回首页'})+'</a></div></div>');
      document.body.appendChild(ov);
      var plain=rules.replace(/<[^>]+>/g,' ');
      return new Promise(function(res){
        ov.querySelector('[data-a=hear]').onclick=function(){speak(plain)};
        ov.querySelector('[data-a=go]').onclick=function(){try{speechSynthesis.cancel()}catch(e){}ov.remove();res()};
      });
    },
    topbar:function(title){
      var b=el('<div class="topbar"><h1>'+T(title)+'</h1><div style="display:flex;gap:8px">'+langBtn()+'<a class="btn secondary small" href="'+ROOT+'index.html">'+T({en:'Home',zh:'首页'})+'</a></div></div>');
      document.querySelector('.wrap').prepend(b);
    },
    say:function(box,ok,msg){
      box.className='feedback '+(ok?'good':'try');
      box.textContent=msg?T(msg):(ok?pick(T({en:['Great job!','Well done!','Nice!','You got it!'],zh:['真棒！','答对了！','很好！','厉害！']})):T({en:'Not quite, try again!',zh:'差一点，再试试！'}));
    },
    finish:function(o){
      var hist=store('history')||[];
      hist.push({game:o.id,score:o.score,total:o.total,date:new Date().toISOString().slice(0,10)});
      store('history',hist.slice(-500));
      var q=dailyQueue(), wasDaily=q[0]===o.path; if(wasDaily) q.shift();
      try{sessionStorage.setItem('dailyQueue',JSON.stringify(q))}catch(e){}
      var pct=o.total?o.score/o.total:1;
      var head=T(pct>=.8?{en:'Excellent work!',zh:'太棒了！'}:pct>=.5?{en:'Good effort!',zh:'做得不错！'}:{en:'Nice practice today!',zh:'今天练得很好！'});
      var next=q.length?'<a class="btn block" href="'+ROOT+q[0]+'">'+T({en:'Next game ▶',zh:'下一个游戏 ▶'})+'</a>':
        (wasDaily?'<div class="card">🎉 '+T({en:"You finished today's workout!",zh:'今天的训练完成啦！'})+'</div>':'');
      var ov=el('<div class="overlay"><div class="wrap stack center"><div class="huge">⭐</div><h1>'+head+'</h1>'+
        '<div class="card"><div class="big">'+o.score+' / '+o.total+'</div>'+(o.note?'<p class="muted">'+T(o.note)+'</p>':'')+'</div>'+
        next+'<button class="btn secondary block" data-a="again">'+T({en:'Play again',zh:'再玩一次'})+'</button>'+
        '<a class="btn secondary block" href="'+ROOT+'index.html">'+T({en:'Home',zh:'首页'})+'</a></div></div>');
      document.body.appendChild(ov); speak(head);
      ov.querySelector('[data-a=again]').onclick=function(){location.reload()};
    }
  };
  window.Brain=Brain;
})();
