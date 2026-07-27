import { useMemo, useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { parseHandInput } from '../utils/mahjong';
import { loadAllRecords, filterRecords, searchRecordsByDescription, databaseExists, copyToClipboard, readFromClipboard } from '../utils/storage';
import type { HandLengthFilter, Tile } from '../types';
import TileIcon from './TileIcon';

// 文本转可视化麻将牌（根据牌数动态缩放，一行内最大化显示）
function HandTextDisplay({ handText }: { handText: string }) {
  const tiles = useMemo<Tile[]>(() => {
    const parsed = parseHandInput(handText);
    return parsed ?? [];
  }, [handText]);

  if (tiles.length === 0) {
    return <span className="text-gray-500 text-sm">（无牌组数据）</span>;
  }

  const n = tiles.length;
  const gapPx = 4;
  const tileWidthPercent = 100 / n;
  const gapDeduct = ((n - 1) * gapPx) / n;

  return (
    <div className="flex" style={{ gap: `${gapPx}px` }}>
      {tiles.map((t, i) => (
        <div
          key={i}
          style={{ width: `calc(${tileWidthPercent}% - ${gapDeduct}px)`, aspectRatio: '5/7' }}
        >
          <TileIcon tile={t} fill className="rounded w-full h-full" />
        </div>
      ))}
    </div>
  );
}

const FILTER_OPTIONS: { value: HandLengthFilter; label: string }[] = [
  { value: 'all', label: '全部显示' },
  { value: 5, label: '5牌组合' },
  { value: 6, label: '6牌组合' },
  { value: 7, label: '7牌组合' },
  { value: 8, label: '8牌组合' },
  { value: 9, label: '9牌组合' },
  { value: 10, label: '10牌组合' },
  { value: 11, label: '11牌组合' },
  { value: 12, label: '12牌组合' },
  { value: 13, label: '13牌组合' },
];

export default function HandLibraryModal() {
  const open = useGameStore(s => s.libraryModalOpen);
  const mode = useGameStore(s => s.libraryModalMode);
  const handText = useGameStore(s => s.libraryHandText);
  const description = useGameStore(s => s.libraryDescription);
  const browseIndex = useGameStore(s => s.libraryBrowseIndex);
  const filter = useGameStore(s => s.libraryFilter);
  const searchText = useGameStore(s => s.librarySearchText);
  const editingId = useGameStore(s => s.libraryEditingId);
  const error = useGameStore(s => s.libraryError);
  const activeTab = useGameStore(s => s.activeTab);

  const closeLibraryModal = useGameStore(s => s.closeLibraryModal);
  const setLibraryHandText = useGameStore(s => s.setLibraryHandText);
  const setLibraryDescription = useGameStore(s => s.setLibraryDescription);
  const switchToEdit = useGameStore(s => s.switchToEdit);
  const switchToBrowse = useGameStore(s => s.switchToBrowse);
  const setLibraryFilter = useGameStore(s => s.setLibraryFilter);
  const setLibrarySearchText = useGameStore(s => s.setLibrarySearchText);
  const setLibraryBrowseIndex = useGameStore(s => s.setLibraryBrowseIndex);
  const libraryGoPrev = useGameStore(s => s.libraryGoPrev);
  const libraryGoNext = useGameStore(s => s.libraryGoNext);
  const confirmAddRecord = useGameStore(s => s.confirmAddRecord);
  const confirmUpdateRecord = useGameStore(s => s.confirmUpdateRecord);
  const libraryDeleteCurrent = useGameStore(s => s.libraryDeleteCurrent);
  const libraryLoadToHand = useGameStore(s => s.libraryLoadToHand);
  const setActiveTab = useGameStore(s => s.setActiveTab);
  const libraryExportAll = useGameStore(s => s.libraryExportAll);
  const libraryImportAll = useGameStore(s => s.libraryImportAll);
  const libraryExportCurrent = useGameStore(s => s.libraryExportCurrent);
  const libraryImportSingle = useGameStore(s => s.libraryImportSingle);

  // 判断是否为内嵌模式（牌组库标签页中）
  const isEmbedded = activeTab === 'library';
  // 在内嵌模式下始终显示，在弹窗模式下仅在 open 时显示
  const shouldRender = isEmbedded || open;

  // 浏览模式下计算当前筛选后的记录数
  const filteredCount = useMemo(() => {
    if (!shouldRender) return 0;
    const all = loadAllRecords();
    let filtered = filterRecords(all, filter);
    filtered = searchRecordsByDescription(filtered, searchText);
    return filtered.length;
  }, [shouldRender, filter, searchText, mode, handText, description, browseIndex, editingId]);

  // 注意：所有 Hook 必须在早期返回之前调用，否则会触发 React Hooks 顺序错误
  // 导出当前单条记录到剪贴板（三层降级）相关状态
  const [exportText, setExportText] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  // 从剪贴板导入单条记录（三层降级）相关状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const importTextareaRef = useRef<HTMLTextAreaElement>(null);

  if (!shouldRender) return null;

  const titleMap: Record<typeof mode, string> = {
    add: '增添全新牌组',
    edit: '修改已有牌组',
    browse: '浏览牌组',
  };
  const title = titleMap[mode];

  // 判断"转入浏览"按钮是否可用：数据库存在且数量>0
  const browseAvailable = databaseExists() && loadAllRecords().length > 0;

  // 判断当前是否可编辑（add/edit 模式下文字说明区为可编辑，browse 模式下为只读）
  const isEditing = mode === 'add' || mode === 'edit';

  // 关闭按钮逻辑：
  // - 内嵌模式 + edit 模式：退出修改，回到浏览模式（不跳转标签）
  // - 内嵌模式 + 非 edit 模式：返回手牌标签
  // - 弹窗模式（仅 add）：关闭弹窗并返回手牌标签
  const handleClose = () => {
    if (isEmbedded) {
      if (mode === 'edit') {
        switchToBrowse();
      } else {
        setActiveTab('hand');
      }
    } else {
      closeLibraryModal();
    }
  };

  // 导出整个数据库为文件
  const handleExportAll = () => {
    const jsonStr = libraryExportAll();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `麻将牌组库_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 从文件导入整个数据库
  const handleImportAll = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        const result = libraryImportAll(text);
        if (result.success === 0) {
          // 错误已在 store 中设置
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportSingle = async () => {
    const jsonStr = libraryExportCurrent();
    if (!jsonStr) return;
    const ok = await copyToClipboard(jsonStr);
    if (!ok) {
      setExportText(jsonStr);
      setShowExportModal(true);
    } else {
      useGameStore.setState({ libraryError: '已复制到剪贴板' });
      setTimeout(() => useGameStore.setState({ libraryError: null }), 1500);
    }
  };

  const handleImportSingle = async () => {
    const text = await readFromClipboard();
    if (text) {
      libraryImportSingle(text);
    } else {
      setImportText('');
      setShowImportModal(true);
    }
  };

  const handleConfirmImport = () => {
    if (!importText.trim()) return;
    libraryImportSingle(importText.trim());
    setShowImportModal(false);
    setImportText('');
  };

  // 弹窗模式使用全屏覆盖，内嵌模式使用普通容器
  const containerClass = isEmbedded
    ? 'w-full'
    : 'fixed inset-0 z-[1000] bg-gray-100 dark:bg-gray-900 animate-in fade-in duration-200';

  return (
    <div className={containerClass}>
      <div className={`relative w-full ${isEmbedded ? '' : 'h-full overflow-y-auto'}`}>
        {/* 关闭按钮（浏览模式下隐藏，用户可通过底部标签页返回） */}
        {mode !== 'browse' && (
          <button
            onClick={handleClose}
            className={`${isEmbedded ? 'absolute top-2 right-2' : 'fixed top-4 right-4'} z-50 w-10 h-10 flex items-center justify-center rounded-full bg-gray-500/80 hover:bg-red-600 text-white text-xl font-bold transition-colors shadow-lg cursor-pointer`}
            title="关闭"
          >×</button>
        )}

        <div className={`w-full max-w-3xl mx-auto p-4 space-y-3 ${isEmbedded ? '' : 'min-h-full flex flex-col justify-center py-8'}`}>
          {/* 1. 标题栏 */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900 dark:text-white">{title}</span>
            </div>
            {mode === 'browse' && (
              <div className="flex gap-2">
                <button
                  onClick={handleImportAll}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                  title="从文件导入牌组库"
                >
                  导入
                </button>
                <button
                  onClick={handleExportAll}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors"
                  title="导出整个牌组库为文件"
                >
                  导出
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 dark:bg-red-900/40 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* 2. 麻将牌组显示区 */}
          <div className="space-y-2">
            <label className="text-gray-600 dark:text-gray-400 text-xs">麻将牌组</label>
            <div className="p-3 bg-white dark:bg-gray-800/60 rounded-lg border border-gray-300 dark:border-gray-700 min-h-[60px]">
              <HandTextDisplay handText={handText} />
            </div>
          </div>

          {/* 3. 文字说明区 */}
          <div className="space-y-2">
            <label className="text-gray-600 dark:text-gray-400 text-xs">文字说明</label>
            <textarea
              value={description}
              onChange={e => setLibraryDescription(e.target.value)}
              readOnly={!isEditing}
              placeholder={isEditing ? '请输入牌组的说明文字（可选）' : '（浏览模式下只读）'}
              className={`w-full px-3 py-2 rounded-lg border text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 text-sm resize-y min-h-[80px] ${
                isEditing
                  ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  : 'bg-gray-100 dark:bg-gray-800/40 border-gray-300 dark:border-gray-700 cursor-not-allowed'
              }`}
            />
          </div>

          {/* 4. 功能按钮区 */}
          <div className="pt-3 border-t border-gray-300 dark:border-gray-700 space-y-3">
            {/* 模式对应按钮集合 */}
            {mode === 'add' && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    switchToBrowse();
                    useGameStore.setState({ libraryModalOpen: false });
                    setActiveTab('library');
                  }}
                  disabled={!browseAvailable}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  转入浏览
                </button>
                <button
                  onClick={confirmAddRecord}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  确认增加
                </button>
              </div>
            )}

            {mode === 'edit' && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={confirmUpdateRecord}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  确认修改
                </button>
              </div>
            )}

            {mode === 'browse' && (
              <div className="space-y-3">
                {/* 常规操作按钮 */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={libraryLoadToHand}
                    disabled={!editingId}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >手牌</button>
                  <button
                    onClick={switchToEdit}
                    disabled={!editingId}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    修改
                  </button>
                  <button
                    onClick={libraryDeleteCurrent}
                    disabled={!editingId}
                    className="px-4 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    删除
                  </button>
                  <button
                    onClick={handleImportSingle}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                    title="从剪贴板导入单条牌组"
                  >
                    粘贴
                  </button>
                  <button
                    onClick={handleExportSingle}
                    disabled={!editingId}
                    className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    title="导出当前牌组到剪贴板"
                  >
                    复制
                  </button>
                </div>

                {/* 筛选下拉框 */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-gray-600 dark:text-gray-400 text-xs">筛选:</span>
                  <select
                    value={String(filter)}
                    onChange={e => {
                      const v = e.target.value;
                      setLibraryFilter(v === 'all' ? 'all' : (Number(v) as HandLengthFilter));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    {FILTER_OPTIONS.map(opt => (
                      <option key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-600 dark:text-gray-400 text-xs">搜索:</span>
                  <input
                    type="text"
                    value={searchText}
                    onChange={e => setLibrarySearchText(e.target.value)}
                    placeholder="输入描述关键词..."
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                {/* slider + 前进/后退 */}
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={libraryGoPrev}
                    disabled={browseIndex <= 0}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    后退
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, filteredCount - 1)}
                    value={browseIndex}
                    onChange={e => setLibraryBrowseIndex(Number(e.target.value))}
                    disabled={filteredCount <= 1}
                    className="flex-1 min-w-[200px] accent-amber-500 disabled:opacity-40"
                  />
                  <button
                    onClick={libraryGoNext}
                    disabled={browseIndex >= filteredCount - 1}
                    className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    前进
                  </button>
                  <span className="text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">
                    {filteredCount > 0 ? `${browseIndex + 1} / ${filteredCount}` : '0 / 0'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 导入兜底弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 z-[3000] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-700 dark:text-amber-200">粘贴牌组数据</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              请将牌组 JSON 数据粘贴到下方文本框中，然后点击确认导入。
            </p>
            <textarea
              ref={importTextareaRef}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder='{"id":"xxx","handText":"w123t456","description":"牌组说明"}'
              className="w-full h-32 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowImportModal(false); setImportText(''); }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!importText.trim()}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导出兜底弹窗 */}
      {showExportModal && (
        <div className="fixed inset-0 z-[3000] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-700 dark:text-amber-200">复制牌组数据</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              请手动选中并复制下方文本：
            </p>
            <textarea
              readOnly
              value={exportText}
              className="w-full h-32 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm focus:outline-none resize-none"
              onClick={e => (e.target as HTMLTextAreaElement).select()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                关闭
              </button>
              <button
                onClick={async () => {
                  const ok = await copyToClipboard(exportText);
                  if (ok) setShowExportModal(false);
                }}
                className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                复制
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
