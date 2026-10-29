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
    const L = B.clone().sub(A), len = L.length(), full = window.ZOMEPARTS[kind], fl = Math.hypot(...full.dir);
    const P = len < fl * 0.8 && window.ZOMEPARTS[kind + "-short"] ? window.ZOMEPARTS[kind + "-short"] : full;
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

  /* ---------- model: five water molecules, the middle one holding four friends (lesson 9, p13) ---------- */
  /* ---------- lesson 9: water molecules (red O, white H; short yellow inside a molecule, medium yellow between) ---------- */
  const Y0 = PHI * PHI, Y1 = PHI * PHI * PHI;
  const TU = V(1, 1, 1), T2 = V(-1, -1, 1), T3 = V(-1, 1, -1), T4 = V(1, -1, -1);
  function tetraOrient() {               // molecule 1 straight up, friend 3 to the front (like the pictures)
    const q = new THREE.Quaternion().setFromUnitVectors(TU.clone().normalize(), V(0, 1, 0));
    const a3 = T3.clone().applyQuaternion(q), want = (100 * Math.PI) / 180, have = Math.atan2(a3.z, a3.x);
    return q.premultiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), have - want));
  }
  function waterSet({ mols = [0, 1, 2, 3, 4], hands = true, spread = 1, dashes = true, labels = [1, 2, 3, 4], elev = 14 } = {}) {
    const R = (Y0 + Y1) * spread, O = V(0, 0, 0);
    const On = [O, add(O, TU, R), add(O, T2, R), add(O, T3, R), add(O, T4, R)];
    const balls = [], struts = [], has = (k) => mols.includes(k);
    const mol = (o, h1, h2) => { balls.push([o, "red"], [h1, "white"], [h2, "white"]); struts.push([o, h1], [o, h2]); };
    mol(On[0], add(O, TU, Y0), add(O, T2, Y0));                                   // the middle one: its two hands
    if (has(1)) mol(On[1], add(On[1], T2, -Y0), add(On[1], T3, -Y0));
    if (has(2)) mol(On[2], add(On[2], TU, -Y0), add(On[2], T4, -Y0));
    if (has(3)) mol(On[3], add(On[3], T3, -Y0), add(On[3], TU, -Y0));          // friends 3 & 4 reach into its pockets
    if (has(4)) mol(On[4], add(On[4], T4, -Y0), add(On[4], T2, -Y0));
    if (hands) {
      if (has(1)) struts.push([add(O, TU, Y0), On[1]]);
      if (has(2)) struts.push([add(O, T2, Y0), On[2]]);
      if (has(3)) struts.push([add(On[3], T3, -Y0), O]);
      if (has(4)) struts.push([add(On[4], T4, -Y0), O]);
    }
    const D = dashes ? [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [2, 4]].map(([a, b]) => [On[a], On[b]]) : [];
    return { balls, struts: struts.map(([a, b]) => [a, b, "yellow"]), dashes: D, labels: labels.filter(has).map((k) => [On[k], String(k)]), orient: tetraOrient(), elev };
  }
  const waterTetra = () => waterSet();
  const water5 = () => waterSet({ hands: false, spread: 1.32, dashes: false, labels: [] });
  const water3 = () => waterSet({ mols: [0, 1, 2], dashes: false, labels: [1, 2] });
  const water5h = () => waterSet({ dashes: false });
  function water1() {                     // one molecule: O on top, two H below, facing us
    const O = V(0, 0, 0), H1 = add(O, TU, Y0), H2 = add(O, T2, Y0);
    const up = TU.clone().add(T2).negate(), n = TU.clone().cross(T2);
    return { balls: [[O, "red"], [H1, "white"], [H2, "white"]], struts: [[O, H1, "yellow"], [O, H2, "yellow"]], dashes: [], labels: [], orient: orientQ(up, n, 0), elev: 6 };
  }
  function waterPockets() {               // H up, the two empty pockets (dashed) below
    const O = V(0, 0, 0), H1 = add(O, TU, Y0), H2 = add(O, T2, Y0), P3 = add(O, T3, Y1 * 1.25), P4 = add(O, T4, Y1 * 1.25);
    const up = TU.clone().add(T2), n = TU.clone().cross(T2);
    return { balls: [[O, "red"], [H1, "white"], [H2, "white"]], struts: [[O, H1, "yellow"], [O, H2, "yellow"]], dashes: [[O, P3], [O, P4]],
      labels: [[P3, "−", "pocket"], [P4, "−", "pocket"]], orient: orientQ(up, n, 28), elev: 8 };
  }
  /* ---------- lesson 9: keep holding hands -> one puckered layer of ice (every ring is a hexagon from above) ---------- */
  /* layered like real ice: every layer sits right on top of the one below, so from above all layers share one honeycomb.
     Layer 0 uses exactly the Zometool yellow directions; the mirrored layers above/below are drawn with the same struts. */
  const ICE_MAX = 5;
  const ICE_STAGES = [{ d: 1, layers: [0], top1: true }, { d: 2, layers: [0], top1: true }, { d: 4, layers: [0], top1: true }, { d: 4, layers: [-1, 0], top1: true }, { d: 4, layers: [-1, 0, 1] }];
  function ice(stage = ICE_MAX) {
    const st = ICE_STAGES[Math.max(1, Math.min(ICE_MAX, stage)) - 1], S3 = Math.sqrt(3), R = (Y0 + Y1) * S3, YS = Y0 * S3, up = TU.clone().normalize(), h = R / 3;
    const U2 = T2.clone().normalize(), U3 = T3.clone().normalize(), U4 = T4.clone().normalize();
    const flat = (v) => v.clone().addScaledVector(up, -v.dot(up)), key = (p) => p.toArray().map((x) => x.toFixed(2)).join();
    // honeycomb of layer 0 (A = like the middle molecule, B = its 3 friends in the same layer)
    const sites = new Map(), q = [[V(0, 0, 0), "A", 0]]; sites.set(key(q[0][0]), q[0]);
    while (q.length) { const [p, t, d] = q.shift(); if (d >= st.d) continue;
      for (const dir of [U2, U3, U4]) { const n = flat(add(p, dir, t === "A" ? R : -R)), k = key(n); if (!sites.has(k)) { const e = [n, t === "A" ? "B" : "A", d + 1]; sites.set(k, e); q.push(e); } } }
    // atoms: in layer k the upper site is A when k is even, B when k is odd (mirror image)
    const atoms = [];
    for (const k of st.layers) for (const [xy, t] of sites.values()) {
      const upper = (t === "A") === (k % 2 === 0), z = k * (h + R) - (upper ? 0 : h);
      atoms.push({ p: xy.clone().addScaledVector(up, z), upper, k });
    }
    if (st.top1) atoms.push({ p: up.clone().multiplyScalar(R), upper: false, k: 1 });          // molecule 1, right above the middle one
    const p2 = flat(U2).normalize(), at = new Map(atoms.map((a) => [key(a.p), a]));
    const balls = [], struts = [];
    for (const a of atoms) {
      // bonds of this atom: one vertical (up if upper) + three in-layer; in-layer ones tilt down for upper atoms, up for lower atoms
      const vert = up.clone().multiplyScalar(a.upper ? 1 : -1), inl = [];
      const base = a.upper === (a.k % 2 === 0) ? [U2, U3, U4] : [U2, U3, U4].map((d) => d.clone().negate());
      for (const d of base) { let v = d.clone().normalize(); const vz = v.dot(up); v = flat(v).addScaledVector(up, a.upper ? -Math.abs(vz) : Math.abs(vz)); inl.push(v); }
      // ice rule: upper atoms give one H upward + one H along the "T2" family; lower atoms give two H along the other two
      const fam = (v) => Math.abs(flat(v).normalize().dot(p2)) > 0.99;
      const give = a.upper ? [vert, inl.find(fam)] : inl.filter((v) => !fam(v));
      balls.push([a.p, "red"]);
      for (const d of give) { const hh = add(a.p, d, YS); balls.push([hh, "white"]); struts.push([a.p, hh, "yellow"]);
        const far = add(a.p, d, R); if (at.has(key(far))) struts.push([hh, far, "yellow"]); }
    }
    return { balls, struts, dashes: [], labels: [], orient: tetraOrient(), elev: 14, grow: ICE_MAX };
  }
  /* ---------- lesson 9: snowflake from blue struts (core = medium, main branches = long, side branches = short) ---------- */
  function snow(stage, roll = 0) {
    const L = 8.472, e1 = V(1, 0, 0), v2 = V(0.5, PHI / 2, 1 / (2 * PHI)), v3 = V(-0.5, PHI / 2, 1 / (2 * PHI));
    const D = [e1, v2, v3, e1.clone().negate(), v2.clone().negate(), v3.clone().negate()];
    const C = [V(0, 0, 0)]; for (let k = 0; k < 5; k++) C.push(add(C[k], D[k], L));
    const ctr = C.reduce((a, p) => a.add(p), V(0, 0, 0)).multiplyScalar(1 / 6);
    const balls = C.map((p) => [p, "white"]), struts = C.map((p, k) => [p, C[(k + 1) % 6], "blue"]);
    const nearest = (u) => D.reduce((b, d) => (d.dot(u) > b.dot(u) ? d : b));
    if (stage >= 2) C.forEach((p) => {
      const u = nearest(p.clone().sub(ctr).normalize()), M = add(p, u, L * PHI);
      balls.push([M, "white"]); struts.push([p, M, "blue"]);
      if (stage >= 3) D.filter((d) => Math.abs(d.dot(u) - 0.5) < 1e-6).forEach((d) => { const S = add(M, d, L / PHI); balls.push([S, "white"]); struts.push([M, S, "blue"]); });
    });
    const n = e1.clone().cross(v2).normalize(), up = n.clone().cross(e1);
    const q = orientQ(up, n, 0).premultiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), (roll * Math.PI) / 180));
    return { balls, struts, dashes: [], labels: [], orient: q, elev: 0 };
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

  /* lesson 5 (p7, p12): long blue struts + white balls, exactly on Zometool blue directions */
  const BLEN = 8.472;
  let BLUES = null;
  const blues = () => BLUES || (BLUES = (() => { const out = []; icoGroup().forEach((m) => { const d = V(0, 0, 1).applyMatrix3(m); if (!out.some((o) => o.distanceTo(d) < 1e-4)) out.push(d); }); return out; })());
  const snapBlue = (v) => { const u = v.clone().normalize(); let best = null, bd = 9; blues().forEach((d) => { const x = d.distanceTo(u); if (x < bd) { bd = x; best = d; } }); return best.clone(); };
  function blueModel(P, E, up, front, yaw, elev) {
    return { balls: P.map((p) => [p, "white"]), struts: E.map(([a, b]) => [P[a], P[b], "blue"]), dashes: [], labels: [], orient: orientQ(up, front, yaw), elev };
  }
  function sqTri() {                       // square on the left, triangle on the right (like the slide picture)
    const L = BLEN, x = snapBlue(V(1, 0, 0)), y = snapBlue(V(0, 1, 0)), b60 = snapBlue(V(0.5, PHI / 2, 1 / (2 * PHI)));
    const S0 = V(0, 0, 0), S1 = x.clone().multiplyScalar(L), S2 = S1.clone().addScaledVector(y, L), S3 = y.clone().multiplyScalar(L);
    const T0 = x.clone().multiplyScalar(L * 1.8), T1 = T0.clone().addScaledVector(x, L), T2 = T0.clone().addScaledVector(b60, L);
    return blueModel([S0, S1, S2, S3, T0, T1, T2], [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 4]], y, V(0, 0, 1), 0, 6);
  }
  function blueSq() { const m = sqTri(); return blueModel(m.balls.slice(0, 4).map((b) => b[0]), [[0, 1], [1, 2], [2, 3], [3, 0]], snapBlue(V(0, 1, 0)), V(0, 0, 1), 0, 6); }
  function blueTri() { const m = sqTri(); return blueModel(m.balls.slice(4).map((b) => b[0]), [[0, 1], [1, 2], [2, 0]], snapBlue(V(0, 1, 0)), V(0, 0, 1), 0, 6); }
  function pent() {
    const L = BLEN, d0 = snapBlue(V(1, 0, 0)), c72 = Math.cos((72 * Math.PI) / 180);
    const d1 = blues().filter((d) => Math.abs(d.dot(d0) - c72) < 1e-3).sort((a, b) => b.y - a.y)[0];
    const n = d0.clone().cross(d1).normalize(), P = [V(0, 0, 0)];
    for (let k = 0; k < 4; k++) { const e = snapBlue(d0.clone().applyAxisAngle(n, (k * 72 * Math.PI) / 180)); P.push(P[k].clone().addScaledVector(e, L)); }
    const c = P.reduce((a, p) => a.add(p), V(0, 0, 0)).multiplyScalar(1 / 5), up = c.clone().sub(P[0].clone().add(P[1]).multiplyScalar(0.5));
    return blueModel(P, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], up, n, 0, 6);
  }
  const MODELS = { sqTri, blueSq, blueTri, pent, waterTetra, water1, waterPockets, water5, water3, water5h, tri, pyr, bridge,
    snow1: () => snow(1), ice, snow2: () => snow(2), snow3: () => snow(3, 16) };

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
    const BG = ballGeometry(), built = new Map(), popping = [];
    const prevKeys = new Set(), growing = [];
    if (opt.from && MODELS[opt.from]) { const P0 = MODELS[opt.from](); const kk = (p) => p.toArray().map((x) => x.toFixed(2)).join();
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
    fit(); controls.minDistance = dist * 0.35; controls.maxDistance = dist * 1.6;
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
      stage: () => M.stage || 1, maxStage: M.grow || 0,
      grow() { if (!M.grow) return 0; const next = (M.stage || 1) >= M.grow ? 1 : (M.stage || 1) + 1; M = MODELS[kind](next); M.stage = next; buildParts(next > 1); const a = sph(); animateTo(a.th, a.ph, 900, a.ph < 0.2 ? topDist * stageDist[next] / stageDist[M.grow] : stageDist[next]); return next; },
      dispose() { alive = false; window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); renderer.dispose(); host.removeChild(renderer.domElement); },
    };
  }
  window.Zome3D = { mount, _M: MODELS };
})();
