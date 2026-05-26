import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { SelectElement } from './Player';
import { Messages } from './Messages';
import { toastOnError } from '../toasts';
import { useSendInput } from '../hooks/sendInput';
import { Player } from '../../convex/aiTown/player';
import { GameId } from '../../convex/aiTown/ids';
import { ServerGame } from '../hooks/serverGame';

const mono = '"Share Tech Mono", "Courier New", monospace';

const CyberButton = ({
  onClick,
  children,
  disabled,
  color = '#00ffb4',
}: {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  color?: string;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%',
      padding: '8px 12px',
      background: 'transparent',
      border: `1px solid ${disabled ? 'rgba(0,255,180,0.2)' : color}`,
      color: disabled ? 'rgba(0,255,180,0.3)' : color,
      fontFamily: mono,
      fontSize: '0.65rem',
      letterSpacing: '0.2em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      textTransform: 'uppercase' as const,
      marginTop: 8,
      transition: 'all 0.15s',
      boxShadow: disabled ? 'none' : `0 0 10px ${color}22`,
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        (e.target as HTMLButtonElement).style.background = `${color}18`;
        (e.target as HTMLButtonElement).style.boxShadow = `0 0 20px ${color}44`;
      }
    }}
    onMouseLeave={(e) => {
      (e.target as HTMLButtonElement).style.background = 'transparent';
      (e.target as HTMLButtonElement).style.boxShadow = disabled ? 'none' : `0 0 10px ${color}22`;
    }}
  >
    {children}
  </button>
);

export default function PlayerDetails({
  worldId,
  engineId,
  game,
  playerId,
  setSelectedElement,
  scrollViewRef,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  game: ServerGame;
  playerId?: GameId<'players'>;
  setSelectedElement: SelectElement;
  scrollViewRef: React.RefObject<HTMLDivElement>;
}) {
  const humanTokenIdentifier = useQuery(api.world.userStatus, { worldId });

  const players = [...game.world.players.values()];
  const humanPlayer = players.find((p) => p.human === humanTokenIdentifier);
  const humanConversation = humanPlayer ? game.world.playerConversation(humanPlayer) : undefined;

  if (humanPlayer && humanConversation) {
    const otherPlayerIds = [...humanConversation.participants.keys()].filter(
      (p) => p !== humanPlayer.id,
    );
    playerId = otherPlayerIds[0];
  }

  const player = playerId && game.world.players.get(playerId);
  const playerConversation = player && game.world.playerConversation(player);

  const previousConversation = useQuery(
    api.world.previousConversation,
    playerId ? { worldId, playerId } : 'skip',
  );

  const playerDescription = playerId && game.playerDescriptions.get(playerId);

  const startConversation = useSendInput(engineId, 'startConversation');
  const acceptInvite = useSendInput(engineId, 'acceptInvite');
  const rejectInvite = useSendInput(engineId, 'rejectInvite');
  const leaveConversation = useSendInput(engineId, 'leaveConversation');

  if (!playerId) return null;
  if (!player) return null;

  const isMe = humanPlayer && player.id === humanPlayer.id;
  const canInvite = !isMe && !playerConversation && humanPlayer && !humanConversation;
  const sameConversation =
    !isMe &&
    humanPlayer &&
    humanConversation &&
    playerConversation &&
    humanConversation.id === playerConversation.id;

  const humanStatus =
    humanPlayer && humanConversation && humanConversation.participants.get(humanPlayer.id)?.status;
  const playerStatus = playerConversation && playerConversation.participants.get(playerId)?.status;

  const haveInvite = sameConversation && humanStatus?.kind === 'invited';
  const waitingForAccept =
    sameConversation && playerConversation.participants.get(playerId)?.status.kind === 'invited';
  const waitingForNearby =
    sameConversation && playerStatus?.kind === 'walkingOver' && humanStatus?.kind === 'walkingOver';

  const inConversationWithMe =
    sameConversation &&
    playerStatus?.kind === 'participating' &&
    humanStatus?.kind === 'participating';

  const onStartConversation = async () => {
    if (!humanPlayer || !playerId) return;
    await toastOnError(startConversation({ playerId: humanPlayer.id, invitee: playerId }));
  };
  const onAcceptInvite = async () => {
    if (!humanPlayer || !humanConversation || !playerId) return;
    await toastOnError(acceptInvite({ playerId: humanPlayer.id, conversationId: humanConversation.id }));
  };
  const onRejectInvite = async () => {
    if (!humanPlayer || !humanConversation) return;
    await toastOnError(rejectInvite({ playerId: humanPlayer.id, conversationId: humanConversation.id }));
  };
  const onLeaveConversation = async () => {
    if (!humanPlayer || !inConversationWithMe || !humanConversation) return;
    await toastOnError(leaveConversation({ playerId: humanPlayer.id, conversationId: humanConversation.id }));
  };

  return (
    <div style={{ padding: '12px 16px', fontFamily: mono, color: '#a0f0e0', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

      {/* Agent header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: '1px solid rgba(0,255,180,0.15)',
      }}>
        <div>
          <div style={{ fontSize: '0.55rem', letterSpacing: '0.25em', color: 'rgba(0,255,180,0.4)', marginBottom: 4 }}>
            AGENT ID
          </div>
          <div style={{ fontSize: '1rem', letterSpacing: '0.15em', color: '#00ffb4', textShadow: '0 0 10px rgba(0,255,180,0.3)' }}>
            {playerDescription?.name ?? '???'}
          </div>
        </div>
        <button
          onClick={() => setSelectedElement(undefined)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(0,255,180,0.3)',
            color: 'rgba(0,255,180,0.5)',
            width: 28,
            height: 28,
            cursor: 'pointer',
            fontFamily: mono,
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Action buttons */}
      {canInvite && (
        <CyberButton onClick={onStartConversation} color="#00ffb4">
          ▶ INITIATE CONTACT
        </CyberButton>
      )}
      {waitingForAccept && (
        <CyberButton disabled color="#00ffb4">
          ◌ AWAITING RESPONSE...
        </CyberButton>
      )}
      {waitingForNearby && (
        <CyberButton disabled color="#00ffb4">
          ◌ ROUTING TO AGENT...
        </CyberButton>
      )}
      {inConversationWithMe && (
        <CyberButton onClick={onLeaveConversation} color="#ff6b9d">
          ✕ TERMINATE SESSION
        </CyberButton>
      )}
      {haveInvite && (
        <>
          <CyberButton onClick={onAcceptInvite} color="#00ffb4">▶ ACCEPT INCOMING</CyberButton>
          <CyberButton onClick={onRejectInvite} color="#ff6b9d">✕ REJECT</CyberButton>
        </>
      )}

      {/* Activity status */}
      {!playerConversation && player.activity && player.activity.until > Date.now() && (
        <div style={{
          marginTop: 12,
          padding: '8px 10px',
          border: '1px solid rgba(0,255,180,0.15)',
          fontSize: '0.65rem',
          letterSpacing: '0.1em',
          color: 'rgba(0,255,180,0.5)',
        }}>
          <span style={{ color: 'rgba(0,255,180,0.3)', marginRight: 8 }}>STATUS //</span>
          {player.activity.description}
        </div>
      )}

      {/* Agent description */}
      {!isMe && playerDescription?.description && (
        <div style={{
          marginTop: 12,
          padding: '10px',
          background: 'rgba(0,255,180,0.03)',
          border: '1px solid rgba(0,255,180,0.08)',
          fontSize: '0.65rem',
          lineHeight: 1.8,
          color: 'rgba(160,240,224,0.7)',
          letterSpacing: '0.05em',
        }}>
          <div style={{ fontSize: '0.55rem', letterSpacing: '0.25em', color: 'rgba(0,255,180,0.3)', marginBottom: 6 }}>
            AGENT PROFILE
          </div>
          {playerDescription.description}
        </div>
      )}
      {isMe && (
        <div style={{
          marginTop: 12,
          padding: '8px 10px',
          border: '1px solid rgba(255,107,157,0.2)',
          fontSize: '0.65rem',
          color: '#ff6b9d',
          letterSpacing: '0.1em',
        }}>
          // THIS IS YOUR OPERATOR
        </div>
      )}
      {inConversationWithMe && (
        <div style={{
          marginTop: 6,
          padding: '6px 10px',
          fontSize: '0.6rem',
          color: 'rgba(0,255,180,0.4)',
          letterSpacing: '0.1em',
        }}>
          ● LIVE SESSION ACTIVE
        </div>
      )}

      {/* Messages */}
      {!isMe && playerConversation && playerStatus?.kind === 'participating' && (
        <Messages
          worldId={worldId}
          engineId={engineId}
          inConversationWithMe={inConversationWithMe ?? false}
          conversation={{ kind: 'active', doc: playerConversation }}
          humanPlayer={humanPlayer}
          scrollViewRef={scrollViewRef}
        />
      )}
      {!playerConversation && previousConversation && (
        <>
          <div style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid rgba(0,255,180,0.1)',
            fontSize: '0.55rem',
            letterSpacing: '0.25em',
            color: 'rgba(0,255,180,0.3)',
            marginBottom: 8,
          }}>
            ARCHIVED SESSION
          </div>
          <Messages
            worldId={worldId}
            engineId={engineId}
            inConversationWithMe={false}
            conversation={{ kind: 'archived', doc: previousConversation }}
            humanPlayer={humanPlayer}
            scrollViewRef={scrollViewRef}
          />
        </>
      )}
    </div>
  );
}
