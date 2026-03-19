import { useStore } from '../store/useStore';
import { Constraint } from '../types';

interface ToggleItem {
  constraint: Constraint;
  icon: string;
  label: string;
}

const TOGGLES: ToggleItem[] = [
  { constraint: 'fastest', icon: '⚡', label: 'Fastest' },
  { constraint: 'accessibility', icon: '♿', label: 'No Stairs' },
  { constraint: 'safety', icon: '🌙', label: 'Night Safe' },
  { constraint: 'low-crowd', icon: '👥', label: 'Low Crowd' },
];

export function ConstraintToggles() {
  const constraints = useStore((s) => s.constraints);
  const setConstraint = useStore((s) => s.setConstraint);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 200,
        right: 16,
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {TOGGLES.map(({ constraint, icon, label }) => {
        const active = constraints.includes(constraint);
        return (
          <div
            key={constraint}
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 16,
              padding: '10px 14px',
              boxShadow: active
                ? '0 4px 16px rgba(0,0,0,0.1), 0 0 0 3px rgba(79,124,255,0.2)'
                : '0 4px 16px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 140,
              transition: 'box-shadow 200ms ease',
            }}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 500,
                color: '#1e293b',
              }}
            >
              {label}
            </span>
            <ToggleSwitch
              active={active}
              onChange={(val) => setConstraint(constraint, val)}
            />
          </div>
        );
      })}
    </div>
  );
}

interface ToggleSwitchProps {
  active: boolean;
  onChange: (value: boolean) => void;
}

function ToggleSwitch({ active, onChange }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={active}
      onClick={() => onChange(!active)}
      style={{
        position: 'relative',
        width: 40,
        height: 22,
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        background: active ? '#4F7CFF' : '#e2e8f0',
        transition: 'background 250ms ease-in-out',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: active ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </button>
  );
}
