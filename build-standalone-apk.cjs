// 基于 mahjong-standalone.html 生成支持"添加到主屏幕全屏显示"的版本
// 文件名: mahjong-standalone-apk.html
// 主要增强: 内联 manifest (data URI)、完善移动端元标签、移除 Service Worker (file://不可用)
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const inputPath = path.join(distDir, 'mahjong-standalone.html');
const outputPath = path.join(distDir, 'mahjong-standalone-apk.html');
const manifestPath = path.join(distDir, 'manifest.json');
const faviconPath = path.join(distDir, 'favicon.svg');

let html = fs.readFileSync(inputPath, 'utf8');

// 1. 读取并内联 manifest.json 为 data URI
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
// 修改 manifest 中的 start_url 和 scope 适配单文件
manifest.start_url = '.';
manifest.scope = '.';
// 将 icons 中的路径也替换为 data URI
if (fs.existsSync(faviconPath)) {
  const faviconContent = fs.readFileSync(faviconPath, 'utf8');
  const faviconDataUri = 'data:image/svg+xml;base64,' + Buffer.from(faviconContent).toString('base64');
  manifest.icons = [{
    src: faviconDataUri,
    sizes: 'any',
    type: 'image/svg+xml',
    purpose: 'any maskable'
  }];
}
const manifestJson = JSON.stringify(manifest);
const manifestDataUri = 'data:application/manifest+json;base64,' + Buffer.from(manifestJson).toString('base64');

// 2. 替换或添加 <link rel="manifest">
if (html.includes('rel="manifest"')) {
  html = html.replace(/<link rel="manifest"[^>]*>/g,
    `<link rel="manifest" href="${manifestDataUri}" />`);
} else {
  html = html.replace('</head>',
    `  <link rel="manifest" href="${manifestDataUri}" />\n</head>`);
}

// 3. 移除 Service Worker 注册代码 (file:// 协议下不可用)
html = html.replace(
  /<script>\s*if\s*\(['"]serviceWorker['"]\s+in\s+navigator\)[\s\S]*?<\/script>/g,
  ''
);

// 4. 确保完整的移动端元标签 (在 <head> 中添加/覆盖)
const metaTags = [
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />',
  '<meta name="theme-color" content="#d97706" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />',
  '<meta name="apple-mobile-web-app-title" content="麻将训练" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="application-name" content="麻将训练" />',
  '<meta name="apple-touch-fullscreen" content="yes" />',
  '<meta name="format-detection" content="telephone=no" />',
];

// 先移除已有的同名 meta，再统一添加
html = html.replace(/<meta name="viewport"[^>]*\s*\/?>/g, '');
html = html.replace(/<meta name="theme-color"[^>]*\s*\/?>/g, '');
html = html.replace(/<meta name="apple-mobile-web-app-capable"[^>]*\s*\/?>/g, '');
html = html.replace(/<meta name="apple-mobile-web-app-status-bar-style"[^>]*\s*\/?>/g, '');
html = html.replace(/<meta name="apple-mobile-web-app-title"[^>]*\s*\/?>/g, '');

// 在 <title> 之前插入 meta 标签
html = html.replace('<title>', metaTags.join('\n    ') + '\n    <title>');

// 5. 添加 iOS 启动图 (用 favicon 简单生成一个启动画面)
if (fs.existsSync(faviconPath)) {
  const faviconContent = fs.readFileSync(faviconPath, 'utf8');
  const faviconDataUri = 'data:image/svg+xml;base64,' + Buffer.from(faviconContent).toString('base64');
  const appleTouchIcon = `<link rel="apple-touch-icon" href="${faviconDataUri}" />`;
  html = html.replace('<title>', appleTouchIcon + '\n    <title>');
}

// 6. 在 CSS 中添加安全区域适配 (针对 iPhone 刘海屏)
// 找到内联的 <style> 标签，在末尾添加安全区域样式
const safeAreaCss = `
  body { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }
  @media (display-mode: standalone) { body { overscroll-behavior: none; } }
`;
html = html.replace('</style>', safeAreaCss + '</style>');

fs.writeFileSync(outputPath, html, 'utf8');

const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
console.log(`生成单文件 (APK增强版): ${outputPath}`);
console.log(`文件大小: ${sizeKB} KB`);
console.log('');
console.log('功能说明:');
console.log('  ✅ 单文件，双击即用');
console.log('  ✅ 内联 manifest (data URI)，支持"添加到主屏幕"');
console.log('  ✅ iOS/Android 全屏显示 (standalone 模式)');
console.log('  ✅ 适配刘海屏安全区域');
console.log('  ✅ 27个麻将牌全部内联，完全离线可用');
console.log('  ⚠️  Service Worker 在 file:// 下不可用 (但单文件本就不需要)');
