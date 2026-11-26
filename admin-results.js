/* ===== অ্যাডমিন প্যানেলের "ফলাফল" ট্যাব (শিক্ষক ও অ্যাডমিন) — admin.html-এর সঙ্গে চলে ===== */
const R = { rows: [], subs: [], cfg: null, sub: "stu", si: 0, pub: false, ready: false };
const rLocked = () => R.pub && !isAdmin();
const rKey = () => ({ year: $("#rYear").value.trim(), class: $("#rCls").value, section: ($("#rSec").value.trim() || "A").toUpperCase() });
const rBlank = () => ["", "", "", "", "", ""];
const rGet = row => R.subs.map(s => { const o = (row.marks || []).find(x => x.n === s.n); return { n: s.n, m: s.m, v: o ? o.v.slice() : rBlank() }; });
const rFull = row => Object.assign({}, row, { marks: rGet(row) });
const rPdate = s => { s = String(s || "").trim(); const m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : s; };

async function loadResults() {
  await settingsReady;
  if (!R.ready) {
    R.ready = true;
    $("#rCls").innerHTML = RC.CLASSES.map(c => `<option value="${c}">${RC.clsBn(c)}</option>`).join("");
    $("#rCfgCls").innerHTML = $("#rCls").innerHTML;
    $("#rYear").value = SETTINGS.result_year || String(new Date().getFullYear());
    $("#rLoad").onclick = rFetch;
    $("#rCfgCls").onchange = rCfgShow;
    $("#rCfgSave").onclick = rCfgSave; $("#rCfgReset").onclick = rCfgReset; $("#rYearSave").onclick = rYearSave;
    $$("#rTabs button").forEach(b => b.onclick = () => { R.sub = b.dataset.s; rRender(); });
    if (!document.getElementById("printArea")) document.body.insertAdjacentHTML("beforeend", '<div id="printArea"></div>');
  }
  try { R.cfg = SETTINGS.result_subjects ? JSON.parse(SETTINGS.result_subjects) : null; } catch (_) { R.cfg = null; }
  $("#rCfg").style.display = isAdmin() ? "block" : "none";
  if (isAdmin()) rCfgShow();
}

async function rFetch() {
  const k = rKey(), m = $("#rMsg");
  if (!k.year) return say(m, "শিক্ষাবর্ষ লিখুন (যেমন 2026)");
  say(m, "লোড হচ্ছে...", true);
  const r = await client.from("results").select("*").eq("year", k.year).eq("class", k.class).eq("section", k.section).order("roll");
  if (r.error) return say(m, /relation|42P01|schema cache/.test(r.error.message) ? "ফলাফলের টেবিল নেই। supabase_results.sql একবার Supabase-এ চালান।" : r.error.message);
  R.rows = r.data || []; R.subs = RC.subjectsFor(R.cfg, k.class); R.pub = R.rows.length > 0 && R.rows.every(x => x.published); R.si = 0;
  say(m, "", true); $("#rWork").style.display = "block"; rRender();
}

function rRender() {
  const k = rKey(), st = $("#rState");
  st.innerHTML = R.pub ? '<span class="badge-s g">✓ প্রকাশিত</span>' : '<span class="badge-s y">খসড়া (প্রকাশ হয়নি)</span>';
  $$("#rTabs button").forEach(b => b.classList.toggle("on", b.dataset.s === R.sub));
  const lock = rLocked() ? '<div class="box" style="background:#fff7e0">🔒 এই ফলাফল প্রকাশিত হয়ে গেছে, তাই শিক্ষক আর বদলাতে পারবেন না। বদলাতে হলে অ্যাডমিনের সঙ্গে যোগাযোগ করুন। (প্রিন্ট করা যাবে।)</div>' : "";
  $("#rBody").innerHTML = lock + '<div id="rSub"></div>';
  ({ stu: rStu, mk: rMarks, at: rAtt, pub: rPub })[R.sub](k);
}

/* ---------- ছাত্রছাত্রী ---------- */
function rStu(k) {
  const dis = rLocked() ? "disabled" : "", next = R.rows.length ? Math.max(...R.rows.map(x => x.roll)) + 1 : 1;
  $("#rSub").innerHTML = `
  <div class="box"><h3>➕ নতুন ছাত্র/ছাত্রী (${RC.clsBn(k.class)} — সেকশন ${esc(k.section)})</h3>
    <div class="row">
      <div class="f"><label>রোল নম্বর *</label><input id="sRoll" type="number" min="1" value="${next}" ${dis}></div>
      <div class="f"><label>নাম *</label><input id="sName" ${dis}></div>
      <div class="f"><label>Scholar No</label><input id="sSch" ${dis}></div>
      <div class="f"><label>জন্ম তারিখ * (অভিভাবক এটা দিয়েই ফলাফল খুলবেন)</label><input id="sDob" type="date" ${dis}></div>
      <div class="f"><label>পিতার নাম</label><input id="sFa" ${dis}></div>
      <div class="f"><label>মাতার নাম</label><input id="sMo" ${dis}></div>
      <div class="f"><label>লিঙ্গ</label><select id="sGen" ${dis}><option>MALE</option><option>FEMALE</option></select></div>
      <div class="f"><label>Community</label><select id="sCom" ${dis}><option>GENERAL</option><option>OBC</option><option>SC</option><option>ST</option><option>MINORITY</option></select></div>
    </div>
    <button class="btn btn-navy" id="sAddBtn" style="margin-top:14px" ${dis}>যোগ করুন</button><div class="msg" id="sMsg2"></div>
  </div>
  <div class="box"><h3>📋 একসঙ্গে অনেকজন যোগ (Excel থেকে কপি-পেস্ট)</h3>
    <p class="nolink" style="margin-bottom:8px">প্রতি লাইনে একজন। কলাম: <b>রোল, নাম, ScholarNo, জন্মতারিখ (দিন-মাস-সাল), পিতা, মাতা, লিঙ্গ, Community</b>। Excel-এর ঘরগুলো সিলেক্ট করে কপি করে এখানে পেস্ট করলেই হয়।</p>
    <textarea id="sBulk" rows="5" style="width:100%;padding:10px;border:1.5px solid #dbe4f5;border-radius:12px;font-family:inherit" ${dis} placeholder="1, DEEP MONDAL, 340, 20-10-2013, SUBHAS CHANDRA MONDAL, LIPIKA MONDAL, MALE, GENERAL"></textarea>
    <button class="btn btn-navy" id="sBulkBtn" style="margin-top:10px" ${dis}>সব যোগ করুন</button><div class="msg" id="sMsg3"></div></div>
  <div class="box"><h3>ছাত্রছাত্রীর তালিকা (${R.rows.length} জন)</h3><div class="scroll-x"><table class="tbl"><thead><tr><th>রোল</th><th>নাম</th><th>Scholar</th><th>জন্ম তারিখ</th><th>পিতা</th><th></th></tr></thead><tbody>
  ${R.rows.map(x => `<tr><td>${x.roll}</td><td>${esc(x.name)}</td><td>${esc(x.scholar_no)}</td><td>${esc(RC.dmy(x.dob))}</td><td>${esc(x.father)}</td>
    <td style="white-space:nowrap"><button class="sm ln" data-e="${x.id}" ${dis}>✏️ সম্পাদনা</button> <button class="sm del" data-d="${x.id}" ${dis}>মুছুন</button></td></tr>`).join("") || '<tr><td colspan="6" class="empty">এখনও কেউ নেই</td></tr>'}
  </tbody></table></div></div>`;
  $("#sAddBtn").onclick = async () => {
    const m = $("#sMsg2"), o = { roll: +$("#sRoll").value, name: $("#sName").value.trim(), scholar_no: $("#sSch").value.trim(), dob: $("#sDob").value, father: $("#sFa").value.trim(), mother: $("#sMo").value.trim(), gender: $("#sGen").value, community: $("#sCom").value };
    if (!o.roll || !o.name || !o.dob) return say(m, "রোল, নাম ও জন্ম তারিখ দিন");
    const r = await client.from("results").insert(Object.assign({ year: k.year, class: k.class, section: k.section, published: R.pub }, o));
    if (r.error) return say(m, /duplicate|unique/.test(r.error.message) ? "এই রোল নম্বর আগে থেকেই আছে" : r.error.message);
    rFetch();
  };
  $("#sBulkBtn").onclick = async () => {
    const m = $("#sMsg3"), lines = $("#sBulk").value.split(/\r?\n/).map(x => x.trim()).filter(Boolean), out = [];
    for (const [i, l] of lines.entries()) {
      const p = l.split(/\t|,/).map(x => x.trim());
      if (!+p[0] || !p[1] || !/^\d{4}-\d\d-\d\d$/.test(rPdate(p[3]))) return say(m, `লাইন ${i + 1}-এ রোল, নাম বা জন্ম তারিখ ঠিক নেই`);
      out.push({ year: k.year, class: k.class, section: k.section, published: R.pub, roll: +p[0], name: p[1], scholar_no: p[2] || "", dob: rPdate(p[3]), father: p[4] || "", mother: p[5] || "", gender: (p[6] || "").toUpperCase(), community: (p[7] || "GENERAL").toUpperCase() });
    }
    if (!out.length) return say(m, "কিছু লেখা নেই");
    const r = await client.from("results").insert(out);
    if (r.error) return say(m, /duplicate|unique/.test(r.error.message) ? "কোনো রোল আগে থেকেই আছে, কিছু যোগ হয়নি" : r.error.message);
    rFetch();
  };
  $$("#rSub [data-d]").forEach(b => b.onclick = async () => {
    if (b.dataset.sure !== "1") { b.dataset.sure = "1"; b.textContent = "নিশ্চিত?"; return; }
    const r = await client.from("results").delete().eq("id", b.dataset.d); if (r.error) alert(r.error.message); rFetch();
  });
  $$("#rSub [data-e]").forEach(b => b.onclick = () => rEdit(R.rows.find(x => x.id == b.dataset.e)));
}

function rEdit(x) {
  const sel = (id, opts, v) => `<select id="${id}">${opts.map(o => `<option ${o === v ? "selected" : ""}>${o}</option>`).join("")}</select>`;
  $("#modalIn").innerHTML = `<h3 style="color:var(--navy);margin-bottom:14px">সম্পাদনা — রোল ${x.roll}</h3><div class="row">
    <div class="f"><label>রোল</label><input id="xRoll" type="number" value="${x.roll}"></div><div class="f"><label>নাম</label><input id="xName" value="${esc(x.name)}"></div>
    <div class="f"><label>Scholar No</label><input id="xSch" value="${esc(x.scholar_no)}"></div><div class="f"><label>জন্ম তারিখ</label><input id="xDob" type="date" value="${esc((x.dob || "").slice(0, 10))}"></div>
    <div class="f"><label>পিতা</label><input id="xFa" value="${esc(x.father)}"></div><div class="f"><label>মাতা</label><input id="xMo" value="${esc(x.mother)}"></div>
    <div class="f"><label>লিঙ্গ</label>${sel("xGen", ["MALE", "FEMALE"], x.gender)}</div><div class="f"><label>Community</label>${sel("xCom", ["GENERAL", "OBC", "SC", "ST", "MINORITY"], x.community)}</div>
    <div class="f full"><label>ছবি (ঐচ্ছিক, রিপোর্ট কার্ডের ডানদিকে আসবে)</label><input type="file" id="xPh" accept="image/*"></div></div>
    <div style="display:flex;gap:10px;margin-top:16px"><button class="btn btn-navy" id="xS">সংরক্ষণ</button><button class="btn btn-line" id="xC">বাতিল</button></div><div class="msg" id="xM"></div>`;
  $("#modal").classList.add("open"); $("#xC").onclick = () => $("#modal").classList.remove("open");
  $("#xS").onclick = async () => {
    try {
      const up = { roll: +$("#xRoll").value, name: $("#xName").value.trim(), scholar_no: $("#xSch").value.trim(), dob: $("#xDob").value, father: $("#xFa").value.trim(), mother: $("#xMo").value.trim(), gender: $("#xGen").value, community: $("#xCom").value };
      if (!up.roll || !up.name || !up.dob) throw "রোল, নাম ও জন্ম তারিখ দিন";
      const f = $("#xPh").files[0]; if (f) { say($("#xM"), "ছবি আপলোড হচ্ছে...", true); up.photo_url = (await upload(f, "students")).url; }
      const r = await client.from("results").update(up).eq("id", x.id); if (r.error) throw /duplicate|unique/.test(r.error.message) ? "এই রোল আগে থেকেই আছে" : r.error.message;
      $("#modal").classList.remove("open"); rFetch();
    } catch (e) { say($("#xM"), "ত্রুটি: " + e); }
  };
}

/* ---------- নম্বর তোলা ---------- */
function rMarks() {
  const s = R.subs[R.si] || R.subs[0], dis = rLocked() ? "disabled" : "";
  const H = ["১ম সাময়িক — লিখিত", "১ম সাময়িক — মৌখিক", "২য় সাময়িক — লিখিত", "২য় সাময়িক — মৌখিক", "বার্ষিক — লিখিত", "বার্ষিক — মৌখিক"];
  $("#rSub").innerHTML = `<div class="box"><h3>📝 নম্বর তোলা</h3>
    <div class="row"><div class="f"><label>বিষয় বাছুন</label><select id="mSub">${R.subs.map((x, i) => `<option value="${i}" ${i === R.si ? "selected" : ""}>${esc(x.n)}</option>`).join("")}</select></div></div>
    <p class="nolink" style="margin:10px 0">অনুপস্থিত হলে <b>AB</b> লিখুন। ঘর ফাঁকা থাকলে ওই পরীক্ষা এখনও হয়নি ধরা হবে। বড় ঘরে ফুল মার্ক দেওয়া আছে।</p>
    <div class="scroll-x"><table class="tbl"><thead><tr><th>রোল</th><th>নাম</th>${H.map((h, i) => s.m[i] > 0 ? `<th>${h}<br><small>(পূর্ণমান ${s.m[i]})</small></th>` : "").join("")}</tr></thead><tbody>
    ${R.rows.map(x => { const v = rGet(x).find(y => y.n === s.n).v; return `<tr><td>${x.roll}</td><td>${esc(x.name)}</td>${[0, 1, 2, 3, 4, 5].map(i => s.m[i] > 0 ? `<td><input data-r="${x.id}" data-i="${i}" value="${esc(v[i])}" style="width:74px;padding:7px;border:1.5px solid #dbe4f5;border-radius:8px;text-align:center" ${dis}></td>` : "").join("")}</tr>`; }).join("") || '<tr><td colspan="8" class="empty">আগে "ছাত্রছাত্রী" ট্যাবে নাম যোগ করুন</td></tr>'}
    </tbody></table></div>
    <button class="btn btn-navy" id="mSave" style="margin-top:14px" ${dis}>💾 সংরক্ষণ করুন</button><div class="msg" id="mMsg"></div></div>`;
  $("#mSub").onchange = e => { R.si = +e.target.value; rMarks(); };
  $$("#rSub input[data-r]").forEach(inp => inp.addEventListener("input", () => {
    const mx = s.m[+inp.dataset.i], t = inp.value.trim().toUpperCase(); const bad = t !== "" && t !== "AB" && !(isFinite(+t) && +t >= 0 && +t <= mx);
    inp.style.borderColor = bad ? "#c0392b" : "#dbe4f5"; inp.style.background = bad ? "#fde4e4" : "";
  }));
  $("#mSave").onclick = async () => {
    const m = $("#mMsg"); let bad = 0, n = 0; const ch = {};
    $$("#rSub input[data-r]").forEach(inp => {
      const t = inp.value.trim().toUpperCase(), i = +inp.dataset.i;
      if (t !== "" && t !== "AB" && !(isFinite(+t) && +t >= 0 && +t <= s.m[i])) { bad++; return; }
      (ch[inp.dataset.r] = ch[inp.dataset.r] || {})[i] = t;
    });
    if (bad) return say(m, `${bad}টি ঘরে ভুল নম্বর (পূর্ণমানের বেশি বা অক্ষর)। লাল ঘরগুলো ঠিক করুন।`);
    say(m, "সংরক্ষণ হচ্ছে...", true);
    try {
      for (const id of Object.keys(ch)) {
        const row = R.rows.find(x => x.id == id), marks = rGet(row), o = marks.find(y => y.n === s.n);
        Object.keys(ch[id]).forEach(i => o.v[i] = ch[id][i]);
        const r = await client.from("results").update({ marks, updated_at: new Date().toISOString() }).eq("id", row.id); if (r.error) throw r.error.message;
        row.marks = marks;
      }
      say(m, "✓ সংরক্ষিত হয়েছে। এবার পরের বিষয় বাছুন।", true);
    } catch (e) { say(m, "ত্রুটি: " + e); }
  };
}

/* ---------- হাজিরা ---------- */
function rAtt() {
  const dis = rLocked() ? "disabled" : "", W = ((R.rows[0] || {}).attend || {}).w || [];
  const inp = (a, v, extra) => `<input ${extra} value="${esc(v || "")}" type="number" min="0" max="31" style="width:54px;padding:6px;border:1.5px solid #dbe4f5;border-radius:8px;text-align:center" ${dis}>`;
  $("#rSub").innerHTML = `<div class="box"><h3>📅 হাজিরা (মাসভিত্তিক)</h3>
    <p class="nolink" style="margin-bottom:10px">প্রথম সারিতে প্রতি মাসে স্কুল কত দিন খোলা ছিল তা লিখুন (সবার জন্য একই)। তারপর প্রত্যেকের উপস্থিতির দিন লিখুন। ঐচ্ছিক। না লিখলে রিপোর্টে ফাঁকা থাকবে।</p>
    <div class="scroll-x"><table class="tbl"><thead><tr><th>রোল</th><th>নাম</th>${RC.MONTHS.map(m => `<th>${m}</th>`).join("")}</tr></thead><tbody>
    <tr style="background:#fff7e0"><td colspan="2"><b>কার্যদিবস (সবার)</b></td>${RC.MONTHS.map((m, i) => `<td>${inp(0, W[i], `data-w="${i}"`)}</td>`).join("")}</tr>
    ${R.rows.map(x => { const A = (x.attend || {}).a || []; return `<tr><td>${x.roll}</td><td>${esc(x.name)}</td>${RC.MONTHS.map((m, i) => `<td>${inp(0, A[i], `data-a="${x.id}" data-m="${i}"`)}</td>`).join("")}</tr>`; }).join("")}
    </tbody></table></div>
    <button class="btn btn-navy" id="aSave" style="margin-top:14px" ${dis}>💾 সংরক্ষণ করুন</button><div class="msg" id="aMsg"></div></div>`;
  $("#aSave").onclick = async () => {
    const m = $("#aMsg"), w = RC.MONTHS.map((_, i) => $(`#rSub [data-w="${i}"]`).value);
    say(m, "সংরক্ষণ হচ্ছে...", true);
    try {
      for (const row of R.rows) {
        const a = RC.MONTHS.map((_, i) => $(`#rSub [data-a="${row.id}"][data-m="${i}"]`).value);
        const r = await client.from("results").update({ attend: { w, a }, updated_at: new Date().toISOString() }).eq("id", row.id); if (r.error) throw r.error.message;
        row.attend = { w, a };
      }
      say(m, "✓ সংরক্ষিত হয়েছে", true);
    } catch (e) { say(m, "ত্রুটি: " + e); }
  };
}

/* ---------- প্রকাশ ও প্রিন্ট ---------- */
function rCards(onlyId) {
  const full = R.rows.map(rFull), rk = RC.ranks(full);
  const list = full.map(x => Object.assign(x, { rank: R.pub && x.rank ? x.rank : rk[x.id] }));
  return (onlyId ? list.filter(x => x.id == onlyId) : list).map(x => RC.card(x, SCHOOL, x.year)).join("");
}
function rPrint(html) { $("#printArea").innerHTML = html; setTimeout(() => print(), 150); }

function rPub() {
  const full = R.rows.map(rFull), rk = RC.ranks(full);
  const dis = rLocked() ? "disabled" : "";
  $("#rSub").innerHTML = `<div class="box"><h3>✅ যাচাই, প্রকাশ ও প্রিন্ট</h3>
    <p class="nolink" style="margin-bottom:10px">সব নম্বর তোলা হলে নিচের তালিকা মিলিয়ে নিন। <b>"চূড়ান্ত জমা"</b> দিলে র‍্যাঙ্ক নির্ধারিত হবে ও অভিভাবকরা <b>${location.origin.replace("https://", "")}/results.html</b> থেকে রোল ও জন্ম তারিখ দিয়ে ফলাফল দেখতে ও প্রিন্ট করতে পারবেন।</p>
    <div class="scroll-x"><table class="tbl"><thead><tr><th>রোল</th><th>নাম</th><th>মোট নম্বর</th><th>%</th><th>গ্রেড</th><th>ফল</th><th>র‍্যাঙ্ক</th><th></th></tr></thead><tbody>
    ${full.map(x => { const c = RC.calc(x.marks); return `<tr><td>${x.roll}</td><td>${esc(x.name)}</td><td>${c.M ? RC.fmt(c.O) + "/" + c.M : "—"}</td><td>${c.M ? RC.fmt(c.P) : "—"}</td><td>${c.G}</td><td>${c.result}</td><td>${c.M ? (R.pub && x.rank ? x.rank : rk[x.id]) : "—"}</td><td><button class="sm ln" data-v="${x.id}">👁️ দেখুন / প্রিন্ট</button></td></tr>`; }).join("") || '<tr><td colspan="8" class="empty">কেউ নেই</td></tr>'}
    </tbody></table></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
      <button class="btn btn-gold" id="pAll" ${R.rows.length ? "" : "disabled"}>🖨️ সবার রিপোর্ট কার্ড প্রিন্ট</button>
      ${R.pub ? (isAdmin() ? '<button class="btn btn-line" id="pUn">🔓 প্রকাশ বন্ধ করুন (আবার সম্পাদনা করতে)</button>' : "") : `<button class="btn btn-navy" id="pGo" ${R.rows.length ? "" : "disabled"}>✅ চূড়ান্ত জমা ও প্রকাশ করুন</button>`}
    </div><div class="msg" id="pMsg"></div></div>`;
  $("#pAll").onclick = () => rPrint(rCards());
  $$("#rSub [data-v]").forEach(b => b.onclick = () => {
    $("#modalIn").innerHTML = `<div style="display:flex;gap:10px;margin-bottom:12px"><button class="btn btn-navy" id="vP">🖨️ প্রিন্ট</button><button class="btn btn-line" id="vC">বন্ধ করুন</button></div><div style="overflow-x:auto">${rCards(b.dataset.v)}</div>`;
    $("#modal").classList.add("open"); $("#vC").onclick = () => $("#modal").classList.remove("open"); $("#vP").onclick = () => rPrint(rCards(b.dataset.v));
  });
  const go = $("#pGo");
  if (go) go.onclick = async () => {
    const m = $("#pMsg");
    if (go.dataset.sure !== "1") { go.dataset.sure = "1"; go.textContent = "⚠️ নিশ্চিত? প্রকাশের পর শিক্ষক আর বদলাতে পারবেন না — আবার চাপুন"; return; }
    say(m, "প্রকাশ হচ্ছে...", true);
    try {
      for (const x of full) { const r = await client.from("results").update({ rank: RC.calc(x.marks).M ? rk[x.id] : null, marks: x.marks, published: true, updated_at: new Date().toISOString() }).eq("id", x.id); if (r.error) throw r.error.message; }
      await rFetch(); say($("#pMsg"), "✓ ফলাফল প্রকাশিত হয়েছে। অভিভাবকরা এখন দেখতে পারবেন।", true);
    } catch (e) { say(m, "ত্রুটি: " + e); }
  };
  const un = $("#pUn");
  if (un) un.onclick = async () => { const r = await client.from("results").update({ published: false }).eq("year", rKey().year).eq("class", rKey().class).eq("section", rKey().section); if (r.error) return say($("#pMsg"), r.error.message); await rFetch(); R.sub = "pub"; rRender(); };
}

/* ---------- অ্যাডমিনের সেটিং: বছর ও বিষয়ের তালিকা ---------- */
async function rYearSave() {
  const v = $("#rYear").value.trim(), r = await client.from("settings").upsert([{ key: "result_year", value: v }]);
  if (!r.error) SETTINGS.result_year = v; say($("#rCfgMsg"), r.error ? r.error.message : "✓ চলতি শিক্ষাবর্ষ সংরক্ষিত", !r.error);
}
function rCfgShow() {
  const c = $("#rCfgCls").value, subs = RC.subjectsFor(R.cfg, c);
  $("#rCfgTxt").value = subs.map(s => s.n + " | " + s.m.join(" ")).join("\n");
}
async function rCfgSave() {
  const c = $("#rCfgCls").value, m = $("#rCfgMsg"), out = [];
  for (const [i, l] of $("#rCfgTxt").value.split(/\n/).map(x => x.trim()).filter(Boolean).entries()) {
    const p = l.split("|"), n = (p[0] || "").trim(), v = (p[1] || "").trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (!n || v.length !== 6 || v.some(x => !isFinite(x) || x < 0)) return say(m, `লাইন ${i + 1}: "বিষয় | ছয়টি সংখ্যা" ফরম্যাটে লিখুন`);
    out.push({ n, m: v });
  }
  if (!out.length) return say(m, "অন্তত একটি বিষয় দিন");
  const cfg = Object.assign({}, R.cfg || {}); cfg[c] = out;
  const r = await client.from("settings").upsert([{ key: "result_subjects", value: JSON.stringify(cfg) }]);
  if (r.error) return say(m, r.error.message);
  R.cfg = cfg; SETTINGS.result_subjects = JSON.stringify(cfg); say(m, "✓ সংরক্ষিত। এবার ওই শ্রেণি আবার \"লোড\" করুন।", true);
}
async function rCfgReset() {
  const c = $("#rCfgCls").value, cfg = Object.assign({}, R.cfg || {}); delete cfg[c];
  const r = await client.from("settings").upsert([{ key: "result_subjects", value: JSON.stringify(cfg) }]);
  if (r.error) return say($("#rCfgMsg"), r.error.message);
  R.cfg = cfg; SETTINGS.result_subjects = JSON.stringify(cfg); rCfgShow(); say($("#rCfgMsg"), "✓ ডিফল্ট তালিকায় ফেরানো হয়েছে", true);
}
