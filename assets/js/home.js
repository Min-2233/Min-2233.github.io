/* ============================================================
   开场动画参数：只改这里就行
   ============================================================ */
const SPLASH = {
  text: "min2233 blog",   // 开场逐字打出来的文字
  typeSpeed: 85,          // 每个字的间隔（ms）
  holdBeforeFade: 480,    // 打完停留多久再淡出（ms）
  fadeDuration: 800       // 淡出时长，需与 CSS 里 #splash 的 transition 一致
};

(function () {
  const typed  = document.getElementById("typed");
  const splash = document.getElementById("splash");
  const body   = document.body;
  if (!typed || !splash) return;

  let i = 0;
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    typed.textContent = SPLASH.text;
    splash.classList.add("hide");
    body.classList.add("is-ready");
    setTimeout(() => { splash.style.display = "none"; }, SPLASH.fadeDuration + 120);
  }

  function tick() {
    if (done) return;
    if (i <= SPLASH.text.length) {
      typed.textContent = SPLASH.text.slice(0, i);
      i += 1;
      setTimeout(tick, SPLASH.typeSpeed);
    } else {
      setTimeout(finish, SPLASH.holdBeforeFade);
    }
  }

  // 点击 / 回车 / 空格 可跳过
  splash.addEventListener("click", finish);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Escape") finish();
  });

  setTimeout(tick, 220);
})();
