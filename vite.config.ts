import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Plugin to save JSON files from the browser
function saveJsonPlugin() {
  return {
    name: 'save-json',
    configureServer(server: any) {
      server.middlewares.use('/api/save-favorites', async (req: any, res: any, next: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const filePath = path.resolve(__dirname, 'public/data/essencer-favorites.json');
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to save' }));
            }
          });
        } else {
          next();
        }
      });

      server.middlewares.use('/api/save-rankeds', async (req: any, res: any, next: any) => {
        if (req.method === 'POST') {
          console.log('📥 Received request to save rankeds...');
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const filePath = path.resolve(__dirname, 'public/data/rankeds.json');
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
              console.log('✅ Rankeds saved to:', filePath);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              console.log('❌ Error saving rankeds:', e);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to save' }));
            }
          });
        } else {
          next();
        }
      });

      server.middlewares.use('/api/save-masteries', async (req: any, res: any, next: any) => {
        if (req.method === 'POST') {
          console.log('📥 Received request to save masteries...');
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const filePath = path.resolve(__dirname, 'public/data/masteries.json');
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
              console.log('✅ Masteries saved to:', filePath);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } catch (e) {
              console.log('❌ Error saving masteries:', e);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to save' }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saveJsonPlugin()],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api'],
        quietDeps: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  publicDir: 'public',
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  }
})
