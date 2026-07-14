import { useEffect, useState } from 'react';

// Required for video recording export
declare global {
  interface Window {
    startRecording?: () => void;
    stopRecording?: () => void;
  }
}

export function useVideoPlayer({ durations }: { durations: Record<string, number> }) {
  const [currentScene, setCurrentScene] = useState(0);
  const sceneKeys = Object.keys(durations);

  useEffect(() => {
    // Start recording on mount
    window.startRecording?.();
    
    let isSubscribed = true;
    let timeout: ReturnType<typeof setTimeout>;
    
    const playNext = (index: number) => {
      if (!isSubscribed) return;
      setCurrentScene(index);
      
      const key = sceneKeys[index];
      const duration = durations[key] || 3000;
      
      timeout = setTimeout(() => {
        if (index === sceneKeys.length - 1) {
          // Finished first pass
          window.stopRecording?.();
          // Loop back
          playNext(0);
        } else {
          playNext(index + 1);
        }
      }, duration);
    };
    
    playNext(0);
    
    return () => {
      isSubscribed = false;
      clearTimeout(timeout);
    };
  }, [JSON.stringify(durations)]); // use stringify since durations should be static

  return { currentScene, sceneKeys };
}