import React, { useState, useEffect } from 'react';
import { Github, Linkedin, Menu, X, Download } from 'lucide-react';
import { SiInstagram } from 'react-icons/si';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(7, 9, 14, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-subtle)' : 'none',
        padding: '16px 24px'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Brand Logo */}
        <a
          href="#"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'var(--text-primary)'
          }}
        >
          <img
            src="/rajan-photo.jpg"
            alt="Rajan Jagwani"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover',
              objectPosition: '50% 20%',
              border: '2px solid var(--accent-cyan)',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
              flexShrink: 0
            }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Rajan Jagwani
            </div>
            <div
              className="role-subtitle"
              style={{ display: 'none', fontSize: '0.72rem', color: 'var(--accent-cyan-light)', fontWeight: 600 }}
            >
              Senior QA Engineer &amp; QA Team Lead
            </div>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '22px'
          }}
          className="desktop-nav"
        >
          <a href="#about" style={navLinkStyle}>About</a>
          <a href="#projects" style={navLinkStyle}>Projects</a>
          <a href="#skills" style={navLinkStyle}>Skills</a>
          <a href="#experience" style={navLinkStyle}>Experience</a>
          <a href="#architecture" style={navLinkStyle}>Approach</a>
          <a href="#contact" style={navLinkStyle}>Contact</a>
        </nav>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href="https://linkedin.com/in/rajanj71"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm desktop-action-btn"
            style={{ display: 'none' }}
            aria-label="LinkedIn"
          >
            <Linkedin size={16} />
          </a>
          <a
            href="https://github.com/Rajanjagz7"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline btn-sm desktop-action-btn"
            style={{ display: 'none' }}
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
          <a
            href="/Rajan-Jagwani-Resume.pdf"
            download="Rajan-Jagwani-Resume.pdf"
            className="btn btn-primary btn-sm desktop-action-btn"
            style={{ display: 'none' }}
          >
            <Download size={16} />
            <span className="desktop-inline" style={{ display: 'none' }}>Download Resume</span>
          </a>
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            marginTop: '12px',
            background: 'rgba(10, 15, 25, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)'
          }}
          className="mobile-drawer"
        >
          <a
            href="#about"
            style={navLinkStyle}
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </a>
          <a
            href="#projects"
            style={navLinkStyle}
            onClick={() => setMobileMenuOpen(false)}
          >
            Projects
          </a>
          <a
            href="#skills"
            style={navLinkStyle}
            onClick={() => setMobileMenuOpen(false)}
          >
            Skills
          </a>
          <a
            href="#experience"
            style={navLinkStyle}
            onClick={() => setMobileMenuOpen(false)}
          >
            Experience
          </a>
          <a
            href="#architecture"
            style={navLinkStyle}
            onClick={() => setMobileMenuOpen(false)}
          >
            Approach
          </a>
          <a
            href="#contact"
            style={navLinkStyle}
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </a>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
            <a
              href="https://linkedin.com/in/rajanj71"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ flex: '1 1 90px', justifyContent: 'center' }}
            >
              <Linkedin size={16} />
              <span>LinkedIn</span>
            </a>
            <a
              href="https://github.com/Rajanjagz7"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ flex: '1 1 90px', justifyContent: 'center' }}
            >
              <Github size={16} />
              <span>GitHub</span>
            </a>
            <a
              href="https://www.instagram.com/rajanjagwani07"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ flex: '1 1 90px', justifyContent: 'center' }}
            >
              <SiInstagram size={16} />
              <span>Instagram</span>
            </a>
          </div>
          <a
            href="/Rajan-Jagwani-Resume.pdf"
            download="Rajan-Jagwani-Resume.pdf"
            className="btn btn-primary btn-sm"
            style={{ justifyContent: 'center' }}
          >
            <Download size={16} />
            <span>Download Resume</span>
          </a>
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
          .desktop-inline { display: inline !important; }
          .desktop-action-btn { display: inline-flex !important; }
          .role-subtitle { display: block !important; }
          .mobile-menu-btn { display: none !important; }
          .mobile-drawer { display: none !important; }
        }
      `}</style>
    </header>
  );
}

const navLinkStyle = {
  textDecoration: 'none',
  color: 'var(--text-secondary)',
  fontSize: '0.95rem',
  fontWeight: 500,
  transition: 'color 0.2s ease',
};
