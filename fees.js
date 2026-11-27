/* ===== ফি কাঠামো: তথ্য + সুন্দর টেবিল (fees.html, index.html ও admin.html-এ ব্যবহার হয়) ===== */
const FEES = (() => {
  const R = (c, a, m, da, mt, et, l, t) => ({ c, a, m, da, mt, et, l, t });
  const DEFAULT = {
    year: "2026",
    note: "দূরবর্তী ছাত্র-ছাত্রীদের জন্য গাড়ি ভাড়া মাসিক ৬০০ টাকা।",
    rows: [
      R("LKG", 2500, 450, null, null, null, null, null),
      R("UKG", 2500, 450, null, null, null, null, null),
      R("I", 2600, 480, 4000, 400, 300, 1500, 2680),
      R("II", 2700, 500, 4000, 400, 300, 1500, 2700),
      R("III", 2800, 550, 4000, 400, 300, 1520, 2750),
      R("IV", 2800, 550, 4000, 400, 300, 1520, 2750),
      R("V", 1700, 600, 5000, 450, 350, 1600, 2800),
      R("VI", 1700, 630, 5000, 450, 350, 1600, 2830),
      R("VII", 1800, 650, 5000, 450, 350, 1600, 2850),
      R("VIII", 1800, 680, 5000, 450, 350, 1600, 2880),
      R("IX", 1900, 700, 5500, 500, 400, 1700, 2900),
      R("X", 2000, 750, 5500, 500, 400, 1700, 2950)
    ]
  };
  const get = () => { try { if (typeof SETTINGS !== "undefined" && SETTINGS.fees) { const d = JSON.parse(SETTINGS.fees); if (d && d.rows && d.rows.length) return d; } } catch (_) {} return JSON.parse(JSON.stringify(DEFAULT)); };
  const has = v => v !== null && v !== undefined && v !== "" && !isNaN(v);
  const money = v => has(v) ? "₹" + Number(v).toLocaleString("en-IN") : "—";
  const label = c => /^(LKG|UKG|NURSERY|KG)$/i.test(c) ? c : "Class " + c;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  let styled = false;
  function css() {
    if (styled) return; styled = true;
    const s = document.createElement("style");
    s.textContent = `
.fee-box{max-width:1000px;margin:0 auto}
.fee-tabs{display:flex;gap:8px;justify-content:center;background:#eaf0fc;border-radius:60px;padding:6px;width:max-content;max-width:100%;margin:0 auto 22px}
.fee-tabs button{border:0;background:none;padding:12px 26px;border-radius:50px;font:600 .98rem inherit;font-family:inherit;color:var(--navy);cursor:pointer;transition:.25s}
.fee-tabs button.on{background:var(--navy);color:#fff;box-shadow:0 8px 20px rgba(11,42,91,.3)}
.fee-card{background:#fff;border-radius:22px;box-shadow:var(--shadow);overflow:hidden;border:1px solid #e3ebfb}
.fee-card .ft{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:16px 22px;background:linear-gradient(120deg,var(--navy),#1e57b8);color:#fff}
.fee-card .ft b{font-size:1.08rem}.fee-card .ft span{background:var(--gold);color:var(--navy);font-weight:700;font-size:.82rem;padding:4px 14px;border-radius:50px}
.fee-tbl{width:100%;border-collapse:collapse}
.fee-tbl th{background:#f1f5fd;color:var(--navy);font-size:.84rem;text-transform:none;padding:13px 12px;text-align:center;border-bottom:2px solid #dbe6fb}
.fee-tbl td{padding:13px 12px;text-align:center;border-bottom:1px solid #eef2fa;font-weight:500;color:var(--ink)}
.fee-tbl tr:nth-child(even) td{background:#fafcff}
.fee-tbl tr:hover td{background:#fff8e1}
.fee-tbl td.cl{font-weight:700;color:var(--navy);text-align:left;padding-left:22px}
.fee-tbl td.cl i{font-style:normal;display:inline-block;min-width:78px;background:#eaf0fc;border-radius:10px;padding:4px 12px;text-align:center}
.fee-tbl th:first-child{text-align:left;padding-left:22px}
.fee-tbl td.hi{font-weight:800;color:#0a7c3c;background:#f0fbf4!important}
.fee-tbl th.hi{background:#dff5e8;color:#0a7c3c}
.fee-note{margin:18px auto 0;max-width:1000px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.fee-note div{background:#fff;border-radius:16px;padding:14px 18px;box-shadow:var(--shadow);font-size:.92rem;color:var(--muted);border-left:5px solid var(--gold)}
.fee-note b{color:var(--navy);display:block;margin-bottom:2px}
@media(max-width:700px){
 .fee-tabs button{padding:10px 14px;font-size:.88rem}
 .fee-tbl thead{display:none}
 .fee-tbl,.fee-tbl tbody,.fee-tbl tr,.fee-tbl td{display:block;width:100%}
 .fee-tbl tr{padding:12px 16px;border-bottom:8px solid #f1f5fd}
 .fee-tbl td{display:flex;justify-content:space-between;text-align:right;padding:7px 0;border:0;background:none!important}
 .fee-tbl td::before{content:attr(data-l);color:var(--muted);font-weight:500}
 .fee-tbl td.cl{padding:0 0 8px;justify-content:flex-start}.fee-tbl td.cl::before{content:none}
 .fee-tbl td.hi{border-top:1px dashed #cfe9d9!important;margin-top:4px;padding-top:9px}
}`;
    document.head.appendChild(s);
  }

  /* el: ভেতরে বসানোর বক্স; mode: "an" বা "db" */
  function render(el, mode) {
    css(); const d = get(); mode = mode || "an";
    const anRows = d.rows.filter(r => has(r.a) || has(r.m)), dbRows = d.rows.filter(r => has(r.da));
    const an = `<table class="fee-tbl"><thead><tr><th>শ্রেণি</th><th>ভর্তি ফি</th><th class="hi">মাসিক স্কুল ফি</th></tr></thead><tbody>
      ${anRows.map(r => `<tr><td class="cl"><i>${esc(label(r.c))}</i></td><td data-l="ভর্তি ফি">${money(r.a)}</td><td class="hi" data-l="মাসিক স্কুল ফি">${money(r.m)}</td></tr>`).join("")}</tbody></table>`;
    const db = `<table class="fee-tbl"><thead><tr><th>শ্রেণি</th><th>ভর্তি ফি</th><th>সকালের টিউশন</th><th>বিকালের টিউশন</th><th>লাঞ্চ ফি</th><th class="hi">মাসিক মোট</th></tr></thead><tbody>
      ${dbRows.map(r => `<tr><td class="cl"><i>${esc(label(r.c))}</i></td><td data-l="ভর্তি ফি">${money(r.da)}</td><td data-l="সকালের টিউশন">${money(r.mt)}</td><td data-l="বিকালের টিউশন">${money(r.et)}</td><td data-l="লাঞ্চ ফি">${money(r.l)}</td><td class="hi" data-l="মাসিক মোট">${money(r.t)}</td></tr>`).join("")}</tbody></table>`;
    el.innerHTML = `<div class="fee-box"><div class="fee-tabs"><button data-m="an" class="${mode === "an" ? "on" : ""}">🏫 অনাবাসিক</button><button data-m="db" class="${mode === "db" ? "on" : ""}">🍱 ডে-বোর্ডিং (খাবার সহ)</button></div>
      <div class="fee-card"><div class="ft"><b>${mode === "an" ? "অনাবাসিক — ভর্তি ও মাসিক ফি" : "ডে-বোর্ডিং — ভর্তি ও মাসিক ফি"}</b><span>শিক্ষাবর্ষ ${esc(d.year)}</span></div>
      <div style="overflow-x:auto">${mode === "an" ? an : db}</div></div>
      <div class="fee-note">
        ${mode === "db" ? '<div><b>ডে-বোর্ডিং কী কী নিয়ে?</b>সকাল ও বিকালের টিউশন, দুপুরের খাবার ও স্কুলের পড়াশোনা। (LKG, UKG-তে ডে-বোর্ডিং নেই।)</div>' : '<div><b>অনাবাসিক</b>শুধু স্কুলের পড়াশোনা। ভর্তির সময় একবারই ভর্তি ফি দিতে হয়।</div>'}
        ${d.note ? `<div><b>🚌 অন্যান্য তথ্য</b>${esc(d.note)}</div>` : ""}
        <div><b>📞 বিস্তারিত জানতে</b>${typeof SCHOOL !== "undefined" ? esc(SCHOOL.phone) + " / " + esc(SCHOOL.phone2) : ""}। ফি পরিবর্তন হতে পারে, অনুগ্রহ করে স্কুল অফিসে নিশ্চিত হয়ে নিন।</div>
      </div></div>`;
    el.querySelectorAll(".fee-tabs button").forEach(b => b.onclick = () => render(el, b.dataset.m));
  }
  return { DEFAULT, get, render, money, has, label };
})();
