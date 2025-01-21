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