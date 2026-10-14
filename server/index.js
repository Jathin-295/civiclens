import http from 'http';
import { handleApiRequest } from './apiHandler.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  handleApiRequest(req, res).catch((err) => {
    console.error('API Server Error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'INTERNAL_SERVER_ERROR', message: err.message }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`PathAble AI Backend Server running at http://localhost:${PORT}/`);
  console.log(`Gemini API configured: ${Boolean(process.env.GEMINI_API_KEY)}`);
});
