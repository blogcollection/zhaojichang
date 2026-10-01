import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

function getAllHtmlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllHtmlFiles(fullPath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

async function runAudit() {
  console.log('====================================================');
  console.log('🔍 找机场 (zhaojichang.cyou) SEO 扩展全量审计');
  console.log('====================================================\n');

  const htmlFiles = getAllHtmlFiles(distDir);
  console.log(`[1] 静态构建 HTML 页面总数: ${htmlFiles.length}`);

  // Check blog articles
  const blogDir = path.join(distDir, 'blog');
  const blogSlugs = fs.existsSync(blogDir)
    ? fs.readdirSync(blogDir).filter(f => fs.statSync(path.join(blogDir, f)).isDirectory())
    : [];
  console.log(`[2] 博客文章总数: ${blogSlugs.length}`);

  // Check airport-recommendations and tizi-recommendations
  const hasAirportRec = fs.existsSync(path.join(blogDir, 'airport-recommendations', 'index.html'));
  const hasTiziRec = fs.existsSync(path.join(blogDir, 'tizi-recommendations', 'index.html'));
  console.log(`[3] airport-recommendations 生成状态: ${hasAirportRec ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`[4] tizi-recommendations 生成状态: ${hasTiziRec ? '✅ PASS' : '❌ FAIL'}`);

  // Title / H1 / Body occurrences for "机场推荐" and "梯子推荐"
  let airportRecTitleCount = 0;
  let airportRecH1Count = 0;
  let airportRecBodyCount = 0;

  let tiziRecTitleCount = 0;
  let tiziRecH1Count = 0;
  let tiziRecBodyCount = 0;

  const titleMap = new Map();
  const descMap = new Map();
  let duplicateTitles = 0;
  let duplicateDescs = 0;

  let localhostCount = 0;
  let exampleComCount = 0;

  // Broken internal link check
  const allGeneratedUrls = new Set();
  for (const f of htmlFiles) {
    const rel = path.relative(distDir, f).replace(/\\/g, '/');
    let route = '/' + rel.replace(/index\.html$/, '');
    if (!route.endsWith('/')) route += '/';
    allGeneratedUrls.add(route);
  }

  const internalLinks = [];

  for (const f of htmlFiles) {
    const content = fs.readFileSync(f, 'utf-8');
    const rel = path.relative(distDir, f).replace(/\\/g, '/');

    // Title occurrences
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    const titleText = titleMatch ? titleMatch[1] : '';
    if (titleText.includes('机场推荐')) airportRecTitleCount++;
    if (titleText.includes('梯子推荐')) tiziRecTitleCount++;

    // Title duplication check
    if (titleText) {
      if (titleMap.has(titleText)) {
        duplicateTitles++;
      } else {
        titleMap.set(titleText, rel);
      }
    }

    // Description duplication check
    const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const descText = descMatch ? descMatch[1] : '';
    if (descText) {
      if (descMap.has(descText)) {
        duplicateDescs++;
      } else {
        descMap.set(descText, rel);
      }
    }

    // H1 occurrences
    const h1Match = content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const h1Text = h1Match ? h1Match[1] : '';
    if (h1Text.includes('机场推荐')) airportRecH1Count++;
    if (h1Text.includes('梯子推荐')) tiziRecH1Count++;

    // Body occurrences
    if (content.includes('机场推荐')) airportRecBodyCount++;
    if (content.includes('梯子推荐')) tiziRecBodyCount++;

    // Localhost / example.com
    if (content.includes('localhost:') && !rel.includes('admin')) localhostCount++;
    if (content.includes('example.com')) exampleComCount++;

    // Internal links extraction
    const linkMatches = content.matchAll(/href="(\/[^"#?]*)"/g);
    for (const lm of linkMatches) {
      const link = lm[1];
      if (link.startsWith('/') && !link.startsWith('//')) {
        let normLink = link;
        if (!normLink.endsWith('/') && !normLink.includes('.')) normLink += '/';
        internalLinks.push({ from: rel, to: normLink });
      }
    }
  }

  console.log(`[5] “机场推荐”出现统计: Title(${airportRecTitleCount}) / H1(${airportRecH1Count}) / 正文页面(${airportRecBodyCount})`);
  console.log(`[6] “梯子推荐”出现统计: Title(${tiziRecTitleCount}) / H1(${tiziRecH1Count}) / 正文页面(${tiziRecBodyCount})`);

  // Sitemap check
  const sitemapXmlPath = path.join(distDir, 'sitemap.xml');
  const sitemapContent = fs.existsSync(sitemapXmlPath) ? fs.readFileSync(sitemapXmlPath, 'utf-8') : '';
  const inSitemapAirportRec = sitemapContent.includes('/blog/airport-recommendations/');
  const inSitemapTiziRec = sitemapContent.includes('/blog/tizi-recommendations/');
  const inSitemapU1S1 = sitemapContent.includes('/airport/u1s1/');
  const inSitemapAirport3 = sitemapContent.includes('/airport/airport-3/');

  console.log(`[7] Sitemap 包含 airport-recommendations: ${inSitemapAirportRec ? '✅ YES' : '❌ NO'}`);
  console.log(`[8] Sitemap 包含 tizi-recommendations: ${inSitemapTiziRec ? '✅ YES' : '❌ NO'}`);
  console.log(`[9] Sitemap 包含 /airport/u1s1/: ${inSitemapU1S1 ? '✅ YES' : '❌ NO'}`);
  console.log(`[10] Sitemap 排除 /airport/airport-3/: ${!inSitemapAirport3 ? '✅ YES' : '❌ NO'}`);

  // Canonical and Schema for the 2 new articles
  const airportRecHtml = hasAirportRec ? fs.readFileSync(path.join(blogDir, 'airport-recommendations', 'index.html'), 'utf-8') : '';
  const tiziRecHtml = hasTiziRec ? fs.readFileSync(path.join(blogDir, 'tizi-recommendations', 'index.html'), 'utf-8') : '';

  const airportRecCanonical = airportRecHtml.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1] || 'None';
  const tiziRecCanonical = tiziRecHtml.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1] || 'None';

  const airportHasArticleSchema = airportRecHtml.includes('"@type":"Article"');
  const airportHasFaqSchema = airportRecHtml.includes('"@type":"FAQPage"');
  const tiziHasArticleSchema = tiziRecHtml.includes('"@type":"Article"');
  const tiziHasFaqSchema = tiziRecHtml.includes('"@type":"FAQPage"');

  console.log(`[11] airport-recommendations Canonical: ${airportRecCanonical}`);
  console.log(`[12] tizi-recommendations Canonical: ${tiziRecCanonical}`);
  console.log(`[13] airport-recommendations Schema: Article(${airportHasArticleSchema ? '✅' : '❌'}) / FAQPage(${airportHasFaqSchema ? '✅' : '❌'})`);
  console.log(`[14] tizi-recommendations Schema: Article(${tiziHasArticleSchema ? '✅' : '❌'}) / FAQPage(${tiziHasFaqSchema ? '✅' : '❌'})`);

  // Homepage checks
  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  const homeHasAirportRec = indexHtml.includes('/blog/airport-recommendations/');
  const homeHasTiziRec = indexHtml.includes('/blog/tizi-recommendations/');
  console.log(`[15] 首页包含“机场推荐”入口: ${homeHasAirportRec ? '✅ YES' : '❌ NO'}`);
  console.log(`[16] 首页包含“梯子推荐”入口: ${homeHasTiziRec ? '✅ YES' : '❌ NO'}`);

  // Blog index checks
  const blogIndexHtml = fs.readFileSync(path.join(distDir, 'blog', 'index.html'), 'utf-8');
  const blogHasAirportRec = blogIndexHtml.includes('/blog/airport-recommendations/');
  const blogHasTiziRec = blogIndexHtml.includes('/blog/tizi-recommendations/');
  console.log(`[17] Blog 首页包含“机场推荐”入口: ${blogHasAirportRec ? '✅ YES' : '❌ NO'}`);
  console.log(`[18] Blog 首页包含“梯子推荐”入口: ${blogHasTiziRec ? '✅ YES' : '❌ NO'}`);

  // Footer checks
  const footerAirportRecLink = indexHtml.includes('href="/blog/airport-recommendations/"');
  const footerTiziRecLink = indexHtml.includes('href="/blog/tizi-recommendations/"');
  console.log(`[19] Footer 包含“机场推荐”可点击链接: ${footerAirportRecLink ? '✅ YES' : '❌ NO'}`);
  console.log(`[20] Footer 包含“梯子推荐”可点击链接: ${footerTiziRecLink ? '✅ YES' : '❌ NO'}`);

  // U1S1 slug verification
  const hasU1S1Dir = fs.existsSync(path.join(distDir, 'airport', 'u1s1', 'index.html'));
  const airport3RedirectHtml = fs.existsSync(path.join(distDir, 'airport', 'airport-3', 'index.html'))
    ? fs.readFileSync(path.join(distDir, 'airport', 'airport-3', 'index.html'), 'utf-8')
    : '';
  const isAirport3Redirecting = airport3RedirectHtml.includes('content="0;url=/airport/u1s1/"');
  console.log(`[21] U1S1 使用正式 slug /airport/u1s1/: ${hasU1S1Dir ? '✅ YES' : '❌ NO'}`);
  console.log(`[22] /airport/airport-3/ 301/Refresh 重定向至 /airport/u1s1/: ${isAirport3Redirecting ? '✅ YES' : '❌ NO'}`);

  // Duplicates and Broken Links
  console.log(`[23] Title 重复页面数: ${duplicateTitles}`);
  console.log(`[24] Meta Description 重复页面数: ${duplicateDescs}`);

  let brokenLinks = 0;
  for (const { from, to } of internalLinks) {
    if (to === '/search/' || to.startsWith('/search/?')) continue;
    if (to.endsWith('.xml') || to.endsWith('.png') || to.endsWith('.svg') || to.endsWith('.ico') || to.endsWith('.txt') || to.endsWith('.css') || to.endsWith('.js')) continue;
    if (!allGeneratedUrls.has(to) && !allGeneratedUrls.has(to + '/')) {
      console.log(`    ⚠️ 死链: ${to} (from ${from})`);
      brokenLinks++;
    }
  }
  console.log(`[25] 内部死链 (Broken Links) 数: ${brokenLinks}`);
  console.log(`[26] 残留 localhost 页面数: ${localhostCount}`);
  console.log(`[27] 残留 example.com 页面数: ${exampleComCount}`);

  console.log('\n====================================================');
  console.log('🎉 审计完成！');
  console.log('====================================================');
}

runAudit();
