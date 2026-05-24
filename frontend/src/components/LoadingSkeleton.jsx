import { motion } from 'framer-motion';

export default function LoadingSkeleton({ fullPage = false, rows = 3 }) {
  const items = Array.from({ length: rows }, (_, i) => i);

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50 to-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-lavender-200 border-t-lavender-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          className="h-16 bg-lavender-100/60 rounded-xl"
        />
      ))}
    </div>
  );
}
