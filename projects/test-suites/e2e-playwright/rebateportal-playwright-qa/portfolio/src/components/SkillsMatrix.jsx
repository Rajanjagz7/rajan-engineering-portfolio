import React from 'react';
import { skillCategories } from '../data/skills';
import { ShieldCheck, Zap, Code2, Cpu, Bot, Smartphone, Users, CheckCircle } from 'lucide-react';
import ToolsGrid from './ToolsGrid';
import GitHubActivity from './GitHubActivity';

const iconMap = {
  ShieldCheck,
  Zap,
  Code2,
  Cpu,
  Bot,
  Smartphone,
  Users
};

export default function SkillsMatrix() {
  return (
    <section id="skills" style={{ padding: '80px 0', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 14px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: 'var(--radius-full)',
              marginBottom: '14px'
            }}
          >
            <Zap size={14} style={{ color: 'var(--accent-purple)' }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-purple-light)', fontWeight: 600, textTransform: 'uppercase' }}>
              Technical Stack & Tools
            </span>
          </div>

          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '14px' }}>
            Core Competencies & Toolchain
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto' }}>
            Manual and automated coverage across Web, Mobile, API, Performance and QA Leadership — built over 8+ years, not a single framework.
          </p>
        </div>

        {/* Skills Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
            gap: '24px'
          }}
        >
          {skillCategories.map((group) => {
            const Icon = iconMap[group.icon] || ShieldCheck;
            return (
              <div
                key={group.category}
                className="glass-panel"
                style={{
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                {/* Group Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-cyan)'
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{group.category}</h3>
                </div>

                {/* Skills List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {group.skills.map((skill) => (
                    <div
                      key={skill.name}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: skill.highlight ? 'rgba(6, 182, 212, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                        border: skill.highlight ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid rgba(255, 255, 255, 0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            fontWeight: 600,
                            fontSize: '0.92rem',
                            color: skill.highlight ? 'var(--text-primary)' : 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={skill.name}
                        >
                          {skill.name}
                        </span>
                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            background: skill.level === 'Expert' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                            color: skill.level === 'Expert' ? '#6ee7b7' : 'var(--accent-purple-light)',
                            border: skill.level === 'Expert' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)'
                          }}
                        >
                          {skill.level}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={skill.experience}
                      >
                        {skill.experience}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <ToolsGrid />
        <GitHubActivity />
      </div>
    </section>
  );
}
