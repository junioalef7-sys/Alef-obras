// OBRIX — Only the Vercel domain is official.
// This file replaces the static Worker only when deployed in the Cloudflare account.
// Recovery URL fragments are browser-only; bridge them with JS, not a server-only redirect.
const ORIGIN = 'https://alef-obras-obrix3.vercel.app';
export default {
  async fetch(request) {
    const original = new URL(request.url);
    const path = original.pathname === '/' || original.pathname === '/index.html'
      ? '/obrix.html' : original.pathname;
    const destination = ORIGIN + path + original.search;
    const mode = request.headers.get('sec-fetch-mode') || '';
    const accept = request.headers.get('accept') || '';
    const navigation = mode === 'navigate' || accept.includes('text/html') ||
      path === '/obrix.html' || path.endsWith('.html');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Método não permitido.', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    if (!navigation || request.method === 'HEAD') {
      return Response.redirect(destination, 307);
    }
    // Preserve the browser-only #access_token= fragment from old recovery links.
    const escaped = JSON.stringify(destination).replace(/</g, '\\u003c');
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>OBRIX — Endereço oficial</title>
<style>body{font:16px system-ui,Arial,sans-serif;background:#0b1826;color:#fff;
margin:0;min-height:100vh;display:grid;place-items:center;padding:20px;text-align:center}
a{color:#8dccff}</style></head><body><main><strong>OBRIX</strong>
<p>Abrindo o endereço oficial do aplicativo…</p>
<a href="${ORIGIN}/obrix.html">Abrir OBRIX</a></main>
<script>location.replace(${escaped} + location.hash);</script></body></html>`;
    return new Response(html, { status: 200, headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate',
      'referrer-policy': 'no-referrer',
      'x-robots-tag': 'noindex, nofollow',
      'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"
    }});
  }
};
