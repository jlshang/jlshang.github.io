(()=>{
"use strict";const stage=document.getElementById("stage"),reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;const $$=(s,r=document)=>[...r.querySelectorAll(s)];
/* ================= 3D geometry ================= */
const PHI=(1+Math.sqrt(5))/2;
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function signs(v){const out=[];for(const sx of[1,-1])for(const sy of[1,-1])for(const sz of[1,-1]){const w=[v[0]*sx,v[1]*sy,v[2]*sz];if(!out.some(o=>o.every((c,i)=>Math.abs(c-w[i])<1e-9)))out.push(w)}return out}
function cyc(v){return[[v[0],v[1],v[2]],[v[1],v[2],v[0]],[v[2],v[0],v[1]]]}
function rotX(v,a){const c=Math.cos(a),s=Math.sin(a);return[v[0],v[1]*c-v[2]*s,v[1]*s+v[2]*c]}
function rawVerts(name){
  if(name==="tet"){const r=Math.sqrt(8/9);return[[0,1,0]].concat([90,210,330].map(d=>[r*Math.cos(d*Math.PI/180),-1/3,r*Math.sin(d*Math.PI/180)]))}
  if(name==="cube")return signs([1,1,1]);
  if(name==="oct")return[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  if(name==="ico"){let V=[];signs([0,1,PHI]).forEach(s=>V.push(...cyc(s)));return V.map(v=>rotX(v,-Math.atan(PHI)))}
  if(name==="dod"){let V=signs([1,1,1]);signs([0,1/PHI,PHI]).forEach(s=>V.push(...cyc(s)));return V.map(v=>rotX(v,-Math.atan(PHI)))}
}
const GEO={};
function geo(name){if(GEO[name])return GEO[name];
  const V=rawVerts(name).map(norm),n=V.length,F=[],seen=new Set();
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)for(let k=j+1;k<n;k++){
    let nn=cross(sub(V[j],V[i]),sub(V[k],V[i]));const L=Math.hypot(...nn);if(L<1e-6)continue;nn=mul(nn,1/L);let d=dot(nn,V[i]);if(d<0){nn=mul(nn,-1);d=-d}
    if(V.every(v=>dot(nn,v)<=d+1e-6)){const ids=V.map((v,q)=>Math.abs(dot(nn,v)-d)<1e-6?q:-1).filter(q=>q>=0);const key=ids.join(",");if(seen.has(key))continue;seen.add(key);
      const c=mul(ids.reduce((s,q)=>add(s,V[q]),[0,0,0]),1/ids.length),u=norm(sub(V[ids[0]],c)),w=cross(nn,u);
      ids.sort((a,b)=>Math.atan2(dot(sub(V[a],c),w),dot(sub(V[a],c),u))-Math.atan2(dot(sub(V[b],c),w),dot(sub(V[b],c),u)));
      F.push({v:ids,n:nn,c})}}
  const E=[],ek=new Set();F.forEach(f=>f.v.forEach((a,i)=>{const b=f.v[(i+1)%f.v.length],k=a<b?a+","+b:b+","+a;if(!ek.has(k)){ek.add(k);E.push([Math.min(a,b),Math.max(a,b)])}}));
  return GEO[name]={V,F,E}}

const COL={tet:"#2E9E4F",cube:"#2F6BD8",oct:"#18B7C4",ico:"#1F7FB0",dod:"#B8322A"};
const SOLID_COL={tet:"#ED6A39",cube:"#BD7D41",oct:"#F3C342",ico:"#39A8DD",dod:"#9663CB"};
function hex2rgb(h){h=h.replace("#","");return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16))}
function shadeHex(h,k){const c=hex2rgb(h).map(x=>Math.max(0,Math.min(255,Math.round(x*k))));return`rgb(${c[0]},${c[1]},${c[2]})`}
const LIGHT=norm([-0.45,0.65,0.75]);

/* ================= 3D view widget ================= */
const VIEWS=[];
class View{
  constructor(host){
    this.host=host;this.uid="model-"+VIEWS.length;const d=host.dataset;
    this.name=d.solid||"cube";this.mode=d.mode||"solid";this.ax=+(d.ax||-0.42);this.ay=+(d.ay||0.6);this.spin=d.spin===undefined?0:+d.spin;
    this.zoom=+(d.zoom||1);this.ghost=d.ghost!==undefined;this.color=d.color||(this.mode==="zome"?COL[this.name]:SOLID_COL[this.name]);
    this.g=geo(this.name);this.showB=null;this.showE=null;this.hiB=new Set();this.hiE=new Set();this.hiF=new Set();this.labels=[];this.dragging=false;this.last=0;
    host.innerHTML=`<svg viewBox="0 0 ${host.offsetWidth||400} ${host.offsetHeight||400}" class="v3d"></svg>`;this.svg=host.firstChild;
    this.W=host.offsetWidth||400;this.H=host.offsetHeight||400;
    let px=0,py=0;
    host.addEventListener("pointerdown",e=>{this.targetAngles=null;this.dragging=true;px=e.clientX;py=e.clientY;host.setPointerCapture(e.pointerId);host.classList.add("grab")});
    host.addEventListener("pointermove",e=>{if(!this.dragging)return;const k=stage.getBoundingClientRect().width/1600;this.ay+=(e.clientX-px)/k*0.01;this.ax+=(e.clientY-py)/k*0.01;this.ax=Math.max(-1.5,Math.min(1.5,this.ax));px=e.clientX;py=e.clientY;this.draw()});
    const up=()=>{this.dragging=false;host.classList.remove("grab")};host.addEventListener("pointerup",up);host.addEventListener("pointercancel",up);
    VIEWS.push(this);this.draw()}
  set(name){this.name=name;this.g=geo(name);this.color=this.mode==="zome"?COL[name]:SOLID_COL[name];this.clearHi();this.showB=null;this.showE=null;this.draw()}
  clearHi(){this.hiB=new Set();this.hiE=new Set();this.hiF=new Set();this.hiV=null;this.labels=[]}
  rot(v){let[x,y,z]=v;let c=Math.cos(this.ay),s=Math.sin(this.ay);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(this.ax);s=Math.sin(this.ax);[y,z]=[y*c-z*s,y*s+z*c];return[x,y,z]}
  proj(v){const D=5,k=D/(D-v[2]),S=Math.min(this.W,this.H)*0.36*this.zoom;return[this.W/2+v[0]*S*k,this.H/2-v[1]*S*k,v[2]]}
  home(){this.spin=this.host.dataset.spin===undefined?0:+this.host.dataset.spin;this.targetAngles=[+(this.host.dataset.ax||-.42),+(this.host.dataset.ay||.6)]}
  face(i){this.spin=0;this.hiV=null;this.hiF=new Set([i]);this.labels=[];const n=this.g.F[i].n;this.targetAngles=[Math.atan2(n[1],Math.hypot(n[0],n[2]))-0.32,-Math.atan2(n[0],n[2])+0.38];this.draw()}  /* face the viewer at a slight tilt so it still looks 3D */
  /* the k-th face/vertex counted from the one facing the viewer, so every click shows something new but visible */
  frontFace(k=0){const r=this.g.F.map((f,i)=>[i,this.rot(f.n)[2]]).sort((a,b)=>b[1]-a[1]);return r[k%r.length][0]}
  frontVertex(k=0){const r=this.g.V.map((v,i)=>[i,this.rot(v)[2]+.35*this.rot(v)[1]]).sort((a,b)=>b[1]-a[1]);return r[k%r.length][0]}
  vertex(i){this.spin=0;this.hiV=i;this.hiF=new Set(this.g.F.map((f,k)=>f.v.includes(i)?k:-1).filter(k=>k>=0));this.labels=[];const v=this.g.V[i];
    const ax=Math.max(-1.2,Math.min(1.2,Math.atan2(v[1],Math.hypot(v[0],v[2]))-0.35));this.targetAngles=[ax,-Math.atan2(v[0],v[2])];this.draw();return this.hiF.size}
  tick(dt){if(this.targetAngles&&!this.dragging){const a=this.targetAngles,k=reduce?1:Math.min(1,dt*7);this.ax+=(a[0]-this.ax)*k;let d=a[1]-this.ay;d=Math.atan2(Math.sin(d),Math.cos(d));this.ay+=d*k;if(Math.abs(a[0]-this.ax)+Math.abs(d)<.002)this.targetAngles=null;this.draw()}else if(!this.dragging&&this.spin&&!reduce){this.ay+=this.spin*dt;this.draw()}}

  draw(){
    const g=this.g,R=g.V.map(v=>this.rot(v)),P=R.map(v=>this.proj(v));let out="";const items=[];
    if(this.mode==="solid"){
      const S=Math.min(this.W,this.H)*0.36*this.zoom,base=this.color,line=shadeHex(base,.5);
      const ys=P.map(p=>p[1]),gy=Math.max(...ys)+S*.12;
      items.push([-99,`<ellipse cx="${(this.W/2).toFixed(1)}" cy="${gy.toFixed(1)}" rx="${(S*.85).toFixed(1)}" ry="${(S*.13).toFixed(1)}" fill="url(#${this.uid}-sh)"/>`]);
      g.F.forEach((f,i)=>{const n=this.rot(f.n);if(n[2]<=0.0001)return;const lit=Math.max(0,dot(n,LIGHT)),k=0.58+0.42*lit+0.06*n[2];
        const pts=f.v.map(q=>P[q][0].toFixed(1)+","+P[q][1].toFixed(1)).join(" ");const hi=this.hiF.has(i);
        const fill=hi?shadeHex("#FFB347",0.8+0.25*lit):shadeHex(base,k);
        const gl=lit>.55?`<polygon points="${pts}" fill="url(#${this.uid}-gl)" opacity="${((lit-.55)*1.6).toFixed(2)}"/>`:"";
        items.push([f.v.reduce((s,q)=>s+R[q][2],0)/f.v.length,`<polygon points="${pts}" fill="${fill}" stroke="${hi?"#C2410C":line}" stroke-width="${hi?4.5:3}" stroke-linejoin="round"/>${gl}`])});
      if(this.hiV!=null){const p=P[this.hiV];items.push([99,`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${(S*.075+6).toFixed(1)}" fill="#E8742A" stroke="#fff" stroke-width="4"/>`])}
    }else{
      const S=Math.min(this.W,this.H)*0.36*this.zoom,br=S*0.085,sw=S*0.055;
      g.F.forEach((f,i)=>{if(!this.hiF.has(i))return;const pts=f.v.map(q=>P[q][0].toFixed(1)+","+P[q][1].toFixed(1)).join(" ");const n=this.rot(f.n);
        items.push([f.v.reduce((s,q)=>s+R[q][2],0)/f.v.length-0.3,`<polygon points="${pts}" fill="#FFB347" fill-opacity="${n[2]>0?0.6:0.28}" stroke="none"/>`])});
      g.E.forEach(([a,b],i)=>{if(this.showE&&!this.showE.has(i)){if(this.ghost){const p=P[a],q=P[b];items.push([(R[a][2]+R[b][2])/2-5,`<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="#AEB9CC" stroke-opacity=".55" stroke-width="5" stroke-dasharray="10 9" stroke-linecap="round"/>`])}return}const hi=this.hiE.has(i),c=hi?"#FF7A1A":this.color,z=(R[a][2]+R[b][2])/2,p=P[a],q=P[b];
        items.push([z,`<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="#1d2233" stroke-opacity=".55" stroke-width="${(sw+4).toFixed(1)}" stroke-linecap="round"/><line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="${c}" stroke-width="${(hi?sw*1.35:sw).toFixed(1)}" stroke-linecap="round"/>`])});
      g.V.forEach((v,i)=>{if(this.showB&&!this.showB.has(i)){if(this.ghost){const p=P[i];items.push([p[2]-5,`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${(br*.6).toFixed(1)}" fill="none" stroke="#AEB9CC" stroke-width="3" stroke-dasharray="5 5"/>`])}return}const p=P[i],hi=this.hiB.has(i),k=5/(5-p[2]);
        items.push([p[2]+0.02,`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${(br*k*(hi?1.3:1)).toFixed(1)}" fill="url(#${this.uid}-${hi?"bh":"bw"})" stroke="${hi?"#C2410C":"#8A93A6"}" stroke-width="2"/>`])});
    }
    items.sort((a,b)=>a[0]-b[0]);out=items.map(x=>x[1]).join("");
    const lab=this.labels.map(l=>{let p;if(l.t==="v")p=P[l.i];else if(l.t==="e"){const[a,b]=g.E[l.i];p=[(P[a][0]+P[b][0])/2,(P[a][1]+P[b][1])/2]}else{const f=g.F[l.i];p=[f.v.reduce((s,q)=>s+P[q][0],0)/f.v.length,f.v.reduce((s,q)=>s+P[q][1],0)/f.v.length]}
      return`<g class="lab"><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="19" fill="#1E2A44"/><text x="${p[0].toFixed(1)}" y="${(p[1]+8).toFixed(1)}" text-anchor="middle" font-size="22" font-weight="900" fill="#fff">${l.n}</text></g>`}).join("");
    this.svg.innerHTML=`<defs><radialGradient id="${this.uid}-bw" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#E4E8EF"/><stop offset="1" stop-color="#B7BFCC"/></radialGradient><radialGradient id="${this.uid}-bh" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FFE3C2"/><stop offset="1" stop-color="#FF8A2A"/></radialGradient><radialGradient id="${this.uid}-sh"><stop offset="0" stop-color="#1E2A44" stop-opacity=".28"/><stop offset="1" stop-color="#1E2A44" stop-opacity="0"/></radialGradient><linearGradient id="${this.uid}-gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>${out}${lab}`}
  /* order helpers for counting: top-to-bottom, then around */
  order(list,center){return list.map((p,i)=>[i,p]).sort((a,b)=>{const ra=this.rot(a[1]),rb=this.rot(b[1]);return(rb[1]-ra[1])||Math.atan2(ra[0],ra[2])-Math.atan2(rb[0],rb[2])}).map(x=>x[0])}
}
function initViews(root){$$("[data-v3d]",root).forEach(h=>{if(!h._v){h._v=new View(h);h.tabIndex=0;h.setAttribute("role","img");h.setAttribute("aria-label",({tet:"正四面体",cube:"立方体",oct:"正八面体",dod:"正十二面体",ico:"正二十面体"}[h.dataset.solid]||"立体模型")+"，拖动或方向键旋转");h.addEventListener("keydown",e=>{if(!e.key.startsWith("Arrow"))return;e.preventDefault();e.stopPropagation();if(e.key==="ArrowLeft")h._v.ay-=.15;if(e.key==="ArrowRight")h._v.ay+=.15;if(e.key==="ArrowUp")h._v.ax-=.15;if(e.key==="ArrowDown")h._v.ax+=.15;h._v.draw()})}})}

/* ================= fold lab: n regular k-gons around one corner ================= */
class Fold{
  constructor(host){this.host=host;this.W=host.offsetWidth;this.H=host.offsetHeight;host.innerHTML=`<svg viewBox="0 0 ${this.W} ${this.H}" class="v3d"></svg>`;this.svg=host.firstChild;
    this.k=3;this.n=3;this.t=0;this.target=0;this.ax=-0.62;this.ay=0.3;this.dragging=false;this.spin=0;
    let px=0,py=0;host.addEventListener("pointerdown",e=>{this.targetAngles=null;this.dragging=true;px=e.clientX;py=e.clientY;host.setPointerCapture(e.pointerId)});
    host.addEventListener("pointermove",e=>{if(!this.dragging)return;const s=stage.getBoundingClientRect().width/1600;this.ay+=(e.clientX-px)/s*.01;this.ax+=(e.clientY-py)/s*.01;this.ax=Math.max(-1.55,Math.min(.4,this.ax));px=e.clientX;py=e.clientY;this.draw()});
    host.addEventListener("pointerup",()=>this.dragging=false);host.addEventListener("pointercancel",()=>this.dragging=false);VIEWS.push(this);this.draw()}
  get theta(){return(this.k-2)*Math.PI/this.k}
  get sum(){return this.n*(this.k-2)*180/this.k}
  setup(k,n){this.k=k;this.n=n;this.t=0;this.target=0;this.draw()}
  canFold(){return this.n*this.theta<2*Math.PI-1e-6}
  faces(){const th=this.theta,n=this.n,k=this.k,L=1.05;let phi=th;
    if(this.canFold())phi=th+this.t*(2*Math.PI/n-th);
    let s2=this.canFold()?(1-Math.cos(th))/(1-Math.cos(phi)):1;s2=Math.min(1,s2);const sb=Math.sqrt(s2),cb=Math.sqrt(Math.max(0,1-s2));
    const start=-(n*phi)/2+Math.PI/2;
    const e=i=>{const a=start+i*phi;return[sb*Math.cos(a),-cb,sb*Math.sin(a)]};
    const out=[];for(let i=0;i<n;i++){const u=norm(e(i)),v=e(i+1);let w=sub(v,mul(u,dot(v,u)));w=norm(w);
      const pts=[[0,0,0]];let x=0,y=0,h=0;for(let j=1;j<k;j++){x+=L*Math.cos(h);y+=L*Math.sin(h);pts.push(add(mul(u,x),mul(w,y)));h+=2*Math.PI/k}
      out.push(pts)}
    const lift=cb*0.55,over=n*th>2*Math.PI+1e-6;return out.map((p,i)=>p.map(q=>[q[0],q[1]+lift+(over&&i===n-1?0.06:0),q[2]]))}
  rot(v){let[x,y,z]=v;let c=Math.cos(this.ay),s=Math.sin(this.ay);[x,z]=[x*c+z*s,-x*s+z*c];c=Math.cos(this.ax);s=Math.sin(this.ax);[y,z]=[y*c-z*s,y*s+z*c];return[x,y,z]}
  proj(v){const D=6,k=D/(D-v[2]),S=this.frameScale||100;return[this.W/2+(v[0]*k-(this.frameCenter?.[0]||0))*S,this.H/2-(v[1]*k-(this.frameCenter?.[1]||0))*S,v[2]]}
  tick(dt){let ch=false;if(Math.abs(this.t-this.target)>1e-3){this.t+=(this.target-this.t)*Math.min(1,dt*3.2);ch=true}if(!this.dragging&&this.spin&&!reduce){this.ay+=this.spin*dt;ch=true}if(ch)this.draw()}
  draw(){const F=this.faces();const projected=F.flat().map(q=>{const r=this.rot(q),k=6/(6-r[2]);return[r[0]*k,r[1]*k]});const xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);this.frameCenter=[(xmin+xmax)/2,(ymin+ymax)/2];this.frameScale=Math.min(this.W*.36,this.H*.40,(this.W-50)/(xmax-xmin||1),(this.H-65)/(ymax-ymin||1));const cols={3:"#3A9A5B",4:"#2F6BD8",5:"#E8742A",6:"#8A63D2",7:"#8A6D3B"},base=cols[this.k]||"#666",over=this.n*this.theta>2*Math.PI+1e-6;
    const items=F.map((pts,i)=>{const R=pts.map(p=>this.rot(p)),P=R.map(p=>this.proj(p));let nn=norm(cross(sub(R[1],R[0]),sub(R[R.length-1],R[0])));const kk=0.62+0.38*Math.abs(dot(nn,LIGHT));
      const bad=over&&i===F.length-1;const col=bad?"#D64545":base;
      return[R.reduce((s,p)=>s+p[2],0)/R.length,`<polygon points="${P.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")}" fill="${shadeHex(col,kk)}" fill-opacity="${bad?"0.75":"0.92"}" stroke="#1E2A44" stroke-width="3.5" stroke-linejoin="round"/>`]});
    items.sort((a,b)=>a[0]-b[0]);if(over){const i=items.findIndex(x=>x[1].includes('fill-opacity="0.75"'));if(i>=0)items.push(items.splice(i,1)[0])}const o=this.proj(this.rot(this.faces()[0][0]));
    this.svg.innerHTML=items.map(x=>x[1]).join("")+`<circle cx="${o[0].toFixed(1)}" cy="${o[1].toFixed(1)}" r="11" fill="#E8742A" stroke="#1E2A44" stroke-width="3"/>`}
}


/* ================= tiling lab: 密铺 patches (6 tri / 4 sq / 3 hex around a vertex, grown outward) ================= */
class Tiling{
  static N = 0;
  constructor(host){this.host=host;this.W=host.offsetWidth||400;this.H=host.offsetHeight||300;this.uid="tiling-"+(Tiling.N++);host.innerHTML=`<svg viewBox="0 0 ${this.W} ${this.H}" class="v3d"></svg>`;this.svg=host.firstChild;this.k=3;this.rings=1;VIEWS.push(this);this.draw()}
  setup(k,rings=1){this.k=k;this.rings=rings;this.draw()}
  more(){if(this.rings<3)this.rings++;this.draw();return this.rings}
  tick(){}
  cells(){
    const R=this.rings,cells=[];
    if(this.k===3){
      const ux=1,uy=0,vx=.5,vy=Math.sqrt(3)/2,inR=(x,y)=>Math.hypot(x,y)<=R+1e-6;
      for(let i=-R-1;i<=R+1;i++)for(let j=-R-1;j<=R+1;j++){
        const x0=i*ux+j*vx,y0=i*uy+j*vy,x1=x0+ux,y1=y0+uy,x2=x0+vx,y2=y0+vy,x3=x0+ux+vx,y3=y0+uy+vy;
        if(inR(x0,y0)&&inR(x1,y1)&&inR(x2,y2))cells.push([[x0,y0],[x1,y1],[x2,y2]]);
        if(inR(x1,y1)&&inR(x2,y2)&&inR(x3,y3))cells.push([[x1,y1],[x3,y3],[x2,y2]]);
      }
    }else if(this.k===4){
      const n=this.rings;
      for(let i=-n;i<n;i++)for(let j=-n;j<n;j++)cells.push([[i,j],[i+1,j],[i+1,j+1],[i,j+1]]);
    }else{
      for(let q=-R-1;q<=R+1;q++)for(let r=-R-1;r<=R+1;r++){
        const cx=1.5*q-1,cy=Math.sqrt(3)*(r+q/2);
        const d=Math.min(...[[0,0],[1,0],[1,-1]].map(([hq,hr])=>{const dq=q-hq,dr=r-hr;return(Math.abs(dq)+Math.abs(dr)+Math.abs(dq+dr))/2}));
        if(d>R-1)continue;
        const p=[];for(let k=0;k<6;k++){const a=Math.PI/3*k;p.push([cx+Math.cos(a),cy+Math.sin(a)])}
        cells.push(p);
      }
    }
    return cells;
  }
  draw(){
    const cells=this.cells(),pts=cells.flat();
    const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
    const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    const pad=52;this.frameScale=Math.min((this.W-pad*2)/(xmax-xmin||1),(this.H-pad*2)/(ymax-ymin||1));
    const cx=(xmin+xmax)/2,cy=(ymin+ymax)/2;
    const T=p=>[this.W/2+(p[0]-cx)*this.frameScale,this.H/2-(p[1]-cy)*this.frameScale];
    const cols={3:["#57B36B","#2E8C4F"],4:["#5B8BE0","#1D5BB8"],6:["#F09A4E","#D8641A"]},col=cols[this.k];
    const es=new Set(),E=[],vs=new Set();
    for(const c of cells)for(let i=0;i<c.length;i++){
      const a=c[i],b=c[(i+1)%c.length],ka=a[0].toFixed(3)+","+a[1].toFixed(3),kb=b[0].toFixed(3)+","+b[1].toFixed(3);
      vs.add(ka);vs.add(kb);
      const key=ka<kb?ka+"|"+kb:kb+"|"+ka;
      if(!es.has(key)){es.add(key);E.push([a,b])}
    }
    const sw=Math.max(5,this.frameScale*.055),br=sw*1.35;
    const fills=cells.map(c=>c.map(p=>T(p).map(v=>v.toFixed(1)).join(",")).join(" "))
      .map(pts=>`<polygon points="${pts}" fill="${col[0]}" fill-opacity=".22" stroke="none"/>`).join("");
    const lines=E.map(([a,b])=>{const p=T(a),q=T(b);
      return `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="#1E2A44" stroke-opacity=".5" stroke-width="${(sw+4).toFixed(1)}" stroke-linecap="round"/><line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="${col[1]}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round"/>`}).join("");
    const balls=[...vs].map(k=>{const [x,y]=k.split(",").map(Number),P=T([x,y]);
      return `<circle cx="${P[0].toFixed(1)}" cy="${P[1].toFixed(1)}" r="${br.toFixed(1)}" fill="url(#${this.uid}-bw)" stroke="#8A93A6" stroke-width="2"/>`}).join("");
    this.svg.innerHTML=`<defs><radialGradient id="${this.uid}-bw" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#E4E8EF"/><stop offset="1" stop-color="#B7BFCC"/></radialGradient></defs>${fills}${lines}${balls}`;
  }
}
window.ClassroomGeometry={View,Fold,Tiling,geo,views:VIEWS};
})();