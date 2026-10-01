import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.html')) {
      results.push(file);
    }
  });
  return results;
}

const htmlFiles = walk(distDir);
let allInternalLinks = new Set();
let brokenLinks = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const hrefMatches = content.match(/href="(\/[^"#?]*)/g) || [];
  hrefMatches.forEach(m => {
    const url = m.replace('href="', '');
    if (url.startsWith('/_astro') || url.startsWith('/favicon') || url.startsWith('/icons')) return;
    allInternalLinks.add(url);
    
    // Check target exists
    let cleanUrl = url;
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
    
    // Possibilities:
    // /dist/cleanUrl/index.html
    // /dist/cleanUrl.html
    // /dist/cleanUrl (if file)
    const p1 = path.join(distDir, cleanUrl, 'index.html');
    const p2 = path.join(distDir, `${cleanUrl}.html`);
    const p3 = path.join(distDir, cleanUrl);
    
    if (!fs.existsSync(p1) && !fs.existsSync(p2) && !fs.existsSync(p3)) {
      brokenLinks.push({ source: file, target: url });
    }
  });
});

console.log(`Checked ${allInternalLinks.size} unique internal routes.`);
console.log(`Broken internal links count: ${brokenLinks.length}`);
if (brokenLinks.length > 0) {
  console.log('Broken links details:', brokenLinks);
}
