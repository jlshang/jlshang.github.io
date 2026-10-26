/* Zometool-style 3D models for the courseware (Three.js r128).
   Balls are camera-facing sprites of the real Zome ball picture; struts are lit cylinders
   that stop at the ball surface, so it reads like the rendered pictures on the slides. */
(function () {
  "use strict";
  const PHI = (1 + Math.sqrt(5)) / 2;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const add = (a, b, k = 1) => a.clone().addScaledVector(b, k);

  /* ---------- model: five water molecules, the middle one holding four friends (lesson 9, p13) ---------- */
  function waterTetra() {
    const s = Math.sqrt(8) / 3, y = -1 / 3, r = (d) => (d * Math.PI) / 180;
    const u = V(0, 1, 0);
    const d3 = V(s * Math.cos(r(100)), y, s * Math.sin(r(100)));   // friend 3: front
    const d2 = V(s * Math.cos(r(-20)), y, s * Math.sin(r(-20)));   // friend 2: right
    const d4 = V(s * Math.cos(r(220)), y, s * Math.sin(r(220)));   // friend 4: left
    const sh = 1, md = PHI;                                        // short / medium yellow
    const O = V(0, 0, 0), O1 = add(O, u, sh + md), O2 = add(O, d2, sh + md), O3 = add(O, d3, sh + md), O4 = add(O, d4, sh + md);
    const Hc1 = add(O, u, sh), Hc2 = add(O, d2, sh);              // middle molecule's two hands
    const H3 = add(O, d3, md), H4 = add(O, d4, md);                // friends 3 & 4 grab the two pockets
    const H1a = add(O1, d2, -sh), H1b = add(O1, d3, -sh);
    const H2a = add(O2, u, -sh), H2b = add(O2, d4, -sh);
    const H3b = add(O3, u, -sh), H4b = add(O4, d2, -sh);
    const balls = [
      [O, "red"], [O1, "red"], [O2, "red"], [O3, "red"], [O4, "red"],
      [Hc1, "white"], [Hc2, "white"], [H3, "white"], [H4, "white"],
      [H1a, "white"], [H1b, "white"], [H2a, "white"], [H2b, "white"], [H3b, "white"], [H4b, "white"],
    ];
    const struts = [
      [O, Hc1], [O, Hc2], [O1, H1a], [O1, H1b], [O2, H2a], [O2, H2b], [O3, H3], [O3, H3b], [O4, H4], [O4, H4b], // short: inside a molecule
      [Hc1, O1], [Hc2, O2], [H3, O], [H4, O],                                                                 // medium: holding hands
    ];
    const dashes = [[O1, O2], [O1, O3], [O1, O4], [O2, O3], [O3, O4], [O2, O4]];
    const labels = [[O1, "1"], [O2, "2"], [O3, "3"], [O4, "4"]];
    return { balls, struts, dashes, labels, ball: 0.7, strut: 0.058, color: 0xf0ae1c, elev: 14 };
  }
  const MODELS = { waterTetra };

  /* Zome ball = small rhombicosidodecahedron; every face carries a hole (12 pentagons, 20 triangles, 30 rectangles) */
  let BALL = null;
  function zomeBall() {
    if (BALL) return BALL;
    const p = PHI, pts = [], seen = new Set();
    const base = [[1, 1, p * p * p], [p * p, p, 2 * p], [2 + p, 0, p * p]];
    for (const b of base) for (const [i, j, k] of [[0, 1, 2], [1, 2, 0], [2, 0, 1]]) for (let sx = -1; sx <= 1; sx += 2) for (let sy = -1; sy <= 1; sy += 2) for (let sz = -1; sz <= 1; sz += 2) {
      const v = [b[i] * sx, b[j] * sy, b[k] * sz], key = v.map((x) => x.toFixed(3)).join();
      if (!seen.has(key)) { seen.add(key); pts.push(V(...v)); }
    }
    const R = pts[0].length();
    const norms = [], nkeys = new Set();
    const cand = [];
    const perm3 = (a) => [[a[0], a[1], a[2]], [a[1], a[2], a[0]], [a[2], a[0], a[1]]];
    for (const b of [[0, 1, p], [1, 1, 1], [0, 1 / p, p], [1, 0, 0], [0.5, p / 2, (p * p) / 2]]) for (const q of perm3(b)) for (let sx = -1; sx <= 1; sx += 2) for (let sy = -1; sy <= 1; sy += 2) for (let sz = -1; sz <= 1; sz += 2) cand.push(V(q[0] * sx, q[1] * sy, q[2] * sz).normalize());
    for (const n of cand) { const k = n.toArray().map((x) => x.toFixed(3)).join(); if (!nkeys.has(k)) { nkeys.add(k); norms.push(n); } }
    const shell = [], holes = [];
    for (const n of norms) {
      let mx = -1e9; pts.forEach((v) => (mx = Math.max(mx, v.dot(n))));
      const f = pts.filter((v) => v.dot(n) > mx - 1e-3); if (f.length < 3) continue;
      const c = f.reduce((a, v) => a.add(v), V(0, 0, 0)).multiplyScalar(1 / f.length);
      const ax = f[0].clone().sub(c).normalize(), ay = n.clone().cross(ax);
      f.sort((a, b) => Math.atan2(a.clone().sub(c).dot(ay), a.clone().sub(c).dot(ax)) - Math.atan2(b.clone().sub(c).dot(ay), b.clone().sub(c).dot(ax)));
      const ins = f.map((v) => c.clone().addScaledVector(v.clone().sub(c), f.length === 4 ? 0.6 : 0.58).addScaledVector(n, 0.015 * R));
      for (let i = 1; i < f.length - 1; i++) { shell.push(c, f[i], f[i + 1], c, f[i + 1], f[(i + 2) % f.length]); }
      for (let i = 0; i < f.length; i++) shell.push(c, f[i], f[(i + 1) % f.length]);
      for (let i = 0; i < ins.length; i++) holes.push(c.clone().addScaledVector(n, 0.016 * R), ins[i], ins[(i + 1) % ins.length]);
    }
    const geo = (arr) => { const g = new THREE.BufferGeometry().setFromPoints(arr.map((v) => v.clone().multiplyScalar(1 / R))); g.computeVertexNormals(); return g; };
    BALL = { shell: geo(shell), holes: geo(holes) };
    return BALL;
  }
  const lin = (c) => new THREE.Color(c).convertSRGBToLinear();
  const BALLMAT = {
    white: [new THREE.MeshStandardMaterial({ color: lin(0xf4f4f2), roughness: 0.42, metalness: 0.05, flatShading: true }), new THREE.MeshStandardMaterial({ color: lin(0x55595f), roughness: 0.8, flatShading: true })],
    red: [new THREE.MeshStandardMaterial({ color: lin(0xdc3a2a), roughness: 0.42, metalness: 0.05, flatShading: true }), new THREE.MeshStandardMaterial({ color: lin(0x6e1610), roughness: 0.8, flatShading: true })],
  };

  function labelTexture(t) {
    const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
    g.fillStyle = "#E8742A"; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.font = "900 78px Microsoft YaHei, Noto Sans SC, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, 64, 70);
    const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding; return tx;
  }
  function cyl(a, b, rad, mat) {
    const dir = b.clone().sub(a), len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 18, 1), mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
    return m;
  }

  function mount(host, kind, opt = {}) {
    const M = MODELS[kind]();
    const W = host.clientWidth, H = host.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const pr = () => { const k = host.getBoundingClientRect().width / (host.clientWidth || 1); return Math.min(3, (window.devicePixelRatio || 1) * Math.max(1, k)); };
    renderer.setPixelRatio(pr());
    const onResize = () => { renderer.setPixelRatio(pr()); renderer.setSize(W, H); }; window.addEventListener("resize", onResize);
    document.addEventListener("fullscreenchange", () => setTimeout(onResize, 100));
    renderer.setSize(W, H); renderer.setClearColor(0x000000, 0); renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:none;cursor:grab";
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 0.75); scene.add(key);
    const group = new THREE.Group(); scene.add(group);

    const center = new THREE.Vector3(); M.balls.forEach(([p]) => center.add(p)); center.multiplyScalar(1 / M.balls.length);
    const cpos = (p) => p.clone().sub(center);
    const ZB = zomeBall();
    M.balls.forEach(([p, col], i) => {
      const b = new THREE.Group(); b.add(new THREE.Mesh(ZB.shell, BALLMAT[col][0])); b.add(new THREE.Mesh(ZB.holes, BALLMAT[col][1]));
      b.position.copy(cpos(p)); b.scale.setScalar(M.ball / 2); b.rotation.set(0.3 + i * 0.7, 0.2 + i * 1.1, 0.1 * i); group.add(b);
    });
    const smat = new THREE.MeshStandardMaterial({ color: new THREE.Color(M.color).convertSRGBToLinear(), roughness: 0.35, metalness: 0.15 });
    for (const [a, b] of M.struts) {
      const A = cpos(a), B = cpos(b), d = B.clone().sub(A).normalize(), r = M.ball * 0.46;
      group.add(cyl(add(A, d, r), add(B, d, -r), M.strut, smat));
    }
    const dmat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe8742a).convertSRGBToLinear() });
    for (const [a, b] of M.dashes) {
      const A = cpos(a), B = cpos(b), L = A.distanceTo(B), n = Math.round(L / 0.16), d = B.clone().sub(A).normalize();
      for (let i = 0; i < n; i += 2) group.add(cyl(add(A, d, (i * L) / n), add(A, d, ((i + 1) * L) / n), 0.018, dmat));
    }
    const labels = M.labels.map(([p, t]) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(t), depthTest: false }));
      sp.scale.set(0.44, 0.44, 1); sp.renderOrder = 10; sp.userData.at = cpos(p); group.add(sp); return sp;
    });

    const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 100);
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false; controls.enableZoom = true; controls.zoomSpeed = 0.8; controls.rotateSpeed = 0.9;
    const el = (M.elev * Math.PI) / 180;
    let dist = 12;
    const home = () => new THREE.Vector3(0, Math.sin(el), Math.cos(el)).multiplyScalar(dist);
    // fit: model height on screen = opt.fitPx (picture size)
    const fit = () => {
      for (let k = 0; k < 4; k++) {
        camera.position.copy(home()); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
        let lo = 1e9, hi = -1e9; M.balls.forEach(([p]) => { const q = cpos(p).project(camera); lo = Math.min(lo, q.y); hi = Math.max(hi, q.y); });
        const px = ((hi - lo) / 2) * H; dist *= px / (opt.fitPx || H * 0.7);
      }
      camera.position.copy(home()); controls.target.set(0, 0, 0); controls.update();
    };
    fit(); controls.minDistance = dist * 0.35; controls.maxDistance = dist * 1.6;

    let anim = null, raf = 0, alive = true;
    const h = home(), th0 = Math.atan2(h.x, h.z), ph0 = Math.acos(h.y / h.length());
    const sph = () => { const p = camera.position; const r = p.length(); return { r, th: Math.atan2(p.x, p.z), ph: Math.acos(p.y / r) }; };
    const setSph = (r, th, ph) => { camera.position.set(r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), r * Math.sin(ph) * Math.cos(th)); camera.lookAt(0, 0, 0); };
    function animateTo(th1, ph1, dur, spins = 0, r1 = null) {
      const a = sph(); let dth = th1 - a.th; dth = Math.atan2(Math.sin(dth), Math.cos(dth)) + spins * Math.PI * 2;
      const t0 = performance.now(); controls.enabled = false;
      anim = (now) => { const t = Math.min(1, (now - t0) / dur), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        setSph(r1 ? a.r + (r1 - a.r) * e : a.r, a.th + dth * e, a.ph + (ph1 - a.ph) * e); if (t >= 1) { anim = null; controls.enabled = true; controls.update(); } };
    }
    const tick = (now) => {
      if (!alive) return;
      if (anim) anim(now); else controls.update();
      key.position.copy(camera.position).add(V(-3, 4, 0));
      const right = V(1, 0, 0).applyQuaternion(camera.quaternion), up = V(0, 1, 0).applyQuaternion(camera.quaternion);
      labels.forEach((l) => l.position.copy(l.userData.at).addScaledVector(right, 0.36).addScaledVector(up, 0.3));
      if (opt.onAngle) { const a = sph(); opt.onAngle(((a.th - th0) * 180) / Math.PI); }
      renderer.render(scene, camera); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    renderer.domElement.addEventListener("pointerdown", () => { opt.onInteract && opt.onInteract(); anim = null; controls.enabled = true; renderer.domElement.style.cursor = "grabbing"; });
    renderer.domElement.addEventListener("pointerup", () => { renderer.domElement.style.cursor = "grab"; });
    return {
      spin() { setSph(dist, th0, ph0); animateTo(th0, ph0, 4200, 1); },
      top() { animateTo(sph().th, 0.0001, 1600); },
      setAngle(deg) { anim = null; const a = sph(); setSph(a.r, th0 + (deg * Math.PI) / 180, a.ph); controls.update(); },
      home() { animateTo(th0, ph0, 1200, 0, dist); },
      dispose() { alive = false; window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); renderer.dispose(); host.removeChild(renderer.domElement); },
    };
  }
  window.Zome3D = { mount };
})();
