import React from 'react';
import { MousePointerClick, RotateCcw, Webhook, ShieldCheck, Smartphone, Layers } from 'lucide-react';

const coverage = [
  { label: 'Functional', Icon: MousePointerClick },
  { label: 'Regression', Icon: RotateCcw },
  { label: 'API', Icon: Webhook },
  { label: 'Security', Icon: ShieldCheck },
  { label: 'Mobile', Icon: Smartphone },
  { label: 'Cross-Browser', Icon: Layers }
];

export default function TestingCoverage() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px'
      }}
    >
      {coverage.map(({ label, Icon }) => (
        <div
          key={label}
          className="glass-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '16px 10px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
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
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
