/* ===== Admission popup (home page). Edit the text below; set LAST_DATE e.g. "31 December 2026" ===== */
(function () {
  const LAST_DATE = "";
  const now = new Date();
  const SESSION = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear(); // same rule as admission.html

  const css = `
  .adm-pop{position:fixed;inset:0;margin:auto;width:min(620px,calc(100% - 28px));max-height:calc(100dvh - 28px);padding:0;border:0;border-radius:20px;overflow:auto;background:#fff;color:#1c2433;font-family:'Poppins',sans-serif;line-height:1.5;box-shadow:0 30px 80px rgba(0,0,0,.45)}
  .adm-pop::backdrop{background:rgba(6,18,42,.72);backdrop-filter:blur(3px)}
  .adm-pop[open]{animation:admIn .35s ease-out}
  @keyframes admIn{from{opacity:0;transform:translateY(24px) scale(.96)}}
  .adm-top{display:flex;align-items:center;gap:16px;padding:20px 56px 20px 22px;background:linear-gradient(135deg,#0b2a5b,#143d85);color:#fff;border-bottom:4px solid #f5b301}
  .adm-top img{width:70px;height:70px;object-fit:contain;background:#fff;border-radius:14px;padding:5px;flex:none}
  .adm-top small{display:block;color:#ffd76a;font-size:11px;font-weight:700;letter-spacing:2px}
  .adm-top span{display:block;font-size:14px;color:#dbe6ff}
  .adm-top h2{margin:0;font-size:26px;line-height:1.2;font-weight:800;color:#fff}
  .adm-x{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;font-size:22px;line-height:1;cursor:pointer}
  .adm-body{text-align:center;padding:24px 22px 20px;background:linear-gradient(180deg,#fff8e6,#fff 60%)}
  .adm-badge{display:inline-block;background:#ffd76a;color:#5a3d00;font-size:12px;font-weight:700;letter-spacing:3px;padding:7px 18px;border-radius:30px}
  .adm-body h3{margin:16px 0 8px;font-size:22px;line-height:1.35;color:#0b2a5b;font-weight:800}
  .adm-body p{margin:0;color:#5d6b82;font-size:14px}
  .adm-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:16px 0}
  .adm-chips b{font-size:12px;font-weight:600;color:#143d85;background:#eef3ff;border:1px solid #d5e0fa;border-radius:8px;padding:6px 11px}
  .adm-btns{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
  .adm-btns a{padding:13px 28px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none}
  .adm-apply{background:linear-gradient(135deg,#f5b301,#ffd76a);color:#0b2a5b;box-shadow:0 8px 20px rgba(245,179,1,.4)}
  .adm-call{border:2px solid #0b2a5b;color:#0b2a5b}
  .adm-body .adm-note{margin-top:16px;font-size:12px}
  @media(max-width:480px){.adm-top img{width:54px;height:54px}.adm-top h2{font-size:20px}.adm-body h3{font-size:18px}.adm-btns a{width:100%}}
  @media(prefers-reduced-motion:reduce){.adm-pop[open]{animation:none}}`;

  document.head.insertAdjacentHTML("beforeend", "<style>" + css + "</style>");
  document.body.insertAdjacentHTML("beforeend", `
  <dialog class="adm-pop" id="admPop" lang="en" aria-labelledby="admTitle">
    <div class="adm-top">
      <img src="images/logo.png" alt="M K Academy logo">
      <div><small>ONLINE APPLICATION NOW OPEN</small><span>Admissions at</span><h2 id="admTitle">M K ACADEMY</h2></div>
    </div>
    <button class="adm-x" type="button" aria-label="Close">×</button>
    <div class="adm-body">
      <div class="adm-badge">APPLICATIONS NOW OPEN</div>
      <h3>ONLINE ADMISSION FOR SESSION ${SESSION}<br>NURSERY TO CLASS XII</h3>
      <p>${LAST_DATE ? "The last date to apply is <strong>" + LAST_DATE + "</strong>." : "Apply from home in a few easy steps. Print your application and submit it at the school with the original documents."}</p>
      <div class="adm-chips"><b>✓ Experienced Teachers</b><b>✓ Safe Campus</b><b>✓ Individual Attention</b></div>
      <div class="adm-btns">
        <a class="adm-apply" href="admission.html">Apply Online →</a>
        <a class="adm-call" href="tel:+917001310351">Call 7001310351</a>
      </div>
      <p class="adm-note">Please keep the birth certificate and guardian's mobile number ready before applying.</p>
    </div>
  </dialog>`);

  const pop = document.getElementById("admPop");
  pop.querySelector(".adm-x").onclick = () => pop.close();
  pop.addEventListener("click", e => { if (e.target === pop) pop.close(); });
  setTimeout(() => pop.showModal(), 600);
})();
