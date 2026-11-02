/* ZomeFold: n regular k-gons built from Zometool parts around one ball.
   Flat state = how the pieces lie on the table (a real Zometool layout).
   "聚拢" folds them, keeping every polygon rigid and every shared strut shared,
   until the gap closes into the corner of a regular polyhedron (also a real Zometool corner).
   If the angles already add up to 360° the pieces stay flat; if they add up to more, the last one overlaps. */
(function () {
  "use strict";
  const PHI = (1 + Math.sqrt(5)) / 2;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  /* medium rods: green G2, blue B2 (same lengths the build pages use) */
  const LEN = () => ({ green: Math.hypot(...ZOMEPARTS.green.dir) * PHI, blue: Math.hypot(...ZOMEPARTS.blue.dir) });
  const FILL = { green: 0x58b46f, blue: 0x4f8fd0, bad: 0xd64545 };

  function layout(k, n, t, L) {
    const a = ((k - 2) * Math.PI) / k, total = n * a, can = total < 2 * Math.PI - 1e-6, closed = Math.abs(total - 2 * Math.PI) < 1e-6, over = total > 2 * Math.PI + 1e-6;
    const phi = can ? a + t * ((2 * Math.PI) / n - a) : a;
    const s2 = can ? Math.min(1, (1 - Math.cos(a)) / (1 - Math.cos(phi))) : 1, sb = Math.sqrt(s2), cb = Math.sqrt(Math.max(0, 1 - s2));
    const start = -(n * phi) / 2 + Math.PI / 2;
    const ray = (i) => V(sb * Math.cos(start + i * phi), -cb, sb * Math.sin(start + i * phi));
    const pts = [V(0, 0, 0)], tip = [];
    for (let i = 0; i <= n; i++) { if (closed && i === n) { tip.push(tip[0]); break; } tip.push(pts.length); pts.push(ray(i).multiplyScalar(L)); }
    const faces = [], edges = [];
    for (let i = 0; i <= n; i++) if (!(closed && i === n)) edges.push([0, tip[i], i === n ? "last" : ""]);
    for (let i = 0; i < n; i++) {
      const u = ray(i).normalize(), v = ray(i + 1), w = v.clone().addScaledVector(u, -v.dot(u)).normalize();
      const ids = [0, tip[i]]; let x = L, y = 0, h = (2 * Math.PI) / k;
      for (let j = 2; j < k - 1; j++) { x += L * Math.cos(h); y += L * Math.sin(h); h += (2 * Math.PI) / k; ids.push(pts.length); pts.push(u.clone().multiplyScalar(x).addScaledVector(w, y)); }
      ids.push(tip[i + 1]); faces.push(ids);
      for (let j = 1; j < ids.length - 1; j++) edges.push([ids[j], ids[j + 1], ""]);
    }
    return { pts, edges, faces, can, closed, over };
  }

  class ZomeFold {
    constructor(host, opt = {}) {
      this.host = host; this.opt = opt; this.t = opt.t || 0; this.target = this.t; this.alive = true;
      const W = (this.W = host.clientWidth), H = (this.H = host.clientHeight);
      const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }));
      const pr = () => { const kk = host.getBoundingClientRect().width / (host.clientWidth || 1); return Math.min(3, (window.devicePixelRatio || 1) * Math.max(1, kk)); };
      r.setPixelRatio(pr()); r.setSize(W, H); r.setClearColor(0, 0); r.outputEncoding = THREE.sRGBEncoding;
      this.onResize = () => { r.setPixelRatio(pr()); r.setSize(W, H); }; window.addEventListener("resize", this.onResize); document.addEventListener("fullscreenchange", this.onResize);
      r.domElement.style.cssText = "width:100%;height:100%;display:block;touch-action:none;cursor:grab"; host.appendChild(r.domElement);
      const sc = (this.scene = new THREE.Scene());
      sc.add(new THREE.HemisphereLight(0xffffff, 0x9aa3b0, 0.55));
      this.key = new THREE.DirectionalLight(0xffffff, 0.85); sc.add(this.key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.3); fill.position.set(4, -2, 6); sc.add(fill);
      this.group = new THREE.Group(); sc.add(this.group);
      const lin = Zome3D.parts.lin;
      this.mat = {
        white: new THREE.MeshStandardMaterial({ color: lin(0xd9dce1), roughness: 0.42, metalness: 0.02, side: THREE.DoubleSide }),
        blue: new THREE.MeshStandardMaterial({ color: lin(0x1d6f9e), roughness: 0.32, metalness: 0.05, side: THREE.DoubleSide }),
        green: new THREE.MeshStandardMaterial({ color: lin(0x0f7d30), roughness: 0.32, metalness: 0.05, side: THREE.DoubleSide }),
        orange: new THREE.MeshStandardMaterial({ color: lin(0xffa332), roughness: 0.4, side: THREE.DoubleSide }),
      };
      this.BG = Zome3D.parts.ballGeometry();
      this.cam = new THREE.PerspectiveCamera(18, W / H, 0.5, 2000);
      this.controls = new THREE.OrbitControls(this.cam, r.domElement);
      Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, enableZoom: true, zoomSpeed: 2.4, rotateSpeed: 0.9 });
      r.domElement.addEventListener("pointerdown", () => { r.domElement.style.cursor = "grabbing"; });
      r.domElement.addEventListener("pointerup", () => { r.domElement.style.cursor = "grab"; });
      this.center = V(0, 0, 0);
      this.set(opt.k || 3, opt.n || 3, opt.color || "green", this.t, opt.foldColor);
      let last = performance.now();
      const tick = (now) => {
        if (!this.alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (Math.abs(this.t - this.target) > 1e-4) { this.t += (this.target - this.t) * Math.min(1, dt * 2.6); if (Math.abs(this.t - this.target) < 0.002) this.t = this.target; this.place(); }
        if (this.wiggle) { this.wiggle.u += dt; const u = this.wiggle.u; this.place(Math.sin(u * 14) * 0.05 * Math.max(0, 1 - u / 0.9)); if (u > 0.9) { this.wiggle = null; this.place(); } }
        this.controls.update(); this.key.position.copy(this.cam.position).add(V(-25, 35, 0));
        r.render(sc, this.cam); this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
    /* foldColor: rods fade to this colour as the corner closes (blue triangles shown as the green tet/oct corner) */
    set(k, n, color, t = 0, foldColor = null) {
      this.k = k; this.n = n; this.color = color; this.foldColor = foldColor && foldColor !== color ? foldColor : null; this.t = this.target = t;
      if (this.rodMat) this.rodMat.dispose(); this.rodMat = this.mat[color].clone();
      while (this.group.children.length) { const m = this.group.children.pop(); if (m.geometry !== this.BG) m.geometry.dispose(); if (m.material && m.material.userData.own) m.material.dispose(); }
      const L = LEN()[color], L0 = layout(k, n, 0, L), L1 = layout(k, n, 1, L);
      this.L = L; this.info = L0;
      this.balls = L0.pts.map((_, i) => { const m = new THREE.Mesh(this.BG, i === 0 && this.opt.markApex !== false ? this.mat.orange : this.mat.white); this.group.add(m); return m; });
      this.struts = L0.edges.map(() => { const m = new THREE.Mesh(new THREE.BufferGeometry(), this.rodMat); this.group.add(m); return m; });
      this.fills = L0.faces.map((_, i) => {
        const bad = L0.over && i === n - 1;
        const mm = new THREE.MeshBasicMaterial({ color: bad ? FILL.bad : FILL[color], transparent: true, opacity: bad ? 0.5 : 0.28, side: THREE.DoubleSide, depthWrite: false });
        mm.userData.own = true; const m = new THREE.Mesh(new THREE.BufferGeometry(), mm); m.renderOrder = -1; this.group.add(m); return m;
      });
      /* camera: fit both the flat and the folded layout (each centred, as place() centres them) from a raised angle */
      const cen = (P) => { const c = V(0, 0, 0); P.forEach((p) => c.add(p)); return P.map((p) => p.clone().sub(c.clone().multiplyScalar(1 / P.length))); };
      const all = cen(L0.pts).concat(cen(L1.pts)), fit = this.opt.fit || 0.82;
      const el = ((this.opt.elev ?? 38) * Math.PI) / 180, az = ((this.opt.az ?? 0) * Math.PI) / 180, dir = V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      let d = 100;
      for (let it = 0; it < 6; it++) {
        this.cam.position.copy(dir).multiplyScalar(d); this.cam.lookAt(0, 0, 0); this.cam.updateMatrixWorld(); this.cam.updateProjectionMatrix();
        let m = 0; all.forEach((p) => { const q = p.clone().project(this.cam); m = Math.max(m, Math.abs(q.x), Math.abs(q.y)); });
        const pad = (1.1 / (d * Math.tan((this.cam.fov * Math.PI) / 360))) * Math.max(1, this.W / this.H);
        d *= (m + pad) / fit;
      }
      this.home0 = dir.clone().multiplyScalar(d);
      this.cam.position.copy(this.home0); this.controls.target.set(0, 0, 0); this.controls.minDistance = d * 0.4; this.controls.maxDistance = d * 1.8; this.controls.update();
      this.place();
    }
    place(jiggle = 0) {
      const g = layout(this.k, this.n, Math.max(0, Math.min(1, this.t + jiggle)), this.L), sp = Zome3D.parts.strutGeometry;
      if (jiggle && !g.can) g.pts.forEach((p, i) => { if (i) p.y -= Math.abs(jiggle) * this.L * 0.6; });   // tries to lift, springs back
      const c = V(0, 0, 0); g.pts.forEach((p) => c.add(p)); c.multiplyScalar(1 / g.pts.length); this.center.copy(c);
      const P = g.pts.map((p) => p.clone().sub(this.center));
      const closing = g.can && this.t > 0.995;
      if (this.foldColor) { const u = Math.max(0, Math.min(1, (this.t - 0.55) / 0.4)), e = u * u * (3 - 2 * u);
        this.rodMat.color.copy(this.mat[this.color].color).lerp(this.mat[this.foldColor].color, e);
        this.fills.forEach((m, i) => { if (!(g.over && i === this.n - 1)) m.material.color.setHex(FILL[this.color]).lerp(new THREE.Color(FILL[this.foldColor]), e); }); }
      const lastE = g.edges.find((e) => e[2] === "last"), lastTip = lastE ? lastE[1] : -1;
      this.balls.forEach((m, i) => { m.position.copy(P[i]); m.visible = !(closing && i === lastTip); });
      g.edges.forEach(([a, b, tag], i) => { const m = this.struts[i]; m.geometry.dispose(); m.geometry = sp(P[a], P[b], this.color); m.visible = !(closing && tag === "last"); });
      g.faces.forEach((f, i) => { const pos = []; for (let j = 1; j < f.length - 1; j++) pos.push(...P[f[0]].toArray(), ...P[f[j]].toArray(), ...P[f[j + 1]].toArray());
        const m = this.fills[i]; m.geometry.dispose(); m.geometry = new THREE.BufferGeometry(); m.geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); });
    }
    /* returns "folded" | "flat" | "over" so the page can say what happened */
    fold() { if (this.info.can) { this.target = 1; return "folded"; } this.wiggle = { u: 0 }; return this.info.over ? "over" : "flat"; }
    unfold() { this.target = 0; }
    home() { const p0 = this.cam.position.clone(), p1 = this.home0.clone(), t0 = performance.now(); this.controls.enabled = false;
      const step = (now) => { const u = Math.min(1, (now - t0) / 900), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        const r = p0.length() + (p1.length() - p0.length()) * e; this.cam.position.copy(p0.clone().normalize().lerp(p1.clone().normalize(), e).normalize().multiplyScalar(r)); this.cam.lookAt(0, 0, 0);
        if (u < 1 && this.alive) requestAnimationFrame(step); else { this.controls.enabled = true; this.controls.update(); } };
      requestAnimationFrame(step); }
    dispose() { this.alive = false; cancelAnimationFrame(this.raf); window.removeEventListener("resize", this.onResize); document.removeEventListener("fullscreenchange", this.onResize); this.controls.dispose();
      this.scene.traverse((o) => { if (o.geometry && o.geometry !== this.BG) o.geometry.dispose(); }); this.BG.dispose(); Object.values(this.mat).forEach((m) => m.dispose()); this.rodMat.dispose(); this.fills.forEach((m) => m.material.dispose());
      this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove(); }
  }
  window.ZomeFold = ZomeFold; window.ZomeFold.layout = layout;
})();
