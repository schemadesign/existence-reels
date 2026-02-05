const container = document.getElementById('visualization');

// Tooltip
const tooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0);

// Map energy levels to emotions
function getEmotions(energyRating) {
  if (energyRating >= 8) return ['energized', 'focused', 'motivated'];
  if (energyRating >= 6.5) return ['content', 'engaged', 'steady'];
  if (energyRating >= 5) return ['neutral', 'calm', 'balanced'];
  if (energyRating >= 3.5) return ['tired', 'distracted', 'restless'];
  return ['drained', 'stressed', 'overwhelmed'];
}

let data = null;

async function loadData() {
  data = await d3.json('generated-data.json');
  render();
}

function render(animate = true) {
  // Clear previous chart
  d3.select('#visualization').selectAll('svg').remove();

  const margin = { top: 50, right: 30, bottom: 60, left: 60 };
  const width = Math.min(container.clientWidth, 900) - margin.left - margin.right;
  const height = Math.max(400, Math.min(500, window.innerHeight - 200)) - margin.top - margin.bottom;

  const svg = d3.select('#visualization')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Aggregate: average energy rating and count by category
  const grouped = d3.rollup(
    data,
    v => ({
      avgEnergy: d3.mean(v, d => d.energyRating),
      count: v.length,
      minEnergy: d3.min(v, d => d.energyRating),
      maxEnergy: d3.max(v, d => d.energyRating)
    }),
    d => d.category
  );

  const chartData = Array.from(grouped, ([category, stats]) => ({
    category,
    avgEnergy: stats.avgEnergy,
    count: stats.count,
    minEnergy: stats.minEnergy,
    maxEnergy: stats.maxEnergy,
    emotions: getEmotions(stats.avgEnergy)
  })).sort((a, b) => b.avgEnergy - a.avgEnergy);

  // Scales
  const x = d3.scaleBand()
    .domain(chartData.map(d => d.category))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, 10])
    .range([height, 0]);

  const color = d3.scaleSequential()
    .domain([0, 10])
    .interpolator(d3.interpolateViridis);

  // Title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -15)
    .attr('text-anchor', 'middle')
    .attr('fill', '#f0f0f0')
    .style('font-size', '18px')
    .style('font-weight', '300')
    .style('letter-spacing', '0.05em')
    .text('Energy Levels by Activity');

  // X axis
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'rotate(-35)')
    .style('text-anchor', 'end')
    .style('fill', '#999');

  // Y axis
  svg.append('g')
    .call(d3.axisLeft(y).ticks(10))
    .selectAll('text')
    .style('fill', '#999');

  // Y axis label
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -45)
    .attr('x', -height / 2)
    .attr('text-anchor', 'middle')
    .attr('fill', '#999')
    .text('Average Energy Level');

  // Bars
  const bars = svg.selectAll('.bar')
    .data(chartData)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.category))
    .attr('width', x.bandwidth())
    .attr('fill', d => color(d.avgEnergy))
    .attr('rx', 3);

  if (animate) {
    bars
      .attr('y', height)
      .attr('height', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 40)
      .ease(d3.easeBackOut.overshoot(0.3))
      .attr('y', d => y(d.avgEnergy))
      .attr('height', d => height - y(d.avgEnergy));
  } else {
    bars
      .attr('y', d => y(d.avgEnergy))
      .attr('height', d => height - y(d.avgEnergy));
  }

  // Tooltip events
  bars
    .on('mouseenter', function(event, d) {
      d3.select(this).attr('opacity', 0.8);
      tooltip
        .style('opacity', 1)
        .html(`
          <strong>${d.category}</strong>
          <div class="energy">Energy: ${d.avgEnergy.toFixed(1)}</div>
          <div class="range">Range: ${d.minEnergy} - ${d.maxEnergy}</div>
          <div class="emotions">${d.emotions.join(' · ')}</div>
          <div class="count">${d.count} activities</div>
        `)
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 12) + 'px');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY - 12) + 'px');
    })
    .on('mouseleave', function() {
      d3.select(this).attr('opacity', 1);
      tooltip.style('opacity', 0);
    });

  // Style axis lines
  svg.selectAll('.domain, .tick line')
    .attr('stroke', '#333');
}

// Debounced resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (data) render(false);
  }, 150);
});

loadData();
