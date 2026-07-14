import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ x: '-100vw', opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="text-center z-30 mb-12">
        <h2 className="text-[12vw] font-display text-white leading-none tracking-tight">
          UNLOCK<br/>
          <span className="text-[#C0392B]">EXCLUSIVE</span><br/>
          CONTENT
        </h2>
        <motion.p 
          className="text-white/70 font-sans mt-4 text-lg max-w-[80%]"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
        >
          Premium private photos & videos
        </motion.p>
      </div>

      {/* Grid of blurred images */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-[350px] relative z-20">
        {[1, 2, 3, 4].map((i) => (
          <motion.div 
            key={i}
            className="aspect-square rounded-2xl bg-gray-800 relative overflow-hidden border border-white/10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <img src={`${import.meta.env.BASE_URL}profile${i%2===0?'1':'2'}.png`} className="w-full h-full object-cover blur-xl scale-110 opacity-60" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
              <motion.div
                animate={phase >= 2 && i === 1 ? { scale: [1, 1.2, 0], opacity: 0 } : {}}
                transition={{ duration: 0.5 }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white" className="drop-shadow-lg opacity-80"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
              </motion.div>
            </div>

            {/* Unlocked reveal for the first image */}
            {i === 1 && phase >= 2 && (
              <motion.div 
                className="absolute inset-0"
                initial={{ clipPath: 'circle(0% at 50% 50%)' }}
                animate={{ clipPath: 'circle(150% at 50% 50%)' }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              >
                <img src={`${import.meta.env.BASE_URL}profile2.png`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 ring-4 ring-[#F39C12] inset-ring rounded-2xl" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}