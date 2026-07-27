import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import TileSelector from './components/TileSelector';
import InputControls, { QuickActions } from './components/InputControls';
import HandDisplay from './components/HandDisplay';
import AnalysisPanel from './components/AnalysisPanel';
import ConfigPanel from './components/ConfigPanel';
import TabBar from './components/TabBar';
import HandLibraryModal from './components/HandLibraryModal';
import HelpModal from './components/HelpModal';

function App() {
  const theme = useGameStore(s => s.theme);
  const toggleTheme = useGameStore(s => s.toggleTheme);
  const activeTab = useGameStore(s => s.activeTab);
  const config = useGameStore(s => s.config);
  const setConfig = useGameStore(s => s.setConfig);
  const openHelpModal = useGameStore(s => s.openHelpModal);

  const isDark = theme === 'dark';

  useEffect(() => {
    const getRecommendedTilesPerRow = (width: number): number => {
      if (width >= 1024) return 10;
      if (width >= 768) return 9;
      return 7;
    };

    const handleResize = () => {
      const recommended = getRecommendedTilesPerRow(window.innerWidth);
      if (config.tilesPerRow !== recommended) {
        setConfig({ tilesPerRow: recommended });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [config.tilesPerRow, setConfig]);

  const sectionClass = `backdrop-blur-sm rounded-2xl p-4 md:p-6 border shadow-xl transition-colors ${
    isDark
      ? 'bg-gray-800/40 border-gray-700/50'
      : 'bg-white/80 border-gray-200'
  }`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark' : ''} ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-[#1a1a2e] to-gray-900 text-white'
        : 'bg-gradient-to-br from-gray-100 via-blue-50 to-gray-100 text-gray-900'
    }`}>
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-6 pb-20">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-center text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500">
            成都麻将 · 缺一门
          </h1>
          <div className="flex items-center justify-between">
            <ConfigPanel />
            <button
              onClick={openHelpModal}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-blue-300'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
              }`}
              title="使用说明"
            >
              使用说明
            </button>
            <button
              onClick={toggleTheme}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300'
                  : 'bg-white hover:bg-gray-100 text-amber-600 shadow border border-gray-300'
              }`}
              title="切换明暗主题"
            >
              {isDark ? '☀ 浅色' : '🌙 深色'}
            </button>
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'select' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className={sectionClass}>
              <TileSelector />
            </section>
            <section className={sectionClass}>
              <InputControls />
            </section>
          </div>
        )}

        {activeTab === 'hand' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className={sectionClass}>
              <QuickActions />
            </section>
            <section className={sectionClass}>
              <HandDisplay />
            </section>
            <section className={sectionClass}>
              <AnalysisPanel />
            </section>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <section className={sectionClass}>
              <HandLibraryModal />
            </section>
          </div>
        )}

        {/* Footer */}
        <footer className={`text-center text-xs py-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          成都麻将缺一门舍牌训练工具
        </footer>
      </div>

      {/* Bottom Tab Bar */}
      <TabBar />

      {/* 牌组库弹窗（从手牌页"保存"按钮触发，仅在非牌组库标签页时显示） */}
      {activeTab !== 'library' && <HandLibraryModal />}
      
      {/* 使用说明弹窗 */}
      <HelpModal />
    </div>
  );
}

export default App;
