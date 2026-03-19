import { useStore } from '../store/useStore';
import { voteOnShortcut as firebaseVote } from '../firebase/shortcuts';
import type { Shortcut } from '../types';

interface VotingControlsProps {
  shortcut: Shortcut;
}

export default function VotingControls({ shortcut }: VotingControlsProps) {
  const sessionVotes = useStore((s) => s.sessionVotes);
  const voteOnShortcut = useStore((s) => s.voteOnShortcut);

  const hasVoted = sessionVotes.has(shortcut.id);

  function handleVote(direction: 'up' | 'down') {
    if (hasVoted) return;
    voteOnShortcut(shortcut.id, direction);
    firebaseVote(shortcut.id, direction).catch(() => {
      // fire and forget — ignore errors silently
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => handleVote('up')}
          disabled={hasVoted}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 999,
            border: '1.5px solid #22C55E',
            background: 'transparent',
            color: '#22C55E',
            fontSize: 13,
            fontWeight: 600,
            cursor: hasVoted ? 'not-allowed' : 'pointer',
            opacity: hasVoted ? 0.5 : 1,
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (!hasVoted) (e.currentTarget as HTMLButtonElement).style.background = '#f0fdf4';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          👍 Upvote ({shortcut.upvotes})
        </button>

        <button
          onClick={() => handleVote('down')}
          disabled={hasVoted}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 999,
            border: '1.5px solid #EF4444',
            background: 'transparent',
            color: '#EF4444',
            fontSize: 13,
            fontWeight: 600,
            cursor: hasVoted ? 'not-allowed' : 'pointer',
            opacity: hasVoted ? 0.5 : 1,
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (!hasVoted) (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          👎 Downvote ({shortcut.downvotes})
        </button>
      </div>

      {hasVoted && (
        <p style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
          You've already voted
        </p>
      )}
    </div>
  );
}
