/**
 * Crew & Clients Directory Component
 * Handles field technician rosters, certifications, availability toggling, and client profiles.
 */

import { state } from '../state.js';

export class CrewComponent {
  constructor(app) {
    this.app = app;
    this.crewGrid = document.getElementById('crewGrid');
    this.clientsGrid = document.getElementById('clientsGrid');

    this.attachEvents();
  }

  attachEvents() {
    window.addEventListener('fieldops:stateChanged', (e) => {
      if (e.detail?.type === 'crew' || e.detail?.type === 'clients') {
        this.render();
      }
    });

    const addTechBtn = document.getElementById('addTechnicianBtn');
    if (addTechBtn) {
      addTechBtn.addEventListener('click', () => {
        this.app.showToast('Specialist enrollment portal is active. Use onboarding wizard.', 'info');
      });
    }

    const addClientBtn = document.getElementById('addClientBtn');
    if (addClientBtn) {
      addClientBtn.addEventListener('click', () => {
        this.app.showToast('Client registration module ready for new service contract.', 'info');
      });
    }
  }

  render() {
    this.renderCrew();
    this.renderClients();
  }

  renderCrew() {
    if (!this.crewGrid) return;
    const crew = state.getCrew();

    this.crewGrid.innerHTML = crew.map(tech => `
      <div class="crew-card">
        <div class="crew-header">
          <img src="${tech.avatar}" alt="${tech.name}" class="crew-photo">
          <div style="flex:1;">
            <div class="crew-name">${tech.name}</div>
            <div class="crew-role">${tech.role}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
              <span class="status-indicator" style="background:${tech.status === 'available' ? 'var(--emerald-500)' : 'var(--amber-500)'}"></span>
              <span style="font-size:0.75rem;text-transform:uppercase;font-weight:700;color:var(--text-secondary);">${tech.status}</span>
            </div>
          </div>
        </div>

        <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:8px;">
          <i data-lucide="phone" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:6px;"></i>
          ${tech.phone}
        </div>

        <div style="font-size:0.78rem;font-weight:600;color:var(--text-muted);margin-bottom:4px;">CERTIFICATIONS & SKILLS:</div>
        <div class="skills-tags">
          ${tech.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);padding-top:12px;margin-top:12px;font-size:0.75rem;">
          <span>Rating: <strong>★ ${tech.rating}</strong></span>
          <span>Orders Solved: <strong>${tech.jobsCompleted}</strong></span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;">
          <button class="btn btn-sm btn-outline btn-toggle-tech-status" data-tech-id="${tech.id}" data-status="available">
            Set Available
          </button>
          <button class="btn btn-sm btn-outline btn-toggle-tech-status" data-tech-id="${tech.id}" data-status="on-site">
            Set On-Site
          </button>
        </div>
      </div>
    `).join('');

    this.crewGrid.querySelectorAll('.btn-toggle-tech-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const techId = btn.getAttribute('data-tech-id');
        const targetStatus = btn.getAttribute('data-status');
        state.updateCrewStatus(techId, targetStatus);
        this.app.showToast(`Updated crew member status to ${targetStatus.toUpperCase()}`, 'success');
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  renderClients() {
    if (!this.clientsGrid) return;
    const clients = state.getClients();

    this.clientsGrid.innerHTML = clients.map(client => `
      <div class="client-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;">
          <div>
            <h3 style="font-family:var(--font-family-display);font-size:1.1rem;color:#fff;font-weight:700;">${client.name}</h3>
            <span class="card-priority-pill Standard" style="margin-top:4px;display:inline-block;">${client.category}</span>
          </div>
          <span class="badge badge-emerald">${client.activeContracts} Active Contracts</span>
        </div>

        <div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:12px;line-height:1.5;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <i data-lucide="map-pin" style="width:14px;height:14px;color:var(--brand-primary);"></i>
            <span>${client.address}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <i data-lucide="user" style="width:14px;height:14px;color:var(--emerald-500);"></i>
            <span>${client.contact} &bull; ${client.phone}</span>
          </div>
        </div>

        <div style="border-top:1px solid var(--border-subtle);padding-top:12px;display:flex;justify-content:flex-end;">
          <button class="btn btn-sm btn-outline btn-new-job-for-client" data-client-id="${client.id}">
            <i data-lucide="plus" style="width:13px;height:13px;"></i>
            <span>Dispatch to Site</span>
          </button>
        </div>
      </div>
    `).join('');

    this.clientsGrid.querySelectorAll('.btn-new-job-for-client').forEach(btn => {
      btn.addEventListener('click', () => {
        this.app.jobsComponent.openWizardModal();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }
}
