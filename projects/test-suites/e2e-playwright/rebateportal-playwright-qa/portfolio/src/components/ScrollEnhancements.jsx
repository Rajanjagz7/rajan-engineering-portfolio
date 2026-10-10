import React, { useEffect, useState } from 'react';

/**
 * Two lightweight, non-invasive UI touches applied globally:
 * 1. A thin scroll-progress bar fixed to the very top of the page.
 * 2. Fade-up reveal animations on .glass-panel cards as they enter the
 *    viewport (observes the whole document, including cards that appear
 *    later via the Projects filter - a MutationObserver keeps watching).
 * Respects prefers-reduced-motion: reveals stay instantly visible for
 * users who've asked for reduced motion, and the progress bar is purely
 * visual either way.
 */
export default function ScrollEnhancements() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
      setProgress(pct);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const prep = (el) => {
      if (el.dataset.revealPrepped) return;
      el.dataset.revealPrepped = 'true';
      if (prefersReducedMotion) {
        el.classList.add('reveal-visible');
        return;
      }
      el.classList.add('reveal-init');
      observer.observe(el);
    };

    const scan = () => {
      document.querySelectorAll('.glass-panel').forEach(prep);
    };

    scan();
    const mutationObserver = new MutationObserver(() => scan());
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '3px',
        background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
        zIndex: 200,
        transition: 'width 0.1s ease-out',
        boxShadow: '0 0 8px rgba(6, 182, 212, 0.6)'
      }}
    />
  );
}
