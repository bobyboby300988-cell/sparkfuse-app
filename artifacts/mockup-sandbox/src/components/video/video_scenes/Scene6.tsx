import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center px-6 bg-gradient-to-b from-transparent to-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ y: '100vh', opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute top-20 text-center z-30">
        <h2 className="text-[12vw] font-display text-white leading-none tracking-tight">
          NEED <span className="text-[#C0392B]">ADVICE?</span>
        </h2>
        <p className="text-white/80 font-sans mt-2">Expert coaches available 24/7</p>
      </div>

      <div className="relative w-full max-w-[320px] mt-10 z-20">
        <motion.div 
          className="bg-gray-900 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl relative"
          initial={{ y: 50, scale: 0.9, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 0.3 }}
        >
          <div className="h-[250px] relative">
            <img src={`${import.meta.env.BASE_URL}coach.png`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#F39C12] text-black text-xs font-bold px-2 py-1 rounded uppercase">Top Rated</span>
                <span className="text-yellow-400 text-sm">★★★★★</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Dr. Marcus</h3>
              <p className="text-white/70 text-sm">Relationship Expert</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex gap-2 mb-6">
              <span className="bg-gray-800 text-white/80 text-xs px-3 py-1 rounded-full border border-white/10">Profile Reviews</span>
              <span className="bg-gray-800 text-white/80 text-xs px-3 py-1 rounded-full border border-white/10">Icebreakers</span>
            </div>
            
            <motion.button 
              className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg"
              initial={{ scale: 0.95 }}
              animate={phase >= 2 ? { scale: [1, 1.05, 1], backgroundColor: ["#ffffff", "#F39C12", "#ffffff"] } : {}}
              transition={{ duration: 0.5, repeat: phase >= 2 ? Infinity : 0, repeatDelay: 2 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
              Message Coach
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}