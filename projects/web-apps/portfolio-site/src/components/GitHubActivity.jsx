import React, { useEffect, useRef } from 'react';
import { Github, ArrowUpRight } from 'lucide-react';

export default function GitHubActivity() {
  const scrollRef = useRef(null);

  useEffect(() => {
    // Default the view to the most recent months (right edge of the graph)
    // instead of the oldest, sparsest end.
    const el = scrollRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollLeft = el.scrollWidth;
      });
    }
  }, []);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '28px',
        marginTop: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        boxShadow: '0 0 40px rgba(6, 182, 212, 0.05)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Github size={20} style={{ color: 'var(--accent-purple)' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>GitHub Activity</h3>
        </div>
        <a
          href="https://github.com/Rajanjagz7"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
          style={{ fontSize: '0.8rem', padding: '5px 12px' }}
        >
          <span>View Profile</span>
          <ArrowUpRight size={14} />
        </a>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
        Public contribution history — day-to-day client work stays in private repositories; sanitised frameworks and tools live in my public portfolio repo.
      </p>

      <div
        ref={scrollRef}
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '20px 24px',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
        }}
      >
        <img
          src="https://ghchart.rshah.org/06b6d4/Rajanjagz7"
          alt="Rajan Jagwani's live GitHub contribution graph"
          style={{ width: '100%', minWidth: '760px', display: 'block' }}
        />
      </div>
    </div>
  );
}
