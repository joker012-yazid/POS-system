import { useState } from 'react';
import { PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import type { JobTask } from '@/services/storage/types';

interface JobTasksChecklistProps {
  tasks: JobTask[];
  onToggleTask?: (taskId: string) => void;
  onUpdateTasks?: (tasks: Array<{ id?: string; title: string; isDone?: boolean }>) => void;
  editable?: boolean;
}

export function JobTasksChecklist({
  tasks,
  onToggleTask,
  onUpdateTasks,
  editable = false,
}: JobTasksChecklistProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !onUpdateTasks) return;

    const newTasks = [
      ...tasks.map((t) => ({ id: t.id, title: t.title, isDone: t.isDone })),
      { title: newTaskTitle.trim() },
    ];
    onUpdateTasks(newTasks);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const handleRemoveTask = (taskId: string) => {
    if (!onUpdateTasks) return;
    const newTasks = tasks
      .filter((t) => t.id !== taskId)
      .map((t) => ({ id: t.id, title: t.title, isDone: t.isDone }));
    onUpdateTasks(newTasks);
  };

  const completedCount = tasks.filter((t) => t.isDone).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {completedCount}/{tasks.length}
          </span>
        </div>
      )}

      {/* Task list */}
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={clsx(
              'flex items-center gap-3 p-2 rounded-lg transition-colors',
              task.isDone ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
            )}
          >
            <button
              type="button"
              onClick={() => onToggleTask?.(task.id)}
              className="flex-shrink-0"
              disabled={!onToggleTask}
            >
              {task.isDone ? (
                <CheckCircleSolidIcon className="h-6 w-6 text-green-500" />
              ) : (
                <CheckCircleIcon className="h-6 w-6 text-gray-400 hover:text-primary-500" />
              )}
            </button>
            <span
              className={clsx(
                'flex-1 text-sm',
                task.isDone && 'line-through text-gray-400'
              )}
            >
              {task.title}
            </span>
            {editable && (
              <button
                type="button"
                onClick={() => handleRemoveTask(task.id)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Add new task */}
      {editable && (
        <div className="pt-2">
          {isAdding ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Tugas baru..."
                className="flex-1 input text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddTask}
                className="btn btn-primary text-sm py-1"
              >
                Tambah
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewTaskTitle('');
                }}
                className="btn btn-secondary text-sm py-1"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Tugas
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && !editable && (
        <p className="text-sm text-gray-400 text-center py-4">Tiada senarai tugas</p>
      )}
    </div>
  );
}
