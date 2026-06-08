import server from '../dist/server/server.js';
import fs from 'node:fs/promises';
import path from 'node:path';

export default async function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const url = new URL(req.url, `${protocol}://${host}`);

  // Serve static assets from dist/client/assets if they exist
  if (url.pathname.startsWith('/assets/')) {
    try {
      const assetPath = path.join(process.cwd(), 'dist', 'client', url.pathname);
      const content = await fs.readFile(assetPath);
      const ext = path.extname(assetPath);
      const mimes = {
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
      };
      res.setHeader('Content-Type', mimes[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.end(content);
      return;
    } catch (e) {
      // If asset not found, let it fall through or return 404
      console.warn(`Asset not found: ${url.pathname}`);
    }
  }

  // SSR Handler
  const body = (req.method !== 'GET' && req.method !== 'HEAD') ? req : null;

  try {
    const webReq = new Request(url.href, {
      method: req.method,
      headers: req.headers,
      body: body,
      duplex: 'half'
    });

    const webRes = await server.fetch(webReq);

    res.statusCode = webRes.status;
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const arrayBuffer = await webRes.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('SSR Error:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
