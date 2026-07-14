import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

export const SCENE_DURATIONS: Record<string, number> = {
  hook:       3200,
  verify:     4500,
  live:       4500,
  content:    4500,
  tokens:     5000,
  outro:      4500,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hook:       Scene1,
  verify:     Scene2,
  live:       Scene3,
  content:    Scene4,
  tokens:     Scene5,
  outro:      Scene6,
};

// Persistent background orbs — live OUTSIDE AnimatePresence, drift across all scenes
const ORB_CONFIGS = [
  { color: '#C0392B', size: 320, ix: '10%',  iy: '15%', ax: ['10%', '55%', '25%'], ay: ['15%', '55%', '30%'], dur: 18 },
  { color: '#F39C12', size: 220, ix: '75%',  iy: '70%', ax: ['75%', '30%', '60%'], ay: ['70%', '20%', '50%'], dur: 22 },
  { color: '#C0392B', size: 180, ix: '50%',  iy: '5%',  ax: ['50%', '80%', '20%'], ay: ['5%', '40%', '10%'],  dur: 15 },
];

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (key: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const SceneComponent = SCENE_COMPONENTS[baseKey];

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#0D0B12' }}>
      {/* Persistent drifting orbs */}
      {ORB_CONFIGS.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.ix,
            top: orb.iy,
            background: `radial-gradient(circle, ${orb.color}40 0%, transparent 70%)`,
            filter: 'blur(40px)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{ left: orb.ax, top: orb.ay }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
        />
      ))}

      {/* Noise texture overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
        opacity: 0.025,
        mixBlendMode: 'overlay',
      }} />

      {/* Scene content */}
      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
