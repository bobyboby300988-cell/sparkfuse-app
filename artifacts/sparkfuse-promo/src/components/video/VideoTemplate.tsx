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
  hook:    3200,
  verify:  4500,
  live:    5500,   // needs time for all 3 gift types + withdraw overlay
  content: 7200,   // small gift → medium gift → large gift + caption
  tokens:  5000,
  outro:   4500,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  hook:    Scene1,
  verify:  Scene2,
  live:    Scene3,
  content: Scene4,
  tokens:  Scene5,
  outro:   Scene6,
};

const ORB_CONFIGS = [
  { color: '#C0392B', ax: ['12%','55%','22%'], ay: ['18%','55%','32%'], dur: 18 },
  { color: '#F39C12', ax: ['75%','28%','62%'], ay: ['68%','22%','52%'], dur: 22 },
  { color: '#C0392B', ax: ['50%','82%','18%'], ay: ['8%', '42%','12%'], dur: 15 },
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
    /* 
      Full black page. The inner phone frame is always 9:16.
      width  = min(100vw, 100vh × 9/16)  → fills width on portrait screens
      height = aspect-ratio auto-computes = width × 16/9
      On landscape/laptop: appears as a tall phone column centered in black.
      On portrait/phone: fills the whole screen edge-to-edge.
    */
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: '#0D0B12',
          /* 
            This is the key: use min() so it fits portrait AND landscape viewports.
            portrait  → width = 100vw, height = 100vw × 16/9
            landscape → width = 100vh × 9/16, height = 100vh
          */
          width: 'min(100vw, calc(100vh * 9 / 16))',
          height: 'min(100vh, calc(100vw * 16 / 9))',
          aspectRatio: '9 / 16',
        }}
      >
        {/* Persistent drifting glow orbs */}
        {ORB_CONFIGS.map((orb, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              pointerEvents: 'none',
              width: '70%',
              height: '45%',
              background: `radial-gradient(circle, ${orb.color}45 0%, transparent 70%)`,
              filter: 'blur(40px)',
              transform: 'translate(-50%, -50%)',
              left: orb.ax[0],
              top: orb.ay[0],
            }}
            animate={{ left: orb.ax, top: orb.ay }}
            transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
          />
        ))}

        <AnimatePresence mode="popLayout">
          {SceneComponent && <SceneComponent key={currentSceneKey} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
