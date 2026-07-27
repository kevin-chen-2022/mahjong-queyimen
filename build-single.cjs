// 将 dist/index.html + assets 内联成单个 HTML 文件
// 同时把 SVG tiles 也内联成 data URI，完全自包含
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');
const tilesDir = path.join(distDir, 'tiles');

let html = fs.readFileSync(indexPath, 'utf8');

// 1. 读取所有 SVG tiles，缓存为 data URI
const svgCache = {};
if (fs.existsSync(tilesDir)) {
  for (const file of fs.readdirSync(tilesDir)) {
    if (file.endsWith('.svg')) {
      const svgContent = fs.readFileSync(path.join(tilesDir, file), 'utf8');
      svgCache[file] = 'data:image/svg+xml;base64,' + Buffer.from(svgContent).toString('base64');
    }
  }
  console.log(`缓存 ${Object.keys(svgCache).length} 个 SVG 文件`);
}

// 2. 内联 CSS
html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (match, href) => {
  const cssPath = path.join(distDir, href);
  const css = fs.readFileSync(cssPath, 'utf8');
  return `<style>\n${css}\n</style>`;
});

// 3. 内联 JS，并用正则替换动态 SVG 路径
html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, (match, href) => {
  const jsPath = path.join(distDir, href);
  let js = fs.readFileSync(jsPath, 'utf8');

  // 替换动态拼接的 SVG 路径：`/tiles/${i.suit}-${i.value}.svg`
  // 模式: `/tiles/${变量}-${变量}.svg`
  // 替换为: 一个查找函数，根据 suit-value 返回 data URI
  const suitMap = {
    wan: { 1: 'wan-1.svg', 2: 'wan-2.svg', 3: 'wan-3.svg', 4: 'wan-4.svg', 5: 'wan-5.svg', 6: 'wan-6.svg', 7: 'wan-7.svg', 8: 'wan-8.svg', 9: 'wan-9.svg' },
    tong: { 1: 'tong-1.svg', 2: 'tong-2.svg', 3: 'tong-3.svg', 4: 'tong-4.svg', 5: 'tong-5.svg', 6: 'tong-6.svg', 7: 'tong-7.svg', 8: 'tong-8.svg', 9: 'tong-9.svg' },
    tiao: { 1: 'tiao-1.svg', 2: 'tiao-2.svg', 3: 'tiao-3.svg', 4: 'tiao-4.svg', 5: 'tiao-5.svg', 6: 'tiao-6.svg', 7: 'tiao-7.svg', 8: 'tiao-8.svg', 9: 'tiao-9.svg' },
  };

  // 构建一个 lookup 表注入到 JS 中
  const lookupTable = {};
  for (const [filename, dataUri] of Object.entries(svgCache)) {
    lookupTable[filename] = dataUri;
  }

  // 在 JS 开头注入 lookup 表，并替换路径生成逻辑
  const injectedCode = `
var __SVG_TILES__ = ${JSON.stringify(lookupTable)};
var __getTileSvg = function(suit, value) {
  var key = suit + '-' + value + '.svg';
  return __SVG_TILES__[key] || '';
};
`;

  // 替换 `/tiles/${i.suit}-${i.value}.svg` 为 __getTileSvg(i.suit, i.value)
  // 需要处理不同的变量名（i.suit, i.value 只是其中一种）
  // 匹配模式: `/tiles/${EXPR_SUIT}-${EXPR_VALUE}.svg`
  js = js.replace(/`\/tiles\/\$\{([^}]+)\}-\$\{([^}]+)\}\.svg`/g, (match, suitExpr, valueExpr) => {
    return `__getTileSvg(${suitExpr}, ${valueExpr})`;
  });

  // 也替换可能的静态路径 `/tiles/xxx.svg`
  for (const [filename, dataUri] of Object.entries(svgCache)) {
    js = js.split(`'tiles/${filename}'`).join(`'${dataUri}'`);
    js = js.split(`"tiles/${filename}"`).join(`"${dataUri}"`);
  }

  js = injectedCode + js;

  return `<script type="module">\n${js}\n</script>`;
});

// 4. 替换 HTML 中可能的 SVG 引用（favicon 等）
html = html.replace(/href="\.\/favicon\.svg"/g, () => {
  const faviconPath = path.join(distDir, 'favicon.svg');
  if (fs.existsSync(faviconPath)) {
    const content = fs.readFileSync(faviconPath, 'utf8');
    return `href="data:image/svg+xml;base64,${Buffer.from(content).toString('base64')}"`;
  }
  return 'href="./favicon.svg"';
});

// 5. 内联其他静态图片资源（PNG/JPG 等），如作者赞赏码
const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico'];
const distFiles = fs.readdirSync(distDir);
for (const file of distFiles) {
  const ext = path.extname(file).toLowerCase();
  if (!imageExts.includes(ext)) continue;
  const filePath = path.join(distDir, file);
  const content = fs.readFileSync(filePath);
  const mimeType = ext === '.png' ? 'image/png'
    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.gif' ? 'image/gif'
    : ext === '.webp' ? 'image/webp'
    : ext === '.ico' ? 'image/x-icon'
    : 'application/octet-stream';
  const dataUri = `data:${mimeType};base64,${content.toString('base64')}`;
  // 替换 HTML 和内联 JS 中的路径引用
  // 匹配 src="/xxx.png"  href="/xxx.png"  src="./xxx.png"  以及 JS 中的 "/xxx.png"
  html = html.split(`src="./${file}"`).join(`src="${dataUri}"`);
  html = html.split(`src="/${file}"`).join(`src="${dataUri}"`);
  html = html.split(`href="./${file}"`).join(`href="${dataUri}"`);
  html = html.split(`href="/${file}"`).join(`href="${dataUri}"`);
  // JS 中可能的形式："/xxx.png"
  html = html.split(`"/${file}"`).join(`"${dataUri}"`);
  console.log(`内联图片: ${file} (${(content.length / 1024).toFixed(1)} KB)`);
}

const outputPath = path.join(distDir, 'mahjong-standalone.html');
fs.writeFileSync(outputPath, html, 'utf8');

const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
console.log(`\n生成单文件: ${outputPath}`);
console.log(`文件大小: ${sizeKB} KB`);
