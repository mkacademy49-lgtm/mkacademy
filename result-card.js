/* ===== ফলাফল / প্রগ্রেস রিপোর্ট: হিসাব ও কার্ডের নকশা (results.html ও admin.html দুটোতেই ব্যবহার হয়) ===== */
const RC = (() => {
  const CLASSES = ["Nursery","KG","1","2","3","4","5","6","7","8","9","10"];
  const ROMAN = {"1":"I","2":"II","3":"III","4":"IV","5":"V","6":"VI","7":"VII","8":"VIII","9":"IX","10":"X"};
  const clsLabel = c => ROMAN[c] || c;
  const clsBn = c => (ROMAN[c] ? "ক্লাস " + ROMAN[c] : c);
  const MAIN = [40,10,40,10,80,20], PE = [25,0,25,0,50,0];
  const mk = list => list.map(n => ({ n, m: /^(P\.E|W\.E)$/.test(n) ? PE.slice() : MAIN.slice() }));
  const DEFAULTS = {
    "Nursery": mk(["BENGALI","ENGLISH","MATHEMATICS","EVS","DRAWING"]),
    "KG": mk(["BENGALI","ENGLISH","MATHEMATICS","EVS","DRAWING"]),
    "1": mk(["BENGALI","ENGLISH","MATHEMATICS","EVS","P.E","W.E"]),
    "2": mk(["BENGALI","ENGLISH","MATHEMATICS","EVS","P.E","W.E"]),
    "3": mk(["BENGALI","ENGLISH","MATHEMATICS","EVS","P.E","W.E"]),
    "4": mk(["BENGALI","ENGLISH","MATHEMATICS","EVS","P.E","W.E"]),
    "5": mk(["BENGALI","ENGLISH","MATHEMATICS","EVS","P.E","W.E"]),
    "6": mk(["BENGALI","MATHEMATICS","ENGLISH","GEOGRAPHY","HISTORY","EVS","P.E","W.E"]),
    "7": mk(["BENGALI","MATHEMATICS","ENGLISH","GEOGRAPHY","HISTORY","SCIENCE","P.E","W.E"]),
    "8": mk(["BENGALI","MATHEMATICS","ENGLISH","GEOGRAPHY","HISTORY","SCIENCE","P.E","W.E"]),
    "9": mk(["BENGALI","ENGLISH","MATHEMATICS","PHYSICAL SCIENCE","LIFE SCIENCE","GEOGRAPHY","HISTORY","P.E","W.E"]),
    "10": mk(["BENGALI","ENGLISH","MATHEMATICS","PHYSICAL SCIENCE","LIFE SCIENCE","GEOGRAPHY","HISTORY","P.E","W.E"])
  };
  /* settings টেবিলের result_subjects (JSON) থাকলে সেটা, না থাকলে ডিফল্ট */
  const subjectsFor = (cfg, cls) => ((cfg && cfg[cls]) || DEFAULTS[cls] || DEFAULTS["6"]).map(s => ({ n: s.n, m: s.m.slice() }));
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const GR = [[90,"A+","Outstanding"],[80,"A","Excellent"],[70,"B+","Very Good"],[60,"B","Good"],[50,"C+","Satisfactory"],[40,"C","Marginal"],[0,"D","Disqualified"]];
  const grade = p => { for (const g of GR) if (p >= g[0]) return { g: g[1], r: g[2] }; return { g: "D", r: "Disqualified" }; };
  const num = v => { if (v === "" || v == null) return null; const n = Number(v); return isFinite(n) ? n : null; };
  const filled = v => v !== "" && v != null && (String(v).toUpperCase() === "AB" || num(v) !== null);
  const fmt = x => +(+x).toFixed(2);

  /* marks: [{n, m:[6], v:[6]}]  →  সব হিসাব */
  function calc(marks) {
    const subs = (marks || []).map(s => {
      let obt = 0, max = 0; const t = [[0,0],[0,0],[0,0]];
      for (let i = 0; i < 6; i++) {
        const mx = Number(s.m[i]) || 0, v = (s.v || [])[i];
        if (mx > 0 && filled(v)) { const o = num(v) || 0; obt += o; max += mx; t[i >> 1][0] += o; t[i >> 1][1] += mx; }
      }
      const p = max ? obt / max * 100 : 0;
      return { n: s.n, m: s.m, v: s.v || [], obt, max, pct: p, grade: max ? grade(p).g : "", t };
    });
    const tm = [0,1,2].map(k => { const o = subs.reduce((a, s) => a + s.t[k][0], 0), m = subs.reduce((a, s) => a + s.t[k][1], 0), p = m ? o / m * 100 : 0; return { o, m, p, g: m ? grade(p).g : "" }; });
    const col = [0,1,2,3,4,5].map(i => ({ m: subs.reduce((a, s) => a + (filled(s.v[i]) ? Number(s.m[i]) || 0 : 0), 0), o: subs.reduce((a, s) => a + (filled(s.v[i]) ? num(s.v[i]) || 0 : 0), 0), show: subs.some(s => (Number(s.m[i]) || 0) > 0) }));
    const O = subs.reduce((a, s) => a + s.obt, 0), M = subs.reduce((a, s) => a + s.max, 0), P = M ? O / M * 100 : 0, G = grade(P);
    return { subs, tm, col, O, M, P, G: M ? G.g : "-", remark: M ? G.r : "-", result: M ? (P >= 40 ? "Pass" : "Fail") : "-" };
  }

  /* একই শ্রেণি-সেকশনের সবার মোট নম্বর দেখে র‍্যাঙ্ক (সমান নম্বরে সমান র‍্যাঙ্ক) */
  function ranks(list) {
    const tot = list.map(r => ({ id: r.id, o: calc(r.marks).O }));
    const out = {}; tot.forEach(a => { out[a.id] = 1 + tot.filter(b => b.o > a.o).length; }); return out;
  }

  const e = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const dmy = d => { if (!d) return ""; const p = String(d).slice(0, 10).split("-"); return p.length === 3 ? p[2] + "-" + p[1] + "-" + p[0] : d; };

  let styled = false;
  function css() {
    if (styled) return; styled = true;
    const s = document.createElement("style");
    s.textContent = `
.rc{position:relative;background:#fff;color:#111;font-family:Arial,"Hind Siliguri",sans-serif;font-size:12px;border:3px solid #0b2a5b;border-radius:6px;padding:14px 16px 12px;max-width:820px;margin:0 auto;overflow:hidden;box-sizing:border-box}
.rc *{box-sizing:border-box}
.rc .wm{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;opacity:.07;color:#0b2a5b;font-weight:700;letter-spacing:2px;line-height:1.55;font-size:13px;word-break:break-all;text-transform:uppercase}
.rc .wm i{position:absolute;left:50%;top:50%;width:230px;height:230px;margin:-115px 0 0 -115px;background:url(images/logo.png) center/contain no-repeat;opacity:.9}
.rc>*:not(.wm){position:relative;z-index:1}
.rc .hd{display:flex;align-items:center;gap:12px;border-bottom:2px solid #f5b301;padding-bottom:8px}
.rc .hd img.lg{width:74px;height:74px;object-fit:contain;flex:none}
.rc .hd .ph{width:74px;height:84px;object-fit:cover;border:1px solid #0b2a5b;border-radius:4px;flex:none;background:#eef3fd}
.rc .hd .mid{flex:1;text-align:center}
.rc .hd h1{margin:0;font-family:Georgia,"Times New Roman",serif;font-size:25px;color:#0b2a5b;letter-spacing:.5px;line-height:1.1}
.rc .hd .tg{font-size:10.5px;color:#555;margin-top:3px}
.rc .hd .ad{font-size:11px;color:#333;margin-top:2px}
.rc .hd .rg{font-size:10px;color:#555;margin-top:2px}
.rc .ttl{margin:9px auto 5px;width:max-content;max-width:100%;border:2px solid #0b2a5b;border-radius:14px;padding:3px 22px;font-size:16px;font-weight:700;color:#0b2a5b;background:#fff}
.rc .nm{text-align:center;font-weight:700;font-size:15px;letter-spacing:.5px;margin-bottom:6px}
.rc .info{display:grid;grid-template-columns:1fr 1fr;gap:3px 22px;margin-bottom:8px}
.rc .info div{display:flex;gap:6px}.rc .info b{min-width:92px;font-weight:600;color:#222}.rc .info span{color:#0b57b3;font-weight:700;text-transform:uppercase}
.rc .sec{border:2px solid #1c8fd6;text-align:center;font-weight:700;font-size:13px;padding:2px;margin:6px 0 0;background:#fff;color:#0b2a5b}
.rc table{border-collapse:collapse;width:100%}
.rc table.m th,.rc table.m td{border:1px solid #222;padding:2px 3px;text-align:center;font-size:11px}
.rc table.m td.s{text-align:left;padding-left:5px;font-weight:600}
.rc table.m th{font-weight:700;background:rgba(11,42,91,.06)}
.rc table.m tr.tt td{font-weight:700}
.rc .box3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
.rc .box3 .b{border:2px solid #1c8fd6;border-radius:6px;display:flex;justify-content:space-between;align-items:center;padding:4px 8px;font-family:Georgia,serif;font-size:14px;font-weight:700}
.rc .box3 .b span{font-weight:400;font-family:inherit}
.rc .box3 .b.c{display:block;text-align:center;padding:3px 6px}.rc .box3 .b.c small{display:block;font-family:Arial,sans-serif;font-weight:600;font-size:13px;margin-top:2px}
.rc .att{margin-top:8px;font-size:10px}.rc .att h4{text-align:center;margin:0 0 2px;font-weight:600;font-size:12px;font-family:Georgia,serif}
.rc .att td,.rc .att th{border:1px solid #222;padding:2px;text-align:center;font-size:10px}
.rc .pd{margin-top:8px}.rc .pd h4{text-align:center;margin:0 0 2px;font-weight:600;font-size:12px;font-family:Georgia,serif}
.rc .pd td{border:1px solid #222;padding:2px;text-align:center;font-size:10.5px}.rc .pd tr:first-child td{font-weight:700}
.rc .sg{display:flex;justify-content:space-between;margin-top:34px;padding:0 24px;font-size:12px}
.rc .sg div{border-top:1px solid #222;padding-top:3px;min-width:160px;text-align:center}
@media(max-width:640px){.rc{font-size:10px;padding:8px}.rc .hd h1{font-size:15px}.rc .hd img.lg,.rc .hd .ph{width:48px;height:56px}.rc .info{grid-template-columns:1fr}.rc table.m th,.rc table.m td{font-size:8.5px;padding:1px}}
@media print{.rc{border-width:3px;max-width:none;width:100%;margin:0;page-break-after:always;break-after:page;page-break-inside:avoid;border-radius:0}.rc:last-child{page-break-after:auto;break-after:auto}}`;
    document.head.appendChild(s);
  }

  /* row: results টেবিলের একটি সারি; S: স্কুলের তথ্য (SCHOOL + SETTINGS) */
  function card(row, S, year) {
    css();
    const c = calc(row.marks), cell = (s, i) => (Number(s.m[i]) || 0) > 0 ? [s.m[i], filled(s.v[i]) ? (String(s.v[i]).toUpperCase() === "AB" ? "AB" : num(s.v[i])) : ""] : ["", ""];
    const hd = `<tr><th rowspan="3" style="width:15%">Subject</th><th colspan="4">1st Term.</th><th colspan="4">2nd Term.</th><th colspan="4">Annual Exam.</th><th colspan="2" rowspan="2">Grand Total</th><th rowspan="3">Grade</th></tr>
      <tr>${[0,1,2].map(() => '<th colspan="2">Written</th><th colspan="2">Oral</th>').join("")}</tr>
      <tr>${[0,1,2,3,4,5].map(() => "<th>Max<br>Mark</th><th>Obt<br>Mark</th>").join("")}<th>Max<br>Mark</th><th>Obt<br>Mark</th></tr>`;
    const body = c.subs.map(s => `<tr><td class="s">${e(s.n)}</td>${[0,1,2,3,4,5].map(i => { const x = cell(s, i); return `<td>${x[0]}</td><td>${x[1]}</td>`; }).join("")}<td>${s.max || ""}</td><td>${s.max ? fmt(s.obt) : ""}</td><td>${s.grade}</td></tr>`).join("");
    const tot = `<tr class="tt"><td class="s">Total</td>${c.col.map(x => `<td>${x.show ? x.m : ""}</td><td>${x.show ? fmt(x.o) : ""}</td>`).join("")}<td>${c.M}</td><td>${fmt(c.O)}</td><td>${c.G}</td></tr>
      <tr class="tt"><td></td>${c.tm.map(t => `<td colspan="4">${t.m ? fmt(t.o) + "/" + t.m : ""}</td>`).join("")}<td colspan="3">${c.M ? fmt(c.O) + "/" + c.M : ""}</td></tr>
      <tr class="tt"><td class="s">Percentage</td>${c.tm.map(t => `<td colspan="4">${t.m ? fmt(t.p) + " %" : ""}</td>`).join("")}<td colspan="3">${c.M ? fmt(c.P) + " %" : ""}</td></tr>
      <tr class="tt"><td class="s">Grade</td>${c.tm.map(t => `<td colspan="4">${t.g}</td>`).join("")}<td colspan="3">${c.M ? c.G : ""}</td></tr>`;
    const at = row.attend || {}, W = at.w || [], A = at.a || [];
    const sum = a => a.reduce((x, y) => x + (Number(y) || 0), 0), tw = sum(W), ta = sum(A);
    const att = `<div class="att"><h4>Attendance</h4><table><tr><th style="width:15%">Month</th>${MONTHS.map(m => `<th>${m}</th>`).join("")}<th>Total</th><th>Attd(%)</th></tr>
      <tr><td>Working Days</td>${MONTHS.map((m, i) => `<td>${W[i] || ""}</td>`).join("")}<td>${tw || ""}</td><td rowspan="2">${tw && ta ? fmt(ta / tw * 100) + "%" : ""}</td></tr>
      <tr><td>Attendance</td>${MONTHS.map((m, i) => `<td>${A[i] || ""}</td>`).join("")}<td>${ta || ""}</td></tr></table></div>`;
    const wm = Array(14).fill("MALANCHA KRISHNANAGAR ACADEMY ".repeat(3)).join(" ");
    return `<div class="rc"><div class="wm">${wm}<i></i></div>
    <div class="hd"><img class="lg" src="images/logo.png" alt=""><div class="mid"><h1>MALANCHA KRISHNANAGAR ACADEMY</h1>
      <div class="tg">একটি আদর্শ অনাবাসিক ডে-বোর্ডিং শিক্ষা প্রতিষ্ঠান। এম কে অ্যাকাডেমি। সর্বদাই একধাপ এগিয়ে।</div>
      <div class="ad">${e((S.address || "").toUpperCase())} 742202</div>
      <div class="rg">Estd.: 2012 &nbsp; Mob: ${e(S.phone2)}, ${e(S.phone)} &nbsp; Regd No.: ${e(S.reg)} &nbsp; UDISE+: ${e(S.udise)}</div></div>
      ${row.photo_url ? `<img class="ph" src="${e(row.photo_url)}" alt="">` : '<div class="ph"></div>'}</div>
    <div style="text-align:center"><div class="ttl">Progress Report ${e(year || row.year)}</div></div>
    <div class="nm">${e((row.name || "").toUpperCase())}</div>
    <div class="info">
      <div><b>SCHOLAR NO:</b><span>${e(row.scholar_no)}</span></div><div><b>DOB:</b><span>${e(dmy(row.dob))}</span></div>
      <div><b>FATHER'S NAME:</b><span>${e(row.father)}</span></div><div><b>CLASS:</b><span>${e(clsLabel(row.class))}${row.section ? ":" + e(row.section) : ""}</span></div>
      <div><b>MOTHER'S NAME:</b><span>${e(row.mother)}</span></div><div><b>ROLL NO:</b><span>${e(row.roll)}</span></div>
      <div><b>GENDER:</b><span>${e(row.gender)}</span></div><div><b>COMMUNITY:</b><span>${e(row.community)}</span></div></div>
    <div class="sec">Academic Achievement</div>
    <table class="m">${hd}${body}${tot}</table>
    <div class="box3"><div class="b">Total Mark <span>${c.M ? fmt(c.O) + "/" + c.M : "-"}</span></div><div class="b">Percentage <span>${c.M ? fmt(c.P) + " %" : "-"}</span></div><div class="b">Grade <span>${c.G}</span></div></div>
    <div class="box3"><div class="b c">Result<small>${c.result}</small></div><div class="b c">Remark<small>${c.remark}</small></div><div class="b c">Rank in class<small>${row.rank || "-"}</small></div></div>
    ${att}
    <div class="pd"><h4>Performance Descriptor</h4><table><tr><td>D:(0-&lt;40)</td><td>C:(40-&lt;50)</td><td>C+:(50-&lt;60)</td><td>B:(60-&lt;70)</td><td>B+:(70-&lt;80)</td><td>A:(80-&lt;90)</td><td>A+:(90-&lt;=100)</td></tr>
      <tr><td>Disqualified</td><td>Marginal</td><td>Satisfactory</td><td>Good</td><td>Very Good</td><td>Excellent</td><td>Outstanding</td></tr></table></div>
    <div class="sg"><div>Signature of Class Teacher</div><div>Signature of Principal</div></div></div>`;
  }
  return { CLASSES, clsLabel, clsBn, DEFAULTS, subjectsFor, MONTHS, calc, ranks, grade, card, filled, num, fmt, dmy, css };
})();
