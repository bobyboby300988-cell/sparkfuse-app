import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 2500)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const words = ["FIND", "YOUR", "SPARK"];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.2 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex flex-col items-center justify-center text-center z-10 w-full px-4">
        {words.map((word, i) => (
          <motion.div
            key={i}
            className="overflow-hidden"
          >
            <motion.h1 
              className="font-display text-[22vh] leading-[0.85] text-primary drop-shadow-[0_0_15px_rgba(192,57,43,0.5)] uppercase m-0"
              initial={{ y: "100%", rotate: 5 }}
              animate={phase >= 1 ? { y: 0, rotate: 0 } : { y: "100%", rotate: 5 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 20, 
                delay: i * 0.15 
              }}
              style={{ WebkitTextStroke: '2px white' }}
            >
              {word}
            </motion.h1>
          </motion.div>
        ))}
      </div>

      {/* Decorative fast crossing lines */}
      {phase >= 1 && (
        <>
          <motion.div 
            className="absolute h-[2px] bg-accent/60 w-[150%] left-[-25%] top-[30%]"
            initial={{ rotate: 15, x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute h-[2px] bg-primary/60 w-[150%] left-[-25%] bottom-[30%]"
            initial={{ rotate: -10, x: '100%' }}
            animate={{ x: '-100%' }}
            transition={{ duration: 0.9, ease: "easeInOut", delay: 0.2 }}
          />
        </>
      )}
    </motion.div>
  );
}