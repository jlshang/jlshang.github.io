/* SteamKit 课件密码页：防止链接被随手打开。不是严格加密，懂技术的人仍可绕过。
   改密码：用 build 里的 mkgate.py 算出新密码的哈希，替换下面的 H。 */
(function(){
  var H=5136422017756132,K='steamkit-gate';
  function cyrb53(s){var h1=0xdeadbeef,h2=0x41c6ce57;for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}
    h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return 4294967296*(2097151&h2)+(h1>>>0)}
  try{if(localStorage.getItem(K)===String(H))return}catch(e){}
  var st=document.createElement('style');
  st.textContent='html.gate-locked body>*:not(#sk-gate){display:none!important}#sk-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#1e2a44;font-family:"PingFang SC","Microsoft YaHei",sans-serif}#sk-gate form{background:#fbf6ec;color:#1e2a44;border-radius:22px;padding:40px 44px;width:min(420px,88vw);box-shadow:0 20px 60px #0008;text-align:center}#sk-gate h1{margin:0 0 8px;font:700 26px "PingFang SC","Microsoft YaHei",sans-serif;color:#1e2a44;letter-spacing:0}#sk-gate p{margin:0 0 22px;color:#5b6680;font-size:15px}#sk-gate input{width:100%;background:#fff;color:#1e2a44;box-sizing:border-box;font-size:20px;padding:12px 16px;border:2px solid #d9cfbd;border-radius:12px;outline:none;text-align:center}#sk-gate input:focus{border-color:#e8742a}#sk-gate button{margin-top:16px;width:100%;font-size:18px;font-weight:700;padding:12px;border:0;border-radius:12px;background:#e8742a;color:#fff;cursor:pointer}#sk-gate .err{color:#d8432f;font-size:15px;min-height:22px;margin-top:10px}#sk-gate.shake form{animation:skshake .4s}@keyframes skshake{25%{transform:translateX(-10px)}75%{transform:translateX(10px)}}';
  document.head.appendChild(st);document.documentElement.classList.add('gate-locked');
  function show(){
    var g=document.createElement('div');g.id='sk-gate';
    g.innerHTML='<form><h1>SteamKit 课件</h1><p>请输入访问密码</p><input type="password" autocomplete="current-password" aria-label="访问密码" autofocus><button type="submit">进入</button><div class="err" aria-live="polite"></div></form>';
    document.body.appendChild(g);var inp=g.querySelector('input');setTimeout(function(){inp.focus()},50);
    g.querySelector('form').onsubmit=function(e){e.preventDefault();
      if(cyrb53(inp.value.trim())===H){try{localStorage.setItem(K,String(H))}catch(x){}document.documentElement.classList.remove('gate-locked');g.remove();window.dispatchEvent(new Event('resize'))}
      else{g.querySelector('.err').textContent='密码不对，再试一次';g.classList.remove('shake');void g.offsetWidth;g.classList.add('shake');inp.select()}};
    window.addEventListener('keydown',function(e){if(document.getElementById('sk-gate'))e.stopImmediatePropagation()},true);
  }
  if(document.body)show();else document.addEventListener('DOMContentLoaded',show);
})();
