import type { Tile, Suit } from '../types';
import { useGameStore } from '../store/gameStore';
import TileIcon from './TileIcon';

const SUITS: { key: Suit; label: string }[] = [
  { key: 'wan', label: '万' },
  { key: 'tong', label: '筒' },
  { key: 'tiao', label: '条' },
];

function TileButton({ suit, value }: { suit: Suit; value: number }) {
  const addTile = useGameStore(s => s.addTile);
  const removeTileByValue = useGameStore(s => s.removeTileByValue);
  const hand = useGameStore(s => s.hand);

  const tile: Tile = { suit, value };
  const countInHand = hand.filter(t => t.suit === suit && t.value === value).length;
  const disabled = countInHand >= 4;

  // 用相对定位容器包裹按钮和角标，角标在按钮外部，不受 disabled 影响
  return (
    <div className="relative w-full">
      <button
        onClick={() => addTile(tile)}
        disabled={disabled}
        className={`
          rounded-lg border-2 shadow-md
          flex items-center justify-center
          transition-all duration-150 w-full
          aspect-[5/7]
          ${disabled
            ? 'bg-gray-200 border-gray-400 opacity-40 cursor-not-allowed'
            : 'bg-white border-amber-700 hover:border-amber-500 hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer'
          }
        `}
      >
        <TileIcon tile={tile} fill highlighted={countInHand > 0} className="rounded w-full h-full" />
      </button>
      {countInHand > 0 && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            removeTileByValue(tile);
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md cursor-pointer z-10"
          title="减少一张"
        >
          {countInHand}
        </span>
      )}
    </div>
  );
}

export default function TileSelector() {
  const tilesPerRow = useGameStore(s => s.config.tilesPerRow);
  const confirmSelection = useGameStore(s => s.confirmSelection);
  const clearHand = useGameStore(s => s.clearHand);
  const hand = useGameStore(s => s.hand);

  // 使用百分比宽度：每张牌占 (100% / tilesPerRow) 的宽度
  const tileWidthPercent = 100 / tilesPerRow;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-amber-700 dark:text-amber-200 font-semibold text-sm md:text-base">选牌操作区</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
            点击牌面选择一次，点击角标撤销一次选择
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={confirmSelection}
            disabled={hand.length === 0}
            className="relative px-4 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm md:text-base transition-all shadow-lg"
          >
            确定选牌
            {hand.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                {hand.length}
              </span>
            )}
          </button>
          <button
            onClick={clearHand}
            disabled={hand.length === 0}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm md:text-base transition-all shadow-lg"
          >
            清空选择
          </button>
        </div>
      </div>
      {SUITS.map(suit => (
        <div key={suit.key} className="flex items-center gap-1 md:gap-2">
          <span className="w-6 md:w-8 text-center font-bold text-amber-700 dark:text-amber-200 flex-shrink-0">
            {suit.label}
          </span>
          <div className="flex gap-1 flex-wrap flex-1">
            {Array.from({ length: 9 }, (_, i) => i + 1).map(v => (
              <div
                key={v}
                style={{ width: `calc(${tileWidthPercent}% - 4px)` }}
                className="flex-shrink-0"
              >
                <TileButton suit={suit.key} value={v} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
