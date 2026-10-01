function parseCell(val) {
  if (!val) return { isUrl: false, text: '', url: '' };
  const urlMatch = val.match(/(https?:\/\/[^\s\)\"\']+)/i);
  if (urlMatch) {
    const url = urlMatch[1];
    let label = val.replace(urlMatch[0], '').replace(/[\(\)\（\）\s]/g, '').trim();
    if (!label) {
      label = val.includes('咨询') ? '咨询购买' : '立即购买';
    }
    return { isUrl: true, text: label, url };
  }
  return { isUrl: false, text: val, url: '' };
}

console.log(parseCell('立即购买 (https://yinxing4.lingdongaff.com/#/?code=mW96wgI4)'));
console.log(parseCell('咨询购买 (https://yinxing4.lingdongaff.com/#/?code=mW96wgI4)'));
console.log(parseCell('¥20/月；¥57/季；¥108/半年'));
