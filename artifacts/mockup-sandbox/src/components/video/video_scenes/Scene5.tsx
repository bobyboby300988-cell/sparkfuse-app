import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
      setTimeout(() => setPhase(4), 3500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center px-6"
      initial={{ x: '100vw' }}
      animate={{ x: 0 }}
      exit={{ scale: 1.2, opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className="text-center z-30 mb-10">
        <h2 className="text-[12vw] font-display text-white leading-none tracking-tight">
          SPARK A<br/>
          <span className="text-[#F39C12]">CONVERSATION</span>
        </h2>
      </div>

      <div className="w-full max-w-[350px] relative z-20">
        <div className="flex flex-col gap-4">
          <motion.div 
            className="self-start max-w-[80%] bg-gray-800 rounded-2xl rounded-tl-sm p-4 border border-white/10"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring" }}
          >
            <p className="text-white">Hey! I saw you love coffee too. Have you been to the new place downtown? ☕</p>
            <p className="text-white/40 text-xs mt-2">10:42 AM</p>
          </motion.div>

          <motion.div 
            className="self-end max-w-[80%] bg-gradient-to-r from-[#C0392B] to-[#e74c3c] rounded-2xl rounded-tr-sm p-4 shadow-lg shadow-[#C0392B]/20"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring" }}
          >
            <p className="text-white">Yes! We should totally go together sometime! 😊</p>
            <p className="text-white/60 text-xs mt-2 text-right">10:45 AM</p>
          </motion.div>
          
          <motion.div 
            className="self-start max-w-[80%] bg-gray-800 rounded-2xl rounded-tl-sm p-4 border border-white/10"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={phase >= 3 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring" }}
          >
            <p className="text-white">It's a date! How about this Saturday? ✨</p>
            <p className="text-white/40 text-xs mt-2">10:46 AM</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}