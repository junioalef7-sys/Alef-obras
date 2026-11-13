const { chromium, webkit, devices } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ROOT = process.env.OBRIX_ROOT || '.';

async function run(engine, device, name) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage(device || { viewport: { width: 1366, height: 768 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('https://fixture.obrix.test/**', route => {
      const url = route.request().url();
      if (url.endsWith('.webp')) return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"></svg>' });
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><section id="obras"><div data-obrix-capa-id="11111111-1111-4111-8111-111111111111"><img></div></section><div id="listaObras"></div></body></html>' });
    });
    await page.goto('https://fixture.obrix.test/');
    await page.evaluate(() => {
      window.signCount = 0;
      const client = { storage: { from() { return {
        list: async () => ({ data: [{name: 'capa.webp'}], error: null }),
        createSignedUrl: async () => {
          window.signCount++;
          return { data: { signedUrl: 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22/%3E' }, error: null };
        }
      }; } } };
      window.OBRIX_BACKEND = {
        init: async () => client,
        profile: async () => ({ empresa_id: '22222222-2222-4222-8222-222222222222' })
      };
      window.obras = [{ id: '11111111-1111-4111-8111-111111111111' }];
    });
    await page.addScriptTag({ content: fs.readFileSync('obrix-capas-obras.js', 'utf8') });
    await page.waitForFunction(() => window.signCount === 1, null, { timeout: 4000 });
    await page.evaluate(() => {
      window.dispatchEvent(new Event('pageshow'));
      const old = document.querySelector('[data-obrix-capa-id]');
      old.replaceWith(old.cloneNode(true));
    });
    await page.waitForTimeout(500);
    const signed = await page.evaluate(() => window.signCount);
    assert.equal(signed, 1, name + ': returning to the app must reuse the still-valid signed cover URL');

    await page.addScriptTag({ content: fs.readFileSync(ROOT + '/obrix-relatorio-fotografico.js', 'utf8') });
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      window.rafCount = 0;
      const original = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = function(callback) {
        window.rafCount++;
        return original(callback);
      };
    });
    await page.evaluate(async () => {
      const box = document.getElementById('listaObras');
      for (let i = 0; i < 100; i++) {
        const node = document.createElement('span');
        box.appendChild(node);
        await Promise.resolve();
      }
    });
    await page.waitForTimeout(150);
    const paints = await page.evaluate(() => window.rafCount);
    assert.ok(paints <= 4, name + ': 100 rapid mutations should be coalesced into a few frames, got ' + paints);

    await page.waitForTimeout(10000);
    const nodes = await page.evaluate(() => document.querySelectorAll('*').length);
    assert.ok(nodes < 200, name + ': 10-second idle page should not multiply DOM nodes');
    assert.equal(errors.length, 0, name + ': JavaScript errors: ' + errors.join('; '));
    let jsHeapMB = null;
    if (engine === chromium) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Performance.enable');
      const p = await cdp.send('Performance.getMetrics');
      const heap = p.metrics.find(m => m.name === 'JSHeapUsedSize');
      jsHeapMB = heap ? Math.round(heap.value / 1048576 * 100) / 100 : null;
      await cdp.detach();
    }
    console.log(JSON.stringify({ profile: name, signedURLs: signed, framesFor100Mutations: paints, nodesAfter10s: nodes, jsHeapMB, errors: 0, pass: true }));
  } finally {
    await browser.close();
  }
}

Promise.all([
  run(webkit, devices['iPhone 13'], 'iPhone-WebKit'),
  run(chromium, devices['Pixel 7'], 'Android-Chromium'),
  run(chromium, null, 'desktop-Chromium')
]).catch(err => { console.error(err); process.exitCode = 1; });
