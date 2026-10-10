import React from 'react';
import { Briefcase, Award, GraduationCap, Trophy } from 'lucide-react';

const roles = [
  {
    title: 'QA Team Lead',
    company: 'Software.Co, Ahmedabad',
    period: 'Apr 2025 – Present',
    bullets: [
      'Own end-to-end QA strategy and execution for multiple concurrent product lines across web, mobile and client-server platforms, covering the full STLC.',
      'Manage defects and test cycles in JIRA across the team; mentor QA engineers on ISTQB best practices and AI-assisted testing.',
      'Own UAT sign-off, stakeholder communication and release quality gates.'
    ]
  },
  {
    title: 'Senior QA Engineer',
    company: 'Software.Co, Ahmedabad',
    period: 'Dec 2023 – Mar 2025',
    bullets: [
      'Executed functional, regression and API testing (Postman) across multiple concurrent product lines spanning web, mobile and client-server platforms.',
      "Used MySQL/MS SQL Server for backend data checks and Selenium-based automation, TestNG, Jenkins, Cucumber and Bitbucket as part of the team's CI/CD-aware testing workflow."
    ]
  },
  {
    title: 'Senior QA Engineer',
    company: 'Techuz InfoWeb Private Limited, Ahmedabad',
    period: 'Nov 2022 – Sep 2023',
    bullets: [
      'Designed and executed test plans for complex web and mobile applications with functional, regression and integration coverage.',
      'Validated releases across Web, Mobile, iPad and Client-Server environments; peer-reviewed automation and manual test cases to maintain coverage standards.',
      'Used AI-assisted workflows to optimize regression suites and improve execution efficiency.'
    ]
  },
  {
    title: 'Quality Analyst',
    company: 'Techforce Global, Ahmedabad',
    period: 'Jun 2021 – Sep 2022',
    bullets: [
      'Used BrowserStack and LambdaTest for cross-browser and cross-device regression testing.',
      'Tested the Freeway blockchain platform, validating transaction flows, ledger integrity, record immutability and data consistency using SQL-based data checks.',
      'Designed test cases for distributed-ledger edge cases and supported defect resolution.'
    ]
  },
  {
    title: 'Software Tester',
    company: 'eClinicalWorks India Pvt Ltd, Ahmedabad',
    period: 'Feb 2019 – Apr 2021',
    bullets: [
      'Worked on a Tier-1 EHR platform; owned Registry testing as Registry Module Owner and tested the CRORE module.',
      'Performed cross-modality validation across Web, Mobile, iPad and Client-Server environments.',
      'Mentored new team members, peer-reviewed test cases and provided enhancement suggestions to the Project Management team.'
    ]
  },
  {
    title: 'Junior Software Tester',
    company: 'Spaceo Technologies, Ahmedabad',
    period: 'Feb 2018 – Feb 2019',
    bullets: [
      'Performed functional and cross-browser QA across Android, iOS and Web platforms for 20+ applications using Chrome, Firefox, Safari and Edge.',
      'Performed functional, regression, UI/UX, compatibility and usability testing; created clear defect reports and collaborated with developers to reproduce and resolve issues.'
    ]
  }
];

const certifications = [
  'ISTQB Foundation Level (CTFL)',
  'ISTQB Agile Tester Extension',
  'AI Testing Fundamentals'
];

const awards = [
  'Employee of the Month — September 2025',
  'Employee of the Month — October 2025',
  'Multi Tasker Award — 2026'
];

export default function ExperienceSection() {
  return (
    <section id="experience" style={{ padding: '80px 0', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: 'var(--radius-full)',
              marginBottom: '14px'
            }}
          >
            <Briefcase size={14} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan-light)', fontWeight: 600, textTransform: 'uppercase' }}>
              Career Timeline
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '14px' }}>
            Experience & Credentials
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto' }}>
            8+ years, six roles, one thread: owning quality end-to-end — manual and automated, mobile and web — not just running test scripts.
          </p>
        </div>

        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '56px' }}>
          {roles.map((role, index) => (
            <div
              key={role.title + role.period}
              className="glass-panel"
              style={{ padding: '26px 28px', position: 'relative' }}
            >
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: '12px'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{role.title}</h3>
                  <span style={{ fontSize: '0.9rem', color: 'var(--accent-cyan-light)', fontWeight: 500 }}>
                    {role.company}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-subtle)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {role.period}
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {role.bullets.map((b, i) => (
                  <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Certifications / Education / Awards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px'
          }}
        >
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Award size={20} style={{ color: 'var(--accent-cyan)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Certifications</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {certifications.map((c) => (
                <span key={c} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{c}</span>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <GraduationCap size={20} style={{ color: 'var(--accent-purple)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Education</h3>
            </div>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Bachelor of Commerce — Gujarat University, Ahmedabad (June 2017)
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Trophy size={20} style={{ color: '#f59e0b' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Awards & Recognition</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {awards.map((a) => (
                <span key={a} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{a}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
