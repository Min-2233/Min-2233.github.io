<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>min2233 blog</title>
<style>
  :root{
    --bg:#0b0b0d;
    --panel:#141417;
    --line:#232327;
    --text:#e6e6e8;
    --muted:#8b8b93;
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0}
  body{
    background:var(--bg);
    color:var(--text);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  a{color:inherit;text-decoration:none}

  /* ===== 开场：打字动画 ===== */
  #splash{
    position:fixed;inset:0;z-index:99;
    display:flex;align-items:center;justify-content:center;
    background:var(--bg);
    transition:opacity .8s ease;
  }
  #splash.hide{opacity:0;pointer-events:none}
  #splash .text{
    font-size:clamp(20px,4vw,32px);
    letter-spacing:.14em;
    font-weight:300;
    color:#d8d8dc;
  }
  #splash .caret{
    display:inline-block;width:2px;height:1em;margin-left:2px;
    background:#d8d8dc;vertical-align:-.12em;
    animation:blink 1s steps(1) infinite;
  }
  @keyframes blink{50%{opacity:0}}

  /* ===== 主页面 ===== */
  #main{
    opacity:0;
    transition:opacity .8s ease;
    max-width:860px;
    margin:0 auto;
    padding:0 20px 64px;
  }
  #main.show{opacity:1}

  /* 背景板（换成自己的图见注释） */
  .banner{
    position:relative;
    height:220px;
    margin:0 -20px;
    border-radius:0 0 14px 14px;
    border-bottom:1px solid var(--line);
    background:
      url("https://picsum.photos/seed/min2233/1600/500") center/cover no-repeat,
      radial-gradient(900px 320px at 20% 0%, #1c1c22 0%, #101014 55%, #0b0b0d 100%);
  }
  .banner::after{
    content:"";position:absolute;inset:0;
    border-radius:0 0 14px 14px;
    background:linear-gradient(180deg,rgba(11,11,13,.15) 0%,rgba(11,11,13,.78) 100%);
  }

  /* 头像 + 名字 */
  .profile{
    position:relative;z-index:2;
    display:flex;align-items:flex-end;gap:16px;
    margin-top:-46px;padding:0 8px;
  }
  .avatar{
    flex:0 0 auto;
    width:92px;height:92px;
    border-radius:50%;
    border:3px solid var(--bg);
    background:#1b1b20;
    overflow:hidden;
  }
  .avatar img,.avatar svg{width:100%;height:100%;display:block}
  .who{padding-bottom:6px}
  .who .name{margin:0 0 4px;font-size:20px;font-weight:600;letter-spacing:.02em}
  .who .bio{margin:0;font-size:13px;color:var(--muted)}

  /* 小按钮 */
  .links{display:flex;flex-wrap:wrap;gap:10px;margin:26px 0 0}
  .btn{
    display:inline-flex;align-items:center;gap:6px;
    padding:7px 14px;font-size:13px;
    color:#cfcfd6;background:#16161a;
    border:1px solid var(--line);border-radius:8px;
    transition:.18s ease;
  }
  .btn:hover{background:#1d1d22;border-color:#3a3a44;color:#fff;transform:translateY(-1px)}

  /* 内容区 */
  .section{margin-top:40px;padding-top:20px;border-top:1px solid var(--line)}
  .section h2{
    margin:0 0 14px;font-size:12px;font-weight:500;
    letter-spacing:.14em;color:var(--muted);text-transform:uppercase;
  }
  .note-card{
    display:flex;justify-content:space-between;align-items:center;
    padding:14px 16px;font-size:14px;
    background:var(--panel);border:1px solid var(--line);border-radius:10px;
    transition:.18s ease;
  }
  .note-card:hover{background:#17171b;border-color:#3a3a44}
  .note-card .arrow{font-size:12px;color:var(--muted)}

  @media (max-width:520px){
    .banner{height:170px}
    .avatar{width:76px;height:76px}
    .profile{margin-top:-38px}
  }
</style>
<noscript>
  <style>#main{opacity:1} #splash{display:none}</style>
</noscript>
</head>
<body>

<div id="splash">
  <div><span class="text" id="typed"></span><span class="caret"></span></div>
</div>

<div id="main">

  <div class="banner"></div>

  <header class="profile">
    <div class="avatar">
      <!-- 换头像：把整段 <svg> 替换成 <img src="avatar.png" alt="avatar"> -->
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#202027"/>
        <circle cx="35" cy="38" r="6" fill="#e6e6e8"/>
        <circle cx="65" cy="38" r="6" fill="#e6e6e8"/>
        <path d="M30 60 Q50 80 70 60" stroke="#e6e6e8" stroke-width="6"
              fill="none" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="who">
      <p class="name">min2233</p>
      <p class="bio">CTF · Web Security</p>
    </div>
  </header>

  <nav class="links">
    <a class="btn" href="./ctf/web/">Web 笔记</a>
    <a class="btn" href="https://github.com/Min-2233">GitHub</a>
  </nav>

  <section class="section">
    <h2>Notes</h2>
    <a class="note-card" href="./ctf/web/">
      <span>Web 安全笔记</span>
      <span class="arrow">→</span>
    </a>
  </section>

</div>

<script>
(function () {
  var text   = "min2233 blog";
  var typed  = document.getElementById("typed");
  var splash = document.getElementById("splash");
  var main   = document.getElementById("main");
  var i = 0;

  function finish() {
    splash.classList.add("hide");
    main.classList.add("show");
    setTimeout(function () { splash.style.display = "none"; }, 900);
  }

  function type() {
    if (i <= text.length) {
      typed.textContent = text.slice(0, i);
      i++;
      setTimeout(type, 90);
    } else {
      setTimeout(finish, 550);
    }
  }

  splash.addEventListener("click", function () {
    typed.textContent = text;
    finish();
  });

  setTimeout(type, 250);
})();
</script>

</body>
</html>
