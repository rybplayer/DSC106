let data = [];
let commits = [];

// Declare scales globally
let xScale, yScale;

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line),
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));

    displayStats();
    createScatterPlot();
}

function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        return {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
      });
}

function displayStats() {
    // Process commits first
    processCommits();
  
    // Create the dl element
    const dl = d3.select('#meta-stats').append('dl');
  
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Add total files
    dl.append('dt').text('Total files');
    dl.append('dd').text(data.length);

    // Add max depth
    dl.append('dt').text('Max depth');
    dl.append('dd').text(d3.max(data, (d) => d.depth));

    // Add max length
    dl.append('dt').text('Max length');
    dl.append('dd').text(d3.max(data, (d) => d.length));

    // Add longest line
    dl.append('dt').text('Longest line');
    dl.append('dd').text(d3.max(data, (d) => d.length));

    // Add shortest line
    dl.append('dt').text('Shortest line');
    dl.append('dd').text(d3.min(data, (d) => d.length));
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

function createScatterPlot() {
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    // Initialize global scales
    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([height, 0]);

    const dots = svg.append('g').attr('class', 'dots');

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 30]);

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
      
    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Create dots first
    dots
        .selectAll('circle')
        .data(sortedCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .style('fill', 'steelblue')
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1);
            updateTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mousemove', (event) => {
            updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
            const isSelected = d3.select(event.currentTarget).classed('selected');
            d3.select(event.currentTarget).style('fill-opacity', isSelected ? 1 : 0.7);
            updateTooltipVisibility(false);
        });

    // Add gridlines BEFORE the axes
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add axes after dots
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');

    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    // Add brush last
    const brush = d3.brush()
        .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
        .on('brush', brushed)
        .on('end', brushEnded);

    const brushG = svg.append('g')
        .attr('class', 'brush')
        .call(brush);

    // Make sure dots are above brush
    dots.raise();

    function brushed(event) {
        brushSelection = event.selection;
        if (!brushSelection) return;
        
        const [[x0, y0], [x1, y1]] = brushSelection;
        d3.selectAll('circle')
            .style('fill-opacity', d => {
                const cx = xScale(d.datetime);
                const cy = yScale(d.hourFrac);
                return (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) ? 1 : 0.1;
            })
            .style('pointer-events', d => {
                const cx = xScale(d.datetime);
                const cy = yScale(d.hourFrac);
                return (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) ? 'all' : 'none';
            });
        
        // Update selection count and language breakdown
        updateSelectionCount();
        updateLanguageBreakdown();
    }

    function brushEnded(event) {
        if (!event.selection) {
            // Reset all dots if brush is cleared
            brushSelection = null;
            d3.selectAll('circle')
                .style('fill-opacity', 0.7)
                .style('pointer-events', 'all');
            updateSelectionCount();
            updateLanguageBreakdown(); // Update breakdown when brush is cleared
        }
    }
}

function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
        dateStyle: 'full',
    });
    time.textContent = commit.datetime?.toLocaleTimeString();
    author.textContent = commit.author;
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
    tooltip.style.opacity = isVisible ? 1 : 0;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    const bounds = event.currentTarget.getBoundingClientRect();
    
    // Position tooltip relative to the circle's position
    tooltip.style.left = `${bounds.x + bounds.width + 10}px`;
    tooltip.style.top = `${bounds.y}px`;
}
// where should this be called? add it in please
function brushSelector() {
    const svg = document.querySelector('svg');
    // Create brush
    d3.select(svg).call(d3.brush());

    // Raise dots and everything after overlay
    d3.select(svg).selectAll('.dots, .overlay ~ *').raise();

}

let brushSelection = null;

function updateSelection() {
  // Update visual state of dots based on selection
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function isCommitSelected(commit) {
    if (!brushSelection) return false;
    
    const min = { x: brushSelection[0][0], y: brushSelection[0][1] };
    const max = { x: brushSelection[1][0], y: brushSelection[1][1] };
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    
    return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
}

function updateSelectionCount() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
  
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
  }

  function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
        ? commits.filter(isCommitSelected)
        : commits;
    
    const container = document.getElementById('language-breakdown');
    container.innerHTML = ''; // Clear existing content
    
    if (selectedCommits.length === 0) {
        return;
    }

    // Get all lines from selected commits
    const lines = selectedCommits.flatMap(commit => 
        data.filter(d => d.commit === commit.id)
    );

    // Count lines by language
    const breakdown = d3.rollup(
        lines,
        v => v.length,
        d => d.type
    );

    // Calculate total lines for percentage
    const totalLines = Array.from(breakdown.values()).reduce((a, b) => a + b, 0);

    // Sort languages alphabetically
    const sortedEntries = Array.from(breakdown.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    // Create elements for each language
    for (const [language, count] of sortedEntries) {
        const percentage = (count / totalLines * 100).toFixed(1);
        
        const dt = document.createElement('dt');
        dt.textContent = language.toLowerCase(); // Make lowercase to match style
        container.appendChild(dt);
        
        const dd = document.createElement('dd');
        dd.innerHTML = `${count} lines<br>(${percentage}%)`; // Add line break for formatting
        container.appendChild(dd);
    }
}