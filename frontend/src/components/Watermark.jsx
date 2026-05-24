import { motion } from 'framer-motion';
import teamLogo from '../assets/images/team_logo.png';

export default function Watermark() {
  return (
    <motion.img
      src={teamLogo}
      alt=""
      aria-hidden="true"
      className="fixed bottom-8 right-8 w-32 h-32 opacity-10 pointer-events-none z-0 select-none"
      animate={{ y: [0, -12, 0], rotate: [0, 3, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
