import { useRef, useState } from 'react';
import PixiGame from './PixiGame.tsx';
import { useElementSize } from 'usehooks-ts';
import { Stage } from '@pixi/react';
import { ConvexProvider, useConvex, useQuery } from 'convex/react';
import PlayerDetails from './PlayerDetails.tsx';
import { api } from '../../convex/_generated/api';
import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat.ts';
import { useHistoricalTime } from '../hooks/useHistoricalTime.ts';
import { DebugTimeManager } from './DebugTimeManager.tsx';
import { GameId } from '../../convex/aiTown/ids.ts';
import { useServerGame } from '../hooks/serverGame.ts';

export const SHOW_DEBUG_UI = !!import.meta.env.VITE_SHOW_DEBUG_UI;

export default function Game() {
  const convex = useConvex();
  const [selectedElement, setSelectedElement] = useState<{
    kind: 'player';
    id: GameId<'players'>;
  }>();
  const [gameWrapperRef, { width, height }] = useElementSize();
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const engineId = worldStatus?.engineId;
  const game = useServerGame(worldId);

  useWorldHeartbeat();

  const worldState = useQuery(api.world.worldState, worldId ? { worldId } : 'skip');
  const { historicalTime, timeManager } = useHistoricalTime(worldState?.engine);
  const scrollViewRef = useRef<HTMLDivElement>(null);

  if (!worldId || !engineId || !game) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(0,255,180,0.4)',
        fontSize: '0.75rem',
        letterSpacing: '0.3em',
        fontFamily: '"Share Tech Mono", monospace',
      }}>
        INITIALIZING CONSTRUCT...
      </div>
    );
  }

  return (
    <>
      {SHOW_DEBUG_UI && <DebugTimeManager timeManager={timeManager} width={200} height={100} />}
      <div style={{
        display: 'flex',
        flex: 1,
        height: '100%',
        minHeight: 0,
      }}>
        {/* Game map - takes up all available space */}
        <div style={{
          position: 'relative',
          flex: 1,
          overflow: 'hidden',
          background: '#080b12',
          border: '1px solid rgba(0,255,180,0.12)',
          minWidth: 0,
          minHeight: 0,
        }} ref={gameWrapperRef}>
          {/* Room label overlay */}
          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
            fontSize: '0.55rem',
            letterSpacing: '0.2em',
            color: 'rgba(0,255,180,0.35)',
            fontFamily: '"Share Tech Mono", monospace',
            pointerEvents: 'none',
          }}>
            SECTOR MAP — THE CONSTRUCT
          </div>

          <Stage width={width || 800} height={height || 600} options={{ backgroundColor: 0x080b12 }}>
            <ConvexProvider client={convex}>
              <PixiGame
                game={game}
                worldId={worldId}
                engineId={engineId}
                width={width}
                height={height}
                historicalTime={historicalTime}
                setSelectedElement={setSelectedElement}
              />
            </ConvexProvider>
          </Stage>
        </div>

        {/* Right panel - agent details */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            background: '#0a0e18',
            borderLeft: '1px solid rgba(0,255,180,0.15)',
            color: '#a0f0e0',
            fontFamily: '"Share Tech Mono", monospace',
          }}
          ref={scrollViewRef}
        >
          {/* Panel header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0,255,180,0.12)',
            fontSize: '0.6rem',
            letterSpacing: '0.25em',
            color: 'rgba(0,255,180,0.5)',
          }}>
            AGENT COMMS
          </div>

          <PlayerDetails
            worldId={worldId}
            engineId={engineId}
            game={game}
            playerId={selectedElement?.id}
            setSelectedElement={setSelectedElement}
            scrollViewRef={scrollViewRef}
          />

          {!selectedElement && (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              color: 'rgba(0,255,180,0.25)',
              lineHeight: 2,
            }}>
              SELECT AN AGENT<br />TO ACCESS<br />COMM LOGS
            </div>
          )}
        </div>
      </div>
    </>
  );
}
