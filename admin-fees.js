/* ===== অ্যাডমিন: "ফি" ট্যাব (শুধু অ্যাডমিন) ===== */
let fD = null;
const fCols = [["c", "শ্রেণি", "text"], ["a", "অনাবাসিক ভর্তি ফি", "number"], ["m", "মাসিক স্কুল ফি", "number"], ["da", "ডে-বোর্ডিং ভর্তি ফি", "number"], ["mt", "সকালের টিউশন", "number"], ["et", "বিকালের টিউশন", "number"], ["l", "লাঞ্চ ফি", "number"], ["t", "মাসিক মোট (ডে-বোর্ডিং)", "number"]];
async function loadFees() {
  await settingsReady;
  fD = FEES.get();
  $("#fYear").value = fD.year || ""; $("#fNote").value = fD.note || "";
  fDraw(); fPrev();
  if (!window.__feesBound) {
    window.__feesBound = true;
    $("#fAdd").onclick = () => { fRead(); fD.rows.push({ c: "", a: null, m: null, da: null, mt: null, et: null, l: null, t: null }); fDraw(); };
    $("#fSave").onclick = fSave;
    $("#fReset").onclick = fReset;
    $("#fCalc").onclick = () => { fRead(); fD.rows.forEach(r => { if (FEES.has(r.da)) r.t = (+r.m || 0) + (+r.mt || 0) + (+r.et || 0) + (+r.l || 0); }); fDraw(); say($("#fMsg"), "মোট হিসাব বসেছে (স্কুল ফি + সকাল + বিকাল + লাঞ্চ)। ঠিক থাকলে সংরক্ষণ করুন।", true); };
  }
}
function fDraw() {
  $("#fRows").innerHTML = fD.rows.map((r, i) => `<tr>${fCols.map(c => `<td><input data-i="${i}" data-k="${c[0]}" type="${c[2]}" value="${esc(r[c[0]] == null ? "" : r[c[0]])}" ${c[2] === "number" ? 'min="0" inputmode="numeric"' : ""} style="width:${c[0] === "c" ? 80 : 96}px;padding:8px;border:1.5px solid #dbe4f5;border-radius:8px;text-align:center"></td>`).join("")}<td><button class="sm del" data-d="${i}">মুছুন</button></td></tr>`).join("");
  $$("#fRows [data-d]").forEach(b => b.onclick = () => { fRead(); fD.rows.splice(+b.dataset.d, 1); fDraw(); });
}
function fRead() {
  fD.year = $("#fYear").value.trim(); fD.note = $("#fNote").value.trim();
  $$("#fRows input").forEach(inp => { const r = fD.rows[+inp.dataset.i], k = inp.dataset.k, v = inp.value.trim(); r[k] = k === "c" ? v : (v === "" ? null : +v); });
}
async function fSave() {
  const m = $("#fMsg"); fRead();
  if (fD.rows.some(r => !r.c)) return say(m, "প্রতিটি সারিতে শ্রেণির নাম দিন");
  const r = await client.from("settings").upsert([{ key: "fees", value: JSON.stringify(fD) }]);
  if (r.error) return say(m, r.error.message);
  SETTINGS.fees = JSON.stringify(fD); say(m, "✓ সংরক্ষিত। ওয়েবসাইটে এখনই নতুন ফি দেখাবে।", true); fPrev();
}
async function fReset() {
  const r = await client.from("settings").delete().eq("key", "fees"); if (r.error) return say($("#fMsg"), r.error.message);
  delete SETTINGS.fees; fD = FEES.get(); $("#fYear").value = fD.year; $("#fNote").value = fD.note; fDraw(); fPrev(); say($("#fMsg"), "✓ আসল (ব্রোশিয়ারের) ফিতে ফেরানো হয়েছে", true);
}
function fPrev() { FEES.render($("#fPrev"), "db"); }
