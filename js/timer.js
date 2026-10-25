document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const display = document.getElementById("timer-display");
  const label = document.getElementById("timer-label");
  const subtitle = document.getElementById("timer-subtitle");
  const status = document.getElementById("timer-status");
  const statusDot = document.getElementById("timer-status-dot");
  const ring = document.getElementById("timer-ring");
  const startButton = document.getElementById("timer-start");
  const resetButton = document.getElementById("timer-reset");
  const customForm = document.getElementById("custom-timer-form");
  const customInput = document.getElementById("custom-minutes");
  const celebration = document.getElementById("timer-celebration");
  const confettiLayer = document.getElementById("timer-confetti-layer");

  let totalSeconds = 20 * 60;
  let remainingSeconds = totalSeconds;
  let intervalId = null;
  let running = false;

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(remainder).padStart(2, "0");
  }

  function render() {
    display.textContent = formatTime(remainingSeconds);
    const fraction = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
    const degrees = Math.round(fraction * 360);
    ring.style.background = `conic-gradient(var(--sage) ${degrees}deg, #E8EEE5 ${degrees}deg)`;
    if (window.lucide) window.lucide.createIcons();
  }

  function setStatus(text, active) {
    status.textContent = text;
    statusDot.style.background = active ? "#78977B" : "#B5BDB2";
  }

  function stopInterval() {
    if (intervalId !== null) window.clearInterval(intervalId);
    intervalId = null;
  }

  function updateStartButton() {
    startButton.innerHTML = running
      ? '<i data-lucide="pause"></i><span>Pause timer</span>'
      : '<i data-lucide="play"></i><span>' + (remainingSeconds === totalSeconds ? "Start focus" : "Resume focus") + '</span>';
    if (window.lucide) window.lucide.createIcons();
  }

  function tick() {
    remainingSeconds -= 1;
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      running = false;
      stopInterval();
      render();
      updateStartButton();
      label.textContent = "SESSION COMPLETE";
      subtitle.textContent = "You made time for what matters.";
      setStatus("Session completed", false);
      showCelebration();
      return;
    }
    render();
  }

  function startTimer() {
    if (running) {
      running = false;
      stopInterval();
      setStatus("Paused — take your time", false);
      updateStartButton();
      return;
    }
    if (remainingSeconds <= 0) resetTimer();
    running = true;
    label.textContent = "TIME TO FOCUS";
    subtitle.textContent = "Stay with one task.";
    setStatus("Focus session in progress", true);
    intervalId = window.setInterval(tick, 1000);
    updateStartButton();
  }

  function resetTimer() {
    running = false;
    stopInterval();
    remainingSeconds = totalSeconds;
    label.textContent = "TIME TO FOCUS";
    subtitle.textContent = "A little progress counts.";
    setStatus("Ready when you are", false);
    updateStartButton();
    render();
  }

  function chooseMinutes(minutes) {
    if (running) {
      const ok = confirm("Changing the timer will stop the current session. Continue?");
      if (!ok) return;
    }
    totalSeconds = minutes * 60;
    remainingSeconds = totalSeconds;
    document.querySelectorAll(".preset-button").forEach(function (button) {
      button.classList.toggle("selected", Number(button.dataset.minutes) === minutes);
    });
    resetTimer();
  }

  function makeConfetti() {
    confettiLayer.innerHTML = "";
    const colors = ["#78977B", "#D5A95B", "#A9C5A4", "#D9B8A8", "#456D49"];
    for (let i = 0; i < 44; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "%";
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = (Math.random() * 0.8) + "s";
      piece.style.setProperty("--drift", (Math.random() * 130 - 65) + "px");
      confettiLayer.appendChild(piece);
    }
  }

  function showCelebration() {
    celebration.hidden = false;
    makeConfetti();
    if (window.lucide) window.lucide.createIcons();
  }

  function closeCelebration() {
    celebration.hidden = true;
    confettiLayer.innerHTML = "";
  }

  startButton.addEventListener("click", startTimer);
  resetButton.addEventListener("click", resetTimer);
  document.querySelectorAll(".preset-button").forEach(function (button) {
    button.addEventListener("click", function () {
      chooseMinutes(Number(button.dataset.minutes));
    });
  });

  customForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const minutes = Number(customInput.value);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
      alert("Please enter a whole number from 1 to 240 minutes.");
      customInput.focus();
      return;
    }
    chooseMinutes(minutes);
    document.querySelectorAll(".preset-button").forEach(function (button) {
      button.classList.remove("selected");
    });
    customInput.value = "";
  });

  document.getElementById("timer-celebration-close").addEventListener("click", closeCelebration);
  document.getElementById("timer-celebration-done").addEventListener("click", closeCelebration);
  celebration.addEventListener("click", function (event) {
    if (event.target === celebration) closeCelebration();
  });
  window.addEventListener("beforeunload", stopInterval);

  render();
  updateStartButton();
});
