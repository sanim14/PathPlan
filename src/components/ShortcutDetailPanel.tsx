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

export default function ShortcutDetailPanel() {
  const activeShortcut = useStore((s) => s.activeShortcut);
  const shortcuts = useStore((s) => s.shortcuts);
  const setActiveShortcut = useStore((s) => s.setActiveShortcut);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(activeShortcut !== null);
  }, [activeShortcut]);

  // Determine if this is the top-rated shortcut
  const topShortcut = shortcuts.reduce<Shortcut | null>((best, s) => {
    if (!best || s.popularityScore > best.popularityScore) return s;
    return best;
  }, null);

  const isTopRated = activeShortcut !== null && topShortcut?.id === activeShortcut.id;

  const translateY = isOpen ? 0 : '100%';
  const transition = isOpen
    ? 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'
    : 'transform 250ms ease-out';

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
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: '#e2e8f0',
            }}
          />
        </div>

        {activeShortcut && (
          <>
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                  Student Shortcut
                </span>
                {isTopRated && (
                  <span
                    style={{
                      background: '#fef9c3',
                      border: '1px solid #fde047',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#854d0e',
                    }}
                  >
                    ⭐ Top Rated
                  </span>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => setActiveShortcut(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  color: '#94a3b8',
                  lineHeight: 1,
                  padding: 4,
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Tags */}
            {activeShortcut.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {activeShortcut.tags.map((tag) => {
                  const cfg = TAG_CONFIG[tag];
                  return (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: cfg.color + '1a',
                        color: cfg.color,
                        border: `1px solid ${cfg.color}33`,
                        borderRadius: 999,
                        padding: '3px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Popularity score */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 700, color: '#1e293b' }}>
                {activeShortcut.popularityScore}
              </span>
              <span style={{ fontSize: 20 }}>⭐</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>popularity score</span>
            </div>

            {/* Voting */}
            <VotingControls shortcut={activeShortcut} />
          </>
        )}
      </div>
    </div>
  );
}
