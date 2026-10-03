import { Router } from 'express';
import { Storage } from '../storage';

export const memoryRouter = Router();

memoryRouter.get('/', (_req, res) => {
  res.json(Storage.getMemories());
});

memoryRouter.post('/', (req, res) => {
  const { category = 'preference', content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Memory content is required' });
  }

  const memory = Storage.addMemory(category, content);
  res.json(memory);
});

memoryRouter.put('/:id/toggle', (req, res) => {
  const toggled = Storage.toggleMemory(req.params.id);
  if (!toggled) {
    return res.status(404).json({ error: 'Memory not found' });
  }
  res.json({ success: true });
});

memoryRouter.delete('/:id', (req, res) => {
  const deleted = Storage.deleteMemory(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Memory not found' });
  }
  res.json({ success: true });
});
