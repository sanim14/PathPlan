import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { demoBuildings } from '../data/demo';
import { Building } from '../types';

const MAX_SUGGESTIONS = 5;

interface FieldState {
  value: string;
  open: boolean;
  error: string;
}

function filterBuildings(query: string): Building[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return demoBuildings
    .filter((b) => b.name.toLowerCase().includes(lower))
    .slice(0, MAX_SUGGESTIONS);
}

export default function SearchPanel() {
  const { startLocation, endLocation, setStartLocation, setEndLocation } = useStore();

  const [from, setFrom] = useState<FieldState>({
    value: startLocation?.name ?? '',
    open: false,
    error: '',
  });
  const [to, setTo] = useState<FieldState>({
    value: endLocation?.name ?? '',
    open: false,
    error: '',
  });

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  // Sync display value when store changes externally
  useEffect(() => {
    setFrom((f) => ({ ...f, value: startLocation?.name ?? '' }));
  }, [startLocation]);

  useEffect(() => {
    setTo((t) => ({ ...t, value: endLocation?.name ?? '' }));
  }, [endLocation]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) {
        setFrom((f) => ({ ...f, open: false }));
      }
      if (toRef.current && !toRef.current.contains(e.target as Node)) {
        setTo((t) => ({ ...t, open: false }));
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setFrom({ value: val, open: true, error: '' });
    if (!val) setStartLocation(null);
  }

  function handleToChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTo({ value: val, open: true, error: '' });
    if (!val) setEndLocation(null);
  }

  function selectFrom(building: Building) {
    setStartLocation(building);
    setFrom({ value: building.name, open: false, error: '' });
  }

  function selectTo(building: Building) {
    setEndLocation(building);
    setTo({ value: building.name, open: false, error: '' });
  }

  function clearFrom() {
    setStartLocation(null);
    setFrom({ value: '', open: false, error: '' });
  }

  function clearTo() {
    setEndLocation(null);
    setTo({ value: '', open: false, error: '' });
  }

  function validate(): boolean {
    let valid = true;
    if (!startLocation) {
      setFrom((f) => ({ ...f, error: 'Please select a start location' }));
      valid = false;
    }
    if (!endLocation) {
      setTo((t) => ({ ...t, error: 'Please select an end location' }));
      valid = false;
    }
    return valid;
  }

  function handleFromKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') validate();
    if (e.key === 'Escape') setFrom((f) => ({ ...f, open: false }));
  }

  function handleToKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') validate();
    if (e.key === 'Escape') setTo((t) => ({ ...t, open: false }));
  }

  function handleGo() {
    validate();
  }

  const fromSuggestions = filterBuildings(from.value);
  const toSuggestions = filterBuildings(to.value);

  return (
    <div style={styles.panel}>
      <style>{`
        .sp-input:focus {
          border-color: #4F7CFF !important;
          box-shadow: 0 0 0 3px rgba(79,124,255,0.15) !important;
        }
        .sp-go-btn:hover {
          background: #3a6ae8 !important;
        }
      `}</style>
      {/* From field */}
      <div ref={fromRef} style={styles.fieldWrapper}>
        <div style={styles.inputRow}>
          <span style={styles.icon}>📍</span>
          <input
            className="sp-input"
            style={{
              ...styles.input,
              ...(from.error ? styles.inputError : {}),
            }}
            placeholder="From — start location"
            value={from.value}
            onChange={handleFromChange}
            onFocus={() => setFrom((f) => ({ ...f, open: true }))}
            onKeyDown={handleFromKeyDown}
            aria-label="Start location"
            aria-autocomplete="list"
            aria-expanded={from.open && fromSuggestions.length > 0}
          />
          {(from.value || startLocation) && (
            <button
              style={styles.clearBtn}
              onClick={clearFrom}
              aria-label="Clear start location"
            >
              ✕
            </button>
          )}
        </div>
        {from.error && <p style={styles.errorMsg}>{from.error}</p>}
        {from.open && fromSuggestions.length > 0 && (
          <ul style={styles.dropdown} role="listbox">
            {fromSuggestions.map((b) => (
              <li
                key={b.id}
                style={styles.suggestion}
                onMouseDown={() => selectFrom(b)}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLLIElement).style.background = '#F0F4FF')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLLIElement).style.background = 'transparent')
                }
                role="option"
                aria-selected={startLocation?.id === b.id}
              >
                {b.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* To field */}
      <div ref={toRef} style={styles.fieldWrapper}>
        <div style={styles.inputRow}>
          <span style={styles.icon}>🎯</span>
          <input
            className="sp-input"
            style={{
              ...styles.input,
              ...(to.error ? styles.inputError : {}),
            }}
            placeholder="To — end location"
            value={to.value}
            onChange={handleToChange}
            onFocus={() => setTo((t) => ({ ...t, open: true }))}
            onKeyDown={handleToKeyDown}
            aria-label="End location"
            aria-autocomplete="list"
            aria-expanded={to.open && toSuggestions.length > 0}
          />
          {(to.value || endLocation) && (
            <button
              style={styles.clearBtn}
              onClick={clearTo}
              aria-label="Clear end location"
            >
              ✕
            </button>
          )}
        </div>
        {to.error && <p style={styles.errorMsg}>{to.error}</p>}
        {to.open && toSuggestions.length > 0 && (
          <ul style={styles.dropdown} role="listbox">
            {toSuggestions.map((b) => (
              <li
                key={b.id}
                style={styles.suggestion}
                onMouseDown={() => selectTo(b)}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLLIElement).style.background = '#F0F4FF')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLLIElement).style.background = 'transparent')
                }
                role="option"
                aria-selected={endLocation?.id === b.id}
              >
                {b.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Go button */}
      <button style={styles.goBtn} className="sp-go-btn" onClick={handleGo} aria-label="Find route">
        Go
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    width: 'min(90vw, 380px)',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    padding: '16px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  fieldWrapper: {
    position: 'relative',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'rgba(248, 250, 252, 0.8)',
    border: '1px solid rgba(79, 124, 255, 0.2)',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'all 200ms ease',
    color: '#1a1a2e',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    fontSize: '12px',
    padding: '4px',
    flexShrink: 0,
    lineHeight: 1,
  },
  errorMsg: {
    margin: '4px 0 0 28px',
    color: '#ef4444',
    fontSize: '12px',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    listStyle: 'none',
    margin: 0,
    padding: '4px 0',
    zIndex: 200,
    overflow: 'hidden',
  },
  suggestion: {
    padding: '10px 14px',
    cursor: 'pointer',
    background: 'transparent',
    transition: 'background 100ms ease',
    fontSize: '14px',
    color: '#1a1a2e',
  },
  divider: {
    height: '1px',
    background: 'rgba(79, 124, 255, 0.1)',
    margin: '10px 0',
  },
  goBtn: {
    marginTop: '10px',
    width: '100%',
    padding: '10px',
    background: '#4F7CFF',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
};
