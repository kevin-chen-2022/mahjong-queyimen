import { useGameStore } from '../store/gameStore';

type TabKey = 'select' | 'hand' | 'library';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'select', label: '选牌', icon: '🀄' },
  { key: 'hand', label: '手牌', icon: '✋' },
  { key: 'library', label: '牌组库', icon: '📚' },
];

export default function TabBar() {
  const activeTab = useGameStore(s => s.activeTab);
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const hand = useGameStore(s => s.hand);
  const isDark = useGameStore(s => s.theme) === 'dark';

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 flex border-t transition-colors ${
      isDark
        ? 'bg-gray-800/95 border-gray-700 backdrop-blur-md'
        : 'bg-white/95 border-gray-200 backdrop-blur-md'
    }`}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        const showBadge = tab.key === 'hand' && hand.length > 0;

        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors relative ${
              isActive
                ? isDark
                  ? 'text-amber-400'
                  : 'text-amber-600'
                : isDark
                  ? 'text-gray-500 hover:text-gray-300'
                  : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
            {showBadge && (
              <span className={`absolute top-1.5 right-1/2 translate-x-4 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                isActive
                  ? 'bg-amber-500 text-white'
                  : isDark
                    ? 'bg-gray-600 text-gray-200'
                    : 'bg-gray-300 text-gray-600'
              }`}>
                {hand.length}
              </span>
            )}
            {isActive && (
              <span className={`absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full ${
                isDark ? 'bg-amber-400' : 'bg-amber-600'
              }`} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
