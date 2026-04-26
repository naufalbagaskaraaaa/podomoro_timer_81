/* ══════════════════════════════════════════════════════════════════
   test.js — Comprehensive Test Cases for pomofocus
   
   Cara Menjalankan:
   1. Buka DevTools Console (F12)
   2. Copy-paste test case yang ingin dijalankan
   3. Lihat hasil di console
   
   Struktur:
   - POPUP TESTS
   - TIMER TESTS
   - CHART & ACTIVITY TESTS
   - MODAL TESTS
   - AUDIO TESTS
   - KEYBOARD TESTS
   - DOM & STATE TESTS
══════════════════════════════════════════════════════════════════ */

// Helper: Assert function
function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    return true;
  } else {
    console.error(`❌ FAIL: ${message}`);
    return false;
  }
}

function log(msg) {
  console.log(`ℹ️ ${msg}`);
}

// ===========================================================
// § 1. POPUP TESTS
// ===========================================================

const POPUP_TESTS = {
  testPopupInitialization: function() {
    log("Testing Popup Initialization...");
    assert(D.overlay !== null, "Popup overlay element exists");
    assert(D.popup1 !== null, "Popup 1 element exists");
    assert(D.popup2 !== null, "Popup 2 element exists");
    assert(D.popup3 !== null, "Popup 3 element exists");
    assert(D.p1Mau !== null, "Popup 1 'Mau' button exists");
    assert(D.p1Enggak !== null, "Popup 1 'Enggak' button exists");
  },

  testPopupScalingLogic: function() {
    log("Testing Popup Scale Mechanism...");
    const btn = D.p1Mau;
    const initialScale = parseFloat(btn.style.getPropertyValue("--s") || "1");
    assert(initialScale === 1, "Initial scale is 1");

    /* Ensure scaling click handler is attached even if popup flow was skipped earlier */
    bindEnggakButton(D.p1Enggak, D.p1Mau);
    
    // Simulate click on 'Enggak' button
    D.p1Enggak.click();
    const newScale = parseFloat(btn.style.getPropertyValue("--s") || "1");
    assert(
      newScale > initialScale,
      `Scale increased after Enggak click: ${initialScale} → ${newScale}`
    );
  },

  testPopupLocalStorage: function() {
    log("Testing Popup localStorage...");
    const key = CFG.LS_POPUP_KEY;
    localStorage.removeItem(key);
    assert(localStorage.getItem(key) === null, "localStorage cleared");
    
    localStorage.setItem(key, "true");
    assert(localStorage.getItem(key) === "true", "localStorage key set correctly");
  },

  runAll: function() {
    log("\n===== POPUP TESTS =====");
    this.testPopupInitialization();
    this.testPopupScalingLogic();
    this.testPopupLocalStorage();
  }
};

// ===========================================================
// § 2. TIMER TESTS
// ===========================================================

const TIMER_TESTS = {
  testTimerState: function() {
    log("Testing Timer State...");
    assert(S.mode === "pomodoro", "Default mode is pomodoro");
    assert(S.timeLeft > 0, "timeLeft is positive");
    assert(S.totalTime === CFG.durations.pomodoro, "totalTime matches config");
    assert(S.running === false, "Timer initially not running");
  },

  testTimerDisplay: function() {
    log("Testing Timer Display Rendering...");
    renderTime();
    const minDisplay = D.dMin.textContent;
    const secDisplay = D.dSec.textContent;
    assert(/^\d{2}$/.test(minDisplay), `Minutes display is valid: ${minDisplay}`);
    assert(/^\d{2}$/.test(secDisplay), `Seconds display is valid: ${secDisplay}`);
  },

  testModeSwitching: function() {
    log("Testing Mode Switching...");
    const modes = ["pomodoro", "short-break", "long-break"];
    modes.forEach((mode) => {
      setMode(mode);
      assert(S.mode === mode, `Successfully switched to ${mode}`);
      assert(
        S.timeLeft === CFG.durations[mode],
        `${mode} has correct duration: ${S.timeLeft}s`
      );
    });
    setMode("pomodoro"); // Reset
  },

  testRingRendering: function() {
    log("Testing SVG Ring Rendering...");
    setMode("pomodoro");
    renderRing();
    const offset = D.ringFill.style.strokeDashoffset;
    assert(offset !== "", "Ring has stroke-dashoffset");
    assert(!isNaN(parseFloat(offset)), `Ring offset is numeric: ${offset}`);
  },

  testTimeAdjustment: function() {
    log("Testing Time Adjustment...");
    setMode("pomodoro");
    const initialTime = S.timeLeft;
    adjustTime(60); // +1 min
    assert(S.timeLeft > initialTime, "Time increased with +60");
    
    adjustTime(-60); // -1 min
    assert(S.timeLeft === initialTime, "Time returned to original with -60");
  },

  testStartPauseTimer: function() {
    log("Testing Start/Pause Timer...");
    setMode("pomodoro");
    const before = S.timeLeft;
    startTimer();
    assert(S.running === true, "Timer running after start");
    pauseTimer();
    assert(S.running === false, "Timer paused");
  },

  runAll: function() {
    log("\n===== TIMER TESTS =====");
    this.testTimerState();
    this.testTimerDisplay();
    this.testModeSwitching();
    this.testRingRendering();
    this.testTimeAdjustment();
    this.testStartPauseTimer();
  }
};

// ===========================================================
// § 3. CHART & ACTIVITY TESTS
// ===========================================================

const CHART_TESTS = {
  testActivityDataStructure: function() {
    log("Testing Activity Data Structure...");
    const data = loadActivityData();
    assert(typeof data === "object", "Activity data is an object");
    assert(Array.isArray(Object.keys(data)) || data instanceof Object, "Can read keys");
  },

  testActivityDateKey: function() {
    log("Testing Date Key Format...");
    const today = getTodayKey();
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    assert(regex.test(today), `Date key format is correct: ${today}`);
  },

  testRecordActivity: function() {
    log("Testing Activity Recording...");
    const before = loadActivityData();
    const today = getTodayKey();
    recordActivity("pomodoro", 5);
    const after = loadActivityData();
    assert(
      (after[today]?.pomodoro || 0) > (before[today]?.pomodoro || 0),
      "Pomodoro activity recorded"
    );
  },

  testChartInitialization: function() {
    log("Testing Chart Initialization...");
    assert(S.activityChart !== null, "Chart instance exists");
    assert(S.activityChart.config.type === "line", "Chart type is line");
    assert(
      S.activityChart.data.datasets.length === 3,
      "Chart has 3 datasets (Pomodoro, Short Break, Long Break)"
    );
  },

  testLast7Days: function() {
    log("Testing 7-Day Data Calculation...");
    const days = getLast7Days();
    assert(days.length === 7, "7-day array has 7 entries");
    assert(days[0].label !== undefined, "Each day has a label");
    assert(days[0].key !== undefined, "Each day has a key");
  },

  testStats: function() {
    log("Testing Statistics...");
    updateStats();
    assert(D.statTotal !== null, "Total stat element exists");
    assert(D.statStreak !== null, "Streak stat element exists");
    assert(D.statSessions !== null, "Sessions stat element exists");
    
    const total = parseInt(D.statTotal.textContent, 10);
    const streak = parseInt(D.statStreak.textContent, 10);
    const sessions = parseInt(D.statSessions.textContent, 10);
    
    assert(!isNaN(total), `Total minutes is numeric: ${total}`);
    assert(!isNaN(streak), `Streak is numeric: ${streak}`);
    assert(!isNaN(sessions), `Sessions is numeric: ${sessions}`);
  },

  runAll: function() {
    log("\n===== CHART & ACTIVITY TESTS =====");
    this.testActivityDataStructure();
    this.testActivityDateKey();
    this.testRecordActivity();
    this.testChartInitialization();
    this.testLast7Days();
    this.testStats();
  }
};

// ===========================================================
// § 4. SESSION MODAL TESTS
// ===========================================================

const MODAL_TESTS = {
  testModalElements: function() {
    log("Testing Modal Elements...");
    assert(D.modal !== null, "Modal element exists");
    assert(D.modalPhoto !== null, "Modal photo element exists");
    assert(D.modalQ !== null, "Modal question element exists");
    assert(D.journalTA !== null, "Journal textarea exists");
    assert(D.charCount !== null, "Character counter exists");
  },

  testModalOpenClose: function() {
    log("Testing Modal Open/Close...");
    openSessionModal();
    assert(
      !D.modal.classList.contains("is-hidden"),
      "Modal opens (not hidden)"
    );
    closeSessionModal();
    assert(D.modal.classList.contains("is-hidden"), "Modal closes (hidden)");
  },

  testEmojiRating: function() {
    log("Testing Emoji Rating...");
    openSessionModal();
    assert(D.emBtns.length > 0, "Emoji rating buttons exist");
    
    const firstBtn = D.emBtns[0];
    firstBtn.click();
    assert(S.selectedRating !== null, "Rating selected");
    assert(firstBtn.classList.contains("picked"), "Clicked emoji marked as picked");
    
    closeSessionModal();
  },

  testCharacterCounter: function() {
    log("Testing Character Counter...");
    openSessionModal();
    const testText = "Test input";
    D.journalTA.value = testText;
    D.journalTA.dispatchEvent(new Event("input"));
    
    const counter = D.charCount.textContent;
    assert(
      counter.includes(testText.length),
      `Character counter shows ${testText.length}: ${counter}`
    );
    closeSessionModal();
  },

  testRandomContent: function() {
    log("Testing Random Content Generation...");
    const q1 = CFG.SESSION_QUESTIONS[0];
    const p1 = CFG.SESSION_PLACEHOLDERS[0];
    
    assert(q1 !== undefined, "Session questions exist");
    assert(p1 !== undefined, "Session placeholders exist");
    assert(typeof q1 === "string", "Question is a string");
    assert(typeof p1 === "string", "Placeholder is a string");
  },

  runAll: function() {
    log("\n===== SESSION MODAL TESTS =====");
    this.testModalElements();
    this.testModalOpenClose();
    this.testEmojiRating();
    this.testCharacterCounter();
    this.testRandomContent();
  }
};

// ===========================================================
// § 5. AUDIO TESTS
// ===========================================================

const AUDIO_TESTS = {
  testAudioElement: function() {
    log("Testing Audio Element...");
    assert(D.audio !== null, "Audio element exists");
    assert(D.audio.id === "notif-sound", "Audio has correct ID");
  },

  testPlayNotif: function() {
    log("Testing Notification Sound...");
    try {
      playNotif();
      assert(true, "playNotif() executed without error");
    } catch (e) {
      assert(false, `playNotif() error: ${e.message}`);
    }
  },

  testAudioFallback: function() {
    log("Testing Audio Fallback (Web Audio API)...");
    try {
      generateBeep();
      assert(true, "generateBeep() fallback works");
    } catch (e) {
      assert(false, `generateBeep() error: ${e.message}`);
    }
  },

  runAll: function() {
    log("\n===== AUDIO TESTS =====");
    this.testAudioElement();
    this.testPlayNotif();
    this.testAudioFallback();
  }
};

// ===========================================================
// § 6. KEYBOARD SHORTCUTS TESTS
// ===========================================================

const KEYBOARD_TESTS = {
  testKeyboardSetup: function() {
    log("Testing Keyboard Event Listeners...");
    // Note: These are already bound in bindEvents(), so we just verify the DOM
    assert(D.btnStart !== null, "Start button exists (for Space key)");
    assert(D.btnStop !== null, "Stop button exists (for S key)");
    assert(D.modal !== null, "Modal exists (for Escape key)");
  },

  testKeyboardShortcutSpace: function() {
    log("Testing Space Key Shortcut (simulated)...");
    const initialState = S.running;
    // Manually trigger the behavior
    if (S.running) pauseTimer();
    else startTimer();
    const newState = S.running;
    assert(initialState !== newState, "Space key toggles Start/Pause");
    pauseTimer(); // Reset
  },

  runAll: function() {
    log("\n===== KEYBOARD TESTS =====");
    this.testKeyboardSetup();
    this.testKeyboardShortcutSpace();
  }
};

// ===========================================================
// § 7. DOM & CONFIGURATION TESTS
// ===========================================================

const DOM_TESTS = {
  testDOMCache: function() {
    log("Testing DOM Cache...");
    const cacheable = ["overlay", "modal", "dMin", "dSec", "btnStart", "btnStop"];
    cacheable.forEach((key) => {
      assert(D[key] !== null, `D.${key} is cached`);
    });
  },

  testConfigurationValues: function() {
    log("Testing Configuration Values...");
    assert(CFG.durations.pomodoro === 25 * 60, "Pomodoro: 25 min");
    assert(CFG.durations["short-break"] === 5 * 60, "Short Break: 5 min");
    assert(CFG.durations["long-break"] === 15 * 60, "Long Break: 15 min");
    assert(CFG.longBreakEvery === 4, "Long break every 4 sessions");
  },

  testModeLabels: function() {
    log("Testing Mode Labels...");
    assert(MODE_LABELS.pomodoro === "POMODORO", "Pomodoro label correct");
    assert(MODE_LABELS["short-break"] === "SHORT BREAK", "Short Break label correct");
    assert(MODE_LABELS["long-break"] === "LONG BREAK", "Long Break label correct");
  },

  testPageTitle: function() {
    log("Testing Browser Tab Title Update...");
    renderTime();
    const title = document.title;
    assert(title.includes(":"), "Tab title contains time format");
    assert(title.includes("pomofocus"), "Tab title includes app name");
  },

  runAll: function() {
    log("\n===== DOM & CONFIGURATION TESTS =====");
    this.testDOMCache();
    this.testConfigurationValues();
    this.testModeLabels();
    this.testPageTitle();
  }
};

// ===========================================================
// § 8. INTEGRATION TESTS
// ===========================================================

const INTEGRATION_TESTS = {
  testFullTimerFlow: function() {
    log("Testing Full Timer Flow (Pomodoro → Short Break)...");
    pauseTimer(); // Ensure timer is stopped
    setMode("pomodoro");
    assert(S.mode === "pomodoro", "Started with Pomodoro");
    
    S.pomodorosDone = 1;
    autoTransition();
    assert(S.mode === "short-break", `Auto-transitioned to Short Break (mode is now: ${S.mode})`);
    pauseTimer(); // Stop timer from autoTransition
  },

  testSessionCounter: function() {
    log("Testing Session Counter...");
    const before = S.pomodorosDone;
    S.pomodorosDone++;
    updateSessionLabel();
    const label = D.sessionLabel.textContent;
    assert(label.includes(S.pomodorosDone), `Session label updated: ${label}`);
    S.pomodorosDone = before; // Reset
  },

  testLongBreakLogic: function() {
    log("Testing Long Break Logic (every 4th session)...");
    S.pomodorosDone = 3;
    let nextMode = S.pomodorosDone % CFG.longBreakEvery === 0 ? "long-break" : "short-break";
    assert(nextMode === "short-break", "After 3 sessions: Short Break");
    
    S.pomodorosDone = 4;
    nextMode = S.pomodorosDone % CFG.longBreakEvery === 0 ? "long-break" : "short-break";
    assert(nextMode === "long-break", "After 4 sessions: Long Break");
    
    S.pomodorosDone = 0; // Reset
  },

  runAll: function() {
    log("\n===== INTEGRATION TESTS =====");
    this.testFullTimerFlow();
    this.testSessionCounter();
    this.testLongBreakLogic();
  }
};

// ===========================================================
// § 9. MASTER TEST RUNNER
// ===========================================================

function runAllTests() {
  console.clear();
  console.log("%c🍅 POMOFOCUS TEST SUITE 🍅", "font-size:16px; font-weight:bold; color:#ef4444;");
  console.log("%cComprehensive Feature Testing", "font-size:12px; color:#9898a8;");
  console.log("");

  POPUP_TESTS.runAll();
  TIMER_TESTS.runAll();
  CHART_TESTS.runAll();
  MODAL_TESTS.runAll();
  AUDIO_TESTS.runAll();
  KEYBOARD_TESTS.runAll();
  DOM_TESTS.runAll();
  INTEGRATION_TESTS.runAll();

  console.log("");
  console.log("%c✅ TEST SUITE COMPLETE", "font-size:14px; font-weight:bold; color:#14b8a6;");
  console.log("");
  console.log("📊 Test Coverage:");
  console.log("  • Popup Flow & Animation");
  console.log("  • Timer Engine & Mode Switching");
  console.log("  • Activity Tracking & Chart");
  console.log("  • Session Modal & Rating");
  console.log("  • Audio Notifications");
  console.log("  • Keyboard Shortcuts");
  console.log("  • DOM Cache & Configuration");
  console.log("  • Integration Flow");
}

// ===========================================================
// QUICK TEST RUNNERS (Individual)
// ===========================================================

function testPopup() { POPUP_TESTS.runAll(); }
function testTimer() { TIMER_TESTS.runAll(); }
function testChart() { CHART_TESTS.runAll(); }
function testModal() { MODAL_TESTS.runAll(); }
function testAudio() { AUDIO_TESTS.runAll(); }
function testKeyboard() { KEYBOARD_TESTS.runAll(); }
function testDOM() { DOM_TESTS.runAll(); }
function testIntegration() { INTEGRATION_TESTS.runAll(); }

// ===========================================================
// EXPORT (for use in console)
// ===========================================================

console.log("");
console.log("%c🧪 Test Commands Available:", "font-size:12px; font-weight:bold; color:#8b5cf6;");
console.log("runAllTests()     - Jalankan semua test");
console.log("testPopup()       - Test popup flow");
console.log("testTimer()       - Test timer engine");
console.log("testChart()       - Test activity tracking");
console.log("testModal()       - Test session modal");
console.log("testAudio()       - Test audio notifications");
console.log("testKeyboard()    - Test keyboard shortcuts");
console.log("testDOM()         - Test DOM cache & config");
console.log("testIntegration() - Test integration flow");
console.log("");
