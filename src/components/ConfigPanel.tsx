import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

const TILES_PER_ROW_OPTIONS = [
  { value: 5, label: '5张/行' },
  { value: 6, label: '6张/行' },
  { value: 7, label: '7张/行' },
  { value: 8, label: '8张/行' },
  { value: 9, label: '9张/行' },
  { value: 10, label: '10张/行' },
  { value: 12, label: '12张/行' },
  { value: 14, label: '14张/行' },
];

export default function ConfigPanel() {
  const [open, setOpen] = useState(false);
  const config = useGameStore(s => s.config);
  const setConfig = useGameStore(s => s.setConfig);
  const theme = useGameStore(s => s.theme);
  const isDark = theme === 'dark';

  const handleChange = (tilesPerRow: number) => {
    setConfig({ tilesPerRow });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          isDark
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            : 'bg-white hover:bg-gray-100 text-amber-600 shadow border border-gray-300'
        }`}
        title="配置"
      >
        ⚙ 配置
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-amber-700 dark:text-amber-200">配置</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-lg font-bold transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  每行显示麻将数量
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TILES_PER_ROW_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleChange(opt.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        config.tilesPerRow === opt.value
                          ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      } cursor-pointer`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  当前: {config.tilesPerRow}张/行 · 手机默认7张 · 平板默认14张
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setOpen(false)}
                className="w-full px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors cursor-pointer"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
