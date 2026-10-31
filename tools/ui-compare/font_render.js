const { chromium } = require('playwright');
const fs = require('fs');

const FONTS = [
  ['Roboto', 400], ['Roboto', 500], ['Roboto', 700],
  ['Inter', 400], ['Inter', 500],
  ['Open Sans', 400], ['Open Sans', 600],
  ['Lato', 400], ['Nunito', 400], ['Nunito Sans', 400],
  ['Poppins', 400], ['Source Sans 3', 400], ['Work Sans', 400],
  ['DM Sans', 400], ['Manrope', 400], ['Public Sans', 400],
  ['IBM Plex Sans', 400], ['Noto Sans', 400], ['Mulish', 400],
  ['Rubik', 400], ['Karla', 400], ['Barlow', 400],
  ['Segoe UI', 400], ['Arial', 400], ['Helvetica', 400],
];

(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: 900, height: 200 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const families = [...new Set(FONTS.map(f => f[0]))];
  const link = families
    .filter(f => !['Segoe UI', 'Arial', 'Helvetica'].includes(f))
    .map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&');
  const html = `<html><head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?${link}&display=block">
    <style>body{margin:0;background:#fff}div{white-space:nowrap;color:#000;line-height:1.2}</style>
  </head><body></body></html>`;
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);

  const out = {};
  for (const [family, weight] of FONTS) {
    const key = family.replace(/ /g, '_') + '_' + weight;
    const el = await p.evaluate(({ family, weight }) => {
      document.body.innerHTML = '';
      const d = document.createElement('div');
      d.textContent = 'Dashboard';
      d.style.fontFamily = `'${family}', sans-serif`;
      d.style.fontWeight = String(weight);
      d.style.fontSize = '64px';
      d.id = 't';
      document.body.appendChild(d);
      const r = d.getBoundingClientRect();
      return { w: r.width, h: r.height };
    }, { family, weight });
    await p.screenshot({ path: `C:/Users/atili/microfinance_cams/artifacts/fonts/${key}.png`, clip: { x: 0, y: 0, width: Math.ceil(el.w) + 4, height: Math.ceil(el.h) + 4 } });
    out[key] = { family, weight, advance: el.w };
  }
  fs.writeFileSync('C:/Users/atili/microfinance_cams/artifacts/fonts/index.json', JSON.stringify(out, null, 2));
  console.log('rendered', Object.keys(out).length);
  await b.close();
})();
