import type { Tile, Suit, AnalysisResult, BestDiscardResult, WaitingInfo, TingPaiInfo, Meld, WinCombination } from '../types';

const SUITS: Suit[] = ['wan', 'tong', 'tiao'];
const SUIT_LABELS: Record<Suit, string> = { wan: '万', tong: '筒', tiao: '条' };

// ========== 基础工具函数 ==========

export function tileKey(t: Tile): string {
  return `${t.suit}-${t.value}`;
}

export function tileToString(t: Tile): string {
  return `${t.value}${SUIT_LABELS[t.suit]}`;
}

export function parseTileKey(key: string): Tile {
  const [suit, value] = key.split('-');
  return { suit: suit as Suit, value: parseInt(value) };
}

// 将手牌转换为文本格式 (w123t456s789)
export function handToText(tiles: Tile[]): string {
  const suitChars: Record<Suit, string> = { wan: 'w', tong: 't', tiao: 's' };
  const groups: Record<Suit, number[]> = { wan: [], tong: [], tiao: [] };
  
  for (const tile of tiles) {
    groups[tile.suit].push(tile.value);
  }
  
  const parts: string[] = [];
  for (const suit of SUITS) {
    if (groups[suit].length > 0) {
      const values = groups[suit].sort((a, b) => a - b).join('');
      parts.push(`${suitChars[suit]}${values}`);
    }
  }
  
  return parts.join('');
}

export function sortTiles(tiles: Tile[]): Tile[] {
  const suitOrder = { wan: 0, tong: 1, tiao: 2 };
  return [...tiles].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return a.value - b.value;
  });
}

// 将手牌按花色分组为计数数组
export function toSuitCounts(tiles: Tile[]): Record<Suit, number[]> {
  const counts: Record<Suit, number[]> = {
    wan: Array(9).fill(0),
    tong: Array(9).fill(0),
    tiao: Array(9).fill(0),
  };
  for (const t of tiles) {
    counts[t.suit][t.value - 1]++;
  }
  return counts;
}

// 获取缺的一门（用于显示，返回第一个缺门）
export function getMissingSuit(tiles: Tile[]): Suit | null {
  const present = new Set<Suit>();
  for (const t of tiles) present.add(t.suit);
  for (const s of SUITS) {
    if (!present.has(s)) return s;
  }
  return null;
}

// 获取所有缺的门（用于计算）
export function getMissingSuits(tiles: Tile[]): Suit[] {
  const present = new Set<Suit>();
  for (const t of tiles) present.add(t.suit);
  return SUITS.filter(s => !present.has(s));
}

// 判断是否符合缺一门规则（允许1门或2门，不允许3门）
export function isValidQueYiMen(tiles: Tile[]): boolean {
  const present = new Set<Suit>();
  for (const t of tiles) present.add(t.suit);
  return present.size <= 2;
}

// 解析文本输入，支持多种格式
export function parseHandInput(input: string): Tile[] | null {
  const tiles: Tile[] = [];
  const trimmed = input.trim().toLowerCase().replace(/\s/g, '');

  // 格式1: w123t456s789 (w=万, t=筒, s=条)
  // 格式2: m123p456s789 (m=万, p=筒, s=条)
  // 格式3: 万123筒456条789
  // 格式4: 123万456筒789条

  let suit: Suit | null = null;
  let buffer = '';

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];

    // 数字累积
    if (ch >= '0' && ch <= '9') {
      buffer += ch;
      continue;
    }

    // 遇到花色标识，先处理buffer中的数字
    let newSuit: Suit | null = null;
    if (ch === 'w' || ch === 'm' || ch === '万') newSuit = 'wan';
    else if (ch === 't' || ch === 'p' || ch === 'b' || ch === '筒' || ch === '饼') newSuit = 'tong';
    else if (ch === 's' || ch === '条' || ch === '索') newSuit = 'tiao';

    if (newSuit) {
      // 如果之前有未处理完的数字，先用之前的suit处理
      if (buffer && suit) {
        for (const d of buffer) {
          const v = parseInt(d);
          if (v >= 1 && v <= 9) tiles.push({ suit, value: v });
        }
      }
      suit = newSuit;
      buffer = '';
    }
  }

  // 处理末尾的数字
  if (buffer && suit) {
    for (const d of buffer) {
      const v = parseInt(d);
      if (v >= 1 && v <= 9) tiles.push({ suit, value: v });
    }
  }

  // 如果没解析到，尝试另一种格式：数字在前，花色在后
  if (tiles.length === 0) {
    const regex = /(\d+)([wmtpsb万筒饼条索])/gi;
    let m;
    while ((m = regex.exec(trimmed)) !== null) {
      const nums = m[1];
      const suitCh = m[2].toLowerCase();
      let s: Suit | null = null;
      if (suitCh === 'w' || suitCh === 'm' || suitCh === '万') s = 'wan';
      else if (suitCh === 't' || suitCh === 'p' || suitCh === 'b' || suitCh === '筒' || suitCh === '饼') s = 'tong';
      else if (suitCh === 's' || suitCh === '条' || suitCh === '索') s = 'tiao';
      if (s) {
        for (const d of nums) {
          const v = parseInt(d);
          if (v >= 1 && v <= 9) tiles.push({ suit: s, value: v });
        }
      }
    }
  }

  return tiles.length > 0 ? tiles : null;
}

// 生成随机手牌
export function generateRandomHand(count: number = 13): Tile[] {
  // 成都麻将缺一门，先随机选择缺哪门
  const missingIndex = Math.floor(Math.random() * 3);
  const availableSuits = SUITS.filter((_, i) => i !== missingIndex);

  const tiles: Tile[] = [];
  const pool: Tile[] = [];

  // 构建牌池（两门，各36张）
  for (const suit of availableSuits) {
    for (let v = 1; v <= 9; v++) {
      for (let c = 0; c < 4; c++) {
        pool.push({ suit, value: v });
      }
    }
  }

  // 随机抽取
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    tiles.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return sortTiles(tiles);
}

// 生成可以听指定面数的13张手牌
// targetSides: 'random' 不限制听牌面数 | 1-9 指定听牌面数
// 多面听牌型模板库（5-9面听）
// 每个模板用 [花色分组1, 花色分组2] 表示，每组是该花色下的牌值数组
// 单门模板只有一个分组，跨花色模板有两个分组
type TingTemplate = number[][];
const TING_TEMPLATES: Record<number, TingTemplate[]> = {
  9: [
    [[1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9]],  // 九莲宝灯（单门）
  ],
  8: [
    [[3, 3, 3, 4, 5, 6, 7, 8, 8, 8, 9, 9, 9]],
    [[3, 3, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 8]],
    [[3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 8, 8]],
  ],
  7: [
    [[1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 5, 6, 7]],
    [[2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 6, 7, 8]],
    [[1, 1, 1, 2, 3, 4, 5, 6, 6, 6, 7, 8, 9]],
    [[1, 1, 1, 2, 3, 4, 5, 6, 6, 6, 7, 7, 7]],
    [[1, 1, 1, 2, 2, 2, 3, 4, 5, 6, 7, 8, 9]],
  ],
  6: [
    [[1, 1, 1, 2, 3, 4, 5, 6, 6, 7, 7, 8, 8]],
    [[2, 2, 2, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9]],
    // 跨花色模板：第一组3张+第二组10张
    [[6, 7, 8], [1, 1, 1, 2, 3, 4, 5, 6, 7, 8]],
    [[3, 4, 5], [1, 1, 1, 2, 3, 4, 5, 6, 7, 8]],
  ],
  5: [
    // 已验证的5面听模板（跨花色）
    [[3, 4, 5], [1, 1, 1, 2, 3, 4, 5, 5, 6, 7]],  // 3-4-5万 + 1-1-1-2-3-4-5-5-6-7条
    [[2, 3, 4, 5, 6, 6, 6], [6, 7, 8, 9, 9, 9]],  // 2-3-4-5-6-6-6万 + 6-7-8-9-9-9筒
    [[2, 3, 4, 5, 6, 6, 6], [3, 4, 5, 6, 7, 8]],   // 2-3-4-5-6-6-6万 + 3-4-5-6-7-8条
  ],
};

// 1-4面听的缓存（首次生成后缓存，后续直接取用）
const tingHandCache = new Map<number, Tile[][]>();

// 从模板生成手牌（随机分配花色）
function buildHandFromTemplate(template: TingTemplate): Tile[] {
  // 随机选两个不同花色（满足缺一门）
  const suitIndices = [0, 1, 2];
  // 随机打乱
  for (let i = suitIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [suitIndices[i], suitIndices[j]] = [suitIndices[j], suitIndices[i]];
  }

  const hand: Tile[] = [];
  for (let g = 0; g < template.length; g++) {
    const suit = SUITS[suitIndices[g]];
    for (const v of template[g]) {
      hand.push({ suit, value: v });
    }
  }
  return sortTiles(hand);
}

export function generateTingPaiHand(targetSides: 'random' | number): Tile[] | null {
  // N=随机: 只需找到任意听牌手牌
  if (targetSides === 'random') {
    for (let i = 0; i < 3000; i++) {
      const hand = generateRandomHand(13);
      const tingInfo = getTingPaiInfo(hand);
      if (tingInfo) return hand;
    }
    return null;
  }

  // N=5-9: 使用模板库
  if (targetSides >= 5 && targetSides <= 9) {
    const templates = TING_TEMPLATES[targetSides];
    if (templates && templates.length > 0) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      return buildHandFromTemplate(template);
    }
  }

  // N=1-4: 缓存+随机法
  if (targetSides >= 1 && targetSides <= 4) {
    // 先查缓存
    if (tingHandCache.has(targetSides)) {
      const cached = tingHandCache.get(targetSides)!;
      if (cached.length > 0) {
        return cached[Math.floor(Math.random() * cached.length)];
      }
    }

    // 缓存未命中，随机搜索并收集多个
    const found: Tile[][] = [];
    const maxRetries = 15000;
    for (let i = 0; i < maxRetries && found.length < 5; i++) {
      const hand = generateRandomHand(13);
      const tingInfo = getTingPaiInfo(hand);
      if (!tingInfo) continue;
      if (tingInfo.jinZhang.length === targetSides) {
        found.push(hand);
      }
    }

    if (found.length > 0) {
      tingHandCache.set(targetSides, found);
      return found[Math.floor(Math.random() * found.length)];
    }
    return null;
  }

  return null;
}

// 生成指定向听数的13张手牌（一进听=1，二进听=2）
export function generateJinTingHand(targetJinTing: number): Tile[] | null {
  const maxRetries = 10000;
  for (let i = 0; i < maxRetries; i++) {
    const hand = generateRandomHand(13);
    const jinTing = calcJinTing(hand);
    if (jinTing === targetJinTing) return hand;
  }
  return null;
}

// 根据当前手牌生成一张随机摸牌
// 规则：手牌为1门时，随机确定另一门；手牌为2门时，直接以这两门为准
// 在确定的2门花色中，从牌山剩余牌中随机抽一张
export function generateRandomDrawTile(hand: Tile[]): Tile | null {
  if (hand.length === 0) return null;

  // 获取手牌中已有的花色
  const present = new Set<Suit>();
  for (const t of hand) present.add(t.suit);

  // 确定手牌的两门花色
  let availableSuits: Suit[];
  if (present.size === 1) {
    // 只有1门花色：随机确定另一门
    const currentSuit = Array.from(present)[0];
    const otherSuits = SUITS.filter(s => s !== currentSuit);
    const secondSuit = otherSuits[Math.floor(Math.random() * otherSuits.length)];
    availableSuits = [currentSuit, secondSuit];
  } else if (present.size === 2) {
    // 已有2门花色：直接使用
    availableSuits = SUITS.filter(s => present.has(s));
  } else {
    // 不应有3门花色的手牌
    return null;
  }

  // 构建牌池（仅考虑手牌两门花色，并排除手牌中已用完的牌）
  const counts = toSuitCounts(hand);
  const pool: Tile[] = [];
  for (const suit of availableSuits) {
    for (let v = 1; v <= 9; v++) {
      if (counts[suit][v - 1] < 4) {
        const remaining = 4 - counts[suit][v - 1];
        for (let i = 0; i < remaining; i++) {
          pool.push({ suit, value: v });
        }
      }
    }
  }

  if (pool.length === 0) return null;
  
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

// ========== 核心算法：同花色牌型分析 ==========

interface SuitAnalysis {
  melds: number;  // 面子数
  shapes: number; // 搭子数（对子、两面搭、坎张搭都算）
}

function betterAnalysis(a: SuitAnalysis, b: SuitAnalysis): boolean {
  if (a.melds !== b.melds) return a.melds > b.melds;
  return a.shapes > b.shapes;
}

// 递归分析一组同花色牌（计数数组）
function analyzeSuitCounts(counts: number[], start: number): SuitAnalysis {
  let i = start;
  while (i < 9 && counts[i] === 0) i++;
  if (i >= 9) return { melds: 0, shapes: 0 };

  let best: SuitAnalysis = { melds: 0, shapes: 0 };

  // 选项1：刻子
  if (counts[i] >= 3) {
    counts[i] -= 3;
    const res = analyzeSuitCounts(counts, i);
    counts[i] += 3;
    res.melds++;
    if (betterAnalysis(res, best)) best = res;
  }

  // 选项2：顺子
  if (i <= 6 && counts[i + 1] > 0 && counts[i + 2] > 0) {
    counts[i]--; counts[i + 1]--; counts[i + 2]--;
    const res = analyzeSuitCounts(counts, i);
    counts[i]++; counts[i + 1]++; counts[i + 2]++;
    res.melds++;
    if (betterAnalysis(res, best)) best = res;
  }

  // 选项3：对子（搭子）
  if (counts[i] >= 2) {
    counts[i] -= 2;
    const res = analyzeSuitCounts(counts, i);
    counts[i] += 2;
    res.shapes++;
    if (betterAnalysis(res, best)) best = res;
  }

  // 选项4：两面搭 / 边张搭
  if (i <= 7 && counts[i + 1] > 0) {
    counts[i]--; counts[i + 1]--;
    const res = analyzeSuitCounts(counts, i);
    counts[i]++; counts[i + 1]++;
    res.shapes++;
    if (betterAnalysis(res, best)) best = res;
  }

  // 选项5：坎张搭
  if (i <= 5 && counts[i + 2] > 0) {
    counts[i]--; counts[i + 2]--;
    const res = analyzeSuitCounts(counts, i);
    counts[i]++; counts[i + 2]++;
    res.shapes++;
    if (betterAnalysis(res, best)) best = res;
  }

  // 选项6：单牌跳过
  counts[i]--;
  const res = analyzeSuitCounts(counts, i);
  counts[i]++;
  if (betterAnalysis(res, best)) best = res;

  return best;
}

// ========== 向听数计算 ==========

// 计算13张手牌的向听数（0=听牌, 1=一进听, ...）
function calcXiangTing13(counts: Record<Suit, number[]>): number {
  const activeSuits = SUITS.filter(s => counts[s].some(c => c > 0));

  let best = Infinity;

  // 情况1：有将牌
  for (const pairSuit of activeSuits) {
    for (let v = 0; v < 9; v++) {
      if (counts[pairSuit][v] < 2) continue;

      const c: Record<Suit, number[]> = {
        wan: [...counts.wan],
        tong: [...counts.tong],
        tiao: [...counts.tiao],
      };
      c[pairSuit][v] -= 2;

      let totalMelds = 0;
      let totalShapes = 0;
      for (const s of activeSuits) {
        const res = analyzeSuitCounts(c[s], 0);
        totalMelds += res.melds;
        totalShapes += res.shapes;
      }

      // 向听数 = 8 - 2*面子数 - min(搭子数, 4-面子数) - 1(将牌)
      const xt = 8 - 2 * totalMelds - Math.min(totalShapes, 4 - totalMelds) - 1;
      best = Math.min(best, xt);
    }
  }

  // 情况2：没有将牌
  {
    let totalMelds = 0;
    let totalShapes = 0;
    for (const s of activeSuits) {
      const res = analyzeSuitCounts([...counts[s]], 0);
      totalMelds += res.melds;
      totalShapes += res.shapes;
    }
    const xt = 8 - 2 * totalMelds - Math.min(totalShapes, 4 - totalMelds);
    best = Math.min(best, xt);
  }

  return best;
}

// 判断14张牌是否能和牌
function canWin14(counts: Record<Suit, number[]>): boolean {
  return canWin(counts, 14);
}

// 通用胡牌判断：total张牌能否分解为 targetMelds个面子 + 1将牌
function canWin(counts: Record<Suit, number[]>, total: number): boolean {
  const targetMelds = Math.floor((total - 2) / 3);
  if (total !== 3 * targetMelds + 2) return false;

  const activeSuits = SUITS.filter(s => counts[s].some(c => c > 0));

  for (const pairSuit of activeSuits) {
    for (let v = 0; v < 9; v++) {
      if (counts[pairSuit][v] < 2) continue;

      const c: Record<Suit, number[]> = {
        wan: [...counts.wan],
        tong: [...counts.tong],
        tiao: [...counts.tiao],
      };
      c[pairSuit][v] -= 2;

      let totalMelds = 0;
      for (const s of activeSuits) {
        const res = analyzeSuitCounts(c[s], 0);
        totalMelds += res.melds;
      }

      if (totalMelds === targetMelds) return true;
    }
  }

  return false;
}

// 判断当前手牌是否已经胡牌（无需再摸牌即可胡）
// 适用于手牌张数为 2/5/8/11/14（即 (n-2) % 3 === 0），
// 其余面子视为已放在门前的明牌（吃/碰/杠）
export function isWinningHand(hand: Tile[]): boolean {
  const total = hand.length;
  // 必须满足 3*targetMelds + 2 的形式
  if ((total - 2) % 3 !== 0) return false;
  if (total < 2) return false;
  const counts = toSuitCounts(hand);
  return canWin(counts, total);
}

interface SimpleAnalysis {
  melds: number;
  pairs: number;
  shapes: number;
  singles: number;
}

function analyzeSuitSimple(counts: number[]): SimpleAnalysis {
  let melds = 0;
  let pairs = 0;
  let shapes = 0;
  let singles = 0;

  const c = [...counts];
  for (let i = 0; i < 9; i++) {
    // 先找刻子
    while (c[i] >= 3) {
      melds++;
      c[i] -= 3;
    }
  }

  for (let i = 0; i < 9; i++) {
    // 找顺子
    while (i <= 6 && c[i] > 0 && c[i + 1] > 0 && c[i + 2] > 0) {
      melds++;
      c[i]--;
      c[i + 1]--;
      c[i + 2]--;
    }
  }

  for (let i = 0; i < 9; i++) {
    // 找对子
    while (c[i] >= 2) {
      pairs++;
      c[i] -= 2;
    }
  }

  for (let i = 0; i < 9; i++) {
    while (i <= 7 && c[i] > 0 && c[i + 1] > 0) {
      shapes++;
      c[i]--;
      c[i + 1]--;
    }
  }

  for (let i = 0; i < 9; i++) {
    while (i <= 5 && c[i] > 0 && c[i + 2] > 0) {
      shapes++;
      c[i]--;
      c[i + 2]--;
    }
  }

  for (let i = 0; i < 9; i++) {
    singles += c[i];
  }

  return { melds, pairs, shapes, singles };
}

export function calcXiangTingSimple(hand: Tile[]): number {
  const total = hand.length;
  if (total === 0) return Infinity;

  const targetMelds = Math.floor((total - 1) / 3);

  const counts = toSuitCounts(hand);
  const activeSuits = SUITS.filter(s => counts[s].some(c => c > 0));

  let best = Infinity;

  // 情况1：有将牌（枚举对子做将）
  for (const pairSuit of activeSuits) {
    for (let v = 0; v < 9; v++) {
      if (counts[pairSuit][v] < 2) continue;

      const c: Record<Suit, number[]> = {
        wan: [...counts.wan],
        tong: [...counts.tong],
        tiao: [...counts.tiao],
      };
      c[pairSuit][v] -= 2;

      let totalMelds = 0;
      let totalPairs = 0;
      let totalShapes = 0;

      for (const s of activeSuits) {
        const res = analyzeSuitSimple(c[s]);
        totalMelds += res.melds;
        totalPairs += res.pairs;
        totalShapes += res.shapes;
      }

      const meldsNeeded = targetMelds - totalMelds;
      if (meldsNeeded <= 0) {
        best = Math.min(best, 0);
        continue;
      }

      // 经典公式：每个面子值2，每个搭子/对子值1，将牌值1
      // 向听数 = 2 * meldsNeeded - effectiveShapes - 1(将牌)
      const availableShapes = totalShapes + totalPairs;
      const effectiveShapes = Math.min(availableShapes, meldsNeeded);
      const xt = 2 * meldsNeeded - effectiveShapes - 1;

      best = Math.min(best, xt);
    }
  }

  // 情况2：无将牌（单吊将候选）
  {
    let totalMelds = 0;
    let totalPairs = 0;
    let totalShapes = 0;
    let totalSingles = 0;

    for (const s of activeSuits) {
      const res = analyzeSuitSimple(counts[s]);
      totalMelds += res.melds;
      totalPairs += res.pairs;
      totalShapes += res.shapes;
      totalSingles += res.singles;
    }

    const meldsNeeded = targetMelds - totalMelds;
    const availableShapes = totalShapes + totalPairs;

    if (meldsNeeded <= 0) {
      // 面子已凑齐，无将牌
      // 如果有单张牌可以做单吊将候选，则听牌（向听数=0）
      // 如果没有单张（全是面子），则需要摸牌形成将牌 → 一进听
      if (totalSingles > 0) {
        best = Math.min(best, 0);
      } else {
        best = Math.min(best, 1);
      }
    } else {
      // 无将牌，但多余的搭子/对子可作为将牌候选
      // 用 meldsNeeded 个搭子凑面子，剩下的搭子/对子可作为将牌雏形
      const effectiveShapes = Math.min(availableShapes, meldsNeeded);
      const extraShapes = availableShapes - effectiveShapes;
      // 如果有多余的搭子/对子，可以作为将牌，不需要额外+1
      const pairPenalty = extraShapes > 0 ? 0 : 1;
      const xt = 2 * meldsNeeded - effectiveShapes + pairPenalty;

      best = Math.min(best, xt);
    }
  }

  return Math.max(0, best);
}

// 递归分解同花色计数数组为面子列表
function decomposeSuitCounts(counts: number[], start: number): Meld[][] | null {
  let i = start;
  while (i < 9 && counts[i] === 0) i++;
  if (i >= 9) return [];

  const results: Meld[][] = [];

  // 选项1：刻子
  if (counts[i] >= 3) {
    counts[i] -= 3;
    const sub = decomposeSuitCounts(counts, i);
    counts[i] += 3;
    if (sub !== null) {
      const meld: Meld = {
        type: 'kezi',
        tiles: [
          { suit: 'wan', value: i + 1 },
          { suit: 'wan', value: i + 1 },
          { suit: 'wan', value: i + 1 },
        ],
        label: `${i + 1}${i + 1}${i + 1}`,
      };
      // 注意：suit 需要根据实际花色设置，这里先占位，后面调用时修正
      for (const s of sub) {
        results.push([meld, ...s]);
      }
    }
  }

  // 选项2：顺子
  if (i <= 6 && counts[i + 1] > 0 && counts[i + 2] > 0) {
    counts[i]--; counts[i + 1]--; counts[i + 2]--;
    const sub = decomposeSuitCounts(counts, i);
    counts[i]++; counts[i + 1]++; counts[i + 2]++;
    if (sub !== null) {
      const meld: Meld = {
        type: 'shunzi',
        tiles: [
          { suit: 'wan', value: i + 1 },
          { suit: 'wan', value: i + 2 },
          { suit: 'wan', value: i + 3 },
        ],
        label: `${i + 1}${i + 2}${i + 3}`,
      };
      for (const s of sub) {
        results.push([meld, ...s]);
      }
    }
  }

  return results.length > 0 ? results : null;
}

// 递归分解同花色计数数组为指定数量的面子列表
function decomposeToMelds(counts: number[], suit: Suit, targetMelds: number): Meld[][] {
  const result: Meld[][] = [];

  function backtrack(remaining: number[], currentMelds: Meld[], pos: number) {
    if (currentMelds.length === targetMelds) {
      if (remaining.every(x => x === 0)) {
        result.push([...currentMelds]);
      }
      return;
    }

    let i = pos;
    while (i < 9 && remaining[i] === 0) i++;
    if (i >= 9) return;

    // 尝试刻子
    if (remaining[i] >= 3) {
      remaining[i] -= 3;
      const meld: Meld = {
        type: 'kezi',
        tiles: [
          { suit, value: i + 1 },
          { suit, value: i + 1 },
          { suit, value: i + 1 },
        ],
        label: `${i + 1}${i + 1}${i + 1}${SUIT_LABELS[suit]}`,
      };
      backtrack(remaining, [...currentMelds, meld], i);
      remaining[i] += 3;
    }

    // 尝试顺子
    if (i <= 6 && remaining[i + 1] > 0 && remaining[i + 2] > 0) {
      remaining[i]--; remaining[i + 1]--; remaining[i + 2]--;
      const meld: Meld = {
        type: 'shunzi',
        tiles: [
          { suit, value: i + 1 },
          { suit, value: i + 2 },
          { suit, value: i + 3 },
        ],
        label: `${i + 1}${i + 2}${i + 3}${SUIT_LABELS[suit]}`,
      };
      backtrack(remaining, [...currentMelds, meld], i);
      remaining[i]++; remaining[i + 1]++; remaining[i + 2]++;
    }
  }

  backtrack(counts, [], 0);
  return result;
}

// 枚举所有可能的面子组合方式（targetMelds个面子）
function enumerateAllMeldCombinations(counts: Record<Suit, number[]>, targetMelds: number): Meld[][] {
  // targetMelds为0时，只有一种组合方式：空面子列表
  if (targetMelds === 0) {
    return [[]];
  }

  const activeSuits = SUITS.filter(s => counts[s].some(c => c > 0));
  const result: Meld[][] = [];

  if (activeSuits.length === 1) {
    const suit = activeSuits[0];
    return decomposeToMelds([...counts[suit]], suit, targetMelds);
  }

  if (activeSuits.length === 2) {
    const [s1, s2] = activeSuits;
    for (let m1 = 0; m1 <= targetMelds; m1++) {
      const m2 = targetMelds - m1;
      const decomps1 = decomposeToMelds([...counts[s1]], s1, m1);
      const decomps2 = decomposeToMelds([...counts[s2]], s2, m2);
      for (const d1 of decomps1) {
        for (const d2 of decomps2) {
          result.push([...d1, ...d2]);
        }
      }
    }
  }

  return result;
}

// 给定手牌+1张胡牌，找出所有胡牌组合（targetMelds面子+1对子）
export function findWinCombinations(hand: Tile[], winTile: Tile): WinCombination[] {
  const allTiles = [...hand, winTile];
  const total = allTiles.length;
  // total必须满足 3*targetMelds + 2 的形式
  if ((total - 2) % 3 !== 0) return [];
  const targetMelds = (total - 2) / 3;

  const counts = toSuitCounts(allTiles);
  const activeSuits = SUITS.filter(s => counts[s].some(c => c > 0));
  const combinations: WinCombination[] = [];

  for (const pairSuit of activeSuits) {
    for (let v = 0; v < 9; v++) {
      if (counts[pairSuit][v] < 2) continue;

      const c: Record<Suit, number[]> = {
        wan: [...counts.wan],
        tong: [...counts.tong],
        tiao: [...counts.tiao],
      };
      c[pairSuit][v] -= 2;

      const pair: Meld = {
        type: 'duizi',
        tiles: [
          { suit: pairSuit, value: v + 1 },
          { suit: pairSuit, value: v + 1 },
        ],
        label: `${v + 1}${v + 1}${SUIT_LABELS[pairSuit]}`,
      };

      const meldCombos = enumerateAllMeldCombinations(c, targetMelds);
      for (const melds of meldCombos) {
        if (melds.length === targetMelds) {
          const key = `${pair.label}|${melds.map(m => m.label).sort().join(',')}`;
          const exists = combinations.some(
            comb => comb.pair.label === pair.label &&
              comb.melds.length === melds.length &&
              comb.melds.every((m, i) => m.label === melds[i].label)
          );
          if (!exists) {
            combinations.push({ pair, melds });
          }
        }
      }
    }
  }

  return combinations;
}

function suitCountsToKey(counts: Record<Suit, number[]>): string {
  return counts.wan.join(',') + ';' + counts.tong.join(',') + ';' + counts.tiao.join(',');
}

function calcXiangTingGeneral(counts: Record<Suit, number[]>, total: number): number {
  const activeSuits = SUITS.filter(s => counts[s].some(c => c > 0));

  // 根据手牌总数动态计算目标面子数
  // 13张→4面子, 10张→3面子, 7张→2面子, 4张→1面子, 1张→0面子
  const targetMelds = Math.floor((total - 1) / 3);

  let best = Infinity;

  // 情况1：有将牌（已有对子）
  for (const pairSuit of activeSuits) {
    for (let v = 0; v < 9; v++) {
      if (counts[pairSuit][v] < 2) continue;

      const c: Record<Suit, number[]> = {
        wan: [...counts.wan],
        tong: [...counts.tong],
        tiao: [...counts.tiao],
      };
      c[pairSuit][v] -= 2;

      let totalMelds = 0;
      let totalShapes = 0;
      for (const s of activeSuits) {
        const res = analyzeSuitCounts(c[s], 0);
        totalMelds += res.melds;
        totalShapes += res.shapes;
      }

      const meldsNeeded = targetMelds - totalMelds;
      if (meldsNeeded < 0) continue;
      const effectiveShapes = Math.min(totalShapes, meldsNeeded);
      const remainingCards = (total - 2) - 3 * totalMelds - 2 * totalShapes;

      let xt = 2 * meldsNeeded - effectiveShapes;
      if (remainingCards > 0) {
        xt += Math.ceil(remainingCards / 3);
      }

      best = Math.min(best, xt);
    }
  }

  // 情况2：没有将牌，但存在单张牌可作为"单吊将"候选
  // 没有将牌：手牌中的单张牌可作为"单吊将"候选
  // 如果面子已凑齐（meldsNeeded <= 0），摸同张牌形成对子即胡，向听数=0
  {
    let totalMelds = 0;
    let totalShapes = 0;
    for (const s of activeSuits) {
      const res = analyzeSuitCounts([...counts[s]], 0);
      totalMelds += res.melds;
      totalShapes += res.shapes;
    }

    const meldsNeeded = targetMelds - totalMelds;
    const effectiveShapes = meldsNeeded > 0 ? Math.min(totalShapes, meldsNeeded) : 0;
    const remainingCards = total - 3 * totalMelds - 2 * totalShapes;

    let xt;
    if (meldsNeeded <= 0) {
      // 面子已满足，单张牌作为单吊将，已听牌
      xt = 0;
    } else {
      // 还需要凑面子，没将牌额外+1
      xt = 1 + 2 * meldsNeeded - effectiveShapes;
      if (remainingCards > 0) {
        xt += Math.ceil(remainingCards / 3);
      }
    }

    best = Math.min(best, xt);
  }

  return Math.max(0, best);
}

function calcJinTingMemo(tiles: Tile[], cache: Map<string, number>): number {
  const counts = toSuitCounts(tiles);
  const key = suitCountsToKey(counts);
  if (cache.has(key)) return cache.get(key)!;

  const total = tiles.length;
  if (total === 0) {
    cache.set(key, Infinity);
    return Infinity;
  }

  // 14张牌：先判断是否能和牌，否则需要打一张
  if (total === 14) {
    if (canWin14(counts)) {
      cache.set(key, -1);
      return -1;
    }

    let best = Infinity;
    for (let i = 0; i < tiles.length; i++) {
      const remaining = [...tiles.slice(0, i), ...tiles.slice(i + 1)];
      const xt = calcJinTingMemo(remaining, cache);
      best = Math.min(best, xt);
    }
    cache.set(key, best);
    return best;
  }

  // 其他张数（含13张）：使用经典公式快速计算
  const xt = calcXiangTingSimple(tiles);
  cache.set(key, xt);
  return xt;
}

export function calcJinTing(tiles: Tile[]): number {
  if (tiles.length === 0) return Infinity;
  const cache = new Map<string, number>();
  return calcJinTingMemo(tiles, cache);
}

// ========== 进张分析 ==========

export function calcJinZhang(tiles: Tile[]): WaitingInfo[] {
  if (tiles.length === 0) return [];

  const currentJinTing = calcJinTing(tiles);
  const counts = toSuitCounts(tiles);
  const missingSuits = getMissingSuits(tiles);

  const results: WaitingInfo[] = [];

  // 向听数为0时（听牌），遍历所有可能的摸牌，检查摸牌后是否能胡
  if (currentJinTing === 0) {
    const newTotal = tiles.length + 1;
    for (const suit of SUITS) {
      if (missingSuits.includes(suit)) continue;
      for (let v = 1; v <= 9; v++) {
        const inHand = counts[suit][v - 1];
        if (inHand >= 4) continue;

        const newCounts: Record<Suit, number[]> = {
          wan: [...counts.wan],
          tong: [...counts.tong],
          tiao: [...counts.tiao],
        };
        newCounts[suit][v - 1]++;

        if (canWin(newCounts, newTotal)) {
          results.push({ tile: { suit, value: v }, count: 4 - inHand });
        }
      }
    }
    return results;
  }

  for (const suit of SUITS) {
    if (missingSuits.includes(suit)) continue;
    for (let v = 1; v <= 9; v++) {
      const tile: Tile = { suit, value: v };

      // 检查牌池是否还有剩余（每种4张）
      const inHand = counts[suit][v - 1];
      if (inHand >= 4) continue;

      const newHand = [...tiles, tile];
      const newJinTing = calcJinTing(newHand);

      // 如果摸这张牌能降低进听数，则是有效进张
      if (newJinTing < currentJinTing) {
        results.push({ tile, count: 4 - inHand });
      }
    }
  }

  return results;
}

// ========== 舍牌分析 ==========

export function analyzeDiscard(hand: Tile[], discardIndex: number): AnalysisResult {
  const discardTile = hand[discardIndex];
  const remaining = [...hand.slice(0, discardIndex), ...hand.slice(discardIndex + 1)];

  const jinTing = calcJinTing(remaining);
  const jinZhang = calcJinZhang(remaining);

  const suits = new Set(jinZhang.map(w => w.tile.suit));

  return {
    discardTile,
    jinTing,
    jinZhang,
    jinZhangCount: jinZhang.reduce((sum, w) => sum + w.count, 0),
    jinZhangMen: suits.size,
    jinZhangMian: jinZhang.length,
  };
}

// 判断13张牌是否听牌，并返回听牌信息
export function getTingPaiInfo(hand: Tile[]): TingPaiInfo | null {
  if (hand.length !== 13) return null;
  const jinTing = calcJinTing(hand);
  if (jinTing !== 0) return null;

  const jinZhang = calcJinZhang(hand);
  const suits = new Set(jinZhang.map(w => w.tile.suit));
  return {
    isTing: true,
    jinZhang,
    jinZhangCount: jinZhang.reduce((sum, w) => sum + w.count, 0),
    jinZhangMen: suits.size,
    jinZhangMian: jinZhang.length,
  };
}

// 分析所有可能的舍牌
export function analyzeAllDiscards(hand: Tile[]): BestDiscardResult {
  // 13张牌如果已经听牌，不需要舍牌建议
  const tingPaiInfo = getTingPaiInfo(hand);
  if (tingPaiInfo) {
    return {
      isTingPai: true,
      tingPaiInfo,
      best: null,
      all: [],
    };
  }

  const results: AnalysisResult[] = [];

  // 去重：相同的牌只分析一次
  const analyzed = new Set<string>();

  for (let i = 0; i < hand.length; i++) {
    const key = tileKey(hand[i]);
    if (analyzed.has(key)) continue;
    analyzed.add(key);

    results.push(analyzeDiscard(hand, i));
  }

  // 排序：进听数越低越好，同级则进张数越多越好
  results.sort((a, b) => {
    if (a.jinTing !== b.jinTing) return a.jinTing - b.jinTing;
    return b.jinZhangCount - a.jinZhangCount;
  });

  return {
    isTingPai: false,
    tingPaiInfo: null,
    best: results[0] || null,
    all: results,
  };
}

// 直接分析当前手牌（不打牌）
export function analyzeCurrent(hand: Tile[]): AnalysisResult {
  const jinTing = calcJinTing(hand);
  const jinZhang = calcJinZhang(hand);
  const suits = new Set(jinZhang.map(w => w.tile.suit));

  return {
    discardTile: null,
    jinTing,
    jinZhang,
    jinZhangCount: jinZhang.reduce((sum, w) => sum + w.count, 0),
    jinZhangMen: suits.size,
    jinZhangMian: jinZhang.length,
  };
}
