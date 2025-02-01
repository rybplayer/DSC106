function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

console.log("IT'S ALIVE!");

let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'https://github.com/rybplayer', title: 'GitHub' }
];

const ARE_WE_HOME = document.documentElement.classList.contains('home');

let nav = document.createElement('nav');
document.body.prepend(nav);

// Add navigation links
for (let p of pages) {
  let url = p.url;
  
  // Add '../' prefix for non-home pages and relative URLs
  if (!ARE_WE_HOME && !url.startsWith('http')) {
    url = '../' + url;
  }

  // Create link element
  let a = document.createElement('a');
  a.href = url;
  a.textContent = p.title;
  
  // Check if this is the current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );
  
  // Add target="_blank" for external links
  if (a.host !== location.host) {
    a.target = "_blank";
  }
  
  nav.append(a);
}

// Add theme switcher
document.body.insertAdjacentHTML(
  'afterbegin',
  `<label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>`
);

// Theme switcher functionality
let select = document.querySelector('.color-scheme select');

// Function to set color scheme
function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  select.value = colorScheme;
  localStorage.colorScheme = colorScheme;
}

// Load saved preference
if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
}

// Handle theme changes
select.addEventListener('input', function(event) {
  setColorScheme(event.target.value);
});

// Handle contact form submission
const form = document.querySelector('form[action^="mailto:"]');
form?.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const data = new FormData(this);
    let url = this.action + "?";
    
    for (let [name, value] of data) {
        url += `${name}=${encodeURIComponent(value)}&`;
    }
    
    // Remove trailing &
    url = url.slice(0, -1);
    
    // Open email client with properly encoded URL
    location.href = url;
});

export async function fetchJSON(url) {
    try {
        // Fetch the JSON file from the given URL
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        console.log(response);

        const data = await response.json();
        return data;    
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
};

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    // Check if containerElement exists
    if (!containerElement) {
        console.error('Container element not found');
        return;
    }

    containerElement.innerHTML = '';

    for (let project of projects) {
        const article = document.createElement('article');
        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image || 'https://vis-society.github.io/labs/2/images/empty.svg'}" alt="${project.title}">
            <p>${project.description}</p>
        `;
        containerElement.appendChild(article);
    }
};

export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
}