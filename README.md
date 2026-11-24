# M K Academy Website

## ফাইল
index.html (হোম), about.html, gallery.html, admission.html, contact.html, style.css, common.js

## ১. GitHub Pages-এ ফ্রি প্রকাশ
1. github.com-এ অ্যাকাউন্ট খুলুন → New repository (নাম: mkacademy, Public)
2. "Add file → Upload files" দিয়ে সব ফাইল (এবং images ফোল্ডার) আপলোড করুন
3. Settings → Pages → Branch: main / root → Save
4. কিছুক্ষণ পর সাইট চালু হবে: https://আপনার-নাম.github.io/mkacademy/

## ২. ভর্তির তথ্য ও ডকুমেন্ট নিজের Google Drive/Sheet-এ সেভ রাখা
1. নতুন Google Sheet খুলুন, প্রথম সারিতে (A1 থেকে) এই কলামগুলো দিন:
   appNo, date, session, studentName, dob, gender, classApplied, blood, religion, aadhaar, prevSchool, prevClass, percent, father, mother, occupation, mobile, mobile2, email, village, po, ps, district, pin, docsList, docsFolder
2. Extensions → Apps Script-এ এই কোড বসান:

```js
const FOLDER_NAME = "MK Academy Admissions";
function doPost(e) {
  const p = e.parameter;
  let link = "";
  if (p.docs) {
    const docs = JSON.parse(p.docs);
    const it = DriveApp.getFoldersByName(FOLDER_NAME);
    const root = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
    const f = root.createFolder(p.appNo + " - " + p.studentName);
    docs.forEach(d => {
      const bytes = Utilities.base64Decode(d.data.split(",")[1]);
      f.createFile(Utilities.newBlob(bytes, d.type, d.label + "_" + d.name));
    });
    link = f.getUrl();
  }
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  sh.appendRow(h.map(k => k === "docsFolder" ? link : (p[k] || "")));
  return ContentService.createTextOutput("ok");
}
```
3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → Deploy (Drive-এর অনুমতি চাইলে Allow করুন)
4. যে URL পাবেন সেটি common.js-এর `SCRIPT_URL: ""`-এর ভেতরে বসান।
প্রতিটি আবেদনের ডকুমেন্ট Drive-এর "MK Academy Admissions" ফোল্ডারে আলাদা ফোল্ডারে জমা হবে, লিংক Sheet-এ থাকবে।

## ৩. গ্যালারির ছবি (লোগো images/logo.png-এ আছে)
images ফোল্ডারে g1.jpg ... g12.jpg নামে ছবি রাখুন।

## ৪. তথ্য বদলানো
নাম, ঠিকানা, ফোন বদলাতে শুধু common.js-এর শুরুর SCHOOL অংশ বদলান।
