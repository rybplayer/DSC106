import { fetchJSON, renderProjects } from '../global.js';

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
