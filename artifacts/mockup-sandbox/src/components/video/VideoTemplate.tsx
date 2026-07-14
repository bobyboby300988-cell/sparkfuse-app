import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video/hooks';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { Scene7 } from './video_scenes/Scene7';

const SCENE_DURATIONS = { 
  hook: 4000, 
  profiles: 8000, 
  live: 10000, 
  exclusive: 8000, 
  chat: 6000, 
  coaches: 6000, 
  outro: 6000 
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-dark">
      {/* Persistent Background Video Layer */}
      <div className="absolute inset-0 z-0">
        <video 
          src={`${import.meta.env.BASE_URL}bg-particles.mp4`}
          className="w-full h-full object-cover opacity-60"
          autoPlay 
          muted 
          loop 
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/40 to-dark/80" />
      </div>

      {/* Persistent Midground Layer */}
      <motion.div
        className="absolute w-[40vw] h-[40vw] rounded-full blur-[100px] pointer-events-none z-0"
        style={{ background: 'var(--color-rose)' }}
        animate={{
          x: ['-20vw', '100vw', '40vw', '-20vw'][currentScene % 4],
          y: ['10vh', '50vh', '80vh', '30vh'][currentScene % 4],
          opacity: [0.3, 0.5, 0.4, 0.6][currentScene % 4],
          scale: [1, 1.5, 1.2, 0.8][currentScene % 4],
        }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[30vw] h-[30vw] rounded-full blur-[80px] pointer-events-none z-0"
        style={{ background: 'var(--color-gold)' }}
        animate={{
          x: ['80vw', '20vw', '-20vw', '60vw'][currentScene % 4],
          y: ['70vh', '20vh', '60vh', '10vh'][currentScene % 4],
          opacity: [0.2, 0.4, 0.3, 0.5][currentScene % 4],
        }}
        transition={{ duration: 5, ease: 'easeInOut' }}
      />

      <div className="absolute inset-0 z-10 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {currentScene === 0 && <Scene1 key="hook" />}
          {currentScene === 1 && <Scene2 key="profiles" />}
          {currentScene === 2 && <Scene3 key="live" />}
          {currentScene === 3 && <Scene4 key="exclusive" />}
          {currentScene === 4 && <Scene5 key="chat" />}
          {currentScene === 5 && <Scene6 key="coaches" />}
          {currentScene === 6 && <Scene7 key="outro" />}
        </AnimatePresence>
      </div>
    </div>
  );
}
