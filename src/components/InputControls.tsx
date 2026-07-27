import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { handToText } from '../utils/mahjong';

// 快捷操作按钮组（随机生成、进听、清空等）
export function QuickActions() {
  const tingSides = useGameStore(s => s.tingSides);
  const setTingSides = useGameStore(s => s.setTingSides);
  const generateRandom = useGameStore(s => s.generateRandom);
  const generateTingPai = useGameStore(s => s.generateTingPai);
  const generateJinTing = useGameStore(s => s.generateJinTing);
  const clearHand = useGameStore(s => s.clearHand);
  const hand = useGameStore(s => s.hand);

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      <button
        onClick={() => generateRandom(13)}
        className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
      >随机13张</button>
      <button
        onClick={() => generateRandom(14)}
        className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
      >随机14张</button>
      <button
        onClick={() => generateJinTing(1)}
        className="px-3 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
      >一进听牌</button>
      <button
        onClick={() => generateJinTing(2)}
        className="px-3 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
      >二进听牌</button>
      <button
        onClick={() => generateTingPai(tingSides)}
        className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
      >N面听牌</button>
      <select
        value={String(tingSides)}
        onChange={e => {
          const v = e.target.value;
          setTingSides(v === 'random' ? 'random' : Number(v));
        }}
        className="px-2 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:border-amber-500"
      >
        <option value="random">随机</option>
        {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
          <option key={n} value={String(n)}>{n}面</option>
        ))}
      </select>
      <button
        onClick={clearHand}
        disabled={hand.length === 0}
        className="px-3 py-2 bg-red-800 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
      >
        清空
      </button>
    </div>
  );
}

export default function InputControls() {
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState('');
  const parseInput = useGameStore(s => s.parseInput);
  const clearHand = useGameStore(s => s.clearHand);
  const hand = useGameStore(s => s.hand);
  const confirmSelection = useGameStore(s => s.confirmSelection);

  // 当手牌变化时，更新输入框显示当前手牌的文本格式
  useEffect(() => {
    if (hand.length > 0) {
      setInput(handToText(hand));
    } else {
      setInput('');
    }
    setInputError('');
  }, [hand]);

  // 合法输入正则：只允许 w/m/t/p/b/s/万/筒/饼/条/索 + 1-9数字
  const validCharRegex = /^[wmtpbs]$/i;
  const validCNRegex = /^[万筒饼条索]$/;
  const validDigitRegex = /^[1-9]$/;

  // 实时解析并验证
  const handleChange = (raw: string) => {
    const trimmed = raw.trim();
    // 逐字符校验合法性
    let charError = '';
    for (const ch of trimmed) {
      if (ch === ' ') continue;
      if (!validCharRegex.test(ch) && !validCNRegex.test(ch) && !validDigitRegex.test(ch)) {
        charError = `非法字符："${ch}"`;
        break;
      }
    }
    if (charError) {
      setInputError(charError);
      setInput(raw);
      return;
    }

    // 统计数字数量（每张牌对应一个数字）
    const digitCount = (trimmed.match(/[1-9]/g) || []).length;
    if (digitCount > 14) {
      setInputError(`已输入${digitCount}张牌，最多14张`);
      setInput(raw);
      return;
    }

    setInputError('');
    setInput(raw);
    // 完全实时：每次输入都解析
    if (trimmed) {
      parseInput(trimmed);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-amber-700 dark:text-amber-200 font-semibold text-sm md:text-base">文本输入</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={confirmSelection}
            disabled={hand.length === 0}
            className="relative px-4 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm md:text-base transition-all shadow-lg"
          >
            确定输入
            {hand.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                {hand.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setInput('');
              setInputError('');
              clearHand();
            }}
            disabled={hand.length === 0 && input === ''}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm md:text-base transition-all shadow-lg"
          >
            清空输入
          </button>
        </div>
      </div>
      <input
        type="text"
        value={input}
        onChange={e => handleChange(e.target.value)}
        placeholder="例: w1234t5678s123（实时解析）"
        className={`w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border ${
          inputError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 text-sm`}
      />
      {inputError ? (
        <p className="text-red-500 dark:text-red-400 text-xs">{inputError}</p>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-xs">
          格式: w=万, t/p=筒, s=条，如 w1234t5678s123
        </p>
      )}
    </div>
  );
}
