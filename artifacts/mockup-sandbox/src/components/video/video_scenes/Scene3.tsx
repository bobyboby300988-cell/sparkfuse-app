import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 7000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ y: '-100vh', opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute top-20 z-30 text-center w-full px-4">
        <motion.div
          className="inline-block bg-[#C0392B] px-6 py-2 rounded-full mb-4 shadow-[0_0_20px_rgba(192,57,43,0.8)]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" }}
        >
          <span className="font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
            Live Now
          </span>
        </motion.div>
        
        <h2 className="text-[14vw] font-display text-white leading-none tracking-tight drop-shadow-xl">
          CONNECT IN<br/><span className="text-[#F39C12]">REAL TIME</span>
        </h2>
      </div>

      {/* Live Stream UI */}
      <motion.div 
        className="relative w-[85vw] h-[160vw] max-h-[80vh] max-w-[400px] z-20 rounded-[40px] overflow-hidden border-[4px] border-white/20 shadow-2xl"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <img src={`${import.meta.env.BASE_URL}live-streamer.png`} className="w-full h-full object-cover" />
        
        {/* Stream Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30">
          
          {/* Top Bar */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
            <div className="flex items-center gap-3 bg-black/40 rounded-full pr-4 p-1 backdrop-blur-md">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#C0392B]">
                 <img src={`${import.meta.env.BASE_URL}live-streamer.png`} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white text-xs font-bold">Jessica_99</p>
                <p className="text-[#F39C12] text-[10px] font-bold">💎 1.2k</p>
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
              <span className="text-white text-xs">👁️ 428</span>
            </div>
          </div>

          {/* Chat / Hearts area */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex flex-col gap-3 mb-4">
               {/* Chat messages */}
               <motion.div 
                 className="bg-black/40 backdrop-blur-md self-start rounded-xl p-2 px-4 border border-white/10"
                 initial={{ opacity: 0, x: -20 }}
                 animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
               >
                 <span className="text-[#F39C12] text-sm font-bold mr-2">Mike:</span>
                 <span className="text-white text-sm">You look amazing! 😍</span>
               </motion.div>
               <motion.div 
                 className="bg-black/40 backdrop-blur-md self-start rounded-xl p-2 px-4 border border-white/10"
                 initial={{ opacity: 0, x: -20 }}
                 animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
               >
                 <span className="text-[#3498DB] text-sm font-bold mr-2">Alex:</span>
                 <span className="text-white text-sm">Where are you streaming from?</span>
               </motion.div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 bg-black/40 backdrop-blur-md rounded-full px-4 py-3 border border-white/10 text-white/50 text-sm">
                Say something...
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#C0392B] to-[#F39C12] flex items-center justify-center shadow-lg">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </div>
            </div>
          </div>

          {/* Floating Hearts Animation */}
          {phase >= 1 && (
            <div className="absolute bottom-24 right-4 w-12 h-40">
              {[1,2,3,4,5,6].map((i) => (
                <motion.div
                  key={i}
                  className="absolute bottom-0 text-2xl"
                  initial={{ y: 0, x: 0, opacity: 1, scale: 0.5 }}
                  animate={{ 
                    y: -150, 
                    x: Math.random() * 40 - 20,
                    opacity: 0,
                    scale: 1.5
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: i * 0.3,
                    ease: "easeOut"
                  }}
                >
                  {i % 2 === 0 ? '❤️' : '✨'}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}