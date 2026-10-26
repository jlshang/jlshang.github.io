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
  function rotFor(from, to) {          // group element taking direction `from` onto `to`
    const f = from.clone().normalize(), t = to.clone().normalize(); let best = null, bd = -2;
    for (const m of icoGroup()) { const d = f.clone().applyMatrix3(m).dot(t); if (d > bd) { bd = d; best = m; } }
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
    const L = B.clone().sub(A), len = L.length(), full = window.ZOMEPARTS[kind], fl = Math.hypot(...full.dir);
    const P = len < fl * 0.8 && window.ZOMEPARTS[kind + "-short"] ? window.ZOMEPARTS[kind + "-short"] : full;
    const dir = V(...P.dir), R = rotFor(dir, L), tip = new Set(P.tipSet), mid = new Set(P.midSet), pos = [];
    for (let i = 0; i < P.v.length / 3; i++) {
      const v = V(P.v[3 * i], P.v[3 * i + 1], P.v[3 * i + 2]).applyMatrix3(R).add(A);
      if (tip.has(i)) v.add(L); else if (mid.has(i)) v.addScaledVector(L, 0.5);
      pos.push(v.x, v.y, v.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(P.t);
    const n = g.toNonIndexed(); n.computeVertexNormals(); return n;
  }

  /* ---------- model: five water molecules, the middle one holding four friends (lesson 9, p13) ---------- */
  function waterTetra() {
    const y0 = PHI * PHI, y1 = PHI * PHI * PHI;              // short / medium yellow along (±1,±1,±1)
    const u = V(1, 1, 1), d2 = V(-1, -1, 1), d3 = V(-1, 1, -1), d4 = V(1, -1, -1);
    const O = V(0, 0, 0), O1 = add(O, u, y0 + y1), O2 = add(O, d2, y0 + y1), O3 = add(O, d3, y0 + y1), O4 = add(O, d4, y0 + y1);
    const Hc1 = add(O, u, y0), Hc2 = add(O, d2, y0);          // middle molecule's two hands
    const H3 = add(O, d3, y1), H4 = add(O, d4, y1);           // friends 3 & 4 grab its two pockets
    const H1a = add(O1, d2, -y0), H1b = add(O1, d3, -y0);
    const H2a = add(O2, u, -y0), H2b = add(O2, d4, -y0);
    const H3b = add(O3, u, -y0), H4b = add(O4, d2, -y0);
    const balls = [[O, "red"], [O1, "red"], [O2, "red"], [O3, "red"], [O4, "red"],
      [Hc1, "white"], [Hc2, "white"], [H3, "white"], [H4, "white"], [H1a, "white"], [H1b, "white"], [H2a, "white"], [H2b, "white"], [H3b, "white"], [H4b, "white"]];
    const struts = [[O, Hc1], [O, Hc2], [O1, H1a], [O1, H1b], [O2, H2a], [O2, H2b], [O3, H3], [O3, H3b], [O4, H4], [O4, H4b], [Hc1, O1], [Hc2, O2], [H3, O], [H4, O]];
    const dashes = [[O1, O2], [O1, O3], [O1, O4], [O2, O3], [O3, O4], [O2, O4]];
    const labels = [[O1, "1"], [O2, "2"], [O3, "3"], [O4, "4"]];
    // stand molecule 1 straight up, friend 3 to the front (like the picture)
    const q = new THREE.Quaternion().setFromUnitVectors(u.clone().normalize(), V(0, 1, 0));
    const a3 = d3.clone().applyQuaternion(q), want = (100 * Math.PI) / 180, have = Math.atan2(a3.z, a3.x);
    q.premultiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), have - want));
    return { balls, struts, dashes, labels, orient: q, elev: 14 };
  }
  function orientQ(up, front, yawDeg = 0) {
    const U = up.clone().normalize(), F = front.clone().addScaledVector(U, -front.dot(U)).normalize(), R = U.clone().cross(F);
    const m = new THREE.Matrix4().makeBasis(R, U, F).transpose();
    const q = new THREE.Quaternion().setFromRotationMatrix(m);
    return q.premultiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), (yawDeg * Math.PI) / 180));
  }
  /* lesson 5: long green struts, white balls */
  const GK = 8.8;                                   // lattice step, so a long green strut matches the slide pictures
  const g = (x, y, z) => V(x, y, z).multiplyScalar(GK);
  function greenModel(balls, struts, up, front, yaw, elev) {
    return { balls: balls.map((p) => [p, "white"]), struts: struts.map(([a, b]) => [balls[a], balls[b], "green"]), dashes: [], labels: [], orient: orientQ(up, front, yaw), elev };
  }
  function tri() {
    const A = g(0, 0, 0), B = g(1, 1, 0), C = g(1, 0, 1);
    const n = B.clone().sub(A).cross(C.clone().sub(A)), up = C.clone().sub(A.clone().add(B).multiplyScalar(0.5));
    return greenModel([A, B, C], [[0, 1], [1, 2], [2, 0]], up, n, 0, 4);
  }
  function pyr() {
    const a = g(1, 1, 0), b = g(1, -1, 0), P = [V(0, 0, 0), a.clone(), a.clone().add(b), b.clone(), a.clone().add(b).multiplyScalar(0.5).add(g(0, 0, 1))];
    return greenModel(P, [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]], V(0, 0, 1), b.clone().negate(), 12, 18);
  }
  function bridge() {
    const a = g(1, 1, 0), b = g(1, -1, 0), P = [], E = [];
    for (let i = 0; i < 4; i++) { P.push(a.clone().multiplyScalar(i)); P.push(a.clone().multiplyScalar(i).add(b)); }
    for (let i = 0; i < 3; i++) P.push(a.clone().multiplyScalar(i + 0.5).addScaledVector(b, 0.5).add(g(0, 0, 1)));
    for (let i = 0; i < 3; i++) E.push([2 * i, 2 * i + 2], [2 * i + 1, 2 * i + 3]);
    for (let i = 0; i < 4; i++) E.push([2 * i, 2 * i + 1]);
    for (let i = 0; i < 3; i++) E.push([8 + i, 2 * i], [8 + i, 2 * i + 1], [8 + i, 2 * i + 2], [8 + i, 2 * i + 3]);
    E.push([8, 9], [9, 10]);
    return greenModel(P, E, V(0, 0, 1), b.clone().negate(), -8, 22);
  }
  const MODELS = { waterTetra, tri, pyr, bridge };

  function labelTexture(t) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    g.fillStyle = "#E8742A"; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.font = "900 78px Microsoft YaHei, Noto Sans SC, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, 64, 70);
    const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding; return tx;
  }
  function cyl(a, b, rad, mat) {
    const dir = b.clone().sub(a), len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 12, 1), mat);
    m.position.copy(a).addScaledVector(dir, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize()); return m;
  }

  function mount(host, kind, opt = {}) {
    const M = MODELS[kind]();
    if (opt.yawAdd) M.orient.premultiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), (opt.yawAdd * Math.PI) / 180));
    if (opt.elev != null && !isNaN(opt.elev)) M.elev = opt.elev;
    const W = host.clientWidth, H = host.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const pr = () => { const k = host.getBoundingClientRect().width / (host.clientWidth || 1); return Math.min(3, (window.devicePixelRatio || 1) * Math.max(1, k)); };
    renderer.setPixelRatio(pr()); renderer.setSize(W, H); renderer.setClearColor(0x000000, 0); renderer.outputEncoding = THREE.sRGBEncoding;
    const onResize = () => { renderer.setPixelRatio(pr()); renderer.setSize(W, H); }; window.addEventListener("resize", onResize);
    document.addEventListener("fullscreenchange", () => setTimeout(onResize, 100));
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:none;cursor:grab";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b0, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 0.85); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.3); fill.position.set(4, -2, 6); scene.add(fill);
    const group = new THREE.Group(); group.quaternion.copy(M.orient); scene.add(group);

    const center = new THREE.Vector3(); M.balls.forEach(([p]) => center.add(p)); center.multiplyScalar(1 / M.balls.length);
    const cpos = (p) => p.clone().sub(center);
    const mat = {
      white: new THREE.MeshStandardMaterial({ color: lin(0xf2f2ef), roughness: 0.38, metalness: 0.02, side: THREE.DoubleSide }),
      red: new THREE.MeshStandardMaterial({ color: lin(0xd8332a), roughness: 0.38, metalness: 0.02, side: THREE.DoubleSide }),
      yellow: new THREE.MeshStandardMaterial({ color: lin(0xf2b200), roughness: 0.3, metalness: 0.05, side: THREE.DoubleSide }),
      green: new THREE.MeshStandardMaterial({ color: lin(0x0f7d30), roughness: 0.32, metalness: 0.05, side: THREE.DoubleSide }),
    };
    const BG = ballGeometry();
    for (const [p, col] of M.balls) { const m = new THREE.Mesh(BG, mat[col]); m.position.copy(cpos(p)); group.add(m); }
    for (const [a, b, k] of M.struts) group.add(new THREE.Mesh(strutGeometry(cpos(a), cpos(b), k || "yellow"), mat[k || "yellow"]));
    const dmat = new THREE.MeshBasicMaterial({ color: lin(0xe8742a) });
    for (const [a, b] of M.dashes) {
      const A = cpos(a), B = cpos(b), L = A.distanceTo(B), n = Math.round(L / 0.7), d = B.clone().sub(A).normalize();
      for (let i = 0; i < n; i += 2) group.add(cyl(add(A, d, (i * L) / n), add(A, d, ((i + 1) * L) / n), 0.08, dmat));
    }
    const labels = M.labels.map(([p, t]) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(t), depthTest: false }));
      sp.scale.set(1.9, 1.9, 1); sp.renderOrder = 10; sp.userData.at = cpos(p); scene.add(sp); return sp;
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
        let lo = 1e9, hi = -1e9, lx = 1e9, hx = -1e9; M.balls.forEach(([p]) => { const q = world(cpos(p)).project(camera); lo = Math.min(lo, q.y); hi = Math.max(hi, q.y); lx = Math.min(lx, q.x); hx = Math.max(hx, q.x); });
        const bp = (1.06 / (dist * Math.tan((camera.fov * Math.PI) / 360))) * H;   // ball diameter in px
        const ph = ((hi - lo) / 2) * H + bp, pw = ((hx - lx) / 2) * W + bp;
        dist *= Math.max(ph / (opt.fitH || H * 0.7), opt.fitW ? pw / opt.fitW : 0);
      }
      camera.position.copy(home()); controls.target.set(0, 0, 0); controls.update();
    };
    fit(); controls.minDistance = dist * 0.35; controls.maxDistance = dist * 1.6;

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
      key.position.copy(camera.position).add(V(-25, 35, 0));
      const right = V(1, 0, 0).applyQuaternion(camera.quaternion), up = V(0, 1, 0).applyQuaternion(camera.quaternion);
      labels.forEach((l) => l.position.copy(world(l.userData.at)).addScaledVector(right, 1.6).addScaledVector(up, 1.4));
      if (opt.onAngle) opt.onAngle(((sph().th - th0) * 180) / Math.PI);
      renderer.render(scene, camera); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    renderer.domElement.addEventListener("pointerdown", () => { opt.onInteract && opt.onInteract(); anim = null; controls.enabled = true; renderer.domElement.style.cursor = "grabbing"; });
    renderer.domElement.addEventListener("pointerup", () => { renderer.domElement.style.cursor = "grab"; });
    return {
      top() { animateTo(sph().th, 0.0001, 1600); },
      intro(dur = 3000) { const t0 = performance.now(); controls.enabled = false; setSph(dist * 1.7, th0 - Math.PI * 2, ph0 + 0.25);
        anim = (now) => { const t = Math.min(1, (now - t0) / dur), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          setSph(dist * (1.7 - 0.7 * e), th0 - Math.PI * 2 * (1 - e), ph0 + 0.25 * (1 - e)); if (t >= 1) { anim = null; controls.enabled = true; controls.update(); } }; },
      spin(dur = 3600) { const a = sph(), t0 = performance.now(); controls.enabled = false;
        anim = (now) => { const t = Math.min(1, (now - t0) / dur), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          setSph(a.r, a.th + e * Math.PI * 2, a.ph); if (t >= 1) { anim = null; controls.enabled = true; controls.update(); } }; },
      setAngle(deg) { anim = null; const a = sph(); setSph(a.r, th0 + (deg * Math.PI) / 180, a.ph); controls.update(); },
      home() { animateTo(th0, ph0, 1200, dist); },
      dispose() { alive = false; window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); renderer.dispose(); host.removeChild(renderer.domElement); },
    };
  }
  window.Zome3D = { mount };
})();
