export type Suit = 'wan' | 'tong' | 'tiao';

export interface Tile {
  suit: Suit;
  value: number; // 1-9
  marked?: boolean; // 用户手动标注（理牌用，不持久化）
}

export interface WaitingInfo {
  tile: Tile;
  count: number; // 剩余可用张数
}

export interface AnalysisResult {
  discardTile: Tile | null; // 舍牌（null表示当前手牌直接分析）
  jinTing: number; // 几进听: 0=听牌, 1=一进听, 2=二进听...
  jinZhang: WaitingInfo[]; // 进张列表
  jinZhangCount: number; // 进张总张数
  jinZhangMen: number; // 进张门数
  jinZhangMian: number; // 进张面数（不同的牌各算1面）
}

export interface TingPaiInfo {
  isTing: boolean;
  jinZhang: WaitingInfo[];
  jinZhangCount: number;
  jinZhangMen: number;
  jinZhangMian: number; // 进张面数（不同的牌各算1面）
}

export interface BestDiscardResult {
  isTingPai: boolean; // 13张时是否已经听牌
  tingPaiInfo: TingPaiInfo | null;
  best: AnalysisResult | null;
  all: AnalysisResult[];
}

// 胡牌组合中的一个面子或对子
export type MeldType = 'shunzi' | 'kezi' | 'duizi';
export interface Meld {
  type: MeldType;
  tiles: Tile[];
  label: string;
}

// 一组胡牌解法（4面子+1对子）
export interface WinCombination {
  pair: Meld;
  melds: Meld[];
}

// 牌组库中一条记录
export interface HandRecord {
  id: string;          // 唯一标识
  handText: string;    // 手牌文本，如 w1234t5678s123
  description: string; // 文字说明
  createdAt: number;   // 创建时间戳
  updatedAt: number;   // 更新时间戳
}

// 弹窗模式
export type LibraryModalMode = 'add' | 'edit' | 'browse';

// 弹窗中浏览的筛选条件
export type HandLengthFilter = 'all' | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

