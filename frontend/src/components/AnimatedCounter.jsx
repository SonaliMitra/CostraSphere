import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1.5 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = typeof value === 'number' ? value : parseFloat(value) || 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);

  const formatted = display >= 1000
    ? display.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : display.toFixed(display < 10 ? 1 : 0);

  return (
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {prefix}{formatted}{suffix}
    </motion.span>
  );
}
