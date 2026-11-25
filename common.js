/* ===== ওয়েবসাইট সেটিংস (এখানে বদলালেই সব পেজে বদলে যাবে) ===== */
const SCHOOL = {
  name: "M K ACADEMY",
  short: "MK",
  tagline: "EDUCATION IS WEALTH",
  address: "Malancha (Near Bharagachi High School), Samsherganj, Murshidabad",
  phone: "7001310351",
  phone2: "9475769100",
  reg: "IV-120100204/2026",
  udise: "19072200805",
  // (পুরোনো পদ্ধতি) Google Sheet-এর Apps Script URL। Supabase চালু থাকলে এটা লাগবে না।
  SCRIPT_URL: ""
};

/* ===== লগইন ও ডাটাবেস (Supabase) — config.js ফাইলে URL ও KEY বসাতে হবে ===== */
// SUPABASE_URL ও SUPABASE_KEY এখন config.js ফাইলে আছে

let sb = null;
const dbReady = new Promise(res => {
  if (!SUPABASE_URL || !SUPABASE_KEY) { res(null); return; }
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
  s.onload = () => { try { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); res(sb); } catch (e) { res(null); } };
  s.onerror = () => res(null);
  document.head.appendChild(s);
});

const pages = [
  ["index.html", "হোম"],
  ["about.html", "আমাদের সম্পর্কে"],
  ["teachers.html", "শিক্ষকবৃন্দ"],
  ["gallery.html", "গ্যালারি"],
  ["contact.html", "Contact Us"],
  ["admission.html", "অনলাইন ভর্তি", "cta"]
];
const curPage = location.pathname.split("/").pop() || "index.html";

function buildChrome() {
  document.querySelectorAll(".topbar,header.site,footer.site,.wa").forEach(e => e.remove());
  document.body.insertAdjacentHTML("afterbegin", `
<div class="topbar"><div class="container">
  <span>📍 ${SCHOOL.address}</span>
  <span>📞 <b>${SCHOOL.phone}</b> / <b>${SCHOOL.phone2}</b></span>
</div></div>
<header class="site"><div class="container nav">
  <a href="index.html" class="brand">
    <img class="logo-img" src="images/logo.png" alt="M K Academy logo">
    <div><h1>${SCHOOL.name}</h1><small>${SCHOOL.tagline}</small></div>
  </a>
  <button class="burger" aria-label="menu" onclick="document.getElementById('menu').classList.toggle('open')">☰</button>
  <ul class="menu" id="menu">
    ${pages.map(p => `<li><a href="${p[0]}" class="${p[2] || ""} ${curPage === p[0] ? "active" : ""}">${p[1]}</a></li>`).join("")}
  </ul>
</div></header>`);

  document.body.insertAdjacentHTML("beforeend", `
<footer class="site"><div class="container">
  <div class="f-grid">
    <div>
      <div class="brand" style="margin-bottom:14px"><img class="logo-img" src="images/logo.png" alt="M K Academy logo">
      <div><h1 style="color:#fff">${SCHOOL.name}</h1></div></div>
      <p>Malancha Krishnanagar Academy — ২০১২ সাল থেকে নার্সারি থেকে দ্বাদশ শ্রেণি পর্যন্ত মান-সম্মত শিক্ষার এক বিশ্বস্ত প্রতিষ্ঠান।</p>
    </div>
    <div><h4>দ্রুত লিংক</h4><ul>
      ${pages.map(p => `<li><a href="${p[0]}">› ${p[1]}</a></li>`).join("")}
    </ul></div>
    <div><h4>যোগাযোগ</h4><ul>
      <li>📍 ${SCHOOL.address}</li>
      <li>📞 <a href="tel:+91${SCHOOL.phone}">${SCHOOL.phone}</a> / <a href="tel:+91${SCHOOL.phone2}">${SCHOOL.phone2}</a></li>
      <li>💬 <a href="https://wa.me/91${SCHOOL.phone}" target="_blank">WhatsApp এ মেসেজ করুন</a></li>
      <li>🆔 Reg No: ${SCHOOL.reg}</li>
      <li>🏷️ UDISE+: ${SCHOOL.udise}</li>
    </ul></div>
  </div>
  <div class="copy">© ${new Date().getFullYear()} ${SCHOOL.name}. সর্বস্বত্ব সংরক্ষিত।<br><span class="credit">Design By - <b>Md Badiujjaman</b></span><br><a class="adm-link" href="admin.html">🔒 অ্যাডমিন / শিক্ষক লগইন</a></div>
</div></footer>
<a class="wa" href="https://wa.me/91${SCHOOL.phone}" target="_blank" aria-label="WhatsApp">💬</a>`);
}
buildChrome();

// scroll reveal
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); }), { threshold: .12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

// অ্যাডমিন প্যানেল থেকে বদলানো সেটিংস (ফোন, ঠিকানা, পরিসংখ্যান ইত্যাদি)
let SETTINGS = {};
const settingsReady = dbReady.then(async c => {
  if (!c) return SETTINGS;
  try {
    const r = await c.from("settings").select("*");
    if (r.data && r.data.length) {
      r.data.forEach(x => { SETTINGS[x.key] = x.value; });
      ["phone", "phone2", "address", "reg", "udise"].forEach(k => { if (SETTINGS[k]) SCHOOL[k] = SETTINGS[k]; });
      buildChrome();
    }
  } catch (e) { /* ডিফল্ট তথ্য থাকবে */ }
  return SETTINGS;
});
