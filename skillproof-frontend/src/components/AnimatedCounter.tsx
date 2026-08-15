import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

interface AnimatedCounterProps {
  target: number;
  duration?: number;
}

export function AnimatedCounter({ target, duration = 2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevTarget = useRef(0);

  useEffect(() => {
    const controls = animate(prevTarget.current, target, {
      duration: duration,
      ease: "easeOut",
      onUpdate(value) {
        if (ref.current) {
          ref.current.textContent = Math.round(value).toString();
        }
      }
    });
    
    prevTarget.current = target;
    return () => controls.stop();
  }, [target, duration]);

  return <span ref={ref} className="tabular-nums font-serif">0</span>;
}
