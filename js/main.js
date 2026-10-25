document.addEventListener("DOMContentLoaded", function () {
  if (window.lucide) window.lucide.createIcons();
  renderHomeMonthCalendar();
});

function renderHomeMonthCalendar() {
  const root = document.getElementById("home-month-calendar");
  if (!root || !window.HabitStore) return;
  const store = window.HabitStore;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const challenges = store.readChallenges().filter(item => !item.archived);
  const todayKey = store.getTodayKey();
  const monthName = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(now);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let html = `<div class="month-calendar-top"><span>${monthName}</span><a href="challenges.html" aria-label="Open challenges"><i data-lucide="arrow-up-right"></i></a></div>`;
  html += '<div class="month-calendar-grid month-weekdays">' + weekdays.map(day => `<span>${day}</span>`).join("") + '</div>';
  html += '<div class="month-calendar-grid month-days">';
  for (let i = 0; i < firstWeekday; i++) html += '<span class="month-day blank" aria-hidden="true"></span>';
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const activeOnDate = challenges.filter(challenge => {
      const start = new Date(`${challenge.startDate}T00:00:00`);
      const date = new Date(`${key}T00:00:00`);
      const offset = Math.floor((date - start) / 86400000);
      return offset >= 0 && offset < Number(challenge.duration);
    });
    const complete = activeOnDate.length > 0 && activeOnDate.every(challenge => store.getDayStatus(challenge, key) === "completed");
    const classes = ["month-day", complete ? "is-complete" : "", key === todayKey ? "is-today" : ""].filter(Boolean).join(" ");
    html += `<span class="${classes}" ${complete ? 'title="All active challenges completed"' : ""}>${day}</span>`;
  }
  html += '</div>';
  root.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
}
