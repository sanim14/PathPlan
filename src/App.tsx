import { useEffect } from 'react';
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

  useEffect(() => {
    document.title = 'PathPlan';
    seedDemoData();
  }, []);

  function handleShortcutClick(shortcut: Shortcut) {
    setActiveShortcut(shortcut);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <MapView onShortcutClick={handleShortcutClick} />
      <SearchPanel />
      <ConstraintToggles />
      <TimeBudgetSelector />
      <CommunityToggle />
      <RouteBottomSheet />
      <ShortcutDetailPanel />
      <AddShortcutScreen />
    </div>
  );
}

export default App;
