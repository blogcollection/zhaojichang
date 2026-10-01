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
console.log(`1. Total HTML files found in dist: ${htmlFiles.length}`);

// 1. Airport detail pages
const airportPages = htmlFiles.filter(f => f.includes(path.join('dist', 'airport')) && !f.endsWith('airports' + path.sep + 'index.html'));
console.log(`2. Airport detail pages generated: ${airportPages.length}/31`);

// 2. Blog article pages
const blogPages = htmlFiles.filter(f => f.includes(path.join('dist', 'blog')) && !f.endsWith('blog' + path.sep + 'index.html'));
console.log(`3. Blog article pages generated: ${blogPages.length}/22`);

// 3. Unparsed markdown tokens in HTML
const mdTokens = ['| :--- |', '|:---|', '| --- |', '|---|', '```html', '```typescript', '```markdown', '## 一、', '## 二、', '### 1.'];
let unparsedTokenCount = 0;
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  mdTokens.forEach(t => {
    if (content.includes(t)) {
      console.error(`ERROR: Found unparsed token "${t}" in ${f}`);
      unparsedTokenCount++;
    }
  });
});
console.log(`4. Unparsed markdown tokens in dist HTML: ${unparsedTokenCount}`);

// 4. Verify specific table rendering in two critical articles
const costAnalysisFile = path.join(distDir, 'blog', 'airport-monthly-cost-analysis', 'index.html');
const nodeRegionsFile = path.join(distDir, 'blog', 'node-regions-difference-hk-jp-sg-us', 'index.html');

function checkTableArticle(filePath, name) {
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: ${name} not found!`);
    return false;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const hasTable = content.includes('pro-table') && content.includes('overflow-x-auto');
  const hasRawPipes = content.includes('| **');
  console.log(`5. ${name}: responsive table rendered: ${hasTable}, no raw pipes: ${!hasRawPipes}`);
  return hasTable && !hasRawPipes;
}

const costOk = checkTableArticle(costAnalysisFile, 'airport-monthly-cost-analysis');
const nodeOk = checkTableArticle(nodeRegionsFile, 'node-regions-difference-hk-jp-sg-us');

// 5. Robots meta check
const searchPage = path.join(distDir, 'search', 'index.html');
const notFoundPage = path.join(distDir, '404.html');
const homePage = path.join(distDir, 'index.html');

function getRobotsMeta(filePath) {
  if (!fs.existsSync(filePath)) return 'FILE_NOT_FOUND';
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
  return match ? match[1] : 'NOT_SET';
}

console.log(`6. Robots meta /search/: ${getRobotsMeta(searchPage)}`);
console.log(`7. Robots meta /404.html: ${getRobotsMeta(notFoundPage)}`);
console.log(`8. Robots meta /index.html: ${getRobotsMeta(homePage)}`);

// 6. Check sitemap.xml & sitemap-index.xml
const sitemapPath = path.join(distDir, 'sitemap.xml');
const sitemapIndexPath = path.join(distDir, 'sitemap-index.xml');
let sitemapUrls = [];
if (fs.existsSync(sitemapPath)) {
  const sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  const matches = sitemapXml.match(/<loc>([^<]+)<\/loc>/g) || [];
  sitemapUrls = matches.map(m => m.replace(/<\/?loc>/g, ''));
  console.log(`9. Sitemap XML URL count: ${sitemapUrls.length}`);
  const hasSearch = sitemapUrls.some(u => u.includes('/search'));
  const has404 = sitemapUrls.some(u => u.includes('404'));
  console.log(`10. Sitemap excludes /search/ and 404: ${!hasSearch && !has404}`);
}

// 7. Check banned phrases
const bannedPhrases = ['0丢包', '0 丢包', '4K秒开', '秒开', '完美解锁', '必定', '绝对稳定', '100%稳定', '100%可用', 'Ping ~15-35ms', 'Ping ~40-65ms', 'Ping ~45-70ms', 'Ping ~130-180ms'];
let bannedMatches = 0;
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  bannedPhrases.forEach(p => {
    if (content.includes(p)) {
      console.warn(`WARNING: Found "${p}" in ${f}`);
      bannedMatches++;
    }
  });
});
console.log(`11. Total banned/exaggerated phrases found across all HTML: ${bannedMatches}`);

// 8. Check disclaimer on airport detail pages
let missingDisclaimer = 0;
airportPages.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (!content.includes('未对所有项目进行独立实时测试') && !content.includes('以下线路、解锁与性能信息主要整理自服务商公开资料')) {
    console.warn(`Airport page missing disclaimer: ${f}`);
    missingDisclaimer++;
  }
});
console.log(`12. Airport pages with valid disclaimer: ${airportPages.length - missingDisclaimer}/${airportPages.length}`);

// 9. Check localhost & test domains
let invalidHostCount = 0;
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('localhost:') || content.includes('127.0.0.1')) {
    console.warn(`Localhost found in ${f}`);
    invalidHostCount++;
  }
});
console.log(`13. Files with localhost/127.0.0.1: ${invalidHostCount}`);

// 10. Check robots.txt
const robotsTxtPath = path.join(distDir, 'robots.txt');
if (fs.existsSync(robotsTxtPath)) {
  const txt = fs.readFileSync(robotsTxtPath, 'utf8');
  console.log(`14. robots.txt status: Exists and valid:\n${txt.trim()}`);
}
