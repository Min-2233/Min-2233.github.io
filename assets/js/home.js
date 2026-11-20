const SPLASH = {
  text: "min2233",
  typeSpeed: 85,
  holdBeforeFade: 2000,
  fadeDuration: 380
};

(function () {
  const KEY = "min2233-splash-seen";

  const typed  = document.getElementById("typed");
  const splash = document.getElementById("splash");
  const body   = document.body;
  if (!typed || !splash) return;

  /* ===== 新增：本标签页已经播过就直接进主页 ===== */
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === "1"; } catch (e) {}

  if (seen) {
    splash.style.display = "none";
    body.classList.add("is-ready");
    return;
  }

  // 立刻打标记：即使用户看到一半跳走，回来也不会重播
  try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  /* ===== 新增结束 ===== */

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
      i++;
      setTimeout(tick, SPLASH.typeSpeed);
    } else {
      setTimeout(finish, SPLASH.holdBeforeFade);
    }
  }

  setTimeout(tick, 220);
  splash.addEventListener("click", finish);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Escape") finish();
  });

  setTimeout(finish, 8000);   // 兜底
})();
