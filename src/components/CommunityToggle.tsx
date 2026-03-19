import { useStore } from '../store/useStore';

export default function CommunityToggle() {
  const communityLayerEnabled = useStore((s) => s.communityLayerEnabled);
  const toggleCommunityLayer = useStore((s) => s.toggleCommunityLayer);

  return (
    <button
      onClick={toggleCommunityLayer}
      style={{
        position: 'fixed',
        bottom: 100,
        right: 16,
        zIndex: 90,
        background: communityLayerEnabled
          ? '#6EE7B7'
          : 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: communityLayerEnabled ? '#065f46' : '#64748B',
        border: 'none',
        borderRadius: 999,
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 300ms ease-in-out',
      }}
    >
      🗺️ Shortcuts
    </button>
  );
}
