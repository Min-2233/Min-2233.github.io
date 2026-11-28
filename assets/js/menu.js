/* ============================================================
   顶栏导航：三条杠按钮 + 卷帘面板 + 站内搜索
   面板的唯一来源就是这个文件，所以每个页面只需要一行：
     <script src="/assets/js/menu.js" defer></script>
   这样 6 个页面不会各自养一份菜单（以前「改错副本」就是这么来的）
   ============================================================ */
(function () {
  var right = document.querySelector(".topbar-right");
  if (!right) return;
  if (document.getElementById("menuToggle")) return;   /* 已经生成过 */
  var ICON = {
    home: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2.2 6.9 8 2l5.8 4.9"/><path d="M4.1 6.2v7.3h7.8V6.2"/></svg>',
    flag: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.7v12.6"/><path d="M4 2h7.1l-1.7 2.4 1.7 2.4H4"/></svg>',
    map:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1.6 3.4 5.9 2v11.2L1.6 14.6z"/><path d="M5.9 2 10.1 3.4v11.2L5.9 13.2z"/><path d="M10.1 3.4 14.4 2v11.2l-4.3 1.4z"/></svg>',
    gh:   '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>',
    find: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="6.9" cy="6.9" r="4.3"/><path d="M10.2 10.2 14 14"/></svg>'
  };
  function navItem(href, label, icon, extra) {
    return '<a class="menu-item" href="' + href + '"' + (extra || "") + '>' +
             '<span class="mi-icon">' + icon + '</span>' +
             '<span class="mi-text">' + label + '</span>' +
             (extra ? '<span class="mi-tail">↗</span>' : '') +
           '</a>';
  }
  /* ---------- 按钮 ---------- */
  var btn = document.createElement("button");
  btn.className = "btn menu-toggle";
  btn.id = "menuToggle";
  btn.type = "button";
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "siteMenu");
  btn.setAttribute("aria-label", "菜单");
  btn.innerHTML = '<span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>';
  /* ---------- 面板 ---------- */
  var panel = document.createElement("nav");
  panel.className = "menu-panel";
  panel.id = "siteMenu";
  panel.setAttribute("aria-label", "站点导航");
  panel.innerHTML =
    '<label class="menu-search">' +
      '<span class="ms-icon">' + ICON.find + '</span>' +
      '<input id="menuSearch" type="search" placeholder="搜文章：反序列化 / 弱类型" ' +
             'autocomplete="off" autocapitalize="off" spellcheck="false">' +
    '</label>' +
    '<div class="menu-sep" aria-hidden="true"></div>' +
    '<div class="menu-nav">' +
      navItem("/", "首页", ICON.home) +
      navItem("/ctf/web/menu/", "CTF 笔记", ICON.flag) +
      navItem("/map/", "知识地图", ICON.map) +
      navItem("https://github.com/Min-2233", "GitHub", ICON.gh, ' target="_blank" rel="noopener"') +
    '</div>' +
    '<div class="menu-results" id="menuResults" hidden></div>';
  right.appendChild(btn);
  right.appendChild(panel);
  /* ---------- 开关 ---------- */
  var input  = panel.querySelector("#menuSearch");
  var navBox = panel.querySelector(".menu-nav");
  var resBox = panel.querySelector("#menuResults");
  function setOpen(open) {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.classList.toggle("open", open);
  }
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(btn.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("click", function (e) {
    if (panel.classList.contains("open") &&
        !panel.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("open")) setOpen(false);
  });
  /* 只有点到链接才收起：点搜索框不能触发 */
  panel.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });
  /* ---------- 搜索索引（懒加载，第一次输入时才取） ---------- */
  var indexData = null, loading = false, waiters = [];
  function getIndex(cb) {
    if (indexData) return cb(indexData);
    waiters.push(cb);
    if (loading) return;
    loading = true;
    fetch("/search.json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (d) { indexData = Array.isArray(d) ? d : []; })
      .catch(function () { indexData = []; })
      .then(function () {
        loading = false;
        var list = waiters; waiters = [];
        for (var i = 0; i < list.length; i++) list[i](indexData);
      });
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  /* 一次替换所有词，避免二次替换把 <mark> 里的字又包一层 */
  function mark(text, terms) {
    var safe = esc(text);
    if (!terms.length) return safe;
    var re = new RegExp("(" + terms.map(escRe).join("|") + ")", "gi");
    return safe.replace(re, "<mark>$1</mark>");
  }
  function runSearch(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    var out = [];
    for (var i = 0; i < indexData.length; i++) {
      var it = indexData[i];
      var title = String(it.title || "").toLowerCase();
      var body  = String(it.text  || "").toLowerCase();
      var score = 0, ok = true;
      for (var j = 0; j < terms.length; j++) {
        var w = terms[j];
        var inT = title.indexOf(w) > -1, inB = body.indexOf(w) > -1;
        if (!inT && !inB) { ok = false; break; }
        if (inT) score += 10;
        if (inB) score += 1;
      }
      if (ok) out.push({ it: it, s: score });
    }
    out.sort(function (a, b) {
      if (b.s !== a.s) return b.s - a.s;
      return String(b.it.date || "").localeCompare(String(a.it.date || ""));
    });
    return out;
  }
  function show(list, q) {
    if (!q) {
      resBox.hidden = true;
      resBox.innerHTML = "";
      navBox.hidden = false;
      return;
    }
    navBox.hidden = true;
    resBox.hidden = false;
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!list.length) {
      resBox.innerHTML = '<p class="menu-empty">没有匹配的文章</p>';
      return;
    }
    var html = "", n = Math.min(list.length, 8);
    for (var i = 0; i < n; i++) {
      var it = list[i].it;
      html += '<a class="hit' + (i === 0 ? " sel" : "") + '" href="' + esc(it.url) + '">' +
                '<span class="hit-t">' + mark(it.title || it.url, terms) + '</span>' +
                '<span class="hit-m">' + esc(it.cat || "") +
                  (it.date ? ' · <span class="hit-d">' + esc(it.date) + '</span>' : "") + '</span>' +
              '</a>';
    }
    if (list.length > n) html += '<p class="menu-empty">还有 ' + (list.length - n) + ' 篇，再输几个字缩小范围</p>';
    resBox.innerHTML = html;
  }
  var timer = null;
  input.addEventListener("input", function () {
    var q = input.value.trim();
    if (!q) { show([], ""); return; }
    clearTimeout(timer);
    timer = setTimeout(function () {
      getIndex(function () { show(runSearch(q), q); });
    }, 90);
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      if (input.value) { input.value = ""; show([], ""); }
      else setOpen(false);
    } else if (e.key === "Enter") {
      var first = resBox.querySelector("a.hit");
      if (first) { e.preventDefault(); first.click(); }
    }
  });
})();
