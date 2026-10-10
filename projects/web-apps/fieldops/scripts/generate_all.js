const fs = require('fs');
const path = require('path');
const si = require('simple-icons');
const { chromium } = require('C:/Users/Baps/.gemini/antigravity-ide/scratch/fieldops-playwright/node_modules/playwright');
const { CUSTOMER_LIST, fetchUrl } = require('./customer_list.js');

const OUTPUT_DIR = path.join(__dirname, 'customer-logos');
const SVG_DIR = path.join(OUTPUT_DIR, 'svg');
const PNG_DIR = path.join(OUTPUT_DIR, 'png');

// Ensure output directories exist
[OUTPUT_DIR, SVG_DIR, PNG_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function main() {
  console.log(`Starting generation of ${CUSTOMER_LIST.length} Full HD customer logos...`);
  const startTime = Date.now();

  const siIcons = Object.values(si);
  const customersMetadata = [];

  // Step 1: Prepare all SVGs
  console.log('Step 1: Preparing SVGs and resolving brand colors...');
  for (let i = 0; i < CUSTOMER_LIST.length; i++) {
    const item = CUSTOMER_LIST[i];
    let svgContent = '';
    let brandHex = '';

    if (item.source === 'si') {
      const icon = siIcons.find(x => x.slug === item.slug);
      brandHex = icon.hex ? `#${icon.hex}` : '#000000';
      // simple-icons SVGs have <path d="..." /> without fill. We add fill with the official brand color.
      svgContent = icon.svg.replace('<path ', `<path fill="${brandHex}" `);
    } else {
      try {
        svgContent = await fetchUrl(item.url);
        brandHex = '#0ea5e9'; // fallback brand accent
      } catch (err) {
        console.error(`Error downloading ${item.name} from ${item.url}:`, err.message);
        continue;
      }
    }

    // Save SVG file
    const svgFilename = `${item.id}.svg`;
    fs.writeFileSync(path.join(SVG_DIR, svgFilename), svgContent, 'utf8');

    customersMetadata.push({
      id: item.id,
      name: item.name,
      sector: item.sector,
      category: item.category,
      website: item.website,
      hex: brandHex,
      svgFile: `svg/${svgFilename}`,
      pngFile: `png/${item.id}.png`,
      svgRaw: svgContent
    });
  }

  console.log(`Prepared ${customersMetadata.length} SVGs successfully.`);

  // Step 2: Render Full HD (1920x1080) Transparent PNGs using Playwright
  console.log('Step 2: Rendering 1920x1080 Full HD PNGs with Chromium...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  let renderedCount = 0;
  for (const item of customersMetadata) {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1920px;
    height: 1080px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    overflow: hidden;
  }
  .stage {
    width: 1300px;
    height: 650px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  svg {
    width: 100%;
    height: 100%;
    max-width: 1200px;
    max-height: 580px;
    object-fit: contain;
  }
</style>
</head>
<body>
  <div class="stage">
    ${item.svgRaw}
  </div>
</body>
</html>`;

    await page.setContent(html);
    const pngBuffer = await page.screenshot({ omitBackground: true, type: 'png' });
    fs.writeFileSync(path.join(PNG_DIR, `${item.id}.png`), pngBuffer);
    renderedCount++;

    if (renderedCount % 25 === 0 || renderedCount === customersMetadata.length) {
      console.log(`Rendered [${renderedCount}/${customersMetadata.length}] Full HD logos (${Math.round((Date.now() - startTime)/1000)}s elapsed)`);
    }
  }

  await browser.close();

  // Clean raw SVG from metadata before saving JSON
  const finalJson = customersMetadata.map(({ svgRaw, ...rest }) => rest);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'customers.json'),
    JSON.stringify(finalJson, null, 2),
    'utf8'
  );
  console.log('Step 3: customers.json generated with full metadata.');

  // Step 4: Generate Interactive Preview Showcase HTML
  console.log('Step 4: Creating interactive preview gallery (preview.html)...');
  const previewHtml = generatePreviewHtml(finalJson);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'preview.html'), previewHtml, 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), previewHtml, 'utf8');

  // Step 5: Generate README.md
  console.log('Step 5: Generating documentation README.md...');
  const readmeMd = generateReadme(finalJson);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), readmeMd, 'utf8');

  console.log(`All assets created in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`);
}

function generatePreviewHtml(items) {
  const sectors = [...new Set(items.map(x => x.sector))];
  const itemsJson = JSON.stringify(items);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FieldOps Customer Logos | 150 Full HD Enterprise Customer Roster</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #080b11;
      --card-dark: #0f1523;
      --card-border: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #00e599;
      --primary-glow: rgba(0, 229, 153, 0.25);
      --accent-blue: #38bdf8;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg-dark);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      padding-bottom: 80px;
    }

    /* Ambient Background Glow */
    .ambient-glow {
      position: fixed;
      top: -200px;
      left: 50%;
      transform: translateX(-50%);
      width: 1000px;
      height: 500px;
      background: radial-gradient(circle, rgba(0, 229, 153, 0.12) 0%, rgba(56, 189, 248, 0.08) 50%, transparent 70%);
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
    }

    .container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 32px;
      position: relative;
      z-index: 1;
    }

    /* Header */
    header {
      padding: 48px 0 32px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 24px;
    }

    .brand-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 229, 153, 0.1);
      color: var(--primary);
      border: 1px solid rgba(0, 229, 153, 0.3);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    h1 {
      font-size: 38px;
      font-weight: 800;
      letter-spacing: -0.8px;
      background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.2;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 16px;
      margin-top: 8px;
      max-width: 700px;
      line-height: 1.6;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-download-zip {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: var(--primary);
      color: #04100c;
      font-weight: 700;
      font-size: 15px;
      padding: 12px 24px;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 4px 20px var(--primary-glow);
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
    }

    .btn-download-zip:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 229, 153, 0.4);
    }

    .stats-bar {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.03);
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .stat-badge strong {
      color: #fff;
      font-weight: 700;
    }

    /* Controls: Search, Filter, Background Switcher */
    .controls-wrapper {
      margin: 32px 0 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .search-and-view {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 280px;
      position: relative;
    }

    .search-box input {
      width: 100%;
      background: #0f172a;
      border: 1px solid #1e293b;
      padding: 14px 18px 14px 44px;
      border-radius: 12px;
      color: #fff;
      font-size: 15px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-box input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(0, 229, 153, 0.15);
    }

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      pointer-events: none;
    }

    .view-mode-toggles {
      display: flex;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 4px;
      gap: 4px;
    }

    .toggle-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toggle-btn.active {
      background: #1e293b;
      color: #fff;
    }

    /* Category Filter Pills */
    .category-pills {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 6px;
    }

    .pill {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pill:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .pill.active {
      background: var(--primary);
      color: #04100c;
      border-color: var(--primary);
      font-weight: 700;
    }

    /* Logos Grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }

    /* Card */
    .card {
      background: var(--card-dark);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
      position: relative;
    }

    .card:hover {
      transform: translateY(-4px);
      border-color: rgba(0, 229, 153, 0.4);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
    }

    .logo-canvas-wrap {
      height: 140px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      transition: background 0.2s;
      position: relative;
      overflow: hidden;
    }

    /* Background presets for card logo preview */
    .bg-dark-card {
      background: #090d16;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .bg-slate-card {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .bg-light-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
    }
    .bg-checker-card {
      background-image: linear-gradient(45deg, #182234 25%, transparent 25%), linear-gradient(-45deg, #182234 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #182234 75%), linear-gradient(-45deg, transparent 75%, #182234 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
      background-color: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .logo-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));
      transition: transform 0.2s;
    }

    .card:hover .logo-img {
      transform: scale(1.06);
    }

    .card-info {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-meta {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 2px;
      line-height: 1.4;
    }

    .card-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .btn-action {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #e2e8f0;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s;
    }

    .btn-action:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.2);
    }

    .btn-action.copied {
      background: rgba(0, 229, 153, 0.15);
      color: var(--primary);
      border-color: var(--primary);
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      border: 1px solid var(--primary);
      color: #fff;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.25s ease;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    /* Empty state */
    .empty-state {
      grid-column: 1 / -1;
      padding: 64px 0;
      text-align: center;
      color: #64748b;
    }

    /* Code Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 20px;
    }

    .modal-overlay.open {
      display: flex;
    }

    .modal-content {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 16px;
      max-width: 600px;
      width: 100%;
      padding: 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .modal-header h3 {
      font-size: 18px;
      color: #fff;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 20px;
      cursor: pointer;
    }

    pre code {
      display: block;
      background: #020617;
      border: 1px solid #1e293b;
      padding: 14px;
      border-radius: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #38bdf8;
      overflow-x: auto;
      margin: 12px 0;
    }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>

  <div class="container">
    <header>
      <div class="header-top">
        <div>
          <div class="brand-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            FieldOps Brand Asset Studio
          </div>
          <h1>Customer Logo Master Pack</h1>
          <p class="subtitle">
            150 Verified High-Profile Global Enterprise, Industrial, Logistics & SaaS Customer Logos.
            Available in crisp <strong>1920×1080 Full HD Transparent PNG</strong> and scalable <strong>Vector SVG</strong>.
          </p>
          <div class="stats-bar">
            <div class="stat-badge">Total Logos: <strong id="totalCount">${items.length}</strong></div>
            <div class="stat-badge">Resolution: <strong>1920 × 1080 (1080p)</strong></div>
            <div class="stat-badge">Formats: <strong>PNG + SVG</strong></div>
            <div class="stat-badge">Archive: <strong>fieldops-customer-logos-fullhd.zip</strong></div>
          </div>
        </div>
        <div class="header-actions">
          <a href="fieldops-customer-logos-fullhd.zip" download class="btn-download-zip">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download ZIP (${items.length} Logos)
          </a>
        </div>
      </div>

      <!-- Controls -->
      <div class="controls-wrapper">
        <div class="search-and-view">
          <div class="search-box">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="searchInput" placeholder="Search by company name, industry, keyword... (e.g. Caterpillar, Logistics, AWS)">
          </div>
          <div class="view-mode-toggles">
            <button class="toggle-btn active" onclick="setBackground('bg-dark-card', this)">Dark</button>
            <button class="toggle-btn" onclick="setBackground('bg-slate-card', this)">Slate</button>
            <button class="toggle-btn" onclick="setBackground('bg-checker-card', this)">Grid</button>
            <button class="toggle-btn" onclick="setBackground('bg-light-card', this)">Light</button>
          </div>
        </div>

        <div class="category-pills">
          <button class="pill active" onclick="filterSector('all', this)">All Sectors (${items.length})</button>
          ${sectors.map(sec => {
            const count = items.filter(x => x.sector === sec).length;
            return `<button class="pill" onclick="filterSector('${sec}', this)">${sec} (${count})</button>`;
          }).join('')}
        </div>
      </div>
    </header>

    <!-- Logo Grid -->
    <main>
      <div class="grid" id="logosGrid"></div>
    </main>
  </div>

  <div class="toast" id="toast">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e599" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
    <span id="toastMsg">Code copied to clipboard!</span>
  </div>

  <script>
    const customers = ${itemsJson};
    let currentSector = 'all';
    let searchQuery = '';
    let currentBgClass = 'bg-dark-card';

    const grid = document.getElementById('logosGrid');
    const searchInput = document.getElementById('searchInput');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');

    function renderGrid() {
      const filtered = customers.filter(c => {
        const matchesSector = currentSector === 'all' || c.sector === currentSector;
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
        return matchesSector && matchesSearch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = \`<div class="empty-state">
          <h3>No logos found matching "\${searchQuery}"</h3>
          <p>Try searching for a different company or industry.</p>
        </div>\`;
        return;
      }

      grid.innerHTML = filtered.map(c => \`
        <div class="card" id="card-\${c.id}">
          <div class="logo-canvas-wrap \${currentBgClass}">
            <img class="logo-img" src="\${c.pngFile}" alt="\${c.name} Logo" loading="lazy" />
          </div>
          <div class="card-info">
            <div class="card-title">
              <span>\${c.name}</span>
            </div>
            <div class="card-meta">\${c.category}</div>
          </div>
          <div class="card-actions">
            <button class="btn-action" onclick="copySnippet('\${c.id}', '\${c.name}', this)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy &lt;img&gt;
            </button>
            <a href="\${c.pngFile}" download="\${c.id}-fullhd.png" class="btn-action">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              PNG (1080p)
            </a>
          </div>
        </div>
      \`).join('');
    }

    function filterSector(sec, el) {
      currentSector = sec;
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      el.classList.add('active');
      renderGrid();
    }

    function setBackground(bgClass, el) {
      currentBgClass = bgClass;
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      document.querySelectorAll('.logo-canvas-wrap').forEach(w => {
        w.className = 'logo-canvas-wrap ' + bgClass;
      });
    }

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderGrid();
    });

    function copySnippet(id, name, btn) {
      const code = \`<img src="assets/customers/\${id}.png" alt="\${name}" class="customer-logo" width="160" height="90" loading="lazy" />\`;
      navigator.clipboard.writeText(code).then(() => {
        showToast(\`Copied <img> snippet for \${name}\`);
        btn.classList.add('copied');
        btn.innerHTML = \`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e599" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Copied!\`;
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = \`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy &lt;img&gt;\`;
        }, 2000);
      });
    }

    function showToast(msg) {
      toastMsg.innerText = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // Initial render
    renderGrid();
  </script>
</body>
</html>`;
}

function generateReadme(items) {
  return `# FieldOps Customer Logos (Full HD Roster)

A complete collection of **${items.length} verified customer & enterprise partner logos** in **1920×1080 Full HD (1080p)** resolution and scalable **Vector SVG** format, specially tailored for the **FieldOps** platform (Field Operations, Job Dispatch, Workforce Management, Facilities, Logistics & Industrial Equipment).

## Package Contents

- **\`png/\`**: ${items.length} Full HD (1920×1080) transparent background PNGs with crisp vector-rendered clarity and proportional padding.
- **\`svg/\`**: ${items.length} Original Scalable Vector Graphics (SVG) with official brand colors.
- **\`customers.json\`**: Structured database mapping each customer's name, sector/industry, website, official hex brand color, and relative file paths.
- **\`preview.html\`** / **\`index.html\`**: Interactive showcase gallery to preview, search, test on dark/slate/light/checker backgrounds, copy code snippets, and download individual logos.
- **\`fieldops-customer-logos-fullhd.zip\`**: The full compressed archive containing all assets.

## Industries Represented

1. **Heavy Equipment & Industrial Automation**: Caterpillar, Siemens, Bosch, Schneider Electric, John Deere, ABB, General Electric, Hitachi, Mitsubishi, 3M, Airbus, Boeing, Sony, Panasonic, Samsung, LG, Sharp, Abbott, AbbVie, Accenture, ADP, Fujitsu, Acer, Honeywell, Toshiba
2. **Logistics, Freight & Aviation Fleet**: FedEx, DHL, UPS, Deutsche Post, AfterShip, Singapore Airlines, Delta, United Airlines, Lufthansa, Air France, British Airways, American Airlines, KLM, Qatar Airways, Emirates, Air Canada, Qantas, ANA, Japan Airlines, Turkish Airlines, Iberia, Air India, Southwest Airlines, Ryanair, easyJet
3. **Automotive & Commercial Vehicles**: Tesla, Toyota, BMW, Ford, Volvo, Hyundai, Kia, Audi, Porsche, Nissan, Honda, Chevrolet, Jeep, Renault, Peugeot, Subaru, Mazda, General Motors, Suzuki, Ferrari, Lamborghini, Aston Martin, Bentley, Bugatti, Maserati
4. **Energy, Utilities, Telecom & Services**: Shell, Vodafone, Orange, Telefónica, BT, Airtel, TCS, Infosys, Wipro, Uber, Lyft, Booking.com, Expedia, Tripadvisor, Airbnb, Motorola Solutions, Garmin, Bose, Epson, Nikon, Fujifilm, Adyen, Klarna, eBay, Netflix
5. **Enterprise Cloud, Tech & Hardware**: Microsoft, Google Cloud, AWS, Amazon, Apple, Cisco, IBM, Intel, AMD, NVIDIA, Oracle, Salesforce, SAP, Dell Technologies, HP Enterprise, Lenovo, Qualcomm, Broadcom, VMware, Red Hat, Splunk, Snowflake, Datadog, Cloudflare, Stripe
6. **Modern SaaS, Operations & Developer Platforms**: Shopify, Slack, Zoom, Atlassian, Jira, Confluence, Trello, GitHub, GitLab, Docker, Kubernetes, HashiCorp, Terraform, Ansible, Jenkins, Sentry, New Relic, Dynatrace, Grafana, Prometheus, MongoDB, Redis, PostgreSQL, MySQL, Supabase

## Quick Integration Guide

### 1. In HTML Customer Showcase / Logo Carousel
\`\`\`html
<!-- Example Customer Logo Grid in FieldOps -->
<div class="customer-logo-item">
  <img src="assets/customers/caterpillar.png" alt="Caterpillar" width="160" height="90" loading="lazy">
</div>
<div class="customer-logo-item">
  <img src="assets/customers/siemens.png" alt="Siemens" width="160" height="90" loading="lazy">
</div>
<div class="customer-logo-item">
  <img src="assets/customers/fedex.png" alt="FedEx" width="160" height="90" loading="lazy">
</div>
\`\`\`

### 2. In JavaScript / Dynamic Render (React, Vue, Vanilla)
\`\`\`javascript
// Fetch customers.json
const response = await fetch('assets/customers/customers.json');
const customers = await response.json();

// Render into logo marquee / customer grid
const grid = document.querySelector('.customer-grid');
grid.innerHTML = customers.map(c => \`
  <div class="customer-card" title="\${c.name} - \${c.category}">
    <img src="\${c.pngFile}" alt="\${c.name} Logo" loading="lazy" />
  </div>
\`).join('');
\`\`\`
`;
}

main().catch(console.error);
