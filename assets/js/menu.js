/* ============================================================
   顶栏导航：三条杠按钮 + 卷帘面板 + 站内搜索（只搜标题）
   面板的唯一来源就是这个文件，所以每个页面只需要一行：
     <script src="/assets/js/menu.js" defer></script>
   ============================================================ */
/* 触屏标记：以前只有加载 copy-code.js 的笔记页才会加，
   导致列表/菜单页点按钮后 :hover 的右移和高亮粘住不放。
   放到这里，所有页面都有了。 */
window.addEventListener("touchstart", function () {
  document.documentElement.classList.add("touch");
}, { once: true, passive: true });
(function () {
  var right = document.querySelector(".topbar-right");
  if (!right) return;
  if (document.getElementById("menuToggle")) return;   /* 已经生成过 */
  var ICON = {
    home: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M2.2 6.9 8 2l5.8 4.9"/><path d="M4.1 6.2v7.3h7.8V6.2"/></svg>',
    flag: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.7v12.6"/><path d="M4 2h7.1l-1.7 2.4 1.7 2.4H4"/></svg>',
    map:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M1.6 3.4 5.9 2v11.2L1.6 14.6z"/><path d="M5.9 2 10.1 3.4v11.2L5.9 13.2z"/><path d="M10.1 3.4 14.4 2v11.2l-4.3 1.4z"/></svg>',
    cup:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M5.2 2.3h5.6v4.1a2.8 2.8 0 0 1-5.6 0z"/><path d="M5.2 3.3H3.4v1.3a2.1 2.1 0 0 0 1.9 2.1"/><path d="M10.8 3.3h1.8v1.3a2.1 2.1 0 0 1-1.9 2.1"/><path d="M8 9.4v2.5"/><path d="M5.7 13.7h4.6"/></svg>',
    find: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="6.9" cy="6.9" r="4.3"/><path d="M10.2 10.2 14 14"/></svg>'
  };
  function navItem(href, label, icon) {
    return '<a class="menu-item" href="' + href + '">' +
             '<span class="mi-icon">' + icon + '</span>' +
             '<span class="mi-text">' + label + '</span>' +
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
    '<div class="menu-search">' +
      '<span class="ms-icon">' + ICON.find + '</span>' +
      '<input id="menuSearch" type="search" placeholder="搜标题，回车确认" ' +
             'autocomplete="off" autocapitalize="off" spellcheck="false">' +
      '<button class="ms-go" id="menuSearchGo" type="button" aria-label="搜索">↵</button>' +
    '</div>' +
    '<div class="menu-sep" aria-hidden="true"></div>' +
    '<div class="menu-nav">' +
      navItem("/", "首页", ICON.home) +
      navItem("/ctf/web/menu/", "CTF 笔记", ICON.flag) +
      navItem("/map/", "知识地图", ICON.map) +
    '</div>' +
    '<div class="menu-results" id="menuResults" hidden></div>' +
    '<a class="menu-extra" href="/achievements/" aria-label="成就" title="成就">' + ICON.cup + '</a>';
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
  /* ---------- 搜索索引（懒加载，只在第一次搜索时取） ---------- */
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
  /* 只匹配标题：以前连正文一起搜，「个」「好」这种字命中一大堆，没意义 */
  function runSearch(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    var out = [];
    for (var i = 0; i < indexData.length; i++) {
      var it = indexData[i];
      var title = String(it.title || "").toLowerCase();
      var ok = true;
      for (var j = 0; j < terms.length; j++) {
        if (title.indexOf(terms[j]) < 0) { ok = false; break; }
      }
      if (ok) out.push(it);
    }
    var ql = q.toLowerCase();
    out.sort(function (a, b) {
      var sa = String(a.title || "").toLowerCase().indexOf(ql) === 0 ? 0 : 1;
      var sb = String(b.title || "").toLowerCase().indexOf(ql) === 0 ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return String(b.date || "").localeCompare(String(a.date || ""));
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
      resBox.innerHTML = '<p class="menu-empty">没有匹配的标题</p>';
      return;
    }
    var html = "", n = Math.min(list.length, 8);
    for (var i = 0; i < n; i++) {
      var it = list[i];
      html += '<a class="hit' + (i === 0 ? " sel" : "") + '" href="' + esc(it.url) + '">' +
                '<span class="hit-t">' + mark(it.title || it.url, terms) + '</span>' +
                '<span class="hit-m">' + esc(it.cat || "") +
                  (it.date ? ' · <span class="hit-d">' + esc(it.date) + '</span>' : "") + '</span>' +
              '</a>';
    }
    if (list.length > n) html += '<p class="menu-empty">还有 ' + (list.length - n) + ' 篇，再输几个字缩小范围</p>';
    resBox.innerHTML = html;
  }
  /* 按回车（或点 ↵）才搜，输入过程中不发请求、不出结果 */
  function doSearch() {
    var q = input.value.trim();
    if (!q) { show([], ""); return; }
    getIndex(function () { show(runSearch(q), q); });
  }
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      doSearch();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      if (input.value) { input.value = ""; show([], ""); }
      else setOpen(false);
    }
  });
  var goBtn = panel.querySelector("#menuSearchGo");
  if (goBtn) {
    goBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      doSearch();
    });
  }
})();
