import React from 'react';
import { ArrowUpRight, CheckCircle2, Shield, Activity } from 'lucide-react';

const CATEGORY_ACCENT = {
  'security-audit': '#06b6d4',
  leadership: '#6366f1',
  'mobile-apps': '#14b8a6',
  healthcare: '#10b981',
  blockchain: '#8b5cf6',
  ecommerce: '#f59e0b'
};

export default function ProjectCard({ project, onSelect }) {
  const accent = CATEGORY_ACCENT[project.category] || '#06b6d4';
  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '28px',
        position: 'relative',
        cursor: 'pointer',
        height: '100%',
        overflow: 'hidden'
      }}
      onClick={() => onSelect(project)}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: accent
        }}
      />
      <div>
        {/* Top Meta: Badge & Year */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}
        >
          <span
            className={
              project.category === 'blockchain'
                ? 'badge badge-purple'
                : project.category === 'healthcare'
                ? 'badge badge-emerald'
                : 'badge badge-cyan'
            }
          >
            {project.badge}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{project.period}</span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            marginBottom: '8px',
            transition: 'color 0.2s ease'
          }}
        >
          {project.title}
        </h3>

        {/* Subtitle / Description */}
        <p
          style={{
            fontSize: '0.92rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '20px'
          }}
        >
          {project.subtitle}
        </p>

        {/* Highlighted Metrics Chips */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginBottom: '20px',
            background: 'rgba(7, 10, 16, 0.4)',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.04)'
          }}
        >
          {project.metrics.slice(0, 2).map((metric) => (
            <div key={metric.label}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{metric.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan-light)' }}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        {/* Tech Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {project.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.78rem',
                padding: '3px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 4 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
              +{project.tags.length - 4} more
            </span>
          )}
        </div>

        {/* Action Link */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '16px',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--accent-cyan)'
          }}
        >
          <span>Inspect Architecture & Specs</span>
          <ArrowUpRight size={18} />
        </div>
      </div>
    </div>
  );
}
