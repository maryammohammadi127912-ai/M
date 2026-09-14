"use strict";

document.addEventListener("DOMContentLoaded", function () {

    /* =========================================================
       STUDYMATE - FUNCTIONAL FRONTEND
       LocalStorage + Timer + Search + CRUD + Settings
       ========================================================= */

    const STORAGE = {
        schedules: "studyMateSchedules",
        classes: "studyMateClasses",
        studies: "studyMateStudyPlans",
        tasks: "studyMateTasks",
        reminders: "studyMateReminders",
        goals: "studyMateGoals",
        profile: "studyMateProfile",
        dark: "studyMateDarkMode",
        notifications: "studyMateNotifications",
        sound: "studyMateSound",
        language: "studyMateLanguage",
        sessions: "studyMateStudySessions"
    };

    const navItems = document.querySelectorAll(".nav-item");
    const pages = document.querySelectorAll(".page");

    function readData(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return Array.isArray(fallback) ? (Array.isArray(value) ? value : fallback) : (value || fallback);
        } catch (error) {
            return fallback;
        }
    }

    function saveData(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function todayISO() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    function formatDate(value) {
        if (!value) return "No date";
        const d = new Date(value + "T00:00:00");
        if (Number.isNaN(d.getTime())) return value;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    function dateLabel(value) {
        if (!value) return "No date";
        if (value === todayISO()) return "Today";
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const t = tomorrow.toISOString().slice(0, 10);
        if (value === t) return "Tomorrow";
        return formatDate(value);
    }

    function normalizeStatus(status) {
        const value = String(status || "Upcoming").trim().toLowerCase();
        const map = {
            pending: "Upcoming",
            upcoming: "Upcoming",
            ongoing: "In Progress",
            "in progress": "In Progress",
            progress: "In Progress",
            completed: "Done",
            complete: "Done",
            done: "Done",
            overdue: "Overdue"
        };
        return map[value] || "Upcoming";
    }

    function taskStatus(task) {
        if (task.done || normalizeStatus(task.status) === "Done") return "Done";
        if (normalizeStatus(task.status) === "Overdue") return "Overdue";
        if (task.deadline && task.deadline < todayISO()) return "Overdue";
        return normalizeStatus(task.status);
    }

    function statusClass(status) {
        const s = normalizeStatus(status);
        if (s === "Done") return "done";
        if (s === "In Progress") return "progress-status";
        if (s === "Overdue") return "overdue";
        return "pending";
    }

    function actionButtons(type, index) {
        return `<span class="item-actions">
            <button type="button" data-action="edit" data-type="${type}" data-index="${index}">Edit</button>
            <button type="button" class="delete-action" data-action="delete" data-type="${type}" data-index="${index}">Delete</button>
        </span>`;
    }

    function promptStatus(current) {
        const answer = prompt(
            "Choose status:\n1 = Upcoming\n2 = In Progress\n3 = Done\n4 = Overdue",
            current === "In Progress" ? "2" : current === "Done" ? "3" : current === "Overdue" ? "4" : "1"
        );
        if (answer === null) return null;
        const choices = { "1": "Upcoming", "2": "In Progress", "3": "Done", "4": "Overdue" };
        return choices[String(answer).trim()] || normalizeStatus(answer);
    }

    /* =========================================================
       INITIAL DATA
       ========================================================= */

    const defaultSchedules = [
        { date: todayISO(), time: "08:00 - 10:00", title: "🎓 University Class", subject: "Computer Science", status: "Done" },
        { date: todayISO(), time: "11:00 - 12:00", title: "💻 Online Course", subject: "Web Development", status: "Done" },
        { date: todayISO(), time: "13:00 - 14:00", title: "🍽️ Lunch & Break", subject: "Personal", status: "Done" },
        { date: todayISO(), time: "15:00 - 17:00", title: "📚 Study Mathematics", subject: "Study", status: "In Progress" },
        { date: todayISO(), time: "17:30 - 19:00", title: "📝 Homework & Assignments", subject: "Task", status: "Upcoming" },
        { date: todayISO(), time: "19:00 - 19:30", title: "🏃 Exercise", subject: "Personal", status: "Upcoming" },
        { date: todayISO(), time: "22:00", title: "😴 Sleep", subject: "Personal", status: "Upcoming" }
    ];

    const defaultClasses = [
        { icon: "💻", name: "Computer Science", type: "University Class", time: "08:00 - 10:00", teacher: "Dr. Ahmad", mode: "Online", status: "Ongoing" },
        { icon: "🌐", name: "Web Development", type: "Online Course", time: "11:00 - 12:00", teacher: "Prof. John", mode: "Online", status: "Ongoing" },
        { icon: "⚡", name: "Physics", type: "University Class", time: "16:00 - 18:00", teacher: "Dr. Zia", mode: "Online", status: "Upcoming" },
        { icon: "📖", name: "English", type: "Online Course", time: "19:00 - 20:00", teacher: "Ms. Farah", mode: "Online", status: "Upcoming" }
    ];

    const defaultStudies = [
        { subject: "📐 Mathematics", daily: "2 hours/day", weekly: "5 hours/week", progress: 85 },
        { subject: "⚡ Physics", daily: "1.5 hours/day", weekly: "4 hours/week", progress: 70 },
        { subject: "💻 Computer Science", daily: "2 hours/day", weekly: "6 hours/week", progress: 60 },
        { subject: "📖 English", daily: "1 hour/day", weekly: "3 hours/week", progress: 45 }
    ];

    const defaultTasks = [
        { title: "Math Homework", subject: "Mathematics", category: "Homework", deadline: todayISO(), status: "Done", done: true },
        { title: "Physics Assignment", subject: "Physics", category: "Homework", deadline: todayISO(), status: "In Progress", done: false },
        { title: "Web Project", subject: "Computer Science", category: "Projects", deadline: todayISO(), status: "Upcoming", done: false },
        { title: "Clean Room", subject: "House", category: "House", deadline: todayISO(), status: "Upcoming", done: false },
        { title: "Buy Groceries", subject: "Personal", category: "Personal", deadline: todayISO(), status: "Done", done: true }
    ];

    const defaultReminders = [
        { icon: "🎓", title: "University Class", date: todayISO(), time: "08:00 - 10:00" },
        { icon: "💻", title: "Online Course", date: todayISO(), time: "11:00 - 12:00" },
        { icon: "📝", title: "Physics Assignment", date: todayISO(), time: "17:30" },
        { icon: "🛒", title: "Buy Groceries", date: todayISO(), time: "19:00" }
    ];

    const defaultGoals = [
        { icon: "🎯", title: "Daily Goal", current: 2.5, target: 3, unit: "hrs" },
        { icon: "📅", title: "Weekly Goal", current: 16, target: 20, unit: "hrs" },
        { icon: "📆", title: "Monthly Goal", current: 67, target: 80, unit: "hrs" },
        { icon: "🏆", title: "Yearly Goal", current: 756, target: 960, unit: "hrs" }
    ];

    let schedules = readData(STORAGE.schedules, []);
    let classes = readData(STORAGE.classes, []);
    let studies = readData(STORAGE.studies, []);
    let tasks = readData(STORAGE.tasks, []);
    let reminders = readData(STORAGE.reminders, []);
    let goals = readData(STORAGE.goals, []);
    let studySessions = readData(STORAGE.sessions, []);

    if (!schedules.length) { schedules = defaultSchedules; saveData(STORAGE.schedules, schedules); }
    if (!classes.length) { classes = defaultClasses; saveData(STORAGE.classes, classes); }
    if (!studies.length) { studies = defaultStudies; saveData(STORAGE.studies, studies); }
    if (!tasks.length) { tasks = defaultTasks; saveData(STORAGE.tasks, tasks); }
    if (!reminders.length) { reminders = defaultReminders; saveData(STORAGE.reminders, reminders); }
    if (!goals.length) { goals = defaultGoals; saveData(STORAGE.goals, goals); }

    /* =========================================================
       PAGE NAVIGATION
       ========================================================= */

    window.openPage = function (pageName) {
        pages.forEach(p => p.classList.remove("active"));
        navItems.forEach(n => n.classList.remove("active"));
        const page = document.getElementById(pageName);
        const nav = document.querySelector(`.nav-item[data-page="${pageName}"]`);
        if (page) page.classList.add("active");
        if (nav) nav.classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (pageName === "progress") drawCharts();
    };

    navItems.forEach(item => item.addEventListener("click", () => openPage(item.dataset.page)));

    /* =========================================================
       THEME / LIGHT MODE
       ========================================================= */

    const themeBtn = document.getElementById("themeBtn");
    const darkSwitch = document.getElementById("darkSwitch");
    let darkMode = localStorage.getItem(STORAGE.dark);
    if (darkMode === null) darkMode = "true";

    function applyTheme() {
        const dark = darkMode === "true";
        document.body.classList.toggle("light-mode", !dark);
        if (darkSwitch) darkSwitch.checked = dark;
        if (themeBtn) themeBtn.textContent = dark ? "☀" : "☾";
    }
    function setDarkMode(value) {
        darkMode = value ? "true" : "false";
        localStorage.setItem(STORAGE.dark, darkMode);
        applyTheme();
    }
    themeBtn?.addEventListener("click", () => setDarkMode(darkMode !== "true"));
    darkSwitch?.addEventListener("change", e => setDarkMode(e.target.checked));
    applyTheme();

    /* =========================================================
       TIMER: FOCUS -> BREAK -> FOCUS, WITH CYCLES
       ========================================================= */

    const timerDisplay = document.getElementById("timerDisplay");
    const dashboardTimer = document.getElementById("dashboardTimer");
    const startTimer = document.getElementById("startTimer");
    const pauseTimer = document.getElementById("pauseTimer");
    const resetTimer = document.getElementById("resetTimer");
    const dashboardStart = document.getElementById("dashboardStart");
    const dashboardStop = document.getElementById("dashboardStop");
    const focusLength = document.getElementById("focusLength");
    const breakLength = document.getElementById("breakLength");
    const cycleCount = document.getElementById("cycleCount");

    let timerInterval = null;
    let timerRunning = false;
    let timerMode = "focus";
    let currentCycle = 1;
    let timerSeconds = Number(focusLength?.value || 25) * 60;
    let focusElapsedSeconds = 0;

    function focusMinutes() { return Number(focusLength?.value || 25); }
    function breakMinutes() {
        const text = breakLength?.value || "5 minutes";
        return Number.parseInt(text, 10) || 5;
    }
    function totalCycles() { return Number(cycleCount?.value || 4); }
    function formatTime(seconds) {
        return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    }
    function updateTimerDisplay() {
        const value = formatTime(timerSeconds);
        if (timerDisplay) timerDisplay.textContent = value;
        if (dashboardTimer) dashboardTimer.textContent = value;
        const labels = document.querySelectorAll("#timer .timer-circle small, .current-card .timer-circle small");
        labels.forEach(label => label.textContent = timerMode === "focus" ? `Focus • Cycle ${currentCycle}/${totalCycles()}` : `Break • Cycle ${currentCycle}/${totalCycles()}`);
    }

    function playSound() {
        if (localStorage.getItem(STORAGE.sound) !== "true") return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = timerMode === "focus" ? 880 : 660;
            gain.gain.value = 0.06;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch (_) {}
    }

    function showToast(message) {
        let toast = document.getElementById("studyMateToast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "studyMateToast";
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add("show");
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove("show"), 3000);
    }

    function addStudySession(seconds, completed = false) {
        const duration = Math.max(0, Math.floor(Number(seconds) || 0));
        if (duration < 10) return;
        studySessions.push({
            date: todayISO(),
            seconds: duration,
            plannedSeconds: focusMinutes() * 60,
            completed: Boolean(completed),
            createdAt: Date.now()
        });
        saveData(STORAGE.sessions, studySessions);
        renderAll();
    }

    function finishCurrentFocus(completed = false) {
        if (timerMode !== "focus") return;
        const duration = completed ? focusMinutes() * 60 : focusElapsedSeconds;
        addStudySession(duration, completed);
        focusElapsedSeconds = 0;
    }

    function timerFinished() {
        if (timerMode === "focus") {
            finishCurrentFocus(true);
            playSound();
            if (currentCycle < totalCycles()) {
                timerMode = "break";
                timerSeconds = breakMinutes() * 60;
                showToast(`🎉 Focus complete. Break ${currentCycle} started.`);
            } else {
                timerMode = "focus";
                currentCycle = 1;
                timerSeconds = focusMinutes() * 60;
                showToast("🏆 All focus cycles completed!");
            }
        } else {
            playSound();
            currentCycle++;
            timerMode = "focus";
            timerSeconds = focusMinutes() * 60;
            focusElapsedSeconds = 0;
            showToast(`📚 Break finished. Focus cycle ${currentCycle} started.`);
        }
        updateTimerDisplay();
    }

    function startFocusTimer() {
        if (timerRunning) return;
        timerRunning = true;
        timerInterval = setInterval(() => {
            if (timerSeconds > 0) {
                timerSeconds--;
                if (timerMode === "focus") focusElapsedSeconds++;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                timerRunning = false;
                timerFinished();
                startFocusTimer();
            }
        }, 1000);
    }

    function pauseFocusTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        updateTimerDisplay();
    }

    function stopAndRecordTimer() {
        if (timerMode === "focus" && focusElapsedSeconds > 0) {
            addStudySession(focusElapsedSeconds, false);
            showToast(`⏱️ ${formatDuration(focusElapsedSeconds)} study time saved.`);
        }
        focusElapsedSeconds = 0;
        pauseFocusTimer();
        timerMode = "focus";
        currentCycle = 1;
        timerSeconds = focusMinutes() * 60;
        updateTimerDisplay();
    }

    function resetFocusTimer() {
        pauseFocusTimer();
        focusElapsedSeconds = 0;
        timerMode = "focus";
        currentCycle = 1;
        timerSeconds = focusMinutes() * 60;
        updateTimerDisplay();
    }

    startTimer?.addEventListener("click", startFocusTimer);
    dashboardStart?.addEventListener("click", startFocusTimer);
    pauseTimer?.addEventListener("click", pauseFocusTimer);
    dashboardStop?.addEventListener("click", stopAndRecordTimer);
    resetTimer?.addEventListener("click", resetFocusTimer);
    focusLength?.addEventListener("change", resetFocusTimer);
    breakLength?.addEventListener("change", resetFocusTimer);
    cycleCount?.addEventListener("change", resetFocusTimer);
    updateTimerDisplay();

    /* =========================================================
       SCHEDULE - DAILY / WEEKLY / MONTHLY
       ========================================================= */

    let scheduleDate = new Date();
    let scheduleView = "Daily";
    const scheduleDateElement = document.getElementById("scheduleDate");
    const scheduleTabs = document.querySelectorAll("#schedule .tabs .tab");
    const scheduleContainer = document.querySelector("#schedule .full-schedule");

    function isoFromDate(d) { return d.toISOString().slice(0, 10); }
    function startOfWeek(d) {
        const copy = new Date(d);
        const day = copy.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        copy.setDate(copy.getDate() + diff);
        copy.setHours(0,0,0,0);
        return copy;
    }
    function updateScheduleDate() {
        if (!scheduleDateElement) return;
        if (scheduleView === "Daily") {
            scheduleDateElement.textContent = scheduleDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        } else if (scheduleView === "Weekly") {
            const start = startOfWeek(scheduleDate);
            const end = new Date(start); end.setDate(start.getDate() + 6);
            scheduleDateElement.textContent = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
        } else {
            scheduleDateElement.textContent = scheduleDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        }
    }

    function renderSchedule() {
        if (!scheduleContainer) return;
        const selectedISO = isoFromDate(scheduleDate);
        let filtered = schedules.slice();
        if (scheduleView === "Daily") filtered = filtered.filter(x => x.date === selectedISO);
        if (scheduleView === "Weekly") {
            const start = startOfWeek(scheduleDate);
            const end = new Date(start); end.setDate(start.getDate() + 6);
            filtered = filtered.filter(x => x.date >= isoFromDate(start) && x.date <= isoFromDate(end));
        }
        if (scheduleView === "Monthly") {
            const y = scheduleDate.getFullYear();
            const m = scheduleDate.getMonth();
            filtered = filtered.filter(x => {
                const d = new Date((x.date || selectedISO) + "T00:00:00");
                return d.getFullYear() === y && d.getMonth() === m;
            });
        }
        filtered.sort((a,b) => String(a.time).localeCompare(String(b.time)));
        if (!filtered.length) {
            scheduleContainer.innerHTML = `<div class="empty-state">No schedule found for this ${scheduleView.toLowerCase()} view.<br><small>Use + Add Schedule to create one.</small></div>`;
        } else {
            scheduleContainer.innerHTML = filtered.map(item => {
                const index = schedules.indexOf(item);
                const st = normalizeStatus(item.status);
                return `<div class="schedule-row ${st === "Done" ? "completed" : st === "In Progress" ? "active-row" : ""}">
                    <span>${escapeHTML(item.time)}</span>
                    <b>${escapeHTML(item.title)}</b>
                    <em>${escapeHTML(item.subject)}</em>
                    <label class="${statusClass(st)}">${escapeHTML(st)}</label>
                    ${actionButtons("schedule", index)}
                </div>`;
            }).join("");
        }
        updateScheduleDate();
    }

    scheduleTabs.forEach(tab => tab.addEventListener("click", () => {
        scheduleTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        scheduleView = tab.textContent.trim();
        renderSchedule();
    }));

    if (document.querySelectorAll(".schedule-date button").length >= 2) {
        const btns = document.querySelectorAll(".schedule-date button");
        btns[0].addEventListener("click", () => {
            if (scheduleView === "Monthly") scheduleDate.setMonth(scheduleDate.getMonth() - 1);
            else scheduleDate.setDate(scheduleDate.getDate() - (scheduleView === "Weekly" ? 7 : 1));
            renderSchedule();
        });
        btns[1].addEventListener("click", () => {
            if (scheduleView === "Monthly") scheduleDate.setMonth(scheduleDate.getMonth() + 1);
            else scheduleDate.setDate(scheduleDate.getDate() + (scheduleView === "Weekly" ? 7 : 1));
            renderSchedule();
        });
    }

    window.addSchedule = function () {
        const title = prompt("Schedule title:", "Study Mathematics");
        if (!title) return;
        const time = prompt("Time (example: 15:00 - 17:00):", "15:00 - 17:00");
        if (time === null) return;
        const subject = prompt("Subject / Type:", "Study");
        if (subject === null) return;
        const date = prompt("Date (YYYY-MM-DD):", isoFromDate(scheduleDate));
        if (date === null) return;
        const status = promptStatus("Upcoming");
        if (status === null) return;
        schedules.push({ date: date.trim() || todayISO(), time: time.trim(), title: title.trim(), subject: subject.trim(), status });
        saveData(STORAGE.schedules, schedules);
        renderSchedule();
        showToast("Schedule added successfully.");
    };

    /* =========================================================
       CLASSES CRUD
       ========================================================= */

    const classGrid = document.querySelector("#classes .class-grid");
    function renderClasses() {
        if (!classGrid) return;
        classGrid.innerHTML = classes.map((item, index) => `<div class="class-card">
            <div class="class-icon">${escapeHTML(item.icon || "📚")}</div>
            <h3>${escapeHTML(item.name)}</h3>
            <p>${escapeHTML(item.type)}</p>
            <span>${escapeHTML(item.time)}</span>
            <small>${escapeHTML(item.teacher)} • ${escapeHTML(item.mode)}</small>
            <label>${escapeHTML(item.status)}</label>
            ${actionButtons("class", index)}
        </div>`).join("");
    }
    window.addClass = function () {
        const name = prompt("Class name:", "New Class"); if (!name) return;
        const type = prompt("Type:", "University Class"); if (type === null) return;
        const time = prompt("Time:", "10:00 - 11:00"); if (time === null) return;
        const teacher = prompt("Teacher:", "Teacher"); if (teacher === null) return;
        const mode = prompt("Mode:", "Online"); if (mode === null) return;
        const status = prompt("Status: Ongoing / Upcoming / Completed", "Upcoming"); if (status === null) return;
        classes.push({ icon: "📚", name, type, time, teacher, mode, status: normalizeStatus(status) });
        saveData(STORAGE.classes, classes); renderClasses(); showToast("Class added successfully.");
    };

    /* =========================================================
       STUDY PLAN CRUD
       ========================================================= */

    const studyTable = document.querySelector("#study .table");
    function renderStudies() {
        if (!studyTable) return;
        studyTable.innerHTML = `<div class="table-head"><span>Subject</span><span>Study Time</span><span>Goal</span><span>Progress</span></div>` +
            studies.map((item, index) => `<div class="table-row">
                <span>${escapeHTML(item.subject)}</span>
                <span>${escapeHTML(item.daily)}</span>
                <span>${escapeHTML(item.weekly)}</span>
                <div class="mini-progress"><i style="width:${Math.max(0, Math.min(100, Number(item.progress) || 0))}%"></i></div>
                ${actionButtons("study", index)}
            </div>`).join("");
        const total = studies.reduce((sum, x) => sum + (Number(x.progress) || 0), 0);
        const avg = studies.length ? Math.round(total / studies.length) : 0;
        const weeklyGoal = document.querySelector("#study .weekly-goal span");
        const weeklyBar = document.querySelector("#study .weekly-goal .big-progress i");
        if (weeklyGoal) weeklyGoal.textContent = `${Math.round(avg / 5 * 0.2 * 20)} / 20 hours`;
        if (weeklyBar) weeklyBar.style.width = `${avg}%`;
    }
    window.addStudy = function () {
        const subject = prompt("Subject:", "New Subject"); if (!subject) return;
        const daily = prompt("Study time per day:", "1 hour/day"); if (daily === null) return;
        const weekly = prompt("Weekly goal:", "4 hours/week"); if (weekly === null) return;
        let progress = Number(prompt("Progress (0-100):", "0"));
        if (!Number.isFinite(progress)) progress = 0;
        studies.push({ subject, daily, weekly, progress: Math.max(0, Math.min(100, progress)) });
        saveData(STORAGE.studies, studies); renderStudies(); showToast("Study plan added successfully.");
    };

    /* =========================================================
       TASKS CRUD + STATUS + CHECKBOX
       ========================================================= */

    const taskCard = document.querySelector("#tasks .card");
    let currentTaskFilter = "all";
    function renderTasks() {
        if (!taskCard) return;
        const filtered = tasks.map((task, index) => ({ task, index })).filter(({ task }) => currentTaskFilter === "all" || String(task.category || "").toLowerCase() === currentTaskFilter);
        if (!filtered.length) {
            taskCard.innerHTML = `<div class="empty-state">No tasks in this category.</div>`;
        } else {
            taskCard.innerHTML = filtered.map(({task,index}) => {
                const st = taskStatus(task);
                return `<div class="task-row">
                    <input type="checkbox" ${st === "Done" ? "checked" : ""} data-task-index="${index}">
                    <div><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.subject || task.category || "Task")}</small></div>
                    <span>${escapeHTML(formatDate(task.deadline))}</span>
                    <label class="${statusClass(st)}">${escapeHTML(st)}${actionButtons("task", index)}</label>
                </div>`;
            }).join("");
        }
        updateTaskProgress();
    }
    function formatDuration(seconds) {
        const totalMinutes = Math.floor((Number(seconds) || 0) / 60);
        if (totalMinutes < 60) return `${totalMinutes} min`;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    function sessionsForDate(date) {
        return studySessions.filter(s => s.date === date);
    }

    function secondsForDate(date) {
        return sessionsForDate(date).reduce((sum, s) => sum + (Number(s.seconds) || 0), 0);
    }

    function currentStreak() {
        const activeDates = new Set(studySessions.filter(s => (Number(s.seconds) || 0) >= 60).map(s => s.date));
        let d = new Date();
        let streak = 0;
        while (activeDates.has(isoFromDate(d))) {
            streak++;
            d.setDate(d.getDate() - 1);
        }
        return streak;
    }

    function weeklyStudySeconds() {
        const result = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            result.push({ date: isoFromDate(d), seconds: secondsForDate(isoFromDate(d)), label: d.toLocaleDateString("en-US", { weekday: "short" }) });
        }
        return result;
    }

    function updateRealStatistics() {
        const todaySeconds = secondsForDate(todayISO());
        const todayHours = todaySeconds / 3600;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => taskStatus(t) === "Done").length;
        const todayTasks = tasks.filter(t => t.deadline === todayISO());
        const todayDone = todayTasks.filter(t => taskStatus(t) === "Done").length;
        const taskBase = todayTasks.length ? todayDone / todayTasks.length : (totalTasks ? completedTasks / totalTasks : 0);
        const studyBase = Math.min(todayHours / 6, 1);
        const todayProgress = Math.round((taskBase * 50 + studyBase * 50) * 100) / 100;
        const streak = currentStreak();
        const totalSeconds = studySessions.reduce((sum, s) => sum + (Number(s.seconds) || 0), 0);
        const completedSessions = studySessions.filter(s => s.completed && Number(s.plannedSeconds) > 0);
        const avgFocus = completedSessions.length
            ? Math.round(completedSessions.reduce((sum, s) => sum + Math.min(1, (Number(s.seconds) || 0) / Number(s.plannedSeconds)) * 100, 0) / completedSessions.length)
            : 0;

        const progressEl = document.getElementById("todayProgress");
        if (progressEl) progressEl.textContent = `${Math.round(todayProgress)}%`;
        const progressBar = document.querySelector("#dashboard .stats .stat-card:nth-child(1) .progress-line i");
        if (progressBar) progressBar.style.width = `${Math.round(todayProgress)}%`;

        const hoursEl = document.getElementById("studyHours");
        if (hoursEl) hoursEl.textContent = todayHours.toFixed(todayHours % 1 ? 1 : 0);
        const hoursBar = document.querySelector("#dashboard .stats .stat-card:nth-child(2) .progress-line i");
        if (hoursBar) hoursBar.style.width = `${Math.min(100, Math.round(todayHours / 6 * 100))}%`;

        const completedEl = document.getElementById("completedTasks");
        if (completedEl) completedEl.textContent = completedTasks;
        const taskBar = document.querySelector("#dashboard .stats .stat-card:nth-child(3) .progress-line i");
        if (taskBar) taskBar.style.width = `${totalTasks ? Math.round(completedTasks / totalTasks * 100) : 0}%`;
        const taskH2 = document.querySelector("#dashboard .stats .stat-card:nth-child(3) h2");
        if (taskH2) taskH2.textContent = `${completedTasks} / ${totalTasks}`;

        const streakH2 = document.querySelector("#dashboard .stats .stat-card:nth-child(4) h2");
        const streakBar = document.querySelector("#dashboard .stats .stat-card:nth-child(4) .progress-line i");
        if (streakH2) streakH2.textContent = `${streak} Day${streak === 1 ? "" : "s"}`;
        if (streakBar) streakBar.style.width = `${Math.min(100, streak * 10)}%`;

        const progressCards = document.querySelectorAll("#progress .stats .stat-card h2");
        if (progressCards[0]) progressCards[0].textContent = `${(totalSeconds / 3600).toFixed(totalSeconds % 3600 ? 1 : 0)} hrs`;
        if (progressCards[1]) progressCards[1].textContent = `${completedTasks} / ${totalTasks}`;
        if (progressCards[2]) progressCards[2].textContent = `${avgFocus}%`;
        if (progressCards[3]) progressCards[3].textContent = `${streak} Day${streak === 1 ? "" : "s"}`;

        return { todaySeconds, todayHours, completedTasks, totalTasks, streak, totalSeconds, avgFocus, todayProgress, weekly: weeklyStudySeconds() };
    }

    function renderDashboard() {
        updateRealStatistics();
        const timeline = document.querySelector("#dashboard .schedule-card .timeline");
        if (timeline) {
            const todayItems = schedules.filter(x => x.date === todayISO()).sort((a,b) => String(a.time).localeCompare(String(b.time)));
            timeline.innerHTML = todayItems.length ? todayItems.map(x => {
                const st = normalizeStatus(x.status);
                return `<div class="timeline-item ${st === "Done" ? "completed" : st === "In Progress" ? "active-time" : ""}">
                    <span class="time">${escapeHTML(x.time)}</span><div class="dot"></div><div>
                    <strong>${escapeHTML(x.title)}</strong><small>${escapeHTML(x.subject)} • ${escapeHTML(st)}</small></div>
                </div>`;
            }).join("") : `<div class="empty-state">No schedule for today.</div>`;
        }

        const upcoming = document.querySelector("#dashboard .upcoming-card");
        if (upcoming) {
            const items = [];
            schedules.filter(x => x.date === todayISO() && normalizeStatus(x.status) !== "Done").slice(0, 2).forEach(x => items.push({icon:"📅", title:x.title, sub:`Today • ${x.time}`}));
            tasks.filter(x => taskStatus(x) !== "Done").sort((a,b) => String(a.deadline).localeCompare(String(b.deadline))).slice(0, 2).forEach(x => items.push({icon:"📝", title:x.title, sub:`Due • ${formatDate(x.deadline)}`}));
            const head = `<div class="card-header"><div><h3>Upcoming</h3><small>What's coming next?</small></div></div>`;
            upcoming.innerHTML = head + (items.length ? items.slice(0,4).map(x => `<div class="upcoming-item"><span class="small-icon purple">${x.icon}</span><div><strong>${escapeHTML(x.title)}</strong><small>${escapeHTML(x.sub)}</small></div></div>`).join("") : `<div class="empty-state">Nothing upcoming.</div>`);
        }

        const subjectProgress = document.querySelector("#dashboard .subject-progress");
        if (subjectProgress) {
            subjectProgress.innerHTML = studies.map(x => {
                const subject = String(x.subject).replace(/^[^\w]+\s*/, "");
                const pct = Math.max(0, Math.min(100, Number(x.progress) || 0));
                return `<div><span>${escapeHTML(subject)}</span><strong>${pct}%</strong></div><div class="bar"><i style="width:${pct}%"></i></div>`;
            }).join("");
        }
    }

    function updateTaskProgress() {
        const completed = tasks.filter(t => taskStatus(t) === "Done").length;
        const total = tasks.length;
        const el = document.getElementById("completedTasks");
        if (el) el.textContent = completed;
        const stat = document.querySelector("#dashboard .stat-card");
        if (stat) {
            const h2 = stat.querySelector("h2");
            const bar = stat.querySelector(".progress-line i");
            if (h2) h2.textContent = `${completed} / ${total}`;
            if (bar) bar.style.width = `${total ? Math.round(completed / total * 100) : 0}%`;
        updateRealStatistics();
        }
    }
    window.addTask = function () {
        const title = prompt("Task / Homework title:"); if (!title) return;
        const subject = prompt("Subject:", "Computer Science"); if (subject === null) return;
        const category = prompt("Category: Homework / Projects / Personal / House", "Homework"); if (category === null) return;
        const deadline = prompt("Deadline (YYYY-MM-DD):", todayISO()); if (deadline === null) return;
        const status = promptStatus("Upcoming"); if (status === null) return;
        tasks.push({ title, subject, category: category.trim() || "Personal", deadline, status, done: status === "Done" });
        saveData(STORAGE.tasks, tasks); renderTasks(); showToast("Task added successfully.");
    };

    const taskTabs = document.querySelectorAll("#tasks .tabs .tab");
    taskTabs.forEach(tab => tab.addEventListener("click", () => {
        taskTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentTaskFilter = tab.textContent.trim().toLowerCase();
        renderTasks();
    }));

    /* =========================================================
       REMINDERS CRUD
       ========================================================= */

    const reminderList = document.querySelector("#reminders .reminders-list");
    function renderReminders() {
        if (!reminderList) return;
        reminderList.innerHTML = reminders.map((item,index) => `<div class="reminder">
            <span>${escapeHTML(item.icon || "🔔")}</span>
            <div><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(dateLabel(item.date))} • ${escapeHTML(item.time)}</small></div>
            <b>${escapeHTML(dateLabel(item.date))}</b>
            ${actionButtons("reminder", index)}
        </div>`).join("");
    }
    window.addReminder = function () {
        const title = prompt("Reminder title:", "New Reminder"); if (!title) return;
        const date = prompt("Date (YYYY-MM-DD):", todayISO()); if (date === null) return;
        const time = prompt("Time:", "18:00"); if (time === null) return;
        reminders.push({ icon: "🔔", title, date, time });
        saveData(STORAGE.reminders, reminders); renderReminders(); showToast("Reminder added successfully.");
    };

    /* =========================================================
       GOALS CRUD
       ========================================================= */

    const goalGrid = document.querySelector("#goals .goal-grid");
    function renderGoals() {
        if (!goalGrid) return;
        goalGrid.innerHTML = goals.map((item,index) => {
            const current = Number(item.current) || 0;
            const target = Number(item.target) || 1;
            const pct = Math.min(100, Math.round(current / target * 100));
            return `<div class="goal-card">
                <span>${escapeHTML(item.icon || "🎯")}</span>
                <h3>${escapeHTML(item.title)}</h3>
                <strong>${current} / ${target} ${escapeHTML(item.unit || "hrs")}</strong>
                <div class="big-progress"><i style="width:${pct}%"></i></div>
                <small>${pct}% completed</small>
                ${actionButtons("goal", index)}
            </div>`;
        }).join("");
    }
    window.addGoal = function () {
        const title = prompt("Goal name:", "New Goal"); if (!title) return;
        const current = Number(prompt("Current amount:", "0"));
        const target = Number(prompt("Target amount:", "10"));
        const unit = prompt("Unit:", "hrs");
        if (!Number.isFinite(target) || target <= 0) return;
        goals.push({ icon: "🎯", title, current: Number.isFinite(current) ? current : 0, target, unit: unit || "hrs" });
        saveData(STORAGE.goals, goals); renderGoals(); showToast("Goal added successfully.");
    };

    /* =========================================================
       EDIT / DELETE FOR ALL SECTIONS
       ========================================================= */

    function editSchedule(index) {
        const item = schedules[index]; if (!item) return;
        const title = prompt("Schedule title:", item.title); if (title === null) return;
        const time = prompt("Time:", item.time); if (time === null) return;
        const subject = prompt("Subject / Type:", item.subject); if (subject === null) return;
        const date = prompt("Date (YYYY-MM-DD):", item.date); if (date === null) return;
        const status = promptStatus(normalizeStatus(item.status)); if (status === null) return;
        schedules[index] = {...item, title, time, subject, date, status};
        saveData(STORAGE.schedules, schedules); renderSchedule();
    }
    function editClass(index) {
        const item = classes[index]; if (!item) return;
        const name = prompt("Class name:", item.name); if (name === null) return;
        const type = prompt("Type:", item.type); if (type === null) return;
        const time = prompt("Time:", item.time); if (time === null) return;
        const teacher = prompt("Teacher:", item.teacher); if (teacher === null) return;
        const status = prompt("Status:", item.status); if (status === null) return;
        classes[index] = {...item, name, type, time, teacher, status};
        saveData(STORAGE.classes, classes); renderClasses();
    }
    function editStudy(index) {
        const item = studies[index]; if (!item) return;
        const subject = prompt("Subject:", item.subject); if (subject === null) return;
        const daily = prompt("Daily study time:", item.daily); if (daily === null) return;
        const weekly = prompt("Weekly goal:", item.weekly); if (weekly === null) return;
        const progress = Number(prompt("Progress (0-100):", item.progress));
        studies[index] = {...item, subject, daily, weekly, progress: Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : item.progress};
        saveData(STORAGE.studies, studies); renderStudies();
    }
    function editTask(index) {
        const item = tasks[index]; if (!item) return;
        const title = prompt("Task title:", item.title); if (title === null) return;
        const subject = prompt("Subject:", item.subject || ""); if (subject === null) return;
        const category = prompt("Category:", item.category || "Personal"); if (category === null) return;
        const deadline = prompt("Deadline (YYYY-MM-DD):", item.deadline || todayISO()); if (deadline === null) return;
        const status = promptStatus(taskStatus(item)); if (status === null) return;
        tasks[index] = {...item, title, subject, category, deadline, status, done: status === "Done"};
        saveData(STORAGE.tasks, tasks); renderTasks();
    }
    function editReminder(index) {
        const item = reminders[index]; if (!item) return;
        const title = prompt("Reminder title:", item.title); if (title === null) return;
        const date = prompt("Date (YYYY-MM-DD):", item.date); if (date === null) return;
        const time = prompt("Time:", item.time); if (time === null) return;
        reminders[index] = {...item, title, date, time};
        saveData(STORAGE.reminders, reminders); renderReminders();
    }
    function editGoal(index) {
        const item = goals[index]; if (!item) return;
        const title = prompt("Goal name:", item.title); if (title === null) return;
        const current = Number(prompt("Current amount:", item.current));
        const target = Number(prompt("Target amount:", item.target));
        const unit = prompt("Unit:", item.unit || "hrs");
        goals[index] = {...item, title, current: Number.isFinite(current) ? current : item.current, target: Number.isFinite(target) && target > 0 ? target : item.target, unit: unit || item.unit};
        saveData(STORAGE.goals, goals); renderGoals();
    }

    function deleteItem(type, index) {
        const names = {schedule:"schedule", class:"class", study:"study plan", task:"task", reminder:"reminder", goal:"goal"};
        if (!confirm(`Delete this ${names[type] || "item"}?`)) return;
        if (type === "schedule") schedules.splice(index, 1);
        if (type === "class") classes.splice(index, 1);
        if (type === "study") studies.splice(index, 1);
        if (type === "task") tasks.splice(index, 1);
        if (type === "reminder") reminders.splice(index, 1);
        if (type === "goal") goals.splice(index, 1);
        saveData(STORAGE.schedules, schedules); saveData(STORAGE.classes, classes); saveData(STORAGE.studies, studies); saveData(STORAGE.tasks, tasks); saveData(STORAGE.reminders, reminders); saveData(STORAGE.goals, goals);
        renderAll();
        showToast("Item deleted.");
    }

    document.addEventListener("click", function (event) {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const type = button.dataset.type;
        const index = Number(button.dataset.index);
        if (button.dataset.action === "delete") deleteItem(type, index);
        if (button.dataset.action === "edit") {
            if (type === "schedule") editSchedule(index);
            if (type === "class") editClass(index);
            if (type === "study") editStudy(index);
            if (type === "task") editTask(index);
            if (type === "reminder") editReminder(index);
            if (type === "goal") editGoal(index);
        }
    });

    document.addEventListener("change", function (event) {
        if (!event.target.matches("[data-task-index]")) return;
        const index = Number(event.target.dataset.taskIndex);
        if (!tasks[index]) return;
        tasks[index].done = event.target.checked;
        tasks[index].status = event.target.checked ? "Done" : "Upcoming";
        saveData(STORAGE.tasks, tasks);
        renderTasks();
        showToast(event.target.checked ? "Task marked Done." : "Task moved to Upcoming.");
    });

    /* =========================================================
       GLOBAL SEARCH
       ========================================================= */

    const searchInput = document.getElementById("searchInput");
    const searchBox = document.querySelector(".search");
    let searchResults = null;

    function ensureSearchResults() {
        if (searchResults) return searchResults;
        searchResults = document.createElement("div");
        searchResults.id = "globalSearchResults";
        searchBox?.appendChild(searchResults);
        return searchResults;
    }

    function searchData(query) {
        const q = query.toLowerCase().trim();
        if (!q) return [];
        const results = [];
        schedules.forEach((x,i) => { if (`${x.title} ${x.subject} ${x.time} ${x.status}`.toLowerCase().includes(q)) results.push({type:"Schedule", title:x.title, page:"schedule", extra:`${x.date} • ${x.time}`, index:i}); });
        classes.forEach((x,i) => { if (`${x.name} ${x.type} ${x.teacher} ${x.status}`.toLowerCase().includes(q)) results.push({type:"Class", title:x.name, page:"classes", extra:`${x.time} • ${x.teacher}`, index:i}); });
        studies.forEach((x,i) => { if (`${x.subject} ${x.daily} ${x.weekly}`.toLowerCase().includes(q)) results.push({type:"Study Plan", title:x.subject, page:"study", extra:`${x.daily} • ${x.weekly}`, index:i}); });
        tasks.forEach((x,i) => { if (`${x.title} ${x.subject} ${x.category} ${x.deadline} ${taskStatus(x)}`.toLowerCase().includes(q)) results.push({type:"Task", title:x.title, page:"tasks", extra:`${x.category} • ${formatDate(x.deadline)}`, index:i}); });
        reminders.forEach((x,i) => { if (`${x.title} ${x.date} ${x.time}`.toLowerCase().includes(q)) results.push({type:"Reminder", title:x.title, page:"reminders", extra:`${dateLabel(x.date)} • ${x.time}`, index:i}); });
        goals.forEach((x,i) => { if (`${x.title} ${x.unit} ${x.current} ${x.target}`.toLowerCase().includes(q)) results.push({type:"Goal", title:x.title, page:"goals", extra:`${x.current}/${x.target} ${x.unit}`, index:i}); });
        return results.slice(0, 12);
    }

    function renderSearch(query) {
        const box = ensureSearchResults();
        const results = searchData(query);
        if (!query.trim()) { box.classList.remove("show"); box.innerHTML = ""; return; }
        box.classList.add("show");
        box.innerHTML = results.length ? results.map((r,i) => `<button type="button" class="search-result" data-search-page="${r.page}" data-search-index="${r.index}">
            <span>${escapeHTML(r.type)}</span><strong>${escapeHTML(r.title)}</strong><small>${escapeHTML(r.extra)}</small>
        </button>`).join("") : `<div class="search-empty">No result found.</div>`;
    }
    searchInput?.addEventListener("input", e => renderSearch(e.target.value));
    document.addEventListener("click", e => {
        const result = e.target.closest(".search-result");
        if (result) {
            openPage(result.dataset.searchPage);
            searchInput.value = "";
            renderSearch("");
        } else if (!e.target.closest(".search")) {
            searchResults?.classList.remove("show");
        }
    });

    /* =========================================================
       SETTINGS: NOTIFICATIONS / SOUND / LANGUAGE / PROFILE
       ========================================================= */

    const notificationsSwitch = document.getElementById("notificationsSwitch");
    const soundSwitch = document.getElementById("soundSwitch");
    const languageSelect = document.getElementById("languageSelect");

    const notificationsEnabled = localStorage.getItem(STORAGE.notifications);
    const soundEnabled = localStorage.getItem(STORAGE.sound);
    if (notificationsEnabled === null) localStorage.setItem(STORAGE.notifications, "true");
    if (soundEnabled === null) localStorage.setItem(STORAGE.sound, "true");
    if (notificationsSwitch) notificationsSwitch.checked = localStorage.getItem(STORAGE.notifications) === "true";
    if (soundSwitch) soundSwitch.checked = localStorage.getItem(STORAGE.sound) === "true";

    notificationsSwitch?.addEventListener("change", e => {
        localStorage.setItem(STORAGE.notifications, String(e.target.checked));
        showToast(e.target.checked ? "🔔 Notifications enabled." : "🔕 Notifications disabled.");
    });
    soundSwitch?.addEventListener("change", e => {
        localStorage.setItem(STORAGE.sound, String(e.target.checked));
        showToast(e.target.checked ? "🔊 Sound alerts enabled." : "🔇 Sound alerts disabled.");
    });

    function loadProfile() {
        return readData(STORAGE.profile, {name:"Ahmad Rahimi", role:"Student", className:"12", field:"Computer Science", year:"2024 - 2025"});
    }
    function renderProfile() {
        const profile = loadProfile();
        const card = document.querySelector("#profile .profile-card");
        if (!card) return;
        const avatar = card.querySelector(".big-avatar");
        const name = card.querySelector("h2");
        const role = card.querySelector("p");
        const info = card.querySelectorAll(".profile-info strong");
        if (avatar) avatar.textContent = (profile.name || "A").trim().charAt(0).toUpperCase();
        if (name) name.textContent = profile.name;
        if (role) role.textContent = profile.role;
        if (info[0]) info[0].textContent = profile.className;
        if (info[1]) info[1].textContent = profile.field;
        if (info[2]) info[2].textContent = profile.year;
        const mini = document.querySelector(".profile-mini");
        if (mini) {
            const strong = mini.querySelector("strong"); const av = mini.querySelector(".avatar");
            if (strong) strong.textContent = profile.name;
            if (av) av.textContent = (profile.name || "A").trim().charAt(0).toUpperCase();
        }
    }
    document.getElementById("editProfileBtn")?.addEventListener("click", () => {
        const p = loadProfile();
        const name = prompt("Full name:", p.name); if (name === null) return;
        const className = prompt("Class:", p.className); if (className === null) return;
        const field = prompt("Field:", p.field); if (field === null) return;
        const year = prompt("Academic Year:", p.year); if (year === null) return;
        saveData(STORAGE.profile, {...p, name, className, field, year});
        renderProfile(); showToast("Profile updated successfully.");
    });

    const savedLanguage = localStorage.getItem(STORAGE.language) || "English";
    if (languageSelect) languageSelect.value = savedLanguage;
    languageSelect?.addEventListener("change", e => {
        localStorage.setItem(STORAGE.language, e.target.value);
        showToast(e.target.value === "فارسی" ? "زبان فارسی انتخاب شد." : "English selected.");
    });

    /* =========================================================
       NOTIFICATION BELL - SHOW TODAY'S ITEMS
       ========================================================= */

    const notificationButton = document.querySelector(".top-actions button:first-child");
    notificationButton?.addEventListener("click", () => {
        if (localStorage.getItem(STORAGE.notifications) !== "true") {
            showToast("Notifications are disabled in Settings.");
            return;
        }
        const due = tasks.filter(t => t.deadline === todayISO() && taskStatus(t) !== "Done").length;
        const rem = reminders.filter(r => r.date === todayISO()).length;
        showToast(`🔔 Today: ${due} unfinished task(s), ${rem} reminder(s).`);
    });

    /* =========================================================
       PROGRESS CHARTS
       ========================================================= */

    let studyChartInstance = null;
    let progressChartInstance = null;

    function drawCharts() {
        const canvas1 = document.getElementById("studyChart");
        const canvas2 = document.getElementById("progressChart");
        if (typeof Chart === "undefined") return;
        const stats = updateRealStatistics();
        const weekly = stats.weekly;

        if (studyChartInstance) studyChartInstance.destroy();
        if (progressChartInstance) progressChartInstance.destroy();

        if (canvas1) {
            const ctx = canvas1.getContext("2d");
            const gradient = ctx.createLinearGradient(0, 0, 0, 280);
            gradient.addColorStop(0, "rgba(212,175,55,0.38)");
            gradient.addColorStop(1, "rgba(212,175,55,0.02)");
            studyChartInstance = new Chart(ctx, {
                type: "line",
                data: {
                    labels: weekly.map(x => x.label),
                    datasets: [{
                        label: "Study Hours",
                        data: weekly.map(x => Number((x.seconds / 3600).toFixed(2))),
                        borderColor: "#d4af37",
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 7,
                        pointBackgroundColor: "#d4af37",
                        pointBorderColor: "#ffffff",
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: "index" },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: context => ` ${context.parsed.y} hour${context.parsed.y === 1 ? "" : "s"}`
                            }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { precision: 1 }, grid: { color: "rgba(128,128,128,0.14)" } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        if (canvas2) {
            const done = stats.completedTasks;
            const remaining = Math.max(0, stats.totalTasks - done);
            progressChartInstance = new Chart(canvas2.getContext("2d"), {
                type: "doughnut",
                data: {
                    labels: ["Completed", "Remaining"],
                    datasets: [{
                        data: [done, remaining],
                        backgroundColor: ["#d4af37", "rgba(128,128,128,0.18)"],
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: {
                        legend: { position: "bottom", labels: { usePointStyle: true, padding: 18 } },
                        tooltip: { callbacks: { label: context => ` ${context.label}: ${context.raw}` } }
                    }
                }
            });
        }
    }
    window.addEventListener("resize", drawCharts);

    /* =========================================================
       RESET
       ========================================================= */

    window.resetData = function () {
        if (!confirm("Reset all StudyMate data and restore the default data?")) return;
        Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
        localStorage.removeItem("studyMateDarkMode");
        localStorage.removeItem("studyMateNotifications");
        localStorage.removeItem("studyMateSound");
        localStorage.removeItem("studyMateLanguage");
        localStorage.removeItem("studyMateProfile");
        location.reload();
    };

    /* =========================================================
       GLOBAL RENDER
       ========================================================= */

    function renderAll() {
        renderSchedule();
        renderClasses();
        renderStudies();
        renderTasks();
        renderReminders();
        renderGoals();
        renderProfile();
        renderDashboard();
        drawCharts();
    }

    function updateDates() {
        const today = document.getElementById("todayDate");
        if (today) today.textContent = new Date().toLocaleDateString("en-US", { weekday:"long", month:"short", day:"numeric", year:"numeric" });
    }

    updateDates();
    renderAll();
});
