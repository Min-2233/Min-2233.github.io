/* ============================================================
   代码块「复制」按钮
   自动给每篇笔记的代码块加上复制功能，不用改 Markdown
   电脑：鼠标移入代码块 → 按钮出现（原样不变）
   手机：长按代码块 1.5 秒 → 按钮出现，2 秒内没点它自己消失
   ============================================================ */
(function () {
  var blocks = document.querySelectorAll(".article pre:not(.lineno)");
  if (!blocks.length) return;
  /* 用「第一次触摸」来认定触屏，比 matchMedia("(hover:none)") 可靠 */
  window.addEventListener("touchstart", function () {
    document.documentElement.classList.add("touch");
  }, { once: true, passive: true });
  var LONG_PRESS = 1500;   /* 长按多久出现 */
  var STAY       = 2000;   /* 出现后多久自动消失 */
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
      clearTimeout(wrap._hide);
      var text = pre.textContent.replace(/\s+$/, "");
      copyText(text).then(function () {
        btn.textContent = "已复制";
        btn.classList.add("done");
        clearTimeout(btn._timer);
        btn._timer = setTimeout(function () {
          btn.textContent = "复制";
          btn.classList.remove("done");
          wrap.classList.remove("show");     /* 复制完自己也收起来 */
        }, 1600);
      });
    });
    /* ---------- 触屏长按：每个代码块各算各的，互不影响 ---------- */
    var pressTimer = null;
    function cancelPress() {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    pre.addEventListener("touchstart", function () {
      cancelPress();
      pressTimer = setTimeout(function () {
        wrap.classList.add("show");
        clearTimeout(wrap._hide);
        wrap._hide = setTimeout(function () {
          wrap.classList.remove("show");
        }, STAY);
      }, LONG_PRESS);
    }, { passive: true });
    pre.addEventListener("touchend", cancelPress);
    pre.addEventListener("touchcancel", cancelPress);
    pre.addEventListener("touchmove", cancelPress);
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
