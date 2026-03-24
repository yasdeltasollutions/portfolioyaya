import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
}

export default function ScrollReveal({ children, className = '', delay = 0, direction = 'up' }: Props) {
  const dirs = { up: { y: 20, x: 0 }, left: { x: -30, y: 0 }, right: { x: 30, y: 0 } };
  const d = dirs[direction];

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...d, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
