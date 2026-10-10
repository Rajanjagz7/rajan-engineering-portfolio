import React from 'react';
import { coreHighlights } from '../data/skills';
import { Gauge, Clock, ShieldCheck, Activity } from 'lucide-react';

const icons = [Gauge, Clock, ShieldCheck, Activity];

export default function Stats() {
  return (
    <section style={{ padding: '20px 0 60px 0', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px'
          }}
        >
          {coreHighlights.map((stat, index) => {
            const IconComponent = icons[index % icons.length];
            return (
              <div
                key={stat.label}
                className="glass-panel"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Decorative corner glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '60px',
                    height: '60px',
                    background: index % 2 === 0 
                      ? 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)'
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {stat.label}
                  </span>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: index % 2 === 0 ? 'var(--accent-cyan)' : 'var(--accent-purple)'
                    }}
                  >
                    <IconComponent size={18} />
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '2.4rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: index === 0 ? 'var(--accent-cyan-light)' : 'var(--text-primary)'
                  }}
                >
                  {stat.value}
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {stat.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
