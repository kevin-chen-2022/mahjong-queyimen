import { create } from 'zustand';
import type { Tile, AnalysisResult, BestDiscardResult, TingPaiInfo, WinCombination, LibraryModalMode, HandLengthFilter, HandRecord } from '../types';
import {
  sortTiles,
  parseHandInput,
  generateRandomHand,
  generateRandomDrawTile,
  generateTingPaiHand,
  generateJinTingHand,
  analyzeAllDiscards,
  analyzeDiscard,
  isValidQueYiMen,
  tileKey,
  getTingPaiInfo,
  findWinCombinations,
  handToText,
  calcJinTing,
  calcJinZhang,
  isWinningHand,
} from '../utils/mahjong';
import {
  loadAllRecords,
  findRecordByText,
  databaseExists,
  filterRecords,
  searchRecordsByDescription,
  addRecord,
  updateRecord,
  deleteRecord,
  exportDatabase,
  importDatabase,
  exportSingleRecord,
  importSingleRecord,
} from '../utils/storage';

interface Config {
  tilesPerRow: number;
}

type TabKey = 'select' | 'hand' | 'library';

interface GameState {
  hand: Tile[];
  selectedDiscard: number | null;
  analysis: BestDiscardResult | null;
  userAnalysis: AnalysisResult | null;
  tingPaiInfo: TingPaiInfo | null;
  lastDrawnIndex: number | null;
  error: string | null;
  winCombinations: WinCombination[];
  showWinCombinations: boolean;
  // 标记：手动舍牌且为最佳舍牌（用于显示恭喜卡片）
  manualDiscardBest: boolean;

  // 标签页
  activeTab: TabKey;

  // 历史记录
  history: HistoryEntry[];
  historyIndex: number;  // 当前位置，-1表示无历史

  // 牌组库弹窗相关状态
  libraryModalOpen: boolean;
  helpModalOpen: boolean;
  libraryModalMode: LibraryModalMode;       // add | edit | browse
  libraryHandText: string;                   // 弹窗中牌组显示区的文本
  libraryDescription: string;                // 弹窗中文字说明区文本
  libraryEditingId: string | null;           // 编辑模式下当前编辑的记录ID
  libraryBrowseIndex: number;                // 浏览模式下当前索引
  libraryFilter: HandLengthFilter;           // 浏览筛选条件
  librarySearchText: string;                 // 描述文本搜索关键词
  libraryLoadedOnce: boolean;                // 牌组库是否已首次加载过
  libraryError: string | null;               // 牌组库专属错误信息（独立于手牌 error）

  // 主题
  theme: 'dark' | 'light';

  // 配置
  config: Config;

  // N面听牌select的用户选择（持久化，避免切换标签页时重置为"随机"）
  tingSides: 'random' | number;

  // actions
  addTile: (tile: Tile) => void;
  confirmSelection: () => void;
  removeTile: (index: number) => void;
  removeTileByValue: (tile: Tile) => void;
  clearHand: () => void;
  setHand: (tiles: Tile[]) => void;
  parseInput: (input: string) => boolean;
  generateRandom: (count: number) => void;
  generateTingPai: (targetSides: 'random' | number) => void;
  generateJinTing: (targetJinTing: number) => void;
  selectDiscard: (index: number) => void;
  analyzeUserChoice: () => void;
  clearUserAnalysis: () => void;
  clearAnalysis: () => void;
  clearTingPaiInfo: () => void;
  analyze: () => void;
  analyzeJinTing: () => void;
  drawRandomTile: () => void;
  manualDiscard: () => void;
  reorderHand: (tiles: Tile[]) => void;
  resetHandOrder: () => void;
  toggleMarkTile: () => void;
  showWinCombosForTile: (tile: Tile) => void;
  clearWinCombinations: () => void;

  // 牌组库弹窗 actions
  openSaveModal: () => void;                                  // 点击"保存"按钮触发
  closeLibraryModal: () => void;
  openHelpModal: () => void;
  closeHelpModal: () => void;
  setLibraryHandText: (text: string) => void;
  setLibraryDescription: (text: string) => void;
  switchToBrowse: () => void;                                 // 转入浏览
  switchToEdit: () => void;                                   // 切换为修改已有牌组
  setLibraryFilter: (filter: HandLengthFilter) => void;
  setLibrarySearchText: (text: string) => void;
  setLibraryBrowseIndex: (index: number) => void;
  libraryGoPrev: () => void;
  libraryGoNext: () => void;
  confirmAddRecord: () => void;                               // 确认增加
  confirmUpdateRecord: () => void;                            // 确认修改
  libraryDeleteCurrent: () => void;                           // 删除当前浏览记录
  libraryLoadToHand: () => void;                              // 手牌：把当前浏览记录载入主手牌
  refreshLibraryBrowse: () => void;                           // 数据变化后重新加载浏览列表
  libraryExportAll: () => string;                             // 导出整个数据库为JSON
  libraryImportAll: (jsonStr: string) => { success: number; skipped: number; invalid: number }; // 导入数据库
  libraryExportCurrent: () => string;                         // 导出当前单条记录为JSON
  libraryImportSingle: (jsonStr: string) => 'ok' | 'duplicate' | 'invalid'; // 导入单条记录

  // 主题
  toggleTheme: () => void;

  // 配置
  setConfig: (config: Partial<Config>) => void;

  // N面听牌select
  setTingSides: (value: 'random' | number) => void;

  // 标签页
  setActiveTab: (tab: TabKey) => void;

  // 历史记录
  undo: () => void;
  redo: () => void;
  jumpToHistory: (index: number) => void;
  pushHistory: (action: string) => void;
}

const MAX_HAND_SIZE = 14;
const MAX_HISTORY = 30;

// 历史记录条目
interface HistoryEntry {
  hand: Tile[];
  action: string;  // 操作描述
  timestamp: number;
}

// 从 localStorage 读取保存的主题
function loadSavedTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('mahjong-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark';
}

// 根据屏幕宽度获取默认每行牌数
function getDefaultTilesPerRow(): number {
  if (typeof window === 'undefined') return 7;
  const width = window.innerWidth;
  if (width >= 1024) return 10;
  if (width >= 768) return 9;
  return 7;
}

// 从 localStorage 读取保存的配置
function loadSavedConfig(): Config {
  if (typeof window === 'undefined') return { tilesPerRow: 7 };
  const saved = localStorage.getItem('mahjong-config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { tilesPerRow: parsed.tilesPerRow || getDefaultTilesPerRow() };
    } catch {
      return { tilesPerRow: getDefaultTilesPerRow() };
    }
  }
  return { tilesPerRow: getDefaultTilesPerRow() };
}

export const useGameStore = create<GameState>((set, get) => ({
  hand: [],
  selectedDiscard: null,
  analysis: null,
  userAnalysis: null,
  tingPaiInfo: null,
  lastDrawnIndex: null,
  error: null,
  winCombinations: [],
  showWinCombinations: false,
  manualDiscardBest: false,

  // 标签页初始状态
  activeTab: 'select',

  // 历史记录初始状态
  history: [],
  historyIndex: -1,

  // 牌组库弹窗初始状态
  libraryModalOpen: false,
  helpModalOpen: false,
  libraryModalMode: 'add',
  libraryHandText: '',
  libraryDescription: '',
  libraryEditingId: null,
  libraryBrowseIndex: 0,
  libraryFilter: 'all',
  librarySearchText: '',
  libraryLoadedOnce: false,
  libraryError: null,

  // 主题
  theme: loadSavedTheme(),

  // 配置
  config: loadSavedConfig(),

  // N面听牌select默认值（仅初次加载为"随机"）
  tingSides: 'random',

  addTile: (tile: Tile) => {
    const { hand } = get();
    if (hand.length >= MAX_HAND_SIZE) {
      set({ error: '手牌最多14张' });
      return;
    }
    const newHand = sortTiles([...hand, tile]);
    const newIndex = newHand.findIndex(t => t.suit === tile.suit && t.value === tile.value);
    set({ hand: newHand, error: null, analysis: null, userAnalysis: null, tingPaiInfo: null, selectedDiscard: null, lastDrawnIndex: newIndex, winCombinations: [], showWinCombinations: false });
    get().pushHistory(`选牌 ${tile.value}${tile.suit === 'wan' ? '万' : tile.suit === 'tong' ? '筒' : '条'}`);

    setTimeout(() => {
      set({ lastDrawnIndex: null });
    }, 3000);
  },

  confirmSelection: () => {
    set({ activeTab: 'hand' });
  },

  removeTile: (index: number) => {
    const { hand } = get();
    const removed = hand[index];
    const newHand = [...hand.slice(0, index), ...hand.slice(index + 1)];
    set({
      hand: newHand,
      error: null,
      analysis: null,
      userAnalysis: null,
      tingPaiInfo: null,
      selectedDiscard: null,
      lastDrawnIndex: null,
      winCombinations: [],
      showWinCombinations: false,
    });
    get().pushHistory(`删除 ${removed ? removed.value + (removed.suit === 'wan' ? '万' : removed.suit === 'tong' ? '筒' : '条') : ''}`);
  },

  // 按花色+数值移除最后一张匹配的牌（用于选牌区撤销）
  removeTileByValue: (tile: Tile) => {
    const { hand } = get();
    // 从后往前找到第一张匹配的牌
    for (let i = hand.length - 1; i >= 0; i--) {
      if (hand[i].suit === tile.suit && hand[i].value === tile.value) {
        const newHand = [...hand.slice(0, i), ...hand.slice(i + 1)];
        set({
          hand: newHand,
          error: null,
          analysis: null,
          userAnalysis: null,
          tingPaiInfo: null,
          selectedDiscard: null,
          lastDrawnIndex: null,
          winCombinations: [],
          showWinCombinations: false,
        });
        get().pushHistory(`撤销选牌 ${tile.value}${tile.suit === 'wan' ? '万' : tile.suit === 'tong' ? '筒' : '条'}`);
        return;
      }
    }
  },

  clearHand: () => {
    set({ hand: [], error: null, analysis: null, userAnalysis: null, tingPaiInfo: null, selectedDiscard: null, lastDrawnIndex: null, winCombinations: [], showWinCombinations: false });
    get().pushHistory('清空手牌');
  },

  setHand: (tiles: Tile[]) => {
    if (tiles.length > MAX_HAND_SIZE) {
      set({ error: `手牌不能超过${MAX_HAND_SIZE}张` });
      return;
    }
    set({ hand: sortTiles(tiles), error: null, analysis: null, userAnalysis: null, tingPaiInfo: null, selectedDiscard: null, lastDrawnIndex: null, winCombinations: [], showWinCombinations: false, activeTab: 'hand' });
    get().pushHistory(`设置手牌(${tiles.length}张)`);
  },

  parseInput: (input: string) => {
    const tiles = parseHandInput(input);
    if (!tiles || tiles.length === 0) {
      // 实时解析时输入不完整是正常的，不显示错误
      return false;
    }
    if (tiles.length > MAX_HAND_SIZE) {
      // 超过限制由输入组件处理，这里不设置错误
      return false;
    }
    // 实时解析：只更新手牌，不跳转标签页
    set({ hand: sortTiles(tiles), error: null, analysis: null, userAnalysis: null, tingPaiInfo: null, selectedDiscard: null, lastDrawnIndex: null, winCombinations: [], showWinCombinations: false });
    return true;
  },

  generateRandom: (count: number) => {
    const hand = generateRandomHand(count);
    get().setHand(hand);
  },

  generateTingPai: (targetSides: 'random' | number) => {
    // 先显示生成中提示，再用 setTimeout 让 UI 先刷新再执行耗时计算
    const label = targetSides === 'random' ? '听牌' : `${targetSides}面听牌`;
    set({ error: `正在生成${label}手牌，请稍候...` });
    setTimeout(() => {
      const hand = generateTingPaiHand(targetSides);
      if (!hand) {
        set({ error: `生成${label}手牌失败，请重试或选择较小的面数` });
        return;
      }
      get().setHand(hand);
    }, 50);
  },

  generateJinTing: (targetJinTing: number) => {
    const label = targetJinTing === 1 ? '一进听' : '二进听';
    set({ error: `正在生成${label}手牌，请稍候...` });
    setTimeout(() => {
      const hand = generateJinTingHand(targetJinTing);
      if (!hand) {
        set({ error: `生成${label}手牌失败，请重试` });
        return;
      }
      get().setHand(hand);
    }, 50);
  },

  selectDiscard: (index: number) => {
    const { selectedDiscard } = get();
    // 再次点击已选中的牌则取消选择
    set({ selectedDiscard: selectedDiscard === index ? null : index });
  },

  analyzeUserChoice: () => {
    const { hand, selectedDiscard } = get();
    if (selectedDiscard === null || selectedDiscard < 0 || selectedDiscard >= hand.length) {
      set({ error: '请先点击选择一张手牌' });
      return;
    }
    if (!isValidQueYiMen(hand)) {
      set({ error: '成都麻将必须缺一门（只能有两门牌）' });
      return;
    }
    // 已胡牌则无需舍牌
    if (isWinningHand(hand)) {
      set({
        error: '当前手牌已经胡牌，无需舍牌',
        userAnalysis: null,
        analysis: null,
        manualDiscardBest: false,
        winCombinations: [],
        showWinCombinations: false,
      });
      return;
    }
    const result = analyzeDiscard(hand, selectedDiscard);
    set({ userAnalysis: result, error: null, manualDiscardBest: false });
  },

  clearUserAnalysis: () => {
    set({ userAnalysis: null, selectedDiscard: null, manualDiscardBest: false });
  },

  clearAnalysis: () => {
    set({ analysis: null });
  },

  clearTingPaiInfo: () => {
    set({ tingPaiInfo: null });
  },

  drawRandomTile: () => {
    const { hand } = get();
    if (hand.length >= MAX_HAND_SIZE) {
      set({ error: '手牌已满（14张）' });
      return;
    }

    let tile;
    if (hand.length === 0) {
      const suits: Tile['suit'][] = ['wan', 'tong', 'tiao'];
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const value = Math.floor(Math.random() * 9) + 1;
      tile = { suit, value };
    } else {
      tile = generateRandomDrawTile(hand);
    }

    if (tile) {
      get().addTile(tile);
    } else {
      set({ error: '无法生成摸牌' });
    }
  },

  manualDiscard: () => {
    const { hand, selectedDiscard } = get();
    if (selectedDiscard === null || selectedDiscard < 0 || selectedDiscard >= hand.length) {
      set({ error: '请先点击选择一张手牌' });
      return;
    }
    if (!isValidQueYiMen(hand)) {
      set({ error: '成都麻将必须缺一门（只能有两门牌）' });
      return;
    }
    // 已胡牌则无需舍牌
    if (isWinningHand(hand)) {
      set({
        error: '当前手牌已经胡牌，无需舍牌',
        userAnalysis: null,
        analysis: null,
        manualDiscardBest: false,
        winCombinations: [],
        showWinCombinations: false,
      });
      return;
    }

    const userResult = analyzeDiscard(hand, selectedDiscard);
    set({ userAnalysis: userResult, error: null, winCombinations: [], showWinCombinations: false });

    const allResults = analyzeAllDiscards(hand);
    const bestResult = allResults.best;

    if (bestResult && userResult.discardTile &&
        bestResult.discardTile.suit === userResult.discardTile.suit &&
        bestResult.discardTile.value === userResult.discardTile.value) {
      // 手动舍牌就是最佳舍牌：显示恭喜卡片
      set({ analysis: null, manualDiscardBest: true });
    } else {
      set({ analysis: allResults, manualDiscardBest: false });
    }

    setTimeout(() => {
      // 删除牌，但保留分析结果供用户查看
      const currentHand = get().hand;
      const discardedTile = currentHand[selectedDiscard];
      const newHand = [...currentHand.slice(0, selectedDiscard), ...currentHand.slice(selectedDiscard + 1)];
      set({ hand: newHand, selectedDiscard: null, lastDrawnIndex: null, winCombinations: [], showWinCombinations: false });
      get().pushHistory(`舍牌 ${discardedTile ? discardedTile.value + (discardedTile.suit === 'wan' ? '万' : discardedTile.suit === 'tong' ? '筒' : '条') : ''}`);

      // 2.5秒后自动清除分析反馈
      setTimeout(() => {
        set({ analysis: null, userAnalysis: null, manualDiscardBest: false });
      }, 2500);
    }, 500);
  },

  reorderHand: (tiles: Tile[]) => {
    set({ hand: tiles, selectedDiscard: null });
  },

  resetHandOrder: () => {
    const { hand } = get();
    const cleared = hand.map(t => ({ ...t, marked: false }));
    set({ hand: sortTiles(cleared), selectedDiscard: null });
    get().pushHistory('复原手牌');
  },

  toggleMarkTile: () => {
    const { hand, selectedDiscard } = get();
    if (selectedDiscard === null || selectedDiscard < 0 || selectedDiscard >= hand.length) {
      set({ error: '请先点击选择一张手牌' });
      return;
    }
    const newHand = [...hand];
    const tile = newHand[selectedDiscard];
    newHand[selectedDiscard] = { ...tile, marked: !tile.marked };
    set({ hand: newHand, error: null });
  },

  showWinCombosForTile: (tile: Tile) => {
    const { hand } = get();
    // 手牌+胡牌的张数必须满足 3*n + 2 的形式（1/4/7/10/13张听牌状态）
    if ((hand.length + 1 - 2) % 3 !== 0 || hand.length === 0) {
      set({ error: '胡牌组合仅在听牌状态下可用' });
      return;
    }
    const combos = findWinCombinations(hand, tile);
    if (combos.length === 0) {
      set({ error: '该牌无法形成胡牌组合', winCombinations: [], showWinCombinations: false });
      return;
    }
    set({ winCombinations: combos, showWinCombinations: true, error: null });
  },

  clearWinCombinations: () => {
    set({ winCombinations: [], showWinCombinations: false });
  },

  analyze: () => {
    const { hand } = get();
    if (hand.length === 0) {
      set({ error: '手牌为空' });
      return;
    }
    if (!isValidQueYiMen(hand)) {
      set({ error: '成都麻将必须缺一门（只能有两门牌）' });
      return;
    }

    // 已胡牌则无需舍牌
    if (isWinningHand(hand)) {
      set({
        error: '当前手牌已经胡牌，无需舍牌',
        analysis: null,
        tingPaiInfo: null,
        userAnalysis: null,
        manualDiscardBest: false,
        winCombinations: [],
        showWinCombinations: false,
      });
      return;
    }

    // 13张牌如果已经听牌，优先提示听牌信息
    if (hand.length === 13) {
      const tingInfo = getTingPaiInfo(hand);
      if (tingInfo) {
        set({ tingPaiInfo: tingInfo, analysis: null, error: null, winCombinations: [], showWinCombinations: false });
        return;
      }
    }

    const result = analyzeAllDiscards(hand);
    set({ analysis: result, tingPaiInfo: null, error: null, winCombinations: [], showWinCombinations: false });
  },

  analyzeJinTing: () => {
    const { hand } = get();
    if (hand.length === 0) {
      set({ error: '手牌为空' });
      return;
    }
    if (!isValidQueYiMen(hand)) {
      set({ error: '成都麻将必须缺一门（只能有两门牌）' });
      return;
    }

    // 判断是否听牌（进听数为0）
    const jinTing = calcJinTing(hand);

    if (jinTing === 0) {
      // 已经听牌
      const jinZhang = calcJinZhang(hand);
      const jinZhangCount = jinZhang.reduce((sum, w) => sum + w.count, 0);
      const suits = new Set(jinZhang.map(w => w.tile.suit));

      const tingPaiInfo: TingPaiInfo = {
        isTing: true,
        jinZhang,
        jinZhangCount,
        jinZhangMen: suits.size,
        jinZhangMian: jinZhang.length,
      };
      set({ tingPaiInfo, analysis: null, error: null, winCombinations: [], showWinCombinations: false });
    } else if (jinTing === -1) {
      // 已经和牌（14张且可以胡）
      set({ error: '当前手牌已经可以胡牌！', tingPaiInfo: null, analysis: null });
    } else {
      // 未听牌，计算进张信息
      const jinZhang = calcJinZhang(hand);
      const jinZhangCount = jinZhang.reduce((sum, w) => sum + w.count, 0);
      const suits = new Set(jinZhang.map(w => w.tile.suit));

      // 构造分析结果，显示几进听和进张信息
      const result: AnalysisResult = {
        discardTile: null,
        jinTing,
        jinZhang,
        jinZhangCount,
        jinZhangMen: suits.size,
        jinZhangMian: jinZhang.length,
      };

      // 包装成 BestDiscardResult 格式，复用现有展示组件
      const analysisResult: BestDiscardResult = {
        isTingPai: false,
        tingPaiInfo: null,
        best: result,
        all: [result],
      };

      set({ analysis: analysisResult, tingPaiInfo: null, error: null, winCombinations: [], showWinCombinations: false });
    }
  },

  // ========== 牌组库弹窗 actions ==========

  openSaveModal: () => {
    const { hand } = get();
    if (hand.length === 0) {
      set({ error: '手牌为空，无法保存' });
      return;
    }
    // 严格按当前手牌排列顺序生成文本
    const handText = handToText(hand);
    const allRecords = loadAllRecords();
    const existing = findRecordByText(allRecords, handText);
    if (existing) {
      // 数据库中已存在：直接跳转到牌组库标签页，以内嵌模式显示"修改已有牌组"
      set({
        libraryModalOpen: false,
        libraryModalMode: 'edit',
        libraryHandText: handText,
        libraryDescription: existing.description,
        libraryEditingId: existing.id,
        libraryBrowseIndex: 0,
        libraryLoadedOnce: true,
        activeTab: 'library',
        error: null,
      });
    } else {
      // 数据库不存在或未找到：进入增添模式
      set({
        libraryModalOpen: true,
        libraryModalMode: 'add',
        libraryHandText: handText,
        libraryDescription: '',
        libraryEditingId: null,
        libraryBrowseIndex: 0,
        error: null,
      });
    }
  },

  closeLibraryModal: () => {
    set({ libraryModalOpen: false, activeTab: 'hand' });
  },

  openHelpModal: () => {
    set({ helpModalOpen: true });
  },

  closeHelpModal: () => {
    set({ helpModalOpen: false });
  },

  setLibraryHandText: (text: string) => {
    set({ libraryHandText: text });
  },

  setLibraryDescription: (text: string) => {
    set({ libraryDescription: text });
  },

  switchToBrowse: () => {
    const { libraryFilter, librarySearchText } = get();
    const allRecords = loadAllRecords();
    let filtered = filterRecords(allRecords, libraryFilter);
    filtered = searchRecordsByDescription(filtered, librarySearchText);
    if (filtered.length === 0) {
      const msg = librarySearchText.trim()
        ? '搜索结果为空'
        : '数据库为空或当前筛选条件下无记录';
      set({
        libraryModalMode: 'browse',
        libraryBrowseIndex: 0,
        libraryHandText: '',
        libraryDescription: '',
        libraryEditingId: null,
        libraryError: msg,
        libraryLoadedOnce: true,
      });
      return;
    }
    const idx = 0;
    const rec = filtered[idx];
    set({
      libraryModalMode: 'browse',
      libraryBrowseIndex: idx,
      libraryHandText: rec.handText,
      libraryDescription: rec.description,
      libraryEditingId: rec.id,
      libraryError: null,
      libraryLoadedOnce: true,
    });
  },

  switchToEdit: () => {
    // 当前浏览记录切换为修改模式
    const { libraryEditingId, libraryHandText, libraryDescription } = get();
    if (!libraryEditingId) {
      set({ libraryError: '当前没有可修改的记录' });
      return;
    }
    set({
      libraryModalMode: 'edit',
      libraryHandText,
      libraryDescription,
      libraryError: null,
    });
  },

  setLibraryFilter: (filter: HandLengthFilter) => {
    const { librarySearchText } = get();
    const allRecords = loadAllRecords();
    let filtered = filterRecords(allRecords, filter);
    filtered = searchRecordsByDescription(filtered, librarySearchText);
    const rec = filtered.length > 0 ? filtered[0] : null;
    set({
      libraryFilter: filter,
      libraryBrowseIndex: 0,
      libraryHandText: rec ? rec.handText : '',
      libraryDescription: rec ? rec.description : '',
      libraryEditingId: rec ? rec.id : null,
      libraryError: rec ? null : '当前筛选条件下无记录',
    });
  },

  setLibraryBrowseIndex: (index: number) => {
    const { libraryFilter, librarySearchText } = get();
    const allRecords = loadAllRecords();
    let filtered = filterRecords(allRecords, libraryFilter);
    filtered = searchRecordsByDescription(filtered, librarySearchText);
    if (index < 0 || index >= filtered.length) return;
    const rec = filtered[index];
    set({
      libraryBrowseIndex: index,
      libraryHandText: rec.handText,
      libraryDescription: rec.description,
      libraryEditingId: rec.id,
      libraryError: null,
    });
  },

  libraryGoPrev: () => {
    const { libraryBrowseIndex } = get();
    if (libraryBrowseIndex > 0) {
      get().setLibraryBrowseIndex(libraryBrowseIndex - 1);
    }
  },

  libraryGoNext: () => {
    const { libraryBrowseIndex, libraryFilter, librarySearchText } = get();
    const allRecords = loadAllRecords();
    let filtered = filterRecords(allRecords, libraryFilter);
    filtered = searchRecordsByDescription(filtered, librarySearchText);
    if (libraryBrowseIndex < filtered.length - 1) {
      get().setLibraryBrowseIndex(libraryBrowseIndex + 1);
    }
  },

  setLibrarySearchText: (text: string) => {
    const { libraryFilter } = get();
    const allRecords = loadAllRecords();
    let filtered = filterRecords(allRecords, libraryFilter);
    filtered = searchRecordsByDescription(filtered, text);
    const rec = filtered.length > 0 ? filtered[0] : null;
    set({
      librarySearchText: text,
      libraryBrowseIndex: 0,
      libraryHandText: rec ? rec.handText : '',
      libraryDescription: rec ? rec.description : '',
      libraryEditingId: rec ? rec.id : null,
      libraryError: rec ? null : (text.trim() ? '搜索结果为空' : null),
    });
  },

  confirmAddRecord: () => {
    const { libraryHandText, libraryDescription, libraryFilter, librarySearchText } = get();
    if (!libraryHandText.trim()) {
      set({ libraryError: '牌组文本不能为空' });
      return;
    }
    const newRecord = addRecord(libraryHandText, libraryDescription);
    // 新增完成后，跳转到牌组标签页并定位到新保存的记录
    const allRecords = loadAllRecords();
    let filtered = filterRecords(allRecords, libraryFilter);
    filtered = searchRecordsByDescription(filtered, librarySearchText);
    const idx = filtered.findIndex(r => r.id === newRecord.id);
    const targetIdx = idx >= 0 ? idx : 0;
    const rec = filtered[targetIdx];
    set({
      libraryModalOpen: false,
      libraryModalMode: 'browse',
      libraryBrowseIndex: targetIdx,
      libraryHandText: rec ? rec.handText : newRecord.handText,
      libraryDescription: rec ? rec.description : newRecord.description,
      libraryEditingId: rec ? rec.id : newRecord.id,
      libraryLoadedOnce: true,
      activeTab: 'library',
      libraryError: null,
    });
  },

  confirmUpdateRecord: () => {
    const { libraryEditingId, libraryHandText, libraryDescription, libraryFilter, librarySearchText } = get();
    if (!libraryEditingId) {
      set({ libraryError: '未找到要修改的记录' });
      return;
    }
    if (!libraryHandText.trim()) {
      set({ libraryError: '牌组文本不能为空' });
      return;
    }
    updateRecord(libraryEditingId, libraryHandText, libraryDescription);
    // 修改完成后，跳转到牌组标签页并定位到刚保存的记录
    const allRecords = loadAllRecords();
    let filtered = filterRecords(allRecords, libraryFilter);
    filtered = searchRecordsByDescription(filtered, librarySearchText);
    const idx = filtered.findIndex(r => r.id === libraryEditingId);
    const targetIdx = idx >= 0 ? idx : 0;
    const rec = filtered[targetIdx];
    set({
      libraryModalOpen: false,
      libraryModalMode: 'browse',
      libraryBrowseIndex: targetIdx,
      libraryHandText: rec ? rec.handText : libraryHandText,
      libraryDescription: rec ? rec.description : libraryDescription,
      libraryEditingId: rec ? rec.id : libraryEditingId,
      libraryLoadedOnce: true,
      activeTab: 'library',
      libraryError: null,
    });
  },

  libraryDeleteCurrent: () => {
    const { libraryEditingId, libraryBrowseIndex, libraryFilter } = get();
    if (!libraryEditingId) {
      set({ libraryError: '当前没有可删除的记录' });
      return;
    }
    deleteRecord(libraryEditingId);
    // 删除后显示前一条记录（如果有）
    const allRecords = loadAllRecords();
    const filtered = filterRecords(allRecords, libraryFilter);
    const newIndex = Math.max(0, libraryBrowseIndex - 1);
    if (filtered.length === 0) {
      set({
        libraryBrowseIndex: 0,
        libraryHandText: '',
        libraryDescription: '',
        libraryEditingId: null,
        libraryError: '数据库已为空',
      });
      return;
    }
    const safeIndex = Math.min(newIndex, filtered.length - 1);
    const rec = filtered[safeIndex];
    set({
      libraryBrowseIndex: safeIndex,
      libraryHandText: rec.handText,
      libraryDescription: rec.description,
      libraryEditingId: rec.id,
      libraryError: null,
    });
  },

  libraryLoadToHand: () => {
    const { libraryHandText } = get();
    if (!libraryHandText.trim()) {
      set({ libraryError: '当前没有可载入的牌组' });
      return;
    }
    const tiles = parseHandInput(libraryHandText);
    if (!tiles || tiles.length === 0) {
      set({ libraryError: '牌组文本无法解析' });
      return;
    }
    // 载入主手牌（按文本顺序，不重新排序，保留用户保存时的排列）
    set({
      hand: tiles,
      error: null,
      analysis: null,
      userAnalysis: null,
      tingPaiInfo: null,
      selectedDiscard: null,
      lastDrawnIndex: null,
      winCombinations: [],
      showWinCombinations: false,
      libraryModalOpen: false,
      activeTab: 'hand',
    });
    get().pushHistory(`载入牌组(${tiles.length}张)`);
  },

  libraryExportAll: () => {
    return exportDatabase();
  },

  libraryImportAll: (jsonStr: string) => {
    const result = importDatabase(jsonStr);
    if (result.success > 0) {
      const allRecords = loadAllRecords();
      const { libraryFilter, librarySearchText } = get();
      let filtered = filterRecords(allRecords, libraryFilter);
      filtered = searchRecordsByDescription(filtered, librarySearchText);
      const idx = result.firstNewRecordId
        ? filtered.findIndex(r => r.id === result.firstNewRecordId)
        : -1;
      const targetIdx = idx >= 0 ? idx : 0;
      const rec = filtered[targetIdx];
      set({
        libraryBrowseIndex: targetIdx,
        libraryHandText: rec ? rec.handText : '',
        libraryDescription: rec ? rec.description : '',
        libraryEditingId: rec ? rec.id : null,
        libraryModalMode: 'browse',
        libraryError: result.invalid > 0 || result.skipped > 0
          ? `导入完成：成功${result.success}条，跳过重复${result.skipped}条，无效${result.invalid}条`
          : null,
      });
    } else {
      set({ libraryError: '未找到可导入的有效牌组' });
    }
    return { success: result.success, skipped: result.skipped, invalid: result.invalid };
  },

  libraryExportCurrent: () => {
    const { libraryHandText, libraryDescription, libraryEditingId } = get();
    if (!libraryEditingId) return '';
    const record: HandRecord = {
      id: libraryEditingId,
      handText: libraryHandText,
      description: libraryDescription,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return exportSingleRecord(record);
  },

  libraryImportSingle: (jsonStr: string) => {
    const result = importSingleRecord(jsonStr);
    if (result.record) {
      const allRecords = loadAllRecords();
      const { libraryFilter, librarySearchText } = get();
      let filtered = filterRecords(allRecords, libraryFilter);
      filtered = searchRecordsByDescription(filtered, librarySearchText);
      const idx = filtered.findIndex(r => r.id === result.record!.id);
      const targetIdx = idx >= 0 ? idx : 0;
      const rec = filtered[targetIdx];
      set({
        libraryBrowseIndex: targetIdx,
        libraryHandText: rec ? rec.handText : result.record.handText,
        libraryDescription: rec ? rec.description : result.record.description,
        libraryEditingId: rec ? rec.id : result.record.id,
        libraryModalMode: 'browse',
        libraryError: null,
      });
      return 'ok';
    } else if (result.isDuplicate) {
      set({ libraryError: '该牌组已存在，未导入' });
      return 'duplicate';
    } else {
      set({ libraryError: '数据无效，无法导入' });
      return 'invalid';
    }
  },

  refreshLibraryBrowse: () => {
    // 数据变化后重新加载浏览列表，并尽量保持在当前位置
    const { libraryBrowseIndex, libraryFilter } = get();
    const allRecords = loadAllRecords();
    const filtered = filterRecords(allRecords, libraryFilter);
    if (filtered.length === 0) {
      set({
        libraryBrowseIndex: 0,
        libraryHandText: '',
        libraryDescription: '',
        libraryEditingId: null,
        libraryError: '数据库为空或当前筛选条件下无记录',
      });
      return;
    }
    const safeIndex = Math.min(libraryBrowseIndex, filtered.length - 1);
    const rec = filtered[safeIndex];
    set({
      libraryBrowseIndex: safeIndex,
      libraryHandText: rec.handText,
      libraryDescription: rec.description,
      libraryEditingId: rec.id,
      libraryError: null,
    });
  },

  toggleTheme: () => {
    const { theme } = get();
    const next = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('mahjong-theme', next);
    set({ theme: next });
  },

  setConfig: (partial: Partial<Config>) => {
    const { config } = get();
    const newConfig = { ...config, ...partial };
    localStorage.setItem('mahjong-config', JSON.stringify(newConfig));
    set({ config: newConfig });
  },

  setTingSides: (value: 'random' | number) => {
    set({ tingSides: value });
  },

  setActiveTab: (tab: TabKey) => {
    const { activeTab, libraryLoadedOnce } = get();
    // 首次切换到牌组库时，默认进入浏览模式并加载第一条记录
    // 后续切换时保留用户当前浏览状态，不强制恢复到第一条
    if (tab === 'library' && activeTab !== 'library' && !libraryLoadedOnce) {
      get().switchToBrowse();
    }
    set({ activeTab: tab });
  },

  // ========== 历史记录系统 ==========
  pushHistory: (action: string) => {
    const { hand, history, historyIndex } = get();
    // 截断当前位置之后的历史（撤销后再操作，丢弃后续记录）
    const truncated = history.slice(0, historyIndex + 1);
    // 添加新记录
    const newEntry: HistoryEntry = {
      hand: [...hand],
      action,
      timestamp: Date.now(),
    };
    const newHistory = [...truncated, newEntry];
    // 限制最多30条
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const targetIndex = historyIndex - 1;
    const entry = history[targetIndex];
    set({
      hand: [...entry.hand],
      historyIndex: targetIndex,
      selectedDiscard: null,
      lastDrawnIndex: null,
      analysis: null,
      userAnalysis: null,
      tingPaiInfo: null,
      winCombinations: [],
      showWinCombinations: false,
      error: null,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const targetIndex = historyIndex + 1;
    const entry = history[targetIndex];
    set({
      hand: [...entry.hand],
      historyIndex: targetIndex,
      selectedDiscard: null,
      lastDrawnIndex: null,
      analysis: null,
      userAnalysis: null,
      tingPaiInfo: null,
      winCombinations: [],
      showWinCombinations: false,
      error: null,
    });
  },

  jumpToHistory: (index: number) => {
    const { history } = get();
    if (index < 0 || index >= history.length) return;
    const entry = history[index];
    set({
      hand: [...entry.hand],
      historyIndex: index,
      selectedDiscard: null,
      lastDrawnIndex: null,
      analysis: null,
      userAnalysis: null,
      tingPaiInfo: null,
      winCombinations: [],
      showWinCombinations: false,
      error: null,
    });
  },
}));
