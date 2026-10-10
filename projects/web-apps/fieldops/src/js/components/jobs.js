/**
 * Jobs & Work Orders Component
 * Handles Kanban board, table views, filtering, and 5-step Job Creation wizard.
 */

import { state } from '../state.js';

export class JobsComponent {
  constructor(app) {
    this.app = app;
    this.currentStep = 1;
    this.totalSteps = 5;
    this.activeFilters = {
      status: 'all',
      priority: 'all',
      technician: 'all',
      search: ''
    };
    this.selectedTechId = null;
    this.customChecklist = [];

    this.initElements();
    this.attachEvents();
  }

  initElements() {
    // Kanban containers
    this.cardsScheduled = document.getElementById('cards-scheduled');
    this.cardsDispatched = document.getElementById('cards-dispatched');
    this.cardsInProgress = document.getElementById('cards-in-progress');
    this.cardsCompleted = document.getElementById('cards-completed');

    // Counts
    this.countScheduled = document.getElementById('count-scheduled');
    this.countDispatched = document.getElementById('count-dispatched');
    this.countInProgress = document.getElementById('count-in-progress');
    this.countCompleted = document.getElementById('count-completed');
    this.visibleJobsCount = document.getElementById('visibleJobsCount');

    // Table view
    this.jobsTableView = document.getElementById('jobsTableView');
    this.jobsTableBody = document.getElementById('jobsTableBody');
    this.kanbanBoard = document.getElementById('kanbanBoard');
    this.viewModeKanban = document.getElementById('viewModeKanban');
    this.viewModeList = document.getElementById('viewModeList');

    // Filters
    this.filterStatus = document.getElementById('filterStatus');
    this.filterPriority = document.getElementById('filterPriority');
    this.filterTechnician = document.getElementById('filterTechnician');

    // Wizard Modal
    this.modal = document.getElementById('jobWizardModal');
    this.closeModalBtn = document.getElementById('closeWizardModalBtn');
    this.wizardCancelBtn = document.getElementById('wizardCancelBtn');
    this.wizardPrevBtn = document.getElementById('wizardPrevBtn');
    this.wizardNextBtn = document.getElementById('wizardNextBtn');
    this.wizardSubmitBtn = document.getElementById('wizardSubmitBtn');
    this.jobForm = document.getElementById('createJobForm');
    this.clientSelect = document.getElementById('jobClientSelect');
    this.wizardTechList = document.getElementById('wizardTechSelectionList');
    this.addCustomTaskBtn = document.getElementById('addCustomTaskBtn');
    this.customTaskInput = document.getElementById('customTaskInput');
    this.wizardChecklistContainer = document.getElementById('wizardChecklistContainer');

    // Job Detail Drawer
    this.drawer = document.getElementById('jobDetailDrawer');
    this.closeDrawerBtn = document.getElementById('closeDrawerBtn');
    this.drawerJobId = document.getElementById('drawerJobId');
    this.drawerJobTitle = document.getElementById('drawerJobTitle');
    this.drawerContent = document.getElementById('drawerContent');

    // Set today's date in wizard form
    const dateInput = document.getElementById('jobStartDateInput');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  }

  attachEvents() {
    // Mode toggles
    this.viewModeKanban.addEventListener('click', () => this.setViewMode('kanban'));
    this.viewModeList.addEventListener('click', () => this.setViewMode('list'));

    // Filters
    this.filterStatus.addEventListener('change', (e) => {
      this.activeFilters.status = e.target.value;
      this.render();
    });
    this.filterPriority.addEventListener('change', (e) => {
      this.activeFilters.priority = e.target.value;
      this.render();
    });
    this.filterTechnician.addEventListener('change', (e) => {
      this.activeFilters.technician = e.target.value;
      this.render();
    });

    // Wizard navigation
    this.wizardNextBtn.addEventListener('click', () => this.goToNextStep());
    this.wizardPrevBtn.addEventListener('click', () => this.goToPrevStep());
    this.wizardCancelBtn.addEventListener('click', () => this.closeWizardModal());
    this.closeModalBtn.addEventListener('click', () => this.closeWizardModal());
    this.wizardSubmitBtn.addEventListener('click', (e) => this.handleJobSubmit(e));

    // Custom task checklist
    this.addCustomTaskBtn.addEventListener('click', () => this.addChecklistItem());
    this.customTaskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addChecklistItem();
      }
    });

    // Drawer close
    this.closeDrawerBtn.addEventListener('click', () => this.closeDrawer());
    this.drawer.addEventListener('click', (e) => {
      if (e.target === this.drawer) this.closeDrawer();
    });

    // Stepper header clicks
    document.querySelectorAll('.step-indicator').forEach(indicator => {
      indicator.addEventListener('click', () => {
        const targetStep = parseInt(indicator.getAttribute('data-step'), 10);
        if (targetStep < this.currentStep) {
          this.setWizardStep(targetStep);
        }
      });
    });

    // Global state sync
    window.addEventListener('fieldops:stateChanged', (e) => {
      if (e.detail?.type === 'jobs' || e.detail?.type === 'crew') {
        this.render();
      }
    });
  }

  setViewMode(mode) {
    if (mode === 'kanban') {
      this.viewModeKanban.classList.add('active');
      this.viewModeList.classList.remove('active');
      this.kanbanBoard.style.display = 'grid';
      this.jobsTableView.style.display = 'none';
    } else {
      this.viewModeKanban.classList.remove('active');
      this.viewModeList.classList.add('active');
      this.kanbanBoard.style.display = 'none';
      this.jobsTableView.style.display = 'block';
    }
  }

  setSearchQuery(query) {
    this.activeFilters.search = query.toLowerCase().trim();
    this.render();
  }

  render() {
    const jobs = state.getJobs();
    const crew = state.getCrew();

    // Populate technician filter dropdown
    if (this.filterTechnician.children.length <= 1) {
      crew.forEach(tech => {
        const opt = document.createElement('option');
        opt.value = tech.id;
        opt.textContent = tech.name;
        this.filterTechnician.appendChild(opt);
      });
    }

    // Filter jobs
    const filteredJobs = jobs.filter(job => {
      if (this.activeFilters.status !== 'all' && job.status !== this.activeFilters.status) {
        return false;
      }
      if (this.activeFilters.priority !== 'all' && job.priority !== this.activeFilters.priority) {
        return false;
      }
      if (this.activeFilters.technician !== 'all' && job.technicianId !== this.activeFilters.technician) {
        return false;
      }
      if (this.activeFilters.search) {
        const query = this.activeFilters.search;
        const matchTitle = job.title.toLowerCase().includes(query);
        const matchClient = (job.clientName || '').toLowerCase().includes(query);
        const matchTech = (job.technicianName || '').toLowerCase().includes(query);
        const matchCategory = (job.category || '').toLowerCase().includes(query);
        const matchId = (job.id || '').toLowerCase().includes(query);
        if (!matchTitle && !matchClient && !matchTech && !matchCategory && !matchId) {
          return false;
        }
      }
      return true;
    });

    if (this.visibleJobsCount) {
      this.visibleJobsCount.textContent = filteredJobs.length;
    }

    // Clear Kanban containers
    this.cardsScheduled.innerHTML = '';
    this.cardsDispatched.innerHTML = '';
    this.cardsInProgress.innerHTML = '';
    this.cardsCompleted.innerHTML = '';

    let countSched = 0;
    let countDisp = 0;
    let countInProg = 0;
    let countComp = 0;

    filteredJobs.forEach(job => {
      const cardEl = this.createKanbanCard(job);

      if (job.status === 'scheduled') {
        this.cardsScheduled.appendChild(cardEl);
        countSched++;
      } else if (job.status === 'dispatched') {
        this.cardsDispatched.appendChild(cardEl);
        countDisp++;
      } else if (job.status === 'in-progress') {
        this.cardsInProgress.appendChild(cardEl);
        countInProg++;
      } else if (job.status === 'completed') {
        this.cardsCompleted.appendChild(cardEl);
        countComp++;
      }
    });

    this.countScheduled.textContent = countSched;
    this.countDispatched.textContent = countDisp;
    this.countInProgress.textContent = countInProg;
    this.countCompleted.textContent = countComp;

    // Render Table View
    this.renderTable(filteredJobs);

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  createKanbanCard(job) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.setAttribute('draggable', 'true');
    card.dataset.jobId = job.id;

    card.innerHTML = `
      <div class="card-top-row">
        <span class="card-job-id">#${job.id.toUpperCase()}</span>
        <span class="card-priority-pill ${job.priority}">${job.priority}</span>
      </div>
      <h4 class="card-job-heading">${job.title}</h4>
      <div class="card-client-name">
        <i data-lucide="building"></i>
        <span>${job.clientName || 'Unassigned Client'}</span>
      </div>
      <div class="card-footer-meta">
        <span><i data-lucide="clock" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px;"></i>${job.timeWindow || 'Pending'}</span>
        <span class="assigned-tech-badge">
          ${job.technicianName !== 'Unassigned' ? `<strong>${job.technicianName}</strong>` : '<span class="text-muted">Unassigned</span>'}
        </span>
      </div>
    `;

    // Click to open details drawer
    card.addEventListener('click', () => this.openJobDrawer(job));

    // Drag-and-drop support
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', job.id);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    return card;
  }

  renderTable(jobs) {
    this.jobsTableBody.innerHTML = '';
    if (jobs.length === 0) {
      this.jobsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No work orders match the current filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    jobs.forEach(job => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="font-weight: 600; color: #fff;">${job.title}</div>
          <div style="font-size: 0.75rem; color: var(--brand-primary);">#${job.id.toUpperCase()} &bull; ${job.category}</div>
        </td>
        <td>
          <div>${job.clientName}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${job.address}</div>
        </td>
        <td>
          <span class="card-priority-pill ${job.priority}">${job.priority}</span>
        </td>
        <td>
          <strong>${job.technicianName}</strong>
        </td>
        <td>
          <div>${job.startDate}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${job.timeWindow}</div>
        </td>
        <td>
          <span class="status-indicator status-${job.status === 'in-progress' ? 'inprogress' : job.status}"></span>
          <span style="text-transform: capitalize; margin-left: 6px;">${job.status}</span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline btn-job-inspect" data-job-id="${job.id}">
            Inspect
          </button>
        </td>
      `;

      tr.querySelector('.btn-job-inspect').addEventListener('click', () => {
        this.openJobDrawer(job);
      });

      this.jobsTableBody.appendChild(tr);
    });
  }

  // ================= 5-STEP WIZARD MODAL =================
  openWizardModal() {
    this.currentStep = 1;
    this.setWizardStep(1);
    this.populateWizardOptions();
    this.modal.classList.add('open');
    if (window.lucide) window.lucide.createIcons();
  }

  closeWizardModal() {
    this.modal.classList.remove('open');
    this.jobForm.reset();
  }

  populateWizardOptions() {
    const clients = state.getClients();
    const crew = state.getCrew();

    // Populate Clients
    this.clientSelect.innerHTML = clients.map(c => `
      <option value="${c.id}" data-address="${c.address}">${c.name} (${c.category})</option>
    `).join('');

    // Pre-fill address on change
    this.clientSelect.addEventListener('change', (e) => {
      const selectedOpt = e.target.selectedOptions[0];
      const addrInput = document.getElementById('jobAddressInput');
      if (selectedOpt && addrInput) {
        addrInput.value = selectedOpt.getAttribute('data-address') || '';
      }
    });

    if (clients.length > 0) {
      document.getElementById('jobAddressInput').value = clients[0].address;
    }

    // Populate Technicians Radio Cards
    this.wizardTechList.innerHTML = crew.map(tech => `
      <div class="tech-radio-card" data-tech-id="${tech.id}">
        <img src="${tech.avatar}" alt="${tech.name}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;">
        <div>
          <div style="font-weight: 600; font-size: 0.85rem; color: #fff;">${tech.name}</div>
          <div style="font-size: 0.72rem; color: var(--text-secondary);">${tech.role}</div>
          <div style="font-size: 0.68rem; color: ${tech.status === 'available' ? 'var(--emerald-500)' : 'var(--amber-500)'}; text-transform: uppercase; font-weight: 700;">
            &bull; ${tech.status}
          </div>
        </div>
      </div>
    `).join('');

    // Radio selection
    this.selectedTechId = crew[0]?.id || null;
    const cards = this.wizardTechList.querySelectorAll('.tech-radio-card');
    if (cards[0]) cards[0].classList.add('selected');

    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedTechId = card.getAttribute('data-tech-id');
      });
    });
  }

  setWizardStep(step) {
    this.currentStep = step;

    // Toggle Panes
    document.querySelectorAll('.wizard-step-pane').forEach((pane, idx) => {
      if (idx + 1 === step) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Update Stepper Indicators
    document.querySelectorAll('.step-indicator').forEach((ind, idx) => {
      const s = idx + 1;
      ind.classList.remove('active', 'completed');
      if (s === step) {
        ind.classList.add('active');
      } else if (s < step) {
        ind.classList.add('completed');
      }
    });

    // Buttons
    if (step === 1) {
      this.wizardPrevBtn.style.visibility = 'hidden';
    } else {
      this.wizardPrevBtn.style.visibility = 'visible';
    }

    if (step === this.totalSteps) {
      this.wizardNextBtn.style.display = 'none';
      this.wizardSubmitBtn.style.display = 'inline-flex';
    } else {
      this.wizardNextBtn.style.display = 'inline-flex';
      this.wizardSubmitBtn.style.display = 'none';
    }

    if (window.lucide) window.lucide.createIcons();
  }

  goToNextStep() {
    // Step validation
    if (this.currentStep === 1) {
      const title = document.getElementById('jobTitleInput').value.trim();
      if (!title) {
        this.app.showToast('Please enter a job title.', 'error');
        return;
      }
    } else if (this.currentStep === 2) {
      const address = document.getElementById('jobAddressInput').value.trim();
      if (!address) {
        this.app.showToast('Please enter a site address.', 'error');
        return;
      }
    } else if (this.currentStep === 3) {
      const date = document.getElementById('jobStartDateInput').value;
      if (!date) {
        this.app.showToast('Please specify a scheduled date.', 'error');
        return;
      }
    }

    if (this.currentStep < this.totalSteps) {
      this.setWizardStep(this.currentStep + 1);
    }
  }

  goToPrevStep() {
    if (this.currentStep > 1) {
      this.setWizardStep(this.currentStep - 1);
    }
  }

  addChecklistItem() {
    const text = this.customTaskInput.value.trim();
    if (!text) return;

    const item = document.createElement('div');
    item.className = 'checklist-item';
    item.innerHTML = `
      <input type="checkbox" checked disabled>
      <span>${text}</span>
    `;
    this.wizardChecklistContainer.appendChild(item);
    this.customChecklist.push(text);
    this.customTaskInput.value = '';
  }

  handleJobSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('jobTitleInput').value.trim();
    const category = document.getElementById('jobCategorySelect').value;
    const priority = document.getElementById('jobPrioritySelect').value;
    const description = document.getElementById('jobDescriptionInput').value.trim();
    const clientId = this.clientSelect.value;
    const address = document.getElementById('jobAddressInput').value.trim();
    const startDate = document.getElementById('jobStartDateInput').value;
    const timeWindow = document.getElementById('jobTimeWindowSelect').value;
    const estimatedHours = parseFloat(document.getElementById('jobEstHours').value) || 2.0;
    const radius = parseInt(document.getElementById('jobRadiusInput').value, 10) || 150;

    const client = state.getClients().find(c => c.id === clientId);
    const tech = state.getCrew().find(t => t.id === this.selectedTechId);

    const defaultChecklist = [
      { text: 'Initial site hazard and safety risk assessment', done: false },
      { text: 'Equipment diagnostics and fault verification', done: false },
      { text: 'Replacement or repair execution per OEM specs', done: false },
      { text: 'Post-repair operational test and customer sign-off', done: false }
    ];

    this.customChecklist.forEach(item => {
      defaultChecklist.push({ text: item, done: false });
    });

    const newJob = state.addJob({
      title,
      category,
      priority,
      description,
      clientId,
      clientName: client ? client.name : 'Commercial Account',
      address,
      startDate,
      timeWindow,
      estimatedHours,
      radius,
      technicianId: tech ? tech.id : null,
      technicianName: tech ? tech.name : 'Unassigned',
      status: 'scheduled',
      checklist: defaultChecklist
    });

    this.closeWizardModal();
    this.app.showToast(`Job #${newJob.id.toUpperCase()} created successfully!`, 'success');
  }

  // ================= JOB DRAWER =================
  openJobDrawer(job) {
    this.drawerJobId.textContent = `#${job.id.toUpperCase()}`;
    this.drawerJobTitle.textContent = job.title;

    this.drawerContent.innerHTML = `
      <div style="display: flex; gap: 8px; margin-bottom: 20px;">
        <span class="card-priority-pill ${job.priority}">${job.priority} Priority</span>
        <span class="card-priority-pill" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">${job.category}</span>
        <span class="card-priority-pill" style="background: rgba(16, 185, 129, 0.2); color: #34d399; text-transform: uppercase;">${job.status}</span>
      </div>

      <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); margin-bottom: 20px;">
        <h4 style="font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">Customer & Location</h4>
        <div style="font-weight: 700; color: #fff; font-size: 1rem;">${job.clientName}</div>
        <div style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px;">${job.address}</div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">Assigned Field Specialist</h4>
        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-secondary); padding: 12px 16px; border-radius: var(--radius-md);">
          <div>
            <div style="font-weight: 700; color: #fff;">${job.technicianName}</div>
            <div style="font-size: 0.78rem; color: var(--text-secondary);">Scheduled Window: ${job.timeWindow}</div>
          </div>
          <button class="btn btn-sm btn-outline" id="reassignDrawerBtn">Reassign</button>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">Scope / Symptoms</h4>
        <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6;">${job.description || 'Standard service order.'}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">Checklist & Milestones</h4>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${job.checklist.map(item => `
            <label style="display: flex; align-items: center; gap: 10px; background: var(--bg-secondary); padding: 10px 14px; border-radius: var(--radius-md); cursor: pointer;">
              <input type="checkbox" ${item.done ? 'checked' : ''} class="job-checklist-toggle">
              <span style="${item.done ? 'text-decoration: line-through; color: var(--text-muted);' : 'color: #fff;'}">${item.text}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <div style="border-top: 1px solid var(--border-subtle); padding-top: 20px;">
        <h4 style="font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px;">Transition Status</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <button class="btn btn-secondary btn-status-shift" data-status="scheduled">Scheduled</button>
          <button class="btn btn-secondary btn-status-shift" data-status="dispatched">Dispatched</button>
          <button class="btn btn-secondary btn-status-shift" data-status="in-progress">In Progress</button>
          <button class="btn btn-primary btn-status-shift" data-status="completed">Mark Completed</button>
        </div>
      </div>
    `;

    // Attach status shift buttons
    this.drawerContent.querySelectorAll('.btn-status-shift').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetStatus = btn.getAttribute('data-status');
        state.updateJobStatus(job.id, targetStatus);
        this.closeDrawer();
        this.app.showToast(`Job #${job.id.toUpperCase()} moved to ${targetStatus.toUpperCase()}`, 'info');
      });
    });

    this.drawer.classList.add('open');
    if (window.lucide) window.lucide.createIcons();
  }

  closeDrawer() {
    this.drawer.classList.remove('open');
  }
}
