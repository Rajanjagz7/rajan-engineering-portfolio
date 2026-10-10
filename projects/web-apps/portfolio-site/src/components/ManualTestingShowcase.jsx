import React from 'react';
import { Target, Layers3, Compass, RotateCcw, Smartphone, Database, Bug, ClipboardList } from 'lucide-react';

const techniques = [
  {
    Icon: Target,
    title: 'Boundary Value Analysis',
    desc: 'Test the edges a spec implies but rarely states — min/max length, off-by-one dates, null vs empty vs omitted.'
  },
  {
    Icon: Layers3,
    title: 'Equivalence Partitioning',
    desc: 'Group valid/invalid input ranges into classes so coverage stays thorough without testing every possible value.'
  },
  {
    Icon: Compass,
    title: 'Exploratory Testing',
    desc: 'Structured, charter-driven exploration of a module beyond the written test cases to surface what scripted steps miss.'
  },
  {
    Icon: RotateCcw,
    title: 'Regression Testing',
    desc: 'Re-verify existing functionality after every change so a fix in one area doesn’t silently break another.'
  },
  {
    Icon: Smartphone,
    title: 'Cross-Browser & Cross-Device',
    desc: 'Same workflow validated across Chrome, Firefox, Safari, Edge and real Android/iOS devices via BrowserStack and LambdaTest.'
  },
  {
    Icon: Database,
    title: 'API & Backend Validation',
    desc: 'Postman request/response checks paired with SQL read-backs, so a passing UI test can’t hide a wrong database write.'
  }
];

export default function ManualTestingShowcase() {
  return (
    <section id="manual-testing" style={{ padding: '80px 0', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
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
            <Bug size={14} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan-light)', fontWeight: 600, textTransform: 'uppercase' }}>
              Manual QA
            </span>
          </div>

          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '14px' }}>
            Manual Testing in Practice
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto' }}>
            Automation catches what you already knew to check. These are the techniques I rely on to find what you didn't.
          </p>
        </div>

        {/* Techniques Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px',
            marginBottom: '32px'
          }}
        >
          {techniques.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="glass-panel"
              style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)'
                }}
              >
                <Icon size={18} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Artifacts: how the technique becomes a written test case + a filed bug */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
            gap: '20px'
          }}
        >
          {/* Test Case Card */}
          <div className="glass-panel" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ClipboardList size={18} style={{ color: 'var(--accent-purple)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>How I Write a Test Case</h3>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '16px',
                fontSize: '0.85rem',
                lineHeight: 1.7
              }}
            >
              <div style={{ color: 'var(--accent-purple-light)', fontWeight: 700, marginBottom: '8px' }}>
                TC-014 &nbsp;Boundary check on a required date field
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Preconditions:</strong> User is logged in with permission to create a record.<br />
                <strong style={{ color: 'var(--text-primary)' }}>Steps:</strong> 1) Open the create form. 2) Enter an impossible calendar date (e.g. 31 Apr, or 29 Feb on a non-leap year). 3) Submit.<br />
                <strong style={{ color: 'var(--text-primary)' }}>Expected:</strong> Inline validation error; record is not created.<br />
                <strong style={{ color: 'var(--text-primary)' }}>Actual (pass/fail is recorded here):</strong> —
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              Illustrative format — the same structure I use in TestRail: acceptance criteria plus the edge cases the spec doesn't spell out, not just the happy path.
            </p>
          </div>

          {/* Bug Report Card */}
          <div className="glass-panel" style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bug size={18} style={{ color: 'var(--accent-cyan)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Anatomy of a Bug Report I File</h3>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '16px',
                fontSize: '0.85rem',
                lineHeight: 1.7
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-cyan" style={{ padding: '2px 10px', fontSize: '0.7rem' }}>High</span>
                <span style={{ color: 'var(--accent-cyan-light)', fontWeight: 700 }}>
                  Boundary value accepted without validation on submit
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Steps to reproduce:</strong> Exact clicks/input, numbered, no assumed context.<br />
                <strong style={{ color: 'var(--text-primary)' }}>Expected vs Actual:</strong> Stated side by side, not implied.<br />
                <strong style={{ color: 'var(--text-primary)' }}>Environment:</strong> OS, browser/app version, device.<br />
                <strong style={{ color: 'var(--text-primary)' }}>Evidence:</strong> Screenshot or screen recording attached.
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
              A developer should be able to reproduce and fix it from the ticket alone — no follow-up call needed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
