import React from 'react';
import { ArrowRight, CheckCircle2, Terminal, Cpu, Download } from 'lucide-react';
import TestingCoverage from './TestingCoverage';

export default function Hero() {
  return (
    <section
      id="about"
      style={{
        paddingTop: '130px',
        paddingBottom: '70px',
        position: 'relative',
        zIndex: 1
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
            gap: '48px',
            alignItems: 'center'
          }}
        >
          {/* Left Column: Bio & Intro */}
          <div>
            {/* Photo + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
              <img
                src="/rajan-photo.jpg"
                alt="Rajan Jagwani"
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  objectPosition: '50% 20%',
                  border: '2px solid var(--accent-cyan)',
                  boxShadow: '0 0 22px rgba(6, 182, 212, 0.4)',
                  flexShrink: 0
                }}
              />
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                  Rajan Jagwani
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Ahmedabad, India
                </div>
              </div>
            </div>

            {/* Availability Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-full)',
                marginBottom: '20px'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 10px #10b981'
                }}
              />
              <span style={{ fontSize: '0.85rem', color: '#6ee7b7', fontWeight: 600 }}>
                Senior QA Engineer &bull; ISTQB Certified &bull; QA Team Lead
              </span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                marginBottom: '20px'
              }}
            >
8+ Years Turning <span className="gradient-text">Ambiguous Requirements</span> Into Rigorous, Traceable QA
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: '1.15rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: '32px',
                maxWidth: '560px'
              }}
            >
              I'm an ISTQB-certified QA Team Lead with 8+ years across healthcare, blockchain, e-commerce and
              government platforms — equally fluent in
              <strong> manual</strong> exploratory testing and <strong>automated</strong> regression with
              <strong> Selenium</strong>, <strong>TestNG</strong> and <strong>Postman</strong>, with dedicated
              <strong> mobile app QA</strong> (Android &amp; iOS, 20+ shipped apps) alongside web and client-server
              coverage. I own the full STLC, back it with <strong>SQL</strong> data validation, and run defect
              discipline through <strong>JIRA</strong> and <strong>TestRail</strong>. Recently added hands-on
              <strong> Playwright</strong> and API security testing to that toolkit on an independent audit engagement.
            </p>

            {/* CTA Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '36px' }}>
              <a href="#projects" className="btn btn-primary">
                <span>View Projects</span>
                <ArrowRight size={18} />
              </a>
              <a
                href="/Rajan-Jagwani-Resume.pdf"
                download="Rajan-Jagwani-Resume.pdf"
                className="btn btn-outline"
              >
                <Download size={18} style={{ color: 'var(--accent-cyan)' }} />
                <span>Download Resume</span>
              </a>
              <a href="#experience" className="btn btn-outline">
                <Cpu size={18} style={{ color: 'var(--accent-purple)' }} />
                <span>Experience & Certifications</span>
              </a>
            </div>

            {/* Quick Trust Highlights */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '20px',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Manual & Automated QA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--accent-purple)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mobile QA (Android & iOS)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ISTQB Certified</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>QA Team Lead & Mentor</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Terminal Visual Showcase */}
          <div>
            <div
              className="glass-panel"
              style={{
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(6, 182, 212, 0.25)'
              }}
            >
              {/* Terminal Title Bar */}
              <div
                style={{
                  background: 'rgba(10, 14, 23, 0.95)',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Terminal size={14} />
                  <span>rebate-portal-qa — defect register</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>● LOGGED</span>
              </div>

              {/* Terminal Body */}
              <div
                style={{
                  padding: '20px',
                  fontSize: '0.88rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  background: 'rgba(7, 9, 14, 0.75)',
                  lineHeight: 1.8
                }}
              >
                <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
                  $ python gen_bug_cards.py
                </div>
                <div style={{ color: '#86efac' }}>
                  ✓ NSW-STG-53 · Critical · Stored XSS in Job Notes — reproduced & verified
                </div>
                <div style={{ color: '#86efac' }}>
                  ✓ NSW-STG-63 · Critical · Save fires no request on any job-edit surface
                </div>
                <div style={{ color: '#86efac' }}>
                  ✓ NSW-STG-40 · Medium · No throttling on admin login (12/12 attempts pass)
                </div>
                <div style={{ color: '#86efac' }}>
                  ✓ NSW-STG-58 · Medium · Postcode accepted with no format or NSW-range check
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  … 56 more, severity &amp; priority ranked
                </div>

                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>60 defects</span>
                    <span style={{ color: 'var(--text-muted)' }}> tracked &amp; severity-ranked</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    wrote NSW_BUGS.md / NSW_BUGS.csv
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '40px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Testing Coverage
          </div>
          <TestingCoverage />
        </div>
      </div>
    </section>
  );
}
