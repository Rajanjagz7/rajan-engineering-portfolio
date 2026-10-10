/**
 * FieldOps Main Application Controller
 * Orchestrates navigation, views, KPI updates, shortcuts, and component lifecycles.
 */

import { state } from './state.js';
import { JobsComponent } from './components/jobs.js';
import { DispatchComponent } from './components/dispatch.js';
import { CrewComponent } from './components/crew.js';

class FieldOpsApp {
  constructor() {
    this.currentView = 'dashboard';
    this.init();
  }

  init() {
    // Instantiate Components
    this.jobsComponent = new JobsComponent(this);
    this.dispatchComponent = new DispatchComponent(this);
    this.crewComponent = new CrewComponent(this);

    this.initUI();
    this.attachEventListeners();
    this.updateDashboardKPIs();
    this.renderActivityTimeline();

    // Initial render of components
    this.jobsComponent.render();
    this.dispatchComponent.render();
    this.crewComponent.render();

    // Format current date
    const dateEl = document.getElementById('currentDateDisplay');
    if (dateEl) {
      const now = new Date();
      dateEl.textContent = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }

    // Lucide Icons initialization
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  initUI() {
    this.navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    this.views = document.querySelectorAll('.app-view');
    this.globalSearchInput = document.getElementById('globalSearchInput');
    this.toastContainer = document.getElementById('toastContainer');
    this.sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
    this.appSidebar = document.getElementById('appSidebar');
  }

  attachEventListeners() {
    // Navigation items click
    this.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const viewId = item.getAttribute('data-view');
        if (viewId) this.switchView(viewId);
      });
    });

    // Quick jump buttons on dashboard
    const jumpToMapBtn = document.getElementById('jumpToMapBtn');
    if (jumpToMapBtn) {
      jumpToMapBtn.addEventListener('click', () => this.switchView('dispatch'));
    }

    const jumpToAllJobsBtn = document.getElementById('jumpToAllJobsBtn');
    if (jumpToAllJobsBtn) {
      jumpToAllJobsBtn.addEventListener('click', () => this.switchView('jobs'));
    }

    // Open Job Creation Wizard
    const openNewJobBtn = document.getElementById('openNewJobModalBtn');
    if (openNewJobBtn) {
      openNewJobBtn.addEventListener('click', () => {
        this.jobsComponent.openWizardModal();
      });
    }

    const jobsCreateBtn = document.getElementById('jobsCreateBtn');
    if (jobsCreateBtn) {
      jobsCreateBtn.addEventListener('click', () => {
        this.jobsComponent.openWizardModal();
      });
    }

    // Global Search Handler
    if (this.globalSearchInput) {
      this.globalSearchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        this.jobsComponent.setSearchQuery(query);
        if (this.currentView !== 'jobs' && query.trim().length > 0) {
          this.switchView('jobs');
        }
      });
    }

    // Keyboard Shortcuts (Ctrl+K / Cmd+K)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.globalSearchInput?.focus();
      }
      if (e.key === 'Escape') {
        this.jobsComponent.closeWizardModal();
        this.jobsComponent.closeDrawer();
      }
    });

    // Sidebar Collapse
    if (this.sidebarCollapseBtn && this.appSidebar) {
      this.sidebarCollapseBtn.addEventListener('click', () => {
        this.appSidebar.classList.toggle('collapsed');
      });
    }

    // Sync button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.updateDashboardKPIs();
        this.jobsComponent.render();
        this.dispatchComponent.render();
        this.crewComponent.render();
        this.showToast('Synchronized with FieldOps Cloud Grid.', 'success');
      });
    }

    // State Change Listener
    window.addEventListener('fieldops:stateChanged', () => {
      this.updateDashboardKPIs();
      this.renderActivityTimeline();
    });
  }

  switchView(viewId) {
    this.currentView = viewId;

    // Update nav active states
    this.navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Switch visible view
    this.views.forEach(view => {
      if (view.id === `view-${viewId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Re-render if entering specific views
    if (viewId === 'dispatch') {
      this.dispatchComponent.render();
    } else if (viewId === 'jobs') {
      this.jobsComponent.render();
    } else if (viewId === 'crew' || viewId === 'clients') {
      this.crewComponent.render();
    }

    if (window.lucide) window.lucide.createIcons();
  }

  updateDashboardKPIs() {
    const jobs = state.getJobs();
    const crew = state.getCrew();

    const activeJobs = jobs.filter(j => j.status !== 'completed').length;
    const activeCrew = crew.filter(c => c.status !== 'off-duty').length;
    const activeFleet = crew.filter(c => c.status === 'in-transit' || c.status === 'on-site').length;

    const kpiActiveJobs = document.getElementById('kpiActiveJobs');
    const kpiActiveCrew = document.getElementById('kpiActiveCrew');
    const activeFleetCount = document.getElementById('activeFleetCount');
    const sidebarJobCount = document.getElementById('sidebarJobCount');

    if (kpiActiveJobs) kpiActiveJobs.textContent = activeJobs;
    if (kpiActiveCrew) kpiActiveCrew.textContent = `${activeCrew} / ${crew.length}`;
    if (activeFleetCount) activeFleetCount.textContent = `${activeFleet} Techs`;
    if (sidebarJobCount) sidebarJobCount.textContent = activeJobs;

    // Render Priority list on dashboard
    const priorityListEl = document.getElementById('priorityJobsList');
    if (priorityListEl) {
      const priorityJobs = jobs.filter(j => j.priority === 'Critical' || j.priority === 'High').slice(0, 4);
      if (priorityJobs.length === 0) {
        priorityListEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;padding:12px;">No urgent work orders pending.</div>';
      } else {
        priorityListEl.innerHTML = priorityJobs.map(job => `
          <div class="priority-job-item" data-job-id="${job.id}">
            <div class="p-job-meta">
              <span class="p-job-badge ${job.priority}">${job.priority}</span>
              <div>
                <div class="p-job-title">${job.title}</div>
                <div class="p-job-sub">${job.clientName} &bull; ${job.technicianName}</div>
              </div>
            </div>
            <i data-lucide="chevron-right" style="width:16px;height:16px;color:var(--text-muted);"></i>
          </div>
        `).join('');

        priorityListEl.querySelectorAll('.priority-job-item').forEach(item => {
          item.addEventListener('click', () => {
            const jobId = item.getAttribute('data-job-id');
            const job = jobs.find(j => j.id === jobId);
            if (job) this.jobsComponent.openJobDrawer(job);
          });
        });
      }
    }
  }

  renderActivityTimeline() {
    const timelineEl = document.getElementById('activityTimeline');
    if (!timelineEl) return;

    const activities = state.getActivities();
    timelineEl.innerHTML = activities.slice(0, 5).map(act => `
      <div class="activity-item">
        <div class="activity-icon-bullet" style="background:rgba(99,102,241,0.15);color:var(--brand-primary);">
          <i data-lucide="${act.icon || 'activity'}" style="width:14px;height:14px;"></i>
        </div>
        <div>
          <div class="activity-content">${act.text}</div>
          <div class="activity-time">${act.time}</div>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  showToast(message, type = 'info') {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';

    toast.innerHTML = `
      <i data-lucide="${iconName}" style="width:18px;height:18px;"></i>
      <span>${message}</span>
    `;

    this.toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.fieldopsApp = new FieldOpsApp();
});
