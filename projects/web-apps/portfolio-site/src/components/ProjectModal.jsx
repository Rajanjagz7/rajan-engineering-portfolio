import React, { useState } from 'react';
import { X, CheckCircle2, Code, FileText, Activity, Copy, Check, ClipboardList } from 'lucide-react';

export default function ProjectModal({ project, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  if (!project) return null;

  const handleCopy = () => {
    if (project.codeSnippet?.code) {
      navigator.clipboard.writeText(project.codeSnippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(3, 6, 12, 0.8)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#0d1320',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          padding: '0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-cyan">{project.badge}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{project.period}</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{project.title}</h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {project.subtitle}
            </p>
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ marginTop: '14px', display: 'inline-flex', fontSize: '0.88rem', padding: '8px 16px' }}
              >
                <span>View source on GitHub</span>
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '12px 28px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(7, 10, 16, 0.5)'
          }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            style={getTabStyle(activeTab === 'overview')}
          >
            <FileText size={16} />
            <span>Architecture & Highlights</span>
          </button>
          {project.codeSnippet && (
            <button
              onClick={() => setActiveTab('code')}
              style={getTabStyle(activeTab === 'code')}
            >
              <Code size={16} />
              <span>Automated Test Code</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('metrics')}
            style={getTabStyle(activeTab === 'metrics')}
          >
            <Activity size={16} />
            <span>Execution Metrics</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '28px' }}>
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Summary</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
                {project.summary}
              </p>

              {project.scopeOfWork && (
                <>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ClipboardList size={18} style={{ color: 'var(--accent-purple)' }} />
                    <span>Scope of Work</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {project.scopeOfWork.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '2px 0'
                        }}
                      >
                        <span
                          style={{
                            flexShrink: 0,
                            marginTop: '2px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            background: 'rgba(139, 92, 246, 0.12)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            color: 'var(--accent-purple)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {index + 1}
                        </span>
                        <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Engineering Highlights & Solved Challenges</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {project.highlights.map((highlight, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <CheckCircle2 size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {highlight}
                    </span>
                  </div>
                ))}
              </div>

              <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Core Technologies</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'code' && project.codeSnippet && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}
              >
                <div style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {project.codeSnippet.title}
                </div>
                <button
                  onClick={handleCopy}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                >
                  {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Snippet'}</span>
                </button>
              </div>

              <pre
                style={{
                  background: '#070a10',
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflowX: 'auto',
                  fontSize: '0.86rem',
                  lineHeight: 1.7,
                  color: '#e2e8f0'
                }}
              >
                <code>{project.codeSnippet.code}</code>
              </pre>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Quality & Performance Benchmarks</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}
              >
                {project.metrics.map((m) => (
                  <div
                    key={m.label}
                    style={{
                      padding: '18px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px'
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{m.label}</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan-light)', marginTop: '4px' }}>
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: '16px 20px',
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <strong>Zero-Flake SLA:</strong> All automated tests are executed with deterministic state fixtures,
                network response mocks for external gateways, and automatic artifact retention on failure (video, trace.zip, and HAR).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTabStyle(isActive) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
    color: isActive ? 'var(--accent-cyan-light)' : 'var(--text-secondary)',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };
}
