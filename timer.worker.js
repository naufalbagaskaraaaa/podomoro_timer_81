"use strict";

let endTime = null;
let tickerId = null;

const POLL_MS = 250;

function startPolling() {
  clearInterval(tickerId);
  tickerId = setInterval(() => {
    if (endTime === null) return;

    const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));

    self.postMessage({ type: "tick", timeLeft: remaining });

    if (remaining === 0) {
      clearInterval(tickerId);
      tickerId = null;
      endTime = null;
      self.postMessage({ type: "done" });
    }
  }, POLL_MS);
}

self.onmessage = function (e) {
  const { type, timeLeft } = e.data;

  switch (type) {
    case "start":
      endTime = Date.now() + timeLeft * 1000;
      startPolling();
      break;

    case "resume":
      endTime = Date.now() + timeLeft * 1000;
      startPolling();
      break;

    case "pause":
    case "stop":
      clearInterval(tickerId);
      tickerId = null;
      endTime = null;
      break;
  }
};
