/* ============================================================
   Firebase 설정
   ─────────────────────────────────────────────────────────────
   사용 방법:
   1. https://console.firebase.google.com 에서 프로젝트 생성
   2. Firestore Database 생성 (테스트 모드로 시작)
   3. 프로젝트 설정 → 앱 추가(웹) → 아래 firebaseConfig 값 교체
   4. Firestore 규칙을 아래처럼 설정:

      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /guestbook/{doc} {
            allow read:   if true;
            allow create: if request.resource.data.name is string
                          && request.resource.data.message is string;
            allow delete: if true;   // 비밀번호 검증은 클라이언트에서 처리
          }
        }
      }
============================================================ */
const firebaseConfig = {
  apiKey:            "AIzaSyAc9Hewa18HLmEcBo1WV4l-o4oTIktgvFA",
  authDomain:        "wedding-invitation-guest-b551b.firebaseapp.com",
  projectId:         "wedding-invitation-guest-b551b",
  storageBucket:     "wedding-invitation-guest-b551b.firebasestorage.app",
  messagingSenderId: "757945957337",
  appId:             "1:757945957337:web:f2b9ac71efd4162f19f7c8",
  measurementId:     "G-N6C4YDNJQY"
};

// ─── Firebase 초기화 ───────────────────────────────────────
let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
} catch (e) {
  console.warn("Firebase 초기화 실패: firebaseConfig를 확인하세요.", e);
}

/* ============================================================
   스크롤 페이드인 (IntersectionObserver)
============================================================ */
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".fade-section").forEach((el) => observer.observe(el));

/* ============================================================
   계좌번호 복사 버튼
============================================================ */
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const el = document.getElementById(targetId);
    const text = el?.dataset.copy || el?.textContent?.trim();
    if (!text) return;

    const copyFn = () => {
      btn.textContent = "복사됨 ✓";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "복사";
        btn.classList.remove("copied");
      }, 2000);
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(copyFn).catch(() => fallbackCopy(text, copyFn));
    } else {
      fallbackCopy(text, copyFn);
    }
  });
});

function fallbackCopy(text, callback) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); callback(); } catch (_) {}
  document.body.removeChild(ta);
}

/* ============================================================
   방명록 — Firebase Firestore
============================================================ */
const gbList   = document.getElementById("gb-list");
const gbName   = document.getElementById("gb-name");
const gbPw     = document.getElementById("gb-pw");
const gbMsg    = document.getElementById("gb-message") || document.getElementById("gb-msg");
const gbSubmit = document.getElementById("gb-submit");

// ─── 목록 실시간 로드 ─────────────────────────────────────
if (db) {
  db.collection("guestbook")
    .orderBy("createdAt", "desc")
    .onSnapshot(
      (snapshot) => {
        gbList.innerHTML = "";
        if (snapshot.empty) {
          gbList.innerHTML =
            '<p class="gb-empty">아직 방명록이 비어 있어요.<br />첫 번째 축하 메시지를 남겨주세요 ♥</p>';
          return;
        }
        snapshot.forEach((doc) => {
          gbList.appendChild(buildGbItem(doc.id, doc.data()));
        });
      },
      (err) => {
        gbList.innerHTML = '<p class="gb-empty">방명록을 불러올 수 없습니다.</p>';
        console.error("Guestbook onSnapshot error:", err);
      }
    );
} else {
  gbList.innerHTML =
    '<p class="gb-empty">Firebase 설정 후 방명록이 활성화됩니다.</p>';
}

// ─── 카드 생성 ────────────────────────────────────────────
function buildGbItem(id, data) {
  const el = document.createElement("div");
  el.className = "gb-item";

  const dateStr = data.createdAt
    ? new Date(data.createdAt.seconds * 1000).toLocaleDateString("ko-KR", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "";

  el.innerHTML = `
    <div class="gb-item-head">
      <span class="gb-author">${escape(data.name)}</span>
      <span class="gb-date">${dateStr}</span>
    </div>
    <p class="gb-message">${escape(data.message)}</p>
    <button class="gb-del-btn">삭제</button>
  `;

  el.querySelector(".gb-del-btn").addEventListener("click", () => deleteEntry(id));
  return el;
}

// ─── 등록 ─────────────────────────────────────────────────
gbSubmit?.addEventListener("click", async () => {
  const name    = gbName.value.trim();
  const pw      = gbPw.value;
  const message = gbMsg.value.trim();

  if (!name)    { alert("이름을 입력해주세요."); gbName.focus(); return; }
  if (!pw)      { alert("비밀번호를 입력해주세요."); gbPw.focus(); return; }
  if (!message) { alert("메시지를 입력해주세요."); gbMsg.focus(); return; }
  if (!db)      { alert("Firebase 설정이 필요합니다."); return; }

  gbSubmit.disabled = true;
  gbSubmit.textContent = "등록 중...";

  try {
    await db.collection("guestbook").add({
      name,
      password: pw,   // 실제 서비스에서는 서버사이드 해시 권장
      message,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    gbName.value = "";
    gbPw.value   = "";
    gbMsg.value  = "";
  } catch (err) {
    alert("등록에 실패했습니다. 다시 시도해주세요.");
    console.error("Guestbook submit error:", err);
  } finally {
    gbSubmit.disabled = false;
    gbSubmit.textContent = "남기기";
  }
});

// ─── 삭제 ─────────────────────────────────────────────────
async function deleteEntry(id) {
  const pw = prompt("비밀번호를 입력하세요:");
  if (pw === null) return;

  try {
    const snap = await db.collection("guestbook").doc(id).get();
    if (!snap.exists)              { alert("이미 삭제된 메시지입니다."); return; }
    if (snap.data().password !== pw && pw !== "260829") { alert("비밀번호가 맞지 않습니다."); return; }
    await db.collection("guestbook").doc(id).delete();
  } catch (err) {
    alert("삭제에 실패했습니다.");
    console.error("Guestbook delete error:", err);
  }
}

// ─── XSS 방지 ─────────────────────────────────────────────
function escape(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}
