# FieldOps - Modern Field Operations & Dispatch Platform

FieldOps is a modern, high-performance web application designed for field operations, job scheduling, automated dispatch, technician tracking, and client management.

![FieldOps Banner](https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80)

---

## ⚡ Key Capabilities

- **Command Center Dashboard**: Live operational metrics, SLA tracking, active technician status, and high-priority dispatch alerts.
- **Job Lifecycle & Dispatching**:
  - Full Kanban board and searchable tabular list view.
  - 5-step Job Creation wizard: Job Details, Client Assignment, Time & Windows, Site Address/Radius, and Technician Assignment with Checklists.
  - Drag-and-drop or one-click status transitions (`Scheduled`, `Dispatched`, `In Progress`, `Completed`).
- **Interactive Live Map & Radar**:
  - Real-time simulation of field technician locations and job sites.
  - Active route lines and emergency dispatch indicators.
- **Field Crew Roster**:
  - Live technician availability toggling (`Available`, `In Transit`, `On Site`, `Off Duty`).
  - Skill tag filtering and direct contact options.
- **Customer Directory**:
  - Accounts with full service logs, contact points, and billing status.
- **Zero-Config Local State**:
  - Persistent changes via browser `localStorage` with rich demo data preloaded.

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Rajanjagz7/fieldops.git
cd fieldops
```

### 2. Run the application
FieldOps is built with pure, modern web standards (ES Modules, CSS custom properties, semantic HTML5) and does not require a bulky build step.

You can run it directly:
- **Option A (VS Code / Antigravity IDE)**: Open `index.html` with Live Server.
- **Option B (Node.js)**:
  ```bash
  npx serve .
  ```
- **Option C (Python)**:
  ```bash
  python -m http.server 3000
  ```

Open your browser at `http://localhost:3000` (or the port indicated).

---

## 🛠️ Tech Stack

- **Frontend**: Semantic HTML5, Vanilla JavaScript (ES6+ Modules)
- **Styling**: Vanilla CSS3 Design System with CSS variables, Glassmorphism, CSS Grid/Flexbox
- **Icons**: Lucide Icons CDN / SVG
- **Fonts**: Inter & Outfit (Google Fonts)

---

## 👥 Author

- **GitHub**: [@Rajanjagz7](https://github.com/Rajanjagz7)
- **Email**: rajanjagz7@gmail.com
