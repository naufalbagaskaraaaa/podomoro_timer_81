"use strict";

(function () {
  const KEYS = [
    "pomo_activity",
    "pomo_sessions",
    "pomo_durations",
    "pomo_history",
  ];

  window.__resetApp = function () {
    KEYS.forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
    console.log("[Reset] Semua data dihapus. Reloading...");
    window.location.reload();
  };

  window.__exportData = function () {
    const data = {};
    KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v) data[k] = JSON.parse(v);
    });
    console.log("[Export]", JSON.stringify(data, null, 2));
    return data;
  };

  const TESTS = {
    pass: 0,
    fail: 0,

    assert(condition, message) {
      if (condition) {
        console.log(
          "%c[✅ PASS]%c " + message,
          "color: #4ade80; font-weight: bold;",
          "color: inherit;",
        );
        this.pass++;
      } else {
        console.error("[❌ FAIL] " + message);
        this.fail++;
      }
    },

    runAll() {
      console.log("\n=========================================");
      console.log("🚀 MULAI SYSTEM & INTEGRATION TEST 🚀");
      console.log("=========================================\n");

      this.pass = 0;
      this.fail = 0;

      this.testUnitSecurity();
      this.testUnitLocalStorage();
      this.testIntegrationTabs();
      this.testIntegrationButtons();

      console.log("\n=========================================");
      console.log(`📊 HASIL TEST: ${this.pass} BERHASIL | ${this.fail} GAGAL`);
      if (this.fail === 0) {
        console.log("🎉 Semua requirements dan fitur utama terpenuhi!\n");
      }
    },

    testUnitSecurity() {
      if (!window.SEC) {
        console.warn(
          "⚠️ Skip Test SEC: Objek SEC tidak terexpose ke global scope.",
        );
        return;
      }
      this.assert(
        window.SEC.clampInt("999", 0, 100) === 100,
        "UNIT: SEC.clampInt batas atas (100) berfungsi.",
      );
      this.assert(
        window.SEC.clampInt("-50", 0, 100) === 0,
        "UNIT: SEC.clampInt batas bawah (0) berfungsi.",
      );
    },

    testUnitLocalStorage() {
      const testKey = "P_TEST_VAL";
      localStorage.setItem(testKey, "sukses");
      this.assert(
        localStorage.getItem(testKey) === "sukses",
        "UNIT: Browser mendukung penyimpanan data LocalStorage.",
      );
      localStorage.removeItem(testKey);
    },

    testIntegrationTabs() {
      const tabs = document.querySelectorAll(".mtab");
      if (tabs.length < 3) {
        this.assert(
          false,
          "INTEGRATION: Gagal menemukan elemen 3 Mode Tab Timer (Pomodoro/Short/Long) di HTML.",
        );
        return;
      }

      tabs[1].click();
      this.assert(
        tabs[1].classList.contains("active"),
        "INTEGRATION: Mode Tab otomatis berubah menjadi 'active' setelah diklik.",
      );
      this.assert(
        !tabs[0].classList.contains("active"),
        "INTEGRATION: Mode Tab sebelumnya me-nonaktifkan status.",
      );

      tabs[0].click();
    },

    testIntegrationButtons() {
      const btnPlus = document.getElementById("btn-plus");
      const btnMinus = document.getElementById("btn-minus");
      const dMin = document.getElementById("d-min");

      if (!btnPlus || !btnMinus || !dMin)
        return this.assert(
          false,
          "INTEGRATION: Gagal menemukan elemen Tombol Timer (+ / -).",
        );

      const initialMin = parseInt(dMin.textContent, 10);
      btnPlus.click();
      this.assert(
        parseInt(dMin.textContent, 10) === initialMin + 1,
        "INTEGRATION: Tombol [+ 1 min] berhasil menambah waktu di antarmuka.",
      );

      btnMinus.click();
      this.assert(
        parseInt(dMin.textContent, 10) === initialMin,
        "INTEGRATION: Tombol [- 1 min] berhasil mengurangi waktu di antarmuka.",
      );
    },
  };

  window.__runTests = () => TESTS.runAll();

  window.addEventListener("load", () => {
    setTimeout(() => TESTS.runAll(), 1000);
  });

  console.log("%c[Dev Tools] tersedia:", "color: #4ade80; font-weight: bold;");
  console.log(
    "  window.__runTests()   — jalankan seluruh kebutuhan test (Unit/Integration/System)",
  );
  console.log("  window.__resetApp()   — hapus semua data & reload");
  console.log("  window.__exportData() — lihat semua data tersimpan");
})();
