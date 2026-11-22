/* ============ 右上角 Menu：点开 / 收起卷帘菜单 ============ */
(function () {
  var btn = document.getElementById("menuToggle");
  var panel = document.getElementById("siteMenu");
  if (!btn || !panel) return;
  function setOpen(open) {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.classList.toggle("open", open);
  }
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(btn.getAttribute("aria-expanded") !== "true");
  });
  /* 点面板外面收起 */
  document.addEventListener("click", function (e) {
    if (panel.classList.contains("open") &&
        !panel.contains(e.target) && !btn.contains(e.target)) {
      setOpen(false);
    }
  });
  /* Esc 收起 */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
  /* 点了里面的链接就收起（跳转前顺手收一下） */
  panel.addEventListener("click", function () { setOpen(false); });
})();
/* ============ 开场打字动画（只在第一次进入时播） ============ */
const SPLASH = {
  text: "min2233",
  startDelay: 500,        // 进入页面后先静 0.5s，再亮光标开始打
  typeSpeed: 85,
  holdBeforeFade: 2000,
  fadeDuration: 380
};
(function () {
  /* 注意：这个 key 必须和 index.html 页头内联脚本里的完全一致，
     否则「本标签页已播过」两边判断不上，回主页会重播一遍 */
  const KEY="min223...seen";
  const typed  = document.getElementById("typed");
  const splash = document.getElementById("splash");
  if (!typed || !splash) return;
  const inner = splash.querySelector(".splash-inner");
  /* ===== 本标签页已经播过：直接进主页，没有任何过渡 ===== */
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === "1"; } catch (e) {}
  if (seen) {
    splash.style.display = "none";
    /* is-ready 现在 home.css 里已经没有对应样式了（淡入已删），
       留着是为了「三个文件分三次提交」时，无论先后顺序都不会白屏 */
    document.body.classList.add("is-ready");
    return;
  }
  // 立刻打标记：即使用户看到一半跳走，回来也不会重播
  try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  let i = 0;
  let done = false;
  function finish() {
    if (done) return;
    done = true;
    typed.textContent = SPLASH.text;
    splash.classList.add("hide");          // 只淡出开场这一层
    document.body.classList.add("is-ready");
    setTimeout(function () { splash.style.display = "none"; }, SPLASH.fadeDuration + 120);
  }
  function tick() {
    if (done) return;
    if (i <= SPLASH.text.length) {
      typed.textContent = SPLASH.text.slice(0, i);
      i++;
      setTimeout(tick, SPLASH.typeSpeed);
    } else {
      setTimeout(finish, SPLASH.holdBeforeFade);
    }
  }
  // 先静 startDelay 毫秒（此间不显示光标），再亮光标 + 开始打字
  setTimeout(function () {
    if (done) return;
    if (inner) inner.classList.add("on");
    tick();
  }, SPLASH.startDelay);
  splash.addEventListener("click", finish);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " " || e.key === "Escape") finish();
  });
  setTimeout(finish, 8000);   // 兜底
})();
