/* ============================================================
   Web 知识地图 · 布局锁定版
   加载时按「全部展开」量一次尺寸并写死，之后点击不再改变布局
   ============================================================ */
(function () {
  var src    = document.getElementById("tree");
  var out    = document.getElementById("htree");
  var wrap   = document.getElementById("mapWrap");
  var canvas = document.getElementById("mapCanvas");
  if (!src || !out || !wrap || !canvas) return;

  /* ================= 1. 读数据 ================= */
  function readLi(li) {
    var det  = li.querySelector(":scope > details");
    var leaf = li.querySelector(":scope > .leaf");
    var label = "", count = "", kids = [];

    if (det) {
      var t = det.querySelector(":scope > summary > .t");
      var c = det.querySelector(":scope > summary > .cnt");
      var u = det.querySelector(":scope > ul");
      label = t ? t.textContent.trim() : "";
      count = c ? c.textContent.trim() : "";
      if (u) kids = Array.prototype.filter.call(u.children, function (x) {
        return x.tagName === "LI";
      }).map(readLi);
    } else if (leaf) {
      var lt = leaf.querySelector(":scope > .t");
      label = lt ? lt.textContent.trim() : "";
    }
    return { label: label, count: count, kids: kids };
  }

  var rootData = readLi(src.querySelector(":scope > li"));

  /* ================= 2. 构建 ================= */
  var moved = 0;

  function makeLabel(node) {
    var s = document.createElement("span");
    s.className = "label";
    s.textContent = node.label;
    return s;
  }
  function makeCnt(node) {
    if (!node.count) return null;
    var c = document.createElement("span");
    c.className = "cnt";
    c.textContent = node.count;
    return c;
  }

  function toggle(el) {
    el.dataset.open = el.dataset.open === "1" ? "0" : "1";
    var d = el.querySelector(".dot");
    if (d) d.setAttribute("aria-expanded", el.dataset.open === "1");
    /* 只切换显隐，不改任何尺寸 → 不会有跳动 */
  }

  function buildList(node) {
    var el = document.createElement("div");
    el.className = "in-list" + (node.kids.length ? " branch" : " leaf");
    el.dataset.open = "0";

    var self = document.createElement("div");
    self.className = "self";

    var dot = null;
    if (node.kids.length) {
      dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot";
      dot.setAttribute("aria-label", "展开或折叠");
      dot.setAttribute("aria-expanded", "false");
      self.appendChild(dot);
    }

    self.appendChild(makeLabel(node));
    var c = makeCnt(node);
    if (c) self.appendChild(c);
    el.appendChild(self);

    if (node.kids.length) {
      var kids = document.createElement("div");
      kids.className = "kids";
      node.kids.forEach(function (k) { kids.appendChild(buildList(k)); });
      el.appendChild(kids);

      self.addEventListener("click", function () { if (moved > 6) return; toggle(el); });
      dot.addEventListener("click", function (e) { e.stopPropagation(); toggle(el); });
    }
    return el;
  }

  function buildStation(node, index) {
    var dir = index % 2 === 0 ? "down" : "up";
    var st = document.createElement("div");
    st.className = "station " + dir;
    st.dataset.open = "0";

    var up   = document.createElement("div"); up.className = "up";
    var core = document.createElement("div"); core.className = "core";
    var down = document.createElement("div"); down.className = "down";

    var dot = null;
    if (node.kids.length) {
      dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot";
      dot.setAttribute("aria-label", "展开或折叠");
      dot.setAttribute("aria-expanded", "false");
      core.appendChild(dot);
    }
    core.appendChild(makeLabel(node));
    var c = makeCnt(node);
    if (c) core.appendChild(c);

    st.appendChild(up);
    st.appendChild(core);
    st.appendChild(down);

    if (node.kids.length) {
      var kids = document.createElement("div");
      kids.className = "kids";
      node.kids.forEach(function (k) { kids.appendChild(buildList(k)); });
      (dir === "up" ? up : down).appendChild(kids);

      core.addEventListener("click", function () { if (moved > 6) return; toggle(st); });
      dot.addEventListener("click", function (e) { e.stopPropagation(); toggle(st); });
    }
    return st;
  }

  var rootEl = document.createElement("div");
  rootEl.className = "root";
  rootEl.appendChild(makeLabel(rootData));

  var spine = document.createElement("div");
  spine.className = "spine";
  rootData.kids.forEach(function (k, i) { spine.appendChild(buildStation(k, i)); });

  out.appendChild(rootEl);
  out.appendChild(spine);
  src.style.display = "none";

  /* ================= 3. 锁定布局 ================= */
  function lockLayout() {
    var stations = Array.prototype.slice.call(
      spine.querySelectorAll(":scope > .station")
    );
    var lists = Array.prototype.slice.call(spine.querySelectorAll(".in-list"));

    /* 全部展开后再量 */
    stations.forEach(function (s) { s.dataset.open = "1"; });
    lists.forEach(function (s) { s.dataset.open = "1"; });

    /* ① 量高度：直接量子树的 .kids，不能用容器的 scrollHeight
       （容器高度 0 且子元素向上溢出时，scrollHeight 会返回 0） */
    var maxUp = 0, maxDown = 0;
    stations.forEach(function (st) {
      var upKids   = st.querySelector(":scope > .up > .kids");
      var downKids = st.querySelector(":scope > .down > .kids");
      if (upKids)   maxUp   = Math.max(maxUp, upKids.offsetHeight);
      if (downKids) maxDown = Math.max(maxDown, downKids.offsetHeight);
    });
    out.style.setProperty("--up", maxUp + "px");
    out.style.setProperty("--down", maxDown + "px");

    /* ② 高度定好后，量每个站点的自然宽度（先读全部，再统一写） */
    var widths = stations.map(function (st) { return st.offsetWidth; });
    stations.forEach(function (st, i) {
      st.style.width = widths[i] + "px";
    });

    /* 收回 */
    stations.forEach(function (s) { s.dataset.open = "0"; });
    lists.forEach(function (s) { s.dataset.open = "0"; });
  }
  lockLayout();

  function limits() {
    var w = wrap.clientWidth, h = wrap.clientHeight;
    var cw = canvas.offsetWidth, ch = canvas.offsetHeight;
    return {
      minX: Math.min(w - cw - MARGIN, MARGIN),
      maxX: Math.max(w - cw - MARGIN, MARGIN),
      minY: Math.min(h - ch - MARGIN, MARGIN),
      maxY: Math.max(h - ch - MARGIN, MARGIN)
    };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function clampTarget() {
    var L = limits();
    target.x = clamp(target.x, L.minX, L.maxX);
    target.y = clamp(target.y, L.minY, L.maxY);
  }
  function rubber(v, a, b) {
    if (v < a) return a - Math.min(MAX_OUT, (a - v) * RUBBER);
    if (v > b) return b + Math.min(MAX_OUT, (v - b) * RUBBER);
    return v;
  }
  function render() {
    var L = limits();
    canvas.style.transform =
      "translate3d(" + rubber(cur.x, L.minX, L.maxX) + "px," +
                        rubber(cur.y, L.minY, L.maxY) + "px,0)";
  }

  /* 初始：主线落在视口垂直中心 */
  function centerOnSpine() {
    var core = out.querySelector(".station > .core");
    var h = wrap.clientHeight;
    var y = canvas.offsetHeight / 2;

    if (core) {
      var acc = 0, n = core;
      while (n && n !== canvas) { acc += n.offsetTop; n = n.offsetParent; }
      y = acc + core.offsetHeight / 2;
    }
    target.x = MARGIN;
    target.y = h / 2 - y;
    clampTarget();
    cur.x = target.x;
    cur.y = target.y;
  }

  /* 滚轮：左右平移 */
  wrap.addEventListener("wheel", function (e) {
    e.preventDefault();
    if (e.shiftKey) target.y -= e.deltaY;
    else target.x -= (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY);
    clampTarget();
  }, { passive: false });

  /* 左键拖拽 */
  wrap.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    if (e.target.closest(".dot")) return;
    dragging = true; moved = 0;
    wrap.classList.add("dragging");
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    vx = vy = 0;
    try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
  });

  wrap.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    target.x += dx;
    target.y += dy;

    var now = performance.now();
    var dt = Math.max(1, now - lastT);
    lastT = now;
    vx = dx / dt * 16;
    vy = dy / dt * 16;
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove("dragging");
    clampTarget();
    vx = clamp(vx * 0.5, -30, 30);
    vy = clamp(vy * 0.5, -30, 30);
  }
  wrap.addEventListener("pointerup", endDrag);
  wrap.addEventListener("pointercancel", endDrag);

  wrap.addEventListener("dblclick", function (e) {
    if (e.target.closest(".dot")) return;
    centerOnSpine();
  });

  /* ================= 5. 循环 ================= */
  function tick() {
    if (!dragging && (vx || vy)) {
      target.x += vx; target.y += vy;
      vx *= 0.92; vy *= 0.92;
      if (Math.abs(vx) < 0.05) vx = 0;
      if (Math.abs(vy) < 0.05) vy = 0;
    }
    var ease = dragging ? 0.55 : 0.12;
    cur.x += (target.x - cur.x) * ease;
    cur.y += (target.y - cur.y) * ease;
    render();
    requestAnimationFrame(tick);
  }

  centerOnSpine();
  requestAnimationFrame(tick);
  window.addEventListener("resize", clampTarget);
})();
