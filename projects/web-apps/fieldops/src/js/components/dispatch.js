/**
 * Live Dispatch & Map Radar Component
 * Provides real-time field visual telemetry, technician tracking, and route lines.
 */

import { state } from '../state.js';

export class DispatchComponent {
  constructor(app) {
    this.app = app;
    this.mapRoutesSvg = document.getElementById('mapRoutesSvg');
    this.mapMarkersLayer = document.getElementById('mapMarkersLayer');
    this.dispatchTechList = document.getElementById('dispatchTechList');
    this.unassignedJobsList = document.getElementById('unassignedJobsList');
    this.miniRadarBlips = document.getElementById('miniRadarBlips');

    this.attachEvents();
  }

  attachEvents() {
    window.addEventListener('fieldops:stateChanged', () => {
      this.render();
    });

    const autoDispatchBtn = document.getElementById('autoDispatchOptimizeBtn');
    if (autoDispatchBtn) {
      autoDispatchBtn.addEventListener('click', () => {
        this.runAutoDispatchOptimizer();
      });
    }

    const quickDispatchBtn = document.getElementById('quickDispatchBtn');
    if (quickDispatchBtn) {
      quickDispatchBtn.addEventListener('click', () => {
        this.runAutoDispatchOptimizer();
      });
    }
  }

  runAutoDispatchOptimizer() {
    const jobs = state.getJobs();
    const crew = state.getCrew();
    const unassigned = jobs.filter(j => j.status === 'scheduled' && (!j.technicianId || j.technicianName === 'Unassigned'));
    const availableCrew = crew.filter(c => c.status === 'available');

    if (unassigned.length === 0) {
      this.app.showToast('All current work orders have already been dispatched!', 'info');
      return;
    }

    if (availableCrew.length === 0) {
      this.app.showToast('No technicians currently in Available status.', 'error');
      return;
    }

    // Auto assign closest technician
    let assignedCount = 0;
    unassigned.forEach((job, index) => {
      if (index < availableCrew.length) {
        const tech = availableCrew[index];
        job.technicianId = tech.id;
        job.technicianName = tech.name;
        job.status = 'dispatched';
        tech.status = 'in-transit';
        tech.currentJobId = job.id;
        assignedCount++;
      }
    });

    state.saveJobs(jobs);
    state.updateCrewStatus(availableCrew[0].id, 'in-transit');
    this.app.showToast(`Optimized routing: Automatically dispatched ${assignedCount} field order(s)!`, 'success');
  }

  render() {
    this.renderMapSurface();
    this.renderDispatchSidebar();
    this.renderMiniRadar();
  }

  renderMapSurface() {
    if (!this.mapMarkersLayer || !this.mapRoutesSvg) return;

    const crew = state.getCrew();
    const jobs = state.getJobs();

    this.mapMarkersLayer.innerHTML = '';
    this.mapRoutesSvg.innerHTML = '';

    // Draw active route lines between technicians and their current jobs
    crew.forEach(tech => {
      if (tech.currentJobId) {
        const job = jobs.find(j => j.id === tech.currentJobId);
        if (job && job.coords && tech.coords) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const d = `M ${tech.coords.x} ${tech.coords.y} Q ${(tech.coords.x + job.coords.x)/2 + 30} ${(tech.coords.y + job.coords.y)/2 - 40} ${job.coords.x} ${job.coords.y}`;
          path.setAttribute('d', d);
          path.setAttribute('stroke', '#6366f1');
          path.setAttribute('stroke-width', '2');
          path.setAttribute('stroke-dasharray', '6,6');
          path.setAttribute('fill', 'none');
          path.setAttribute('opacity', '0.7');

          // Animated pulse dash
          const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
          anim.setAttribute('attributeName', 'stroke-dashoffset');
          anim.setAttribute('from', '24');
          anim.setAttribute('to', '0');
          anim.setAttribute('dur', '1.2s');
          anim.setAttribute('repeatCount', 'indefinite');
          path.appendChild(anim);

          this.mapRoutesSvg.appendChild(path);
        }
      }
    });

    // Render technician markers
    crew.forEach(tech => {
      if (!tech.coords) return;
      const marker = document.createElement('div');
      marker.className = 'map-marker';
      marker.style.left = `${tech.coords.x}px`;
      marker.style.top = `${tech.coords.y}px`;

      const pinType = tech.status === 'on-site' ? 'tech-on-site' : 'tech-transit';
      marker.innerHTML = `
        <div class="marker-pin ${pinType}">
          <i data-lucide="navigation-2" style="width:14px;height:14px;"></i>
          <span>${tech.name.split(' ')[0]}</span>
        </div>
      `;

      marker.addEventListener('click', () => {
        this.app.showToast(`Technician: ${tech.name} (${tech.role}) — Status: ${tech.status.toUpperCase()}`, 'info');
      });

      this.mapMarkersLayer.appendChild(marker);
    });

    // Render job site markers
    jobs.filter(j => j.status !== 'completed').forEach(job => {
      if (!job.coords) return;
      const marker = document.createElement('div');
      marker.className = 'map-marker';
      marker.style.left = `${job.coords.x}px`;
      marker.style.top = `${job.coords.y}px`;

      marker.innerHTML = `
        <div class="marker-pin job-site">
          <i data-lucide="map-pin" style="width:14px;height:14px;"></i>
          <span>#${job.id.slice(-3)}</span>
        </div>
      `;

      marker.addEventListener('click', () => {
        this.app.jobsComponent.openJobDrawer(job);
      });

      this.mapMarkersLayer.appendChild(marker);
    });

    if (window.lucide) window.lucide.createIcons();
  }

  renderDispatchSidebar() {
    const crew = state.getCrew();
    const jobs = state.getJobs();

    if (this.dispatchTechList) {
      this.dispatchTechList.innerHTML = crew.map(tech => `
        <div class="tech-dispatch-card">
          <img src="${tech.avatar}" alt="${tech.name}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
          <div style="flex:1;">
            <div style="font-weight:600;font-size:0.85rem;color:#fff;">${tech.name}</div>
            <div style="font-size:0.72rem;color:var(--text-secondary);">${tech.role.split(' ')[0]} Specialist</div>
          </div>
          <span class="status-pill" style="background:${this.getStatusBg(tech.status)};color:#fff;font-weight:700;font-size:0.65rem;text-transform:uppercase;">
            ${tech.status}
          </span>
        </div>
      `).join('');
    }

    if (this.unassignedJobsList) {
      const unassigned = jobs.filter(j => j.status === 'scheduled');
      if (unassigned.length === 0) {
        this.unassignedJobsList.innerHTML = `
          <div style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.8rem;">
            No pending unassigned orders.
          </div>
        `;
      } else {
        this.unassignedJobsList.innerHTML = unassigned.map(job => `
          <div class="tech-dispatch-card" style="cursor:pointer;" data-job-id="${job.id}">
            <div>
              <div style="font-weight:600;font-size:0.82rem;color:#fff;">${job.title}</div>
              <div style="font-size:0.72rem;color:var(--brand-primary);">${job.clientName}</div>
            </div>
            <button class="btn btn-sm btn-primary" style="margin-left:auto;font-size:0.7rem;padding:4px 8px;">
              Dispatch
            </button>
          </div>
        `).join('');

        this.unassignedJobsList.querySelectorAll('.tech-dispatch-card').forEach(card => {
          card.addEventListener('click', () => {
            const jobId = card.getAttribute('data-job-id');
            const job = jobs.find(j => j.id === jobId);
            if (job) this.app.jobsComponent.openJobDrawer(job);
          });
        });
      }
    }
  }

  renderMiniRadar() {
    if (!this.miniRadarBlips) return;
    const crew = state.getCrew();
    const jobs = state.getJobs();

    this.miniRadarBlips.innerHTML = '';

    // Sample blips mapped inside mini radar 320x320 container
    crew.forEach((tech, idx) => {
      const blip = document.createElement('div');
      blip.className = 'radar-blip';
      const color = tech.status === 'on-site' ? 'var(--emerald-500)' : 'var(--amber-500)';
      blip.style.color = color;
      blip.style.backgroundColor = color;

      // Circle coordinates
      const angle = (idx / crew.length) * 2 * Math.PI;
      const radius = 45 + (idx % 3) * 45;
      const cx = 160 + radius * Math.cos(angle);
      const cy = 160 + radius * Math.sin(angle);

      blip.style.left = `${cx}px`;
      blip.style.top = `${cy}px`;
      blip.title = `${tech.name} (${tech.status})`;

      blip.addEventListener('click', () => {
        this.app.showToast(`Radar contact: ${tech.name} (${tech.status.toUpperCase()})`, 'info');
      });

      this.miniRadarBlips.appendChild(blip);
    });
  }

  getStatusBg(status) {
    switch (status) {
      case 'available': return 'rgba(16, 185, 129, 0.4)';
      case 'on-site': return 'rgba(99, 102, 241, 0.4)';
      case 'in-transit': return 'rgba(245, 158, 11, 0.4)';
      default: return 'rgba(100, 116, 139, 0.4)';
    }
  }
}
