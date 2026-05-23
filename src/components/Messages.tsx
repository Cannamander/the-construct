import { Doc, Id } from '../../convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { MessageInput } from './MessageInput';
import { Player } from '../../convex/aiTown/player';
import { Conversation } from '../../convex/aiTown/conversation';
import { useEffect, useRef } from 'react';

const mono = '"Share Tech Mono", "Courier New", monospace';

export function Messages({
  worldId,
  engineId,
  conversation,
  inConversationWithMe,
  humanPlayer,
  scrollViewRef,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  conversation:
    | { kind: 'active'; doc: Conversation }
    | { kind: 'archived'; doc: Doc<'archivedConversations'> };
  inConversationWithMe: boolean;
  humanPlayer?: Player;
  scrollViewRef: React.RefObject<HTMLDivElement>;
}) {
  const humanPlayerId = humanPlayer?.id;
  const descriptions = useQuery(api.world.gameDescriptions, { worldId });
  const messages = useQuery(api.messages.listMessages, {
    worldId,
    conversationId: conversation.doc.id,
  });

  let currentlyTyping = conversation.kind === 'active' ? conversation.doc.isTyping : undefined;
  if (messages !== undefined && currentlyTyping) {
    if (messages.find((m) => m.messageUuid === currentlyTyping!.messageUuid)) {
      currentlyTyping = undefined;
    }
  }

  const currentlyTypingName =
    currentlyTyping &&
    descriptions?.playerDescriptions.find((p) => p.playerId === currentlyTyping?.playerId)?.name;

  const scrollView = scrollViewRef.current;
  const isScrolledToBottom = useRef(false);

  useEffect(() => {
    if (!scrollView) return undefined;
    const onScroll = () => {
      isScrolledToBottom.current = !!(
        scrollView && scrollView.scrollHeight - scrollView.scrollTop - 50 <= scrollView.clientHeight
      );
    };
    scrollView.addEventListener('scroll', onScroll);
    return () => scrollView.removeEventListener('scroll', onScroll);
  }, [scrollView]);

  useEffect(() => {
    if (isScrolledToBottom.current) {
      scrollViewRef.current?.scrollTo({ top: scrollViewRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, currentlyTyping]);

  if (messages === undefined) return null;
  if (messages.length === 0 && !inConversationWithMe) return null;

  const messageNodes: { time: number; node: React.ReactNode }[] = messages.map((m) => {
    const isHuman = m.author === humanPlayerId;
    return {
      time: m._creationTime,
      node: (
        <div key={`msg-${m._id}`} style={{ marginBottom: 12 }}>
          {/* Message header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
            fontSize: '0.55rem',
            letterSpacing: '0.15em',
          }}>
            <span style={{ color: isHuman ? '#ff6b9d' : '#00ffb4' }}>
              {isHuman ? '// OPERATOR' : `// ${m.authorName?.toUpperCase()}`}
            </span>
            <span style={{ color: 'rgba(160,240,224,0.25)' }}>
              {new Date(m._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {/* Message bubble */}
          <div style={{
            padding: '8px 10px',
            background: isHuman ? 'rgba(255,107,157,0.06)' : 'rgba(0,255,180,0.05)',
            border: `1px solid ${isHuman ? 'rgba(255,107,157,0.2)' : 'rgba(0,255,180,0.15)'}`,
            fontSize: '0.7rem',
            lineHeight: 1.7,
            color: isHuman ? 'rgba(255,107,157,0.9)' : 'rgba(160,240,224,0.85)',
            letterSpacing: '0.04em',
            borderLeft: `3px solid ${isHuman ? '#ff6b9d' : '#00ffb4'}`,
          }}>
            {m.text}
          </div>
        </div>
      ),
    };
  });

  const lastMessageTs = messages.map((m) => m._creationTime).reduce((a, b) => Math.max(a, b), 0);

  const membershipNodes: typeof messageNodes = [];
  if (conversation.kind === 'active') {
    for (const [playerId, m] of conversation.doc.participants) {
      const playerName = descriptions?.playerDescriptions.find((p) => p.playerId === playerId)?.name;
      let started;
      if (m.status.kind === 'participating') started = m.status.started;
      if (started) {
        membershipNodes.push({
          time: started,
          node: (
            <div key={`joined-${playerId}`} style={{
              textAlign: 'center',
              fontSize: '0.55rem',
              letterSpacing: '0.2em',
              color: 'rgba(0,255,180,0.3)',
              marginBottom: 8,
              padding: '4px 0',
              borderTop: '1px solid rgba(0,255,180,0.08)',
              borderBottom: '1px solid rgba(0,255,180,0.08)',
            }}>
              ▶ {playerName?.toUpperCase()} CONNECTED
            </div>
          ),
        });
      }
    }
  } else {
    for (const playerId of conversation.doc.participants) {
      const playerName = descriptions?.playerDescriptions.find((p) => p.playerId === playerId)?.name;
      membershipNodes.push({
        time: conversation.doc.created,
        node: (
          <div key={`joined-${playerId}`} style={{
            textAlign: 'center',
            fontSize: '0.55rem',
            letterSpacing: '0.2em',
            color: 'rgba(0,255,180,0.3)',
            marginBottom: 8,
            padding: '4px 0',
            borderTop: '1px solid rgba(0,255,180,0.08)',
            borderBottom: '1px solid rgba(0,255,180,0.08)',
          }}>
            ▶ {playerName?.toUpperCase()} CONNECTED
          </div>
        ),
      });
      membershipNodes.push({
        time: Math.max(lastMessageTs + 1, conversation.doc.ended),
        node: (
          <div key={`left-${playerId}`} style={{
            textAlign: 'center',
            fontSize: '0.55rem',
            letterSpacing: '0.2em',
            color: 'rgba(255,107,157,0.3)',
            marginBottom: 8,
            padding: '4px 0',
            borderTop: '1px solid rgba(255,107,157,0.08)',
            borderBottom: '1px solid rgba(255,107,157,0.08)',
          }}>
            ✕ {playerName?.toUpperCase()} DISCONNECTED
          </div>
        ),
      });
    }
  }

  const nodes = [...messageNodes, ...membershipNodes];
  nodes.sort((a, b) => a.time - b.time);

  return (
    <div style={{ marginTop: 16, fontFamily: mono }}>
      {/* Session header */}
      <div style={{
        fontSize: '0.55rem',
        letterSpacing: '0.25em',
        color: 'rgba(0,255,180,0.3)',
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: '1px solid rgba(0,255,180,0.1)',
      }}>
        {conversation.kind === 'active' ? 'LIVE TRANSMISSION' : 'ARCHIVED TRANSMISSION'}
      </div>

      {/* Messages */}
      <div>
        {nodes.map((n) => n.node)}

        {/* Typing indicator */}
        {currentlyTyping && currentlyTyping.playerId !== humanPlayerId && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: '0.55rem',
              letterSpacing: '0.15em',
              color: '#00ffb4',
              marginBottom: 4,
            }}>
              // {currentlyTypingName?.toUpperCase()}
            </div>
            <div style={{
              padding: '8px 10px',
              background: 'rgba(0,255,180,0.03)',
              border: '1px solid rgba(0,255,180,0.1)',
              borderLeft: '3px solid rgba(0,255,180,0.4)',
              fontSize: '0.7rem',
              color: 'rgba(0,255,180,0.4)',
              letterSpacing: '0.1em',
              fontStyle: 'italic',
            }}>
              transmitting...
            </div>
          </div>
        )}

        {/* Message input */}
        {humanPlayer && inConversationWithMe && conversation.kind === 'active' && (
          <div style={{ marginTop: 12 }}>
            <MessageInput
              worldId={worldId}
              engineId={engineId}
              conversation={conversation.doc}
              humanPlayer={humanPlayer}
            />
          </div>
        )}
      </div>
    </div>
  );
}
