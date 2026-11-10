import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import fs from 'node:fs';
import path from 'node:path';

function loadLocalEnv() {
  const env = { ...process.env };
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (m) {
          const key = m[1];
          let val = m[2] || '';
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (!env[key]) env[key] = val;
        }
      }
    }
  } catch (_) {}
  return env;
}

function pagesFunctionsDev() {
  return {
    name: 'pages-functions-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        try {
          const env = loadLocalEnv();
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const bodyText = Buffer.concat(chunks).toString();
          const host = req.headers.host || 'localhost:4321';
          const fullUrl = `http://${host}${req.url}`;
          
          const webRequest = new Request(fullUrl, {
            method: req.method,
            headers: req.headers,
            body: ['POST', 'PUT', 'PATCH'].includes(req.method || '') ? bodyText : undefined
          });

          let webResponse;

          if (req.url.startsWith('/api/health')) {
            const mod = await server.ssrLoadModule('/functions/api/health.ts');
            webResponse = req.method === 'OPTIONS' 
              ? await mod.onRequestOptions() 
              : await mod.onRequestGet();
          } else if (req.url.startsWith('/api/generate')) {
            const mod = await server.ssrLoadModule('/functions/api/generate.ts');
            webResponse = req.method === 'OPTIONS'
              ? await mod.onRequestOptions()
              : await mod.onRequestPost({ request: webRequest, env });
          } else {
            return next();
          }

          res.statusCode = webResponse.status;
          webResponse.headers.forEach((val, key) => {
            res.setHeader(key, val);
          });
          const resBody = await webResponse.text();
          res.end(resBody);
        } catch (err) {
          console.error('Error en middleware dev API:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
    }
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [pagesFunctionsDev()]
  }
});
