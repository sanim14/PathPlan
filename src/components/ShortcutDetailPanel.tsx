import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import VotingControls from './VotingControls';
import type { Shortcut } from '../types';

type ShortcutTag = Shortcut['tags'][number];

const TAG_CONFIG: Record<ShortcutTag, { icon: string; color: string; label: string }> = {
  indoor: { icon: '🏠', color: '#4F7CFF', label: 'Indoor' },
  'hidden-shortcut': { icon: '🔍', color: '#8B5CF6', label: 'Hidden Shortcut' },
  'unsafe-at-night': { icon: '🌙', color: '#EF4444', label: 'Unsafe at Night' },
  'crowded-between-classes': { icon: '👥', color: '#F59E0B', label: 'Crowded Between Classes' },
};

/** Generate a human-readable explanation based on shortcut tags */
function getShortcutExplanation(shortcut: Shortcut): string {
  const tags = shortcut.tags;
  if (tags.includes('indoor') && tags.includes('crowded-between-classes')) {
    return 'Indoor path — popular between classes, can get busy';
  }
  if (tags.includes('indoor')) {
    return 'Cuts through an indoor building to save time';
  }
  if (tags.includes('unsafe-at-night') && tags.includes('hidden-shortcut')) {
    return 'Hidden path — not recommended at night';
  }
  if (tags.includes('unsafe-at-night')) {
    return 'Faster route, but avoid after dark';
  }
  if (tags.includes('hidden-shortcut') && tags.includes('crowded-between-classes')) {
    return 'Secret path — gets crowded between classes';
  }
  if (tags.includes('hidden-shortcut')) {
    return 'Hidden shortcut most students don\'t know about';
  }
  if (tags.includes('crowded-between-classes')) {
    return 'Popular route — expect crowds between classes';
  }
  return 'Community-submitted shortcut';
}

export default function ShortcutDetailPanel() {
  const activeShortcut = useStore((s) => s.activeShortcut);
  const shortcuts = useStore((s) => s.shortcuts);
  const setActiveShortcut = useStore((s) => s.setActiveShortcut);
  const startLocation = useStore((s) => s.startLocation);
  const endLocation = useStore((s) => s.endLocation);
  const pinnedShortcutId = useStore((s) => s.pinnedShortcutId);
  const setPinnedShortcut = useStore((s) => s.setPinnedShortcut);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(activeShortcut !== null);
  }, [activeShortcut]);

  const topShortcut = shortcuts.reduce<Shortcut | null>((best, s) => {
    if (!best || s.popularityScore > best.popularityScore) return s;
    return best;
  }, null);

  const isTopRated = activeShortcut !== null && topShortcut?.id === activeShortcut.id;
  const isPinned = activeShortcut !== null && pinnedShortcutId === activeShortcut.id;
  const canUse = !!(startLocation && endLocation);

  const translateY = isOpen ? 0 : '100%';
  const transition = isOpen
    ? 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
    : 'transform 250ms ease-out';

  function handleUseShortcut() {
    if (!activeShortcut) return;
    if (isPinned) {
      setPinnedShortcut(null);
    } else {
      setPinnedShortcut(activeShortcut.id);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 85,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '20px 20px 0 0',
          padding: '12px 20px 32px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
          transform: `translateY(${typeof translateY === 'number' ? `${translateY}px` : translateY})`,
          transition,
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e8f0' }} />
        </div>

        {activeShortcut && (
          <>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
                  Student Shortcut
                </span>
                {isTopRated && (
                  <span style={{
                    background: '#fef9c3', border: '1px solid #fde047',
                    borderRadius: 999, padding: '2px 8px',
                    fontSize: 11, fontWeight: 700, color: '#854d0e',
                  }}>
                    ⭐ Top Rated
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveShortcut(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8', padding: 4 }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Human-readable explanation */}
            <div style={{
              background: 'rgba(79,124,255,0.06)',
              border: '1px solid rgba(79,124,255,0.12)',
              borderRadius: 10,
              padding: '8px 12px',
              marginBottom: 12,
              fontSize: 13,
              color: '#334155',
              fontStyle: 'italic',
            }}>
              💬 {getShortcutExplanation(activeShortcut)}
            </div>

            {/* Tags */}
            {activeShortcut.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
                {activeShortcut.tags.map((tag) => {
                  const cfg = TAG_CONFIG[tag];
                  return (
                    <span key={tag} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: cfg.color + '1a', color: cfg.color,
                      border: `1px solid ${cfg.color}33`,
                      borderRadius: 999, padding: '3px 10px',
                      fontSize: 12, fontWeight: 600,
                    }}>
                      {cfg.icon} {cfg.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Votes row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 700, color: '#1e293b' }}>
                  {activeShortcut.popularityScore}
                </span>
                <span style={{ fontSize: 16 }}>⭐</span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {activeShortcut.upvotes} up · {activeShortcut.downvotes} down
              </div>
            </div>

            {/* Voting */}
            <VotingControls shortcut={activeShortcut} />

            {/* Use this shortcut button */}
            {canUse && (
              <button
                onClick={handleUseShortcut}
                style={{
                  marginTop: 14,
                  width: '100%',
                  padding: '12px 0',
                  background: isPinned
                    ? 'rgba(239,68,68,0.08)'
                    : 'linear-gradient(135deg, #4F7CFF, #6EE7B7)',
                  color: isPinned ? '#EF4444' : '#fff',
                  border: isPinned ? '1.5px solid #EF4444' : 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 150ms ease',
                }}
                onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              >
                {isPinned ? '✕ Remove from route' : '🗺️ Use this shortcut'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
