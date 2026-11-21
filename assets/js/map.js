/* ============================================================
   Web 知识地图
   1. 把竖排 <details> 树读成数据
   2. 重新渲染成横向树
   3. 左键拖拽空白处平移 + 滚轮横向浏览 + 惯性缓动
   ============================================================ */
(function () {
  var src    = document.getElementById("tree");
  var out    = document.getElementById("htree");
  var wrap   = document.getElementById("mapWrap");
  var canvas = document.getElementById("mapCanvas");
  if (!src || !out || !wrap || !canvas) return;

  /* ---------- 1. 读数据 ---------- */
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
      if (u) {
        kids = Array.prototype.filter.call(u.children, function (x) {
          return x.tagName === "LI";
        }).map(readLi);
      }
    } else if (leaf) {
      var lt = leaf.querySelector(":scope > .t");
      label = lt ? lt.textContent.trim() : "";
    }
    return { label: label, count: count, kids: kids };
  }

  var roots = Array.prototype.filter.call(src.children, function (x) {
    return x.tagName === "LI";
  }).map(readLi);

  /* ---------- 2. 渲染 ---------- */
  function setOpen(el, open) {
    el.dataset.open = open ? "1" : "0";
    var d = el.querySelector(":scope > .self > .dot");
    if (d) d.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function toggle(el) {
    setOpen(el, el.dataset.open !== "1");
    clampTarget();
  }

  function build(node, depth) {
    var el = document.createElement("div");
    el.className = "node" + (node.kids.length ? " branch" : " leaf");
    el.dataset.depth = depth;

    var self = document.createElement("div");
    self.className = "self";

    var lab = document.createElement("span");
    lab.className = "label";
    lab.textContent = node.label;
    self.appendChild(lab);

    if (node.count) {
      var cnt = document.createElement("span");
      cnt.className = "cnt";
      cnt.textContent = node.count;
      self.appendChild(cnt);
    }
    el.appendChild(self);

    if (node.kids.length) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot";
      dot.setAttribute("aria-label", "展开或折叠");
      self.appendChild(dot);

      var kids = document.createElement("div");
      kids.className = "kids";
      node.kids.forEach(function (k) {
        kids.appendChild(build(k, depth + 1));
      });
      el.appendChild(kids);

      setOpen(el, depth === 0);        // 默认只展开根节点

      self.addEventListener("click", function () {
        if (moved > 6) return;         // 拖拽时不算点击
        toggle(el);
      });
      dot.addEventListener("click", function (e) {
        e.stopPropagation();
        toggle(el);
      });
    }
    return el;
  }

  roots.forEach(function (r) { out.appendChild(build(r, 0)); });
  src.style.display = "none";

  /* ---------- 3. 平移 ---------- */
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
    var w = wrap.clientWidth, h = wrap.clientHeight;
    var cw = canvas.offsetWidth, ch = canvas.offsetHeight;
    target.x = PAD;
    target.y = ch < h ? (h - ch) / 2 : PAD;
    clampTarget();
  }

  /* 滚轮：纵向滚动 → 左右移动 */
  wrap.addEventListener("wheel", function (e) {
    e.preventDefault();
    if (e.shiftKey) {
      target.y -= e.deltaY;
    } else {
      target.x -= (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY);
    }
    clampTarget();
  }, { passive: false });

  /* 左键拖拽空白处 */
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
    clampTarget();

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
    vx = Math.max(-45, Math.min(45, vx));
    vy = Math.max(-45, Math.min(45, vy));
  }
  wrap.addEventListener("pointerup", endDrag);
  wrap.addEventListener("pointercancel", endDrag);

  /* 双击空白：回到初始视图 */
  wrap.addEventListener("dblclick", function (e) {
    if (e.target.closest(".dot")) return;
    centerView();
  });

  /* ---------- 4. 缓动循环 ---------- */
  function tick() {
    if (!dragging) {
      if (vx || vy) {
        target.x += vx;
        target.y += vy;
        vx *= 0.92;
        vy *= 0.92;
        if (Math.abs(vx) < 0.06) vx = 0;
        if (Math.abs(vy) < 0.06) vy = 0;
        clampTarget();
      }
    }
    var ease = dragging ? 0.42 : 0.18;   // 拖拽跟手，松手后缓慢收尾
    cur.x += (target.x - cur.x) * ease;
    cur.y += (target.y - cur.y) * ease;
    canvas.style.transform = "translate3d(" + cur.x + "px," + cur.y + "px,0)";
    requestAnimationFrame(tick);
  }

  centerView();
  cur.x = target.x;
  cur.y = target.y;
  requestAnimationFrame(tick);

  window.addEventListener("resize", clampTarget);
})();
