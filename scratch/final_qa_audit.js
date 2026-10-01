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
console.log('========================================================');
console.log('🔍 找机场 (ZHAOJICHANG.CYOU) 深度 QA 自动化审计');
console.log('========================================================');
console.log(`1. HTML 页面总数: ${htmlFiles.length}`);

// 1. Airports & Blog counts
const airportPages = htmlFiles.filter(f => f.includes(path.join('dist', 'airport')) && !f.endsWith('airports' + path.sep + 'index.html'));
const blogPages = htmlFiles.filter(f => f.includes(path.join('dist', 'blog')) && !f.endsWith('blog' + path.sep + 'index.html'));
console.log(`2. 机场详情页数量: ${airportPages.length}/31`);
console.log(`3. 深度指南文章数量: ${blogPages.length}/22`);

// 2. Broken links check
let allInternalLinks = new Set();
let brokenLinks = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const hrefMatches = content.match(/href="(\/[^"#?]*)/g) || [];
  hrefMatches.forEach(m => {
    const url = m.replace('href="', '');
    if (url.startsWith('/_astro') || url.startsWith('/favicon') || url.startsWith('/icons')) return;
    allInternalLinks.add(url);
    
    let cleanUrl = url;
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
    
    const p1 = path.join(distDir, cleanUrl, 'index.html');
    const p2 = path.join(distDir, `${cleanUrl}.html`);
    const p3 = path.join(distDir, cleanUrl);
    
    if (!fs.existsSync(p1) && !fs.existsSync(p2) && !fs.existsSync(p3)) {
      brokenLinks.push({ source: file, target: url });
    }
  });
});
console.log(`4. 内部死链检查 (Broken Links): ${brokenLinks.length} 处死链 (已校验 ${allInternalLinks.size} 个唯一路由)`);

// 3. Check 灵动云 (lingdongcloud)
const lingdongHtml = fs.readFileSync(path.join(distDir, 'airport', 'lingdongcloud', 'index.html'), 'utf8');
const lingdongHasRawUrlInText = lingdongHtml.includes('立即购买 (http') || lingdongHtml.includes('咨询购买 (http');
const lingdongHasParsedButton = lingdongHtml.includes('立即购买') && lingdongHtml.includes('href="https://yinxing4.lingdongaff.com');
const lingdongHasMobileCard = lingdongHtml.includes('md:hidden') && lingdongHtml.includes('灵动·拂风');
console.log(`5. 灵动云套餐 URL 解析与排版:`);
console.log(`   - 是否残留原始完整 URL 文本: ${lingdongHasRawUrlInText ? '❌ 存在残留' : '✅ 已完全消除'}`);
console.log(`   - 是否正确渲染为立即购买按钮: ${lingdongHasParsedButton ? '✅ 是' : '❌ 否'}`);
console.log(`   - 移动端卡片式纵向排版 (md:hidden): ${lingdongHasMobileCard ? '✅ 是' : '❌ 否'}`);

// 4. Check 暮光加速 (twilight)
const twilightHtml = fs.readFileSync(path.join(distDir, 'airport', 'twilight', 'index.html'), 'utf8');
const twilightDesktopTable = twilightHtml.includes('hidden md:block') && twilightHtml.includes('overflow-x-auto');
const twilightMobileCard = twilightHtml.includes('md:hidden') && twilightHtml.includes('暮光·标准版');
console.log(`6. 暮光加速 9 列表格移动端适配:`);
console.log(`   - 桌面端局部横向滚动 table (hidden md:block): ${twilightDesktopTable ? '✅ 是' : '❌ 否'}`);
console.log(`   - 手机端转为纵向套餐卡 (md:hidden): ${twilightMobileCard ? '✅ 是' : '❌ 否'}`);

// 5. Check other key airports (可信云, EdgeNova, 隐形人, 飞猫云)
const checkAirports = ['kexin-cloud', 'edgenova', 'invisibles', 'flycat'];
let allKeyAirportsOk = true;
checkAirports.forEach(s => {
  const h = fs.readFileSync(path.join(distDir, 'airport', s, 'index.html'), 'utf8');
  const hasDesktop = h.includes('hidden md:block') && h.includes('overflow-x-auto');
  const hasMobile = h.includes('md:hidden');
  if (!hasDesktop || !hasMobile) allKeyAirportsOk = false;
});
console.log(`7. 可信云 / EdgeNova / 隐形人 / 飞猫云 移动端卡片化与桌面端表格: ${allKeyAirportsOk ? '✅ 全部通过' : '❌ 存在异常'}`);

// 6. Check Gaming / ChatGPT / Netflix filter consistency
const airportsIndexHtml = fs.readFileSync(path.join(distDir, 'airports', 'index.html'), 'utf8');
const filterGamingMatches = (airportsIndexHtml.match(/data-gaming="true"/g) || []).length;
const filterChatgptMatches = (airportsIndexHtml.match(/data-chatgpt="true"/g) || []).length;
const filterNetflixMatches = (airportsIndexHtml.match(/data-netflix="true"/g) || []).length;

const gamingPageHtml = fs.readFileSync(path.join(distDir, 'gaming-airports', 'index.html'), 'utf8');
const gamingPageCountMatch = gamingPageHtml.match(/共\s*(\d+)\s*家/);
const gamingPageCount = gamingPageCountMatch ? parseInt(gamingPageCountMatch[1]) : 0;

const chatgptPageHtml = fs.readFileSync(path.join(distDir, 'chatgpt-airports', 'index.html'), 'utf8');
const chatgptPageCountMatch = chatgptPageHtml.match(/共\s*(\d+)\s*家/);
const chatgptPageCount = chatgptPageCountMatch ? parseInt(chatgptPageCountMatch[1]) : 0;

const netflixPageHtml = fs.readFileSync(path.join(distDir, 'netflix-airports', 'index.html'), 'utf8');
const netflixPageCountMatch = netflixPageHtml.match(/共\s*(\d+)\s*家/);
const netflixPageCount = netflixPageCountMatch ? parseInt(netflixPageCountMatch[1]) : 0;

console.log(`8. 游戏加速筛选一致性:`);
console.log(`   - 机场大全 data-gaming 匹配数: ${filterGamingMatches} 家`);
console.log(`   - /gaming-airports/ 独立页匹配数: ${gamingPageCount} 家`);
console.log(`   - 逻辑与数量是否严格一致: ${filterGamingMatches === gamingPageCount ? '✅ 是' : '❌ 否'}`);

console.log(`9. ChatGPT 筛选一致性:`);
console.log(`   - 机场大全 data-chatgpt 匹配数: ${filterChatgptMatches} 家`);
console.log(`   - /chatgpt-airports/ 独立页匹配数: ${chatgptPageCount} 家`);
console.log(`   - 逻辑与数量是否严格一致: ${filterChatgptMatches === chatgptPageCount ? '✅ 是' : '❌ 否'}`);

console.log(`10. Netflix 筛选一致性:`);
console.log(`   - 机场大全 data-netflix 匹配数: ${filterNetflixMatches} 家`);
console.log(`   - /netflix-airports/ 独立页匹配数: ${netflixPageCount} 家`);
console.log(`   - 逻辑与数量是否严格一致: ${filterNetflixMatches === netflixPageCount ? '✅ 是' : '❌ 否'}`);

// 7. Check SEO & Robots
const searchHtml = fs.readFileSync(path.join(distDir, 'search', 'index.html'), 'utf8');
const notFoundHtml = fs.readFileSync(path.join(distDir, '404.html'), 'utf8');
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

const searchNoindex = searchHtml.includes('content="noindex, follow"');
const notFoundNoindex = notFoundHtml.includes('content="noindex, follow"');
const indexIsIndex = indexHtml.includes('content="index, follow"');

console.log(`11. Robots 协议检查:`);
console.log(`   - /search/ 是否 noindex, follow: ${searchNoindex ? '✅ 是' : '❌ 否'}`);
console.log(`   - /404.html 是否 noindex, follow: ${notFoundNoindex ? '✅ 是' : '❌ 否'}`);
console.log(`   - 首页及常规页面是否 index, follow: ${indexIsIndex ? '✅ 是' : '❌ 否'}`);

// 8. Sitemap XML
const sitemapXml = fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
const sitemapUrls = (sitemapXml.match(/<loc>([^<]+)<\/loc>/g) || []).map(m => m.replace(/<\/?loc>/g, ''));
const sitemapExcludesSearch = !sitemapUrls.some(u => u.includes('/search') || u.includes('404'));
console.log(`12. Sitemap 检查:`);
console.log(`   - Sitemap XML 可索引 URL 总数: ${sitemapUrls.length}`);
console.log(`   - 是否已严格排除 /search/ 与 404: ${sitemapExcludesSearch ? '✅ 是' : '❌ 否'}`);

// 9. FAQ Schema check in articles
let faqSchemaCount = 0;
blogPages.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('"@type":"FAQPage"') || content.includes('"@type": "FAQPage"')) {
    faqSchemaCount++;
  }
});
console.log(`13. FAQPage Schema 结构化数据注入: ${faqSchemaCount}/22 篇文章成功输出 FAQPage JSON-LD`);

// 10. Twitter tags check
const twitterSummary = indexHtml.includes('name="twitter:card" content="summary"');
console.log(`14. Twitter Meta 标签规范 (name="twitter:card" content="summary"): ${twitterSummary ? '✅ 是' : '❌ 否'}`);

// 11. Unattributed promotional claims check
const bannedTerms = ['0丢包', '0 丢包', '4K秒开', '秒开', '绝对稳定', '100%稳定', '100%可用', 'Ping ~15-35ms'];
let bannedCount = 0;
htmlFiles.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  bannedTerms.forEach(t => {
    if (c.includes(t)) {
      console.warn(`Warning: Found "${t}" in ${f}`);
      bannedCount++;
    }
  });
});
console.log(`15. 未经归因的绝对化宣传用词残留: ${bannedCount} 处`);

// 12. Localhost & test domains check
let hostErrors = 0;
htmlFiles.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes('localhost:') || c.includes('127.0.0.1')) hostErrors++;
});
console.log(`16. 本地开发地址 (localhost / 127.0.0.1) 残留: ${hostErrors} 处`);

console.log('========================================================');
