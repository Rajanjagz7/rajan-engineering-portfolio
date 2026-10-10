# Portfolio site

Static GitHub Pages source. No build step.

- `index.html` — page
- `css/style.css` — light/dark theme via `prefers-color-scheme`
- `js/data.js` — project catalogue (edit this to add or change projects)
- `js/main.js` — featured grid, search and category filters

## Add a project

Append an entry to `projects` in `js/data.js` with `title`, `category`, `description`, `tech` and `path` (relative to the repo root). Set `featured: true` to show it in the Featured section.

## Preview locally

```bash
python -m http.server 8080 --directory docs
```

## Deploy

Repo **Settings → Pages → Deploy from branch → `main` / `/docs`**.
