import { Router } from 'express';
import { Storage } from '../storage';

export const tasksRouter = Router();

tasksRouter.get('/', (_req, res) => {
  res.json(Storage.getTasks());
});

tasksRouter.post('/', (req, res) => {
  const { title, priority = 'medium', dueDate, description } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const task = Storage.addTask(title.trim(), priority, dueDate, description);
  res.json(task);
});

tasksRouter.put('/:id', (req, res) => {
  const task = Storage.updateTask(req.params.id, req.body);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

tasksRouter.delete('/:id', (req, res) => {
  const deleted = Storage.deleteTask(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({ success: true });
});
