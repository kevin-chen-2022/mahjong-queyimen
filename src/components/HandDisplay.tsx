import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { tileToString, getMissingSuits } from '../utils/mahjong';
import type { Tile } from '../types';
import WinCombinationDisplay from './WinCombinationDisplay';
import TileIcon from './TileIcon';

export default function HandDisplay() {
  const hand = useGameStore(s => s.hand);
  const removeTile = useGameStore(s => s.removeTile);
  const selectDiscard = useGameStore(s => s.selectDiscard);
  const selectedDiscard = useGameStore(s => s.selectedDiscard);
  const analyze = useGameStore(s => s.analyze);
  const analyzeJinTing = useGameStore(s => s.analyzeJinTing);
  const analyzeUserChoice = useGameStore(s => s.analyzeUserChoice);
  const drawRandomTile = useGameStore(s => s.drawRandomTile);
  const manualDiscard = useGameStore(s => s.manualDiscard);
  const reorderHand = useGameStore(s => s.reorderHand);
  const resetHandOrder = useGameStore(s => s.resetHandOrder);
  const analysis = useGameStore(s => s.analysis);
  const lastDrawnIndex = useGameStore(s => s.lastDrawnIndex);
  const openSaveModal = useGameStore(s => s.openSaveModal);
  const toggleMarkTile = useGameStore(s => s.toggleMarkTile);
  const tilesPerRow = useGameStore(s => s.config.tilesPerRow);
  const history = useGameStore(s => s.history);
  const historyIndex = useGameStore(s => s.historyIndex);
  const undo = useGameStore(s => s.undo);
  const redo = useGameStore(s => s.redo);
  const jumpToHistory = useGameStore(s => s.jumpToHistory);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const missingSuits = getMissingSuits(hand);
  const suitLabels: Record<string, string> = { wan: '万', tong: '筒', tiao: '条' };

  const presentSuits = ['wan', 'tong', 'tiao'].filter(s => !missingSuits.includes(s as any));
  const suitLabel = presentSuits.length === 1 
    ? `清一色(${suitLabels[presentSuits[0]]})`
    : missingSuits.length === 1 
      ? `缺${suitLabels[missingSuits[0]]}`
      : '';

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    const newHand = [...hand];
    const [draggedTile] = newHand.splice(draggedIndex, 1);
    newHand.splice(targetIndex, 0, draggedTile);
    reorderHand(newHand);

    handleDragEnd();
  }, [draggedIndex, hand, reorderHand, handleDragEnd]);

  const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-amber-700 dark:text-amber-200 font-semibold text-sm md:text-base">
          手牌 ({hand.length}张)
        </h3>
        <div className="flex items-center gap-2">
          {suitLabel && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              {suitLabel}
            </span>
          )}
          {/* 历史记录控件 */}
          {history.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors"
                title="撤销"
              >
                ←
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[50px] text-center">
                第 {historyIndex + 1}/{history.length} 步
              </span>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-colors"
                title="重做"
              >
                →
              </button>
              <select
                value={historyIndex}
                onChange={e => jumpToHistory(Number(e.target.value))}
                className="px-1 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded text-xs focus:outline-none focus:border-amber-500 max-w-[120px]"
                title="历史记录列表"
              >
                {history.map((entry, i) => (
                  <option key={i} value={i}>
                    {i + 1}. {entry.action} ({entry.hand.length}张)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div
        className="flex flex-wrap min-h-[60px] p-3 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-300 dark:border-gray-700"
        onDragOver={handleDragOver}
        style={{ gap: '4px' }}
      >
        {hand.length === 0 ? (
          <span className="text-gray-400 dark:text-gray-500 text-sm">请点击上方牌型或输入手牌</span>
        ) : (
          hand.map((tile, index) => {
            const isSelected = selectedDiscard === index;
            const isRecommended = analysis?.best?.discardTile &&
              tile.suit === analysis.best.discardTile.suit &&
              tile.value === analysis.best.discardTile.value;
            const isLastDrawn = lastDrawnIndex === index;
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            // 使用百分比宽度
            const tileWidthPercent = 100 / tilesPerRow;

            return (
              <div
                key={`${tile.suit}-${tile.value}-${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                className={`
                  relative rounded-lg overflow-hidden
                  transition-all duration-150
                  ${isDragging
                    ? 'opacity-50 scale-90'
                    : isDragOver
                      ? 'ring-2 ring-dashed ring-amber-400 scale-105'
                      : isLastDrawn
                        ? 'ring-2 ring-green-400 scale-105 animate-pulse'
                        : isSelected
                          ? 'ring-2 ring-blue-400 scale-105'
                          : isRecommended
                            ? 'ring-2 ring-yellow-400 animate-pulse'
                            : 'hover:ring-2 hover:ring-amber-400'
                  }
                  cursor-grab active:cursor-grabbing select-none
                `}
                style={{ width: `calc(${tileWidthPercent}% - 4px)`, aspectRatio: '5/7' }}
              >
                <button
                  onClick={() => selectDiscard(index)}
                  className="absolute inset-0 flex items-center justify-center rounded-lg"
                  title={`${tileToString(tile)} (点击选择，拖拽排序)`}
                >
                  <TileIcon tile={tile} fill className="rounded-md w-full h-full" />
                </button>
                {isRecommended && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-yellow-500 text-black px-1 rounded font-bold">
                    推荐
                  </span>
                )}
                {isSelected && !isRecommended && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-blue-500 text-white px-1 rounded font-bold">
                    已选
                  </span>
                )}
                {isLastDrawn && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs bg-green-500 text-white px-1 rounded font-bold">
                    摸牌
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <WinCombinationDisplay />

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={openSaveModal}
          disabled={hand.length === 0}
          className="flex-1 min-w-[100px] px-4 py-3 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm md:text-base transition-all shadow-lg"
        >
          保存
        </button>
        <button
          onClick={resetHandOrder}
          disabled={hand.length === 0}
          className="flex-1 min-w-[100px] px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm md:text-base transition-all shadow-lg"
        >复原</button>
        <button
          onClick={toggleMarkTile}
          disabled={selectedDiscard === null}
          className="flex-1 min-w-[100px] px-4 py-3 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm md:text-base transition-all shadow-lg"
        >
          {selectedDiscard !== null && hand[selectedDiscard]?.marked ? '取消标注' : '标注'}
        </button>

        {/* 2/5/8/11/14张时显示舍牌相关按钮 */}
        {[2, 5, 8, 11, 14].includes(hand.length) && (
          <>
            <button
              onClick={analyze}
              disabled={false}
              className="flex-1 min-w-[120px] px-4 py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white rounded-lg font-bold text-sm md:text-base transition-all shadow-lg"
            >
              最佳舍牌
            </button>
            <button
              onClick={analyzeUserChoice}
              disabled={selectedDiscard === null}
              className="flex-1 min-w-[120px] px-4 py-3 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm md:text-base transition-all shadow-lg"
            >
              {selectedDiscard === null ? '选牌分析' : '分析选牌'}
            </button>
          </>
        )}

        {/* 1/4/7/10/13张时显示向听判断按钮 */}
        {[1, 4, 7, 10, 13].includes(hand.length) && (
          <button
            onClick={analyzeJinTing}
            className="flex-1 min-w-[120px] px-4 py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white rounded-lg font-bold text-sm md:text-base transition-all shadow-lg"
          >
            向听判断
          </button>
        )}

        {/* 补牌/删除/随机摸牌/手动舍牌 合并按钮 */}
        <button
          onClick={() => {
            if (selectedDiscard !== null) {
              if ([2, 5, 8, 11, 14].includes(hand.length)) {
                manualDiscard();
              } else {
                removeTile(selectedDiscard);
              }
            } else {
              drawRandomTile();
            }
          }}
          disabled={selectedDiscard === null && hand.length >= 14}
          className="flex-1 min-w-[120px] px-4 py-3 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm md:text-base transition-all shadow-lg"
        >
          {selectedDiscard === null
            ? (hand.length >= 14
                ? '已满'
                : [1, 4, 7, 10, 13].includes(hand.length) ? '随机摸牌' : '补牌')
            : ([2, 5, 8, 11, 14].includes(hand.length) ? '手动舍牌' : '删除')
          }
        </button>
      </div>

      <p className="text-gray-400 text-xs">
        拖拽手牌改变排列，点击选择
      </p>
    </div>
  );
}
