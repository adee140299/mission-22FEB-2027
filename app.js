/**
 * Target: 22 Feb 2027 | Habit & Task Cross-Off Calendar
 * Full client-side application with persistence, audio synthesis, and progress analytics.
 */

(function () {
  'use strict';

  // Constants
  const STORAGE_KEY = 'target_22feb2027_data';
  const TARGET_YEAR = 2027;
  const TARGET_MONTH = 1; // 0-indexed: 1 = February
  const TARGET_DAY = 22;
  const TARGET_DATE = new Date(TARGET_YEAR, TARGET_MONTH, TARGET_DAY, 23, 59, 59);

  // Initial State
  let state = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    activeView: 'month', // 'month' | 'wall'
    soundEnabled: true,
    theme: 'light',
    crossedDates: {}, // { 'YYYY-MM-DD': true }
    dayDetails: {},   // { 'YYYY-MM-DD': { tasks: [{id, text, done}], notes: '' } }
    selectedDateStr: null
  };

  // DOM Elements
  const calendarTitle = document.getElementById('calendarTitle');
  const calendarDaysGrid = document.getElementById('calendarDaysGrid');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const todayBtn = document.getElementById('todayBtn');
  const targetMonthBtn = document.getElementById('targetMonthBtn');
  const themeToggle = document.getElementById('themeToggle');
  const soundToggle = document.getElementById('soundToggle');
  const soundIcon = document.getElementById('soundIcon');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');

  const monthViewBtn = document.getElementById('monthViewBtn');
  const wallViewBtn = document.getElementById('wallViewBtn');
  const monthViewContainer = document.getElementById('monthViewContainer');
  const wallViewContainer = document.getElementById('wallViewContainer');
  const wallMonthsContainer = document.getElementById('wallMonthsContainer');

  // Stats Elements
  const daysLeftCountdown = document.getElementById('daysLeftCountdown');
  const completedDaysCount = document.getElementById('completedDaysCount');
  const completionRateText = document.getElementById('completionRateText');
  const currentStreakCount = document.getElementById('currentStreakCount');
  const bestStreakCount = document.getElementById('bestStreakCount');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressStatsText = document.getElementById('progressStatsText');
  const progressPercentageText = document.getElementById('progressPercentageText');

  // Modal Elements
  const dayModal = document.getElementById('dayModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalCloseActionBtn = document.getElementById('modalCloseActionBtn');
  const modalDateTitle = document.getElementById('modalDateTitle');
  const modalSubInfo = document.getElementById('modalSubInfo');
  const modalStatusBadge = document.getElementById('modalStatusBadge');
  const modalCrossToggleBtn = document.getElementById('modalCrossToggleBtn');
  const modalCrossToggleText = document.getElementById('modalCrossToggleText');
  const newTaskInput = document.getElementById('newTaskInput');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const modalTasksList = document.getElementById('modalTasksList');
  const taskCountPill = document.getElementById('taskCountPill');
  const dayNotesInput = document.getElementById('dayNotesInput');
  const saveNotesBtn = document.getElementById('saveNotesBtn');

  // Confetti Canvas
  const confettiCanvas = document.getElementById('confettiCanvas');
  const ctx = confettiCanvas.getContext('2d');
  let confettiParticles = [];
  let confettiAnimationId = null;

  // Month names
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /* ==========================================================================
     Web Audio API - Synthetic Realistic Pen/Marker Stroke Sound
     ========================================================================== */
  let audioCtx = null;
  function playMarkerStrokeSound() {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const bufferSize = audioCtx.sampleRate * 0.12; // 120ms sound
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate soft friction noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.18;
      }

      const noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;

      // Bandpass filter to simulate felt-tip marker on paper
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, audioCtx.currentTime);
      filter.Q.setValueAtTime(2.5, audioCtx.currentTime);

      // Gain envelope
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.11);

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      noiseNode.start();
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  /* ==========================================================================
     Storage & Persistence
     ========================================================================== */
  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state.crossedDates = parsed.crossedDates || {};
        state.dayDetails = parsed.dayDetails || {};
        if (parsed.soundEnabled !== undefined) state.soundEnabled = parsed.soundEnabled;
        if (parsed.theme) state.theme = parsed.theme;
      }
    } catch (e) {
      console.error('Failed to parse saved calendar data', e);
    }

    // Apply Theme
    if (!state.theme) {
      state.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(state.theme);
    updateSoundIcon();
  }

  function saveData() {
    try {
      const dataToSave = {
        crossedDates: state.crossedDates,
        dayDetails: state.dayDetails,
        soundEnabled: state.soundEnabled,
        theme: state.theme
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save calendar data', e);
    }
    updateStats();
  }

  /* ==========================================================================
     Theme & Sound Toggle Handlers
     ========================================================================== */
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = themeToggle.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    saveData();
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    updateSoundIcon();
    saveData();
  }

  function updateSoundIcon() {
    if (soundIcon) {
      soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
    }
  }

  /* ==========================================================================
     Helpers for Dates & Formatting
     ========================================================================== */
  function formatDateKey(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  function parseDateKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function isDateLocked(year, month, day) {
    const date = new Date(year, month, day, 0, 0, 0);
    return date.getTime() > TARGET_DATE.getTime();
  }

  function isTargetDate(year, month, day) {
    return year === TARGET_YEAR && month === TARGET_MONTH && day === TARGET_DAY;
  }

  function isToday(year, month, day) {
    const now = new Date();
    return (
      now.getFullYear() === year &&
      now.getMonth() === month &&
      now.getDate() === day
    );
  }

  /* ==========================================================================
     Calendar Month View Rendering
     ========================================================================== */
  function renderCalendar() {
    calendarTitle.textContent = `${MONTH_NAMES[state.currentMonth]} ${state.currentYear}`;

    // Clear days
    calendarDaysGrid.innerHTML = '';

    const firstDayIndex = new Date(state.currentYear, state.currentMonth, 1).getDay();
    // Convert Sunday (0) to European style Monday (0) -> Sunday (6)
    const startingDay = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(state.currentYear, state.currentMonth, 0).getDate();

    // Previous month filler days
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDayNum = daysInPrevMonth - i;
      const prevMonth = state.currentMonth === 0 ? 11 : state.currentMonth - 1;
      const prevYear = state.currentMonth === 0 ? state.currentYear - 1 : state.currentYear;
      const dateKey = formatDateKey(prevYear, prevMonth, prevDayNum);
      const isLocked = isDateLocked(prevYear, prevMonth, prevDayNum);

      const cell = createDayCell(prevYear, prevMonth, prevDayNum, dateKey, true, isLocked);
      calendarDaysGrid.appendChild(cell);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(state.currentYear, state.currentMonth, day);
      const isLocked = isDateLocked(state.currentYear, state.currentMonth, day);

      const cell = createDayCell(state.currentYear, state.currentMonth, day, dateKey, false, isLocked);
      calendarDaysGrid.appendChild(cell);
    }

    // Next month filler days to complete grid rows
    const totalCells = startingDay + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonth = state.currentMonth === 11 ? 0 : state.currentMonth + 1;
      const nextYear = state.currentMonth === 11 ? state.currentYear + 1 : state.currentYear;
      const dateKey = formatDateKey(nextYear, nextMonth, i);
      const isLocked = isDateLocked(nextYear, nextMonth, i);

      const cell = createDayCell(nextYear, nextMonth, i, dateKey, true, isLocked);
      calendarDaysGrid.appendChild(cell);
    }
  }

  function createDayCell(year, month, day, dateKey, isOtherMonth, isLocked) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.dataset.dateKey = dateKey;

    if (isOtherMonth) cell.classList.add('other-month');
    if (isToday(year, month, day)) cell.classList.add('today');
    if (isTargetDate(year, month, day)) cell.classList.add('target-day');
    if (isLocked) cell.classList.add('locked');

    const isCrossed = !!state.crossedDates[dateKey];
    if (isCrossed) cell.classList.add('crossed');

    // Details / Notes badge
    const dayData = state.dayDetails[dateKey];
    const hasNotesOrTasks = dayData && ((dayData.notes && dayData.notes.trim()) || (dayData.tasks && dayData.tasks.length > 0));

    // Cell HTML Structure
    cell.innerHTML = `
      <div class="day-top-row">
        <span class="day-number">${day}</span>
        <div class="day-meta-icons">
          ${hasNotesOrTasks ? '<span class="notes-indicator" title="Has tasks or notes"></span>' : ''}
          <button class="open-modal-trigger" title="Open day tasks & notes" aria-label="Details for ${dateKey}">✎</button>
        </div>
      </div>
      ${isTargetDate(year, month, day) ? '<span class="target-badge">GOAL 🎯</span>' : ''}
      <div class="cross-overlay" aria-hidden="true">
        <svg class="cross-svg" viewBox="0 0 100 100">
          <line class="cross-path path-1" x1="12" y1="12" x2="88" y2="88"></line>
          <line class="cross-path path-2" x1="88" y1="12" x2="12" y2="88"></line>
        </svg>
      </div>
      <div class="day-bottom-row">
        ${isTargetDate(year, month, day) ? '<span class="task-preview" style="color:var(--target-gold);font-weight:700;">Final Day</span>' : (hasNotesOrTasks && dayData.tasks && dayData.tasks.length ? `<span class="task-preview">${dayData.tasks.filter(t=>t.done).length}/${dayData.tasks.length} tasks</span>` : '')}
      </div>
    `;

    // Click on the cell toggles the Red Cross directly (fast habit check-off)
    cell.addEventListener('click', (e) => {
      // If user clicked the small edit button, open modal instead
      if (e.target.closest('.open-modal-trigger')) {
        e.stopPropagation();
        openDayModal(dateKey, year, month, day);
        return;
      }

      if (isLocked) {
        showToast('This date is after the mission deadline (22 Feb 2027)');
        return;
      }

      toggleDateCross(dateKey, cell, year, month, day);
    });

    return cell;
  }

  /* ==========================================================================
     Cross-Off Toggle Logic & Audio & Confetti
     ========================================================================== */
  function toggleDateCross(dateKey, cellElement, year, month, day) {
    const isCurrentlyCrossed = !!state.crossedDates[dateKey];
    const willBeCrossed = !isCurrentlyCrossed;

    if (willBeCrossed) {
      state.crossedDates[dateKey] = true;
      playMarkerStrokeSound();

      if (cellElement) {
        cellElement.classList.add('crossed', 'animating');
        setTimeout(() => cellElement.classList.remove('animating'), 350);
      }

      // Check if user crossed off today's date -> celebration!
      const now = new Date();
      if (
        year === now.getFullYear() &&
        month === now.getMonth() &&
        day === now.getDate()
      ) {
        triggerConfetti();
      }
    } else {
      delete state.crossedDates[dateKey];
      if (cellElement) {
        cellElement.classList.remove('crossed');
      }
    }

    saveData();

    // If Wall view is visible, keep it synchronized
    if (state.activeView === 'wall') {
      renderWallRoadmap();
    }
  }

  /* ==========================================================================
     Wall / Roadmap View (All months up to 22 Feb 2027)
     ========================================================================== */
  function renderWallRoadmap() {
    wallMonthsContainer.innerHTML = '';

    // Start from January 2025 or current year through February 2027
    const startYear = Math.min(new Date().getFullYear(), 2026);
    const endYear = TARGET_YEAR;

    for (let y = startYear; y <= endYear; y++) {
      const maxM = (y === TARGET_YEAR) ? TARGET_MONTH : 11;
      for (let m = 0; m <= maxM; m++) {
        const miniCard = createMiniMonthCard(y, m);
        wallMonthsContainer.appendChild(miniCard);
      }
    }
  }

  function createMiniMonthCard(year, month) {
    const card = document.createElement('div');
    card.className = 'mini-month-card';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const startingDay = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let crossedInMonth = 0;
    let totalEligibleDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const isLocked = isDateLocked(year, month, d);
      if (!isLocked) totalEligibleDays++;
      const key = formatDateKey(year, month, d);
      if (state.crossedDates[key]) crossedInMonth++;
    }

    card.innerHTML = `
      <div class="mini-month-header">
        <span class="mini-month-title">${MONTH_NAMES[month]} ${year}</span>
        <span class="mini-month-progress">${crossedInMonth} / ${totalEligibleDays} done</span>
      </div>
      <div class="mini-weekdays">
        <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
      </div>
      <div class="mini-days-grid" id="miniDays-${year}-${month}"></div>
    `;

    const grid = card.querySelector(`#miniDays-${year}-${month}`);

    // Empty lead cells
    for (let i = 0; i < startingDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'mini-day empty';
      grid.appendChild(empty);
    }

    // Month days
    for (let d = 1; d <= daysInMonth; d++) {
      const key = formatDateKey(year, month, d);
      const isLocked = isDateLocked(year, month, d);
      const isTarget = isTargetDate(year, month, d);
      const isCurToday = isToday(year, month, d);
      const isCrossed = !!state.crossedDates[key];

      const miniDay = document.createElement('div');
      miniDay.className = 'mini-day';
      miniDay.textContent = d;
      miniDay.title = `${MONTH_NAMES[month]} ${d}, ${year}`;

      if (isLocked) miniDay.classList.add('locked');
      if (isTarget) miniDay.classList.add('target-day');
      if (isCurToday) miniDay.classList.add('today');
      if (isCrossed) miniDay.classList.add('crossed');

      miniDay.addEventListener('click', () => {
        if (isLocked) return;
        toggleDateCross(key, null, year, month, d);
        miniDay.classList.toggle('crossed');
        // Update header progress pill
        const newCount = Object.keys(state.crossedDates).filter(k => k.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length;
        card.querySelector('.mini-month-progress').textContent = `${newCount} / ${totalEligibleDays} done`;
      });

      grid.appendChild(miniDay);
    }

    return card;
  }

  /* ==========================================================================
     Stats & Analytics Calculation
     ========================================================================== */
  function updateStats() {
    // 1. Days remaining until 22 Feb 2027
    const now = new Date();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetZero = new Date(TARGET_YEAR, TARGET_MONTH, TARGET_DAY);
    const msDiff = targetZero.getTime() - todayZero.getTime();
    const daysLeft = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

    if (daysLeft > 0) {
      daysLeftCountdown.textContent = `${daysLeft} days remaining`;
    } else if (daysLeft === 0) {
      daysLeftCountdown.textContent = `Target day is TODAY! 🎯`;
    } else {
      daysLeftCountdown.textContent = `Mission completed! 🏆`;
    }

    // 2. Count crossed dates
    const crossedKeys = Object.keys(state.crossedDates).filter(k => state.crossedDates[k]);
    const totalCrossed = crossedKeys.length;
    completedDaysCount.textContent = totalCrossed;

    // 3. Mission Completion Calculation
    // Total mission span from a reasonable starting reference (e.g. 1 Jan 2025 or today to 22 Feb 2027)
    // Let's compute remaining days from today plus crossed days
    const totalTargetDaysEstimate = Math.max(totalCrossed + Math.max(0, daysLeft), 1);
    const percentage = Math.min(100, Math.round((totalCrossed / totalTargetDaysEstimate) * 100));

    completionRateText.textContent = `${percentage}% of total mission`;
    progressBarFill.style.width = `${percentage}%`;
    progressStatsText.textContent = `${totalCrossed} days completed`;
    progressPercentageText.textContent = `${percentage}%`;

    // 4. Streaks (Current Streak & Best Streak)
    const streaks = calculateStreaks(crossedKeys);
    currentStreakCount.innerHTML = `${streaks.current} <span class="unit">days</span>`;
    bestStreakCount.innerHTML = `${streaks.best} <span class="unit">days</span>`;

    const streakSub = document.getElementById('streakSub');
    if (streaks.current >= 7) {
      streakSub.textContent = `Super on fire! 🔥 Keep it up!`;
    } else if (streaks.current > 0) {
      streakSub.textContent = `Great momentum! Keep going!`;
    } else {
      streakSub.textContent = `Cross off today to start streak!`;
    }
  }

  function calculateStreaks(crossedKeys) {
    if (crossedKeys.length === 0) return { current: 0, best: 0 };

    // Sort keys chronologically
    const sorted = [...crossedKeys].sort();
    const dateSet = new Set(sorted);

    // Calculate best streak
    let best = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (let key of sorted) {
      const cur = parseDateKey(key);
      if (prevDate) {
        const diffDays = Math.round((cur - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > best) best = tempStreak;
      prevDate = cur;
    }

    // Calculate current streak
    let current = 0;
    const now = new Date();
    const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    let checkDate;
    if (dateSet.has(todayKey)) {
      checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateSet.has(yesterdayKey)) {
      checkDate = yesterday;
    } else {
      return { current: 0, best };
    }

    while (true) {
      const key = formatDateKey(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      if (dateSet.has(key)) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { current, best: Math.max(best, current) };
  }

  /* ==========================================================================
     Day Detail & Task Modal
     ========================================================================== */
  function openDayModal(dateKey, year, month, day) {
    state.selectedDateStr = dateKey;
    const dateObj = new Date(year, month, day);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const fullDateText = `${dayName}, ${MONTH_NAMES[month]} ${day}, ${year}`;

    modalDateTitle.textContent = fullDateText;

    // Sub-info: Countdown or relative to target
    const targetDiff = Math.ceil((TARGET_DATE - dateObj) / (1000 * 60 * 60 * 24));
    if (isTargetDate(year, month, day)) {
      modalSubInfo.textContent = '🌟 This is the Grand Target Deadline Date!';
    } else if (targetDiff > 0) {
      modalSubInfo.textContent = `${targetDiff} days before the 22 Feb 2027 milestone`;
    } else {
      modalSubInfo.textContent = 'Date beyond target deadline';
    }

    refreshModalUI();

    dayModal.classList.add('active');
    dayModal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    dayModal.classList.remove('active');
    dayModal.setAttribute('aria-hidden', 'true');
    state.selectedDateStr = null;
    // Re-render month cell in case tasks/notes changed
    renderCalendar();
  }

  function refreshModalUI() {
    const key = state.selectedDateStr;
    if (!key) return;

    const isCrossed = !!state.crossedDates[key];

    // Status Badge
    if (isCrossed) {
      modalStatusBadge.textContent = 'Completed ❌';
      modalStatusBadge.className = 'modal-status-badge completed';
      modalCrossToggleBtn.classList.add('is-done');
      modalCrossToggleText.textContent = 'Mark as Not Done (Remove Red X)';
    } else {
      modalStatusBadge.textContent = 'Incomplete';
      modalStatusBadge.className = 'modal-status-badge';
      modalCrossToggleBtn.classList.remove('is-done');
      modalCrossToggleText.textContent = 'Mark Day as Done (Slash Red X)';
    }

    // Load Tasks & Notes
    const data = state.dayDetails[key] || { tasks: [], notes: '' };
    dayNotesInput.value = data.notes || '';

    renderModalTasksList(data.tasks || []);
  }

  function renderModalTasksList(tasks) {
    modalTasksList.innerHTML = '';
    const completedCount = tasks.filter(t => t.done).length;
    taskCountPill.textContent = `${completedCount} / ${tasks.length} done`;

    if (tasks.length === 0) {
      modalTasksList.innerHTML = '<li style="color:var(--text-dim);font-size:0.85rem;padding:6px 0;">No specific sub-tasks added for this day yet.</li>';
      return;
    }

    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';

      const label = document.createElement('label');
      label.className = `task-label ${task.done ? 'task-done' : ''}`;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.addEventListener('change', () => {
        task.done = checkbox.checked;
        saveModalDayData();
      });

      const span = document.createElement('span');
      span.textContent = task.text;

      label.appendChild(checkbox);
      label.appendChild(span);

      const delBtn = document.createElement('button');
      delBtn.className = 'task-del-btn';
      delBtn.innerHTML = '🗑️';
      delBtn.title = 'Delete task';
      delBtn.addEventListener('click', () => {
        const curData = state.dayDetails[state.selectedDateStr];
        curData.tasks = curData.tasks.filter(t => t.id !== task.id);
        saveModalDayData();
      });

      li.appendChild(label);
      li.appendChild(delBtn);
      modalTasksList.appendChild(li);
    });
  }

  function saveModalDayData() {
    const key = state.selectedDateStr;
    if (!key) return;

    if (!state.dayDetails[key]) {
      state.dayDetails[key] = { tasks: [], notes: '' };
    }

    state.dayDetails[key].notes = dayNotesInput.value;
    saveData();
    refreshModalUI();
  }

  function addTaskToCurrentDay() {
    const text = newTaskInput.value.trim();
    if (!text) return;

    const key = state.selectedDateStr;
    if (!key) return;

    if (!state.dayDetails[key]) {
      state.dayDetails[key] = { tasks: [], notes: '' };
    }

    state.dayDetails[key].tasks.push({
      id: Date.now().toString(),
      text: text,
      done: false
    });

    newTaskInput.value = '';
    saveModalDayData();
  }

  /* ==========================================================================
     Confetti Animation Engine (Lightweight & Zero-Dependency)
     ========================================================================== */
  function resizeConfettiCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function triggerConfetti() {
    resizeConfettiCanvas();
    confettiParticles = [];
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];

    for (let i = 0; i < 90; i++) {
      confettiParticles.push({
        x: confettiCanvas.width / 2 + (Math.random() * 80 - 40),
        y: confettiCanvas.height / 2 + (Math.random() * 80 - 40),
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        velX: (Math.random() - 0.5) * 16,
        velY: Math.random() * -14 - 6,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        life: 0
      });
    }

    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    animateConfetti();
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let activeParticles = 0;

    for (let p of confettiParticles) {
      p.x += p.velX;
      p.y += p.velY;
      p.velY += 0.45; // gravity
      p.rotation += p.rotSpeed;
      p.life++;

      if (p.life > 40) {
        p.opacity -= 0.02;
      }

      if (p.opacity > 0 && p.y < confettiCanvas.height + 20) {
        activeParticles++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      }
    }

    if (activeParticles > 0) {
      confettiAnimationId = requestAnimationFrame(animateConfetti);
    } else {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  /* ==========================================================================
     Backup & Restore (Export / Import)
     ========================================================================== */
  function exportBackup() {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      crossedDates: state.crossedDates,
      dayDetails: state.dayDetails,
      soundEnabled: state.soundEnabled,
      theme: state.theme
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup successfully exported!');
  }

  function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.crossedDates) {
          state.crossedDates = imported.crossedDates;
          state.dayDetails = imported.dayDetails || {};
          if (imported.soundEnabled !== undefined) state.soundEnabled = imported.soundEnabled;
          if (imported.theme) applyTheme(imported.theme);

          saveData();
          renderCalendar();
          if (state.activeView === 'wall') renderWallRoadmap();
          showToast('Data successfully restored!');
        } else {
          showToast('Invalid backup file format');
        }
      } catch (err) {
        showToast('Error reading backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset file input
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #0f172a;
      color: #ffffff;
      padding: 10px 20px;
      border-radius: 999px;
      font-size: 0.88rem;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 3000;
      opacity: 0;
      transition: opacity 0.25s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.style.opacity = '1');
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2800);
  }

  /* ==========================================================================
     Event Listeners & View Switches
     ========================================================================== */
  function setupEventListeners() {
    // Navigation
    prevBtn.addEventListener('click', () => {
      if (state.currentMonth === 0) {
        state.currentMonth = 11;
        state.currentYear--;
      } else {
        state.currentMonth--;
      }
      renderCalendar();
    });

    nextBtn.addEventListener('click', () => {
      if (state.currentMonth === 11) {
        state.currentMonth = 0;
        state.currentYear++;
      } else {
        state.currentMonth++;
      }
      renderCalendar();
    });

    todayBtn.addEventListener('click', () => {
      const now = new Date();
      state.currentYear = now.getFullYear();
      state.currentMonth = now.getMonth();
      renderCalendar();
    });

    targetMonthBtn.addEventListener('click', () => {
      state.currentYear = TARGET_YEAR;
      state.currentMonth = TARGET_MONTH;
      renderCalendar();
    });

    // Theme & Sound
    themeToggle.addEventListener('click', toggleTheme);
    soundToggle.addEventListener('click', toggleSound);

    // Export & Import
    exportBtn.addEventListener('click', exportBackup);
    importInput.addEventListener('change', importBackup);

    // View Switching
    monthViewBtn.addEventListener('click', () => {
      state.activeView = 'month';
      monthViewBtn.classList.add('active');
      wallViewBtn.classList.remove('active');
      monthViewContainer.style.display = 'block';
      wallViewContainer.style.display = 'none';
      renderCalendar();
    });

    wallViewBtn.addEventListener('click', () => {
      state.activeView = 'wall';
      wallViewBtn.classList.add('active');
      monthViewBtn.classList.remove('active');
      monthViewContainer.style.display = 'none';
      wallViewContainer.style.display = 'block';
      renderWallRoadmap();
    });

    // Modal Events
    closeModalBtn.addEventListener('click', closeModal);
    modalCloseActionBtn.addEventListener('click', closeModal);
    dayModal.addEventListener('click', (e) => {
      if (e.target === dayModal) closeModal();
    });

    modalCrossToggleBtn.addEventListener('click', () => {
      const key = state.selectedDateStr;
      if (!key) return;
      const date = parseDateKey(key);
      toggleDateCross(key, null, date.getFullYear(), date.getMonth(), date.getDate());
      refreshModalUI();
    });

    addTaskBtn.addEventListener('click', addTaskToCurrentDay);
    newTaskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTaskToCurrentDay();
    });

    saveNotesBtn.addEventListener('click', () => {
      saveModalDayData();
      showToast('Notes saved!');
    });

    // Window resize for confetti
    window.addEventListener('resize', resizeConfettiCanvas);

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dayModal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  /* ==========================================================================
     Initialization
     ========================================================================== */
  function init() {
    loadData();
    setupEventListeners();
    renderCalendar();
    updateStats();
    resizeConfettiCanvas();
  }

  // Start on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
