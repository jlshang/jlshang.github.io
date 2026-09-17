/* Brain audio: original background music and ambience generated live with Web Audio.
   No audio files, works offline. Music is soft by default, ducks while instructions are read aloud,
   and can be switched off separately from sound effects. */
(function(){
  var AC=null,master,musicBus,sfxBus,delay,fb,timer=null,theme=null,stepN=0,nextT=0,ambTimer=null,duckT=null;
  function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
  var musicOn=store('music-off')!==true;
  function ctx(){if(AC)return AC;try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}
    var comp=AC.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;comp.connect(AC.destination);
    master=AC.createGain();master.gain.value=1;master.connect(comp);
    musicBus=AC.createGain();musicBus.gain.value=0;musicBus.connect(master);
    /* gentle echo gives the music a sense of space */
    delay=AC.createDelay(1);delay.delayTime.value=.33;fb=AC.createGain();fb.gain.value=.28;var wet=AC.createGain();wet.gain.value=.22;
    var lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;
    musicBus.connect(delay);delay.connect(lp);lp.connect(fb);fb.connect(delay);lp.connect(wet);wet.connect(master);
    return AC}
  function hz(m){return 440*Math.pow(2,(m-69)/12)}
  function env(g,t,a,peak,d){g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d)}
  /* instruments */
  var INST={
    bell:function(m,t,d,v){[1,2.01,3.98].forEach(function(r,i){var o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=hz(m)*r;env(g,t,.005,v*[1,.35,.12][i],1.6*d+.6);o.connect(g);g.connect(musicBus);o.start(t);o.stop(t+2.6)})},
    marimba:function(m,t,d,v){var o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),g2=AC.createGain();o.type='sine';o2.type='sine';o.frequency.value=hz(m);o2.frequency.value=hz(m)*4;
      env(g,t,.004,v,.45);env(g2,t,.002,v*.25,.08);o.connect(g);o2.connect(g2);g.connect(musicBus);g2.connect(musicBus);o.start(t);o2.start(t);o.stop(t+.6);o2.stop(t+.2)},
    pluck:function(m,t,d,v){var o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='triangle';o.frequency.value=hz(m);f.type='lowpass';f.frequency.setValueAtTime(3200,t);f.frequency.exponentialRampToValueAtTime(500,t+.35);
      env(g,t,.003,v,.5);o.connect(f);f.connect(g);g.connect(musicBus);o.start(t);o.stop(t+.7)},
    whistle:function(m,t,d,v){var o=AC.createOscillator(),lfo=AC.createOscillator(),lg=AC.createGain(),g=AC.createGain();o.type='sine';o.frequency.value=hz(m);lfo.frequency.value=5.5;lg.gain.value=hz(m)*.012;lfo.connect(lg);lg.connect(o.frequency);
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+.05);g.gain.setValueAtTime(v,t+d*.8);g.gain.exponentialRampToValueAtTime(.0001,t+d+.12);o.connect(g);g.connect(musicBus);o.start(t);lfo.start(t);o.stop(t+d+.2);lfo.stop(t+d+.2)},
    bass:function(m,t,d,v){var o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=hz(m);env(g,t,.01,v,Math.min(.6,d+.1));o.connect(g);g.connect(musicBus);o.start(t);o.stop(t+d+.3)},
    pad:function(m,t,d,v){[-6,6].forEach(function(det){var o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';o.frequency.value=hz(m);o.detune.value=det;f.type='lowpass';f.frequency.value=700;
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v*.5,t+d*.35);g.gain.linearRampToValueAtTime(.0001,t+d+.4);o.connect(f);f.connect(g);g.connect(musicBus);o.start(t);o.stop(t+d+.5)})},
    tick:function(m,t,d,v){var o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.value=hz(m);env(g,t,.001,v*.25,.03);o.connect(g);g.connect(musicBus);o.start(t);o.stop(t+.06)}
  };
  function play(inst,m,t,d,v){if(m==null)return;INST[inst](m,t,d,v)}
  /* seeded random so each game's tune repeats like a real song instead of wandering */
  function rng(seed){return function(){seed=(seed*9301+49297)%233280;return seed/233280}}
  function scaleNote(root,scale,deg){var o=Math.floor(deg/scale.length),i=((deg%scale.length)+scale.length)%scale.length;return root+12*o+scale[i]}
  function makeMelody(r,len,range,restP){var out=[],d=Brain_rand(r,0,range);for(var i=0;i<len;i++){if(r()<restP){out.push(null);continue}d+=Math.round((r()-.5)*3);d=Math.max(0,Math.min(range,d));out.push(d)}return out}
  function Brain_rand(r,a,b){return a+Math.floor(r()*(b-a+1))}
  var MAJ=[0,2,4,5,7,9,11],PENTA=[0,2,4,7,9];

  /* each theme: tempo, steps per bar, and a step() that places notes. Phrases follow an A A B A shape. */
  var THEMES={
    stars:function(){var r=rng(7),A=makeMelody(r,16,7,.45),B=makeMelody(r,16,7,.5),prog=[0,-3,-4,-1];
      return{bpm:66,steps:16,step:function(n,t,s){var bar=Math.floor(n/16)%4,i=n%16,ph=[A,A,B,A][bar],root=60+prog[bar];
        if(i===0)play('pad',root-12,t,s*16,.05),play('pad',root-5,t,s*16,.035);
        if(i%4===0)play('bell',scaleNote(root+12,PENTA,[0,2,1,3][i/4]),t,s,.035);
        if(ph[i]!=null&&i%2===0)play('bell',scaleNote(72,PENTA,ph[i]),t,s*2,.05)},amb:'night'}},
    paint:function(){var r=rng(21),A=makeMelody(r,12,9,.35),B=makeMelody(r,12,9,.4),prog=[0,5,7,0];
      return{bpm:132,steps:12,step:function(n,t,s){var bar=Math.floor(n/12)%4,i=n%12,root=53+prog[bar],ph=[A,A,B,A][bar];
        if(i===0)play('bass',root-12,t,s*3,.12);if(i===4||i===8){play('marimba',root+4,t,s,.05);play('marimba',root+7,t,s,.045)}
        if(ph[i]!=null&&i%2===0)play('marimba',scaleNote(72,MAJ,ph[i]),t,s,.07)},amb:null}},
    post:function(){var r=rng(33),A=makeMelody(r,16,8,.3),B=makeMelody(r,16,8,.35),prog=[0,5,0,7];
      return{bpm:104,steps:16,step:function(n,t,s){var bar=Math.floor(n/16)%4,i=n%16,root=55+prog[bar],ph=[A,B,A,B][bar];
        if(i%4===0)play('bass',(i%8===0?root:root+7)-12,t,s*1.6,.13);if(i%4===2)play('pluck',root+4,t,s,.04),play('pluck',root+7,t,s,.035);
        if(i%2===0)play('tick',96,t,s,.2);
        if(ph[i]!=null&&(i%2===0||r()<.2))play('whistle',scaleNote(74,MAJ,ph[i]),t,s*1.6,.035)},amb:'village'}},
    orchard:function(){var r=rng(45),A=makeMelody(r,16,7,.35),B=makeMelody(r,16,7,.4),prog=[0,5,-3,7];
      return{bpm:96,steps:16,step:function(n,t,s){var bar=Math.floor(n/16)%4,i=n%16,root=57+prog[bar],ph=[A,A,B,A][bar];
        if(i===0||i===8)play('bass',root-12,t,s*3,.12);
        if(i%2===0){var ch=[0,4,7,12][(i/2)%4];play('pluck',root+ch,t,s,.045)}
        if(ph[i]!=null&&i%4===0)play('pluck',scaleNote(74,PENTA,ph[i]),t,s*2,.06)},amb:'birds'}},
    pond:function(){var r=rng(58),A=makeMelody(r,16,6,.55),prog=[0,-2,-5,-7];
      return{bpm:72,steps:16,step:function(n,t,s){var bar=Math.floor(n/16)%4,i=n%16,root=62+prog[bar];
        if(i===0)play('pad',root-12,t,s*16,.05),play('pad',root-5,t,s*16,.03);
        if(i%2===0)play('marimba',scaleNote(root,PENTA,[0,1,2,4,3,2,1,2][i/2]),t,s,.035);
        if(A[i]!=null&&i%4===0)play('bell',scaleNote(74,PENTA,A[i]),t,s*2,.03)},amb:'water'}},
    frog:function(){var r=rng(64),A=makeMelody(r,16,8,.35),B=makeMelody(r,16,8,.4),prog=[0,7,5,7];
      return{bpm:112,steps:16,step:function(n,t,s){var bar=Math.floor(n/16)%4,i=n%16,root=55+prog[bar],ph=[A,B,A,B][bar];
        if(i%8===0)play('bass',root-12,t,s*2,.14);if(i%8===4)play('bass',root-5,t,s*2,.1);
        if(i%4===2)play('marimba',root+12,t,s,.04);
        if(ph[i]!=null&&i%2===0)play('marimba',scaleNote(72,MAJ,ph[i]),t,s,.07)},amb:'water'}},
    shop:function(){var r=rng(77),A=makeMelody(r,16,8,.3),B=makeMelody(r,16,8,.35),prog=[0,9,5,7];
      return{bpm:116,steps:16,step:function(n,t,s){var bar=Math.floor(n/16)%4,i=n%16,root=60+prog[bar]%12,ph=[A,A,B,A][bar],minor=prog[bar]===9;
        if(i%4===0)play('bass',root-24+(i%8?7:0),t,s*1.5,.13);
        if(i%4===2){play('pluck',root+(minor?3:4),t,s,.04);play('pluck',root+7,t,s,.04);play('pluck',root+12,t,s,.03)}
        if(ph[i]!=null&&i%2===0)play('whistle',scaleNote(72,MAJ,ph[i]),t,s*1.4,.03)},amb:null}}
  };

  /* ambience: soft, sparse nature sounds under the music */
  function noiseBurst(t,dur,f,q,v){var len=Math.floor(AC.sampleRate*dur),buf=AC.createBuffer(1,len,AC.sampleRate),d=buf.getChannelData(0);for(var i=0;i<len;i++)d[i]=(Math.random()*2-1);
    var s=AC.createBufferSource(),bp=AC.createBiquadFilter(),g=AC.createGain();s.buffer=buf;bp.type='bandpass';bp.frequency.value=f;bp.Q.value=q;
    g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+dur*.4);g.gain.linearRampToValueAtTime(.0001,t+dur);s.connect(bp);bp.connect(g);g.connect(musicBus);s.start(t)}
  function chirp(t,f,v){for(var k=0;k<3;k++){var o=AC.createOscillator(),g=AC.createGain(),tt=t+k*.09;o.type='sine';o.frequency.setValueAtTime(f,tt);o.frequency.exponentialRampToValueAtTime(f*1.35,tt+.06);env(g,tt,.005,v,.06);o.connect(g);g.connect(musicBus);o.start(tt);o.stop(tt+.1)}}
  var AMB={
    night:function(t){if(Math.random()<.5)for(var k=0;k<4;k++){var o=AC.createOscillator(),g=AC.createGain(),tt=t+k*.06;o.type='sine';o.frequency.value=4200;env(g,tt,.002,.008,.03);o.connect(g);g.connect(musicBus);o.start(tt);o.stop(tt+.05)}},
    water:function(t){noiseBurst(t,2.2,600,.6,.02);if(Math.random()<.35){var o=AC.createOscillator(),g=AC.createGain(),tt=t+Math.random();o.type='sine';o.frequency.setValueAtTime(500,tt);o.frequency.exponentialRampToValueAtTime(1300,tt+.07);env(g,tt,.003,.03,.08);o.connect(g);g.connect(musicBus);o.start(tt);o.stop(tt+.12)}},
    birds:function(t){if(Math.random()<.45)chirp(t+Math.random(),2400+Math.random()*900,.018)},
    village:function(t){if(Math.random()<.3)chirp(t+Math.random(),2000+Math.random()*600,.014);noiseBurst(t,2.4,900,.4,.008)}
  };

  function tick(){if(!theme||!AC)return;var s=60/theme.bpm/2;
    while(nextT<AC.currentTime+.25){try{theme.step(stepN,nextT,s)}catch(e){}nextT+=s;stepN++}}
  var M={
    on:function(){return musicOn},
    start:function(name){if(!THEMES[name]||!ctx())return;theme=THEMES[name]();if(AC.state==='suspended')AC.resume();
      stepN=0;nextT=AC.currentTime+.15;clearInterval(timer);timer=setInterval(tick,90);
      clearInterval(ambTimer);if(theme.amb)ambTimer=setInterval(function(){if(musicOn&&AMB[theme.amb])AMB[theme.amb](AC.currentTime+.1)},2300);
      musicBus.gain.cancelScheduledValues(AC.currentTime);musicBus.gain.setValueAtTime(musicBus.gain.value,AC.currentTime);musicBus.gain.linearRampToValueAtTime(musicOn?1:0,AC.currentTime+1.5)},
    stop:function(fade){if(!AC||!theme)return;var t=AC.currentTime;musicBus.gain.cancelScheduledValues(t);musicBus.gain.setValueAtTime(musicBus.gain.value,t);musicBus.gain.linearRampToValueAtTime(0,t+(fade||1.2));
      setTimeout(function(){clearInterval(timer);clearInterval(ambTimer);theme=null},(fade||1.2)*1000+100)},
    toggle:function(){musicOn=!musicOn;store('music-off',!musicOn);if(AC&&theme){var t=AC.currentTime;musicBus.gain.cancelScheduledValues(t);musicBus.gain.setValueAtTime(musicBus.gain.value,t);musicBus.gain.linearRampToValueAtTime(musicOn?1:0,t+.6)}return musicOn},
    /* lower the music while spoken instructions play */
    duck:function(onOff){if(!AC||!theme||!musicOn)return;var t=AC.currentTime;musicBus.gain.cancelScheduledValues(t);musicBus.gain.setValueAtTime(musicBus.gain.value,t);musicBus.gain.linearRampToValueAtTime(onOff?.25:1,t+.3)},
    ctx:ctx
  };
  window.BrainMusic=M;
})();
