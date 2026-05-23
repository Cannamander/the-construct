import { useMutation, useQuery } from 'convex/react';
import { KeyboardEvent, useRef } from 'react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useSendInput } from '../hooks/sendInput';
import { Player } from '../../convex/aiTown/player';
import { Conversation } from '../../convex/aiTown/conversation';

const mono = '"Share Tech Mono", "Courier New", monospace';

export function MessageInput({
  worldId,
  engineId,
  humanPlayer,
  conversation,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  humanPlayer: Player;
  conversation: Conversation;
}) {
  const descriptions = useQuery(api.world.gameDescriptions, { worldId });
  const humanName = descriptions?.playerDescriptions.find((p) => p.playerId === humanPlayer.id)?.name;
  const inputRef = useRef<HTMLParagraphElement>(null);
  const inflightUuid = useRef<string | undefined>();
  const writeMessage = useMutation(api.messages.writeMessage);
  const startTyping = useSendInput(engineId, 'startTyping');
  const currentlyTyping = conversation.isTyping;

  const onKeyDown = async (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key !== 'Enter') {
      if (currentlyTyping || inflightUuid.current !== undefined) return;
      inflightUuid.current = crypto.randomUUID();
      try {
        await startTyping({
          playerId: humanPlayer.id,
          conversationId: conversation.id,
          messageUuid: inflightUuid.current,
        });
      } finally {
        inflightUuid.current = undefined;
      }
      return;
    }
    e.preventDefault();
    if (!inputRef.current) return;
    const text = inputRef.current.innerText;
    inputRef.current.innerText = '';
    if (!text) return;
    let messageUuid = inflightUuid.current;
    if (currentlyTyping && currentlyTyping.playerId === humanPlayer.id) {
      messageUuid = currentlyTyping.messageUuid;
    }
    messageUuid = messageUuid || crypto.randomUUID();
    await writeMessage({
      worldId,
      playerId: humanPlayer.id,
      conversationId: conversation.id,
      text,
      messageUuid,
    });
  };

  return (
    <div style={{ marginTop: 8, fontFamily: mono }}>
      <div style={{
        fontSize: '0.55rem',
        letterSpacing: '0.2em',
        color: '#ff6b9d',
        marginBottom: 6,
      }}>
        // OPERATOR — {humanName?.toUpperCase()}
      </div>
      <div style={{
        border: '1px solid rgba(255,107,157,0.4)',
        borderLeft: '3px solid #ff6b9d',
        background: 'rgba(255,107,157,0.04)',
        padding: '8px 10px',
        position: 'relative',
      }}>
        <p
          ref={inputRef}
          contentEditable
          suppressContentEditableWarning
          style={{
            outline: 'none',
            fontFamily: mono,
            fontSize: '0.7rem',
            color: 'rgba(255,107,157,0.9)',
            letterSpacing: '0.04em',
            lineHeight: 1.7,
            minHeight: '1.5em',
            margin: 0,
          }}
          onKeyDown={(e) => onKeyDown(e)}
        />
        <div style={{
          position: 'absolute',
          bottom: 4,
          right: 8,
          fontSize: '0.5rem',
          color: 'rgba(255,107,157,0.3)',
          letterSpacing: '0.15em',
          pointerEvents: 'none',
        }}>
          ENTER TO SEND
        </div>
      </div>
    </div>
  );
}
