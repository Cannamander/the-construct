import Game from './components/Game.tsx';
import { ToastContainer } from 'react-toastify';
import { useState } from 'react';
import ReactModal from 'react-modal';
import MusicButton from './components/buttons/MusicButton.tsx';
import Button from './components/buttons/Button.tsx';
import InteractButton from './components/buttons/InteractButton.tsx';
import FreezeButton from './components/FreezeButton.tsx';
import { MAX_HUMAN_PLAYERS } from '../convex/constants.ts';
import PoweredByConvex from './components/PoweredByConvex.tsx';
import helpImg from '../assets/help.svg';
import starImg from '../assets/star.svg';

export default function Home() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  return (
    <main style={{
      height: '100vh',
      background: '#080b12',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      color: '#a0f0e0',
      overflow: 'hidden',
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        pointerEvents: 'none',
        zIndex: 100,
      }} />

      {/* Grid background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,180,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,180,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Corner decorations */}
      <div style={{
        position: 'fixed',
        top: 12,
        left: 12,
        width: 60,
        height: 60,
        borderTop: '2px solid #00ffb4',
        borderLeft: '2px solid #00ffb4',
        pointerEvents: 'none',
        zIndex: 101,
      }} />
      <div style={{
        position: 'fixed',
        top: 12,
        right: 12,
        width: 60,
        height: 60,
        borderTop: '2px solid #00ffb4',
        borderRight: '2px solid #00ffb4',
        pointerEvents: 'none',
        zIndex: 101,
      }} />
      <div style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        width: 60,
        height: 60,
        borderBottom: '2px solid #00ffb4',
        borderLeft: '2px solid #00ffb4',
        pointerEvents: 'none',
        zIndex: 101,
      }} />
      <div style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        width: 60,
        height: 60,
        borderBottom: '2px solid #00ffb4',
        borderRight: '2px solid #00ffb4',
        pointerEvents: 'none',
        zIndex: 101,
      }} />

      <ReactModal
        isOpen={helpModalOpen}
        onRequestClose={() => setHelpModalOpen(false)}
        style={modalStyles}
        contentLabel="Help modal"
        ariaHideApp={false}
      >
        <div style={{ fontFamily: '"Share Tech Mono", monospace', color: '#a0f0e0' }}>
          <h1 style={{ textAlign: 'center', fontSize: '2rem', color: '#00ffb4', letterSpacing: '0.2em', marginBottom: '1rem' }}>
            // THE CONSTRUCT
          </h1>
          <p>Click and drag to navigate the facility. Scroll to zoom. Click an agent to view their conversation logs.</p>
          <h2 style={{ color: '#00ffb4', marginTop: '1rem', fontSize: '1.2rem' }}>INTERACT MODE</h2>
          <p>Log in to enter the simulation. Click <b>Interact</b> to deploy your agent. Click another agent to initiate contact.</p>
          <p style={{ marginTop: '0.5rem', color: '#ff6b9d' }}>MAX CONCURRENT OPERATORS: {MAX_HUMAN_PLAYERS}</p>
          <p style={{ marginTop: '0.5rem', color: '#888' }}>Idle operators are purged after 5 minutes.</p>
        </div>
      </ReactModal>

      {/* Header */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        padding: '16px 24px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,255,180,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ color: '#00ffb4', fontSize: '0.7rem', letterSpacing: '0.3em', opacity: 0.6 }}>SYS://</span>
          <h1 style={{
            fontSize: 'clamp(1.2rem, 3vw, 2rem)',
            fontWeight: 700,
            letterSpacing: '0.25em',
            color: '#00ffb4',
            textShadow: '0 0 20px rgba(0,255,180,0.4), 0 0 40px rgba(0,255,180,0.2)',
            margin: 0,
            fontFamily: '"Share Tech Mono", monospace',
          }}>
            THE CONSTRUCT
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.65rem', color: '#00ffb4', opacity: 0.5, letterSpacing: '0.15em' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ffb4', display: 'inline-block', boxShadow: '0 0 8px #00ffb4', animation: 'pulse 2s infinite' }} />
          NEXUS ONLINE
        </div>
      </header>

      {/* Subtitle bar */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '4px 24px',
        fontSize: '0.65rem',
        letterSpacing: '0.2em',
        color: 'rgba(0,255,180,0.4)',
        borderBottom: '1px solid rgba(0,255,180,0.08)',
      }}>
        AUTONOMOUS AGENT SIMULATION ENVIRONMENT &nbsp;|&nbsp; 5 AGENTS ACTIVE &nbsp;|&nbsp; MONITORING ALL SECTORS
      </div>

      {/* Main game area — full screen */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        paddingBottom: 0,
      }}>
        <Game />
      </div>

      {/* Footer controls */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderTop: '1px solid rgba(0,255,180,0.15)',
        background: 'rgba(8,11,18,0.97)',
        flexWrap: 'wrap',
      }}>
        <FreezeButton />
        <MusicButton />
        <Button href="https://github.com/a16z-infra/ai-town" imgUrl={starImg}>Star</Button>
        <InteractButton />
        <Button imgUrl={helpImg} onClick={() => setHelpModalOpen(true)}>Help</Button>
        <div style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'rgba(0,255,180,0.3)', letterSpacing: '0.15em' }}>
          POWERED BY CONVEX
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        html, body { overflow: hidden; height: 100%; margin: 0; padding: 0; }
      `}</style>

      <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
    </main>
  );
}

const modalStyles = {
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 200,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '560px',
    width: '90%',
    border: '1px solid rgba(0,255,180,0.4)',
    borderRadius: '0',
    background: '#0d1520',
    color: '#a0f0e0',
    fontFamily: '"Share Tech Mono", monospace',
    boxShadow: '0 0 40px rgba(0,255,180,0.1)',
    padding: '2rem',
  },
};
