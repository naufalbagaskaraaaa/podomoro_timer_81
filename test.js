/* ══════════════════════════════════════════════════════════════════
   test.js — Comprehensive Test Cases for pomofocus
══════════════════════════════════════════════════════════════════ */

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    return true;
  } else {
    console.error(`❌ FAIL: ${message}`);
    return false;
  }
}

function log(msg) { console.log(`ℹ️ ${msg}`); }

const POPUP_TESTS = {
  runAll: function() {
    log("\n===== POPUP TESTS =====");
    log("Testing Popup Initialization...");
    assert(D.overlay !== null, "Popup overlay element exists");
    assert(D.popup1 !== null, "Popup 1 element exists");
    assert(D.p1Mau !== null, "Popup 1 'Mau' button exists");
    assert(D.p1Enggak !== null, "Popup 1 'Enggak' button exists");
    
    log("Testing Popup Scale Mechanism...");
    const btn = D.p1Mau;
    const initialScale = parseFloat(btn.style.getPropertyValue("--s") || "1");
    assert(initialScale === 1, "Initial scale is 1");
  }
};

const TIMER_TESTS = {
  runAll: function() {
    log("\n===== TIMER TESTS =====");
    log("Testing Timer State...");
    assert(S.mode === "pomodoro", "Default mode is pomodoro");
    assert(S.timeLeft > 0, "timeLeft is positive");
    assert(S.running === false, "Timer initially not running");
    
    log("Testing Start/Pause Timer...");
    setMode("pomodoro");
    startTimer();
    assert(S.running === true, "Timer running after start");
    pauseTimer();
    assert(S.running === false, "Timer paused");
  }
};

const CHART_TESTS = {
  runAll: function() {
    log("\n===== CHART & ACTIVITY TESTS =====");
    log("Testing Chart Initialization...");
    assert(S.activityChart !== null, "Chart instance exists");
    log("Testing Statistics...");
    updateStats();
    assert(D.statTotal !== null, "Total stat element exists");
  }
};

const MODAL_TESTS = {
  runAll: function() {
    log("\n===== SESSION MODAL TESTS =====");
    log("Testing Modal Elements...");
    assert(D.modal !== null, "Modal element exists");
    
    log("Testing Modal Open/Close...");
    openSessionModal();
    assert(!D.modal.classList.contains("is-hidden"), "Modal opens");
    closeSessionModal();
    assert(D.modal.classList.contains("is-hidden"), "Modal closes");
  }
};

const DOM_TESTS = {
  runAll: function() {
    log("\n===== DOM & CONFIGURATION TESTS =====");
    log("Testing Configuration Values...");
    assert(CFG.durations.pomodoro === 25 * 60, "Pomodoro: 25 min");
    assert(CFG.durations["short-break"] === 5 * 60, "Short Break: 5 min");
    
    log("Testing Mode Labels...");
    assert(MODE_LABELS.pomodoro === "POMODORO", "Pomodoro label correct");
  }
};

function runAllTests() {
  console.clear();
  console.log("%c🍅 POMOFOCUS TEST SUITE 🍅", "font-size:16px; font-weight:bold; color:#ef4444;");
  
  POPUP_TESTS.runAll();
  TIMER_TESTS.runAll();
  CHART_TESTS.runAll();
  MODAL_TESTS.runAll();
  DOM_TESTS.runAll();

  console.log("\n%c✅ TEST SUITE COMPLETE", "font-size:14px; font-weight:bold; color:#14b8a6;");
}