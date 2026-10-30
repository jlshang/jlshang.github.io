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
    const L = B.clone().sub(A), len = L.length(), full = window.ZOMEPARTS[kind] || window.ZOMEPARTS[kind === "red" ? "blue" : "yellow"], fl = Math.hypot(...full.dir);
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
  function tri(stage = 1) {
    const A = g(0, 0, 0), B = g(1, 1, 0), C = g(1, 0, 1), P = g(1, 0, 0);
    const balls = [[A, "white"], [B, "white"], [C, "white"]];
    const struts = [[A, B, "green"], [B, C, "green"], [C, A, "green"]];
    if (stage >= 2) {
      balls.push([P, "white"]);
      struts.push([P, A, "blue"], [P, B, "blue"], [P, C, "blue"]);
    }
    const n = B.clone().sub(A).cross(C.clone().sub(A)), up = C.clone().sub(A.clone().add(B).multiplyScalar(0.5));
    return { balls, struts, dashes: [], labels: [], orient: orientQ(up, n, 0), elev: 4, grow: 2 };
  }
  function pyr(stage = 1) {
    const a = g(1, 1, 0), b = g(1, -1, 0);
    const P = [V(0, 0, 0), a.clone(), a.clone().add(b), b.clone(), a.clone().add(b).multiplyScalar(0.5).add(g(0, 0, 1))];
    const C = a.clone().add(b).multiplyScalar(0.5);
    const balls = P.map((p) => [p, "white"]);
    const struts = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]].map(([i, j]) => [P[i], P[j], "green"]);
    if (stage >= 2) {
      balls.push([C, "white"]);
      struts.push([C, P[0], "blue"], [C, P[1], "blue"], [C, P[2], "blue"], [C, P[3], "blue"], [C, P[4], "blue"]);
    }
    return { balls, struts, dashes: [], labels: [], orient: orientQ(V(0, 0, 1), b.clone().negate(), 12), elev: 18, grow: 2 };
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
  function blueTri() {
    const P0 = sqTri().balls.slice(4).map((b) => b[0]);
    const c = P0.reduce((a, p) => a.add(p.clone()), V(0, 0, 0)).multiplyScalar(1 / 3);
    const n = P0[1].clone().sub(P0[0]).cross(P0[2].clone().sub(P0[0])).normalize();
    if (n.z < 0) n.negate();
    const qFace = new THREE.Quaternion().setFromUnitVectors(n, V(0, 0, 1));
    let Q = P0.map((p) => p.clone().sub(c).applyQuaternion(qFace));
    let apex = 0; Q.forEach((p, i) => { if (p.y > Q[apex].y) apex = i; });
    const qUp = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -Math.atan2(Q[apex].x, Q[apex].y));
    Q = Q.map((p) => p.applyQuaternion(qUp));
    return blueModel(Q, [[0, 1], [1, 2], [2, 0]], V(0, 1, 0), V(0, 0, 1), 0, 0);
  }
  function pent() {
    const L = BLEN, d0 = snapBlue(V(1, 0, 0)), c72 = Math.cos((72 * Math.PI) / 180);
    const d1 = blues().filter((d) => Math.abs(d.dot(d0) - c72) < 1e-3).sort((a, b) => b.y - a.y)[0];
    const n = d0.clone().cross(d1).normalize(), P = [V(0, 0, 0)];
    for (let k = 0; k < 4; k++) { const e = snapBlue(d0.clone().applyAxisAngle(n, (k * 72 * Math.PI) / 180)); P.push(P[k].clone().addScaledVector(e, L)); }
    const c = P.reduce((a, p) => a.add(p), V(0, 0, 0)).multiplyScalar(1 / 5), up = c.clone().sub(P[0].clone().add(P[1]).multiplyScalar(0.5));
    return blueModel(P, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], up, n, 0, 6);
  }
  const HWBRIDGES = {"hw1":{"P":[[-5.236,0.703,4.236],[-5.236,0.703,-4.236],[-0.0,0.703,4.236],[-0.0,0.703,-4.236],[5.236,0.703,4.236],[5.236,0.703,-4.236],[5.236,5.939,4.236],[-0.0,5.939,4.236],[-5.236,5.939,4.236],[5.236,5.939,-4.236],[-5.236,5.939,-4.236],[-0.0,5.939,-4.236],[9.472,4.321,-4.236],[9.472,4.321,4.236],[-9.472,4.321,4.236],[-9.472,4.321,-4.236],[-9.472,-0.915,-4.236],[-9.472,-0.915,4.236],[9.472,-0.915,-4.236],[9.472,-0.915,4.236],[-13.708,-2.533,-4.236],[-13.708,-2.533,4.236],[13.708,-2.533,-4.236],[13.708,-2.533,4.236],[13.708,2.703,-4.236],[13.708,2.703,4.236],[-13.708,2.703,4.236],[-13.708,2.703,-4.236],[17.944,-4.151,4.236],[17.944,-4.151,-4.236],[-17.944,-4.151,4.236],[-17.944,-4.151,-4.236],[-17.944,-9.387,4.236],[-17.944,-9.387,-4.236],[17.944,-9.387,4.236],[17.944,-9.387,-4.236]],"E":[[0,2,"blue"],[1,3,"blue"],[2,4,"blue"],[3,5,"blue"],[4,5,"blue"],[2,3,"blue"],[0,1,"blue"],[4,6,"blue"],[2,7,"blue"],[0,8,"blue"],[5,9,"blue"],[1,10,"blue"],[3,11,"blue"],[6,7,"blue"],[7,8,"blue"],[9,11,"blue"],[11,10,"blue"],[12,9,"yellow"],[13,6,"yellow"],[8,14,"yellow"],[10,15,"yellow"],[16,15,"blue"],[16,1,"yellow"],[17,14,"blue"],[17,0,"yellow"],[18,12,"blue"],[5,18,"yellow"],[19,13,"blue"],[4,19,"yellow"],[17,16,"blue"],[19,18,"blue"],[20,16,"yellow"],[21,17,"yellow"],[18,22,"yellow"],[19,23,"yellow"],[21,20,"blue"],[23,22,"blue"],[24,12,"yellow"],[22,24,"blue"],[25,13,"yellow"],[23,25,"blue"],[14,26,"yellow"],[21,26,"blue"],[15,27,"yellow"],[20,27,"blue"],[25,28,"red"],[24,29,"red"],[26,30,"red"],[27,31,"red"],[32,30,"blue"],[32,21,"red"],[33,31,"blue"],[33,20,"red"],[32,33,"blue"],[34,28,"blue"],[23,34,"red"],[35,29,"blue"],[34,35,"blue"],[22,35,"red"]],"B":["white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white"]},"hw2":{"P":[[-0.001,-5.545,-2.618],[13.707,-5.545,-2.618],[-0.001,-5.545,2.618],[13.707,-5.545,2.618],[-13.709,-5.545,-2.618],[-13.709,-5.545,2.618],[22.179,-5.545,-2.618],[22.179,-5.545,2.618],[27.416,-5.545,2.618],[27.416,-5.546,-2.618],[-22.181,-5.545,2.618],[-22.181,-5.545,-2.618],[-27.416,-5.545,-2.618],[-27.416,-5.545,2.618],[24.797,-1.309,-2.618],[24.797,-1.309,2.618],[17.944,1.309,2.618],[17.944,1.309,-2.618],[6.853,5.545,2.618],[6.853,5.545,-2.618],[-24.798,-1.309,-2.618],[-24.798,-1.309,2.618],[-17.944,1.309,2.618],[-17.944,1.309,-2.618],[-6.855,5.545,2.618],[-6.855,5.545,-2.618]],"E":[[0,1,"blue"],[0,2,"blue"],[2,3,"blue"],[3,1,"blue"],[0,4,"blue"],[2,5,"blue"],[5,4,"blue"],[1,6,"blue"],[3,7,"blue"],[6,7,"blue"],[8,9,"blue"],[7,8,"blue"],[6,9,"blue"],[5,10,"blue"],[4,11,"blue"],[11,10,"blue"],[11,12,"blue"],[10,13,"blue"],[13,12,"blue"],[6,14,"red"],[9,14,"red"],[7,15,"red"],[8,15,"red"],[3,16,"red"],[7,16,"red"],[1,17,"red"],[6,17,"red"],[3,18,"red"],[2,18,"red"],[0,19,"red"],[1,19,"red"],[11,20,"red"],[12,20,"red"],[10,21,"red"],[13,21,"red"],[5,22,"red"],[10,22,"red"],[4,23,"red"],[11,23,"red"],[5,24,"red"],[2,24,"red"],[0,25,"red"],[4,25,"red"],[19,25,"blue"],[24,18,"blue"],[22,24,"yellow"],[23,25,"yellow"],[21,22,"yellow"],[23,20,"yellow"],[21,20,"blue"],[16,18,"yellow"],[17,19,"yellow"],[15,16,"yellow"],[17,14,"yellow"],[15,14,"blue"],[17,16,"blue"],[18,19,"blue"],[25,24,"blue"],[22,23,"blue"]],"B":["white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white"]},"hw3":{"P":[[-4.235,4.736,4.236],[4.237,4.736,4.236],[9.473,4.736,4.236],[-9.471,4.736,4.236],[-4.235,4.736,-4.236],[4.237,4.736,-4.236],[9.473,4.736,-4.236],[-9.471,4.736,-4.236],[-6.853,8.972,4.236],[-6.853,8.972,-4.236],[6.855,8.972,4.236],[6.855,8.972,-4.236],[0.001,6.354,4.236],[0.001,6.354,-4.236],[17.944,4.736,4.236],[17.944,4.736,-4.236],[-17.944,4.736,4.236],[-17.944,4.736,-4.236],[11.091,2.118,4.236],[-11.089,2.118,4.236],[11.091,2.118,-4.236],[-11.089,2.118,-4.236],[17.944,-0.5,4.236],[17.944,-0.5,-4.236],[-17.944,-0.5,4.236],[-17.944,-0.5,-4.236],[24.798,2.118,4.236],[24.798,-3.118,4.236],[24.798,2.118,-4.236],[24.798,-3.118,-4.236],[-24.798,2.118,4.236],[-24.798,-3.118,4.236],[-24.798,2.118,-4.236],[-24.798,-3.118,-4.236],[16.327,-3.118,-4.236],[20.562,-8.972,-5.854],[16.327,-3.118,4.236],[-16.327,-3.118,-4.236],[-16.327,-3.118,4.236],[-20.562,-8.972,-5.854],[-20.562,-8.972,5.854],[20.562,-8.972,5.854]],"E":[[0,1,"blue"],[1,2,"blue"],[0,3,"blue"],[0,4,"blue"],[1,5,"blue"],[4,5,"blue"],[5,6,"blue"],[4,7,"blue"],[3,8,"red"],[0,8,"red"],[7,9,"red"],[4,9,"red"],[1,10,"red"],[2,10,"red"],[5,11,"red"],[6,11,"red"],[0,12,"yellow"],[1,12,"yellow"],[4,13,"yellow"],[5,13,"yellow"],[12,10,"yellow"],[12,8,"yellow"],[13,11,"yellow"],[13,9,"yellow"],[8,10,"blue"],[9,11,"blue"],[2,14,"blue"],[6,15,"blue"],[3,16,"blue"],[7,17,"blue"],[10,14,"yellow"],[11,15,"yellow"],[8,16,"yellow"],[9,17,"yellow"],[1,18,"yellow"],[0,19,"yellow"],[5,20,"yellow"],[4,21,"yellow"],[18,22,"yellow"],[20,23,"yellow"],[19,24,"yellow"],[21,25,"yellow"],[18,14,"yellow"],[20,15,"yellow"],[19,16,"yellow"],[21,17,"yellow"],[14,26,"yellow"],[22,27,"yellow"],[15,28,"yellow"],[23,29,"yellow"],[14,22,"blue"],[26,27,"blue"],[15,23,"blue"],[28,29,"blue"],[16,30,"yellow"],[24,31,"yellow"],[17,32,"yellow"],[25,33,"yellow"],[16,24,"blue"],[30,31,"blue"],[17,25,"blue"],[32,33,"blue"],[18,20,"blue"],[19,21,"blue"],[20,34,"green"],[34,35,"green"],[29,35,"green"],[18,36,"green"],[34,36,"blue"],[21,37,"green"],[19,38,"green"],[37,39,"green"],[38,40,"green"],[38,37,"blue"],[40,39,"blue"],[40,31,"green"],[39,33,"green"],[36,41,"green"],[41,35,"blue"],[27,41,"green"]],"B":["white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white"]}};
  function hwJ(name) {
    const S = HWBRIDGES[name], P = S.P.map((pt) => V(...pt));
    const pose = { hw1: { yaw: 0, elev: 4 }, hw2: { yaw: 0, elev: 6 }, hw3: { yaw: -12, elev: 10 } }[name] || { yaw: 0, elev: 8 };
    return { balls: P.map((pt, i) => [pt, S.B[i] || "white"]), struts: S.E.map((e) => [P[e[0]], P[e[1]], e[2] || "blue"]), dashes: [], labels: [], orient: orientQ(V(0, 1, 0), V(0, 0, 1), pose.yaw), elev: pose.elev };
  }
  const HWTOWER = {"P":[[-16.944,-8.472,0.0],[-8.472,-8.472,0.0],[0.0,-8.472,0.0],[8.472,-8.472,0.0],[16.944,-8.472,0.0],[-16.944,8.472,0.0],[-8.472,8.472,0.0],[0.0,8.472,0.0],[8.472,8.472,0.0],[16.944,8.472,0.0],[-16.944,0.0,0.0],[16.944,0.0,0.0],[-8.472,0.0,0.0],[-8.472,-8.472,8.472],[-8.472,8.472,8.472],[8.472,0.0,0.0],[8.472,-8.472,8.472],[8.472,8.472,8.472],[0.0,-8.472,8.472],[0.0,8.472,8.472],[-8.472,0.0,8.472],[8.472,0.0,8.472],[-8.472,-8.472,16.944],[-8.472,8.472,16.944],[8.472,-8.472,16.944],[8.472,8.472,16.944],[-8.472,-8.472,25.416],[-8.472,8.472,25.416],[8.472,-8.472,25.416],[8.472,8.472,25.416],[0.0,-8.472,25.416],[0.0,8.472,25.416],[-8.472,0.0,25.416],[8.472,0.0,25.416],[-8.472,-8.472,33.889],[-8.472,8.472,33.889],[8.472,-8.472,33.889],[8.472,8.472,33.889],[-8.472,-8.472,42.361],[-8.472,8.472,42.361],[8.472,-8.472,42.361],[8.472,8.472,42.361],[0.0,-8.472,42.361],[0.0,8.472,42.361],[-8.472,0.0,42.361],[8.472,0.0,42.361],[0.0,-8.472,16.944],[-8.472,0.0,16.944],[0.0,8.472,16.944],[8.472,0.0,16.944],[0.0,-8.472,33.889],[-8.472,0.0,33.889],[0.0,8.472,33.889],[8.472,0.0,33.889],[0.0,0.0,8.472],[0.0,0.0,25.416],[0.0,0.0,42.361],[-16.944,-8.472,50.833],[-8.472,-8.472,50.833],[-16.944,8.472,50.833],[-8.472,8.472,50.833],[16.944,-8.472,50.833],[8.472,-8.472,50.833],[16.944,8.472,50.833],[8.472,8.472,50.833],[-33.889,-8.472,50.833],[-25.416,-8.472,50.833],[0.0,-8.472,50.833],[25.416,-8.472,50.833],[33.889,-8.472,50.833],[-33.889,8.472,50.833],[-25.416,8.472,50.833],[0.0,8.472,50.833],[25.416,8.472,50.833],[33.889,8.472,50.833],[-33.889,0.0,50.833],[33.889,0.0,50.833],[-25.416,-8.472,59.305],[-16.944,-8.472,59.305],[-8.472,-8.472,59.305],[0.0,-8.472,59.305],[8.472,-8.472,59.305],[16.944,-8.472,59.305],[25.416,-8.472,59.305],[-25.416,8.472,59.305],[-16.944,8.472,59.305],[-8.472,8.472,59.305],[0.0,8.472,59.305],[8.472,8.472,59.305],[16.944,8.472,59.305],[25.416,8.472,59.305],[-25.416,0.0,59.305],[25.416,0.0,59.305],[-25.416,0.0,50.833],[-8.472,0.0,50.833],[8.472,0.0,50.833],[25.416,0.0,50.833],[-16.944,0.0,59.305],[0.0,0.0,59.305],[16.944,0.0,59.305]],"E":[[0,1,"blue"],[1,2,"blue"],[2,3,"blue"],[3,4,"blue"],[5,6,"blue"],[6,7,"blue"],[7,8,"blue"],[8,9,"blue"],[0,10,"blue"],[5,10,"blue"],[4,11,"blue"],[9,11,"blue"],[1,12,"blue"],[6,12,"blue"],[0,13,"green"],[1,13,"blue"],[5,14,"green"],[6,14,"blue"],[3,15,"blue"],[8,15,"blue"],[4,16,"green"],[3,16,"blue"],[9,17,"green"],[8,17,"blue"],[13,18,"blue"],[16,18,"blue"],[14,19,"blue"],[17,19,"blue"],[13,20,"blue"],[14,20,"blue"],[16,21,"blue"],[17,21,"blue"],[13,22,"blue"],[14,23,"blue"],[16,24,"blue"],[17,25,"blue"],[22,26,"blue"],[23,27,"blue"],[24,28,"blue"],[25,29,"blue"],[26,30,"blue"],[28,30,"blue"],[27,31,"blue"],[29,31,"blue"],[26,32,"blue"],[27,32,"blue"],[28,33,"blue"],[29,33,"blue"],[26,34,"blue"],[27,35,"blue"],[28,36,"blue"],[29,37,"blue"],[34,38,"blue"],[35,39,"blue"],[36,40,"blue"],[37,41,"blue"],[38,42,"blue"],[40,42,"blue"],[39,43,"blue"],[41,43,"blue"],[38,44,"blue"],[39,44,"blue"],[40,45,"blue"],[41,45,"blue"],[13,46,"green"],[26,46,"green"],[16,46,"green"],[28,46,"green"],[13,47,"green"],[26,47,"green"],[14,47,"green"],[27,47,"green"],[14,48,"green"],[27,48,"green"],[17,48,"green"],[29,48,"green"],[16,49,"green"],[28,49,"green"],[17,49,"green"],[29,49,"green"],[26,50,"green"],[38,50,"green"],[28,50,"green"],[40,50,"green"],[26,51,"green"],[38,51,"green"],[27,51,"green"],[39,51,"green"],[27,52,"green"],[39,52,"green"],[29,52,"green"],[41,52,"green"],[28,53,"green"],[40,53,"green"],[29,53,"green"],[41,53,"green"],[13,54,"green"],[14,54,"green"],[16,54,"green"],[17,54,"green"],[26,55,"green"],[27,55,"green"],[28,55,"green"],[29,55,"green"],[38,56,"green"],[39,56,"green"],[40,56,"green"],[41,56,"green"],[38,57,"green"],[38,58,"blue"],[39,59,"green"],[39,60,"blue"],[40,61,"green"],[40,62,"blue"],[41,63,"green"],[41,64,"blue"],[65,66,"blue"],[57,66,"blue"],[57,58,"blue"],[58,67,"blue"],[62,67,"blue"],[61,62,"blue"],[61,68,"blue"],[68,69,"blue"],[70,71,"blue"],[59,71,"blue"],[59,60,"blue"],[60,72,"blue"],[64,72,"blue"],[63,64,"blue"],[63,73,"blue"],[73,74,"blue"],[65,75,"blue"],[70,75,"blue"],[69,76,"blue"],[74,76,"blue"],[77,78,"blue"],[78,79,"blue"],[79,80,"blue"],[80,81,"blue"],[81,82,"blue"],[82,83,"blue"],[84,85,"blue"],[85,86,"blue"],[86,87,"blue"],[87,88,"blue"],[88,89,"blue"],[89,90,"blue"],[77,91,"blue"],[84,91,"blue"],[83,92,"blue"],[90,92,"blue"],[66,77,"blue"],[57,78,"blue"],[58,79,"blue"],[67,80,"blue"],[62,81,"blue"],[61,82,"blue"],[68,83,"blue"],[66,78,"green"],[58,78,"green"],[58,80,"green"],[62,80,"green"],[62,82,"green"],[68,82,"green"],[65,77,"green"],[69,83,"green"],[71,84,"blue"],[59,85,"blue"],[60,86,"blue"],[72,87,"blue"],[64,88,"blue"],[63,89,"blue"],[73,90,"blue"],[71,85,"green"],[60,85,"green"],[60,87,"green"],[64,87,"green"],[64,89,"green"],[73,89,"green"],[70,84,"green"],[74,90,"green"],[65,93,"green"],[70,93,"green"],[57,93,"green"],[59,93,"green"],[57,94,"green"],[59,94,"green"],[67,94,"green"],[72,94,"green"],[67,95,"green"],[72,95,"green"],[61,95,"green"],[63,95,"green"],[61,96,"green"],[63,96,"green"],[69,96,"green"],[74,96,"green"],[77,97,"green"],[84,97,"green"],[79,97,"green"],[86,97,"green"],[79,98,"green"],[86,98,"green"],[81,98,"green"],[88,98,"green"],[81,99,"green"],[88,99,"green"],[83,99,"green"],[90,99,"green"],[66,91,"green"],[71,91,"green"],[68,92,"green"],[73,92,"green"]],"B":["white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white"]};
  function hwTower() {
    const P = HWTOWER.P.map((pt) => V(...pt));
    return { balls: P.map((pt, i) => [pt, HWTOWER.B[i] || "white"]), struts: HWTOWER.E.map((e) => [P[e[0]], P[e[1]], e[2] || "blue"]), dashes: [], labels: [], orient: orientQ(V(0, 0, 1), V(0, 1, 0), -18), elev: 10 };
  }
  const HWPYLON = {"P":[[27.416,80.249,-8.472],[22.18,80.249,-8.472],[35.889,80.249,-8.472],[13.708,80.249,-8.472],[35.889,80.249,0.0],[35.889,80.249,5.236],[35.889,80.249,10.472],[35.889,80.249,18.944],[22.18,80.249,18.944],[27.416,80.249,18.944],[13.708,80.249,18.944],[13.708,80.249,10.472],[13.708,80.249,5.236],[13.708,80.249,0.0],[22.18,80.249,5.236],[27.416,80.249,5.236],[27.416,80.249,0.0],[27.416,80.249,10.472],[17.944,87.103,-11.09],[31.652,87.103,-11.09],[36.889,87.103,-11.09],[12.708,87.103,-11.09],[38.507,98.193,-15.326],[11.09,98.193,-15.326],[11.09,98.193,-6.854],[12.09,91.339,-4.236],[38.507,98.193,-6.854],[37.507,91.339,-4.236],[11.09,98.193,25.798],[11.09,98.193,17.326],[38.507,98.193,25.798],[38.507,98.193,17.326],[17.944,87.103,21.562],[12.708,87.103,21.562],[12.09,91.339,14.708],[31.652,87.103,21.562],[36.889,87.103,21.562],[37.507,91.339,14.708],[24.798,76.013,-6.854],[15.326,69.159,-4.236],[34.271,69.159,-4.236],[29.034,69.159,-4.236],[20.562,69.159,-4.236],[20.562,69.159,14.708],[29.034,69.159,14.708],[24.798,76.013,17.326],[15.326,69.159,14.708],[34.271,69.159,14.708],[24.798,62.305,-1.618],[33.271,62.305,-1.618],[16.326,62.305,-1.618],[16.326,62.305,12.09],[24.798,62.305,12.09],[33.271,62.305,12.09],[31.652,51.215,2.618],[17.944,51.215,2.618],[17.944,51.215,7.854],[31.652,51.215,7.854],[31.652,37.507,2.618],[17.944,37.507,2.618],[24.798,44.361,2.618],[24.798,44.361,7.854],[17.944,37.507,7.854],[31.652,37.507,7.854],[13.708,44.361,0.0],[13.708,44.361,10.472],[0.0,44.361,0.0],[0.0,44.361,10.472],[0.0,49.597,0.0],[0.0,49.597,10.472],[35.889,44.361,10.472],[35.889,44.361,0.0],[49.597,44.361,10.472],[49.597,44.361,0.0],[49.597,49.597,10.472],[49.597,49.597,0.0],[17.944,29.034,2.618],[31.652,29.034,2.618],[31.652,29.034,7.854],[27.416,33.271,2.618],[22.18,33.271,2.618],[17.944,29.034,7.854],[22.18,33.271,7.854],[27.416,33.271,7.854],[0.0,27.416,10.472],[17.944,15.326,7.854],[13.708,22.18,10.472],[0.0,27.416,0.0],[17.944,15.326,2.618],[13.708,22.18,0.0],[49.597,27.416,10.472],[31.652,15.326,7.854],[35.889,22.18,10.472],[49.597,27.416,0.0],[31.652,15.326,2.618],[35.889,22.18,0.0],[0.0,22.18,10.472],[0.0,22.18,0.0],[49.597,22.18,10.472],[49.597,22.18,0.0],[22.18,11.09,7.854],[17.944,6.854,7.854],[24.798,22.18,7.854],[22.18,11.09,2.618],[17.944,6.854,2.618],[24.798,22.18,2.618],[27.416,11.09,7.854],[31.652,6.854,7.854],[27.416,11.09,2.618],[31.652,6.854,2.618],[22.18,0.0,0.0],[27.416,0.0,0.0],[35.889,0.0,0.0],[13.708,0.0,0.0],[13.708,0.0,10.472],[22.18,0.0,10.472],[27.416,0.0,10.472],[35.889,0.0,10.472],[27.416,0.0,5.236],[35.889,0.0,5.236],[13.708,0.0,5.236],[22.18,0.0,5.236],[49.597,0.0,0.0],[49.597,0.0,10.472],[49.597,5.236,0.0],[49.597,5.236,10.472],[0.0,5.236,10.472],[0.0,5.236,0.0],[0.0,0.0,10.472],[0.0,0.0,0.0]],"E":[[0,1,"blue"],[0,2,"blue"],[1,3,"blue"],[2,4,"blue"],[4,5,"blue"],[5,6,"blue"],[6,7,"blue"],[8,9,"blue"],[8,10,"blue"],[9,7,"blue"],[10,11,"blue"],[11,12,"blue"],[12,13,"blue"],[13,3,"blue"],[13,1,"green"],[12,0,"green"],[12,14,"blue"],[14,15,"blue"],[15,16,"blue"],[15,17,"blue"],[16,0,"blue"],[15,5,"blue"],[17,9,"blue"],[11,8,"green"],[12,9,"green"],[6,17,"blue"],[4,16,"blue"],[16,14,"green"],[14,17,"green"],[1,18,"blue"],[0,19,"blue"],[19,2,"blue"],[18,3,"blue"],[19,20,"blue"],[18,21,"blue"],[2,20,"green"],[19,22,"blue"],[18,23,"blue"],[3,21,"green"],[21,23,"green"],[20,22,"green"],[23,24,"blue"],[13,25,"green"],[25,24,"green"],[3,25,"green"],[24,21,"green"],[22,26,"blue"],[26,27,"green"],[27,4,"green"],[27,2,"green"],[20,26,"green"],[18,24,"blue"],[19,26,"blue"],[28,29,"blue"],[30,31,"blue"],[32,28,"blue"],[33,28,"green"],[29,34,"green"],[33,29,"green"],[32,29,"blue"],[35,30,"blue"],[36,30,"green"],[37,31,"green"],[31,36,"green"],[35,31,"blue"],[8,32,"blue"],[32,10,"blue"],[32,33,"blue"],[10,33,"green"],[34,11,"green"],[34,10,"green"],[9,35,"blue"],[35,7,"blue"],[35,36,"blue"],[7,36,"green"],[6,37,"green"],[7,37,"green"],[0,38,"blue"],[1,38,"blue"],[3,39,"green"],[2,40,"green"],[40,0,"blue"],[1,39,"blue"],[38,41,"blue"],[38,42,"blue"],[40,41,"blue"],[41,42,"blue"],[42,39,"blue"],[41,0,"green"],[1,42,"green"],[39,13,"green"],[4,40,"green"],[43,44,"blue"],[45,43,"blue"],[46,43,"blue"],[43,8,"green"],[45,44,"blue"],[44,47,"blue"],[9,44,"green"],[9,45,"blue"],[8,45,"blue"],[10,46,"green"],[46,8,"blue"],[11,46,"green"],[7,47,"green"],[9,47,"blue"],[47,6,"green"],[41,48,"blue"],[48,42,"blue"],[41,49,"blue"],[42,50,"blue"],[40,49,"green"],[39,50,"green"],[49,48,"blue"],[48,50,"blue"],[12,50,"green"],[49,5,"green"],[43,51,"blue"],[46,51,"green"],[51,52,"blue"],[51,12,"green"],[43,52,"blue"],[52,44,"blue"],[52,53,"blue"],[44,53,"blue"],[47,53,"green"],[5,53,"green"],[50,51,"blue"],[53,49,"blue"],[52,48,"blue"],[49,54,"green"],[48,54,"blue"],[54,55,"blue"],[54,57,"blue"],[50,55,"green"],[48,55,"blue"],[55,56,"blue"],[56,57,"blue"],[51,56,"green"],[52,56,"blue"],[53,57,"green"],[52,57,"blue"],[54,58,"blue"],[55,59,"blue"],[58,59,"blue"],[58,60,"green"],[60,55,"green"],[54,60,"green"],[60,59,"green"],[62,61,"green"],[61,57,"green"],[56,61,"green"],[61,63,"green"],[56,62,"blue"],[62,63,"blue"],[57,63,"blue"],[63,58,"blue"],[59,62,"blue"],[59,64,"blue"],[55,64,"blue"],[56,65,"blue"],[62,65,"blue"],[64,66,"blue"],[65,67,"blue"],[59,66,"green"],[62,67,"green"],[66,68,"blue"],[67,69,"blue"],[63,70,"blue"],[57,70,"blue"],[70,72,"blue"],[54,71,"blue"],[58,71,"blue"],[71,73,"blue"],[63,72,"green"],[72,74,"blue"],[58,73,"green"],[73,75,"blue"],[59,76,"blue"],[58,77,"blue"],[77,76,"blue"],[77,78,"blue"],[58,79,"green"],[77,79,"green"],[59,80,"green"],[80,76,"green"],[80,79,"blue"],[81,76,"blue"],[62,81,"blue"],[81,78,"blue"],[81,82,"green"],[62,82,"green"],[63,78,"blue"],[83,78,"green"],[83,82,"blue"],[63,83,"green"],[85,100,"green"],[85,101,"blue"],[81,85,"blue"],[85,102,"green"],[85,86,"blue"],[81,86,"blue"],[88,103,"green"],[88,104,"blue"],[88,85,"blue"],[105,88,"green"],[76,88,"blue"],[76,89,"blue"],[88,89,"blue"],[91,106,"green"],[91,107,"blue"],[78,91,"blue"],[85,91,"blue"],[102,91,"green"],[78,92,"blue"],[91,92,"blue"],[94,108,"green"],[94,109,"blue"],[91,94,"blue"],[94,105,"green"],[94,88,"blue"],[77,94,"blue"],[94,95,"blue"],[77,95,"blue"],[96,84,"blue"],[85,96,"green"],[86,96,"blue"],[97,87,"blue"],[88,97,"green"],[89,97,"blue"],[98,90,"blue"],[91,98,"green"],[92,98,"blue"],[99,93,"blue"],[94,99,"green"],[95,99,"blue"],[101,100,"green"],[106,100,"blue"],[101,104,"blue"],[101,107,"blue"],[102,78,"green"],[81,102,"green"],[103,104,"green"],[103,108,"blue"],[109,104,"blue"],[105,76,"green"],[77,105,"green"],[106,107,"green"],[109,107,"blue"],[109,108,"green"],[104,110,"blue"],[109,111,"blue"],[109,112,"blue"],[104,113,"blue"],[113,110,"blue"],[110,111,"blue"],[111,112,"blue"],[101,114,"blue"],[101,115,"blue"],[107,116,"blue"],[107,117,"blue"],[114,115,"blue"],[115,116,"blue"],[116,117,"blue"],[116,118,"blue"],[118,111,"blue"],[117,119,"blue"],[119,112,"blue"],[113,120,"blue"],[120,114,"blue"],[110,121,"blue"],[121,115,"blue"],[112,122,"blue"],[117,123,"blue"],[109,122,"green"],[107,123,"green"],[122,124,"blue"],[123,125,"blue"],[128,126,"blue"],[129,127,"blue"],[114,128,"blue"],[101,128,"green"],[113,129,"blue"],[104,129,"green"]],"B":["blue","blue","blue","blue","blue","blue","blue","blue","blue","blue","blue","blue","blue","blue","blue","blue","blue","blue","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","black","black","white","white","white","white","black","black","white","white","white","white","white","white","white","white","black","white","white","black","white","white","black","white","white","black","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","white","black","black","black","black","white","white"]};
  function hwPylon() {
    const P = HWPYLON.P.map((pt) => V(...pt));
    return { balls: P.map((pt, i) => [pt, HWPYLON.B[i] || "white"]), struts: HWPYLON.E.map((e) => [P[e[0]], P[e[1]], e[2] || "blue"]), dashes: [], labels: [], orient: orientQ(V(0, -1, 0), V(0, 0, -1), -18), elev: 10 };
  }
  const MODELS = { sqTri, blueSq, blueTri, pent, waterTetra, water1, waterPockets, water5, water3, water5h, tri, pyr, bridge,
    snow1: () => snow(1), ice, snow2: () => snow(2), snow3: () => snow(3, 16),
    hw1: () => hwJ("hw1"), hw2: () => hwJ("hw2"), hw3: () => hwJ("hw3"), hwTower, hwPylon };

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
      black: new THREE.MeshStandardMaterial({ color: lin(0x2c2c2e), roughness: 0.45, metalness: 0.04, side: THREE.DoubleSide }),
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

    let anim = null, raf = 0, alive = true, idleOn = !!opt.idle, idlePhase = +opt.idlePhase || 0, dragging = false;
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
      if (anim) anim(now);
      else if (idleOn && !dragging) {
        const w = Math.sin(now / 2200 + idlePhase) * 0.16;
        const b = Math.sin(now / 3100 + idlePhase + 0.8) * 0.045;
        setSph(dist, th0 + w, ph0 + b);
      } else controls.update();
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
    renderer.domElement.addEventListener("pointerdown", () => { idleOn = false; dragging = true; opt.onInteract && opt.onInteract(); anim = null; controls.enabled = true; renderer.domElement.style.cursor = "grabbing"; });
    renderer.domElement.addEventListener("pointerup", () => { dragging = false; renderer.domElement.style.cursor = "grab"; });
    return {
      top() { animateTo(sph().th, 0.0001, 1600, stageDist ? topDist * stageDist[M.stage || 1] / stageDist[M.grow] : null); },
      growIn(done) { growDone = done; growT0 = 0; },
      intro(done, dur = 1600, style = "") { if (stageDist) dist = stageDist[M.stage || 1]; let t0 = 0, n = 0; controls.enabled = false;
        if (style === "soft" || style === "quick") {
          const q = style === "quick", dth = q ? 0 : 0.22, dph = q ? 0 : 0.06, dr = q ? 0.12 : 0.1, D = q ? 700 : 1900; setSph(dist * (1 + dr), th0 + dth, ph0 - dph);
          anim = (now) => { if (n++ < 2) { t0 = now; return; } const t = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - t, 3);
            setSph(dist * (1 + dr * (1 - e)), th0 + dth * (1 - e), ph0 - dph * (1 - e)); if (t >= 1) { anim = null; controls.enabled = true; controls.update(); done && done(); } };
          return; }
        const tilt = (style === "flat" || style === "soft") ? 0 : 0.2, spin = style === "flat" ? 0.32 : Math.PI * 2, r0 = style === "flat" ? dist * 1.16 : dist * 1.45;
        setSph(r0, th0 - spin, ph0 + tilt);
        anim = (now) => { if (n++ < 2) { t0 = now; return; } const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
          setSph(r0 + (dist - r0) * e, th0 - spin * (1 - e), ph0 + tilt * (1 - e)); if (t >= 1) { anim = null; controls.enabled = true; controls.update(); done && done(); } }; },
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
