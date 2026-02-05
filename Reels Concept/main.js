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

  // Map existing data categories to colors (lowercase for normalization)
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

// Normalize category lookup (case-insensitive)
function getCategoryColorNormalized(category) {
  const lowerCat = category.toLowerCase();
  return categoryColors[lowerCat] || categoryColors[category] || '#888';
}

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
let currentProfile = 'default';

const profiles = {
  default: {
    name: '25yo Korean American',
    dataFile: 'generated-data.json',
    reflectionsFile: 'daily_reflections_2025.json',
    location: 'New York, NY',
    years: '2025'
  },
  achiever: {
    name: '35yo Actualized Achiever',
    dataFile: 'actualized_achiever_10year_journal.json',
    reflectionsFile: null,
    location: 'Seattle, WA',
    years: '2015-2024'
  }
};

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
  data.forEach(item => categories.add(item.category.toLowerCase()));
  return Array.from(categories).sort();
}

function applyFilters() {
  filteredData = allData.filter(item => {
    if (currentPillar !== 'all' && item.pillar !== currentPillar) return false;
    if (currentCategory !== 'all' && item.category.toLowerCase() !== currentCategory.toLowerCase()) return false;
    return true;
  });
}

// Normalize data from different sources to a common format
function normalizeData(rawData, profile) {
  if (profile === 'achiever') {
    // 10-year journal format
    return rawData.activities.map((item, idx) => {
      const startDateTime = new Date(`${item.date}T${item.startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + item.duration * 60000);

      return {
        id: `block-${idx}`,
        title: item.activity,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        duration: item.duration,
        pillar: getPillarForCategory(item.category),
        category: item.category.toLowerCase(),
        energyRating: Math.round(item.energyLevel),
        reflection: item.reflection,
        people: item.people === 'Alone' ? [] : [item.people],
        place: item.location,
        source: 'journal'
      };
    });
  }
  // Default format - already normalized
  return rawData;
}

// Map categories to pillars
function getPillarForCategory(category) {
  const pillarMap = {
    'overnight': 'rest',
    'nap': 'rest',
    'personal care': 'life',
    'meal': 'life',
    'chores': 'life',
    'cleaning': 'life',
    'shopping': 'life',
    'exercise': 'growth',
    'meditation': 'growth',
    'learning': 'growth',
    'hobbies': 'growth',
    'quiet time': 'growth',
    'meeting': 'work',
    'finances': 'work',
    'socializing': 'life',
    'travel': 'life',
    'church': 'growth',
    'entertainment': 'life'
  };
  return pillarMap[category.toLowerCase()] || 'life';
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
  const lowerCat = category.toLowerCase();
  return categoryColors[lowerCat] || categoryColors[category] || pillarColors[pillar] || '#888';
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
  const yearInt = parseInt(year);

  // Get all days in the year
  const isLeapYear = (yearInt % 4 === 0 && yearInt % 100 !== 0) || (yearInt % 400 === 0);
  const daysInYear = isLeapYear ? 366 : 365;

  // Configuration for the strip layout
  const daysPerRow = 30; // Days per row before wrapping
  const rowHeight = 50; // Height of each row
  const dayWidth = 100 / daysPerRow; // Width percentage per day

  const totalRows = Math.ceil(daysInYear / daysPerRow);

  container.innerHTML = `
    <div class="year-strips-container">
      <div class="year-strips" id="year-strips"></div>
    </div>
    ${getLegendHTML(true)}
  `;

  const stripsContainer = document.getElementById('year-strips');

  // Create rows
  for (let row = 0; row < totalRows; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'year-strip-row';
    rowDiv.style.height = `${rowHeight}px`;

    const startDay = row * daysPerRow;
    const endDay = Math.min(startDay + daysPerRow, daysInYear);

    // Add month labels at the start of each month
    let currentMonth = -1;

    for (let dayOfYear = startDay; dayOfYear < endDay; dayOfYear++) {
      const date = new Date(yearInt, 0, dayOfYear + 1);
      const month = date.getMonth();
      const dayInRow = dayOfYear - startDay;

      // Check if this is the first day of a month in this row
      if (month !== currentMonth) {
        currentMonth = month;
        const monthLabel = document.createElement('div');
        monthLabel.className = 'year-strip-month-label';
        monthLabel.style.left = `${dayInRow * dayWidth}%`;
        monthLabel.textContent = date.toLocaleDateString('en-US', { month: 'short' });
        rowDiv.appendChild(monthLabel);
      }

      // Get activities for this day
      const dateStr = getDayKey(date);
      const dayActivities = yearData.filter(item => getDayKey(item.start) === dateStr);

      // Render activities as horizontal segments within the day's slice
      dayActivities.forEach(item => {
        const start = new Date(item.start);
        const dayStart = getDayStart(start);

        // Position within the day (0-1)
        const timeStart = (start - dayStart) / (24 * 60 * 60 * 1000);
        const duration = item.duration / (24 * 60); // Duration as fraction of day

        // Calculate position in the row
        const leftPos = (dayInRow + timeStart) * dayWidth;
        const width = Math.max(duration * dayWidth, 0.15);

        const color = getCategoryColor(item.category, item.pillar);

        const block = document.createElement('div');
        block.className = 'year-strip-block';
        block.style.left = `${leftPos}%`;
        block.style.width = `${width}%`;
        block.style.background = color;

        // Height based on energy if enabled
        if (showEnergyHeight) {
          const heightPercent = 30 + (item.energyRating / 10) * 70;
          block.style.height = `${heightPercent}%`;
          block.style.top = `${(100 - heightPercent) / 2}%`;
        }

        addBlockEvents(block, item);
        rowDiv.appendChild(block);
      });
    }

    stripsContainer.appendChild(rowDiv);
  }

  updatePeriodLabel(year);
}

// ==================== ALL YEARS VIEW (for multi-year profiles) ====================
function renderAllYearsView() {
  const years = getUniqueYears(filteredData);

  container.innerHTML = `
    <div class="all-years-container">
      <div class="all-years-grid" id="all-years-grid"></div>
    </div>
    ${getLegendHTML(true)}
  `;

  const grid = document.getElementById('all-years-grid');

  years.forEach(year => {
    const yearData = filterByYear(filteredData, year);
    const yearInt = parseInt(year);
    const isLeapYear = (yearInt % 4 === 0 && yearInt % 100 !== 0) || (yearInt % 400 === 0);
    const daysInYear = isLeapYear ? 366 : 365;

    const yearSection = document.createElement('div');
    yearSection.className = 'all-years-year';

    const yearLabel = document.createElement('div');
    yearLabel.className = 'all-years-label';
    yearLabel.textContent = year;
    yearSection.appendChild(yearLabel);

    const stripContainer = document.createElement('div');
    stripContainer.className = 'all-years-strip';

    // Create a single continuous strip for the entire year
    for (let dayOfYear = 0; dayOfYear < daysInYear; dayOfYear++) {
      const date = new Date(yearInt, 0, dayOfYear + 1);
      const dateStr = getDayKey(date);
      const dayActivities = yearData.filter(item => getDayKey(item.start) === dateStr);

      const daySlice = document.createElement('div');
      daySlice.className = 'all-years-day';

      dayActivities.forEach(item => {
        const start = new Date(item.start);
        const dayStart = getDayStart(start);

        const timeStart = (start - dayStart) / (24 * 60 * 60 * 1000);
        const duration = item.duration / (24 * 60);

        const color = getCategoryColor(item.category, item.pillar);

        const block = document.createElement('div');
        block.className = 'all-years-block';
        block.style.top = `${timeStart * 100}%`;
        block.style.height = `${Math.max(duration * 100, 2)}%`;
        block.style.background = color;

        addBlockEvents(block, item);
        daySlice.appendChild(block);
      });

      stripContainer.appendChild(daySlice);
    }

    yearSection.appendChild(stripContainer);
    grid.appendChild(yearSection);
  });

  updatePeriodLabel(`All Years (${years[0]}–${years[years.length - 1]})`);
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
  // No navigation for "all years" view
  if (currentView === 'allyears') return;

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
  } else if (currentView === 'allyears') {
    renderAllYearsView();
  } else if (currentView === 'reflections') {
    // Check if reflections are available
    if (Object.keys(reflectionsData).length === 0) {
      container.innerHTML = `<div class="no-data">No reflections available for this profile.<br>Reflections show daily journal entries separate from activities.</div>`;
      updatePeriodLabel('Reflections');
      return;
    }
    const months = getUniqueMonths(allData);
    if (!currentMonth || !months.includes(currentMonth)) currentMonth = months[0];
    if (currentMonth) renderReflectionsView(currentMonth);
  }
}

function updateFilters() {
  applyFilters();
  renderCurrentView();
}

async function loadProfile(profileId) {
  currentProfile = profileId;
  const profile = profiles[profileId];

  // Show loading state
  container.innerHTML = '<div class="loading">Loading profile...</div>';

  // Load data
  const rawData = await d3.json(profile.dataFile);
  allData = normalizeData(rawData, profileId);
  filteredData = [...allData];

  // Load reflections if available
  reflectionsData = {};
  if (profile.reflectionsFile) {
    try {
      const reflectionsRaw = await d3.json(profile.reflectionsFile);
      reflectionsRaw.reflections.forEach(r => {
        reflectionsData[r.date] = r;
      });
    } catch (e) {
      console.log('No reflections file for this profile');
    }
  }

  // Reset navigation state
  currentDate = getUniqueDays(allData)[0];
  currentWeek = getUniqueWeeks(allData)[0];
  currentMonth = getUniqueMonths(allData)[0];
  currentYear = getUniqueYears(allData)[0]?.toString();

  // Update category dropdown
  const categories = getUniqueCategories(allData);
  const categorySelect = document.getElementById('category-select');
  categorySelect.innerHTML = `
    <option value="all">All Activities</option>
    ${categories.map(c => `<option value="${c}">${c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>`).join('')}
  `;

  // Update profile info display
  updateProfileInfo();

  // Render
  renderCurrentView();
}

function updateProfileInfo() {
  const profile = profiles[currentProfile];
  const infoEl = document.getElementById('profile-info');
  if (infoEl) {
    infoEl.innerHTML = `
      <span class="profile-name">${profile.name}</span>
      <span class="profile-location">${profile.location}</span>
      <span class="profile-years">${profile.years}</span>
    `;
  }
}

// Export current view as SVG
function exportSVG() {
  const periodLabel = document.getElementById('period-label').textContent;
  const profile = profiles[currentProfile];

  // Determine dimensions based on view
  let width, height;
  if (currentView === 'allyears') {
    const years = getUniqueYears(filteredData);
    width = 2000;
    height = years.length * 100 + 150;
  } else if (currentView === 'year') {
    width = 2000;
    height = 800;
  } else {
    width = 1600;
    height = 500;
  }

  // Create SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <style>
      .bg { fill: #0a0a0a; }
      .title { fill: #f0f0f0; font-family: system-ui, sans-serif; font-size: 18px; font-weight: 300; }
      .subtitle { fill: #666; font-family: system-ui, sans-serif; font-size: 12px; }
      .year-label { fill: #666; font-family: system-ui, sans-serif; font-size: 14px; font-weight: 500; }
      .month-label { fill: #555; font-family: system-ui, sans-serif; font-size: 10px; text-transform: uppercase; }
      .legend-text { fill: #666; font-family: system-ui, sans-serif; font-size: 10px; }
    </style>
    <rect class="bg" width="${width}" height="${height}"/>
    <text class="title" x="40" y="40">${profile.name} – ${periodLabel}</text>
    <text class="subtitle" x="40" y="60">${profile.location} • ${profile.years}</text>
  `;

  const startY = 90;

  if (currentView === 'allyears') {
    // Export All Years view
    const years = getUniqueYears(filteredData);
    const stripHeight = 70;
    const stripGap = 20;
    const stripWidth = width - 120;

    years.forEach((year, yearIdx) => {
      const y = startY + yearIdx * (stripHeight + stripGap);
      const yearData = filterByYear(filteredData, year);
      const yearInt = parseInt(year);
      const isLeapYear = (yearInt % 4 === 0 && yearInt % 100 !== 0) || (yearInt % 400 === 0);
      const daysInYear = isLeapYear ? 366 : 365;

      // Year label
      svg += `<text class="year-label" x="50" y="${y + stripHeight / 2 + 5}" text-anchor="end">${year}</text>`;

      // Strip background
      svg += `<rect x="60" y="${y}" width="${stripWidth}" height="${stripHeight}" fill="#0d0d0d" rx="3"/>`;

      // Activities
      for (let dayOfYear = 0; dayOfYear < daysInYear; dayOfYear++) {
        const date = new Date(yearInt, 0, dayOfYear + 1);
        const dateStr = getDayKey(date);
        const dayActivities = yearData.filter(item => getDayKey(item.start) === dateStr);
        const dayX = 60 + (dayOfYear / daysInYear) * stripWidth;
        const dayW = stripWidth / daysInYear;

        dayActivities.forEach(item => {
          const start = new Date(item.start);
          const dayStart = getDayStart(start);
          const timeStart = (start - dayStart) / (24 * 60 * 60 * 1000);
          const duration = item.duration / (24 * 60);

          const blockY = y + timeStart * stripHeight;
          const blockH = Math.max(duration * stripHeight, 2);
          const color = getCategoryColor(item.category, item.pillar);

          svg += `<rect x="${dayX}" y="${blockY}" width="${Math.max(dayW, 1)}" height="${blockH}" fill="${color}"/>`;
        });
      }
    });

    // Legend
    const legendY = startY + years.length * (stripHeight + stripGap) + 20;
    svg += renderLegendSVG(40, legendY, width - 80);

  } else if (currentView === 'year') {
    // Export Year view
    const yearData = filterByYear(filteredData, currentYear);
    const yearInt = parseInt(currentYear);
    const isLeapYear = (yearInt % 4 === 0 && yearInt % 100 !== 0) || (yearInt % 400 === 0);
    const daysInYear = isLeapYear ? 366 : 365;
    const daysPerRow = 30;
    const rowHeight = 45;
    const rowGap = 25;
    const totalRows = Math.ceil(daysInYear / daysPerRow);
    const stripWidth = width - 80;

    for (let row = 0; row < totalRows; row++) {
      const y = startY + row * (rowHeight + rowGap);
      const startDay = row * daysPerRow;
      const endDay = Math.min(startDay + daysPerRow, daysInYear);

      // Row background
      svg += `<rect x="40" y="${y}" width="${stripWidth}" height="${rowHeight}" fill="#0d0d0d" rx="2"/>`;

      let currentMonth = -1;
      for (let dayOfYear = startDay; dayOfYear < endDay; dayOfYear++) {
        const date = new Date(yearInt, 0, dayOfYear + 1);
        const month = date.getMonth();
        const dayInRow = dayOfYear - startDay;
        const dayX = 40 + (dayInRow / daysPerRow) * stripWidth;
        const dayW = stripWidth / daysPerRow;

        // Month label
        if (month !== currentMonth) {
          currentMonth = month;
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          svg += `<text class="month-label" x="${dayX}" y="${y - 5}">${monthName}</text>`;
        }

        // Activities
        const dateStr = getDayKey(date);
        const dayActivities = yearData.filter(item => getDayKey(item.start) === dateStr);

        dayActivities.forEach(item => {
          const start = new Date(item.start);
          const dayStart = getDayStart(start);
          const timeStart = (start - dayStart) / (24 * 60 * 60 * 1000);
          const duration = item.duration / (24 * 60);

          const blockX = dayX + timeStart * dayW;
          const blockW = Math.max(duration * dayW, 1);
          const color = getCategoryColor(item.category, item.pillar);

          let blockH = rowHeight;
          let blockY = y;
          if (showEnergyHeight) {
            const heightPercent = 0.3 + (item.energyRating / 10) * 0.7;
            blockH = rowHeight * heightPercent;
            blockY = y + (rowHeight - blockH) / 2;
          }

          svg += `<rect x="${blockX}" y="${blockY}" width="${blockW}" height="${blockH}" fill="${color}" rx="1"/>`;
        });
      }
    }

    // Legend
    const legendY = startY + totalRows * (rowHeight + rowGap) + 20;
    svg += renderLegendSVG(40, legendY, width - 80);

  } else {
    // Export Day/Week/Month views (simplified)
    svg += `<text class="subtitle" x="${width/2}" y="${height/2}" text-anchor="middle">Use Year or All Years view for best SVG export</text>`;
  }

  svg += '</svg>';

  // Download
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `existence-${currentProfile}-${currentView}-${periodLabel.replace(/[^a-z0-9]/gi, '-')}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function renderLegendSVG(x, y, maxWidth) {
  let svg = '';
  const itemWidth = 90;
  const itemHeight = 20;
  const cols = Math.floor(maxWidth / itemWidth);

  activityTypes.forEach((activity, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const itemX = x + col * itemWidth;
    const itemY = y + row * itemHeight;

    svg += `<rect x="${itemX}" y="${itemY}" width="12" height="12" fill="${activity.color}" rx="2"/>`;
    svg += `<text class="legend-text" x="${itemX + 18}" y="${itemY + 10}">${activity.name}</text>`;
  });

  return svg;
}

async function init() {
  // Create profile selector header
  const header = document.createElement('div');
  header.className = 'profile-header';
  header.innerHTML = `
    <select class="profile-select" id="profile-select">
      <option value="default">25yo Korean American</option>
      <option value="achiever">35yo Actualized Achiever (10 Years)</option>
    </select>
    <div class="profile-info" id="profile-info"></div>
  `;
  document.getElementById('app').insertBefore(header, document.querySelector('h1'));

  // Create controls
  const controls = document.createElement('div');
  controls.className = 'controls';
  controls.innerHTML = `
    <select class="view-select" id="view-select">
      <option value="day">Day</option>
      <option value="week">Week</option>
      <option value="month">Month</option>
      <option value="year">Year</option>
      <option value="allyears">All Years</option>
      <option value="reflections">Reflections</option>
    </select>
    <select class="view-select" id="pillar-select">
      <option value="all">All Pillars</option>
      <option value="work">Work</option>
      <option value="life">Life</option>
      <option value="growth">Growth</option>
      <option value="rest">Rest</option>
    </select>
    <select class="view-select" id="category-select">
      <option value="all">All Activities</option>
    </select>
    <button class="nav-btn" id="prev-btn">← Prev</button>
    <button class="nav-btn" id="next-btn">Next →</button>
    <label class="toggle-label">
      <input type="checkbox" id="energy-toggle" checked>
      <span class="toggle-text">Energy Height</span>
    </label>
    <button class="nav-btn export-btn" id="export-btn">Export SVG</button>
    <span class="period-label" id="period-label"></span>
  `;
  document.getElementById('app').insertBefore(controls, container);

  // Event listeners
  document.getElementById('profile-select').addEventListener('change', (e) => {
    loadProfile(e.target.value);
  });
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
  document.getElementById('export-btn').addEventListener('click', exportSVG);

  // Load default profile
  await loadProfile('default');
}

init();
