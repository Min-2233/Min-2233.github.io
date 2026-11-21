/* ============================================================
   Web 知识地图
   上下交替分支 · 脊线居中 · 自由拖动 · 滚轮缩放 · 边界回弹
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
    var d = el.querySelector(":scope > .self > .dot, :scope > .core > .dot");
    if (d) d.setAttribute("aria-expanded", el.dataset.open === "1");
    relayout();
    clampTarget();
  }

  /* 竖向列表节点（第 2 层往下） */
  function buildList(node) {
    var el = document.createElement("div");
    el.className = "in-list" + (node.kids.length ? " branch" : " leaf");
    el.dataset.open = "0";

    var self = document.createElement("div");
    self.className = "self";

    if (node.kids.length) {
      var dot = document.createElement("button");
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
      self.querySelector(".dot").addEventListener("click", function (e) {
        e.stopPropagation();
        toggle(el);
      });
    }
    return el;
  }

  /* 脊线上的站点（一级分支） */
  function buildStation(node, index) {
    var dir = index % 2 === 0 ? "down" : "up";   // 交替上下
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
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
        toggle(st);
      });
    }
    return st;
  }

  var rootEl = document.createElement("div");
  rootEl.className = "root";
  rootEl.appendChild(makeLabel(rootData));

  var spine = document.createElement("div");
  spine.className = "spine";
  rootData.kids.forEach(function (k, i) {
    spine.appendChild(buildStation(k, i));
  });

  out.appendChild(rootEl);
  out.appendChild(spine);
  src.style.display = "none";

  /* ================= 3. 上/下区等高 ================= */
  function relayout() {
    spine.style.removeProperty("--h");
    var max = 0;
    Array.prototype.forEach.call(spine.querySelectorAll(".station"), function (st) {
      ["up", "down"].forEach(function (k) {
        var el = st.querySelector(":scope > ." + k);
        if (el) max = Math.max(max, el.scrollHeight);
      });
    });
    spine.style.setProperty("--h", max + "px");
  }
  relayout();

  /* ================= 4. 平移 / 缩放 ================= */
  var scale = 1;
  var MIN_S = 0.35, MAX_S = 2.6;

  var cur = { x: 0, y: 0 };
  var target = { x: 0, y: 0 };
  var vx = 0, vy = 0;

  var dragging = false;
  var lastX = 0, lastY = 0, lastT = 0;

  var MARGIN = 90;      // 内容外可留白
  var RUBBER = 0.28;    // 越界阻尼（越小越硬）
  var MAX_OUT = 140;    // 最多能拖出去多少

  function limits() {
    var w = wrap.clientWidth, h = wrap.clientHeight;
    var cw = canvas.offsetWidth * scale;
    var ch = canvas.offsetHeight * scale;
    var ax = w - cw - MARGIN, bx = MARGIN;   // 允许范围两端
    var ay = h - ch - MARGIN, by = MARGIN;
    return {
      minX: Math.min(ax, bx), maxX: Math.max(ax, bx),
      minY: Math.min(ay, by), maxY: Math.max(ay, by)
    };
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function clampTarget() {
    var L = limits();
    target.x = clamp(target.x, L.minX, L.maxX);
    target.y = clamp(target.y, L.minY, L.maxY);
  }

  /* 越界阻尼：拖出去只能看到一小截，且有上限 */
  function rubber(v, a, b) {
    if (v < a) return a - Math.min(MAX_OUT, (a - v) * RUBBER);
    if (v > b) return b + Math.min(MAX_OUT, (v - b) * RUBBER);
    return v;
  }

  function render() {
    var L = limits();
    var rx = rubber(cur.x, L.minX, L.maxX);
    var ry = rubber(cur.y, L.minY, L.maxY);
    canvas.style.transform =
      "translate3d(" + rx + "px," + ry + "px,0) scale(" + scale + ")";
  }

  /* 初始：让脊线落在视口垂直中心 */
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

  /* ---- 滚轮缩放（以鼠标为中心） ---- */
  wrap.addEventListener("wheel", function (e) {
    e.preventDefault();
    var old = scale;
    var next = clamp(old * Math.exp(-e.deltaY * 0.0016), MIN_S, MAX_S);
    if (next === old) return;

    var r = wrap.getBoundingClientRect();
    var px = e.clientX - r.left;
    var py = e.clientY - r.top;

    target.x = px - (px - target.x) * (next / old);
    target.y = py - (py - target.y) * (next / old);
    scale = next;

    clampTarget();
  }, { passive: false });

  /* ---- 左键拖拽 ---- */
  wrap.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    if (e.target.closest(".dot")) return;
    dragging = true;
    moved = 0;
    wrap.classList.add("dragging");
    lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    vx = vy = 0;
    try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
  });

  wrap.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX;
    var dy = e.clientY - lastY;
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

    // 关键：松手后把目标拉回范围内，视觉上的越界由缓动弹回
    clampTarget();

    vx = clamp(vx * 0.5, -30, 30);
    vy = clamp(vy * 0.5, -30, 30);
  }
  wrap.addEventListener("pointerup", endDrag);
  wrap.addEventListener("pointercancel", endDrag);

  /* ---- 双击回到初始 ---- */
  wrap.addEventListener("dblclick", function (e) {
    if (e.target.closest(".dot")) return;
    centerOnSpine();
  });

  /* ================= 5. 动画循环 ================= */
  function tick() {
    if (!dragging && (vx || vy)) {
      target.x += vx;
      target.y += vy;
      vx *= 0.92;
      vy *= 0.92;
      if (Math.abs(vx) < 0.05) vx = 0;
      if (Math.abs(vy) < 0.05) vy = 0;
    }

    // 拖拽时跟手，松手后慢一点收尾 —— 这就是"弹"的手感
    var ease = dragging ? 0.55 : 0.15;
    cur.x += (target.x - cur.x) * ease;
    cur.y += (target.y - cur.y) * ease;

    render();
    requestAnimationFrame(tick);
  }

  centerOnSpine();
  requestAnimationFrame(tick);
  window.addEventListener("resize", function () { restrict(); });
  function restrict() { clampTarget(); relayout(); }
})();
