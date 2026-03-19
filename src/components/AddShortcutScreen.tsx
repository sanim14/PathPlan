import { useStore } from '../store/useStore';
import { saveShortcut } from '../firebase/shortcuts';
import type { Shortcut } from '../types';
import { useState } from 'react';

type ShortcutTag = Shortcut['tags'][number];

const TAG_CONFIG: Record<ShortcutTag, { icon: string; color: string; label: string }> = {
  indoor: { icon: '🏠', color: '#4F7CFF', label: 'Indoor' },
  'hidden-shortcut': { icon: '🔍', color: '#8B5CF6', label: 'Hidden Shortcut' },
  'unsafe-at-night': { icon: '🌙', color: '#EF4444', label: 'Unsafe at Night' },
  'crowded-between-classes': { icon: '👥', color: '#F59E0B', label: 'Crowded' },
};

export default function AddShortcutScreen() {
  const isAddingShortcut = useStore((s) => s.isAddingShortcut);
  const setIsAddingShortcut = useStore((s) => s.setIsAddingShortcut);
  const addShortcut = useStore((s) => s.addShortcut);
  const waypoints = useStore((s) => s.waypoints);
  const undoLastWaypoint = useStore((s) => s.undoLastWaypoint);
  const clearWaypoints = useStore((s) => s.clearWaypoints);

  const [selectedTags, setSelectedTags] = useState<Set<ShortcutTag>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isAddingShortcut) return null;

  function toggleTag(tag: ShortcutTag) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }

  function handleCancel() {
    clearWaypoints();
    setSelectedTags(new Set());
    setError(null);
    setSuccess(false);
    setIsAddingShortcut(false);
  }

  function handleSubmit() {
    if (waypoints.length < 2) {
      setError('Tap the map to add at least 2 points');
      return;
    }
    const shortcut: Shortcut = {
      id: Date.now().toString(),
      coordinates: waypoints,
      tags: Array.from(selectedTags),
      upvotes: 0,
      downvotes: 0,
      popularityScore: 0,
    };
    addShortcut(shortcut);
    saveShortcut(shortcut).catch(() => {});
    setSuccess(true);
    setTimeout(() => {
      clearWaypoints();
      setIsAddingShortcut(false);
    }, 1400);
  }

  return (
    <>
      {/* Tap-to-add instruction banner */}
      {!success && (
        <div
          style={{
            position: 'fixed',
            top: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            background: 'rgba(79,124,255,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: '#fff',
            borderRadius: 999,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(79,124,255,0.35)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          👆 Tap the map to place waypoints
        </div>
      )}

      {/* Bottom sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          display: 'flex',
          justifyContent: 'center',
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
            padding: '16px 20px 32px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            animation: 'slideUp 350ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <style>{`
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          `}</style>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>Add Shortcut</span>
            <button onClick={handleCancel} aria-label="Cancel" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8', padding: 4 }}>✕</button>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 18, fontWeight: 600, color: '#22C55E' }}>
              ✅ Shortcut added!
            </div>
          ) : (
            <>
              {/* Waypoint count + controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', flex: 1 }}>
                  {waypoints.length} point{waypoints.length !== 1 ? 's' : ''} placed
                </span>
                {waypoints.length > 0 && (
                  <>
                    <button
                      onClick={undoLastWaypoint}
                      style={{ fontSize: 12, fontWeight: 600, color: '#4F7CFF', background: 'rgba(79,124,255,0.08)', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
                    >
                      ↩ Undo
                    </button>
                    <button
                      onClick={clearWaypoints}
                      style={{ fontSize: 12, fontWeight: 600, color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tags</div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {(Object.entries(TAG_CONFIG) as [ShortcutTag, typeof TAG_CONFIG[ShortcutTag]][]).map(([tag, cfg]) => {
                    const isSelected = selectedTags.has(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: isSelected ? cfg.color : 'transparent',
                          color: isSelected ? '#fff' : cfg.color,
                          border: `1.5px solid ${cfg.color}`,
                          borderRadius: 999, padding: '5px 11px',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          transition: 'all 150ms ease',
                          boxShadow: isSelected ? `0 0 0 3px ${cfg.color}33` : 'none',
                        }}
                      >
                        {cfg.icon} {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div style={{ color: '#EF4444', fontSize: 13, fontWeight: 500, marginBottom: 10 }}>⚠️ {error}</div>
              )}

              <button
                onClick={handleSubmit}
                style={{
                  width: '100%', padding: '13px 0',
                  background: 'linear-gradient(135deg, #4F7CFF, #6EE7B7)',
                  color: '#fff', border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  transition: 'transform 150ms ease',
                }}
                onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              >
                Submit Shortcut
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
