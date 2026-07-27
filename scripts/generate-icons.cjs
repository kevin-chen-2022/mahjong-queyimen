// 从 public/麻将.svg 生成各分辨率安卓图标 PNG
// 使用 sharp 库渲染 SVG，背景为白色
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const svgPath = path.join(projectRoot, 'public', '麻将.svg');
const resDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

// Android 启动图标各分辨率
const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function main() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const [dir, size] of Object.entries(sizes)) {
    const outDir = path.join(resDir, dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // 先渲染 SVG 到指定尺寸的 PNG（透明背景），再用白色背景合成
    const iconPng = path.join(outDir, 'ic_launcher.png');
    const iconRoundPng = path.join(outDir, 'ic_launcher_round.png');

    // 用白色背景的 SVG 包裹原始 SVG 内容，确保背景为白色
    const wrappedSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#FFFFFF"/>
  <g transform="translate(${size * 0.1}, ${size * 0.1}) scale(${size * 0.8 / 1024})">
    ${svgBuffer.toString('utf8').replace(/<\?xml[^>]*\?>/, '').replace(/<!DOCTYPE[^>]*>/, '').replace(/<svg[^>]*>/, '').replace('</svg>', '')}
  </g>
</svg>`;

    await sharp(Buffer.from(wrappedSvg), { density: 300 })
      .resize(size, size)
      .png()
      .toFile(iconPng);
    await sharp(Buffer.from(wrappedSvg), { density: 300 })
      .resize(size, size)
      .png()
      .toFile(iconRoundPng);

    console.log(`Generated ${dir}: ${size}x${size}`);
  }

  // 生成 foreground PNG（自适应图标前景，108dp 各密度）
  const fgSizes = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432,
  };

  for (const [dir, size] of Object.entries(fgSizes)) {
    const outDir = path.join(resDir, dir);
    const fgPng = path.join(outDir, 'ic_launcher_foreground.png');

    // 前景：透明背景，麻将图案在中心 72/108 区域
    const wrappedSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g transform="translate(${size * 18 / 108}, ${size * 18 / 108}) scale(${size * 72 / 108 / 1024})">
    ${svgBuffer.toString('utf8').replace(/<\?xml[^>]*\?>/, '').replace(/<!DOCTYPE[^>]*>/, '').replace(/<svg[^>]*>/, '').replace('</svg>', '')}
  </g>
</svg>`;

    await sharp(Buffer.from(wrappedSvg), { density: 300 })
      .resize(size, size)
      .png()
      .toFile(fgPng);
    console.log(`Generated foreground ${dir}: ${size}x${size}`);
  }

  console.log('\n所有图标生成完成！');
}

main().catch(err => {
  console.error('生成失败:', err);
  process.exit(1);
});
