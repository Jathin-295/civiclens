import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { handleApiRequest } from './server/apiHandler.js';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'gemini-backend-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            handleApiRequest(req, res).catch((err) => {
              console.error('API Error in Vite middleware:', err);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'INTERNAL_SERVER_ERROR', message: err.message }));
              }
            });
          } else {
            next();
          }
        });
      },
    },
  ],
});
