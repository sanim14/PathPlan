import { useState } from 'react';
import { useStore } from '../store/useStore';
import { saveShortcut } from '../firebase/shortcuts';
import type { Shortcut } from '../types';

type ShortcutTag = Shortcut['tags'][number];

const TAG_CONFIG: Record<ShortcutTag, { icon: string; color: string; label: string }> = {
  indoor: { icon: '🏠', color: '#4F7CFF', label: 'Indoor' },
  'hidden-shortcut': { icon: '🔍', color: '#8B5CF6', label: 'Hidden Shortcut' },
  'unsafe-at-night': { icon: '🌙', color: '#EF4444', label: 'Unsafe at Night' },
  'crowded-between-classes': { icon: '👥', color: '#F59E0B', label: 'Crowded Between Classes' },
};

const CAMPUS_CENTER = { lat: 30.284, lng: -97.739 };

function randomNear(center: number, spread: number): number {
  return center + (Math.random() * 2 - 1) * spread;
}

export default function AddShortcutScreen() {
  const isAddingShortcut = useStore((s) => s.isAddingShortcut);
  const setIsAddingShortcut = useStore((s) => s.setIsAddingShortcut);
  const addShortcut = useStore((s) => s.addShortcut);

  const [waypoints, setWaypoints] = useState<{ lat: number; lng: number }[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<ShortcutTag>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isAddingShortcut) return null;

  function handleAddPoint() {
    const lat = parseFloat(randomNear(CAMPUS_CENTER.lat, 0.002).toFixed(6));
    const lng = parseFloat(randomNear(CAMPUS_CENTER.lng, 0.002).toFixed(6));
    setWaypoints((prev) => [...prev, { lat, lng }]);
    setError(null);
  }

  function handleRemovePoint(index: number) {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleTag(tag: ShortcutTag) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function handleCancel() {
    setWaypoints([]);
    setSelectedTags(new Set());
    setError(null);
    setSuccess(false);
    setIsAddingShortcut(false);
  }

  function handleSubmit() {
    if (waypoints.length < 2) {
      setError('Add at least 2 waypoints');
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
    saveShortcut(shortcut).catch(() => {/* fire and forget */});

    setSuccess(true);
    setTimeout(() => {
      setIsAddingShortcut(false);
    }, 1500);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 32px',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
          animation: 'slideUp 350ms cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
            Add Shortcut
          </span>
          <button
            onClick={handleCancel}
            aria-label="Cancel"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: '#94a3b8',
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {success ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 0',
              fontSize: 18,
              fontWeight: 600,
              color: '#22C55E',
            }}
          >
            ✅ Shortcut added!
          </div>
        ) : (
          <>
            {/* Waypoint instruction */}
            <div
              style={{
                background: '#f1f5f9',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 16,
                fontSize: 13,
                color: '#64748b',
                textAlign: 'center',
              }}
            >
              👆 Tap "Add Point" to add waypoints along your shortcut path
            </div>

            {/* Waypoint count */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#475569',
                marginBottom: 10,
              }}
            >
              {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''} added
            </div>

            {/* Waypoint list */}
            {waypoints.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {waypoints.map((wp, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '8px 12px',
                      fontSize: 13,
                      color: '#334155',
                    }}
                  >
                    <span>📍 Point {i + 1}: {wp.lat}, {wp.lng}</span>
                    <button
                      onClick={() => handleRemovePoint(i)}
                      aria-label={`Remove point ${i + 1}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#94a3b8',
                        padding: '0 4px',
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Point button */}
            <button
              onClick={handleAddPoint}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'transparent',
                color: '#4F7CFF',
                border: '1.5px dashed #4F7CFF',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 20,
              }}
            >
              + Add Point
            </button>

            {/* Tag selector */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: 10,
                }}
              >
                Tags
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Object.entries(TAG_CONFIG) as [ShortcutTag, typeof TAG_CONFIG[ShortcutTag]][]).map(
                  ([tag, cfg]) => {
                    const isSelected = selectedTags.has(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: isSelected ? cfg.color : 'transparent',
                          color: isSelected ? '#fff' : cfg.color,
                          border: `1.5px solid ${cfg.color}`,
                          borderRadius: 999,
                          padding: '5px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 150ms ease-in-out',
                        }}
                      >
                        {cfg.icon} {cfg.label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Validation error */}
            {error && (
              <div
                style={{
                  color: '#EF4444',
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 12,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              style={{
                width: '100%',
                padding: '13px 0',
                background: '#4F7CFF',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Submit Shortcut
            </button>
          </>
        )}
      </div>
    </div>
  );
}
