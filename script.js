"use strict";

const CFG = {
  LS_POPUP_KEY: "hasSeenApology",
  LS_ACTIVITY_KEY: "pomo_activity",
  LS_SESSIONS_KEY: "pomo_sessions",

  durations: {
    pomodoro: 25 * 60,
    "short-break": 5 * 60,
    "long-break": 15 * 60,
  },

  RING_C: 741.42,

  POPUP_SCALE_FACTOR: 1.5,
  MAX_POPUP_SCALE: 5.0,

  // GANTI/TAMBAH path gambar modal post-session di sini:
  MODAL_IMAGES: [
    "foto_random.jpg"
  ],

  // GANTI/TAMBAH pertanyaan acak di sini:
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

  // GANTI/TAMBAH placeholder textarea acak di sini:
  SESSION_PLACEHOLDERS: [
    "rate dong hari ini berapa 1-10",
    "isi '-' aja kalau lagi mager",
    "tinggalkan pesan bib bib",
    "tidak dapat bicara whatssap saja",
    "when ya",
  ],
};

const S = {
  mode: "pomodoro",
  timeLeft: CFG.durations.pomodoro,
  totalTime: CFG.durations.pomodoro,
  running: false,
  intervalId: null,
  pomodorosDone: 0,
  totalSessions: 0,
  selectedRating: null,
  activityChart: null,
  pendingMode: "",
  pendingMinutes: 0,
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

  audio: document.getElementById("notif-sound"),
};

const MODE_LABELS = {
  pomodoro: "POMODORO",
  "short-break": "SHORT BREAK",
  "long-break": "LONG BREAK",
};

// ── Popup Flow ──────────────────────────────────────────────────

function initPopup() {
  if (localStorage.getItem(CFG.LS_POPUP_KEY)) {
    D.overlay.classList.add("is-hidden");
    return;
  }

  bindEnggakButton(D.p1Enggak, D.p1Mau);
  D.p1Mau.addEventListener("click", () => transitionPopup(1, 2));

  bindEnggakButton(D.p2Enggak, D.p2Mau);
  D.p2Mau.addEventListener("click", () => transitionPopup(2, 3));

  D.p3Done.addEventListener("click", finalizePopup);
}

function bindEnggakButton(enggakEl, mauEl) {
  enggakEl.addEventListener("click", () => {
    const cur = parseFloat(mauEl.style.getPropertyValue("--s") || "1");
    const next = Math.min(cur * CFG.POPUP_SCALE_FACTOR, CFG.MAX_POPUP_SCALE);
    mauEl.style.setProperty("--s", next.toFixed(4));
  });
}

function transitionPopup(fromStep, toStep) {
  const fromEl = document.getElementById(`popup-${fromStep}`);
  const toEl = document.getElementById(`popup-${toStep}`);

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
    updateStepDots(toStep);
  }, 240);
}

function updateStepDots(activeStep) {
  D.stepDots.forEach((dot, i) =>
    dot.classList.toggle("active", i + 1 === activeStep),
  );
}

function finalizePopup() {
  localStorage.setItem(CFG.LS_POPUP_KEY, "true");
  D.overlay.classList.add("do-fadeout");
  D.overlay.addEventListener(
    "animationend",
    () => {
      D.overlay.classList.add("is-hidden");
    },
    { once: true },
  );
}

// ── Timer Engine ────────────────────────────────────────────────

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

function tick() {
  if (S.timeLeft <= 0) {
    onTimerComplete();
    return;
  }
  S.timeLeft--;
  renderTime();
  renderRing();
}

function startTimer() {
  if (S.running) return;
  S.running = true;
  S.intervalId = setInterval(tick, 1000);
  D.body.classList.add("is-running");
  D.btnMain.textContent = "Stop";
  D.btnMain.classList.add("is-stop");
}

function stopTimerClean() {
  S.running = false;
  clearInterval(S.intervalId);
  D.body.classList.remove("is-running");
  D.btnMain.textContent = "Start";
  D.btnMain.classList.remove("is-stop");
}

function handleMainButton() {
  if (!S.running) {
    startTimer();
  } else {
    const elapsedSec = S.totalTime - S.timeLeft;
    stopTimerClean();

    if (elapsedSec > 30) {
      S.pendingMode = S.mode;
      S.pendingMinutes = Math.floor(elapsedSec / 60);
    } else {
      S.pendingMode = "";
      S.pendingMinutes = 0;
    }

    resetDisplay();
    openSessionModal();
  }
}

function resetDisplay() {
  S.timeLeft = S.totalTime;
  renderTime();
  renderRing();
}

function onTimerComplete() {
  stopTimerClean();
  playNotif();

  S.pendingMode = S.mode;
  S.pendingMinutes = Math.floor(S.totalTime / 60);

  if (S.mode === "pomodoro") {
    S.pomodorosDone++;
    S.totalSessions++;
    localStorage.setItem(CFG.LS_SESSIONS_KEY, S.totalSessions);
    updateSessionLabel();
  }

  resetDisplay();
  openSessionModal();
}

function setMode(mode) {
  S.mode = mode;
  S.timeLeft = CFG.durations[mode];
  S.totalTime = CFG.durations[mode];

  D.html.dataset.mode = mode;

  D.modeTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
    tab.setAttribute("aria-selected", tab.dataset.mode === mode);
  });

  D.modeLabel.textContent = MODE_LABELS[mode];

  const computedAccent = getComputedStyle(D.html)
    .getPropertyValue("--accent")
    .trim();
  D.ringGlow.style.stroke = computedAccent;

  renderTime();
  renderRing();
  stopTimerClean();
}

function adjustTime(deltaSec) {
  if (S.running) return;
  S.timeLeft = Math.max(60, Math.min(S.timeLeft + deltaSec, 99 * 60));
  S.totalTime = S.timeLeft;
  renderTime();
  renderRing();
}

function updateSessionLabel() {
  D.sessionLabel.textContent = `${S.pomodorosDone} session${S.pomodorosDone !== 1 ? "s" : ""}`;
}

// ── Chart Engine ────────────────────────────────────────────────

function loadActivityData() {
  try {
    return JSON.parse(localStorage.getItem(CFG.LS_ACTIVITY_KEY)) || {};
  } catch {
    return {};
  }
}

function saveActivityData(data) {
  localStorage.setItem(CFG.LS_ACTIVITY_KEY, JSON.stringify(data));
}

function recordActivity(mode, minutes) {
  if (minutes <= 0 || !mode) return;
  const data = loadActivityData();
  const today = getTodayKey();
  if (!data[today])
    data[today] = { pomodoro: 0, "short-break": 0, "long-break": 0 };
  data[today][mode] = (data[today][mode] || 0) + minutes;
  saveActivityData(data);
  if (S.activityChart) refreshChart();
  updateStats();
}

function getTodayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function getLast7Days() {
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    result.push({ label: days[d.getDay()], key });
  }
  return result;
}

function buildChartDatasets(days7, actData) {
  const labels = days7.map((d) => d.label);
  const pomo = days7.map((d) => actData[d.key]?.pomodoro || 0);
  const sbreak = days7.map((d) => actData[d.key]?.["short-break"] || 0);
  const lbreak = days7.map((d) => actData[d.key]?.["long-break"] || 0);
  return { labels, pomo, sbreak, lbreak };
}

function initChart() {
  const ctx = document.getElementById("activity-chart").getContext("2d");
  const actData = loadActivityData();
  const days7 = getLast7Days();
  const { labels, pomo, sbreak, lbreak } = buildChartDatasets(days7, actData);

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
          data: sbreak,
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
          data: lbreak,
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
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} min`,
          },
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
          ticks: {
            font: { size: 11 },
            stepSize: 60,
            callback: (v) => `${v}m`,
          },
        },
      },
    },
  });

  updateStats();
}

function refreshChart() {
  const actData = loadActivityData();
  const days7 = getLast7Days();
  const { pomo, sbreak, lbreak } = buildChartDatasets(days7, actData);
  S.activityChart.data.datasets[0].data = pomo;
  S.activityChart.data.datasets[1].data = sbreak;
  S.activityChart.data.datasets[2].data = lbreak;
  S.activityChart.update("active");
}

function updateStats() {
  const actData = loadActivityData();
  const days7 = getLast7Days();

  let totalMin = 0;
  days7.forEach((d) => {
    const day = actData[d.key];
    if (day)
      totalMin +=
        (day.pomodoro || 0) +
        (day["short-break"] || 0) +
        (day["long-break"] || 0);
  });

  let streak = 0;
  for (let i = days7.length - 1; i >= 0; i--) {
    const day = actData[days7[i].key];
    if (day?.pomodoro > 0) {
      streak++;
    } else break;
  }

  S.totalSessions = parseInt(
    localStorage.getItem(CFG.LS_SESSIONS_KEY) || "0",
    10,
  );

  D.statTotal.textContent = totalMin;
  D.statStreak.textContent = streak;
  D.statSessions.textContent = S.totalSessions;
}

// ── Session Modal ───────────────────────────────────────────────

function openSessionModal() {
  const imgSrc =
    CFG.MODAL_IMAGES[Math.floor(Math.random() * CFG.MODAL_IMAGES.length)];
  D.modalPhoto.src = imgSrc;
  D.modalQ.textContent = pick(CFG.SESSION_QUESTIONS);
  D.journalTA.placeholder = pick(CFG.SESSION_PLACEHOLDERS);
  S.selectedRating = null;
  D.journalTA.value = "";
  D.charCount.textContent = "0 / 500";
  D.emBtns.forEach((b) => b.classList.remove("picked"));
  D.modal.classList.remove("is-hidden");
}

function closeModalNoSave() {
  stopNotif();
  D.modal.classList.add("is-hidden");
  S.pendingMode = "";
  S.pendingMinutes = 0;
}

function saveJournalEntry() {
  stopNotif();
  recordActivity(S.pendingMode, S.pendingMinutes);
  S.pendingMode = "";
  S.pendingMinutes = 0;

  const entry = {
    date: new Date().toISOString(),
    mode: S.mode,
    rating: S.selectedRating,
    note: D.journalTA.value.trim(),
  };
  console.log("[Journal]", entry);

  D.modal.classList.add("is-hidden");
}

// ── Audio ───────────────────────────────────────────────────────

function playNotif() {
  try {
    D.audio.currentTime = 0;
    D.audio.play().catch(generateBeep);
  } catch {
    generateBeep();
  }
}

function stopNotif() {
  try {
    D.audio.pause();
    D.audio.currentTime = 0;
  } catch (e) {
  }
}

function generateBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [
      [880, 0, 0.15],
      [1100, 0.18, 0.12],
      [880, 0.32, 0.2],
    ].forEach(([freq, start, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + dur,
      );
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  } catch (e) {
    console.warn("[Audio]", e);
  }
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Event Binding ───────────────────────────────────────────────

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
    D.charCount.textContent = `${D.journalTA.value.length} / 500`;
  });

  D.modalSkip.addEventListener("click", closeModalNoSave);
  D.modalSave.addEventListener("click", saveJournalEntry);

  D.modal.addEventListener("click", (e) => {
    if (e.target === D.modal) closeModalNoSave();
  });

  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
    if (e.code === "Space") {
      e.preventDefault();
      handleMainButton();
    }
    if (e.code === "Escape" && !D.modal.classList.contains("is-hidden"))
      closeModalNoSave();
  });
}

// ── Init ────────────────────────────────────────────────────────

function init() {
  initPopup();

  S.totalSessions = parseInt(
    localStorage.getItem(CFG.LS_SESSIONS_KEY) || "0",
    10,
  );
  D.html.dataset.mode = S.mode;
  D.modeLabel.textContent = MODE_LABELS[S.mode];

  renderTime();
  renderRing();
  initChart();
  bindEvents();
}

document.addEventListener("DOMContentLoaded", init);

const pauseTimer = stopTimerClean;
const closeSessionModal = closeModalNoSave;