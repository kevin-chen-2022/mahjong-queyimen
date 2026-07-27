import type { Tile } from '../types';

interface TileIconProps {
  tile: Tile;
  /** 宽度（像素），高度按 200/140 比例自动计算。fill 模式下忽略此值 */
  width?: number;
  /** 是否填满父容器（百分比模式），适用于响应式按钮内的麻将牌 */
  fill?: boolean;
  /** 是否高亮显示（金黄色背景），用于选牌区标识手牌中已有的牌 */
  highlighted?: boolean;
  className?: string;
}

// 统一的麻将牌 SVG 图标组件
// 文件位于 public/tiles/{suit}-{value}.svg
export default function TileIcon({ tile, width = 40, fill = false, highlighted = false, className = '' }: TileIconProps) {
  const src = `/tiles/${tile.suit}-${tile.value}.svg`;
  const alt = `${tile.value}${tile.suit === 'wan' ? '万' : tile.suit === 'tong' ? '筒' : '条'}`;
  // 背景色：手动标注或高亮状态用金黄色，否则白底
  const bgClass = (tile.marked || highlighted)
    ? 'bg-amber-300 dark:bg-amber-600'
    : 'bg-white';

  if (fill) {
    // 填满父容器模式：div 和 img 都用 100% 宽高
    return (
      <div
        className={`inline-flex items-center justify-center rounded shadow-sm overflow-hidden leading-none w-full h-full ${bgClass} ${className}`}
      >
        <img
          src={src}
          className="select-none pointer-events-none block w-full h-full object-contain"
          alt={alt}
          draggable={false}
        />
      </div>
    );
  }

  // 固定像素模式（默认）
  const height = Math.round(width * 200 / 140);
  return (
    <div
      className={`inline-flex items-center justify-center rounded shadow-sm overflow-hidden leading-none ${bgClass} ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <img
        src={src}
        width={width}
        height={height}
        className="select-none pointer-events-none block"
        alt={alt}
        draggable={false}
      />
    </div>
  );
}
