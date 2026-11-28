/* admin.html: শুধু অ্যাডমিন লগইন + স্কুল-থিম ডিজাইন। admin.html-এর একেবারে শেষে (</body>-এর আগে) যুক্ত করুন। */
(function () {
  const q = s => document.querySelector(s);

  // ১) নিবন্ধন ও শিক্ষক অ্যাকাউন্ট তৈরির অংশ সরানো
  ["#tReg", ".tabs-s", "#regNote", "#nmRow"].forEach(s => { const e = q(s); if (e) e.remove(); });
  const add = q("#uAdd"); if (add) add.closest(".box").remove();
  const note = q("#p-users .nolink"); if (note) note.remove();

  // ২) অ্যাডমিন ছাড়া অন্য কেউ ঢুকতে পারবে না
  const original = boot;
  boot = async function () {
    const s = await client.auth.getSession(), u = s.data.session && s.data.session.user;
    if (u) {
      const p = await client.from("profiles").select("role,active").eq("id", u.id).maybeSingle();
      if (!p.error && (!p.data || p.data.role !== "admin" || !p.data.active)) {
        await client.auth.signOut();
        show("login");
        return say(q("#lmsg"), "এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।");
      }
    }
    return original();
  };

  // ৩) ডিজাইন
  const card = q(".login-card");
  if (!card) return;
  card.querySelector("h2").textContent = "অ্যাডমিন লগইন";
  card.querySelector(".sub").textContent = "শুধুমাত্র স্কুল কর্তৃপক্ষের জন্য";

  let windows = "";
  [150, 215, 280, 470, 535, 600].forEach(x => [175, 230].forEach(y => { windows += `<rect x="${x}" y="${y}" width="34" height="34" rx="3" fill="#ffd76a"/>`; }));
  const school = `<svg viewBox="0 0 800 330" aria-hidden="true">
    <rect x="120" y="150" width="560" height="170" fill="#e9eefb"/><rect x="108" y="138" width="584" height="16" fill="#e4572e"/>
    <rect x="320" y="100" width="160" height="220" fill="#fff"/><path d="M305 105 400 40 495 105Z" fill="#e4572e"/>
    <path d="M400 40V5" stroke="#fff" stroke-width="4"/><path d="M402 6h46l-12 11 12 11h-46Z" fill="#f5b301"/>
    <circle cx="400" cy="125" r="22" fill="#0b2a5b"/><path d="M400 111v14l11 7" stroke="#fff" stroke-width="4" fill="none"/>
    <path d="M370 320v-75a30 30 0 0 1 60 0v75Z" fill="#143d85"/>${windows}
    <g fill="#1faa59"><circle cx="65" cy="265" r="42"/><circle cx="735" cy="265" r="42"/></g>
    <path d="M65 280v40M735 280v40" stroke="#8a5a2b" stroke-width="10"/><rect y="318" width="800" height="12" fill="#1faa59"/></svg>`;

  const wrap = q(".login-wrap");
  wrap.insertAdjacentHTML("afterbegin", `<div class="al-hero">
    <span>🎓 ESTD. 2012</span><h1>M K ACADEMY</h1><p>Malancha Krishnanagar Academy<br><b>Education is Wealth</b></p>${school}</div>`);

  document.head.insertAdjacentHTML("beforeend", `<style>
    #v-login{background:radial-gradient(circle at 15% 20%,rgba(255,215,106,.22),transparent 35%),linear-gradient(150deg,#06193d,#0b2a5b 55%,#1e57b8)}
    #v-login .login-wrap{grid-template-columns:1.1fr minmax(0,440px);gap:48px;align-items:center;min-height:80vh}
    .al-hero{text-align:center;color:#fff;min-width:0}
    .al-hero span{color:#ffd76a;font-weight:700;letter-spacing:3px;font-size:.8rem}
    .al-hero h1{font-size:clamp(2rem,4vw,3rem);line-height:1.2;color:#fff}
    .al-hero p{color:#dbe6ff;margin-bottom:18px}.al-hero p b{color:#ffd76a}
    .al-hero svg{width:100%;max-width:560px;display:block;margin:auto}
    #v-login .login-card{width:100%;border-top:6px solid #f5b301}
    #v-login .login-card form{margin-top:18px}
    @media(max-width:860px){#v-login .login-wrap{grid-template-columns:minmax(0,440px);justify-content:center;gap:22px;padding:30px 0}.al-hero svg{max-width:300px}}
  </style>`);
})();
