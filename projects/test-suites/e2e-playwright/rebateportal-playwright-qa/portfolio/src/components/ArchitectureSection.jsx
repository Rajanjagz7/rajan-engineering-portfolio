import React from 'react';
import { Cpu, GitBranch, Layers, CheckCircle2, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

export default function ArchitectureSection() {
  const steps = [
    {
      num: '01',
      title: 'STLC Ownership & Test Strategy',
      desc: 'Full lifecycle planning across concurrent product lines - from requirements analysis and test strategy through execution, UAT and release sign-off - not just running a script.'
    },
    {
      num: '02',
      title: 'Defect Lifecycle & Traceability',
      desc: 'Every defect is logged in JIRA, TestRail, Mantis, Bugzilla or Spira with clear reproduction steps, root-cause notes and severity/priority justification a developer can act on immediately.'
    },
    {
      num: '03',
      title: 'Cross-Platform & Backend Validation',
      desc: 'UI coverage across Web, Mobile, iPad and Client-Server via BrowserStack and LambdaTest, paired with SQL-based backend data validation - so a passing UI test can never hide a wrong database write.'
    },
    {
      num: '04',
      title: 'Mentoring & Release Quality Gates',
      desc: 'Coaching engineers on automation and AI-assisted testing, peer-reviewing test cases, and owning UAT sign-off and stakeholder communication as the last gate before release.'
    }
  ];

  return (
    <section id="architecture" style={{ padding: '80px 0', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-full)',
              marginBottom: '14px'
            }}
          >
            <Cpu size={14} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '0.82rem', color: '#6ee7b7', fontWeight: 600, textTransform: 'uppercase' }}>
              Engineering Philosophy
            </span>
          </div>

          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '14px' }}>
            How I Lead QA
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto' }}>
            The practices I actually run on every product line, not a framework diagram.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}
        >
          {steps.map((step, idx) => (
            <div
              key={step.num}
              className="glass-panel"
              style={{
                padding: '28px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  fontFamily: 'Outfit, sans-serif',
                  color: idx % 2 === 0 ? 'var(--accent-cyan-light)' : 'var(--accent-purple-light)',
                  background: idx % 2 === 0 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                  border: idx % 2 === 0 ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)'
                }}
              >
                {step.num}
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {step.title}
              </h3>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Quality Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '32px',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>
              A Bug Report Is Only as Good as Its Reproduction Steps
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px' }}>
              A defect a developer can't act on isn't quality work, it's noise. Every issue I log names the exact
              environment, the steps, the expected vs. actual result, and how I verified it - whether that's a
              read-back check on an API write or a screenshot of a stack trace that shouldn't be user-facing.
            </p>
          </div>

          <a href="#contact" className="btn btn-primary">
            Discuss Your QA Needs
          </a>
        </div>
      </div>
    </section>
  );
}
