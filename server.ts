import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { chatRouter } from './server/routes/chat';
import { voiceRouter } from './server/routes/voice';
import { searchRouter } from './server/routes/search';
import { documentRouter } from './server/routes/document';
import { codeRouter } from './server/routes/code';
import { imageRouter } from './server/routes/image';
import { calculatorRouter } from './server/routes/calculator';
import { memoryRouter } from './server/routes/memory';
import { tasksRouter } from './server/routes/tasks';
import { settingsRouter } from './server/routes/settings';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware for JSON & URL-encoded payloads with base64 audio/image support
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.use('/api/chat', chatRouter);
  app.use('/api/voice', voiceRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/document', documentRouter);
  app.use('/api/code', codeRouter);
  app.use('/api/image', imageRouter);
  app.use('/api/calculator', calculatorRouter);
  app.use('/api/memory', memoryRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/settings', settingsRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'operational',
      engine: 'Aether AI Full-Stack Unified Assistant',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Vite middlewares in development or serve static in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aether AI Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Aether AI Server] Fatal startup error:', err);
  process.exit(1);
});
