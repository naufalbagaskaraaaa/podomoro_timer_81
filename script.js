"use strict";

const CFG = {
  LS_POPUP_KEY: "hasSeenApology",
  LS_ACTIVITY_KEY: "pomo_activity",
  LS_SESSIONS_KEY: "pomo_sessions",
  LS_DURATIONS_KEY: "pomo_durations",
  LS_HISTORY_KEY: "pomo_history",

  durations: {
    pomodoro: 25 * 60,
    "short-break": 5 * 60,
    "long-break": 15 * 60,
  },

  DURATION_MIN: 1 * 60,
  DURATION_MAX: 99 * 60,

  RING_C: 741.42,

  POPUP_SCALE_FACTOR: 1.5,
  MAX_POPUP_SCALE: 5.0,

  HISTORY_MAX_ENTRIES: 100,

  MODAL_IMAGES: ["foto_random.jpg"],

  SESSION_QUESTIONS: [
    "gimana hari ini?",
    "udah minum air putih belum?",
    "rate hari ini dong?",
    "selamat istirahat",
    "masih ada energi buat lanjut?",
    "udah lama hidup?",
    "rate hari ini dong berapa?",
    "udah bangga sama dirimu sendiri belum hari ini?",
    "wihh produktif bgt kamu proud",
    "udah lama di unesa?",
    "jangan lupa istirahat juga dong..",
    "masih aman kan? yuk bangkit lagi",
    "makan yang banyak, minum yang cukup",
    "gapapa, mungkin orang itu juga lagi cape",
    "lagi ada problem di panit? coba santai dulu nanti juga selesai",
    "semoga big proker mu suskes yaa doo",
    "udah ketemu dosen killer? seremn sih goodluck yo wkwk",
    "sby panas bgt gila",
    "mau ini habis journaling atau istirahat dulu? keduanya penting kok",
    "makan bang",
    "minum bang",
  ],

  SESSION_PLACEHOLDERS: [
    "rate dong hari ini berapa 1-10",
    "isi '-' aja kalau lagi mager",
    "tinggalkan pesan bib bib",
    "tidak dapat bicara whatssap saja",
    "when ya",
  ],

  NOTIF_MESSAGES: {
    pomodoro: {
      title: "Pomodoro selesai! 🍅",
      body: "Waktunya istirahat sejenak.",
    },
    "short-break": {
      title: "Short break selesai! ☕",
      body: "Balik fokus yuk.",
    },
    "long-break": {
      title: "Long break selesai! 🚀",
      body: "Siap untuk sesi baru?",
    },
  },
};

const SEC = {
  sanitize(str, maxLen = 500) {
    if (typeof str !== "string") return "";
    return str
      .slice(0, maxLen)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  },

  safeParseJSON(raw, fallback = null) {
    if (!raw) return fallback;
    const cleanStr = SEC.deobf(raw);
    try {
      const parsed = JSON.parse(cleanStr);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed) !== Array.isArray(fallback)
      ) {
        return fallback;
      }
      return parsed;
    } catch {
      return fallback;
    }
  },

  safeParseJSONArray(raw) {
    if (!raw) return [];
    const cleanStr = SEC.deobf(raw);
    try {
      const parsed = JSON.parse(cleanStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  clampInt(val, min, max) {
    const n = parseInt(val, 10);
    if (!isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  },

  clampFloat(val, min, max) {
    const n = parseFloat(val);
    if (!isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  },

  validateDurations(obj) {
    const modes = ["pomodoro", "short-break", "long-break"];
    const out = { ...CFG.durations };
    if (typeof obj !== "object" || obj === null) return out;
    for (const m of modes) {
      if (typeof obj[m] === "number") {
        out[m] = SEC.clampInt(obj[m], CFG.DURATION_MIN, CFG.DURATION_MAX);
      }
    }
    return out;
  },

  validateActivityEntry(day) {
    if (typeof day !== "object" || day === null)
      return { pomodoro: 0, "short-break": 0, "long-break": 0 };
    return {
      pomodoro: SEC.clampInt(day.pomodoro, 0, 9999),
      "short-break": SEC.clampInt(day["short-break"], 0, 9999),
      "long-break": SEC.clampInt(day["long-break"], 0, 9999),
    };
  },

  validateHistoryEntry(e) {
    if (typeof e !== "object" || e === null) return null;
    const modes = ["pomodoro", "short-break", "long-break"];
    if (!modes.includes(e.mode)) return null;
    if (typeof e.date !== "string") return null;
    return {
      id: typeof e.id === "string" ? e.id.slice(0, 40) : String(Date.now()),
      date: e.date.slice(0, 30),
      mode: e.mode,
      duration: SEC.clampInt(e.duration, 0, 999),
      rating: SEC.clampInt(e.rating, 0, 5),
      note: typeof e.note === "string" ? e.note.slice(0, 500) : "",
    };
  },

  obf(str) {
    if (!str) return str;
    try {
      return "OBF:" + btoa(encodeURIComponent(str));
    } catch {
      return str;
    }
  },

  deobf(str) {
    if (typeof str !== "string") return str;
    if (str.startsWith("OBF:")) {
      try {
        return decodeURIComponent(atob(str.substring(4)));
      } catch {
        return null;
      }
    }
    return str;
  },
};

const S = {
  mode: "pomodoro",
  timeLeft: CFG.durations.pomodoro,
  totalTime: CFG.durations.pomodoro,
  durations: { ...CFG.durations },
  running: false,
  worker: null,
  pomodorosDone: 0,
  totalSessions: 0,
  selectedRating: null,
  activityChart: null,
  pendingMode: "",
  pendingMinutes: 0,
  deferredInstall: null,
};

const D = {
  overlay: document.getElementById("popup-overlay"),
  popup1: document.getElementById("popup-1"),
  popup2: document.getElementById("popup-2"),
  popup3: document.getElementById("popup-3"),
  p1Mau: document.getElementById("p1-mau"),
  p1Enggak: document.getElementById("p1-enggak"),
  p2Mau: document.getElementById("p2-mau"),
  p2Enggak: document.getElementById("p2-enggak"),
  p3Done: document.getElementById("p3-done"),
  stepDots: document.querySelectorAll(".stepper-dot"),

  html: document.documentElement,
  body: document.body,
  modeTabs: document.querySelectorAll(".mtab"),
  dMin: document.getElementById("d-min"),
  dSec: document.getElementById("d-sec"),
  ringFill: document.getElementById("ring-fill"),
  ringGlow: document.getElementById("ring-glow"),
  modeLabel: document.getElementById("mode-sublabel"),
  btnMain: document.getElementById("btn-main"),
  btnMinus: document.getElementById("btn-minus"),
  btnPlus: document.getElementById("btn-plus"),
  sessionLabel: document.getElementById("session-count-label"),

  statTotal: document.getElementById("stat-total"),
  statStreak: document.getElementById("stat-streak"),
  statSessions: document.getElementById("stat-sessions"),

  modal: document.getElementById("session-modal"),
  modalPhoto: document.getElementById("modal-photo"),
  modalQ: document.getElementById("modal-q"),
  emBtns: document.querySelectorAll(".em-btn"),
  journalTA: document.getElementById("journal-ta"),
  charCount: document.getElementById("char-count"),
  modalSkip: document.getElementById("modal-skip"),
  modalSave: document.getElementById("modal-save"),

  installBtn: document.getElementById("install-btn"),
  historyToggle: document.getElementById("history-toggle"),
  btnExport: document.getElementById("btn-export"),
  btnClear: document.getElementById("btn-clear"),
  historyBody: document.getElementById("history-body"),
  historyList: document.getElementById("history-list"),
  historyEmpty: document.getElementById("history-empty"),

  audio: document.getElementById("notif-sound"),
};

const MODE_LABELS = {
  pomodoro: "POMODORO",
  "short-break": "SHORT BREAK",
  "long-break": "LONG BREAK",
};

const HISTORY_MODE_CLASS = {
  pomodoro: "m-pomodoro",
  "short-break": "m-short-break",
  "long-break": "m-long-break",
};

const RATING_EMOJI = ["", "😩", "😔", "😐", "😊", "🤩"];

function initPopup() {
  if (localStorage.getItem(CFG.LS_POPUP_KEY)) {
    D.overlay.classList.add("is-hidden");
    return;
  }

  D.p1Mau.dataset.scale = "1";
  D.p2Mau.dataset.scale = "1";

  bindEnggak(D.p1Enggak, D.p1Mau);
  D.p1Mau.addEventListener("click", () => transitionPopup(1, 2));

  bindEnggak(D.p2Enggak, D.p2Mau);
  D.p2Mau.addEventListener("click", () => transitionPopup(2, 3));

  D.p3Done.addEventListener("click", finalizePopup);
}

function bindEnggak(enggakEl, mauEl) {
  enggakEl.addEventListener("click", () => {
    const cur = SEC.clampFloat(mauEl.dataset.scale || "1", 0.1, 100);
    const next = Math.min(cur * CFG.POPUP_SCALE_FACTOR, CFG.MAX_POPUP_SCALE);
    mauEl.dataset.scale = next.toFixed(4);
    mauEl.style.transform = `scale(${next.toFixed(4)})`;
  });
}

function transitionPopup(from, to) {
  const fromEl = document.getElementById(`popup-${from}`);
  const toEl = document.getElementById(`popup-${to}`);
  fromEl.style.cssText =
    "opacity:0;transform:translateY(-20px) scale(0.95);transition:opacity 0.25s ease,transform 0.25s ease;";
  setTimeout(() => {
    fromEl.classList.add("is-hidden");
    fromEl.style.cssText = "";
    toEl.classList.remove("is-hidden");
    toEl.style.animation = "none";
    requestAnimationFrame(() => {
      toEl.style.animation = "";
    });
    updateStepDots(to);
  }, 240);
}

function updateStepDots(active) {
  D.stepDots.forEach((d, i) => d.classList.toggle("active", i + 1 === active));
}

function finalizePopup() {
  localStorage.setItem(CFG.LS_POPUP_KEY, "true");
  D.overlay.classList.add("do-fadeout");
  D.overlay.addEventListener(
    "animationend",
    () => D.overlay.classList.add("is-hidden"),
    { once: true },
  );
}

function initWorker() {
  try {
    if (location.protocol === "file:") {
      const workerCode = `
        let endTime = null, tickerId = null;
        self.onmessage = function(e) {
          const { type, timeLeft } = e.data;
          switch (type) {
            case "start": case "resume":
              endTime = Date.now() + timeLeft * 1000;
              clearInterval(tickerId);
              tickerId = setInterval(() => {
                if (!endTime) return;
                const r = Math.max(0, Math.round((endTime - Date.now()) / 1000));
                self.postMessage({ type: "tick", timeLeft: r });
                if (r === 0) { clearInterval(tickerId); endTime = null; self.postMessage({ type: "done" }); }
              }, 250);
              break;
            case "pause": case "stop":
              clearInterval(tickerId); endTime = null;
              break;
          }
        };
      `;
      const blob = new Blob([workerCode], { type: "application/javascript" });
      S.worker = new Worker(URL.createObjectURL(blob));
    } else {
      S.worker = new Worker("./timer.worker.js");
    }
  } catch (err) {
    console.warn("[Worker] Gagal load worker:", err.message);
    S.worker = null;
  }

  if (!S.worker) return;

  S.worker.onmessage = (e) => {
    const { type, timeLeft } = e.data;
    if (type === "tick") {
      S.timeLeft = timeLeft;
      renderTime();
      renderRing();
    } else if (type === "done") {
      onTimerComplete();
    }
  };

  S.worker.onerror = (err) => {
    console.error("[Worker] Error:", err.message);
  };
}

let fbTicker = null;
let fbEndTime = null;

function workerSend(type, extra = {}) {
  if (S.worker) {
    S.worker.postMessage({ type, ...extra });
  } else {
    if (type === "start" || type === "resume") {
      fbEndTime = Date.now() + extra.timeLeft * 1000;
      clearInterval(fbTicker);
      fbTicker = setInterval(() => {
        if (!fbEndTime) return;
        const r = Math.max(0, Math.round((fbEndTime - Date.now()) / 1000));
        S.timeLeft = r;
        renderTime();
        renderRing();
        if (r === 0) {
          clearInterval(fbTicker);
          fbEndTime = null;
          onTimerComplete();
        }
      }, 250);
    } else if (type === "pause" || type === "stop") {
      clearInterval(fbTicker);
      fbEndTime = null;
    }
  }
}

function saveTimerBackup() {
  if (!S.running) return;
  localStorage.setItem(
    "pomo_timer_backup",
    SEC.obf(
      JSON.stringify({
        endTime: Date.now() + S.timeLeft * 1000,
        mode: S.mode,
      }),
    ),
  );
}

function syncFromBackup() {
  try {
    const raw = localStorage.getItem("pomo_timer_backup");
    if (!raw) return;
    const cleanStr = SEC.deobf(raw);
    if (!cleanStr) return;
    const { endTime, mode } = JSON.parse(cleanStr);

    if (mode === S.mode && endTime > Date.now()) {
      const remaining = Math.round((endTime - Date.now()) / 1000);
      S.timeLeft = remaining;
      renderTime();
      renderRing();

      startTimer();
    } else if (endTime <= Date.now()) {
      S.timeLeft = 0;
      onTimerComplete();
      localStorage.removeItem("pomo_timer_backup");
    }
  } catch {}
}

function renderTime() {
  const m = Math.floor(S.timeLeft / 60);
  const s = S.timeLeft % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  D.dMin.textContent = mm;
  D.dSec.textContent = ss;
  document.title = `${mm}:${ss} — pomofocus`;
}

function renderRing() {
  const offset = CFG.RING_C * (1 - S.timeLeft / S.totalTime);
  D.ringFill.style.strokeDashoffset = offset;
  D.ringGlow.style.strokeDashoffset = offset;
}

function startTimer() {
  if (S.running) return;
  requestNotifPermission();
  S.running = true;
  workerSend("start", { timeLeft: S.timeLeft });
  saveTimerBackup();
  D.body.classList.add("is-running");
  D.btnMain.textContent = "Stop";
  D.btnMain.classList.add("is-stop");
  D.btnMinus.disabled = true;
  D.btnPlus.disabled = true;
}

function stopTimerUI() {
  S.running = false;
  workerSend("stop");
  localStorage.removeItem("pomo_timer_backup");
  D.body.classList.remove("is-running");
  D.btnMain.textContent = "Start";
  D.btnMain.classList.remove("is-stop");
  D.btnMinus.disabled = false;
  D.btnPlus.disabled = false;
}

let isMainBtnCold = true;

function handleMainButton() {
  if (!isMainBtnCold) return;
  isMainBtnCold = false;
  setTimeout(() => (isMainBtnCold = true), 500);

  if (!S.running) {
    startTimer();
  } else {
    const elapsed = S.totalTime - S.timeLeft;
    stopTimerUI();
    if (elapsed > 30) {
      S.pendingMode = S.mode;
      S.pendingMinutes = Math.floor(elapsed / 60);
    } else {
      S.pendingMode = "";
      S.pendingMinutes = 0;
    }
    S.timeLeft = S.totalTime;
    renderTime();
    renderRing();
    openSessionModal();
  }
}

function onTimerComplete() {
  stopTimerUI();
  playNotif();
  sendBrowserNotif(S.mode);

  S.pendingMode = S.mode;
  S.pendingMinutes = Math.floor(S.totalTime / 60);

  if (S.mode === "pomodoro") {
    S.pomodorosDone++;
    S.totalSessions++;
    localStorage.setItem(CFG.LS_SESSIONS_KEY, String(S.totalSessions));
    updateSessionLabel();
  }

  S.timeLeft = S.totalTime;
  renderTime();
  renderRing();
  openSessionModal();
}

function setMode(mode) {
  S.mode = mode;
  S.timeLeft = S.durations[mode];
  S.totalTime = S.durations[mode];
  D.html.dataset.mode = mode;
  D.modeTabs.forEach((t) => {
    t.classList.toggle("active", t.dataset.mode === mode);
    t.setAttribute("aria-selected", String(t.dataset.mode === mode));
  });
  D.modeLabel.textContent = MODE_LABELS[mode];
  const accent = getComputedStyle(D.html).getPropertyValue("--accent").trim();
  D.ringGlow.style.stroke = accent;
  renderTime();
  renderRing();
  stopTimerUI();
}

function adjustTime(deltaSec) {
  if (S.running) return;
  S.timeLeft = SEC.clampInt(
    S.timeLeft + deltaSec,
    CFG.DURATION_MIN,
    CFG.DURATION_MAX,
  );
  S.totalTime = S.timeLeft;
  S.durations[S.mode] = S.timeLeft;
  saveDurations();
  renderTime();
  renderRing();
}

function updateSessionLabel() {
  const n = S.pomodorosDone;
  D.sessionLabel.textContent = `${n} session${n !== 1 ? "s" : ""}`;
}

function loadDurations() {
  const raw = localStorage.getItem(CFG.LS_DURATIONS_KEY);
  const parsed = SEC.safeParseJSON(raw, {});
  return SEC.validateDurations(parsed);
}

function saveDurations() {
  try {
    localStorage.setItem(
      CFG.LS_DURATIONS_KEY,
      SEC.obf(JSON.stringify(S.durations)),
    );
  } catch {
    console.warn("[Storage] Tidak bisa simpan durasi");
  }
}

function loadActivityData() {
  const raw = localStorage.getItem(CFG.LS_ACTIVITY_KEY);
  const data = SEC.safeParseJSON(raw, {});
  const clean = Object.create(null);

  const now = Date.now();
  const maxAgeMs = 365 * 24 * 60 * 60 * 1000;

  for (const [key, val] of Object.entries(data)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      const dt = new Date(key);
      if (!isNaN(dt.getTime()) && now - dt.getTime() < maxAgeMs) {
        clean[key] = SEC.validateActivityEntry(val);
      }
    }
  }
  return clean;
}

function saveActivityData(data) {
  try {
    localStorage.setItem(CFG.LS_ACTIVITY_KEY, SEC.obf(JSON.stringify(data)));
  } catch {
    console.warn("[Storage] Tidak bisa simpan activity");
  }
}

function recordActivity(mode, minutes) {
  if (!minutes || minutes <= 0 || !mode) return;
  const data = loadActivityData();
  const today = todayKey();
  if (!data[today])
    data[today] = { pomodoro: 0, "short-break": 0, "long-break": 0 };
  data[today][mode] = SEC.clampInt((data[today][mode] || 0) + minutes, 0, 9999);
  saveActivityData(data);
  if (S.activityChart) refreshChart();
  updateStats();
}

function todayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function getLast7Days() {
  const names = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: names[d.getDay()],
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    };
  });
}

function buildDatasets(days7, act) {
  const labels = days7.map((d) => d.label);
  const pomo = days7.map((d) => act[d.key]?.pomodoro || 0);
  const sb = days7.map((d) => act[d.key]?.["short-break"] || 0);
  const lb = days7.map((d) => act[d.key]?.["long-break"] || 0);
  return { labels, pomo, sb, lb };
}

function initChart() {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js gagal dimuat. Grafik tidak akan tampil.");
    return;
  }
  const ctx = document.getElementById("activity-chart").getContext("2d");
  const act = loadActivityData();
  const days = getLast7Days();
  const { labels, pomo, sb, lb } = buildDatasets(days, act);

  Chart.defaults.font.family = "'Hanken Grotesk', sans-serif";
  Chart.defaults.color = "#9898a8";

  S.activityChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Focus",
          data: pomo,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239,68,68,0.07)",
          borderWidth: 2,
          pointBackgroundColor: "#ef4444",
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
        },
        {
          label: "Short Break",
          data: sb,
          borderColor: "#14b8a6",
          backgroundColor: "rgba(20,184,166,0.06)",
          borderWidth: 2,
          pointBackgroundColor: "#14b8a6",
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
        },
        {
          label: "Long Break",
          data: lb,
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139,92,246,0.05)",
          borderWidth: 2,
          pointBackgroundColor: "#8b5cf6",
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1e1e24",
          borderColor: "rgba(255,255,255,0.09)",
          borderWidth: 1,
          titleColor: "#f2f2f5",
          bodyColor: "#9898a8",
          padding: 10,
          callbacks: { label: (c) => ` ${c.dataset.label}: ${c.parsed.y} min` },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { font: { size: 11 } },
        },
        y: {
          min: 0,
          max: 360,
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { font: { size: 11 }, stepSize: 60, callback: (v) => `${v}m` },
        },
      },
    },
  });

  updateStats();
}

function refreshChart() {
  if (!S.activityChart) return;
  const act = loadActivityData();
  const days = getLast7Days();
  const { pomo, sb, lb } = buildDatasets(days, act);
  S.activityChart.data.datasets[0].data = pomo;
  S.activityChart.data.datasets[1].data = sb;
  S.activityChart.data.datasets[2].data = lb;
  S.activityChart.update("active");
}

function updateStats() {
  const act = loadActivityData();
  const days = getLast7Days();
  let total = 0;
  days.forEach((d) => {
    const day = act[d.key];
    if (day)
      total +=
        (day.pomodoro || 0) +
        (day["short-break"] || 0) +
        (day["long-break"] || 0);
  });
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if ((act[days[i].key]?.pomodoro || 0) > 0) streak++;
    else break;
  }
  S.totalSessions = SEC.clampInt(
    localStorage.getItem(CFG.LS_SESSIONS_KEY) || "0",
    0,
    99999,
  );
  D.statTotal.textContent = total;
  D.statStreak.textContent = streak;
  D.statSessions.textContent = S.totalSessions;
}

function loadHistory() {
  const raw = localStorage.getItem(CFG.LS_HISTORY_KEY);
  const entries = SEC.safeParseJSONArray(raw);
  return entries
    .map(SEC.validateHistoryEntry)
    .filter(Boolean)
    .slice(-CFG.HISTORY_MAX_ENTRIES);
}

function saveHistory(history) {
  try {
    localStorage.setItem(
      CFG.LS_HISTORY_KEY,
      SEC.obf(JSON.stringify(history.slice(-CFG.HISTORY_MAX_ENTRIES))),
    );
  } catch {
    console.warn("[Storage] Tidak bisa simpan history");
  }
}

function addHistoryEntry(entry) {
  const history = loadHistory();
  const safe = SEC.validateHistoryEntry(entry);
  if (!safe) return;
  history.push(safe);
  saveHistory(history);
  renderHistory();
}

function renderHistory() {
  const history = loadHistory().reverse();
  D.historyList.innerHTML = "";

  if (history.length === 0) {
    D.historyEmpty.classList.remove("is-hidden");
    return;
  }
  D.historyEmpty.classList.add("is-hidden");

  for (const entry of history) {
    const li = document.createElement("li");
    li.className = "history-item";
    li.setAttribute("role", "listitem");

    const meta = document.createElement("div");
    meta.className = "hist-meta";

    const badge = document.createElement("span");
    badge.className = `hist-mode-badge ${HISTORY_MODE_CLASS[entry.mode] || ""}`;
    badge.textContent =
      entry.mode === "pomodoro"
        ? "Focus"
        : entry.mode === "short-break"
          ? "Short"
          : "Long";

    const timeEl = document.createElement("span");
    timeEl.className = "hist-time";
    timeEl.textContent = formatHistDate(entry.date);

    const ratingEl = document.createElement("span");
    ratingEl.className = "hist-rating";
    ratingEl.textContent = entry.rating ? RATING_EMOJI[entry.rating] : "—";
    ratingEl.title = entry.rating
      ? `Rating: ${entry.rating}/5`
      : "Tidak dirating";

    meta.appendChild(badge);
    meta.appendChild(timeEl);
    meta.appendChild(ratingEl);
    li.appendChild(meta);

    if (entry.note) {
      const noteEl = document.createElement("p");
      noteEl.className = "hist-note";
      noteEl.textContent = entry.note;
      li.appendChild(noteEl);
    }

    D.historyList.appendChild(li);
  }
}

function formatHistDate(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (isToday) return `Hari ini, ${time}`;
    const date = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
    return `${date}, ${time}`;
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

function openSessionModal() {
  const img =
    CFG.MODAL_IMAGES[Math.floor(Math.random() * CFG.MODAL_IMAGES.length)];
  D.modalPhoto.src = img;
  D.modalQ.textContent = pick(CFG.SESSION_QUESTIONS);
  D.journalTA.placeholder = pick(CFG.SESSION_PLACEHOLDERS);
  S.selectedRating = null;
  D.journalTA.value = "";
  D.charCount.textContent = "0 / 500";
  D.emBtns.forEach((b) => b.classList.remove("picked"));
  D.modal.classList.remove("is-hidden");
}

function closeModal() {
  D.modal.classList.add("is-hidden");
  S.pendingMode = "";
  S.pendingMinutes = 0;
}

function saveAndClose() {
  const note = D.journalTA.value.trim().slice(0, 500);
  const rating = S.selectedRating || 0;
  const mode = S.pendingMode;
  const minutes = S.pendingMinutes;

  recordActivity(mode, minutes);

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
    mode,
    duration: minutes,
    rating,
    note,
  };
  addHistoryEntry(entry);

  D.modal.classList.add("is-hidden");
  S.pendingMode = "";
  S.pendingMinutes = 0;
}

function playNotif() {
  try {
    D.audio.currentTime = 0;
    D.audio.play().catch(beep);
  } catch {
    beep();
  }
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [
      [880, 0, 0.15],
      [1100, 0.18, 0.12],
      [880, 0.32, 0.2],
    ].forEach(([f, s, d]) => {
      const osc = ctx.createOscillator(),
        g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.25, ctx.currentTime + s);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s + d);
      osc.start(ctx.currentTime + s);
      osc.stop(ctx.currentTime + s + d + 0.05);
    });
  } catch (e) {}
}

function requestNotifPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendBrowserNotif(mode) {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;
  const { title, body } = CFG.NOTIF_MESSAGES[mode] || {};
  if (!title) return;
  try {
    const n = new Notification(title, {
      body,
      icon: "./icon.svg",
      badge: "./icon.svg",
      silent: false,
    });
    setTimeout(() => n.close(), 6000);
  } catch {}
}

function initPWA() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js", { scope: "./" })
      .catch((err) => console.warn("[SW] Registrasi gagal:", err.message));
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    S.deferredInstall = e;
    D.installBtn.classList.remove("is-hidden");
  });

  window.addEventListener("appinstalled", () => {
    S.deferredInstall = null;
    D.installBtn.classList.add("is-hidden");
  });
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function bindEvents() {
  D.modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (!S.running) setMode(tab.dataset.mode);
    });
  });

  D.btnMain.addEventListener("click", handleMainButton);
  D.btnMinus.addEventListener("click", () => adjustTime(-60));
  D.btnPlus.addEventListener("click", () => adjustTime(+60));

  D.emBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      S.selectedRating = parseInt(btn.dataset.v, 10);
      D.emBtns.forEach((b) => b.classList.toggle("picked", b === btn));
    });
  });

  D.journalTA.addEventListener("input", () => {
    const len = Math.min(D.journalTA.value.length, 500);
    D.charCount.textContent = `${len} / 500`;
  });

  D.modalSkip.addEventListener("click", closeModal);
  D.modalSave.addEventListener("click", saveAndClose);
  D.modal.addEventListener("click", (e) => {
    if (e.target === D.modal) closeModal();
  });

  D.historyToggle.addEventListener("click", () => {
    const isOpen = D.historyToggle.getAttribute("aria-expanded") === "true";
    D.historyToggle.setAttribute("aria-expanded", String(!isOpen));
    D.historyBody.classList.toggle("is-collapsed", isOpen);
  });

  D.btnExport.addEventListener("click", () => {
    const data = {
      history: loadHistory(),
      activity: loadActivityData(),
      sessions: S.totalSessions,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pomofocus_backup_${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  D.btnClear.addEventListener("click", () => {
    if (
      confirm(
        "Hapus semua riwayat sesi dan aktivitas? Pastikan kamu sudah export backup!",
      )
    ) {
      localStorage.removeItem(CFG.LS_HISTORY_KEY);
      localStorage.removeItem(CFG.LS_ACTIVITY_KEY);
      localStorage.removeItem(CFG.LS_SESSIONS_KEY);
      S.totalSessions = 0;
      updateSessionLabel();
      initChart();
      renderHistory();
      alert("Data berhasil dihapus.");
    }
  });

  D.installBtn.addEventListener("click", async () => {
    if (!S.deferredInstall) return;
    await S.deferredInstall.prompt();
    S.deferredInstall = null;
    D.installBtn.classList.add("is-hidden");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      syncFromBackup();
    } else {
      saveTimerBackup();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (e.code === "Space") {
      e.preventDefault();
      handleMainButton();
    }
    if (e.code === "Escape" && !D.modal.classList.contains("is-hidden"))
      closeModal();
  });
}

function init() {
  initPWA();
  initPopup();
  initWorker();

  S.durations = loadDurations();
  S.mode = "pomodoro";
  S.timeLeft = S.durations["pomodoro"];
  S.totalTime = S.durations["pomodoro"];
  S.totalSessions = SEC.clampInt(
    localStorage.getItem(CFG.LS_SESSIONS_KEY) || "0",
    0,
    99999,
  );

  D.html.dataset.mode = S.mode;
  D.modeLabel.textContent = MODE_LABELS[S.mode];

  renderTime();
  renderRing();
  initChart();
  renderHistory();
  bindEvents();

  syncFromBackup();
}

document.addEventListener("DOMContentLoaded", init);
