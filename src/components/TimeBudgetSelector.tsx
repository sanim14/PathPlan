import { useStore } from '../store/useStore';
import { TimeBudget } from '../types';

const BUDGETS: TimeBudget[] = [5, 10, 15];

export function TimeBudgetSelector() {
  const timeBudget = useStore((s) => s.timeBudget);
  const setTimeBudget = useStore((s) => s.setTimeBudget);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 160,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 999,
        padding: 4,
        display: 'flex',
        gap: 4,
      }}
    >
      {BUDGETS.map((budget) => {
        const active = timeBudget === budget;
        return (
          <button
            key={budget}
            onClick={() => setTimeBudget(budget)}
            style={{
              padding: '6px 16px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              background: active ? '#4F7CFF' : 'transparent',
              color: active ? '#fff' : '#64748B',
              transition: 'all 200ms ease',
            }}
          >
            {budget} min
          </button>
        );
      })}
    </div>
  );
}
