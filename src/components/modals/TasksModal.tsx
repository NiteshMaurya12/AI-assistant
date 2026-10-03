import React, { useState, useEffect } from 'react';
import { TaskItem } from '../../types';
import { Api } from '../../services/api';
import { CheckSquare, Plus, Trash2, X, Check, Calendar, AlertCircle } from 'lucide-react';

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksUpdated: () => void;
}

export const TasksModal: React.FC<TasksModalProps> = ({
  isOpen,
  onClose,
  onTasksUpdated,
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskItem['priority']>('medium');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await Api.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await Api.addTask({
        title: title.trim(),
        priority,
        dueDate: dueDate || undefined,
      });
      setTitle('');
      setDueDate('');
      await loadTasks();
      onTasksUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComplete = async (task: TaskItem) => {
    try {
      await Api.updateTask(task.id, { completed: !task.completed });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
      );
      onTasksUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await Api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      onTasksUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const priorityStyles: Record<string, string> = {
    high: 'text-red-400 bg-red-950/40 border-red-800/40',
    medium: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    low: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Tasks &amp; Reminders Manager</h2>
              <p className="text-xs text-neutral-400">
                Extracted automatically from chat requests or created directly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* New Task Form */}
          <form onSubmit={handleAdd} className="space-y-3 p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div className="text-xs font-semibold text-neutral-300">Create Task or Reminder</div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to get done? (e.g. Prepare system test suite)"
                className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 focus:outline-none"
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 focus:outline-none"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="ml-auto px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-medium transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>
          </form>

          {/* Filter Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-xs">
              {(['all', 'active', 'completed'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-2.5 py-1 rounded-lg text-xs capitalize transition ${
                    filter === mode
                      ? 'bg-neutral-800 text-white font-medium'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <span className="text-xs text-neutral-500">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {/* Tasks List */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-6 text-xs text-neutral-500">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-neutral-500 italic">
                No tasks in this category.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start justify-between p-3 rounded-xl border transition ${
                    task.completed
                      ? 'bg-neutral-950/40 border-neutral-900 opacity-60'
                      : 'bg-neutral-900/90 border-neutral-800'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 pr-3">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`w-5 h-5 rounded-md mt-0.5 border flex items-center justify-center transition shrink-0 ${
                        task.completed
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'border-neutral-700 hover:border-amber-500'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-medium leading-relaxed ${
                          task.completed ? 'line-through text-neutral-500' : 'text-neutral-200'
                        }`}
                      >
                        {task.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-neutral-400">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold border ${
                            priorityStyles[task.priority] || ''
                          }`}
                        >
                          {task.priority}
                        </span>

                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-neutral-400">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {task.dueDate}</span>
                          </span>
                        )}

                        {task.description && (
                          <span className="text-neutral-500 truncate max-w-xs italic">
                            ({task.description})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(task.id)}
                    title="Delete task"
                    className="p-1 text-neutral-500 hover:text-red-400 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
