/* Q 版碳原子的“手”：手臂由程序画出，按立体方向转动、投影。
   用来演示“手和手，离得越远越好”：2 只手分到两边，3 只手平平地分成 120°，4 只手从平平的十字挤成三角锥。 */
(function () {
  "use strict";
  const N = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const flat = (deg) => deg.map((d) => [Math.cos((d * Math.PI) / 180), 0, -Math.sin((d * Math.PI) / 180)]);
  const scr = (deg) => deg.map((d) => [Math.cos((d * Math.PI) / 180), Math.sin((d * Math.PI) / 180), 0]);
  const t = Math.acos(-1 / 3), s = Math.sin(t), c = Math.cos(t);
  const CONF = {
    two0: scr([15, 45]), two: scr([0, 180]),
    three0: scr([0, 180, 150]), three: scr([330, 210, 90]),
    cross: [[0, 0, 0], ...flat([90, 0, 180, 270])].slice(1),
    tet: [[0, 1, 0], [s * Math.cos(0), c, -s * Math.sin(0)], [s * Math.cos(2.0944), c, -s * Math.sin(2.0944)], [s * Math.cos(4.1888), c, -s * Math.sin(4.1888)]],
  };
  CONF.cross = flat([90, 0, 180, 270]); // the orange hand (index 0) points away, all four lie flat
  function mount(host, opt) {
    const W = host.clientWidth, H = host.clientHeight, B = opt.size || 300, ox = W / 2, oy = H / 2 + (opt.dy || 0), R = B * (opt.reach || 0.92);
    host.innerHTML = `<svg class="arms back" viewBox="0 0 ${W} ${H}"></svg><img class="arm-body" src="${opt.body}" alt="碳原子卡通形象" style="left:${ox - B / 2}px;top:${oy - B * (opt.bodyY || 0.385)}px;width:${B}px;height:${B}px"><svg class="arms front" viewBox="0 0 ${W} ${H}"></svg>`;
    const back = host.querySelector(".back"), front = host.querySelector(".front");
    const cols = opt.colors || [];
    let arms = (CONF[opt.start] || CONF.two0).map((d, i) => ({ d: N(d), t: N(d), s: 1, col: cols[i] || "#f4f5f8" }));
    let yaw = opt.yaw0 || 0.35, spin = opt.spin == null ? 0.25 : opt.spin, alive = true, raf = 0, last = performance.now();
    const el = ((opt.elev == null ? 22 : opt.elev) * Math.PI) / 180;
    let drag = null;
    host.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, yaw }; host.setPointerCapture(e.pointerId); });
    host.addEventListener("pointermove", (e) => { if (drag) yaw = drag.yaw + (e.clientX - drag.x) * 0.012; });
    host.addEventListener("pointerup", () => { drag = null; });
    function proj(d) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw); const x = d[0] * cy + d[2] * sy, z0 = -d[0] * sy + d[2] * cy, y = d[1];
      const y2 = y * Math.cos(el) - z0 * Math.sin(el), z2 = y * Math.sin(el) + z0 * Math.cos(el);
      return [x, y2, z2];
    }
    function armSVG(a) {
      const [x, y, z] = proj(a.d), k = a.s, ex = ox + x * R * k, ey = oy - y * R * k, mx = ox + x * R * k * 0.55, my = oy - y * R * k * 0.55 + 6 * k;
      const shade = z < 0 ? 0.82 : 1, gr = B * 0.12 * (1 + 0.18 * z) * k, w = B * 0.1 * (1 + 0.12 * z);
      const arm = `<path d="M${ox} ${oy} Q${mx} ${my} ${ex} ${ey}" stroke="rgb(${88 * shade},${92 * shade},${102 * shade})" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
      const glove = `<circle cx="${ex}" cy="${ey}" r="${gr}" fill="${a.col}" style="filter:brightness(${shade})"/><circle cx="${ex - gr * 0.3}" cy="${ey - gr * 0.35}" r="${gr * 0.35}" fill="#fff" opacity=".55"/>`;
      return { z, svg: arm + glove };
    }
    function draw() {
      const parts = arms.map(armSVG).sort((p, q) => p.z - q.z);
      back.innerHTML = parts.filter((p) => p.z < 0.25).map((p) => p.svg).join("");
      front.innerHTML = parts.filter((p) => p.z >= 0.25).map((p) => p.svg).join("");
    }
    function tick(now) {
      if (!alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!drag) yaw += spin * dt;
      arms.forEach((a) => { a.d = N(a.d.map((v, i) => v + (a.t[i] - v) * Math.min(1, dt * 3.2))); a.s += (1 - a.s) * Math.min(1, dt * 6); });
      draw(); raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return {
      set(name) { const C = CONF[name]; while (arms.length < C.length) { const i = arms.length; const from = arms.length ? arms[arms.length - 1].d.slice() : C[i]; arms.push({ d: N(from), t: N(C[i]), s: 0.2, col: cols[i] || "#f4f5f8" }); } arms.length = C.length; arms.forEach((a, i) => (a.t = N(C[i]))); },
      add(name) { this.set(name); },
      dispose() { alive = false; cancelAnimationFrame(raf); host.innerHTML = ""; },
    };
  }
  window.ArmView = { mount };
})();
