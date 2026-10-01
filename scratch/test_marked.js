import { marked } from 'marked';

const renderer = {
  table(token) {
    let headerHtml = '';
    token.header.forEach(cell => {
      const align = cell.align ? ` text-${cell.align}` : ' text-left';
      headerHtml += `<th class="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider${align}">${this.parser.parseInline(cell.tokens)}</th>`;
    });
    let bodyHtml = '';
    token.rows.forEach(row => {
      bodyHtml += '<tr class="hover:bg-slate-50/80 transition-colors">';
      row.forEach(cell => {
        const align = cell.align ? ` text-${cell.align}` : ' text-left';
        bodyHtml += `<td class="px-4 py-3 text-xs text-slate-600${align}">${this.parser.parseInline(cell.tokens)}</td>`;
      });
      bodyHtml += '</tr>';
    });

    return `
<div class="overflow-x-auto my-6 rounded-xl border border-slate-200">
  <table class="pro-table min-w-full divide-y divide-slate-200">
    <thead class="bg-slate-50">
      <tr>${headerHtml}</tr>
    </thead>
    <tbody class="divide-y divide-slate-100 bg-white">
      ${bodyHtml}
    </tbody>
  </table>
</div>`;
  },
  heading(token) {
    const text = this.parser.parseInline(token.tokens);
    if (token.depth === 2) {
      return `<h2 class="text-xl font-bold text-slate-900 mt-8 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
  <span class="w-1.5 h-1.5 rounded-full bg-sky-600 inline-block shrink-0"></span>
  <span>${text}</span>
</h2>`;
    }
    if (token.depth === 3) {
      return `<h3 class="text-base font-bold text-slate-800 mt-6 mb-2.5">${text}</h3>`;
    }
    if (token.depth === 1) {
      return `<h1 class="text-2xl font-extrabold text-slate-900 mt-8 mb-4">${text}</h1>`;
    }
    return `<h${token.depth} class="font-bold text-slate-800 my-4">${text}</h${token.depth}>`;
  },
  blockquote(token) {
    return `<blockquote class="border-l-4 border-sky-500 bg-sky-50/60 rounded-r-lg px-4 py-3 my-5 text-xs text-slate-700 leading-relaxed">${this.parser.parse(token.tokens)}</blockquote>`;
  },
  code(token) {
    return `<div class="my-5 rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto border border-slate-800"><pre><code>${token.text}</code></pre></div>`;
  },
  codespan(token) {
    return `<code class="px-1.5 py-0.5 rounded bg-slate-100 text-sky-700 text-xs font-mono font-medium border border-slate-200/60">${token.text}</code>`;
  },
  list(token) {
    const type = token.ordered ? 'ol' : 'ul';
    const listClass = token.ordered ? 'list-decimal list-outside ml-5 space-y-2 text-xs text-slate-700 my-4 leading-relaxed' : 'list-disc list-outside ml-5 space-y-2 text-xs text-slate-700 my-4 leading-relaxed';
    let body = '';
    token.items.forEach(item => {
      body += `<li class="pl-1">${this.parser.parseInline(item.tokens)}</li>`;
    });
    return `<${type} class="${listClass}">${body}</${type}>`;
  },
  paragraph(token) {
    return `<p class="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">${this.parser.parseInline(token.tokens)}</p>`;
  },
  hr(token) {
    return `<hr class="my-8 border-slate-200" />`;
  }
};

marked.use({ renderer, gfm: true, breaks: true });

const testMd = `## 一、四大核心节点地区全面对比

| 节点地区 | 物理延迟 (直连/专线) | 流媒体中文字幕 | AI (ChatGPT) 支持 | 核心优势与适用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **香港 (HK)** | 物理距离近 (极低) | ★★★★★ (最全) | ❌ 官方不支持 | 日常网页响应迅速、国内访问物理距离近、港台流媒体 |
| **日本 (JP)** | 距离较近 (低) | ★★★★☆ (较好) | ✅ 支持访问 | 跨国日服游戏、二次元动漫、低延迟 AI 响应 |

---

* 列表项 1: \`code\`
* 列表项 2

> 提示引用信息
`;

const res = marked.parse(testMd);
console.log('PARSED RESULT:\n', res);
