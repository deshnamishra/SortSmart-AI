import { useEffect, useRef } from 'react';

/**
 * useCounterUp — animates a number from 0 to `target` using rAF.
 * @param {number} target   — final value
 * @param {number} duration — ms (default 1200)
 * @param {boolean} active  — only starts when true
 * @param {Function} setter — React state setter to update displayed value
 */
export default function useCounterUp(target, setter, duration = 1200, active = true) {
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!active || target == null || isNaN(target)) return;

    const isFloat = !Number.isInteger(target);
    const startVal = 0;
    const endVal = Number(target);

    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;
      setter(isFloat ? parseFloat(current.toFixed(2)) : Math.round(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setter(target); // ensure exact final value
      }
    };

    startRef.current = null;
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, active, duration]); // eslint-disable-line
}
