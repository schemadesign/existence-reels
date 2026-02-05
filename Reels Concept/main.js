const container = document.getElementById('visualization');

const pillarColors = {
  work: '#4a9eff',
  life: '#50c878',
  growth: '#ffaa50',
  rest: '#b482ff'
};

// Activity colors matching the app's activity list
const categoryColors = {
  // C
  chores: '#8b9dc3',
  church: '#a8d5ba',
  cleaning: '#9eb8d9',
  // E
  entertainment: '#e8a87c',
  exercise: '#85dcb8',
  // F
  finances: '#c9b1ff',
  // H
  hobbies: '#f6c065',
  // L
  learning: '#7ecfc0',
  // M
  meal: '#f4a683',
  meeting: '#82b4e5',
  // N
  nap: '#c9a0dc',
  // O
  overnight: '#9b8ec2',
  // P
  'personal care': '#e8b4c8',
  // Q
  'quiet time': '#b8d4e8',
  // S
  shopping: '#f2b880',
  socializing: '#f7c59f',
  // T
  travel: '#7dd3c0',

  // Map existing data categories to colors
  // Work-related
  planning: '#82b4e5',
  meetings: '#82b4e5',
  'deep work': '#7ecfc0',
  email: '#9eb8d9',
  admin: '#c9b1ff',
  review: '#8b9dc3',
  calls: '#82b4e5',
  // Life-related
  'meal prep': '#f4a683',
  cooking: '#f4a683',
  errands: '#8b9dc3',
  family: '#f7c59f',
  friends: '#f7c59f',
  // Growth-related
  reading: '#7ecfc0',
  gym: '#85dcb8',
  running: '#85dcb8',
  yoga: '#e8b4c8',
  meditation: '#b8d4e8',
  // Rest-related
  sleep: '#9b8ec2'
};

let allData = [];
let filteredData = [];
let reflectionsData = {};
let currentView = 'day';
let currentDate = null; // YYYY-MM-DD
let currentWeek = null; // YYYY-WW
let currentMonth = null; // YYYY-MM
let currentYear = null; // YYYY
let currentPillar = 'all';
let currentCategory = 'all';
let showEnergyHeight = true;

const moodColors = {
  happy: '#50c878',
  content: '#7ec8a3',
  peaceful: '#88c9bf',
  grateful: '#5fb3a1',
  excited: '#ffaa50',
  anxious: '#f0a060',
  tired: '#a0a0c0',
  overwhelmed: '#c080a0',
  sad: '#7090c0',
  frustrated: '#e07070'
};

// Utility functions
function formatTimeShort(date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${ampm}` : `${hour}:${String(m).padStart(2, '0')}${ampm}`;
}

function formatDuration(mins) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getDayStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeekKey(date) {
  const d = new Date(date);
  const week = getWeekNumber(d);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDayKey(date) {
  return getDayStart(new Date(date)).toISOString().split('T')[0];
}

function filterByDay(data, dayStr) {
  return data.filter(item => getDayKey(item.start) === dayStr);
}

function filterByWeek(data, weekKey) {
  return data.filter(item => getWeekKey(new Date(item.start)) === weekKey);
}

function filterByMonth(data, monthKey) {
  return data.filter(item => getMonthKey(new Date(item.start)) === monthKey);
}

function filterByYear(data, year) {
  return data.filter(item => new Date(item.start).getFullYear() === parseInt(year));
}

function getUniqueDays(data) {
  const days = new Set();
  data.forEach(item => days.add(getDayKey(item.start)));
  return Array.from(days).sort();
}

function getUniqueWeeks(data) {
  const weeks = new Set();
  data.forEach(item => weeks.add(getWeekKey(new Date(item.start))));
  return Array.from(weeks).sort();
}

function getUniqueMonths(data) {
  const months = new Set();
  data.forEach(item => months.add(getMonthKey(new Date(item.start))));
  return Array.from(months).sort();
}

function getUniqueYears(data) {
  const years = new Set();
  data.forEach(item => years.add(new Date(item.start).getFullYear()));
  return Array.from(years).sort();
}

function getUniquePillars(data) {
  const pillars = new Set();
  data.forEach(item => pillars.add(item.pillar));
  return Array.from(pillars).sort();
}

function getUniqueCategories(data) {
  const categories = new Set();
  data.forEach(item => categories.add(item.category));
  return Array.from(categories).sort();
}

function applyFilters() {
  filteredData = allData.filter(item => {
    if (currentPillar !== 'all' && item.pillar !== currentPillar) return false;
    if (currentCategory !== 'all' && item.category !== currentCategory) return false;
    return true;
  });
}

function getReflectionForDate(dateStr) {
  return reflectionsData[dateStr] || null;
}

// Tooltip
const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
document.body.appendChild(tooltip);

function showTooltip(e, item) {
  const start = new Date(item.start);
  const end = new Date(item.end);
  const dateKey = getDayKey(item.start);
  const dailyReflection = getReflectionForDate(dateKey);

  let reflectionHtml = '';
  if (dailyReflection) {
    const moodColor = moodColors[dailyReflection.mood] || '#888';
    reflectionHtml = `
      <div class="tooltip-reflection">
        <div class="tooltip-mood" style="color: ${moodColor}">Mood: ${dailyReflection.mood}</div>
        <div class="tooltip-reflection-text">"${dailyReflection.reflection}"</div>
      </div>
    `;
  } else if (item.reflection) {
    reflectionHtml = `<div style="margin-top: 8px; font-style: italic; color: #777; font-size: 11px;">"${item.reflection}"</div>`;
  }

  tooltip.innerHTML = `
    <div class="tooltip-title">${item.title}</div>
    <div class="tooltip-time">${formatTimeShort(start)} – ${formatTimeShort(end)} (${formatDuration(item.duration)})</div>
    <div class="tooltip-meta">
      <span class="tooltip-energy">Energy: ${item.energyRating}/10</span>
      <span>${item.place}</span>
      <span>${item.category}</span>
    </div>
    ${reflectionHtml}
  `;
  tooltip.classList.add('visible');
  moveTooltip(e);
}

function moveTooltip(e) {
  tooltip.style.left = `${e.pageX + 15}px`;
  tooltip.style.top = `${e.pageY - 10}px`;
}

function hideTooltip() {
  tooltip.classList.remove('visible');
}

function addBlockEvents(block, item) {
  block.addEventListener('mouseenter', (e) => showTooltip(e, item));
  block.addEventListener('mousemove', moveTooltip);
  block.addEventListener('mouseleave', hideTooltip);
}

// Get color for a category
function getCategoryColor(category, pillar) {
  return categoryColors[category] || pillarColors[pillar] || '#888';
}

// Create a timeblock element
function createBlock(item, left, width, height, maxHeight = 180, fixedHeight = 60) {
  const h = showEnergyHeight ? (10 + (item.energyRating / 10) * maxHeight) : fixedHeight;
  const color = getCategoryColor(item.category, item.pillar);
  const block = document.createElement('div');
  block.className = 'timeblock';
  block.style.left = `${left}%`;
  block.style.width = `${Math.max(width, 0.3)}%`;
  block.style.height = `${h}px`;
  block.style.background = color;
  addBlockEvents(block, item);
  return block;
}

// Main activity types from the app
const activityTypes = [
  { name: 'chores', color: '#8b9dc3' },
  { name: 'church', color: '#a8d5ba' },
  { name: 'cleaning', color: '#9eb8d9' },
  { name: 'entertainment', color: '#e8a87c' },
  { name: 'exercise', color: '#85dcb8' },
  { name: 'finances', color: '#c9b1ff' },
  { name: 'hobbies', color: '#f6c065' },
  { name: 'learning', color: '#7ecfc0' },
  { name: 'meal', color: '#f4a683' },
  { name: 'meeting', color: '#82b4e5' },
  { name: 'nap', color: '#c9a0dc' },
  { name: 'overnight', color: '#9b8ec2' },
  { name: 'personal care', color: '#e8b4c8' },
  { name: 'quiet time', color: '#b8d4e8' },
  { name: 'shopping', color: '#f2b880' },
  { name: 'socializing', color: '#f7c59f' },
  { name: 'travel', color: '#7dd3c0' }
];

// Legend HTML
function getLegendHTML(showCategories = false) {
  if (showCategories) {
    return `
      <div class="legend category-legend">
        ${activityTypes.map(({ name, color }) => `
          <div class="legend-item">
            <div class="legend-color" style="background: ${color}"></div>
            ${name}
          </div>
        `).join('')}
      </div>
    `;
  }
  return `
    <div class="legend">
      <div class="legend-item"><div class="legend-color" style="background: ${pillarColors.work}"></div>Work</div>
      <div class="legend-item"><div class="legend-color" style="background: ${pillarColors.life}"></div>Life</div>
      <div class="legend-item"><div class="legend-color" style="background: ${pillarColors.growth}"></div>Growth</div>
      <div class="legend-item"><div class="legend-color" style="background: ${pillarColors.rest}"></div>Rest</div>
    </div>
  `;
}

// ==================== DAY VIEW ====================
function renderDayView(dayStr) {
  const dayData = filterByDay(filteredData, dayStr);
  const dayStart = new Date(dayStr + 'T00:00:00');
  const displayDate = new Date(dayStr).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  container.innerHTML = `
    <div class="timeline-container">
      <div class="timeline" id="timeline">
        <div class="timeline-axis"></div>
      </div>
    </div>
    ${getLegendHTML(true)}
  `;

  const timeline = document.getElementById('timeline');

  // Time markers (every 3 hours)
  [0, 3, 6, 9, 12, 15, 18, 21, 24].forEach(hour => {
    const marker = document.createElement('div');
    marker.className = 'time-marker';
    marker.style.left = `${(hour / 24) * 100}%`;
    const label = hour === 0 || hour === 24 ? '12A' : hour === 12 ? '12P' : hour < 12 ? `${hour}A` : `${hour - 12}P`;
    marker.innerHTML = `<span>${label}</span>`;
    timeline.appendChild(marker);
  });

  // Blocks
  dayData.forEach(item => {
    const start = new Date(item.start);
    const end = new Date(item.end);
    const leftPos = ((start - dayStart) / (24 * 60 * 60 * 1000)) * 100;
    const width = ((end - start) / (24 * 60 * 60 * 1000)) * 100;
    timeline.appendChild(createBlock(item, leftPos, width, item.energyRating, 200));
  });

  updatePeriodLabel(displayDate);
}

// ==================== WEEK VIEW ====================
function renderWeekView(weekKey) {
  const weekData = filterByWeek(filteredData, weekKey);
  const [year, weekNum] = weekKey.split('-W');

  // Get first day of week
  const jan1 = new Date(parseInt(year), 0, 1);
  const daysOffset = (parseInt(weekNum) - 1) * 7;
  const weekStart = new Date(jan1);
  weekStart.setDate(jan1.getDate() + daysOffset - jan1.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const displayLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  container.innerHTML = `
    <div class="timeline-container">
      <div class="timeline" id="timeline" style="height: 250px;">
        <div class="timeline-axis"></div>
      </div>
    </div>
    ${getLegendHTML(true)}
  `;

  const timeline = document.getElementById('timeline');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Day markers and regions
  days.forEach((day, i) => {
    const marker = document.createElement('div');
    marker.className = 'time-marker';
    marker.style.left = `${((i + 0.5) / 7) * 100}%`;
    marker.innerHTML = `<span>${day}</span>`;
    timeline.appendChild(marker);

    // Divider
    if (i > 0) {
      const divider = document.createElement('div');
      divider.className = 'period-divider';
      divider.style.left = `${(i / 7) * 100}%`;
      timeline.appendChild(divider);
    }
  });

  // Blocks
  weekData.forEach(item => {
    const start = new Date(item.start);
    const dayOfWeek = start.getDay();
    const dayStart = getDayStart(start);

    const dayOffset = (dayOfWeek / 7) * 100;
    const timeInDay = (start - dayStart) / (24 * 60 * 60 * 1000);
    const durationInDay = item.duration / (24 * 60);

    const leftPos = dayOffset + (timeInDay / 7) * 100;
    const width = (durationInDay / 7) * 100;

    timeline.appendChild(createBlock(item, leftPos, width, item.energyRating, 160));
  });

  updatePeriodLabel(displayLabel);
}

// ==================== MONTH VIEW ====================
function renderMonthView(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const monthData = filterByMonth(filteredData, monthKey);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const daysInMonth = monthEnd.getDate();

  const displayLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Group data by week
  const weeks = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const weekNum = Math.ceil((d + monthStart.getDay()) / 7);
    if (!weeks[weekNum]) weeks[weekNum] = { start: d, end: d, days: [] };
    weeks[weekNum].end = d;
    weeks[weekNum].days.push(d);
  }

  let html = '<div class="month-weeks">';

  Object.entries(weeks).forEach(([weekNum, week]) => {
    html += `
      <div class="week-row">
        <div class="week-row-label">Week ${weekNum}</div>
        <div class="week-row-timeline" id="week-${weekNum}">
          <div class="week-row-axis"></div>
        </div>
      </div>
    `;
  });

  html += `</div>${getLegendHTML(true)}`;
  container.innerHTML = html;

  // Add blocks to each week
  Object.entries(weeks).forEach(([weekNum, week]) => {
    const weekTimeline = document.getElementById(`week-${weekNum}`);
    const weekDays = week.days.length;

    // Day markers
    week.days.forEach((d, i) => {
      const marker = document.createElement('div');
      marker.className = 'time-marker';
      marker.style.left = `${((i + 0.5) / weekDays) * 100}%`;
      marker.style.bottom = '0';
      marker.innerHTML = `<span>${d}</span>`;
      weekTimeline.appendChild(marker);
    });

    // Blocks for this week
    const weekData = monthData.filter(item => {
      const d = new Date(item.start).getDate();
      return week.days.includes(d);
    });

    weekData.forEach(item => {
      const start = new Date(item.start);
      const dayOfMonth = start.getDate();
      const dayIndex = week.days.indexOf(dayOfMonth);
      const dayStart = getDayStart(start);

      const dayOffset = (dayIndex / weekDays) * 100;
      const timeInDay = (start - dayStart) / (24 * 60 * 60 * 1000);
      const durationInDay = item.duration / (24 * 60);

      const leftPos = dayOffset + (timeInDay / weekDays) * 100;
      const width = (durationInDay / weekDays) * 100;

      weekTimeline.appendChild(createBlock(item, leftPos, width, item.energyRating, 30));
    });
  });

  updatePeriodLabel(displayLabel);
}

// ==================== YEAR VIEW ====================
function renderYearView(year) {
  const yearData = filterByYear(filteredData, year);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let html = '<div class="timeline-container"><div style="white-space: nowrap;">';

  months.forEach((month, i) => {
    html += `
      <div class="month-column">
        <div class="month-column-label">${month}</div>
        <div class="month-column-timeline" id="month-${i}">
          <div class="month-column-axis"></div>
        </div>
      </div>
    `;
  });

  html += `</div></div>${getLegendHTML(true)}`;
  container.innerHTML = html;

  // Add blocks to each month
  months.forEach((month, monthIndex) => {
    const monthTimeline = document.getElementById(`month-${monthIndex}`);
    const daysInMonth = new Date(parseInt(year), monthIndex + 1, 0).getDate();

    const monthData = yearData.filter(item => new Date(item.start).getMonth() === monthIndex);

    monthData.forEach(item => {
      const start = new Date(item.start);
      const dayOfMonth = start.getDate();
      const dayStart = getDayStart(start);

      const dayOffset = ((dayOfMonth - 1) / daysInMonth) * 100;
      const timeInDay = (start - dayStart) / (24 * 60 * 60 * 1000);
      const durationInDay = item.duration / (24 * 60);

      const leftPos = dayOffset + (timeInDay / daysInMonth) * 100;
      const width = Math.max((durationInDay / daysInMonth) * 100, 1);

      monthTimeline.appendChild(createBlock(item, leftPos, width, item.energyRating, 140));
    });
  });

  updatePeriodLabel(year);
}

// ==================== REFLECTIONS VIEW ====================
function renderReflectionsView(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const daysInMonth = monthEnd.getDate();

  const displayLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + ' – Reflections';

  container.innerHTML = `
    <div class="reflections-container">
      <div class="reflections-grid" id="reflections-grid"></div>
    </div>
    <div class="legend mood-legend">
      <div class="legend-item"><div class="legend-color" style="background: ${moodColors.happy}"></div>Happy</div>
      <div class="legend-item"><div class="legend-color" style="background: ${moodColors.content}"></div>Content</div>
      <div class="legend-item"><div class="legend-color" style="background: ${moodColors.anxious}"></div>Anxious</div>
      <div class="legend-item"><div class="legend-color" style="background: ${moodColors.tired}"></div>Tired</div>
      <div class="legend-item"><div class="legend-color" style="background: ${moodColors.grateful}"></div>Grateful</div>
    </div>
  `;

  const grid = document.getElementById('reflections-grid');

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const reflection = getReflectionForDate(dateStr);
    const dayActivities = filterByDay(filteredData, dateStr);
    const avgEnergy = dayActivities.length > 0
      ? (dayActivities.reduce((sum, a) => sum + a.energyRating, 0) / dayActivities.length).toFixed(1)
      : null;

    const card = document.createElement('div');
    card.className = 'reflection-card';

    if (reflection) {
      const moodColor = moodColors[reflection.mood] || '#888';
      card.style.borderLeftColor = moodColor;
      card.innerHTML = `
        <div class="reflection-date">${reflection.dayOfWeek}, ${new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        <div class="reflection-mood" style="color: ${moodColor}">${reflection.mood}</div>
        <div class="reflection-text">"${reflection.reflection}"</div>
        ${avgEnergy ? `<div class="reflection-energy">Avg Energy: ${avgEnergy}/10</div>` : ''}
        ${reflection.tags.length > 0 ? `<div class="reflection-tags">${reflection.tags.map(t => `<span class="reflection-tag">${t}</span>`).join('')}</div>` : ''}
      `;
    } else {
      card.innerHTML = `
        <div class="reflection-date">${new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        <div class="reflection-empty">No reflection</div>
        ${avgEnergy ? `<div class="reflection-energy">Avg Energy: ${avgEnergy}/10</div>` : ''}
      `;
      card.classList.add('no-reflection');
    }

    grid.appendChild(card);
  }

  updatePeriodLabel(displayLabel);
}

// Navigation
function navigate(direction) {
  const days = getUniqueDays(filteredData);
  const weeks = getUniqueWeeks(filteredData);
  const months = getUniqueMonths(filteredData);
  const years = getUniqueYears(filteredData);

  if (currentView === 'day') {
    const idx = days.indexOf(currentDate);
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < days.length) {
      currentDate = days[newIdx];
      renderDayView(currentDate);
    }
  } else if (currentView === 'week') {
    const idx = weeks.indexOf(currentWeek);
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < weeks.length) {
      currentWeek = weeks[newIdx];
      renderWeekView(currentWeek);
    }
  } else if (currentView === 'month') {
    const idx = months.indexOf(currentMonth);
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < months.length) {
      currentMonth = months[newIdx];
      renderMonthView(currentMonth);
    }
  } else if (currentView === 'year') {
    const idx = years.indexOf(parseInt(currentYear));
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < years.length) {
      currentYear = years[newIdx].toString();
      renderYearView(currentYear);
    }
  } else if (currentView === 'reflections') {
    const idx = months.indexOf(currentMonth);
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < months.length) {
      currentMonth = months[newIdx];
      renderReflectionsView(currentMonth);
    }
  }
}

function updatePeriodLabel(text) {
  document.getElementById('period-label').textContent = text;
}

function switchView(view) {
  currentView = view;
  renderCurrentView();
}

function renderCurrentView() {
  if (filteredData.length === 0) {
    container.innerHTML = `<div class="no-data">No activities match the selected filters</div>`;
    updatePeriodLabel('No data');
    return;
  }

  if (currentView === 'day') {
    const days = getUniqueDays(filteredData);
    if (!currentDate || !days.includes(currentDate)) currentDate = days[0];
    if (currentDate) renderDayView(currentDate);
  } else if (currentView === 'week') {
    const weeks = getUniqueWeeks(filteredData);
    if (!currentWeek || !weeks.includes(currentWeek)) currentWeek = weeks[0];
    if (currentWeek) renderWeekView(currentWeek);
  } else if (currentView === 'month') {
    const months = getUniqueMonths(filteredData);
    if (!currentMonth || !months.includes(currentMonth)) currentMonth = months[0];
    if (currentMonth) renderMonthView(currentMonth);
  } else if (currentView === 'year') {
    const years = getUniqueYears(filteredData);
    if (!currentYear || !years.includes(parseInt(currentYear))) currentYear = years[0]?.toString();
    if (currentYear) renderYearView(currentYear);
  } else if (currentView === 'reflections') {
    const months = getUniqueMonths(allData);
    if (!currentMonth || !months.includes(currentMonth)) currentMonth = months[0];
    if (currentMonth) renderReflectionsView(currentMonth);
  }
}

function updateFilters() {
  applyFilters();
  renderCurrentView();
}

async function init() {
  const [activityData, reflectionsRaw] = await Promise.all([
    d3.json('generated-data.json'),
    d3.json('daily_reflections_2025.json')
  ]);

  allData = activityData;
  filteredData = [...allData];

  // Index reflections by date for quick lookup
  reflectionsRaw.reflections.forEach(r => {
    reflectionsData[r.date] = r;
  });

  // Get unique values for filters
  const pillars = getUniquePillars(allData);
  const categories = getUniqueCategories(allData);

  // Set initial values
  currentDate = getUniqueDays(allData)[0];
  currentWeek = getUniqueWeeks(allData)[0];
  currentMonth = getUniqueMonths(allData)[0];
  currentYear = getUniqueYears(allData)[0].toString();

  // Create controls
  const controls = document.createElement('div');
  controls.className = 'controls';
  controls.innerHTML = `
    <select class="view-select" id="view-select">
      <option value="day">Day</option>
      <option value="week">Week</option>
      <option value="month">Month</option>
      <option value="year">Year</option>
      <option value="reflections">Reflections</option>
    </select>
    <select class="view-select" id="pillar-select">
      <option value="all">All Pillars</option>
      ${pillars.map(p => `<option value="${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</option>`).join('')}
    </select>
    <select class="view-select" id="category-select">
      <option value="all">All Activities</option>
      ${categories.map(c => `<option value="${c}">${c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>`).join('')}
    </select>
    <button class="nav-btn" id="prev-btn">← Prev</button>
    <button class="nav-btn" id="next-btn">Next →</button>
    <label class="toggle-label">
      <input type="checkbox" id="energy-toggle" checked>
      <span class="toggle-text">Energy Height</span>
    </label>
    <span class="period-label" id="period-label"></span>
  `;
  document.getElementById('app').insertBefore(controls, container);

  document.getElementById('view-select').addEventListener('change', (e) => switchView(e.target.value));
  document.getElementById('pillar-select').addEventListener('change', (e) => {
    currentPillar = e.target.value;
    updateFilters();
  });
  document.getElementById('category-select').addEventListener('change', (e) => {
    currentCategory = e.target.value;
    updateFilters();
  });
  document.getElementById('prev-btn').addEventListener('click', () => navigate(-1));
  document.getElementById('next-btn').addEventListener('click', () => navigate(1));
  document.getElementById('energy-toggle').addEventListener('change', (e) => {
    showEnergyHeight = e.target.checked;
    renderCurrentView();
  });

  // Initial render
  renderDayView(currentDate);
}

init();
