import React from 'react';
import {
  SiSelenium, SiJira, SiPostman, SiJenkins, SiGit, SiGithub, SiGitlab,
  SiBitbucket, SiMysql, SiCucumber, SiApachejmeter, SiPython, SiPytest, SiTestrail
} from 'react-icons/si';
import { Boxes } from 'lucide-react';

const tools = [
  { name: 'Selenium', Icon: SiSelenium, color: '#43B02A' },
  { name: 'JIRA', Icon: SiJira, color: '#0052CC' },
  { name: 'Postman', Icon: SiPostman, color: '#FF6C37' },
  { name: 'TestRail', Icon: SiTestrail, color: '#65C179' },
  { name: 'Jenkins', Icon: SiJenkins, color: '#D24939' },
  { name: 'Git', Icon: SiGit, color: '#F05032' },
  { name: 'GitHub', Icon: SiGithub, color: '#ffffff' },
  { name: 'GitLab', Icon: SiGitlab, color: '#FC6D26' },
  { name: 'Bitbucket', Icon: SiBitbucket, color: '#0052CC' },
  { name: 'Apache JMeter', Icon: SiApachejmeter, color: '#D22128' },
  { name: 'MySQL', Icon: SiMysql, color: '#4479A1' },
  { name: 'Cucumber', Icon: SiCucumber, color: '#23D96C' },
  { name: 'Python', Icon: SiPython, color: '#3776AB' },
  { name: 'Pytest', Icon: SiPytest, color: '#0A9EDC' }
];

export default function ToolsGrid() {
  return (
    <div style={{ marginTop: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <Boxes size={18} style={{ color: 'var(--accent-cyan)' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Tools & Platforms
        </h3>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '14px'
        }}
      >
        {tools.map(({ name, Icon, color }) => (
          <div
            key={name}
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Icon size={18} color={color} />
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
