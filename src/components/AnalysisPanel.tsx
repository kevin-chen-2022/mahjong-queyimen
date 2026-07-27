import { useGameStore } from '../store/gameStore';
import { tileToString } from '../utils/mahjong';
import type { AnalysisResult, TingPaiInfo } from '../types';
import TileIcon from './TileIcon';

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 z-50 w-7 h-7 flex items-center justify-center rounded-full bg-gray-500/80 hover:bg-red-600 text-white text-sm font-bold transition-colors shadow-lg cursor-pointer"
      title="关闭"
    >
      ×
    </button>
  );
}

function JinTingLabel({ level }: { level: number }) {
  if (level === 0) return <span className="text-red-600 dark:text-red-400 font-bold">听牌</span>;
  if (level === 1) return <span className="text-orange-600 dark:text-orange-400 font-bold">一进听</span>;
  if (level === 2) return <span className="text-yellow-600 dark:text-yellow-400 font-bold">二进听</span>;
  if (level === 3) return <span className="text-green-600 dark:text-green-400 font-bold">三进听</span>;
  if (level === 4) return <span className="text-blue-600 dark:text-blue-400 font-bold">四进听</span>;
  return <span className="text-gray-500 dark:text-gray-400">{level}进听</span>;
}

function AnalysisCard({ title, result, highlight = false, userChoice = false, onClose }: {
  title: string;
  result: AnalysisResult | null;
  highlight?: boolean;
  userChoice?: boolean;
  onClose?: () => void;
}) {
  if (!result) return null;

  const suitOrder = { wan: 0, tong: 1, tiao: 2 };
  const sortedJinZhang = [...result.jinZhang].sort((a, b) => {
    if (suitOrder[a.tile.suit] !== suitOrder[b.tile.suit]) {
      return suitOrder[a.tile.suit] - suitOrder[b.tile.suit];
    }
    return a.tile.value - b.tile.value;
  });

  const containerClass = highlight
    ? 'bg-gradient-to-br from-amber-100 to-amber-50 border-2 border-amber-300 dark:from-amber-900/60 dark:to-amber-800/40 dark:border-amber-500/60'
    : userChoice
      ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-300 dark:from-blue-900/60 dark:to-blue-800/40 dark:border-blue-500/60'
      : 'bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700';

  const titleClass = highlight
    ? 'text-amber-800 dark:text-amber-200'
    : userChoice
      ? 'text-blue-800 dark:text-blue-200'
      : 'text-amber-800 dark:text-amber-200';

  return (
    <div className={`relative rounded-xl p-4 space-y-3 ${containerClass}`}>
      {onClose && <CloseButton onClick={onClose} />}
      <h4 className={`font-bold text-sm md:text-base ${titleClass}`}>{title}</h4>

      <div className="space-y-2">
        {result.discardTile && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">打出:</span>
            <TileIcon tile={result.discardTile} width={28} className="rounded" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">状态:</span>
          <JinTingLabel level={result.jinTing} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">进张:</span>
          <span className="text-gray-900 dark:text-white font-medium text-sm">
            {result.jinZhangMen}门 {result.jinZhangMian}面 {result.jinZhangCount}张
          </span>
        </div>
      </div>

      {sortedJinZhang.length > 0 && (
        <div className="space-y-2">
          <span className="text-gray-500 dark:text-gray-400 text-xs">进张详情:</span>
          <div className="flex flex-wrap gap-1.5">
            {sortedJinZhang.map((w, i) => (
              <span
                key={i}
                className="inline-flex flex-col items-center gap-0.5 px-1.5 py-1 bg-white/80 dark:bg-gray-700/80 rounded text-xs text-gray-900 dark:text-white"
              >
                <TileIcon tile={w.tile} width={22} className="rounded" />
                <span className="text-gray-500 dark:text-gray-400">×{w.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {result.jinZhang.length === 0 && result.jinTing > 0 && (
        <p className="text-gray-500 text-xs">暂无有效进张</p>
      )}
    </div>
  );
}

function TingPaiCard({ info }: { info: TingPaiInfo }) {
  const showWinCombosForTile = useGameStore(s => s.showWinCombosForTile);
  const clearTingPaiInfo = useGameStore(s => s.clearTingPaiInfo);
  const suitOrder = { wan: 0, tong: 1, tiao: 2 };
  const sortedJinZhang = [...info.jinZhang].sort((a, b) => {
    if (suitOrder[a.tile.suit] !== suitOrder[b.tile.suit]) {
      return suitOrder[a.tile.suit] - suitOrder[b.tile.suit];
    }
    return a.tile.value - b.tile.value;
  });

  return (
    <div className="relative rounded-xl p-4 space-y-3 bg-gradient-to-br from-emerald-100 to-emerald-50 border-2 border-emerald-300 dark:from-emerald-900/60 dark:to-emerald-800/40 dark:border-emerald-500/60 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CloseButton onClick={clearTingPaiInfo} />
      <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm md:text-base flex items-center gap-2">
        <span className="text-lg">🎉</span>
        恭喜，已经听牌！
      </h4>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">状态:</span>
          <span className="text-red-600 dark:text-red-400 font-bold">听牌</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">听牌:</span>
          <span className="text-gray-900 dark:text-white font-medium text-sm">
            {info.jinZhangMen}门 {info.jinZhangMian}面 {info.jinZhangCount}张
          </span>
        </div>
      </div>

      {sortedJinZhang.length > 0 && (
        <div className="space-y-2">
          <span className="text-gray-500 dark:text-gray-400 text-xs">胡牌详情（点击查看胡牌组合）:</span>
          <div className="flex flex-wrap gap-1.5">
            {sortedJinZhang.map((w, i) => (
              <button
                key={i}
                onClick={() => showWinCombosForTile(w.tile)}
                title="点击查看胡牌组合"
                className="inline-flex flex-col items-center gap-0.5 px-1.5 py-1 bg-white/80 dark:bg-gray-700/80 hover:bg-emerald-200 dark:hover:bg-emerald-700/80 rounded text-xs text-gray-900 dark:text-white cursor-pointer transition-colors"
              >
                <TileIcon tile={w.tile} width={24} className="rounded" />
                <span className="text-gray-500 dark:text-gray-300">×{w.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalysisPanel() {
  const analysis = useGameStore(s => s.analysis);
  const userAnalysis = useGameStore(s => s.userAnalysis);
  const tingPaiInfo = useGameStore(s => s.tingPaiInfo);
  const error = useGameStore(s => s.error);
  const clearAnalysis = useGameStore(s => s.clearAnalysis);
  const clearUserAnalysis = useGameStore(s => s.clearUserAnalysis);
  const manualDiscardBest = useGameStore(s => s.manualDiscardBest);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {tingPaiInfo && <TingPaiCard info={tingPaiInfo} />}

      <div className="space-y-4">
        {(analysis || userAnalysis) && (
          <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
            <span className="text-gray-500 dark:text-gray-400 text-xs">💡 提示：点击手牌选择，然后点击"分析选牌"查看效果</span>
          </div>
        )}

        {analysis && (
          <div className="relative space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CloseButton onClick={clearAnalysis} />
            <AnalysisCard
              title={analysis.best.discardTile ? '最佳舍牌推荐' : '当前手牌进听状态'}
              result={analysis.best}
              highlight
            />

            {userAnalysis && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <AnalysisCard
                  title="你的选择分析"
                  result={userAnalysis}
                  userChoice
                  onClose={clearUserAnalysis}
                />
              </div>
            )}

            {analysis.all.length > 1 && (
              <div className="space-y-2">
                <h4 className="text-amber-800/80 dark:text-amber-200/80 font-semibold text-sm">
                  其他舍牌方案
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.all.slice(1).map((res, i) => (
                    <AnalysisCard
                      key={i}
                      title={`方案 ${i + 2}`}
                      result={res}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {userAnalysis && !analysis && (
          <div className="space-y-4">
            {manualDiscardBest && (
              <div className="p-4 bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-300 dark:from-green-900/60 dark:to-green-800/40 dark:border-green-500/60 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h4 className="font-bold text-green-800 dark:text-green-200 text-sm md:text-base flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  恭喜！你的选择是最佳舍牌！
                </h4>
                <p className="text-gray-700 dark:text-gray-300 text-xs mt-1">
                  你的舍牌决策完全正确，这是当前手牌的最优选择。
                </p>
              </div>
            )}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AnalysisCard
                title="你的选择分析"
                result={userAnalysis}
                userChoice
                onClose={clearUserAnalysis}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
