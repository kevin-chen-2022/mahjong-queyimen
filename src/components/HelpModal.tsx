import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ title, children, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
      >
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        <span className={`text-lg transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-4 py-3 bg-white dark:bg-gray-900">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function HelpModal() {
  const isOpen = useGameStore(s => s.helpModalOpen);
  const closeHelpModal = useGameStore(s => s.closeHelpModal);
  // 手风琴：一次只展开一个，0 表示第一个默认展开
  const [openIndex, setOpenIndex] = useState<number>(0);

  if (!isOpen) return null;

  const handleToggle = (index: number) => {
    setOpenIndex(prev => prev === index ? -1 : index);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-amber-700 dark:text-amber-200">使用说明</h2>
          <button
            onClick={closeHelpModal}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-red-500 hover:text-white text-gray-600 dark:text-gray-400 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <AccordionItem title="🀄 关于本工具" isOpen={openIndex === 0} onToggle={() => handleToggle(0)}>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                本工具是一款成都麻将缺一门训练工具，帮助麻将爱好者分析手牌、计算最佳舍牌策略、查看进听状态，提升实战水平。
              </p>
            </AccordionItem>

            <AccordionItem title="🎯 核心功能" isOpen={openIndex === 1} onToggle={() => handleToggle(1)}>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• <strong>最佳舍牌</strong>：自动分析当前手牌，推荐最佳舍牌策略</li>
                <li>• <strong>向听判断</strong>：计算手牌进听状态，显示进张数量和种类</li>
                <li>• <strong>选牌分析</strong>：分析每种舍牌的听牌面数和进张情况</li>
                <li>• <strong>手动舍牌</strong>：手动选择舍牌，查看分析结果</li>
                <li>• <strong>N面听牌</strong>：生成特定听牌面数的练习手牌</li>
              </ul>
            </AccordionItem>

            <AccordionItem title="📱 选牌操作" isOpen={openIndex === 2} onToggle={() => handleToggle(2)}>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                在"选牌"标签页中，可以通过以下方式设置手牌：
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• <strong>点击选牌</strong>：点击麻将牌图案增加一张，点击角标减少一张</li>
                <li>• <strong>文本输入</strong>：输入格式如 "w123t456"，w=万、t=筒、s=条</li>
                <li>• <strong>快捷按钮</strong>：随机13张、随机14张、一进听牌、二进听牌等</li>
                <li>• <strong>标注功能</strong>：选中手牌后点击"标注"，方便理牌</li>
                <li>• <strong>撤销/重做</strong>：使用"←""→"按钮回退或恢复操作</li>
              </ul>
            </AccordionItem>

            <AccordionItem title="💾 牌组库" isOpen={openIndex === 3} onToggle={() => handleToggle(3)}>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                在"牌组库"标签页中，可以管理保存的牌组：
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• <strong>保存手牌</strong>：从"手牌"页点击"保存"按钮</li>
                <li>• <strong>导入/导出</strong>：标题栏"导入"从文件导入整个牌组库（追加模式，重复自动跳过），"导出"将整个牌组库导出为 JSON 文件</li>
                <li>• <strong>复制/粘贴</strong>：功能按钮区"复制"将当前浏览牌组导出到剪贴板，"粘贴"从剪贴板导入单条牌组</li>
                <li>• <strong>手牌</strong>：点击"手牌"按钮将当前浏览牌组载入到"手牌"标签页</li>
                <li>• <strong>筛选搜索</strong>：按牌数筛选，按描述搜索</li>
              </ul>
            </AccordionItem>

            <AccordionItem title="⚙️ 配置说明" isOpen={openIndex === 4} onToggle={() => handleToggle(4)}>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• <strong>明暗主题</strong>：点击右上角"☀ 浅色"/"🌙 深色"切换</li>
                <li>• <strong>麻将牌显示密度</strong>：点击"配置"按钮，可调节每行显示麻将数量（5-14张），手机默认7张，平板默认14张</li>
              </ul>
            </AccordionItem>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-bold text-amber-700 dark:text-amber-200 mb-3">作者信息</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🐌</span>
                <span className="font-medium text-gray-900 dark:text-white">总在跑步的蜗牛</span>
                <a
                  href="mailto:youxunchen@163.com?subject=成都麻将工具反馈&body="
                  className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                  title="给作者留言"
                >
                  ✉️ 给作者留言
                </a>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                开发维护本工具需要花费大量时间和精力，如果你用了觉得好，可以考虑请作者喝一杯咖啡，谢谢！
              </p>
              <div className="flex justify-center">
                <img
                  src="/作者赞赏码.png"
                  alt="微信赞赏码"
                  className="w-40 h-40 rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
