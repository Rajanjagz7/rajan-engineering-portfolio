import React, { useState } from 'react';
import { Mail, Github, Linkedin, Phone, Copy, Check, Send, MapPin, Globe, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { SiInstagram } from 'react-icons/si';

export default function ContactSection() {
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', message: '', website: '' });

  const email = 'rajanjagz7@gmail.com';
  const phone = '+91 93135 02479';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Something went wrong sending your message.');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Could not send the message. Please email me directly instead.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" style={{ padding: '80px 0 100px 0', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
            gap: '48px',
            alignItems: 'center'
          }}
        >
          {/* Left Column: Contact Info & Value Prop */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-full)',
                marginBottom: '16px'
              }}
            >
              <Sparkles size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan-light)', fontWeight: 600, textTransform: 'uppercase' }}>
                Let's Connect
              </span>
            </div>

            <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', fontWeight: 800, marginBottom: '18px' }}>
              Ready to elevate your product's quality & velocity?
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '32px' }}>
              Whether you need to architect a greenfield automation framework, eliminate flaky test debt, or supercharge CI/CD pipelines, I'm always open to discussing new opportunities.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
              {/* Email Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Mail size={20} style={{ color: 'var(--accent-cyan)' }} />
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{email}</span>
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Phone Card */}
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Phone size={20} style={{ color: 'var(--accent-emerald)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{phone}</span>
              </a>

              {/* LinkedIn Card */}
              <a
                href="https://linkedin.com/in/rajanj71"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Linkedin size={20} style={{ color: '#0A66C2' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>linkedin.com/in/rajanj71</span>
              </a>

              {/* GitHub Card */}
              <a
                href="https://github.com/Rajanjagz7"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Github size={20} style={{ color: 'var(--accent-purple)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>github.com/Rajanjagz7</span>
              </a>

              {/* Instagram Card */}
              <a
                href="https://www.instagram.com/rajanjagwani07"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <SiInstagram size={20} color="#E4405F" />
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>instagram.com/rajanjagwani07</span>
              </a>

              {/* Location Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px'
                }}
              >
                <MapPin size={20} style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Ahmedabad, India</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Contact Box */}
          <div className="glass-panel" style={{ padding: '36px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    margin: '0 auto 18px'
                  }}
                >
                  <Check size={28} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
                  Message Sent!
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Thank you! I will reply directly to your email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '20px' }}>
                  Send a Direct Message
                </h3>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Connor"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Your Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@company.com"
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Project or Role Details
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell me about your QA needs or upcoming projects..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Honeypot - hidden from real visitors, catches simple bots */}
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
                />

                {error && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '10px 14px',
                      marginBottom: '16px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '8px',
                      color: '#fca5a5',
                      fontSize: '0.85rem'
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={sending}>
                  {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                  <span>{sending ? 'Sending…' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(7, 10, 16, 0.6)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.2s ease'
};
