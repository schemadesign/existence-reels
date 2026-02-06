const container = document.getElementById('visualization');

const pillarColors = {
  work: '#7B7B9E',
  life: '#C9A227',
  health: '#5EAA7D',
  sleep: '#8B6B8B'
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
  // Health-related
  reading: '#7ecfc0',
  gym: '#85dcb8',
  running: '#85dcb8',
  yoga: '#e8b4c8',
  meditation: '#b8d4e8',
  // Sleep-related
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
let currentDataType = 'activities'; // activities, reflections, energy

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
  // Default format - fix pillars based on category
  return rawData.map(item => ({
    ...item,
    pillar: getPillarForCategory(item.category)
  }));
}

// Map categories to pillars
function getPillarForCategory(category) {
  const pillarMap = {
    // Sleep
    'overnight': 'sleep',
    'nap': 'sleep',
    'sleep': 'sleep',
    // Life
    'personal care': 'life',
    'meal': 'life',
    'meal prep': 'life',
    'cooking': 'life',
    'chores': 'life',
    'cleaning': 'life',
    'shopping': 'life',
    'errands': 'life',
    'socializing': 'life',
    'family': 'life',
    'friends': 'life',
    'travel': 'life',
    'entertainment': 'life',
    // Health
    'exercise': 'health',
    'gym': 'health',
    'running': 'health',
    'yoga': 'health',
    'meditation': 'health',
    'learning': 'health',
    'reading': 'health',
    'hobbies': 'health',
    'quiet time': 'health',
    'church': 'health',
    // Work
    'meeting': 'work',
    'meetings': 'work',
    'calls': 'work',
    'finances': 'work',
    'admin': 'work',
    'email': 'work',
    'planning': 'work',
    'deep work': 'work',
    'review': 'work'
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
      <div class="legend-item"><div class="legend-color" style="background: ${pillarColors.health}"></div>Health</div>
      <div class="legend-item"><div class="legend-color" style="background: ${pillarColors.sleep}"></div>Sleep</div>
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
let currentAllYearsPage = 0;
const YEARS_PER_PAGE = 5;

function renderAllYearsView() {
  const allYears = getUniqueYears(filteredData);
  const totalPages = Math.ceil(allYears.length / YEARS_PER_PAGE);

  // Get years for current page
  const startIdx = currentAllYearsPage * YEARS_PER_PAGE;
  const endIdx = Math.min(startIdx + YEARS_PER_PAGE, allYears.length);
  const pageYears = allYears.slice(startIdx, endIdx);

  // Configuration matching year view
  const daysPerRow = 30;
  const rowHeight = 50;
  const dayWidth = 100 / daysPerRow;

  // Calculate total days for all years on this page
  let totalDays = 0;
  const yearDayOffsets = {};
  pageYears.forEach(year => {
    yearDayOffsets[year] = totalDays;
    const yearInt = parseInt(year);
    const isLeapYear = (yearInt % 4 === 0 && yearInt % 100 !== 0) || (yearInt % 400 === 0);
    totalDays += isLeapYear ? 366 : 365;
  });

  const totalRows = Math.ceil(totalDays / daysPerRow);

  // Pagination controls
  const pageControls = totalPages > 1 ? `
    <div class="all-years-pagination">
      <button class="nav-btn" id="prev-years-page" ${currentAllYearsPage === 0 ? 'disabled' : ''}>← Previous 5 Years</button>
      <span class="page-indicator">Page ${currentAllYearsPage + 1} of ${totalPages}</span>
      <button class="nav-btn" id="next-years-page" ${currentAllYearsPage >= totalPages - 1 ? 'disabled' : ''}>Next 5 Years →</button>
    </div>
  ` : '';

  container.innerHTML = `
    ${pageControls}
    <div class="year-strips-container all-years-expanded">
      <div class="year-strips" id="year-strips"></div>
    </div>
    ${getLegendHTML(true)}
  `;

  // Add pagination event listeners
  if (totalPages > 1) {
    document.getElementById('prev-years-page')?.addEventListener('click', () => {
      if (currentAllYearsPage > 0) {
        currentAllYearsPage--;
        renderAllYearsView();
      }
    });
    document.getElementById('next-years-page')?.addEventListener('click', () => {
      if (currentAllYearsPage < totalPages - 1) {
        currentAllYearsPage++;
        renderAllYearsView();
      }
    });
  }

  const stripsContainer = document.getElementById('year-strips');

  // Build a continuous day array for all years on this page
  const allDaysData = [];
  pageYears.forEach(year => {
    const yearInt = parseInt(year);
    const isLeapYear = (yearInt % 4 === 0 && yearInt % 100 !== 0) || (yearInt % 400 === 0);
    const daysInYear = isLeapYear ? 366 : 365;
    const yearData = filterByYear(filteredData, year);

    for (let dayOfYear = 0; dayOfYear < daysInYear; dayOfYear++) {
      const date = new Date(yearInt, 0, dayOfYear + 1);
      const dateStr = getDayKey(date);
      const dayActivities = yearData.filter(item => getDayKey(item.start) === dateStr);

      allDaysData.push({
        date,
        dateStr,
        year: yearInt,
        month: date.getMonth(),
        dayOfYear,
        isFirstDayOfYear: dayOfYear === 0,
        isFirstDayOfMonth: date.getDate() === 1,
        activities: dayActivities
      });
    }
  });

  // Create rows
  for (let row = 0; row < totalRows; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'year-strip-row';
    rowDiv.style.height = `${rowHeight}px`;

    const startDay = row * daysPerRow;
    const endDay = Math.min(startDay + daysPerRow, totalDays);

    let lastMonth = -1;
    let lastYear = -1;

    for (let dayIdx = startDay; dayIdx < endDay; dayIdx++) {
      const dayData = allDaysData[dayIdx];
      if (!dayData) continue;

      const dayInRow = dayIdx - startDay;

      // Year label (at start of each year)
      if (dayData.isFirstDayOfYear || (dayIdx === startDay && dayData.year !== lastYear)) {
        const yearLabel = document.createElement('div');
        yearLabel.className = 'year-strip-year-label';
        yearLabel.style.left = `${dayInRow * dayWidth}%`;
        yearLabel.textContent = dayData.year;
        rowDiv.appendChild(yearLabel);
        lastYear = dayData.year;
      }

      // Month label (at start of each month)
      if (dayData.isFirstDayOfMonth || (dayIdx === startDay && dayData.month !== lastMonth)) {
        const monthLabel = document.createElement('div');
        monthLabel.className = 'year-strip-month-label';
        monthLabel.style.left = `${dayInRow * dayWidth}%`;
        monthLabel.textContent = dayData.date.toLocaleDateString('en-US', { month: 'short' });
        rowDiv.appendChild(monthLabel);
        lastMonth = dayData.month;
      }

      // Render activities
      dayData.activities.forEach(item => {
        const start = new Date(item.start);
        const dayStart = getDayStart(start);

        const timeStart = (start - dayStart) / (24 * 60 * 60 * 1000);
        const duration = item.duration / (24 * 60);

        const leftPos = (dayInRow + timeStart) * dayWidth;
        const width = Math.max(duration * dayWidth, 0.15);

        const color = getCategoryColor(item.category, item.pillar);

        const block = document.createElement('div');
        block.className = 'year-strip-block';
        block.style.left = `${leftPos}%`;
        block.style.width = `${width}%`;
        block.style.background = color;

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

  const rangeStart = pageYears[0];
  const rangeEnd = pageYears[pageYears.length - 1];
  updatePeriodLabel(`${rangeStart}–${rangeEnd} (${pageYears.length} years)`);
}

// ==================== REFLECTIONS BUBBLE CHART ====================
function renderReflectionsBubbleChart() {
  const reflections = Object.values(reflectionsData);

  // Aggregate by tags
  const tagCounts = {};
  const tagMoods = {};

  reflections.forEach(r => {
    r.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      if (!tagMoods[tag]) tagMoods[tag] = {};
      tagMoods[tag][r.mood] = (tagMoods[tag][r.mood] || 0) + 1;
    });
  });

  // Also aggregate by mood
  const moodCounts = {};
  reflections.forEach(r => {
    moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
  });

  // Create bubble data
  const tagBubbles = Object.entries(tagCounts).map(([tag, count]) => ({
    label: tag,
    count,
    type: 'tag',
    dominantMood: Object.entries(tagMoods[tag]).sort((a, b) => b[1] - a[1])[0]?.[0] || 'content'
  }));

  const moodBubbles = Object.entries(moodCounts).map(([mood, count]) => ({
    label: mood,
    count,
    type: 'mood',
    dominantMood: mood
  }));

  const maxCount = Math.max(...tagBubbles.map(b => b.count), ...moodBubbles.map(b => b.count));

  container.innerHTML = `
    <div class="bubble-chart-container">
      <div class="bubble-section">
        <h3 class="bubble-section-title">Reflection Themes</h3>
        <div class="bubble-grid" id="tag-bubbles"></div>
      </div>
      <div class="bubble-section">
        <h3 class="bubble-section-title">Moods</h3>
        <div class="bubble-grid" id="mood-bubbles"></div>
      </div>
    </div>
  `;

  const tagContainer = document.getElementById('tag-bubbles');
  const moodContainer = document.getElementById('mood-bubbles');

  // Render tag bubbles
  tagBubbles.sort((a, b) => b.count - a.count).forEach(bubble => {
    const size = 60 + (bubble.count / maxCount) * 140;
    const color = moodColors[bubble.dominantMood] || '#888';

    const el = document.createElement('div');
    el.className = 'bubble';
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.background = `radial-gradient(circle at 30% 30%, ${color}dd, ${color}88)`;

    el.innerHTML = `
      <span class="bubble-count">${bubble.count}</span>
      <span class="bubble-label">${bubble.label}</span>
    `;

    el.addEventListener('mouseenter', (e) => {
      tooltip.innerHTML = `
        <div class="tooltip-title">${bubble.label}</div>
        <div class="tooltip-meta">${bubble.count} reflections</div>
        <div style="margin-top: 8px; font-size: 11px; color: #888;">Dominant mood: ${bubble.dominantMood}</div>
      `;
      tooltip.classList.add('visible');
      moveTooltip(e);
    });
    el.addEventListener('mousemove', moveTooltip);
    el.addEventListener('mouseleave', hideTooltip);

    tagContainer.appendChild(el);
  });

  // Render mood bubbles
  moodBubbles.sort((a, b) => b.count - a.count).forEach(bubble => {
    const size = 60 + (bubble.count / maxCount) * 140;
    const color = moodColors[bubble.label] || '#888';

    const el = document.createElement('div');
    el.className = 'bubble';
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.background = `radial-gradient(circle at 30% 30%, ${color}dd, ${color}88)`;

    el.innerHTML = `
      <span class="bubble-count">${bubble.count}</span>
      <span class="bubble-label">${bubble.label}</span>
    `;

    el.addEventListener('mouseenter', (e) => {
      const percentage = ((bubble.count / reflections.length) * 100).toFixed(1);
      tooltip.innerHTML = `
        <div class="tooltip-title" style="text-transform: capitalize;">${bubble.label}</div>
        <div class="tooltip-meta">${bubble.count} days (${percentage}%)</div>
      `;
      tooltip.classList.add('visible');
      moveTooltip(e);
    });
    el.addEventListener('mousemove', moveTooltip);
    el.addEventListener('mouseleave', hideTooltip);

    moodContainer.appendChild(el);
  });

  updatePeriodLabel(`Reflections – ${reflections.length} entries`);
}

// ==================== ACTIVITY REFLECTIONS BUBBLE (D3 Circle Pack with Drill-down) ====================

// State for drill-down navigation
let bubbleNavStack = [];

function renderActivityReflectionsBubble() {
  // Reset navigation stack
  bubbleNavStack = [];

  // Build hierarchical data from reflections
  const hierarchyData = buildReflectionHierarchy();

  // Render the top-level packed circles
  renderPackedCircles(hierarchyData, 'All Reflections');
}

// Extract keywords/phrases from reflection text
function extractKeywords(text) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once', 'about', 'after', 'before', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'through', 'during', 'into', 'really', 'today', 'felt', 'feeling', 'feel', 'got', 'get', 'went', 'going', 'go', 'made', 'make', 'day', 'time', 'good', 'great', 'nice', 'bit', 'lot', 'much', 'many', 'well', 'back', 'still', 'even', 'though', 'being']);

  // Clean and tokenize
  const words = text.toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w) && !/^\d+$/.test(w));

  return words;
}

// Theme keywords for categorization
const themeKeywords = {
  'productivity': ['productive', 'accomplished', 'efficient', 'focused', 'completed', 'progress', 'work', 'task', 'project', 'deadline', 'finished'],
  'wellbeing': ['relaxed', 'peaceful', 'calm', 'refreshed', 'energized', 'healthy', 'rest', 'sleep', 'recovery', 'tired'],
  'growth': ['learned', 'learning', 'growth', 'improved', 'development', 'practice', 'skill', 'knowledge', 'understanding', 'insight'],
  'connection': ['friend', 'family', 'team', 'together', 'connection', 'relationship', 'conversation', 'social', 'people', 'meeting'],
  'creativity': ['creative', 'inspired', 'ideas', 'artistic', 'innovative', 'imagination', 'design', 'create', 'art'],
  'challenge': ['difficult', 'challenging', 'struggle', 'hard', 'obstacle', 'problem', 'issue', 'stress', 'frustrating'],
  'gratitude': ['grateful', 'thankful', 'appreciate', 'blessed', 'fortunate', 'happy', 'joy', 'wonderful'],
  'achievement': ['success', 'achieved', 'milestone', 'goal', 'accomplished', 'proud', 'win', 'breakthrough'],
  'mindfulness': ['present', 'mindful', 'meditation', 'awareness', 'conscious', 'intentional', 'moment', 'breathe'],
  'balance': ['balance', 'routine', 'rhythm', 'consistency', 'discipline', 'habit', 'schedule', 'structured'],
  'exercise': ['workout', 'exercise', 'gym', 'run', 'running', 'fitness', 'training', 'sweat', 'strength'],
  'planning': ['plan', 'planning', 'organize', 'prepared', 'strategy', 'review', 'reflection', 'thinking']
};

// Map keywords to themes
function getThemeForKeyword(keyword) {
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(kw => keyword.includes(kw) || kw.includes(keyword))) {
      return theme;
    }
  }
  return 'general';
}

// Build hierarchical data structure
function buildReflectionHierarchy() {
  const reflectionsWithText = filteredData.filter(item => item.reflection);
  const totalReflections = reflectionsWithText.length;

  // Count keyword occurrences and group reflections
  const keywordData = {};

  reflectionsWithText.forEach(item => {
    const keywords = extractKeywords(item.reflection);
    const uniqueKeywords = [...new Set(keywords)];

    uniqueKeywords.forEach(keyword => {
      if (!keywordData[keyword]) {
        keywordData[keyword] = {
          count: 0,
          reflections: [],
          themes: {}
        };
      }
      keywordData[keyword].count++;
      keywordData[keyword].reflections.push({
        text: item.reflection,
        category: item.category,
        energy: item.energyRating,
        date: item.start
      });

      // Track theme association
      const theme = getThemeForKeyword(keyword);
      keywordData[keyword].themes[theme] = (keywordData[keyword].themes[theme] || 0) + 1;
    });
  });

  // Filter to top keywords (at least 3 occurrences, max 30 keywords)
  const topKeywords = Object.entries(keywordData)
    .filter(([kw, data]) => data.count >= 3)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 30);

  // Group by primary theme
  const themeGroups = {};

  topKeywords.forEach(([keyword, data]) => {
    // Find dominant theme
    const dominantTheme = Object.entries(data.themes)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';

    if (!themeGroups[dominantTheme]) {
      themeGroups[dominantTheme] = {
        name: dominantTheme,
        count: 0,
        keywords: []
      };
    }

    themeGroups[dominantTheme].count += data.count;
    themeGroups[dominantTheme].keywords.push({
      name: keyword,
      count: data.count,
      reflections: data.reflections
    });
  });

  return {
    name: 'root',
    totalReflections,
    children: Object.values(themeGroups)
      .filter(g => g.keywords.length > 0)
      .sort((a, b) => b.count - a.count)
  };
}

// Theme colors
const themeColors = {
  'productivity': '#4a9eff',
  'wellbeing': '#50c878',
  'growth': '#ffaa50',
  'connection': '#f7c59f',
  'creativity': '#e8a87c',
  'challenge': '#e07070',
  'gratitude': '#a8d5ba',
  'achievement': '#f6c065',
  'mindfulness': '#b8d4e8',
  'balance': '#c9b1ff',
  'exercise': '#85dcb8',
  'planning': '#82b4e5',
  'general': '#888888'
};

// Render packed circles using D3
function renderPackedCircles(data, title, level = 0) {
  const totalReflections = filteredData.filter(i => i.reflection).length;

  // Container setup
  container.innerHTML = `
    <div class="packed-bubble-container">
      <div class="packed-bubble-header">
        ${bubbleNavStack.length > 0 ? `<button class="bubble-back-btn" id="bubble-back">← Back</button>` : ''}
        <h3 class="packed-bubble-title">${title}</h3>
        <span class="packed-bubble-count">${totalReflections} total reflections</span>
      </div>
      <div class="packed-bubble-breadcrumb" id="breadcrumb"></div>
      <svg id="packed-circles" class="packed-circles-svg"></svg>
    </div>
  `;

  // Breadcrumb
  const breadcrumb = document.getElementById('breadcrumb');
  if (bubbleNavStack.length > 0) {
    breadcrumb.innerHTML = bubbleNavStack.map((item, i) =>
      `<span class="breadcrumb-item" data-index="${i}">${item.title}</span>`
    ).join(' → ') + ` → <span class="breadcrumb-current">${title}</span>`;

    breadcrumb.querySelectorAll('.breadcrumb-item').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.dataset.index);
        const navItem = bubbleNavStack[index];
        bubbleNavStack = bubbleNavStack.slice(0, index);
        renderPackedCircles(navItem.data, navItem.title, index);
      });
    });
  }

  // Back button
  if (bubbleNavStack.length > 0) {
    document.getElementById('bubble-back').addEventListener('click', () => {
      const prev = bubbleNavStack.pop();
      if (bubbleNavStack.length === 0) {
        renderActivityReflectionsBubble();
      } else {
        const current = bubbleNavStack.pop();
        renderPackedCircles(current.data, current.title, bubbleNavStack.length);
      }
    });
  }

  const svg = d3.select('#packed-circles');
  const width = container.offsetWidth - 40;
  const height = Math.max(500, window.innerHeight - 280);

  svg.attr('width', width).attr('height', height);

  // Check if this is the reflections level (leaf nodes)
  if (data.reflections) {
    renderReflectionsList(data.reflections, title);
    return;
  }

  // Prepare hierarchy data for D3
  let hierarchyRoot;

  if (data.children) {
    // Theme level or keyword level
    hierarchyRoot = {
      name: data.name,
      children: data.children.map(child => ({
        name: child.name,
        value: child.count || child.reflections?.length || 1,
        data: child
      }))
    };
  } else if (data.keywords) {
    // Keywords within a theme
    hierarchyRoot = {
      name: data.name,
      children: data.keywords.map(kw => ({
        name: kw.name,
        value: kw.count,
        data: kw
      }))
    };
  } else {
    return;
  }

  // Create pack layout
  const root = d3.hierarchy(hierarchyRoot)
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value);

  const pack = d3.pack()
    .size([width - 20, height - 20])
    .padding(8);

  pack(root);

  // Draw circles
  const nodes = root.descendants().slice(1); // Skip root

  const nodeGroups = svg.selectAll('g.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.x + 10}, ${d.y + 10})`);

  // Circles
  nodeGroups.append('circle')
    .attr('r', 0)
    .attr('fill', d => {
      const name = d.data.name;
      if (themeColors[name]) return themeColors[name];
      // For keywords, use parent theme color or derive
      const parentTheme = d.parent?.data?.name;
      if (parentTheme && themeColors[parentTheme]) {
        return themeColors[parentTheme];
      }
      return '#5a6a7a';
    })
    .attr('fill-opacity', 0.7)
    .attr('stroke', '#222')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .transition()
    .duration(500)
    .delay((d, i) => i * 20)
    .attr('r', d => d.r);

  // Labels
  nodeGroups.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.2em')
    .attr('fill', '#fff')
    .attr('font-family', "'Helvetica Neue', Helvetica, Arial, sans-serif")
    .attr('font-size', d => Math.min(d.r / 3, 16))
    .attr('font-weight', '500')
    .attr('pointer-events', 'none')
    .text(d => {
      const name = d.data.name;
      const maxChars = Math.floor(d.r / 4);
      return name.length > maxChars ? name.substring(0, maxChars) + '...' : name;
    })
    .style('opacity', 0)
    .transition()
    .duration(500)
    .delay((d, i) => i * 20 + 300)
    .style('opacity', 1);

  // Count labels
  nodeGroups.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.2em')
    .attr('fill', '#ccc')
    .attr('font-family', "'Helvetica Neue', Helvetica, Arial, sans-serif")
    .attr('font-size', d => Math.min(d.r / 4, 14))
    .attr('pointer-events', 'none')
    .text(d => d.value)
    .style('opacity', 0)
    .transition()
    .duration(500)
    .delay((d, i) => i * 20 + 300)
    .style('opacity', 1);

  // Interactions
  nodeGroups
    .on('mouseenter', function(event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('fill-opacity', 0.9)
        .attr('stroke-width', 3);

      const nodeData = d.data.data;
      let tooltipContent = `
        <div class="tooltip-title" style="text-transform: capitalize;">${d.data.name}</div>
        <div class="tooltip-meta">${d.value} occurrences</div>
      `;

      if (nodeData?.reflections?.length > 0) {
        const sample = nodeData.reflections[0];
        tooltipContent += `<div style="margin-top: 8px; font-style: italic; color: #aaa; font-size: 11px; max-width: 250px;">"${sample.text.substring(0, 100)}${sample.text.length > 100 ? '...' : ''}"</div>`;
      }

      if (nodeData?.keywords?.length > 0) {
        tooltipContent += `<div style="margin-top: 8px; font-size: 11px; color: #888;">Contains ${nodeData.keywords.length} keywords</div>`;
      }

      tooltipContent += `<div style="margin-top: 8px; font-size: 10px; color: #666;">Click to explore</div>`;

      tooltip.innerHTML = tooltipContent;
      tooltip.classList.add('visible');
      moveTooltip(event);
    })
    .on('mousemove', moveTooltip)
    .on('mouseleave', function() {
      d3.select(this).select('circle')
        .transition()
        .duration(200)
        .attr('fill-opacity', 0.7)
        .attr('stroke-width', 2);
      hideTooltip();
    })
    .on('click', function(event, d) {
      const nodeData = d.data.data;

      if (nodeData) {
        // Save current state to stack
        bubbleNavStack.push({ data, title });

        if (nodeData.keywords) {
          // Theme level -> show keywords
          renderPackedCircles(nodeData, d.data.name, level + 1);
        } else if (nodeData.reflections) {
          // Keyword level -> show reflections list
          renderPackedCircles(nodeData, d.data.name, level + 1);
        }
      }
    });

  updatePeriodLabel(`Reflections – ${title}`);
}

// Render list of individual reflections
function renderReflectionsList(reflections, keyword) {
  container.innerHTML = `
    <div class="packed-bubble-container">
      <div class="packed-bubble-header">
        <button class="bubble-back-btn" id="bubble-back">← Back</button>
        <h3 class="packed-bubble-title">Reflections containing "${keyword}"</h3>
        <span class="packed-bubble-count">${reflections.length} reflections</span>
      </div>
      <div class="packed-bubble-breadcrumb" id="breadcrumb"></div>
      <div class="reflections-list" id="reflections-list"></div>
    </div>
  `;

  // Breadcrumb
  const breadcrumb = document.getElementById('breadcrumb');
  if (bubbleNavStack.length > 0) {
    breadcrumb.innerHTML = bubbleNavStack.map((item, i) =>
      `<span class="breadcrumb-item" data-index="${i}">${item.title}</span>`
    ).join(' → ') + ` → <span class="breadcrumb-current">${keyword}</span>`;

    breadcrumb.querySelectorAll('.breadcrumb-item').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt(el.dataset.index);
        const navItem = bubbleNavStack[index];
        bubbleNavStack = bubbleNavStack.slice(0, index);
        renderPackedCircles(navItem.data, navItem.title, index);
      });
    });
  }

  // Back button
  document.getElementById('bubble-back').addEventListener('click', () => {
    const prev = bubbleNavStack.pop();
    if (prev) {
      renderPackedCircles(prev.data, prev.title, bubbleNavStack.length);
    } else {
      renderActivityReflectionsBubble();
    }
  });

  // Render reflections
  const list = document.getElementById('reflections-list');

  reflections.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(ref => {
    const date = new Date(ref.date);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
    const categoryColor = getCategoryColor(ref.category, 'life');
    const energyHue = ref.energy * 12;

    const card = document.createElement('div');
    card.className = 'reflection-list-item';
    card.innerHTML = `
      <div class="reflection-list-meta">
        <span class="reflection-list-date">${dateStr}</span>
        <span class="reflection-list-category" style="background: ${categoryColor}">${ref.category}</span>
        <span class="reflection-list-energy" style="color: hsl(${energyHue}, 70%, 50%)">Energy: ${ref.energy}/10</span>
      </div>
      <div class="reflection-list-text">"${ref.text}"</div>
    `;
    list.appendChild(card);
  });

  updatePeriodLabel(`"${keyword}" – ${reflections.length} reflections`);
}

// ==================== ACTIVITY REFLECTIONS TREEMAP ====================
function renderActivityReflectionsTreemap() {
  // Group reflections by category and then by pillar
  const pillarData = {};

  filteredData.forEach(item => {
    if (!item.reflection) return;

    const pillar = item.pillar || getPillarForCategory(item.category);
    const category = item.category.toLowerCase();

    if (!pillarData[pillar]) {
      pillarData[pillar] = { total: 0, categories: {} };
    }
    pillarData[pillar].total++;

    if (!pillarData[pillar].categories[category]) {
      pillarData[pillar].categories[category] = { count: 0, reflections: [], totalEnergy: 0 };
    }
    pillarData[pillar].categories[category].count++;
    pillarData[pillar].categories[category].reflections.push(item.reflection);
    pillarData[pillar].categories[category].totalEnergy += item.energyRating;
  });

  const totalReflections = filteredData.filter(i => i.reflection).length;

  const pillarColorsLocal = {
    'work': '#7B7B9E',
    'life': '#C9A227',
    'health': '#5EAA7D',
    'sleep': '#8B6B8B'
  };

  container.innerHTML = `
    <div class="treemap-container">
      <div class="treemap-title">Reflections by Category (${totalReflections} total)</div>
      <div class="treemap" id="treemap"></div>
    </div>
  `;

  const treemap = document.getElementById('treemap');

  // Sort pillars by total count
  const sortedPillars = Object.entries(pillarData)
    .sort((a, b) => b[1].total - a[1].total);

  sortedPillars.forEach(([pillar, data]) => {
    const pillarPercent = (data.total / totalReflections) * 100;
    const pillarColor = pillarColorsLocal[pillar] || '#888';

    const pillarEl = document.createElement('div');
    pillarEl.className = 'treemap-pillar';
    pillarEl.style.flex = data.total;

    // Pillar header
    const pillarHeader = document.createElement('div');
    pillarHeader.className = 'treemap-pillar-header';
    pillarHeader.style.background = pillarColor;
    pillarHeader.innerHTML = `
      <span class="treemap-pillar-name">${pillar}</span>
      <span class="treemap-pillar-count">${data.total} (${pillarPercent.toFixed(0)}%)</span>
    `;
    pillarEl.appendChild(pillarHeader);

    // Categories within pillar
    const categoriesEl = document.createElement('div');
    categoriesEl.className = 'treemap-categories';

    const sortedCategories = Object.entries(data.categories)
      .sort((a, b) => b[1].count - a[1].count);

    sortedCategories.forEach(([category, catData]) => {
      const catPercent = (catData.count / data.total) * 100;
      const avgEnergy = catData.totalEnergy / catData.count;
      const categoryColor = getCategoryColor(category, pillar);

      const catEl = document.createElement('div');
      catEl.className = 'treemap-category';
      catEl.style.flex = catData.count;
      catEl.style.background = categoryColor;

      catEl.innerHTML = `
        <span class="treemap-cat-name">${category}</span>
        <span class="treemap-cat-count">${catData.count}</span>
      `;

      catEl.addEventListener('mouseenter', (e) => {
        tooltip.innerHTML = `
          <div class="tooltip-title" style="text-transform: capitalize;">${category}</div>
          <div class="tooltip-meta">${catData.count} reflections (${catPercent.toFixed(1)}% of ${pillar})</div>
          <div class="tooltip-energy">Avg Energy: ${avgEnergy.toFixed(1)}/10</div>
          <div style="margin-top: 8px; font-style: italic; color: #aaa; font-size: 11px; max-width: 280px;">"${catData.reflections[0]}"</div>
        `;
        tooltip.classList.add('visible');
        moveTooltip(e);
      });
      catEl.addEventListener('mousemove', moveTooltip);
      catEl.addEventListener('mouseleave', hideTooltip);

      categoriesEl.appendChild(catEl);
    });

    pillarEl.appendChild(categoriesEl);
    treemap.appendChild(pillarEl);
  });

  updatePeriodLabel(`Reflection Treemap – ${totalReflections} entries`);
}

// ==================== ACTIVITY REFLECTIONS CALENDAR ====================
function renderActivityReflectionsCalendar() {
  const months = getUniqueMonths(filteredData);

  container.innerHTML = `
    <div class="reflections-calendar-container">
      <div class="reflections-calendar" id="reflections-calendar"></div>
    </div>
  `;

  const calendar = document.getElementById('reflections-calendar');

  months.forEach(monthKey => {
    const [year, month] = monthKey.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDay = monthStart.getDay();

    const monthEl = document.createElement('div');
    monthEl.className = 'calendar-month';

    monthEl.innerHTML = `
      <div class="calendar-month-title">${monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
      <div class="calendar-grid" id="cal-${monthKey}"></div>
    `;

    calendar.appendChild(monthEl);

    const grid = document.getElementById(`cal-${monthKey}`);

    // Empty cells for padding
    for (let i = 0; i < startDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-day empty';
      grid.appendChild(empty);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayActivities = filteredData.filter(item => getDayKey(item.start) === dateStr && item.reflection);

      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';

      if (dayActivities.length > 0) {
        // Color based on average energy
        const avgEnergy = dayActivities.reduce((s, a) => s + a.energyRating, 0) / dayActivities.length;
        const hue = avgEnergy * 12;
        dayEl.style.background = `hsl(${hue}, 60%, 40%)`;
        dayEl.classList.add('has-reflection');

        dayEl.addEventListener('mouseenter', (e) => {
          const reflectionList = dayActivities.slice(0, 3).map(a =>
            `<div style="margin-top: 6px; font-size: 11px;"><strong style="color: ${getCategoryColor(a.category, a.pillar)}">${a.category}:</strong> <em style="color: #aaa;">"${a.reflection.substring(0, 80)}${a.reflection.length > 80 ? '...' : ''}"</em></div>`
          ).join('');

          tooltip.innerHTML = `
            <div class="tooltip-title">${new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <div class="tooltip-meta">${dayActivities.length} reflections</div>
            <div class="tooltip-energy">Avg Energy: ${avgEnergy.toFixed(1)}/10</div>
            ${reflectionList}
            ${dayActivities.length > 3 ? `<div style="margin-top: 6px; color: #666; font-size: 10px;">+${dayActivities.length - 3} more...</div>` : ''}
          `;
          tooltip.classList.add('visible');
          moveTooltip(e);
        });
        dayEl.addEventListener('mousemove', moveTooltip);
        dayEl.addEventListener('mouseleave', hideTooltip);
      }

      dayEl.innerHTML = `<span>${d}</span>`;
      grid.appendChild(dayEl);
    }
  });

  const totalReflections = filteredData.filter(i => i.reflection).length;
  updatePeriodLabel(`Reflections Calendar – ${totalReflections} entries`);
}

// ==================== REFLECTIONS CALENDAR ====================
function renderReflectionsCalendar() {
  const reflections = Object.values(reflectionsData);
  const months = [...new Set(reflections.map(r => r.date.substring(0, 7)))].sort();

  container.innerHTML = `
    <div class="reflections-calendar-container">
      <div class="reflections-calendar" id="reflections-calendar"></div>
    </div>
  `;

  const calendar = document.getElementById('reflections-calendar');

  months.forEach(monthKey => {
    const [year, month] = monthKey.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDay = monthStart.getDay();

    const monthEl = document.createElement('div');
    monthEl.className = 'calendar-month';

    monthEl.innerHTML = `
      <div class="calendar-month-title">${monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
      <div class="calendar-grid" id="cal-${monthKey}"></div>
    `;

    calendar.appendChild(monthEl);

    const grid = document.getElementById(`cal-${monthKey}`);

    // Empty cells for padding
    for (let i = 0; i < startDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-day empty';
      grid.appendChild(empty);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const reflection = reflectionsData[dateStr];

      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';

      if (reflection) {
        const color = moodColors[reflection.mood] || '#888';
        dayEl.style.background = color;
        dayEl.classList.add('has-reflection');

        dayEl.addEventListener('mouseenter', (e) => {
          tooltip.innerHTML = `
            <div class="tooltip-title">${reflection.dayOfWeek}, ${new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div class="tooltip-mood" style="color: ${color}; text-transform: capitalize;">${reflection.mood}</div>
            <div style="margin-top: 8px; font-style: italic; color: #aaa; font-size: 12px;">"${reflection.reflection}"</div>
          `;
          tooltip.classList.add('visible');
          moveTooltip(e);
        });
        dayEl.addEventListener('mousemove', moveTooltip);
        dayEl.addEventListener('mouseleave', hideTooltip);
      }

      dayEl.innerHTML = `<span>${d}</span>`;
      grid.appendChild(dayEl);
    }
  });

  updatePeriodLabel(`Reflections Calendar – ${reflections.length} entries`);
}

// ==================== ENERGY HEATMAP ====================
function renderEnergyHeatmap() {
  // Group energy by day of week and hour
  const heatmapData = {};

  filteredData.forEach(item => {
    const start = new Date(item.start);
    const dayOfWeek = start.getDay();
    const hour = start.getHours();
    const key = `${dayOfWeek}-${hour}`;

    if (!heatmapData[key]) {
      heatmapData[key] = { total: 0, count: 0 };
    }
    heatmapData[key].total += item.energyRating;
    heatmapData[key].count += 1;
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  container.innerHTML = `
    <div class="heatmap-container">
      <div class="heatmap-title">Average Energy by Day & Hour</div>
      <div class="heatmap" id="energy-heatmap">
        <div class="heatmap-y-labels">
          ${days.map(d => `<div class="heatmap-y-label">${d}</div>`).join('')}
        </div>
        <div class="heatmap-grid" id="heatmap-grid"></div>
        <div class="heatmap-x-labels">
          ${[0, 3, 6, 9, 12, 15, 18, 21].map(h => `<div class="heatmap-x-label">${h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? h + 'a' : (h-12) + 'p'}</div>`).join('')}
        </div>
      </div>
      <div class="heatmap-legend">
        <span>Low Energy</span>
        <div class="heatmap-legend-gradient"></div>
        <span>High Energy</span>
      </div>
    </div>
  `;

  const grid = document.getElementById('heatmap-grid');

  for (let day = 0; day < 7; day++) {
    const row = document.createElement('div');
    row.className = 'heatmap-row';

    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      const data = heatmapData[key];
      const avgEnergy = data ? data.total / data.count : 0;

      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';

      if (data) {
        // Color scale from blue (low) to green (medium) to yellow (high)
        const hue = avgEnergy * 12; // 0-120 (red to green)
        const saturation = 60 + avgEnergy * 4;
        const lightness = 20 + avgEnergy * 3;
        cell.style.background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        cell.addEventListener('mouseenter', (e) => {
          tooltip.innerHTML = `
            <div class="tooltip-title">${days[day]} at ${hour === 0 ? '12am' : hour === 12 ? '12pm' : hour < 12 ? hour + 'am' : (hour-12) + 'pm'}</div>
            <div class="tooltip-energy">Avg Energy: ${avgEnergy.toFixed(1)}/10</div>
            <div class="tooltip-meta">${data.count} activities</div>
          `;
          tooltip.classList.add('visible');
          moveTooltip(e);
        });
        cell.addEventListener('mousemove', moveTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
      }

      row.appendChild(cell);
    }

    grid.appendChild(row);
  }

  updatePeriodLabel('Energy Heatmap');
}

// ==================== ENERGY TRENDS ====================
function renderEnergyTrends() {
  // Group by month
  const monthlyEnergy = {};

  filteredData.forEach(item => {
    const monthKey = getMonthKey(new Date(item.start));
    if (!monthlyEnergy[monthKey]) {
      monthlyEnergy[monthKey] = { total: 0, count: 0 };
    }
    monthlyEnergy[monthKey].total += item.energyRating;
    monthlyEnergy[monthKey].count += 1;
  });

  const months = Object.keys(monthlyEnergy).sort();
  const avgData = months.map(m => ({
    month: m,
    avg: monthlyEnergy[m].total / monthlyEnergy[m].count,
    count: monthlyEnergy[m].count
  }));

  const maxAvg = Math.max(...avgData.map(d => d.avg));
  const minAvg = Math.min(...avgData.map(d => d.avg));

  container.innerHTML = `
    <div class="trends-container">
      <div class="trends-title">Energy Trends Over Time</div>
      <div class="trends-chart" id="trends-chart"></div>
      <div class="trends-legend">
        <div class="trends-stat">
          <span class="trends-stat-value">${(avgData.reduce((s, d) => s + d.avg, 0) / avgData.length).toFixed(1)}</span>
          <span class="trends-stat-label">Avg Energy</span>
        </div>
        <div class="trends-stat">
          <span class="trends-stat-value">${maxAvg.toFixed(1)}</span>
          <span class="trends-stat-label">Peak</span>
        </div>
        <div class="trends-stat">
          <span class="trends-stat-value">${minAvg.toFixed(1)}</span>
          <span class="trends-stat-label">Low</span>
        </div>
      </div>
    </div>
  `;

  const chart = document.getElementById('trends-chart');
  const chartHeight = 200;
  const barWidth = Math.max(100 / avgData.length, 2);

  avgData.forEach((data, i) => {
    const height = ((data.avg - 0) / 10) * chartHeight;
    const hue = data.avg * 12;

    const bar = document.createElement('div');
    bar.className = 'trends-bar';
    bar.style.width = `${barWidth}%`;
    bar.style.height = `${height}px`;
    bar.style.background = `hsl(${hue}, 70%, 45%)`;

    const [year, month] = data.month.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    bar.addEventListener('mouseenter', (e) => {
      tooltip.innerHTML = `
        <div class="tooltip-title">${monthName}</div>
        <div class="tooltip-energy">Avg Energy: ${data.avg.toFixed(1)}/10</div>
        <div class="tooltip-meta">${data.count} activities</div>
      `;
      tooltip.classList.add('visible');
      moveTooltip(e);
    });
    bar.addEventListener('mousemove', moveTooltip);
    bar.addEventListener('mouseleave', hideTooltip);

    chart.appendChild(bar);
  });

  updatePeriodLabel('Energy Trends');
}

// ==================== ENERGY DISTRIBUTION ====================
function renderEnergyDistribution() {
  // Count activities by energy level
  const distribution = {};
  for (let i = 1; i <= 10; i++) {
    distribution[i] = 0;
  }

  filteredData.forEach(item => {
    const level = Math.round(item.energyRating);
    if (level >= 1 && level <= 10) {
      distribution[level]++;
    }
  });

  const maxCount = Math.max(...Object.values(distribution));
  const total = filteredData.length;

  container.innerHTML = `
    <div class="distribution-container">
      <div class="distribution-title">Energy Level Distribution</div>
      <div class="distribution-chart" id="distribution-chart"></div>
      <div class="distribution-labels">
        ${[1,2,3,4,5,6,7,8,9,10].map(n => `<span>${n}</span>`).join('')}
      </div>
      <div class="distribution-x-label">Energy Level</div>
    </div>
  `;

  const chart = document.getElementById('distribution-chart');

  for (let level = 1; level <= 10; level++) {
    const count = distribution[level];
    const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
    const hue = level * 12;
    const percentage = ((count / total) * 100).toFixed(1);

    const bar = document.createElement('div');
    bar.className = 'distribution-bar';
    bar.style.height = `${height}%`;
    bar.style.background = `hsl(${hue}, 70%, 45%)`;

    bar.addEventListener('mouseenter', (e) => {
      tooltip.innerHTML = `
        <div class="tooltip-title">Energy Level ${level}</div>
        <div class="tooltip-meta">${count} activities (${percentage}%)</div>
      `;
      tooltip.classList.add('visible');
      moveTooltip(e);
    });
    bar.addEventListener('mousemove', moveTooltip);
    bar.addEventListener('mouseleave', hideTooltip);

    chart.appendChild(bar);
  }

  updatePeriodLabel('Energy Distribution');
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
  // Handle different data types
  if (currentDataType === 'reflections') {
    // Check if we have daily reflections OR activity reflections
    const hasDailyReflections = Object.keys(reflectionsData).length > 0;
    const hasActivityReflections = filteredData.some(item => item.reflection);

    if (!hasDailyReflections && !hasActivityReflections) {
      container.innerHTML = `<div class="no-data">No reflections available for this profile.</div>`;
      updatePeriodLabel('Reflections');
      return;
    }

    if (currentView === 'bubble') {
      if (hasDailyReflections) {
        renderReflectionsBubbleChart();
      } else {
        renderActivityReflectionsBubble();
      }
    } else if (currentView === 'treemap') {
      renderActivityReflectionsTreemap();
    } else if (currentView === 'timeline') {
      const months = getUniqueMonths(allData);
      if (!currentMonth || !months.includes(currentMonth)) currentMonth = months[0];
      if (currentMonth) renderReflectionsView(currentMonth);
    } else if (currentView === 'calendar') {
      if (hasDailyReflections) {
        renderReflectionsCalendar();
      } else {
        renderActivityReflectionsCalendar();
      }
    }
    return;
  }

  if (currentDataType === 'energy') {
    if (filteredData.length === 0) {
      container.innerHTML = `<div class="no-data">No data available for energy visualization</div>`;
      updatePeriodLabel('Energy');
      return;
    }
    if (currentView === 'heatmap') {
      renderEnergyHeatmap();
    } else if (currentView === 'trends') {
      renderEnergyTrends();
    } else if (currentView === 'distribution') {
      renderEnergyDistribution();
    }
    return;
  }

  // Activities data type
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
  }
}

function updateFilters() {
  applyFilters();
  renderCurrentView();
}

function updateViewOptions() {
  const viewSelect = document.getElementById('view-select');

  if (currentDataType === 'activities') {
    viewSelect.innerHTML = `
      <option value="day">Day</option>
      <option value="week">Week</option>
      <option value="month">Month</option>
      <option value="year">Year</option>
      <option value="allyears">All Years</option>
    `;
    currentView = 'day';
  } else if (currentDataType === 'reflections') {
    viewSelect.innerHTML = `
      <option value="bubble">Bubble Chart</option>
      <option value="treemap">Tree Map</option>
      <option value="timeline">Timeline</option>
      <option value="calendar">Calendar</option>
    `;
    currentView = 'bubble';
  } else if (currentDataType === 'energy') {
    viewSelect.innerHTML = `
      <option value="heatmap">Heatmap</option>
      <option value="trends">Trends</option>
      <option value="distribution">Distribution</option>
    `;
    currentView = 'heatmap';
  }
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
  } else if (currentView === 'month') {
    // Calculate weeks in the month
    const [year, month] = currentMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const numWeeks = Math.ceil((daysInMonth + monthStart.getDay()) / 7);
    width = 1600;
    height = numWeeks * 90 + 200; // 90px per week row + header/legend
  } else if (currentView === 'week') {
    width = 1600;
    height = 450;
  } else if (currentView === 'day') {
    width = 1600;
    height = 450;
  } else {
    width = 1600;
    height = 500;
  }

  // Create SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <style>
      .bg { fill: #0a0a0a; }
      .title { fill: #f0f0f0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 300; }
      .subtitle { fill: #666; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; }
      .year-label { fill: #666; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; }
      .month-label { fill: #555; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; text-transform: uppercase; }
      .legend-text { fill: #666; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; }
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

  } else if (currentView === 'month') {
    // Export Month view
    const [year, month] = currentMonth.split('-').map(Number);
    const monthData = filterByMonth(filteredData, currentMonth);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const daysInMonth = monthEnd.getDate();

    // Group data by week
    const weeks = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const weekNum = Math.ceil((d + monthStart.getDay()) / 7);
      if (!weeks[weekNum]) weeks[weekNum] = { start: d, end: d, days: [] };
      weeks[weekNum].end = d;
      weeks[weekNum].days.push(d);
    }

    const weekEntries = Object.entries(weeks);
    const rowHeight = 60;
    const rowGap = 30;
    const stripWidth = width - 140;
    const labelWidth = 80;

    weekEntries.forEach(([weekNum, week], weekIdx) => {
      const y = startY + weekIdx * (rowHeight + rowGap);
      const weekDays = week.days.length;

      // Week label
      svg += `<text class="year-label" x="${labelWidth - 10}" y="${y + rowHeight / 2 + 5}" text-anchor="end">Week ${weekNum}</text>`;

      // Row background
      svg += `<rect x="${labelWidth}" y="${y}" width="${stripWidth}" height="${rowHeight}" fill="#0d0d0d" rx="3"/>`;

      // Day labels and dividers
      week.days.forEach((d, i) => {
        const dayX = labelWidth + (i / weekDays) * stripWidth;
        const dayW = stripWidth / weekDays;

        // Day number label
        svg += `<text class="month-label" x="${dayX + dayW / 2}" y="${y - 8}" text-anchor="middle">${d}</text>`;

        // Day divider (except first)
        if (i > 0) {
          svg += `<line x1="${dayX}" y1="${y}" x2="${dayX}" y2="${y + rowHeight}" stroke="#222" stroke-width="1"/>`;
        }
      });

      // Activities for this week
      const weekData = monthData.filter(item => {
        const d = new Date(item.start).getDate();
        return week.days.includes(d);
      });

      weekData.forEach(item => {
        const start = new Date(item.start);
        const dayOfMonth = start.getDate();
        const dayIndex = week.days.indexOf(dayOfMonth);
        const dayStart = getDayStart(start);

        const dayOffset = (dayIndex / weekDays) * stripWidth;
        const timeInDay = (start - dayStart) / (24 * 60 * 60 * 1000);
        const durationInDay = item.duration / (24 * 60);

        const blockX = labelWidth + dayOffset + (timeInDay / weekDays) * stripWidth;
        const blockW = Math.max((durationInDay / weekDays) * stripWidth, 2);
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
    });

    // Legend
    const legendY = startY + weekEntries.length * (rowHeight + rowGap) + 20;
    svg += renderLegendSVG(40, legendY, width - 80);

  } else if (currentView === 'week') {
    // Export Week view
    const weekData = filterByWeek(filteredData, currentWeek);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const rowHeight = 200;
    const stripWidth = width - 80;

    // Row background
    svg += `<rect x="40" y="${startY}" width="${stripWidth}" height="${rowHeight}" fill="#0d0d0d" rx="3"/>`;

    // Day labels and dividers
    days.forEach((day, i) => {
      const dayX = 40 + (i / 7) * stripWidth;
      const dayW = stripWidth / 7;

      // Day name label
      svg += `<text class="month-label" x="${dayX + dayW / 2}" y="${startY - 10}" text-anchor="middle">${day}</text>`;

      // Day divider (except first)
      if (i > 0) {
        svg += `<line x1="${dayX}" y1="${startY}" x2="${dayX}" y2="${startY + rowHeight}" stroke="#222" stroke-width="1"/>`;
      }
    });

    // Activities
    weekData.forEach(item => {
      const start = new Date(item.start);
      const dayOfWeek = start.getDay();
      const dayStart = getDayStart(start);

      const dayOffset = (dayOfWeek / 7) * stripWidth;
      const timeInDay = (start - dayStart) / (24 * 60 * 60 * 1000);
      const durationInDay = item.duration / (24 * 60);

      const blockX = 40 + dayOffset + (timeInDay / 7) * stripWidth;
      const blockW = Math.max((durationInDay / 7) * stripWidth, 2);
      const color = getCategoryColor(item.category, item.pillar);

      let blockH = rowHeight;
      let blockY = startY;
      if (showEnergyHeight) {
        const heightPercent = 0.3 + (item.energyRating / 10) * 0.7;
        blockH = rowHeight * heightPercent;
        blockY = startY + (rowHeight - blockH) / 2;
      }

      svg += `<rect x="${blockX}" y="${blockY}" width="${blockW}" height="${blockH}" fill="${color}" rx="1"/>`;
    });

    // Legend
    const legendY = startY + rowHeight + 40;
    svg += renderLegendSVG(40, legendY, width - 80);

  } else if (currentView === 'day') {
    // Export Day view
    const dayData = filterByDay(filteredData, currentDate);
    const dayStart = new Date(currentDate + 'T00:00:00');
    const rowHeight = 200;
    const stripWidth = width - 80;

    // Row background
    svg += `<rect x="40" y="${startY}" width="${stripWidth}" height="${rowHeight}" fill="#0d0d0d" rx="3"/>`;

    // Time labels (every 3 hours)
    [0, 3, 6, 9, 12, 15, 18, 21, 24].forEach(hour => {
      const x = 40 + (hour / 24) * stripWidth;
      const label = hour === 0 || hour === 24 ? '12a' : hour === 12 ? '12p' : hour < 12 ? `${hour}a` : `${hour - 12}p`;
      svg += `<text class="month-label" x="${x}" y="${startY + rowHeight + 20}" text-anchor="middle">${label}</text>`;
      svg += `<line x1="${x}" y1="${startY + rowHeight}" x2="${x}" y2="${startY + rowHeight + 5}" stroke="#444" stroke-width="1"/>`;
    });

    // Activities
    dayData.forEach(item => {
      const start = new Date(item.start);
      const end = new Date(item.end);
      const leftPos = ((start - dayStart) / (24 * 60 * 60 * 1000)) * stripWidth;
      const blockW = Math.max(((end - start) / (24 * 60 * 60 * 1000)) * stripWidth, 2);
      const color = getCategoryColor(item.category, item.pillar);

      let blockH = rowHeight;
      let blockY = startY;
      if (showEnergyHeight) {
        const heightPercent = 0.3 + (item.energyRating / 10) * 0.7;
        blockH = rowHeight * heightPercent;
        blockY = startY + (rowHeight - blockH) / 2;
      }

      svg += `<rect x="${40 + leftPos}" y="${blockY}" width="${blockW}" height="${blockH}" fill="${color}" rx="2"/>`;
    });

    // Legend
    const legendY = startY + rowHeight + 50;
    svg += renderLegendSVG(40, legendY, width - 80);

  } else {
    // Fallback for unsupported views
    svg += `<text class="subtitle" x="${width/2}" y="${height/2}" text-anchor="middle">SVG export not available for this view</text>`;
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
    <select class="view-select data-type-select" id="data-type-select">
      <option value="activities">Activities</option>
      <option value="reflections">Reflections</option>
      <option value="energy">Energy</option>
    </select>
    <select class="view-select" id="view-select">
      <option value="day">Day</option>
      <option value="week">Week</option>
      <option value="month">Month</option>
      <option value="year">Year</option>
      <option value="allyears">All Years</option>
    </select>
    <select class="view-select" id="pillar-select">
      <option value="all">All Pillars</option>
      <option value="work">Work</option>
      <option value="life">Life</option>
      <option value="health">Health</option>
      <option value="sleep">Sleep</option>
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
  document.getElementById('data-type-select').addEventListener('change', (e) => {
    currentDataType = e.target.value;
    updateViewOptions();
    renderCurrentView();
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
