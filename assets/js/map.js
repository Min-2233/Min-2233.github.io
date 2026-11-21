/* ============================================================
   Web 知识地图
   一级分支横向排成脊线，子树从站点垂下；可拖拽平移
   ============================================================ */
(function () {
  var src    = document.getElementById("tree");
  var out    = document.getElementById("htree");
  var wrap   = document.getElementById("mapWrap");
  var canvas = document.getElementById("mapCanvas");
  if (!src || !out || !wrap || !canvas) return;

  /* ---------- 读数据 ---------- */
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

  var roots = Array.prototype.filter.call(src.children, function (x) {
    return x.tagName === "LI";
  }).map(readLi);

  /* ---------- 通用 ---------- */
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
  function setOpen(el, open) {
    el.dataset.open = open ? "1" : "0";
    var d = el.querySelector(":scope > .self > .dot");
    if (d) d.setAttribute("aria-expanded", open ? "true" : "false");
  }
  function toggle(el) {
    setOpen(el, el.dataset.open !== "1");
    clampTarget();
  }

  /* ---------- 竖直列表（第 2 层往下） ---------- */
  function buildList(node) {
    var el = document.createElement("div");
    el.className = "in-list" + (node.kids.length ? " branch" : " leaf");

    var self = document.createElement("div");
    self.className = "self";
    self.appendChild(makeLabel(node));
    var c = makeCnt(node);
    if (c) self.appendChild(c);
    el.appendChild(self);

    if (node.kids.length) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot";
      dot.setAttribute("aria-label", "展开或折叠");
      self.appendChild(dot);

      var kids = document.createElement("div");
      kids.className = "kids";
      node.kids.forEach(function (k) { kids.appendChild(buildList(k)); });
      el.appendChild(kids);

      setOpen(el, false);
      self.addEventListener("click", function () {
        if (moved > 6) return;
        toggle(el);
      });
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
        toggle(el);
      });
    }
    return el;
  }

  /* ---------- 脊线 ---------- */
  function buildSpine(rootData) {
    var root = document.createElement("div");
    root.className = "root";

    var rs = document.createElement("div");
    rs.className = "self";
    rs.appendChild(makeLabel(rootData));
    root.appendChild(rs);

    var spine = document.createElement("div");
    spine.className = "kids-spine";

    rootData.kids.forEach(function (child) {
      var st = document.createElement("div");
      st.className = "on-spine" + (child.kids.length ? " branch" : " leaf");

      var self = document.createElement("div");
      self.className = "self";

      var dot = null;
      if (child.kids.length) {
        dot = document.createElement("button");
        dot.type = "button";
        dot.className = "dot";
        dot.setAttribute("aria-label", "展开或折叠");
        self.appendChild(dot);
      }

      self.appendChild(makeLabel(child));
      var cc = makeCnt(child);
      if (cc) self.appendChild(cc);
      st.appendChild(self);

      if (child.kids.length) {
        var kids = document.createElement("div");
        kids.className = "kids";
        child.kids.forEach(function (k) { kids.appendChild(buildList(k)); });
        st.appendChild(kids);

        setOpen(st, false);          // 默认全部折叠，只显示 8 个站点
        self.addEventListener("click", function () {
          if (moved > 6) return;
          toggle(st);
        });
        dot.addEventListener("click", function (e) {
          e.stopPropagation();
          toggle(st);
        });
      }

      spine.appendChild(st);
    });

    root.appendChild(spine);
    return root;
  }

  out.appendChild(buildSpine(roots[0]));
  src.style.display = "none";

  /* ---------- 平移 ---------- */
  var cur = { x: 0, y: 0 };
  var target = { x: 0, y: 0 };
  var vx = 0, vy = 0;
  var dragging = false, moved = 0;
  var lastX = 0, lastY = 0, lastT = 0;
  var PAD = 70;

  function bounds() {
    var w = wrap.clientWidth, h = wrap.clientHeight;
    var cw = canvas.offsetWidth, ch = canvas.offsetHeight;
    return {
      minX: Math.min(PAD, w - cw - PAD),
      maxX: PAD,
      minY: Math.min(PAD, h - ch - PAD),
      maxY: PAD
    };
  }
  function clampTarget() {
    var b = bounds();
    target.x = Math.max(b.minX, Math.min(b.maxX, target.x));
    target.y = Math.max(b.minY, Math.min(b.maxY, target.y));
  }
  function centerView() {
    var h = wrap.clientHeight, ch = canvas.offsetHeight;
    target.x = PAD;
    target.y = ch < h ? (h - ch) / 2 : PAD;
    clampTarget();
  }

  wrap.addEventListener("wheel", function (e) {
    e.preventDefault();
    if (e.shiftKey) target.y -= e.deltaY;
    else target.x -= (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY);
    clampTarget();
  }, { passive: false });

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
    target.x += dx; target.y += dy;
    clampTarget();
    var now = performance.now(), dt = Math.max(1, now - lastT);
    lastT = now;
    vx = dx / dt * 16; vy = dy / dt * 16;
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove("dragging");
    vx = Math.max(-45, Math.min(45, vx));
    vy = Math.max(-45, Math.min(45, vy));
  }
  wrap.addEventListener("pointerup", endDrag);
  wrap.addEventListener("pointercancel", endDrag);

  wrap.addEventListener("dblclick", function (e) {
    if (e.target.closest(".dot")) return;
    centerView();
  });

  function tick() {
    if (!dragging && (vx || vy)) {
      target.x += vx; target.y += vy;
      vx *= 0.92; vy *= 0.92;
      if (Math.abs(vx) < 0.06) vx = 0;
      if (Math.abs(vy) < 0.06) vy = 0;
      clampTarget();
    }
    var ease = dragging ? 0.42 : 0.18;
    cur.x += (target.x - cur.x) * ease;
    cur.y += (target.y - cur.y) * ease;
    canvas.style.transform = "translate3d(" + cur.x + "px," + cur.y + "px,0)";
    requestAnimationFrame(tick);
  }

  centerView();
  cur.x = target.x; cur.y = target.y;
  requestAnimationFrame(tick);
  window.addEventListener("resize", clampTarget);
})();
