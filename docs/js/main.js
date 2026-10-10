const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const repoUrl = `https://github.com/${REPO}`;
const linkFor = (p) => {
  const kind = /\.[a-z]+$/i.test(p.path) ? 'blob' : 'tree';
  return `${repoUrl}/${kind}/${BRANCH}/${p.path}`;
};

const grid = document.getElementById('projectsGrid');
const featuredGrid = document.getElementById('featuredGrid');
const search = document.getElementById('searchInput');
const chips = document.getElementById('filterButtons');
const empty = document.getElementById('emptyState');
let active = 'all';

function card(p) {
  return `
    <a class="card" href="${esc(linkFor(p))}" target="_blank" rel="noopener">
      <span class="tag tag-${esc(p.category)}">${esc(categoryLabels[p.category])}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.description)}</p>
      <ul class="tech">${p.tech.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <span class="view">View on GitHub &rarr;</span>
    </a>`;
}

function render() {
  const q = search.value.trim().toLowerCase();
  const rows = projects.filter((p) => {
    const inCat = active === 'all' || p.category === active;
    const inText = !q || [p.title, p.description, ...p.tech].some((s) => s.toLowerCase().includes(q));
    return inCat && inText;
  });
  grid.innerHTML = rows.map(card).join('');
  empty.hidden = rows.length > 0;
}

function init() {
  document.getElementById('githubLink').href = `https://github.com/${REPO.split('/')[0]}`;
  featuredGrid.innerHTML = projects.filter((p) => p.featured).map(card).join('');

  const cats = ['all', ...Object.keys(categoryLabels).filter((c) => c !== 'featured' && projects.some((p) => p.category === c))];
  chips.innerHTML = cats
    .map((c) => `<button type="button" class="chip${c === 'all' ? ' active' : ''}" data-filter="${c}">${c === 'all' ? 'All' : categoryLabels[c]}</button>`)
    .join('');
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    active = b.dataset.filter;
    chips.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === b));
    render();
  });
  search.addEventListener('input', render);

  const langs = new Set(projects.flatMap((p) => p.tech));
  const suites = projects.filter((p) => ['e2e', 'api', 'mobile'].includes(p.category)).length;
  document.getElementById('stats').innerHTML = [
    [projects.length, 'Projects'],
    [suites, 'Test suites'],
    [langs.size, 'Technologies']
  ].map(([n, l]) => `<li><strong>${n}</strong><span>${l}</span></li>`).join('');

  render();
}

init();
