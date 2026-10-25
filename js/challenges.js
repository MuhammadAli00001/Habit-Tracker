document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  const store = window.HabitStore;
  const list = document.getElementById("challenge-list");
  const emptyState = document.getElementById("empty-state");
  const form = document.getElementById("custom-challenge-form");
  const durationSelect = document.getElementById("custom-duration");
  const customDaysWrap = document.getElementById("custom-days-wrap");
  const customDaysInput = document.getElementById("custom-days");
  const categorySelect = document.getElementById("custom-category");
  const customCategoryWrap = document.getElementById("custom-category-wrap");
  const customCategoryInput = document.getElementById("custom-category-name");
  const celebration = document.getElementById("celebration");
  const confettiLayer = document.getElementById("confetti-layer");
  const iconMap = {
    "Study Better": "book-open",
    "Exercise": "dumbbell",
    "Read More": "book-open",
    "Better Sleep": "moon",
    "Study": "book-open",
    "Reading": "book-open",
    "Sleep": "moon",
    "Exercise": "dumbbell"
  };
  const statusInfo = {
    "not-done": { label: "Not done", level: "level-0" },
    "partial": { label: "Not done", level: "level-0" },
    "mostly": { label: "Not done", level: "level-0" },
    "completed": { label: "Completed", level: "level-4" }
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }
  function safeIcon(name) {
    return /^[a-z0-9-]+$/i.test(name || "") ? name : "sprout";
  }
  function getDuration() {
    if (durationSelect.value !== "custom") return Number(durationSelect.value);
    const days = Number(customDaysInput.value);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      alert("Please enter a duration between 1 and 365 days.");
      customDaysInput.focus();
      return null;
    }
    return days;
  }
  function createChallenge(name, duration, icon, category) {
    const challenges = store.readChallenges();
    const cleanName = name.trim();
    if (!cleanName) {
      alert("Please enter a challenge name.");
      return;
    }
    const duplicate = challenges.some(function (item) {
      return item.name.toLowerCase() === cleanName.toLowerCase() && !item.archived;
    });
    if (duplicate) {
      alert("You already have an active challenge with that name.");
      return;
    }
    challenges.unshift({
      id: store.makeId(),
      name: cleanName,
      category: category || "Personal",
      icon: safeIcon(icon || iconMap[cleanName] || "sprout"),
      duration: duration,
      startDate: store.getTodayKey(),
      dayStatuses: {},
      completedDates: [],
      createdAt: new Date().toISOString(),
      archived: false
    });
    if (store.saveChallenges(challenges)) renderChallenges();
  }
  function renderCalendar(challenge) {
    let html = "";
    for (let day = 0; day < Number(challenge.duration); day += 1) {
      const dateKey = store.getDateKey(challenge.startDate, day);
      const status = store.getDayStatus(challenge, dateKey);
      const info = statusInfo[status] || statusInfo["not-done"];
      const isToday = dateKey === store.getTodayKey();
      const title = `Day ${day + 1} — ${dateKey} — ${info.label}${isToday ? ". Click to mark today complete or not complete." : ". Past and future days cannot be changed."}`;
      html += `<button type="button" class="day-square ${info.level}${isToday ? " today" : ""}${status === "completed" ? " completed" : ""}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}" aria-pressed="${status === "completed"}" data-challenge-id="${challenge.id}" data-date="${dateKey}" ${isToday ? "" : "disabled"}>
        <span class="day-number">${day + 1}</span>
        <span class="day-status-dot" aria-hidden="true"></span>
      </button>`;
    }
    return html;
  }
  function renderChallenges() {
    const challenges = store.readChallenges().filter(function (challenge) { return !challenge.archived; });
    list.innerHTML = "";
    emptyState.hidden = challenges.length > 0;
    let totalCompleted = 0;
    let bestStreak = 0;

    challenges.forEach(function (challenge) {
      // Migrate older saved challenges to category/status fields without losing completed dates.
      if (!challenge.dayStatuses) challenge.dayStatuses = {};
      if (!challenge.category) challenge.category = "Personal";
      (challenge.completedDates || []).forEach(function (date) {
        if (!challenge.dayStatuses[date]) challenge.dayStatuses[date] = "completed";
      });

      const completedCount = store.countCompleted(challenge);
      const progress = store.challengeProgress(challenge);
      const streak = store.currentStreak(challenge);
      totalCompleted += completedCount;
      bestStreak = Math.max(bestStreak, streak);
      const today = store.getTodayKey();
      const todayStatus = store.getDayStatus(challenge, today);
      const finished = completedCount >= Number(challenge.duration);
      const icon = safeIcon(challenge.icon || iconMap[challenge.name] || "sprout");

      const article = document.createElement("article");
      article.className = "challenge-item";
      article.innerHTML = `
        <div class="challenge-item-top">
          <div class="challenge-title-group">
            <div class="icon-box"><i data-lucide="${icon}"></i></div>
            <div>
              <h3>${escapeHtml(challenge.name)}</h3>
              <p class="challenge-meta">${escapeHtml(challenge.category)} · ${Number(challenge.duration)} days · Started ${escapeHtml(challenge.startDate)}</p>
            </div>
          </div>
          <div class="challenge-actions">
            <button class="icon-button delete-challenge" data-id="${challenge.id}" aria-label="Delete ${escapeHtml(challenge.name)}" title="Delete challenge"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        <div class="challenge-progress-line"><span>Fully completed days</span><strong>${completedCount} of ${Number(challenge.duration)} days · ${progress}%</strong></div>
        <div class="challenge-progress-track" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(challenge.name)} progress"><span style="width:${progress}%"></span></div>
        <div class="challenge-calendar-header">
          <h4>Daily progress calendar</h4>
          <div class="calendar-legend">
            <i class="legend-square level-0" title="Not done"></i><span>Not done</span>
            <i class="legend-square level-4" title="Completed"></i><span>Completed</span>
          </div>
        </div>
        <div class="day-grid">${renderCalendar(challenge)}</div>
        <div class="challenge-bottom">
          <span class="streak-badge"><i data-lucide="flame"></i> ${streak} day${streak === 1 ? "" : "s"} current streak</span>
          <button class="button button-primary complete-button" data-id="${challenge.id}" ${todayStatus === "completed" || finished ? "disabled" : ""}>
            <i data-lucide="${todayStatus === "completed" ? "check" : finished ? "trophy" : "check-circle-2"}"></i>
            ${todayStatus === "completed" ? "Completed today" : finished ? "Challenge completed" : "Complete today"}
          </button>
        </div>`;
      list.appendChild(article);
    });

    // Persist migration for existing challenge data.
    store.saveChallenges(store.readChallenges().map(function (challenge) {
      if (!challenge.dayStatuses) challenge.dayStatuses = {};
      if (!challenge.category) challenge.category = "Personal";
      (challenge.completedDates || []).forEach(function (date) {
        if (!challenge.dayStatuses[date]) challenge.dayStatuses[date] = "completed";
      });
      return challenge;
    }));

    document.getElementById("stat-active").textContent = challenges.length;
    document.getElementById("stat-completed").textContent = totalCompleted;
    document.getElementById("stat-streak").textContent = bestStreak + (bestStreak === 1 ? " day" : " days");
    if (window.lucide) window.lucide.createIcons();
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
  function showCelebration(title, message) {
    document.getElementById("celebration-title").textContent = title;
    document.getElementById("celebration-message").textContent = message;
    celebration.hidden = false;
    makeConfetti();
    if (window.lucide) window.lucide.createIcons();
  }
  function closeCelebration() {
    celebration.hidden = true;
    confettiLayer.innerHTML = "";
  }

  durationSelect.addEventListener("change", function () {
    customDaysWrap.hidden = durationSelect.value !== "custom";
  });
  categorySelect.addEventListener("change", function () {
    customCategoryWrap.hidden = categorySelect.value !== "custom";
    customCategoryInput.required = categorySelect.value === "custom";
  });


  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const name = document.getElementById("custom-name").value;
    const duration = getDuration();
    if (duration === null) return;
    let category = categorySelect.value;
    if (category === "custom") {
      category = customCategoryInput.value.trim();
      if (!category) {
        alert("Please enter your custom category.");
        customCategoryInput.focus();
        return;
      }
    }
    const icon = iconMap[category] || (category === "Reading" ? "book-open" : category === "Exercise" ? "dumbbell" : category === "Sleep" ? "moon" : category === "Study" ? "book-open" : "sprout");
    createChallenge(name, duration, icon, category);
    if (name.trim()) {
      form.reset();
      customDaysWrap.hidden = true;
      customCategoryWrap.hidden = true;
      customCategoryInput.required = false;
    }
    document.getElementById("progress-section").scrollIntoView({ behavior: "smooth" });
  });

  list.addEventListener("click", function (event) {
    const completeButton = event.target.closest(".complete-button");
    if (completeButton && !completeButton.disabled) {
      const id = completeButton.dataset.id;
      const challenges = store.readChallenges();
      const challenge = challenges.find(function (item) { return item.id === id; });
      if (!challenge) return;
      if (!challenge.dayStatuses) challenge.dayStatuses = {};
      challenge.dayStatuses[store.getTodayKey()] = "completed";
      challenge.completedDates = (challenge.completedDates || []).filter(function (date) { return date !== store.getTodayKey(); });
      if (!store.saveChallenges(challenges)) return;
      renderChallenges();
      const finished = store.countCompleted(challenge) >= Number(challenge.duration);
      showCelebration(finished ? "Challenge completed!" : "Day completed!", finished ? `Amazing work! You finished your ${challenge.duration}-day "${challenge.name}" challenge.` : `You showed up for "${challenge.name}" today. Keep going!`);
      return;
    }

    const deleteButton = event.target.closest(".delete-challenge");
    if (deleteButton) {
      const id = deleteButton.dataset.id;
      const challenges = store.readChallenges();
      const challenge = challenges.find(function (item) { return item.id === id; });
      if (!challenge) return;
      if (!confirm(`Delete "${challenge.name}" and its saved progress? This cannot be undone.`)) return;
      store.saveChallenges(challenges.filter(function (item) { return item.id !== id; }));
      renderChallenges();
      return;
    }

    const dayButton = event.target.closest(".day-square");
    if (dayButton) {
      const id = dayButton.dataset.challengeId;
      const date = dayButton.dataset.date;
      if (date !== store.getTodayKey()) return;
      const challenges = store.readChallenges();
      const challenge = challenges.find(function (item) { return item.id === id; });
      if (!challenge) return;
      if (!challenge.dayStatuses) challenge.dayStatuses = {};
      const current = store.getDayStatus(challenge, date);
      challenge.dayStatuses[date] = current === "completed" ? "not-done" : "completed";
      challenge.completedDates = (challenge.completedDates || []).filter(function (savedDate) { return savedDate !== date; });
      if (!store.saveChallenges(challenges)) return;
      renderChallenges();
    }
  });

  document.getElementById("close-celebration").addEventListener("click", closeCelebration);
  document.getElementById("celebration-done").addEventListener("click", closeCelebration);
  celebration.addEventListener("click", function (event) { if (event.target === celebration) closeCelebration(); });
  renderChallenges();
});
