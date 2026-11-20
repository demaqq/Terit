import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/apiRouter';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), geolocation=(), microphone=()');
  next();
});

// gzip/deflate responses: JS and CSS shrink by roughly 70% on the wire.
app.use(compression());

app.use(express.json({ limit: '1mb' }));

// API endpoints
app.use('/api', apiRouter);

// Serve static assets from dist in production
const distPath = path.basename(__dirname) === 'dist'
  ? __dirname
  : path.resolve(__dirname, 'dist');
// Hashed build files never change, so browsers may keep them for a year; index.html must
// always be revalidated so a new deploy is picked up immediately.
app.use(
  '/assets',
  express.static(path.join(distPath, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false })
);
app.use(
  express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  })
);

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
