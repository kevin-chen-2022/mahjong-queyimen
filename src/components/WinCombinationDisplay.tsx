import { useGameStore } from '../store/gameStore';
import type { Meld } from '../types';
import TileIcon from './TileIcon';

// 单张麻将牌的视觉展示
function TileBadge({ tile, highlight = false }: { tile: import('../types').Tile; highlight?: boolean }) {
  return (
    <div className={highlight ? 'ring-2 ring-amber-400 rounded' : ''}>
      <TileIcon tile={tile} width={28} className="rounded" />
    </div>
  );
}

// 单个面子/对子的展示
function MeldDisplay({ meld, isPair = false }: { meld: Meld; isPair?: boolean }) {
  const label =
    meld.type === 'shunzi' ? '顺子' :
    meld.type === 'kezi' ? '刻子' : '对子';
  const borderColor = isPair
    ? 'border-amber-400/70 bg-amber-100/50 dark:bg-amber-900/20'
    : 'border-gray-300/70 dark:border-gray-600/70 bg-gray-100/60 dark:bg-gray-800/40';
  return (
    <div className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border ${borderColor}`}>
      <div className="flex gap-0.5">
        {meld.tiles.map((t, i) => (
          <TileBadge key={i} tile={t} highlight={isPair} />
        ))}
      </div>
      <span className={`text-[10px] ${isPair ? 'text-amber-700 dark:text-amber-300' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
    </div>
  );
}

// 一组完整胡牌解法
function CombinationItem({ combo, index }: { combo: { pair: Meld; melds: Meld[] }; index: number }) {
  return (
    <div className="rounded-xl p-3 bg-white/60 dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-700/60 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 dark:text-gray-400">解法 {index + 1}</span>
        <span className="text-[10px] text-gray-500 dark:text-gray-500">4面子 + 1对子</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {combo.melds.map((m, i) => (
          <MeldDisplay key={i} meld={m} />
        ))}
        <div className="mx-1 text-gray-400 dark:text-gray-500 self-center">+</div>
        <MeldDisplay meld={combo.pair} isPair />
      </div>
    </div>
  );
}

export default function WinCombinationDisplay() {
  const winCombinations = useGameStore(s => s.winCombinations);
  const showWinCombinations = useGameStore(s => s.showWinCombinations);
  const clearWinCombinations = useGameStore(s => s.clearWinCombinations);

  if (!showWinCombinations) return null;

  return (
    <div className="relative rounded-xl p-4 space-y-3 bg-gradient-to-br from-purple-100 to-indigo-50 border-2 border-purple-300 dark:from-purple-900/50 dark:to-indigo-900/40 dark:border-purple-500/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <button
        onClick={clearWinCombinations}
        className="absolute top-2 right-2 z-50 w-7 h-7 flex items-center justify-center rounded-full bg-gray-500/80 hover:bg-red-600 text-white text-sm font-bold transition-colors shadow-lg cursor-pointer"
        title="关闭"
      >
        ×
      </button>

      <h4 className="font-bold text-purple-800 dark:text-purple-200 text-sm md:text-base flex items-center gap-2">
        <span className="text-lg">🀄</span>
        胡牌组合
      </h4>

      {winCombinations.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-xs">暂无胡牌组合</p>
      ) : (
        <>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            共 {winCombinations.length} 种解法（对子以高亮标识）
          </p>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {winCombinations.map((combo, i) => (
              <CombinationItem key={i} combo={combo} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
