/* Zometool 3D models for the courseware (Three.js r128).
   Balls and struts use vZome's own "lifelike" part shapes (window.ZOMEPARTS, converted from
   vZome's open-source connector.vef / yellow.vef), placed with the icosahedral symmetry that
   real Zometool has, so every strut sits in its matching hole exactly as in vZome. */
(function () {
  "use strict";
  const PHI = (1 + Math.sqrt(5)) / 2;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const add = (a, b, k = 1) => a.clone().addScaledVector(b, k);

  /* ---------- icosahedral rotation group (blue axes = x, y, z, as in vZome) ---------- */
  let GROUP = null;
  function icoGroup() {
    if (GROUP) return GROUP;
    const p = PHI, ip = 1 / PHI;
    const gens = [
      new THREE.Matrix3().set(0, 0, 1, 1, 0, 0, 0, 1, 0),                       // 3-fold about (1,1,1)
      new THREE.Matrix3().set(-1, 0, 0, 0, -1, 0, 0, 0, 1),                     // 2-fold about z
      new THREE.Matrix3().set(0.5, -p / 2, ip / 2, p / 2, ip / 2, -0.5, ip / 2, 0.5, p / 2), // 5-fold
    ];
    const key = (m) => m.elements.map((x) => x.toFixed(4)).join();
    const out = [new THREE.Matrix3()], seen = new Set([key(out[0])]);
    for (let i = 0; i < out.length && out.length < 60; i++)
      for (const g of gens) { const m = new THREE.Matrix3().multiplyMatrices(g, out[i]); const k = key(m); if (!seen.has(k)) { seen.add(k); out.push(m); } }
    if (out.length !== 60) console.warn('icosahedral group size', out.length);
    GROUP = out; return out;
  }
  function rotFor(from, to, free) {    // group element taking direction `from` onto `to` (or a plain rotation if none fits)
    const f = from.clone().normalize(), t = to.clone().normalize(); let best = null, bd = -2;
    for (const m of icoGroup()) { const d = f.clone().applyMatrix3(m).dot(t); if (d > bd) { bd = d; best = m; } }
    if (free && bd < 0.9999) { const q = new THREE.Quaternion().setFromUnitVectors(f, t); return new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); }
    return best;
  }

  /* ---------- part geometry from vZome ---------- */
  const lin = (c) => new THREE.Color(c).convertSRGBToLinear();
  function ballGeometry() {
    const P = window.ZOMEPARTS.ball, g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(P.v, 3)); g.setIndex(P.t);
    const n = g.toNonIndexed(); n.computeVertexNormals(); return n;
  }
  function strutGeometry(A, B, kind = "yellow") {
    const L = B.clone().sub(A), len = L.length(), full = window.ZOMEPARTS[kind] || window.ZOMEPARTS.yellow, fl = Math.hypot(...full.dir);
    const shortP = window.ZOMEPARTS[kind + "-short"] || (window.ZOMEPARTS[kind] ? null : window.ZOMEPARTS["yellow-short"]);
    const P = len < fl * 0.8 && shortP ? shortP : full;
    const dir = V(...P.dir), R = rotFor(dir, L, true), tip = new Set(P.tipSet), mid = new Set(P.midSet), pos = [];
    for (let i = 0; i < P.v.length / 3; i++) {
      const v = V(P.v[3 * i], P.v[3 * i + 1], P.v[3 * i + 2]).applyMatrix3(R).add(A);
      if (tip.has(i)) v.add(L); else if (mid.has(i)) v.addScaledVector(L, 0.5);
      pos.push(v.x, v.y, v.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(P.t);
    const n = g.toNonIndexed(); n.computeVertexNormals(); return n;
  }

  const MODELS = {};
  function labelTexture(t, style) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    if (style === "pocket") { g.fillStyle = "#FFF6EE"; g.strokeStyle = "#E8742A"; g.lineWidth = 9; g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = "#E8742A"; }
    else { g.fillStyle = "#E8742A"; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill(); g.fillStyle = "#fff"; } g.font = "900 78px Microsoft YaHei, Noto Sans SC, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, 64, 70);
    const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding; return tx;
  }
  function cyl(a, b, rad, mat) {
    const dir = b.clone().sub(a), len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 12, 1), mat);
    m.position.copy(a).addScaledVector(dir, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize()); return m;
  }

  function mount(host, kind, opt = {}) {
    let M = MODELS[kind](opt.stage || undefined); if (M.grow) M.stage = opt.stage || M.grow;
    const MF = M.grow ? MODELS[kind](M.grow) : M;
    if (opt.yawAdd) M.orient.premultiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), (opt.yawAdd * Math.PI) / 180));
    if (opt.elev != null && !isNaN(opt.elev)) M.elev = opt.elev;
    const W = host.clientWidth, H = host.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    const pr = () => { const k = host.getBoundingClientRect().width / (host.clientWidth || 1); return Math.min(3, (window.devicePixelRatio || 1) * Math.max(1, k)); };
    renderer.setPixelRatio(pr()); renderer.setSize(W, H); renderer.setClearColor(0x000000, 0); renderer.outputEncoding = THREE.sRGBEncoding;
    const onResize = () => { renderer.setPixelRatio(pr()); renderer.setSize(W, H); }; window.addEventListener("resize", onResize);
    const onFull = () => onResize(); document.addEventListener("fullscreenchange", onFull);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:none;cursor:grab";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b0, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.85); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.3); fill.position.set(4, -2, 6); scene.add(fill);
    const group = new THREE.Group(); group.quaternion.copy(M.orient); scene.add(group);

    const FP = MF.balls.map((b) => b[0]).concat(MF.labels.filter((l) => l[2] === "pocket").map((l) => l[0]));
    const center = new THREE.Vector3(); FP.forEach((p) => center.add(p)); center.multiplyScalar(1 / FP.length); if (M.center) center.copy(M.center);
    const cpos = (p) => p.clone().sub(center);
    const mat = {
      white: new THREE.MeshStandardMaterial({ color: lin(0xd9dce1), roughness: 0.42, metalness: 0.02, side: THREE.DoubleSide }),
      red: new THREE.MeshStandardMaterial({ color: lin(0xd8332a), roughness: 0.38, metalness: 0.02, side: THREE.DoubleSide }),
      yellow: new THREE.MeshStandardMaterial({ color: lin(0xf2b200), roughness: 0.3, metalness: 0.05, side: THREE.DoubleSide }),
      blue: new THREE.MeshStandardMaterial({ color: lin(0x1d6f9e), roughness: 0.32, metalness: 0.05, side: THREE.DoubleSide }),
      green: new THREE.MeshStandardMaterial({ color: lin(0x0f7d30), roughness: 0.32, metalness: 0.05, side: THREE.DoubleSide }),
    };
    mat.orange=new THREE.MeshStandardMaterial({color:lin(0xffa332),roughness:.4,side:THREE.DoubleSide});
    const BG = ballGeometry(), built = new Map(), popping = [];
    const prevKeys = new Set(), growing = [];
    const fromK = opt.from ? String(opt.from).split('@') : null;   // "name@stage" grows new parts out of that earlier stage
    if (fromK && MODELS[fromK[0]]) { const P0 = MODELS[fromK[0]](fromK[1] ? +fromK[1] : undefined); const kk = (p) => p.toArray().map((x) => x.toFixed(2)).join();
      P0.balls.forEach(([p]) => prevKeys.add(kk(p))); P0.struts.forEach(([a, b]) => { prevKeys.add(kk(a) + "|" + kk(b)); prevKeys.add(kk(b) + "|" + kk(a)); }); }
    const keyOf = (a, b) => a.toArray().map((x) => x.toFixed(2)).join() + (b ? "|" + b.toArray().map((x) => x.toFixed(2)).join() : "");
    function buildParts(pop) {
      const want = new Set();
      for (const [p, col] of M.balls) { const k = keyOf(p); want.add(k); if (built.has(k)) continue;
        const m = new THREE.Mesh(BG, mat[col]); m.position.copy(cpos(p)); group.add(m); built.set(k, m);
        if (prevKeys.size && !prevKeys.has(k)) m.scale.setScalar(0.001); else if (pop) { m.scale.setScalar(0.01); popping.push(m); } }
      for (const [a, b, kd] of M.struts) { const k = keyOf(a, b); want.add(k); if (built.has(k)) continue;
        if (prevKeys.size && !prevKeys.has(k)) {          // a new strut: grow it out of the part that was already there
          const [s0, s1] = prevKeys.has(keyOf(b)) && !prevKeys.has(keyOf(a)) ? [b, a] : [a, b], A = cpos(s0), B = cpos(s1);
          const geo = strutGeometry(A, B, kd || "yellow"), q = new THREE.Quaternion().setFromUnitVectors(B.clone().sub(A).normalize(), V(0, 1, 0));
          geo.translate(-A.x, -A.y, -A.z); geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
          const m = new THREE.Mesh(geo, mat[kd || "yellow"]); m.position.copy(A); m.quaternion.copy(q.clone().invert()); m.scale.set(1, 0.001, 1);
          group.add(m); built.set(k, m); growing.push({ m, end: keyOf(s1) }); continue;
        }
        const m = new THREE.Mesh(strutGeometry(cpos(a), cpos(b), kd || "yellow"), mat[kd || "yellow"]); group.add(m); built.set(k, m); if (pop) { m.scale.setScalar(0.01); popping.push(m); } }
      for (const [k, m] of built) if (!want.has(k)) { group.remove(m); if (m.geometry !== BG) m.geometry.dispose(); built.delete(k); }
    }
    buildParts(false);
    const emphasis=new THREE.Group();group.add(emphasis);
    const faceMat=new THREE.MeshBasicMaterial({color:0xffb04e,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
    function clearEmphasis(){while(emphasis.children.length){const m=emphasis.children[0];emphasis.remove(m);m.geometry.dispose()}for(const [p] of M.balls){const m=built.get(keyOf(p));if(m)m.material=mat.white}for(const [a,b,kd] of M.struts){const m=built.get(keyOf(a,b));if(m)m.material=mat[kd||'yellow']}}
    function markFaces(ids,vertex){clearEmphasis();for(const index of ids){const face=M.faces?.[index];if(!face)continue;const points=face.map(i=>cpos(M.balls[i][0])),pos=[];for(let i=1;i<points.length-1;i++)pos.push(...points[0].toArray(),...points[i].toArray(),...points[i+1].toArray());const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));emphasis.add(new THREE.Mesh(g,faceMat));}
      if(vertex!=null){const m=built.get(keyOf(M.balls[vertex][0]));if(m)m.material=mat.orange}return ids.length;
    }

    let popT0 = 0, growT0 = null, growDone = null;
    const dmat = new THREE.MeshBasicMaterial({ color: lin(0xe8742a) });
    const ends = new Set(M.labels.filter((l) => l[2] === "pocket").map((l) => l[0]));
    for (const [a, b] of M.dashes) {
      const A = cpos(a), B0 = cpos(b), B = ends.has(b) ? add(B0, B0.clone().sub(A).normalize(), -0.85) : B0, L = A.distanceTo(B), n = Math.round(L / 0.7), d = B.clone().sub(A).normalize();
      for (let i = 0; i < n; i += 2) group.add(cyl(add(A, d, (i * L) / n), add(A, d, ((i + 1) * L) / n), 0.08, dmat));
    }
    const labels = M.labels.map(([p, t, style]) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(t, style), depthTest: false }));
      const k = style === "pocket" ? 1.6 : 1.9; sp.scale.set(k, k, 1); sp.renderOrder = 10; sp.userData.at = cpos(p); sp.userData.on = style === "pocket"; scene.add(sp); return sp;
    });

    const camera = new THREE.PerspectiveCamera(18, W / H, 0.5, 900);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false; controls.enableZoom = true; controls.zoomSpeed = 0.8; controls.rotateSpeed = 0.9;
    const el = (M.elev * Math.PI) / 180;
    let dist = 60;
    const home = () => new THREE.Vector3(0, Math.sin(el), Math.cos(el)).multiplyScalar(dist);
    const world = (p) => p.clone().applyQuaternion(group.quaternion);
    const fit = () => {
      for (let k = 0; k < 5; k++) {
        camera.position.copy(home()); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
        let lo = 1e9, hi = -1e9, lx = 1e9, hx = -1e9; FP.forEach((p) => { const q = world(cpos(p)).project(camera); lo = Math.min(lo, q.y); hi = Math.max(hi, q.y); lx = Math.min(lx, q.x); hx = Math.max(hx, q.x); });
        const bp = (1.06 / (dist * Math.tan((camera.fov * Math.PI) / 360))) * H;   // ball diameter in px
        const ph = ((hi - lo) / 2) * H + bp, pw = ((hx - lx) / 2) * W + bp;
        dist *= Math.max(ph / (opt.fitH || H * 0.7), opt.fitW ? pw / opt.fitW : 0);
      }
      camera.position.copy(home()); controls.target.set(0, 0, 0); controls.update();
    };
    fit(); if (opt.zoom) { dist /= opt.zoom; camera.position.copy(home()); }
    controls.minDistance = dist * 0.35; controls.maxDistance = dist * 1.6;
    const fitFrom = (pts, dirv) => {       // camera distance that fits these points, seen from direction dirv
      const cam = camera.clone(); let d = dist;
      for (let k = 0; k < 5; k++) {
        cam.position.copy(dirv.clone().normalize().multiplyScalar(d)); cam.up.set(0, 1, 0); if (Math.abs(dirv.y) > 0.99) cam.up.set(0, 0, -1);
        cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
        let lo = 1e9, hi = -1e9, lx = 1e9, hx = -1e9; pts.forEach((p) => { const q = world(cpos(p)).project(cam); lo = Math.min(lo, q.y); hi = Math.max(hi, q.y); lx = Math.min(lx, q.x); hx = Math.max(hx, q.x); });
        const bp = (1.06 / (d * Math.tan((cam.fov * Math.PI) / 360))) * H;
        d *= Math.max((Math.max(hi, -lo) * H + bp) / (opt.fitH || H * 0.7), opt.fitW ? (Math.max(hx, -lx) * W + bp) / opt.fitW : 0);
      }
      return d;
    };
    const stageDist = M.grow ? [0].concat(Array.from({ length: M.grow }, (_, i) => Math.max(fitFrom(MODELS[kind](i + 1).balls.map((b) => b[0]), home()), dist * 0.5))) : null;
    const topDist = fitFrom(MF.balls.map((b) => b[0]), V(0, 1, 0)) * 1.05;
    if (stageDist) { controls.maxDistance = Math.max(dist, topDist) * 1.6; }

    let anim = null, raf = 0, alive = true;
    const h0 = home(), th0 = Math.atan2(h0.x, h0.z), ph0 = Math.acos(h0.y / h0.length());
    const sph = () => { const p = camera.position; const r = p.length(); return { r, th: Math.atan2(p.x, p.z), ph: Math.acos(p.y / r) }; };
    const setSph = (r, th, ph) => { camera.position.set(r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), r * Math.sin(ph) * Math.cos(th)); camera.lookAt(0, 0, 0); };
    function animateTo(th1, ph1, dur, r1 = null) {
      const a = sph(); let dth = th1 - a.th; dth = Math.atan2(Math.sin(dth), Math.cos(dth));
      const t0 = performance.now(); controls.enabled = false;
      anim = (now) => { const t = Math.min(1, (now - t0) / dur), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        setSph(r1 ? a.r + (r1 - a.r) * e : a.r, a.th + dth * e, a.ph + (ph1 - a.ph) * e); if (t >= 1) { anim = null; controls.enabled = true; controls.update(); } };
    }
    const tick = (now) => {
      if (!alive) return;
      if (anim) anim(now); else controls.update();
      if (growT0 !== null && growing.length) { if (!growT0) growT0 = now; const t = (now - growT0) / 1000;
        let doneAll = true;
        growing.forEach((gp, i) => { const u = Math.min(1, Math.max(0, (t - 0.12 * (i % 6)) / 1.1)), e = 1 - Math.pow(1 - u, 3); gp.m.scale.y = Math.max(0.001, e);
          const ball = built.get(gp.end); if (ball && u >= 1) { const w = Math.min(1, (t - 0.12 * (i % 6) - 1.1) / 0.3); ball.scale.setScalar(Math.max(0.001, w < 1 ? w * (1 + 0.3 * Math.sin(w * Math.PI)) : 1)); if (w < 1) doneAll = false; } else doneAll = false; });
        if (doneAll) { growing.length = 0; growT0 = null; growDone && growDone(); } }
      if (popping.length) { if (!popT0) popT0 = now; const t = Math.min(1, (now - popT0) / 450), e = t < 1 ? 1 + 0.25 * Math.sin(t * Math.PI) * (1 - t) : 1;
        popping.forEach((m) => { if (m.geometry === BG) m.scale.setScalar(Math.max(0.01, t * e)); else m.scale.setScalar(1); }); if (t >= 1) { popping.forEach((m) => m.scale.setScalar(1)); popping.length = 0; popT0 = 0; } }
      key.position.copy(camera.position).add(V(-25, 35, 0));
      const right = V(1, 0, 0).applyQuaternion(camera.quaternion), up = V(0, 1, 0).applyQuaternion(camera.quaternion);
      labels.forEach((l) => { l.position.copy(world(l.userData.at)); if (!l.userData.on) l.position.addScaledVector(right, 1.6).addScaledVector(up, 1.4); });
      if (opt.onAngle) opt.onAngle(((sph().th - th0) * 180) / Math.PI);
      renderer.render(scene, camera); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    renderer.domElement.addEventListener("pointerdown", () => { opt.onInteract && opt.onInteract(); anim = null; controls.enabled = true; renderer.domElement.style.cursor = "grabbing"; });
    renderer.domElement.addEventListener("pointerup", () => { renderer.domElement.style.cursor = "grab"; });
    return {
      inspect(){return{balls:M.balls.length,struts:M.struts.length,faces:M.faces?.length||0,visibleBalls:[...built.values()].filter(m=>m.geometry===BG&&m.scale.x>.9).length,visibleStruts:[...built.values()].filter(m=>m.geometry!==BG&&m.scale.y>.9).length,positions:M.balls.map(b=>b[0].toArray()),edges:M.edges||[],faceIndices:M.faces||[]}},
      face(i=0){return markFaces([i])},
      vertex(i=0){const ids=(M.faces||[]).map((f,k)=>f.includes(i)?k:-1).filter(k=>k>=0);return markFaces(ids,i)},
      clear:clearEmphasis,
      flip(){animateTo(sph().th,Math.PI*.68,1100)},
      top() { animateTo(sph().th, 0.0001, 1600, stageDist ? topDist * stageDist[M.stage || 1] / stageDist[M.grow] : null); },
      growIn(done) { growDone = done; growT0 = 0; },
      intro(done, dur = 1600) { if (stageDist) dist = stageDist[M.stage || 1]; let t0 = 0, n = 0; controls.enabled = false; setSph(dist * 1.45, th0 - Math.PI * 2, ph0 + 0.2);
        anim = (now) => { if (n++ < 2) { t0 = now; return; } const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
          setSph(dist * (1.45 - 0.45 * e), th0 - Math.PI * 2 * (1 - e), ph0 + 0.2 * (1 - e)); if (t >= 1) { anim = null; controls.enabled = true; controls.update(); done && done(); } }; },
      spin(dur = 3600) { const a = sph(), t0 = performance.now(); controls.enabled = false;
        anim = (now) => { const t = Math.min(1, (now - t0) / dur), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          setSph(a.r, a.th + e * Math.PI * 2, a.ph); if (t >= 1) { anim = null; controls.enabled = true; controls.update(); } }; },
      setAngle(deg) { anim = null; const a = sph(); setSph(a.r, th0 + (deg * Math.PI) / 180, a.ph); controls.update(); },
      home() { animateTo(th0, ph0, 1200, stageDist ? stageDist[M.stage || 1] : dist); },
      zoomTo(k, dur = 1400) { if (!stageDist) return; const a = sph(); animateTo(a.th, a.ph, dur, stageDist[k]); },
      jumpStage(k) { if (!stageDist) return; anim = null; const a = sph(); setSph(stageDist[k], a.th, a.ph); controls.update(); },
      /* light the balls one by one (for counting); calls each(n) after every ball and done(total) at the end */
      /* light rods / faces one by one (top to bottom, around), same contract as countBalls */
      countEdges(each, done, gap = 160) { clearEmphasis(); const list = M.struts.map(([a, b]) => [built.get(keyOf(a, b)), a.clone().add(b).multiplyScalar(0.5).sub(center).applyQuaternion(group.quaternion)]).filter((x) => x[0]);
        list.sort((p, q) => q[1].y - p[1].y || Math.atan2(p[1].x, p[1].z) - Math.atan2(q[1].x, q[1].z)); let i = 0;
        const step = () => { if (!alive) return; if (i >= list.length) { done && done(list.length); return; } list[i][0].material = mat.orange; i++; each && each(i); setTimeout(step, gap); }; step(); },
      countFaces(each, done, gap = 300) { clearEmphasis(); const F = (M.faces || []).map((f) => { const pts = f.map((k) => cpos(M.balls[k][0])); const c = pts.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length).applyQuaternion(group.quaternion); return [pts, c]; });
        F.sort((p, q) => q[1].y - p[1].y || Math.atan2(p[1].x, p[1].z) - Math.atan2(q[1].x, q[1].z)); let i = 0;
        const step = () => { if (!alive) return; if (i >= F.length) { done && done(F.length); return; } const pts = F[i][0], pos = []; for (let j = 1; j < pts.length - 1; j++) pos.push(...pts[0].toArray(), ...pts[j].toArray(), ...pts[j + 1].toArray());
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); emphasis.add(new THREE.Mesh(g, faceMat)); i++; each && each(i); setTimeout(step, gap); }; step(); },
      countBalls(each, done, gap = 260) { clearEmphasis(); const list = M.balls.map(([p]) => built.get(keyOf(p))).filter(Boolean);
        const order = list.map((m) => [m, m.position.clone().applyQuaternion(group.quaternion)]).sort((a, b) => b[1].y - a[1].y || Math.atan2(a[1].x, a[1].z) - Math.atan2(b[1].x, b[1].z)).map((x) => x[0]);
        let i = 0; const step = () => { if (!alive) return; if (i >= order.length) { done && done(order.length); return; } order[i].material = mat.orange; i++; each && each(i); setTimeout(step, gap); }; step(); },
      stage: () => M.stage || 1, maxStage: M.grow || 0,
      grow() { if (!M.grow) return 0; const next = (M.stage || 1) >= M.grow ? 1 : (M.stage || 1) + 1; M = MODELS[kind](next); M.stage = next; buildParts(next > 1); const a = sph(); animateTo(a.th, a.ph, 900, a.ph < 0.2 ? topDist * stageDist[next] / stageDist[M.grow] : stageDist[next]); return next; },
      dispose() { alive=false;window.removeEventListener('resize',onResize);document.removeEventListener('fullscreenchange',onFull);cancelAnimationFrame(raf);controls.dispose();const gs=new Set(),ms=new Set();scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m))});gs.forEach(g=>g.dispose());ms.forEach(m=>{if(m.map)m.map.dispose();m.dispose()});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove(); },
    };
  }
  window.Zome3D = { mount, _M: MODELS, parts: { ballGeometry, strutGeometry, lin } };
})();
