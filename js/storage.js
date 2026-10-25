/* Shared browser storage helpers. No server or account is required. */
(function () {
  "use strict";
  const STORAGE_KEY = "habitTrackerChallenges_v1";
  const STATUSES = ["not-done", "partial", "mostly", "completed"];

  function getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  function readChallenges() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Could not read saved challenges:", error);
      return [];
    }
  }
  function saveChallenges(challenges) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
      return true;
    } catch (error) {
      console.error("Could not save challenges:", error);
      alert("Your browser could not save this change. Check that browser storage is enabled.");
      return false;
    }
  }
  function makeId() {
    return "habit-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }
  function dateKeyFromDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function getDateKey(startDateKey, offset) {
    const parts = startDateKey.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + offset);
    return dateKeyFromDate(date);
  }
  function getDayStatus(challenge, dateKey) {
    if (challenge.dayStatuses && challenge.dayStatuses[dateKey]) {
      return challenge.dayStatuses[dateKey];
    }
    // Backwards compatibility with earlier project data.
    if ((challenge.completedDates || []).includes(dateKey)) return "completed";
    return "not-done";
  }
  function isCompleted(challenge, dateKey) {
    return getDayStatus(challenge, dateKey) === "completed";
  }
  function currentStreak(challenge) {
    const today = getTodayKey();
    let cursor = isCompleted(challenge, today) ? today : getDateKey(today, -1);
    let streak = 0;
    while (isCompleted(challenge, cursor)) {
      streak += 1;
      cursor = getDateKey(cursor, -1);
    }
    return streak;
  }
  function countCompleted(challenge) {
    let count = 0;
    for (let day = 0; day < Number(challenge.duration || 0); day += 1) {
      const key = getDateKey(challenge.startDate, day);
      if (isCompleted(challenge, key)) count += 1;
    }
    return count;
  }
  function challengeProgress(challenge) {
    const total = Math.max(1, Number(challenge.duration) || 1);
    return Math.min(100, Math.round((countCompleted(challenge) / total) * 100));
  }
  window.HabitStore = { STORAGE_KEY, STATUSES, getTodayKey, readChallenges, saveChallenges, makeId, getDateKey, getDayStatus, isCompleted, currentStreak, countCompleted, challengeProgress };
})();
