import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, 'public', 'data');

function serveDataMiddleware(req: any, res: any, next: any) {
  // req.url is relative to the mount point '/data'
  // e.g. for '/data/3-world_bc8000.geojson', req.url = '/3-world_bc8000.geojson'
  const raw = decodeURIComponent(req.url || '');
  // Strip leading slash so path.join works correctly on Windows
  const relative = raw.startsWith('/') ? raw.slice(1) : raw;
  
  if (!relative) { next(); return; }
  
  // Prevent path traversal attacks
  const filePath = path.resolve(dataDir, relative);
  if (!filePath.startsWith(dataDir)) { next(); return; }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    fs.createReadStream(filePath).pipe(res);
  } else {
    next();
  }
}

export default defineConfig({
  base: process.env.BASE_URL || '/Arda/',
  publicDir: 'public',
  plugins: [
    react(),
    {
      name: 'serve-data-dir',
      configureServer(server) {
        server.middlewares.use('/data', serveDataMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use('/data', serveDataMiddleware);
      }
    }
  ],
});

