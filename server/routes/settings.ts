import { Router } from 'express';
import { Storage } from '../storage';

export const settingsRouter = Router();

settingsRouter.get('/', (_req, res) => {
  res.json(Storage.getSettings());
});

settingsRouter.put('/', (req, res) => {
  const updated = Storage.updateSettings(req.body);
  res.json(updated);
});

// Export all user data (conversations, tasks, memories, settings) as a full backup JSON
settingsRouter.get('/export', (_req, res) => {
  const data = {
    exportDate: new Date().toISOString(),
    conversations: Storage.getAllConversations(),
    memories: Storage.getMemories(),
    tasks: Storage.getTasks(),
    documents: Storage.getDocuments().map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      size: d.size,
      chunksCount: d.chunks.length,
      uploadedAt: d.uploadedAt,
    })),
    settings: Storage.getSettings(),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=aether_assistant_backup.json');
  res.send(JSON.stringify(data, null, 2));
});
