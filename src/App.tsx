import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import MapView from './components/MapView';
import SearchPanel from './components/SearchPanel';
import { ConstraintToggles } from './components/ConstraintToggles';
import { TimeBudgetSelector } from './components/TimeBudgetSelector';
import CommunityToggle from './components/CommunityToggle';
import RouteBottomSheet from './components/RouteBottomSheet';
import ShortcutDetailPanel from './components/ShortcutDetailPanel';
import AddShortcutScreen from './components/AddShortcutScreen';
import type { Shortcut } from './types';

function App() {
  const seedDemoData = useStore((s) => s.seedDemoData);
  const setActiveShortcut = useStore((s) => s.setActiveShortcut);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = 'PathPlan';
    seedDemoData();
    const timer = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  function handleShortcutClick(shortcut: Shortcut) {
    setActiveShortcut(shortcut);
  }

  return (
    <>
      {/* Loading splash */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: ready ? 0 : 1,
          pointerEvents: ready ? 'none' : 'auto',
          transition: 'opacity 300ms ease',
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: '#4F7CFF',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.5px',
          }}
        >
          🗺️ PathPlan
        </span>
      </div>

      {/* Main UI */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          opacity: ready ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
      >
        <MapView onShortcutClick={handleShortcutClick} />
        <SearchPanel />
        <ConstraintToggles />
        <TimeBudgetSelector />
        <CommunityToggle />
        <RouteBottomSheet />
        <ShortcutDetailPanel />
        <AddShortcutScreen />
      </div>
    </>
  );
}

export default App;
