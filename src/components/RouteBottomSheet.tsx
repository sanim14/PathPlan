import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import type { Constraint } from '../types';

const CONSTRAINT_PILLS: Record<Constraint, { icon: string; color: string; label: string }> = {
  fastest: { icon: '⚡', color: '#4F7CFF', label: 'Fastest' },
  accessibility: { icon: '♿', color: '#22C55E', label: 'Accessible' },
  safety: { icon: '🌙', color: '#8B5CF6', label: 'Safety' },
  'low-crowd': { icon: '👥', color: '#F59E0B', label: 'Low Crowd' },
};

export default function RouteBottomSheet() {
  const activeRoute = useStore((s) => s.activeRoute);
  const timeBudget = useStore((s) => s.timeBudget);
  const setActiveRoute = useStore((s) => s.setActiveRoute);
  const setIsAddingShortcut = useStore((s) => s.setIsAddingShortcut);

  // Whether the sheet is "open" (visible) — tracks if we have a route
  const [isOpen, setIsOpen] = useState(false);

  // Drag state
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);

  // When activeRoute changes, open/close the sheet
  useEffect(() => {
    if (activeRoute) {
      setIsOpen(true);
      setDragDelta(0);
    } else {
      setIsOpen(false);
    }
  }, [activeRoute]);

  // Compute translateY
  const translateY = isOpen ? dragDelta : '100%';

  // Transition: during drag, no transition; otherwise animate
  const transition = isDragging
    ? 'none'
    : isOpen
    ? 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)'
    : 'transform 250ms ease-out';

  // --- Drag handlers ---
  function onDragStart(clientY: number) {
    dragStartY.current = clientY;
    setIsDragging(true);
  }

  function onDragMove(clientY: number) {
    if (dragStartY.current === null) return;
    const delta = Math.max(0, clientY - dragStartY.current);
    setDragDelta(delta);
  }

  function onDragEnd() {
    setIsDragging(false);
    if (dragDelta > 80) {
      // Dismiss
      setActiveRoute(null);
    } else {
      // Snap back
      setDragDelta(0);
    }
    dragStartY.current = null;
  }

  // Touch events
  function handleTouchStart(e: React.TouchEvent) {
    onDragStart(e.touches[0].clientY);
  }
  function handleTouchMove(e: React.TouchEvent) {
    onDragMove(e.touches[0].clientY);
  }
  function handleTouchEnd() {
    onDragEnd();
  }

  // Mouse events
  function handleMouseDown(e: React.MouseEvent) {
    onDragStart(e.clientY);
  }

  useEffect(() => {
    if (!isDragging) return;
    function onMouseMove(e: MouseEvent) {
      onDragMove(e.clientY);
    }
    function onMouseUp() {
      onDragEnd();
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragDelta]);

  const timeExceeded = activeRoute && activeRoute.estimatedTime > timeBudget;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 80,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px 20px 0 0',
          padding: '12px 20px 32px',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
          transform: `translateY(${typeof translateY === 'number' ? `${translateY}px` : translateY})`,
          transition,
          userSelect: 'none',
        }}
      >
        {/* Drag handle */}
        <div
          style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, cursor: 'grab' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: '#e2e8f0',
            }}
          />
        </div>

        {activeRoute && (
          <>
            {/* Time exceeded warning */}
            {timeExceeded && (
              <div
                style={{
                  background: '#fef9c3',
                  border: '1px solid #fde047',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 12,
                  fontSize: 13,
                  color: '#854d0e',
                }}
              >
                ⚠️ Route may exceed your {timeBudget} min budget
              </div>
            )}

            {/* Route time */}
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: 6,
              }}
            >
              {Math.round(activeRoute.estimatedTime)} min walk
            </div>

            {/* Explanation */}
            <div
              style={{
                fontSize: 14,
                color: '#64748b',
                fontStyle: 'italic',
                marginBottom: 14,
              }}
            >
              {activeRoute.explanation}
            </div>

            {/* Constraint pills */}
            {activeRoute.activeConstraints.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {activeRoute.activeConstraints.map((c) => {
                  const pill = CONSTRAINT_PILLS[c];
                  return (
                    <span
                      key={c}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: pill.color + '1a',
                        color: pill.color,
                        border: `1px solid ${pill.color}33`,
                        borderRadius: 999,
                        padding: '3px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {pill.icon} {pill.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Add Shortcut button */}
            <button
              onClick={() => setIsAddingShortcut(true)}
              style={{
                width: '100%',
                padding: '12px 0',
                background: '#4F7CFF',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Add Shortcut
            </button>
          </>
        )}
      </div>
    </div>
  );
}
