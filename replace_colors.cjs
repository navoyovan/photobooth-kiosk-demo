const fs = require('fs');
const path = require('path');

const cssFile = path.join(__dirname, 'src', 'index.css');

let content = fs.readFileSync(cssFile, 'utf-8');

// Remove old variables in :root
content = content.replace(/:root\s*\{[^}]+\}/g, '');

// 1. Accent color
content = content.replace(/var\(--accent-color\)/g, 'rgb(var(--theme-accent-rgb))');
content = content.replace(/var\(--accent-color-glow\)/g, 'rgba(var(--theme-accent-rgb), 0.8)');
content = content.replace(/#00ff3c/gi, 'rgb(var(--theme-accent-rgb))');
content = content.replace(/#00ff00/gi, 'rgb(var(--theme-accent-rgb))');
content = content.replace(/#00FFFF/gi, 'rgb(var(--theme-accent-rgb))');

// 2. Surface Dark
content = content.replace(/var\(--background-dark\)/g, 'rgb(var(--theme-surface-dark-rgb))');
content = content.replace(/#000000/gi, 'rgb(var(--theme-surface-dark-rgb))');
content = content.replace(/#000\b/gi, 'rgb(var(--theme-surface-dark-rgb))');
content = content.replace(/#111111/gi, 'rgb(var(--theme-surface-dark-rgb))');
content = content.replace(/#111\b/gi, 'rgb(var(--theme-surface-dark-rgb))');
content = content.replace(/#1A1A1A/gi, 'rgb(var(--theme-surface-dark-rgb))');
content = content.replace(/#212121/gi, 'rgb(var(--theme-surface-dark-rgb))');
content = content.replace(/#2b2927/gi, 'rgb(var(--theme-surface-dark-rgb))');
content = content.replace(/rgba\(var\(--background-dark-rgb\),\s*([0-9.]+)\)/g, 'rgba(var(--theme-surface-dark-rgb), $1)');

// 3. Surface Light
content = content.replace(/var\(--background-1\)/g, 'rgb(var(--theme-surface-light-rgb))');
content = content.replace(/var\(--background-2\)/g, 'rgb(var(--theme-surface-light-rgb))');
content = content.replace(/#FFFFFF/gi, 'rgb(var(--theme-surface-light-rgb))');
content = content.replace(/#FFF\b/gi, 'rgb(var(--theme-surface-light-rgb))');
content = content.replace(/#f4f2ef/gi, 'rgb(var(--theme-surface-light-rgb))');
content = content.replace(/rgba\(var\(--background-[12]-rgb\),\s*([0-9.]+)\)/g, 'rgba(var(--theme-surface-light-rgb), $1)');

// 4. Text Muted
content = content.replace(/#666666/gi, 'rgb(var(--theme-text-muted-rgb))');
content = content.replace(/#666\b/gi, 'rgb(var(--theme-text-muted-rgb))');
content = content.replace(/#888888/gi, 'rgb(var(--theme-text-muted-rgb))');
content = content.replace(/#888\b/gi, 'rgb(var(--theme-text-muted-rgb))');
content = content.replace(/#A0A0A0/gi, 'rgb(var(--theme-text-muted-rgb))');
content = content.replace(/#D0D0D0/gi, 'rgb(var(--theme-text-muted-rgb))');
content = content.replace(/#8c8984/gi, 'rgb(var(--theme-text-muted-rgb))');

// 5. Colors
content = content.replace(/#ff0000/gi, 'rgba(var(--theme-text-hero-rgb), 0.5)');
content = content.replace(/#ffe6e6/gi, 'rgba(var(--theme-surface-dark-rgb), 0.1)');
content = content.replace(/#eee\b/gi, 'rgba(var(--theme-surface-dark-rgb), 0.1)');
content = content.replace(/#555\b/gi, 'rgb(var(--theme-text-muted-rgb))');

// 7. Alpha consolidations
content = content.replace(/rgba\(0,\s*0,\s*0,\s*([0-9.]+)\)/g, 'rgba(var(--theme-surface-dark-rgb), $1)');
content = content.replace(/rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)/g, 'rgba(var(--theme-surface-light-rgb), $1)');

fs.writeFileSync(cssFile, content, 'utf-8');
console.log('Replaced colors in index.css');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let jsContent = fs.readFileSync(fullPath, 'utf-8');
      const original = jsContent;
      
      jsContent = jsContent.replace(/["']#00FFFF["']/gi, '"rgb(var(--theme-accent-rgb))"');
      jsContent = jsContent.replace(/["']#000000["']/gi, '"rgb(var(--theme-surface-dark-rgb))"');
      jsContent = jsContent.replace(/["']#000["']/gi, '"rgb(var(--theme-surface-dark-rgb))"');
      jsContent = jsContent.replace(/["']#FFFFFF["']/gi, '"rgb(var(--theme-surface-light-rgb))"');
      jsContent = jsContent.replace(/["']#FFF["']/gi, '"rgb(var(--theme-surface-light-rgb))"');
      
      if (original !== jsContent) {
        fs.writeFileSync(fullPath, jsContent, 'utf-8');
        console.log(`Replaced colors in ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
