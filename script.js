document.addEventListener("DOMContentLoaded", () => {

  // ---------- ELEMENTS ----------

  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const themeText = document.getElementById("themeText");

  const todayStudy = document.getElementById("todayStudy");
  const completedTasks = document.getElementById("completedTasks");
  const goalProgress = document.getElementById("goalProgress");
  const goalNote = document.getElementById("goalNote");
  const weekStudy = document.getElementById("weekStudy");
  const weeklyChart = document.getElementById("weeklyChart");
  const chartTotal = document.getElementById("chartTotal");

  const goalRing = document.getElementById("goalRing");
  const ringPercent = document.getElementById("ringPercent");
  const goalMessage = document.getElementById("goalMessage");
  const goalStudied = document.getElementById("goalStudied");
  const goalRemaining = document.getElementById("goalRemaining");
  const dailyGoalInput = document.getElementById("dailyGoal");
  const saveGoalButton = document.getElementById("saveGoal");

  const taskForm = document.getElementById("taskForm");
  const taskInput = document.getElementById("taskInput");
  const taskList = document.getElementById("taskList");
  const taskCount = document.getElementById("taskCount");
  const emptyTasks = document.getElementById("emptyTasks");

  const timerDisplay = document.getElementById("timerDisplay");
  const timerStatus = document.getElementById("timerStatus");
  const timerCircle = document.getElementById("timerCircle");
  const startTimerButton = document.getElementById("startTimer");
  const resetTimerButton = document.getElementById("resetTimer");


  // ---------- STORAGE ----------

  const TASKS_KEY = "mindmate_analytics_tasks";
  const STUDY_KEY = "mindmate_analytics_study";
  const GOAL_KEY = "mindmate_analytics_goal";
  const THEME_KEY = "mindmate_analytics_theme";


  function loadJSON(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
      return fallback;
    }
  }


  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("Data could not be saved in this browser.");
    }
  }


  // Use local calendar dates rather than UTC dates.

  function dateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  function formatMinutes(minutes) {
    const safeMinutes = Math.max(0, Math.floor(minutes));
    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;

    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr`;

    return `${hours} hr ${mins} min`;
  }


  // ---------- TASKS ----------

  let tasks = loadJSON(TASKS_KEY, []);

  if (!Array.isArray(tasks)) tasks = [];


  function renderTasks() {
    taskList.replaceChildren();

    tasks.forEach((task) => {
      const item = document.createElement("div");

      item.className =
        "task-item" + (task.completed ? " completed" : "");

      const checkbox = document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.className = "task-check";
      checkbox.checked = Boolean(task.completed);

      checkbox.setAttribute(
        "aria-label",
        `Complete ${task.text}`
      );


      // Updated: award 10 XP when a task is completed for the first time.

      checkbox.addEventListener("change", () => {
        const wasCompleted = Boolean(task.completed);

        task.completed = checkbox.checked;

        if (
          !wasCompleted &&
          task.completed &&
          !task.xpAwarded &&
          window.MindMateGamification
        ) {
          const awarded =
            window.MindMateGamification.awardTaskCompletion();

          if (awarded) {
            task.xpAwarded = true;
          }
        }

        saveJSON(TASKS_KEY, tasks);
        renderTasks();
        updateOverview();
      });


      const text = document.createElement("span");

      text.className = "task-text";
      text.textContent = task.text;


      const deleteButton = document.createElement("button");

      deleteButton.className = "delete-task";
      deleteButton.type = "button";
      deleteButton.textContent = "×";

      deleteButton.setAttribute(
        "aria-label",
        `Delete ${task.text}`
      );


      deleteButton.addEventListener("click", () => {
        tasks = tasks.filter((entry) => entry.id !== task.id);

        saveJSON(TASKS_KEY, tasks);
        renderTasks();
        updateOverview();
      });


      item.append(checkbox, text, deleteButton);
      taskList.appendChild(item);
    });


    const completed = tasks.filter(
      (task) => task.completed
    ).length;

    taskCount.textContent =
      `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;

    emptyTasks.hidden = tasks.length > 0;

    completedTasks.textContent =
      `${completed} / ${tasks.length}`;
  }


  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) return;

    tasks.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      completed: false
    });

    saveJSON(TASKS_KEY, tasks);

    taskInput.value = "";

    renderTasks();
    updateOverview();

    taskInput.focus();
  });


  // ---------- STUDY TIME ----------

  let studyData = loadJSON(STUDY_KEY, {});

  if (
    !studyData ||
    typeof studyData !== "object" ||
    Array.isArray(studyData)
  ) {
    studyData = {};
  }


  function getSecondsForDay(key) {
    const value = Number(studyData[key]);

    return Number.isFinite(value) && value > 0
      ? value
      : 0;
  }


  function addStudySecond() {
    const key = dateKey();

    studyData[key] = getSecondsForDay(key) + 1;

    saveJSON(STUDY_KEY, studyData);
  }


  function getTodayMinutes() {
    return Math.floor(
      getSecondsForDay(dateKey()) / 60
    );
  }


  // ---------- DAILY GOAL ----------

  let dailyGoal = Number(loadJSON(GOAL_KEY, 120));

  if (
    !Number.isFinite(dailyGoal) ||
    dailyGoal < 15 ||
    dailyGoal > 720
  ) {
    dailyGoal = 120;
  }

  dailyGoalInput.value = String(dailyGoal);


  saveGoalButton.addEventListener("click", () => {
    const newGoal = Number(dailyGoalInput.value);

    if (
      !Number.isFinite(newGoal) ||
      newGoal < 15 ||
      newGoal > 720
    ) {
      alert("Please enter a goal between 15 and 720 minutes.");

      dailyGoalInput.value = String(dailyGoal);

      return;
    }

    dailyGoal = Math.round(newGoal);

    dailyGoalInput.value = String(dailyGoal);

    saveJSON(GOAL_KEY, dailyGoal);

    updateOverview();
  });


  function updateGoal() {
    const studied = getTodayMinutes();

    const percent = Math.min(
      100,
      Math.round((studied / dailyGoal) * 100)
    );

    const remaining = Math.max(
      0,
      dailyGoal - studied
    );

    goalProgress.textContent = `${percent}%`;

    goalNote.textContent =
      `Goal: ${formatMinutes(dailyGoal)} per day`;

    ringPercent.textContent = `${percent}%`;

    goalStudied.textContent = formatMinutes(studied);

    goalRemaining.textContent = formatMinutes(remaining);

    const degrees = (percent / 100) * 360;

    goalRing.style.background =
      `conic-gradient(var(--purple) ${degrees}deg, var(--border) ${degrees}deg)`;


    if (percent >= 100) {
      goalMessage.textContent =
        "Amazing! You reached your daily goal!";
    } else if (percent >= 50) {
      goalMessage.textContent =
        "Great progress. Keep it going!";
    } else if (studied > 0) {
      goalMessage.textContent =
        "Nice start! Every minute counts.";
    } else {
      goalMessage.textContent =
        "Start a focus session to work toward your goal.";
    }
  }
    // ---------- WEEKLY CHART ----------

  function updateWeeklyChart() {
    const today = new Date();
    const days = [];

    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date(today);

      date.setDate(today.getDate() - offset);

      const key = dateKey(date);

      days.push({
        key,
        label: date.toLocaleDateString("en", {
          weekday: "short"
        }),
        minutes: Math.floor(getSecondsForDay(key) / 60),
        isToday: offset === 0
      });
    }

    const total = days.reduce(
      (sum, day) => sum + day.minutes,
      0
    );

    const maxMinutes = Math.max(
      30,
      ...days.map((day) => day.minutes)
    );

    weeklyChart.replaceChildren();

    days.forEach((day) => {
      const column = document.createElement("div");
      column.className = "chart-day";

      const value = document.createElement("span");
      value.className = "chart-value";

      value.textContent =
        day.minutes === 0 ? "–" : String(day.minutes);

      value.title =
        `${day.label}: ${formatMinutes(day.minutes)}`;

      const track = document.createElement("div");
      track.className = "bar-track";

      const bar = document.createElement("div");

      bar.className =
        "chart-bar" + (day.isToday ? " today" : "");

      const height = day.minutes === 0
        ? 0
        : Math.max(
            4,
            (day.minutes / maxMinutes) * 100
          );

      bar.style.height = `${height}%`;

      bar.title =
        `${day.label}: ${formatMinutes(day.minutes)}`;

      track.appendChild(bar);

      const label = document.createElement("span");

      label.className = "chart-day-label";
      label.textContent = day.label;

      column.append(value, track, label);

      weeklyChart.appendChild(column);
    });

    weekStudy.textContent = formatMinutes(total);

    chartTotal.textContent =
      `${formatMinutes(total)} total`;
  }


  function updateOverview() {
    todayStudy.textContent =
      formatMinutes(getTodayMinutes());

    updateGoal();
    updateWeeklyChart();

    const completed = tasks.filter(
      (task) => task.completed
    ).length;

    completedTasks.textContent =
      `${completed} / ${tasks.length}`;
  }


  // ---------- FOCUS TIMER ----------

  const FOCUS_SECONDS = 25 * 60;

  let secondsLeft = FOCUS_SECONDS;
  let timerInterval = null;
  let timerRunning = false;


  function displayTime() {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;

    timerDisplay.textContent =
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const elapsed = FOCUS_SECONDS - secondsLeft;

    const degrees =
      (elapsed / FOCUS_SECONDS) * 360;

    const trackColor =
      document.body.classList.contains("dark-mode")
        ? "#342e48"
        : "#eee9fc";

    timerCircle.style.background =
      `conic-gradient(var(--purple) ${degrees}deg, ${trackColor} ${degrees}deg)`;
  }


  function stopTimer() {
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    timerRunning = false;

    startTimerButton.textContent = "▶ Resume focus";
  }


  function startTimer() {
    if (timerRunning) return;

    if (secondsLeft <= 0) {
      secondsLeft = FOCUS_SECONDS;
    }

    timerRunning = true;

    timerStatus.textContent = "Stay focused";

    startTimerButton.textContent = "Ⅱ Pause";

    timerInterval = setInterval(() => {
      if (secondsLeft > 0) {
        secondsLeft -= 1;

        addStudySecond();
        displayTime();

        // Refresh study time and charts as time is recorded.
        updateOverview();
      }

      if (secondsLeft <= 0) {
        stopTimer();

        timerStatus.textContent = "Session complete!";

        startTimerButton.textContent = "▶ Start again";

        updateOverview();

        alert(
          "Focus session complete! Great work. Take a short break."
        );
      }
    }, 1000);
  }


  startTimerButton.addEventListener("click", () => {
    if (timerRunning) {
      stopTimer();
      timerStatus.textContent = "Paused";
    } else {
      startTimer();
    }
  });


  resetTimerButton.addEventListener("click", () => {
    stopTimer();

    secondsLeft = FOCUS_SECONDS;

    timerStatus.textContent = "Ready to focus";

    startTimerButton.textContent = "▶ Start focus";

    displayTime();
  });


  // ---------- DARK MODE ----------

  function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);

    themeIcon.textContent = isDark ? "☀️" : "🌙";

    themeText.textContent =
      isDark ? "Light mode" : "Dark mode";

    themeToggle.setAttribute(
      "aria-label",
      isDark
        ? "Switch to light mode"
        : "Switch to dark mode"
    );

    // Update the timer track when the theme changes.
    displayTime();
  }


  const savedTheme = loadJSON(THEME_KEY, "light");

  applyTheme(savedTheme === "dark");


  themeToggle.addEventListener("click", () => {
    const isDark =
      !document.body.classList.contains("dark-mode");

    applyTheme(isDark);

    saveJSON(THEME_KEY, isDark ? "dark" : "light");
  });


  // ---------- NAVIGATION ----------

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach((item) => {
        item.classList.remove("active");
      });

      link.classList.add("active");
    });
  });


  // ---------- INITIAL RENDER ----------

  renderTasks();
  displayTime();
  updateOverview();

});
/* ===== MindMate AI Gamification Logic ===== */

(function initMindMateGamification() {
  "use strict";

  const STORAGE_KEY = "mindmateGamificationV1";
  const DAILY_XP = 20;
  const XP_PER_LEVEL = 100;

  const badgeDefinitions = [
    {
      id: "first-session",
      icon: "🌱",
      title: "First Step",
      description: "Earn your first 20 XP",
      unlocked: (s) => s.xp >= 20
    },
    {
      id: "three-day-streak",
      icon: "🔥",
      title: "On Fire",
      description: "Reach a 3-day streak",
      unlocked: (s) => s.streak >= 3
    },
    {
      id: "seven-day-streak",
      icon: "🗓️",
      title: "Weekly Warrior",
      description: "Reach a 7-day streak",
      unlocked: (s) => s.streak >= 7
    },
    {
      id: "century",
      icon: "⚡",
      title: "Century Club",
      description: "Earn 100 XP",
      unlocked: (s) => s.xp >= 100
    },
    {
      id: "xp-master",
      icon: "💎",
      title: "XP Master",
      description: "Earn 200 XP",
      unlocked: (s) => s.xp >= 200
    }
  ];


  function localDateKey(date = new Date()) {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  function dayNumber(dateKey) {
    const parts = dateKey.split("-").map(Number);

    return Math.floor(
      Date.UTC(
        parts[0],
        parts[1] - 1,
        parts[2]
      ) / 86400000
    );
  }


  function getInitialState() {
    return {
      xp: 0,
      streak: 0,
      lastActivityDate: "",
      lastClaimDate: ""
    };
  }


  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return getInitialState();

      const parsed = JSON.parse(saved);

      return {
        xp: Number.isFinite(parsed.xp) && parsed.xp >= 0
          ? parsed.xp
          : 0,

        streak: Number.isFinite(parsed.streak) && parsed.streak >= 0
          ? parsed.streak
          : 0,

        lastActivityDate:
          typeof parsed.lastActivityDate === "string"
            ? parsed.lastActivityDate
            : "",

        lastClaimDate:
          typeof parsed.lastClaimDate === "string"
            ? parsed.lastClaimDate
            : ""
      };
    } catch (error) {
      console.warn(
        "Could not load gamification data.",
        error
      );

      return getInitialState();
    }
  }


  let state = loadState();


  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );

      return true;
    } catch (error) {
      console.warn(
        "Could not save gamification data.",
        error
      );

      return false;
    }
  }


  // ---------- BADGES ----------

  function renderBadges() {
    const container =
      document.getElementById("gameBadges");

    if (!container) return;

    const unlockedCount = badgeDefinitions.filter(
      (badge) => badge.unlocked(state)
    ).length;

    document.getElementById("gameBadgeCount").textContent =
      `${unlockedCount} / ${badgeDefinitions.length}`;

    container.replaceChildren();

    badgeDefinitions.forEach((badge) => {
      const isUnlocked = badge.unlocked(state);

      const card = document.createElement("div");

      card.className = `game-badge ${
        isUnlocked ? "is-unlocked" : "is-locked"
      }`;

      const icon = document.createElement("span");

      icon.className = "game-badge-icon";

      icon.textContent = isUnlocked
        ? badge.icon
        : "🔒";

      const title = document.createElement("strong");

      title.textContent = badge.title;

      const description = document.createElement("small");

      description.textContent = isUnlocked
        ? "Achievement unlocked!"
        : badge.description;

      card.append(icon, title, description);

      container.appendChild(card);
    });
  }


  // ---------- UPDATE GAMIFICATION UI ----------

  function render() {
    const level =
      Math.floor(state.xp / XP_PER_LEVEL) + 1;

    const progress = state.xp % XP_PER_LEVEL;

    const today = localDateKey();

    const claimedToday =
      state.lastClaimDate === today;


    document.getElementById("gameXP").textContent =
      `${state.xp} XP`;

    document.getElementById("gameStreak").textContent =
      `${state.streak} ${
        state.streak === 1 ? "day" : "days"
      }`;

    document.getElementById("gameLevel").textContent =
      `Level ${level}`;

    document.getElementById("gameProgressText").textContent =
      `Level ${level} progress`;

    document.getElementById("gameProgressNumbers").textContent =
      `${progress} / ${XP_PER_LEVEL} XP`;

    document.getElementById("gameProgressFill").style.width =
      `${progress}%`;


    const track =
      document.getElementById("gameProgressTrack");

    track.setAttribute(
      "aria-valuenow",
      String(progress)
    );


    const button =
      document.getElementById("gameClaimBtn");

    const status =
      document.getElementById("gameDailyStatus");

    button.disabled = claimedToday;

    button.textContent = claimedToday
      ? "Completed ✓"
      : "Complete Session";

    status.textContent = claimedToday
      ? "Daily reward collected! Come back tomorrow."
      : "Your daily reward is ready!";

    renderBadges();
  }


  function showFeedback(message) {
    document.getElementById("gameFeedback").textContent =
      message;
  }


  // ---------- DAILY REWARD ----------

  function claimDailyReward() {
    const today = localDateKey();

    if (state.lastClaimDate === today) {
      showFeedback(
        "You have already collected today's reward."
      );

      return;
    }

    const previousDate = state.lastActivityDate;

    if (previousDate === today) {
      // Already active today; preserve the current streak.
    } else if (
      previousDate &&
      dayNumber(today) - dayNumber(previousDate) === 1
    ) {
      state.streak += 1;
    } else {
      state.streak = 1;
    }

    const oldXP = state.xp;

    const oldUnlocked = badgeDefinitions
      .filter((badge) => badge.unlocked(state))
      .map((badge) => badge.id);

    state.xp += DAILY_XP;

    state.lastActivityDate = today;
    state.lastClaimDate = today;

    if (!saveState()) {
      // Don't show a successful reward if it could not be saved.
      state.xp = oldXP;

      state = loadState();

      render();

      showFeedback(
        "Couldn't save your reward. Please check browser storage."
      );

      return;
    }

    render();

    const newBadges = badgeDefinitions.filter(
      (badge) =>
        badge.unlocked(state) &&
        !oldUnlocked.includes(badge.id)
    );

    let message =
      `🎉 Great work! You earned ${DAILY_XP} XP!`;

    if (
      Math.floor(oldXP / XP_PER_LEVEL) <
      Math.floor(state.xp / XP_PER_LEVEL)
    ) {
      message += " 🌟 You reached a new level!";
    }

    if (newBadges.length) {
      message +=
        ` 🏆 Badge unlocked: ${
          newBadges.map((badge) => badge.title).join(", ")
        }!`;
    }

    showFeedback(message);
  }
    // ---------- TASK COMPLETION REWARD ----------

  function awardTaskCompletion() {
    const oldXP = state.xp;

    const oldUnlocked = badgeDefinitions
      .filter((badge) => badge.unlocked(state))
      .map((badge) => badge.id);

    state.xp += 10;

    if (!saveState()) {
      state.xp = oldXP;

      render();

      showFeedback(
        "Couldn't save XP. Please check browser storage."
      );

      return false;
    }

    render();

    const newBadges = badgeDefinitions.filter(
      (badge) =>
        badge.unlocked(state) &&
        !oldUnlocked.includes(badge.id)
    );

    let message = "✅ Task completed! +10 XP";

    if (
      Math.floor(oldXP / XP_PER_LEVEL) <
      Math.floor(state.xp / XP_PER_LEVEL)
    ) {
      message += " 🌟 Level up!";
    }

    if (newBadges.length) {
      message +=
        ` 🏆 New badge: ${
          newBadges.map((badge) => badge.title).join(", ")
        }`;
    }

    showFeedback(message);

    return true;
  }


  // Make the task reward function available to the main script.

  window.MindMateGamification = {
    awardTaskCompletion
  };


  // ---------- INITIALIZE GAMIFICATION ----------

  function start() {
    const requiredElements = [
      "gameXP",
      "gameStreak",
      "gameLevel",
      "gameBadgeCount",
      "gameProgressText",
      "gameProgressNumbers",
      "gameProgressTrack",
      "gameProgressFill",
      "gameClaimBtn",
      "gameDailyStatus",
      "gameBadges",
      "gameFeedback"
    ];

    if (
      !requiredElements.every(
        (id) => document.getElementById(id)
      )
    ) {
      console.warn(
        "MindMate Gamification: HTML section not found. Check index.html."
      );

      return;
    }

    document.getElementById("gameClaimBtn")
      .addEventListener("click", claimDailyReward);

    render();
  }


  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      start,
      { once: true }
    );
  } else {
    start();
  }

})();