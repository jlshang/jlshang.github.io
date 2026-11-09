/* 碳的变身术 · Zometool 3D 视图（Three.js r128）
   小球和棍子用 vZome 的 lifelike 零件形状（window.ZOMEPARTS），按真实 Zometool 的二十面体对称摆放：
   每根棍的方向都是真实孔位方向，长度是真实棍长（短蓝 5.236、短黄 4.535，单位：球半径）。
   坐标由 build/models.py 生成并逐根核对（方向、长度、同一个孔不插两根、球不重叠）。 */
(function () {
  "use strict";
  const PHI = (1 + Math.sqrt(5)) / 2, V = (x, y, z) => new THREE.Vector3(x, y, z), vec = (a) => V(a[0], a[1], a[2]);
  let GROUP = null;
  function icoGroup() {
    if (GROUP) return GROUP;
    const p = PHI, ip = 1 / PHI;
    const gens = [new THREE.Matrix3().set(0, 0, 1, 1, 0, 0, 0, 1, 0), new THREE.Matrix3().set(-1, 0, 0, 0, -1, 0, 0, 0, 1),
      new THREE.Matrix3().set(0.5, -p / 2, ip / 2, p / 2, ip / 2, -0.5, ip / 2, 0.5, p / 2)];
    const key = (m) => m.elements.map((x) => x.toFixed(4)).join(), out = [new THREE.Matrix3()], seen = new Set([key(out[0])]);
    for (let i = 0; i < out.length && out.length < 60; i++) for (const g of gens) { const m = new THREE.Matrix3().multiplyMatrices(g, out[i]); const k = key(m); if (!seen.has(k)) { seen.add(k); out.push(m); } }
    GROUP = out; return out;
  }
  function rotFor(from, to) {
    const f = from.clone().normalize(), t = to.clone().normalize(); let best = null, bd = -2;
    for (const m of icoGroup()) { const d = f.clone().applyMatrix3(m).dot(t); if (d > bd) { bd = d; best = m; } }
    if (bd < 0.9999) { const q = new THREE.Quaternion().setFromUnitVectors(f, t); return new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); }
    return best;
  }
  let BALL = null;
  function ballGeometry() {
    if (BALL) return BALL;
    const P = window.ZOMEPARTS.ball, g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(P.v, 3)); g.setIndex(P.t);
    BALL = g.toNonIndexed(); BALL.computeVertexNormals(); return BALL;
  }
  /* strut geometry built at the origin pointing along +Y with length len (so it can grow by scaling y) */
  function strutAlongY(dirModel, len, kind) {
    const Z = window.ZOMEPARTS, full = Z[kind] || Z.yellow, fl = Math.hypot(...full.dir);
    const P = len < fl * 0.8 && Z[kind + "-short"] ? Z[kind + "-short"] : full;
    const R = rotFor(vec(P.dir), dirModel), tip = new Set(P.tipSet), mid = new Set(P.midSet), L = dirModel.clone().normalize().multiplyScalar(len), pos = [];
    for (let i = 0; i < P.v.length / 3; i++) {
      const v = V(P.v[3 * i], P.v[3 * i + 1], P.v[3 * i + 2]).applyMatrix3(R);
      if (tip.has(i)) v.add(L); else if (mid.has(i)) v.addScaledVector(L, 0.5);
      pos.push(v.x, v.y, v.z);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(P.t);
    const n = g.toNonIndexed(); n.computeVertexNormals();
    const q = new THREE.Quaternion().setFromUnitVectors(dirModel.clone().normalize(), V(0, 1, 0));
    n.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    return { geo: n, q: q.clone().invert() };
  }
  const lin = (c) => new THREE.Color(c).convertSRGBToLinear();
  function mats() {
    const M = (c, r = .35) => new THREE.MeshStandardMaterial({ color: lin(c), roughness: r, metalness: .04, side: THREE.DoubleSide });
    return { white: M(0xdde1e7, .42), blue: M(0x2a86c4), yellow: M(0xf2b200, .3), orange: M(0xff8a2a, .4), hot: M(0xff7a1a, .35), ghost: new THREE.MeshStandardMaterial({ color: lin(0xdde1e7), roughness: .5, transparent: true, opacity: .25 }) };
  }
  const key3 = (v) => v.map((x) => x.toFixed(2)).join();

  /* opts: groups:[{model:{b,s}, offset:[x,y,z]}] (or model), up:[x,y,z] model vector shown upward, yaw (deg), elev (deg), fit (0..1), intro */
  function mount(host, opts) {
    const W = host.clientWidth, H = host.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2.5, (window.devicePixelRatio || 1) * 1.25)); renderer.setSize(W, H); renderer.setClearColor(0, 0); renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:none;cursor:grab";
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a94a6, .62));
    const key = new THREE.DirectionalLight(0xffffff, .85); scene.add(key);
    const fill = new THREE.DirectionalLight(0xbfd4ff, .35); fill.position.set(-6, -3, 5); scene.add(fill);
    const root = new THREE.Group(); scene.add(root);
    const up = vec(opts.up || [0, 1, 0]).normalize();
    const qUp = new THREE.Quaternion().setFromUnitVectors(up, V(0, 1, 0));
    root.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), ((opts.yaw || 0) * Math.PI) / 180).multiply(qUp));
    const mat = mats();
    const groups = []; let center = V(0, 0, 0);
    const extra = new THREE.Group(); root.add(extra);

    function makeGroup(gdef) {
      const g = { obj: new THREE.Group(), balls: new Map(), struts: new Map(), model: null, offset: vec(gdef.offset || [0, 0, 0]), target: null, visible: true };
      g.obj.position.copy(g.offset); root.add(g.obj); groups.push(g); setGroupModel(g, gdef.model, false); return g;
    }
    const popping = [], growing = [];
    function setGroupModel(g, m, animate) {
      const prev = g.model; g.model = m; const want = new Set();
      const pts = m.b.map(vec);
      pts.forEach((p, i) => {
        if (m.nb) return;
        const k = key3(m.b[i]); want.add(k); if (g.balls.has(k)) return;
        const mesh = new THREE.Mesh(ballGeometry(), mat.white); mesh.position.copy(p.clone().sub(center)); g.obj.add(mesh); g.balls.set(k, mesh); mesh.userData.p = p;
        if (animate) { mesh.scale.setScalar(.001); popping.push({ mesh, delay: 0 }); }
      });
      m.s.forEach(([a, b, kind]) => {
        const ka = key3(m.b[a]), kb = key3(m.b[b]), k = ka < kb ? ka + "|" + kb : kb + "|" + ka; want.add(k); if (g.struts.has(k)) return;
        let A = pts[a], B = pts[b];
        // grow from the end that already existed
        if (animate && prev) { const had = new Set(prev.b.map(key3)); if (!had.has(ka) && had.has(kb)) { const t = A; A = B; B = t; } }
        const d = B.clone().sub(A), len = d.length(), sg = strutAlongY(d, len, kind);
        const mesh = new THREE.Mesh(sg.geo, mat[kind] || mat.yellow); mesh.position.copy(A.clone().sub(center)); mesh.quaternion.copy(sg.q);
        mesh.userData = { kind, a: A, b: B };
        g.obj.add(mesh); g.struts.set(k, mesh);
        if (animate) { mesh.scale.y = .001; growing.push({ mesh, end: key3(B.toArray()) }); }
      });
      for (const [k, mesh] of g.balls) if (!want.has(k)) { g.obj.remove(mesh); g.balls.delete(k); }
      for (const [k, mesh] of g.struts) if (!want.has(k)) { g.obj.remove(mesh); mesh.geometry.dispose(); g.struts.delete(k); }
      if (animate) { // balls at the far end of new struts appear after their strut
        growing.forEach((gr) => { const ball = g.balls.get(gr.end); if (ball && ball.scale.x < .01) gr.ball = ball; });
        for (let i = popping.length - 1; i >= 0; i--) if (growing.some((gr) => gr.ball === popping[i].mesh)) popping.splice(i, 1);
        growT0 = null;
      }
    }
    const defs = opts.groups || [{ model: opts.model }];
    // centre on the first group's final extent (or given)
    const allPts = (opts.frame || defs[0].model).b.map(vec); allPts.forEach((p) => center.add(p)); center.multiplyScalar(1 / allPts.length);
    if (opts.center) center = vec(opts.center);
    defs.forEach(makeGroup);

    const camera = new THREE.PerspectiveCamera(20, W / H, .5, 2000);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.enablePan = false; controls.zoomSpeed = 1.2; controls.rotateSpeed = .9;
    const el = ((opts.elev == null ? 20 : opts.elev) * Math.PI) / 180;
    const dirHome = V(0, Math.sin(el), Math.cos(el));
    let dist = 80;
    function fitPts() { const out = []; (opts.frame ? [opts.frame] : defs.map((d) => d.model)).forEach((m, gi) => m.b.forEach((p) => out.push(vec(p).add(opts.frame ? V(0, 0, 0) : groups[gi].offset).sub(center)))); return out; }
    function fitDist(dirv, pts) {
      let d = 80; const cam = camera.clone();
      for (let k = 0; k < 6; k++) {
        cam.position.copy(dirv.clone().normalize().multiplyScalar(d)); cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
        let lx = 1e9, hx = -1e9, ly = 1e9, hy = -1e9;
        pts.forEach((p) => { const q = p.clone().applyQuaternion(root.quaternion).project(cam); lx = Math.min(lx, q.x); hx = Math.max(hx, q.x); ly = Math.min(ly, q.y); hy = Math.max(hy, q.y); });
        const bp = (2.1 / (d * Math.tan((cam.fov * Math.PI) / 360))) * H;
        const pw = (Math.max(hx, -lx)) * W + bp, ph = (Math.max(hy, -ly)) * H + bp;
        d *= Math.max(pw / (W * (opts.fit || .8)), ph / (H * (opts.fit || .8)));
      }
      return d;
    }
    dist = fitDist(dirHome, fitPts());
    camera.position.copy(dirHome.clone().multiplyScalar(dist)); camera.lookAt(0, 0, 0); controls.update();
    controls.minDistance = dist * .35; controls.maxDistance = dist * 2.2;

    /* marker arrow ("第 4 只手") */
    let marker = null;
    function setMarker(at, dir, show) {
      if (marker) { extra.remove(marker); marker = null; }
      if (!show) return;
      const m = new THREE.Group(), d = vec(dir).normalize(), base = vec(at).sub(center).addScaledVector(d, 1.25);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 3, 16), mat.orange); shaft.position.y = 1.5;
      const head = new THREE.Mesh(new THREE.ConeGeometry(.85, 1.6, 20), mat.orange); head.position.y = 3.6;
      m.add(shaft, head); m.position.copy(base); m.quaternion.setFromUnitVectors(V(0, 1, 0), d); m.userData.t0 = performance.now(); m.scale.setScalar(.001);
      extra.add(m); marker = m;
    }
    /* dashed outline between model points */
    let dashes = null;
    function setDashes(pairs) {
      arcs.children.forEach((m) => { const w = Math.min(1, (now - m.userData.t0) / 350); m.scale.setScalar(Math.max(.001, w)); });
      if (dashes) { extra.remove(dashes); dashes.traverse((o) => o.geometry && o.geometry.dispose()); dashes = null; }
      if (!pairs || !pairs.length) return;
      dashes = new THREE.Group(); const dm = new THREE.MeshBasicMaterial({ color: lin(0xffa45c) });
      pairs.forEach(([a, b]) => { const A = vec(a).sub(center), B = vec(b).sub(center), L = A.distanceTo(B), n = Math.max(3, Math.round(L / .9)), d = B.clone().sub(A).normalize();
        for (let i = 1; i < n - 1; i += 2) { const s = A.clone().addScaledVector(d, (i * L) / n), e = A.clone().addScaledVector(d, ((i + 1) * L) / n), c = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, s.distanceTo(e), 8), dm); c.position.copy(s).add(e).multiplyScalar(.5); c.quaternion.setFromUnitVectors(V(0, 1, 0), d); dashes.add(c); } });
      dashes.userData.t0 = performance.now(); extra.add(dashes);
    }
    const ghostY = new THREE.MeshStandardMaterial({ color: lin(0xf2b200), roughness: .4, transparent: true, opacity: .22, depthWrite: false });
    mat.ghost.depthWrite = false;
    function highlight(gi, ballPts, strutPairs, dim) {
      const g = groups[gi || 0];
      for (const m of g.balls.values()) m.material = dim ? mat.ghost : mat.white;
      for (const m of g.struts.values()) m.material = dim ? ghostY : (mat[m.userData.kind] || mat.yellow);
      (ballPts || []).forEach((p) => { const m = g.balls.get(key3(p)); if (m) m.material = mat.hot; });
      (strutPairs || []).forEach(([a, b]) => { const ka = key3(a), kb = key3(b), k = ka < kb ? ka + "|" + kb : kb + "|" + ka; const m = g.struts.get(k); if (m) m.material = mat.hot; });
    }

    /* orange angle sectors at a ball: [[c,a,b],...] (model coords) */
    const arcs = new THREE.Group(); extra.add(arcs);
    function addArc(c, a, b, r = 2.6) {
      const C0 = vec(c).sub(center), u = vec(a).sub(vec(c)).normalize(), v = vec(b).sub(vec(c)).normalize(), th = Math.acos(Math.max(-1, Math.min(1, u.dot(v)))), w = v.clone().addScaledVector(u, -u.dot(v)).normalize();
      const pos = [], n = 24; for (let i = 0; i < n; i++) { const t0 = (th * i) / n, t1 = (th * (i + 1)) / n; const p0 = u.clone().multiplyScalar(Math.cos(t0)).addScaledVector(w, Math.sin(t0)).multiplyScalar(r), p1 = u.clone().multiplyScalar(Math.cos(t1)).addScaledVector(w, Math.sin(t1)).multiplyScalar(r); pos.push(0, 0, 0, p0.x, p0.y, p0.z, p1.x, p1.y, p1.z); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: lin(0xff8a2a), transparent: true, opacity: .85, side: THREE.DoubleSide, depthTest: false })); m.renderOrder = 5; m.position.copy(C0); m.userData.t0 = performance.now(); m.scale.setScalar(.001); arcs.add(m);
    }
    function clearArcs() { while (arcs.children.length) { const m = arcs.children[0]; arcs.remove(m); m.geometry.dispose(); } }
    let anim = null, raf = 0, alive = true, growT0 = null, growDone = null, slide = null, shake = null, introAnim = null;
    const sph = () => { const p = camera.position, r = p.length(); return { r, th: Math.atan2(p.x, p.z), ph: Math.acos(p.y / r) }; };
    const setSph = (r, th, ph) => { camera.position.set(r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), r * Math.sin(ph) * Math.cos(th)); camera.lookAt(0, 0, 0); };
    const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    function animateTo(th1, ph1, r1, dur = 1200, done) {
      const a = sph(); let dth = th1 - a.th; dth = Math.atan2(Math.sin(dth), Math.cos(dth)); const t0 = performance.now(); controls.enabled = false;
      anim = (now) => { const t = Math.min(1, (now - t0) / dur), e = ease(t); setSph(a.r + (r1 - a.r) * e, a.th + dth * e, a.ph + (ph1 - a.ph) * e); if (t >= 1) { anim = null; controls.enabled = true; controls.update(); done && done(); } };
    }
    const h0 = sph();
    function tick(now) {
      if (!alive) return;
      if (anim) anim(now); else controls.update();
      if (growing.length) {
        if (growT0 === null) growT0 = now; const t = (now - growT0) / 1000; let all = true;
        growing.forEach((gr, i) => { const u = Math.min(1, Math.max(0, (t - .14 * i) / .7)), e = 1 - Math.pow(1 - u, 3); gr.mesh.scale.y = Math.max(.001, e);
          if (gr.ball) { const w = Math.min(1, Math.max(0, (t - .14 * i - .7) / .3)); gr.ball.scale.setScalar(Math.max(.001, w < 1 ? w * (1 + .3 * Math.sin(w * Math.PI)) : 1)); if (w < 1) all = false; }
          if (u < 1) all = false; });
        if (all) { growing.length = 0; growT0 = null; const d = growDone; growDone = null; d && d(); }
      }
      if (popping.length) { popping.forEach((p) => { p.t = (p.t || 0) + 1 / 60; const w = Math.min(1, p.t / .4); p.mesh.scale.setScalar(Math.max(.001, w * (1 + .25 * Math.sin(w * Math.PI)))); }); for (let i = popping.length - 1; i >= 0; i--) if (popping[i].t >= .4) { popping[i].mesh.scale.setScalar(1); popping.splice(i, 1); } }
      if (marker) { const t = (now - marker.userData.t0) / 1000, w = Math.min(1, t / .5); marker.scale.setScalar(Math.max(.001, w * (1 + .2 * Math.sin(w * Math.PI)) * (1 + .06 * Math.sin(t * 5)))); }
      arcs.children.forEach((m) => { const w = Math.min(1, (now - m.userData.t0) / 350); m.scale.setScalar(Math.max(.001, w)); });
      if (dashes) { const t = Math.min(1, (now - dashes.userData.t0) / 600); dashes.children.forEach((c, i) => c.visible = i / dashes.children.length <= t); }
      groups.forEach((g) => { if (g.target) { g.offset.lerp(g.target, .12); g.obj.position.copy(g.offset); if (g.offset.distanceTo(g.target) < .01) { g.offset.copy(g.target); g.obj.position.copy(g.offset); g.target = null; } } });
      if (slide) slide(now);
      if (shake) shake(now);
      key.position.copy(camera.position).add(V(-20, 30, 10));
      renderer.render(scene, camera); raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    renderer.domElement.addEventListener("pointerdown", () => { anim = null; controls.enabled = true; renderer.domElement.style.cursor = "grabbing"; });
    renderer.domElement.addEventListener("pointerup", () => { renderer.domElement.style.cursor = "grab"; });

    const api = {
      groups,
      setModel(m, animate = true, done, gi = 0) { setGroupModel(groups[gi], m, animate); growDone = done || null; if (!animate || !growing.length) { growDone = null; done && done(); } },
      refit(m, dur = 900) { const pts = m.b.map((p) => vec(p).sub(center)); const a = sph(); const dv = camera.position.clone().normalize(); const d = Math.max(fitDist(dv, pts), dist * .45); animateTo(a.th, a.ph, d, dur); },
      setMarker, setDashes, highlight, addArc, clearArcs,
      showGroup(gi, on) { groups[gi].obj.visible = on; },
      moveGroup(gi, off, instant) { const g = groups[gi]; g.target = vec(off); if (instant) { g.offset.copy(g.target); g.obj.position.copy(g.offset); g.target = null; } },
      dropIn(gi, from, done) { const g = groups[gi]; const to = g.offset.clone(); g.offset.copy(to.clone().add(vec(from))); g.obj.position.copy(g.offset); g.obj.visible = true; g.target = to; setTimeout(() => done && done(), 900); },
      slideGroup(gi, dir, amp, period = 2600) { const g = groups[gi], base = g.offset.clone(), d = vec(dir).normalize(), t0 = performance.now(); slide = (now) => { const t = (now - t0) / period; g.obj.position.copy(base).addScaledVector(d, amp * Math.sin(t * Math.PI * 2) * Math.min(1, t * 2)); }; },
      stopSlide() { slide = null; groups.forEach((g) => g.obj.position.copy(g.offset)); },
      shakeGroup(gi, amp = .25, dur = 900) { const g = groups[gi], base = g.offset.clone(), t0 = performance.now(); shake = (now) => { const t = (now - t0) / dur; if (t >= 1) { g.obj.position.copy(base); shake = null; return; } g.obj.position.set(base.x + amp * Math.sin(t * 60) * (1 - t), base.y, base.z + amp * Math.cos(t * 47) * (1 - t)); }; },
      home(dur = 1100) { animateTo(h0.th, h0.ph, dist, dur); },
      /* look along a model-space direction (camera placed on that side) */
      lookFrom(dirModel, dur = 1400, k = 1) { const w = vec(dirModel).normalize().applyQuaternion(root.quaternion); const r = fitDist(w, fitPts()) * k; animateTo(Math.atan2(w.x, w.z), Math.acos(Math.max(-1, Math.min(1, w.y))), r, dur); },
      intro(kind) {
        if (kind === "none") return;
        const r = dist, th = h0.th, ph = h0.ph; controls.enabled = false; const t0 = performance.now() + 60;
        const f = { spin: (e) => setSph(r * (1.35 - .35 * e), th - Math.PI * (1 - e), ph + .15 * (1 - e)),
          zoom: (e) => setSph(r * (2.2 - 1.2 * e), th - .5 * (1 - e), ph),
          drop: (e) => setSph(r * (1.25 - .25 * e), th - .6 * (1 - e), Math.max(.05, ph - (ph - .08) * (1 - e))),
          swing: (e) => setSph(r * (1.3 - .3 * e), th + .9 * Math.sin((1 - e) * 5) * (1 - e), ph + .25 * Math.sin((1 - e) * 4) * (1 - e)),
          rise: (e) => setSph(r * (1.4 - .4 * e), th, ph + .6 * (1 - e)) }[kind || "spin"];
        const dur = kind === "swing" ? 2100 : 1700;
        anim = (now) => { const t = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - t, 3); f(e); if (t >= 1) { anim = null; controls.enabled = true; controls.update(); } };
        f(0);
      },
      dispose() { alive = false; cancelAnimationFrame(raf); controls.dispose(); scene.traverse((o) => { if (o.geometry && o.geometry !== BALL) o.geometry.dispose(); }); renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); renderer.domElement.remove(); },
    };
    return api;
  }

  window.CarbonView = { mount, vec };
})();
