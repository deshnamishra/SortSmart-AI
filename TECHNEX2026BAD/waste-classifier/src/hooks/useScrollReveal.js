import { useEffect } from 'react';

/**
 * Observes all elements with [data-reveal] and adds .revealed when they
 * enter the viewport. Supports staggered children via data-reveal-delay.
 */
export default function useScrollReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.dataset.revealDelay || '0';
            el.style.transitionDelay = delay + 'ms';
            el.classList.add('revealed');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
