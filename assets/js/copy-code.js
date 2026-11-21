/* ============================================================
   代码块「复制」按钮
   自动给每篇笔记的代码块加上复制功能，不用改 Markdown
   ============================================================ */
(function () {
  var blocks = document.querySelectorAll(".article pre:not(.lineno)");
  if (!blocks.length) return;

  blocks.forEach(function (pre) {
    var wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-copy";
    btn.textContent = "复制";
    wrap.appendChild(btn);

    btn.addEventListener("click", function () {
      var text = pre.textContent.replace(/\s+$/, "");
      copyText(text).then(function () {
        btn.textContent = "已复制";
        btn.classList.add("done");
        clearTimeout(btn._timer);
        btn._timer = setTimeout(function () {
          btn.textContent = "复制";
          btn.classList.remove("done");
        }, 1600);
      });
    });
  });

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        fallback(text);
      });
    }
    fallback(text);
    return Promise.resolve();
  }

  function fallback(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }
})();
