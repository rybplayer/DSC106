import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    // Get the container element
    const projectsContainer = document.querySelector('.projects-grid');
    const titleElement = document.querySelector('.projects-title');
    
    // Fetch the projects data
    const projects = await fetchJSON('projects.json');
    
    if (projects) {
        // Update the title with the count
        titleElement.textContent = `${projects.length} Projects`;
        
        // Render the projects
        renderProjects(projects, projectsContainer);
    } else {
        projectsContainer.innerHTML = '<p>No projects found</p>';
    }
});

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// let arc = arcGenerator({
//     startAngle: 0,
//     endAngle: 2 * Math.PI,
//   });

// d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');

// let data = [1, 2];
// let total = 0;

// for (let d of data) {
//   total += d;
// }

// let angle = 0;
// let arcData = [];

// for (let d of data) {
//   let endAngle = angle + (d / total) * 2 * Math.PI;
//   arcData.push({ startAngle: angle, endAngle });
//   angle = endAngle;
// }

let projects = await fetchJSON('projects.json'); // fetch your project data
let selectedIndex = -1;
let selectedYear = null;

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {
    // re-calculate rolled data
    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    // re-calculate data
    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    // Clear existing chart and legend
    d3.select('svg').selectAll('path').remove();
    d3.select('.legend').html('');

    // re-calculate colors and generators
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);
    let arcs = arcData.map((d) => arcGenerator(d));

    // Get reference to the projects container
    const projectsContainer = document.querySelector('.projects-grid');

    // update paths with click functionality
    arcs.forEach((arc, i) => {
        d3.select('svg')
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(i))
            .on('click', () => {
                selectedIndex = selectedIndex === i ? -1 : i;
                selectedYear = selectedIndex === -1 ? null : data[i].label;
                
                d3.select('svg')
                    .selectAll('path')
                    .attr('class', (_, idx) => (
                        selectedIndex === idx ? 'selected' : ''
                    ));

                // Apply both filters
                const filteredProjects = applyFilters(projects);
                renderProjects(filteredProjects, projectsContainer, 'h2');
            });
    });

    // update legend
    let legend = d3.select('.legend');
    data.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });

    legend
    .selectAll('li')
    .attr('class', (_, idx) => (
      selectedIndex === idx ? 'selected' : ''
    ));
}

// Function to apply both filters
function applyFilters(projectsToFilter) {
    let filtered = projectsToFilter;
    
    // Apply search filter
    if (query) {
        filtered = filtered.filter(project => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query.toLowerCase());
        });
    }
    
    // Apply year filter
    if (selectedYear) {
        filtered = filtered.filter(project => project.year === selectedYear);
    }
    
    return filtered;
}

// Call this function on page load
renderPieChart(projects);

let query = '';

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    // Update query value
    query = event.target.value.toLowerCase();

    // Apply both filters
    let filteredProjects = applyFilters(projects);

    // Render the updated projects and pie chart
    const projectsContainer = document.querySelector('.projects-grid');
    renderProjects(filteredProjects, projectsContainer);
    renderPieChart(filteredProjects);
});
