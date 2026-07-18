import { useState } from 'react';
import VideoWithControls from './components/video/VideoWithControls';

const APK_URL =
  'https://expo.dev/artifacts/eas/pX-p7jQ6p_mRwCZw1yOValjacJvWSKXl4crJxTloqNQ.apk';

export default function App() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    // Proxy through our API so the file saves as "SparkFuse App.apk"
    window.location.href = 'https://match-maker-2025ap.replit.app/api/download/apk';
    setTimeout(() => setDownloading(false), 4000);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#0a0a0a' }}>
      <VideoWithControls />

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 20px 32px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      >
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: '13px',
          marginBottom: '12px',
          fontFamily: 'sans-serif',
          letterSpacing: '0.5px',
        }}>
          Android · Free Download
        </p>

        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            pointerEvents: 'all',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: downloading
              ? 'linear-gradient(135deg, #888 0%, #666 100%)'
              : 'linear-gradient(135deg, #FF3366 0%, #FF6B35 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '32px',
            padding: '16px 36px',
            fontSize: '17px',
            fontWeight: '700',
            fontFamily: 'sans-serif',
            cursor: downloading ? 'default' : 'pointer',
            boxShadow: '0 4px 24px rgba(255,51,102,0.45)',
            transition: 'all 0.2s ease',
            letterSpacing: '0.3px',
          }}
        >
          {downloading ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Se descarcă…
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download app
            </>
          )}
        </button>

        <p style={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: '11px',
          marginTop: '10px',
          fontFamily: 'sans-serif',
        }}>
          18+ Adults only · Requires Android
        </p>

        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          width: '100%',
          textAlign: 'center',
        }}>
          <a
            href="https://privacypolicyurl.com/spark/privacy-policy.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '11px',
              fontFamily: 'sans-serif',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,51,102,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            Politică de confidențialitate
          </a>
        </div>
      </div>
    </div>
  );
}
