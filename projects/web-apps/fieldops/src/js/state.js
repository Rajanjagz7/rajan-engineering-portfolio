/**
 * FieldOps State Management & Data Store
 * Handles persistent operational data via localStorage with rich demo seeds.
 */

const STORAGE_KEYS = {
  JOBS: 'fieldops_jobs_data',
  CREW: 'fieldops_crew_data',
  CLIENTS: 'fieldops_clients_data',
  ACTIVITIES: 'fieldops_activity_log'
};

// Realistic Seed Datasets
const DEFAULT_CREW = [
  {
    id: 'tech-01',
    name: 'Marcus Vance',
    role: 'Senior HVAC & Climate Specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    status: 'on-site', // 'available' | 'on-site' | 'in-transit' | 'off-duty'
    phone: '+1 (415) 890-2101',
    skills: ['HVAC Level 3', 'EPA 608', 'Refrigerants', 'VRF Systems'],
    currentJobId: 'job-101',
    coords: { x: 380, y: 260 },
    rating: 4.9,
    jobsCompleted: 142
  },
  {
    id: 'tech-02',
    name: 'Elena Rostova',
    role: 'Commercial Master Electrician',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    status: 'in-transit',
    phone: '+1 (415) 890-3490',
    skills: ['High Voltage 480V', 'PLC Controls', 'Infrared Thermography'],
    currentJobId: 'job-103',
    coords: { x: 580, y: 190 },
    rating: 5.0,
    jobsCompleted: 198
  },
  {
    id: 'tech-03',
    name: 'Devon Kripke',
    role: 'Industrial Hydronics & Piping',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    status: 'available',
    phone: '+1 (415) 890-7811',
    skills: ['Backflow Testing', 'Boiler Systems', 'Commercial Drainage'],
    currentJobId: null,
    coords: { x: 220, y: 390 },
    rating: 4.8,
    jobsCompleted: 89
  },
  {
    id: 'tech-04',
    name: 'Sarah Chen',
    role: 'Telecom & Fiber Infrastructure',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
    status: 'on-site',
    phone: '+1 (415) 890-4412',
    skills: ['OTDR Testing', 'Fusion Splicing', 'Cat6A Certification'],
    currentJobId: 'job-102',
    coords: { x: 690, y: 410 },
    rating: 4.95,
    jobsCompleted: 115
  },
  {
    id: 'tech-05',
    name: 'Jamal Washington',
    role: 'Fire Alarm & Life Safety Engineer',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&q=80',
    status: 'in-transit',
    phone: '+1 (415) 890-9903',
    skills: ['NICET III', 'Suppression Systems', 'Smoke Evac'],
    currentJobId: 'job-104',
    coords: { x: 440, y: 490 },
    rating: 4.85,
    jobsCompleted: 167
  },
  {
    id: 'tech-06',
    name: 'Chloe Miller',
    role: 'Building Automation Systems (BAS)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    status: 'available',
    phone: '+1 (415) 890-6720',
    skills: ['BACnet IP', 'Tridium Niagara', 'Sensor Calibration'],
    currentJobId: null,
    coords: { x: 310, y: 150 },
    rating: 4.9,
    jobsCompleted: 76
  }
];

const DEFAULT_CLIENTS = [
  {
    id: 'client-01',
    name: 'Salesforce Transit Tower',
    category: 'Commercial High-Rise',
    address: '415 Mission St, San Francisco, CA',
    contact: 'Alicia Gomez (Facilities Lead)',
    phone: '+1 (415) 555-0182',
    activeContracts: 3
  },
  {
    id: 'client-02',
    name: 'St. Luke Regional Medical Center',
    category: 'Healthcare Facility',
    address: '3555 Cesar Chavez, San Francisco, CA',
    contact: 'Dr. Kevin Sterling',
    phone: '+1 (415) 555-0391',
    activeContracts: 5
  },
  {
    id: 'client-03',
    name: 'Mission Bay Bio-Tech Labs',
    category: 'Life Sciences Campus',
    address: '1700 4th St, San Francisco, CA',
    contact: 'David Wu (Chief Engineer)',
    phone: '+1 (415) 555-0724',
    activeContracts: 2
  },
  {
    id: 'client-04',
    name: 'Presidio Heritage Complex',
    category: 'Institutional Property',
    address: '210 Lincoln Blvd, San Francisco, CA',
    contact: 'Nora Hastings',
    phone: '+1 (415) 555-0819',
    activeContracts: 1
  }
];

const DEFAULT_JOBS = [
  {
    id: 'job-101',
    title: 'Central Chiller Unit #3 Fault Tripped',
    category: 'HVAC Systems',
    clientId: 'client-01',
    clientName: 'Salesforce Transit Tower',
    address: '415 Mission St, 14th Floor Mechanical, SF',
    priority: 'Critical',
    status: 'in-progress', // 'scheduled' | 'dispatched' | 'in-progress' | 'completed'
    technicianId: 'tech-01',
    technicianName: 'Marcus Vance',
    startDate: '2026-09-19',
    timeWindow: '08:00 AM - 10:00 AM',
    estimatedHours: 3.5,
    radius: 120,
    coords: { x: 400, y: 270 },
    description: 'Compressor thermal overload switch recurring trigger. High pressure alarm on refrigerant loop 2.',
    checklist: [
      { text: 'Verify electrical lockout/tagout (LOTO)', done: true },
      { text: 'Inspect refrigerant manifold pressure levels', done: true },
      { text: 'Test thermal overload sensor resistance', done: false },
      { text: 'Run compressor ramp-up test under load', done: false }
    ],
    createdAt: '2026-09-19T07:15:00Z'
  },
  {
    id: 'job-102',
    title: 'Cleanroom Core Switch Optical Link Degraded',
    category: 'Network & Fiber',
    clientId: 'client-03',
    clientName: 'Mission Bay Bio-Tech Labs',
    address: '1700 4th St, Data Suite B, SF',
    priority: 'High',
    status: 'in-progress',
    technicianId: 'tech-04',
    technicianName: 'Sarah Chen',
    startDate: '2026-09-19',
    timeWindow: '10:00 AM - 12:00 PM',
    estimatedHours: 2.0,
    radius: 100,
    coords: { x: 670, y: 400 },
    description: 'Packet loss detected on 100Gbps backbone fiber feeding Cleanroom 4 genomics cluster.',
    checklist: [
      { text: 'Cleanroom gowning protocol and air shower entry', done: true },
      { text: 'Microscope inspection of LC-APC ferrule end-faces', done: true },
      { text: 'Re-splice fiber patch at rack 04-B', done: false },
      { text: 'OTDR signal attenuation signoff (<0.2dB)', done: false }
    ],
    createdAt: '2026-09-19T08:30:00Z'
  },
  {
    id: 'job-103',
    title: 'Emergency Generator Transfer Switch Inspection',
    category: 'Electrical',
    clientId: 'client-02',
    clientName: 'St. Luke Regional Medical Center',
    address: '3555 Cesar Chavez, Sub-Basement 2, SF',
    priority: 'Critical',
    status: 'dispatched',
    technicianId: 'tech-02',
    technicianName: 'Elena Rostova',
    startDate: '2026-09-19',
    timeWindow: 'Emergency Immediate',
    estimatedHours: 2.5,
    radius: 150,
    coords: { x: 550, y: 220 },
    description: 'ATS #2 failed automated weekly transfer exercise. Backup power redundancy at risk.',
    checklist: [
      { text: 'Verify utility grid synchronizer signals', done: false },
      { text: 'Inspect solenoid mechanical latching mechanism', done: false },
      { text: 'Simulate utility failure with hospital facility watch', done: false }
    ],
    createdAt: '2026-09-19T09:05:00Z'
  },
  {
    id: 'job-104',
    title: 'Fire Alarm Zone 4 Supervisory Tamper Alarm',
    category: 'Fire & Safety',
    clientId: 'client-04',
    clientName: 'Presidio Heritage Complex',
    address: '210 Lincoln Blvd, Main Gallery, SF',
    priority: 'Standard',
    status: 'dispatched',
    technicianId: 'tech-05',
    technicianName: 'Jamal Washington',
    startDate: '2026-09-19',
    timeWindow: '01:00 PM - 03:00 PM',
    estimatedHours: 1.5,
    radius: 200,
    coords: { x: 420, y: 480 },
    description: 'Post-indicator valve OS&Y switch signaling intermittent trouble to monitoring center.',
    checklist: [
      { text: 'Locate OS&Y tamper switch on riser #4', done: false },
      { text: 'Check end-of-line resistor voltage drop', done: false },
      { text: 'Test dry contact relay to FACP panel', done: false }
    ],
    createdAt: '2026-09-19T09:40:00Z'
  },
  {
    id: 'job-105',
    title: 'Commercial Kitchen Grease Trap Hydro-Jetting',
    category: 'Plumbing & Fluid',
    clientId: 'client-01',
    clientName: 'Salesforce Transit Tower',
    address: '415 Mission St, Concourse Food Hall, SF',
    priority: 'Standard',
    status: 'scheduled',
    technicianId: null,
    technicianName: 'Unassigned',
    startDate: '2026-09-19',
    timeWindow: '03:00 PM - 05:00 PM',
    estimatedHours: 3.0,
    radius: 100,
    coords: { x: 390, y: 290 },
    description: 'Scheduled quarterly preventative grease waste interceptor clearing and jetting.',
    checklist: [
      { text: 'Install spill barriers and odor vacuum exhaust', done: false },
      { text: 'Hydro-jet 40ft lateral line to city main', done: false },
      { text: 'Perform video camera line inspection', done: false }
    ],
    createdAt: '2026-09-19T10:00:00Z'
  },
  {
    id: 'job-106',
    title: 'Roof Rooftop Fan Bearing Vibration Anomaly',
    category: 'Preventive Maintenance',
    clientId: 'client-03',
    clientName: 'Mission Bay Bio-Tech Labs',
    address: '1700 4th St, Roof Penthouse West, SF',
    priority: 'Low',
    status: 'scheduled',
    technicianId: null,
    technicianName: 'Unassigned',
    startDate: '2026-09-20',
    timeWindow: '08:00 AM - 10:00 AM',
    estimatedHours: 2.0,
    radius: 120,
    coords: { x: 710, y: 380 },
    description: 'Telemetry accelerometer flags 4.2mm/s vibration on exhaust fan motor 07.',
    checklist: [
      { text: 'Laser pulley alignment inspection', done: false },
      { text: 'Grease bearing housing with synthetic polyurea', done: false }
    ],
    createdAt: '2026-09-19T10:20:00Z'
  },
  {
    id: 'job-107',
    title: 'Pediatric Wing Negative Pressure Room Certification',
    category: 'HVAC Systems',
    clientId: 'client-02',
    clientName: 'St. Luke Regional Medical Center',
    address: '3555 Cesar Chavez, 4th Floor Isolation, SF',
    priority: 'High',
    status: 'completed',
    technicianId: 'tech-01',
    technicianName: 'Marcus Vance',
    startDate: '2026-09-18',
    timeWindow: '08:00 AM - 11:00 AM',
    estimatedHours: 3.0,
    radius: 100,
    coords: { x: 530, y: 240 },
    description: 'Annual bio-containment compliance certification for Isolation Rooms 401-404.',
    checklist: [
      { text: 'Verify manometer differential pressure (-2.5 Pa)', done: true },
      { text: 'Smoke visualization test around doorway seals', done: true },
      { text: 'Issue signed regulatory compliance certificate', done: true }
    ],
    createdAt: '2026-09-18T07:00:00Z'
  }
];

const DEFAULT_ACTIVITIES = [
  {
    id: 'act-1',
    type: 'dispatch',
    icon: 'send',
    text: '<strong>Elena Rostova</strong> dispatched to <strong>ATS Switch Inspection</strong>',
    time: '8 mins ago',
    badgeClass: 'amber'
  },
  {
    id: 'act-2',
    type: 'status',
    icon: 'wrench',
    text: '<strong>Marcus Vance</strong> started on-site diagnostic at <strong>Salesforce Tower</strong>',
    time: '24 mins ago',
    badgeClass: 'indigo'
  },
  {
    id: 'act-3',
    type: 'completed',
    icon: 'check-circle',
    text: '<strong>Negative Pressure Certification</strong> marked completed with 100% checklist pass',
    time: '1 hour ago',
    badgeClass: 'emerald'
  },
  {
    id: 'act-4',
    type: 'created',
    icon: 'plus',
    text: 'New work order <strong>#job-106 (Rooftop Fan Vibration)</strong> queued',
    time: '1.5 hours ago',
    badgeClass: 'cyan'
  }
];

class StateManager {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.JOBS)) {
      localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(DEFAULT_JOBS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CREW)) {
      localStorage.setItem(STORAGE_KEYS.CREW, JSON.stringify(DEFAULT_CREW));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(DEFAULT_CLIENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(DEFAULT_ACTIVITIES));
    }
  }

  // Jobs Accessors
  getJobs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS)) || [];
    } catch {
      return DEFAULT_JOBS;
    }
  }

  saveJobs(jobs) {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    window.dispatchEvent(new CustomEvent('fieldops:stateChanged', { detail: { type: 'jobs' } }));
  }

  addJob(jobData) {
    const jobs = this.getJobs();
    const newId = `job-${Date.now().toString().slice(-4)}`;
    
    // Generate simulated coordinates on map canvas if not provided
    const randomX = Math.floor(Math.random() * 550) + 180;
    const randomY = Math.floor(Math.random() * 380) + 120;

    const newJob = {
      id: newId,
      ...jobData,
      coords: { x: randomX, y: randomY },
      createdAt: new Date().toISOString()
    };

    jobs.unshift(newJob);
    this.saveJobs(jobs);

    this.logActivity({
      type: 'created',
      icon: 'plus-circle',
      text: `New work order <strong>#${newId} (${newJob.title})</strong> created`,
      time: 'Just now',
      badgeClass: 'indigo'
    });

    return newJob;
  }

  updateJobStatus(jobId, newStatus) {
    const jobs = this.getJobs();
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    job.status = newStatus;
    this.saveJobs(jobs);

    this.logActivity({
      type: 'status',
      icon: newStatus === 'completed' ? 'check-circle' : 'activity',
      text: `Work order <strong>#${jobId}</strong> transitioned to <strong>${newStatus.toUpperCase()}</strong>`,
      time: 'Just now',
      badgeClass: newStatus === 'completed' ? 'emerald' : 'amber'
    });
  }

  // Crew Accessors
  getCrew() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CREW)) || [];
    } catch {
      return DEFAULT_CREW;
    }
  }

  updateCrewStatus(techId, newStatus) {
    const crew = this.getCrew();
    const tech = crew.find(t => t.id === techId);
    if (!tech) return;

    tech.status = newStatus;
    localStorage.setItem(STORAGE_KEYS.CREW, JSON.stringify(crew));
    window.dispatchEvent(new CustomEvent('fieldops:stateChanged', { detail: { type: 'crew' } }));
  }

  // Clients Accessors
  getClients() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [];
    } catch {
      return DEFAULT_CLIENTS;
    }
  }

  // Activity Log
  getActivities() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) || [];
    } catch {
      return DEFAULT_ACTIVITIES;
    }
  }

  logActivity(activity) {
    const activities = this.getActivities();
    activity.id = `act-${Date.now()}`;
    activities.unshift(activity);
    if (activities.length > 25) activities.pop();
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
    window.dispatchEvent(new CustomEvent('fieldops:stateChanged', { detail: { type: 'activities' } }));
  }
}

export const state = new StateManager();
