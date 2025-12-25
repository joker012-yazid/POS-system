import { useState, useEffect } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { getAllUsers } from '@/features/auth/authService';
import type { User } from '@/services/storage/types';

interface JobAssignmentProps {
  assignedUserId?: string;
  onAssign?: (userId: string | undefined) => void;
  disabled?: boolean;
}

export function JobAssignment({
  assignedUserId,
  onAssign,
  disabled = false,
}: JobAssignmentProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data.filter((u) => u.isActive));
    } finally {
      setIsLoading(false);
    }
  };

  const assignedUser = users.find((u) => u.id === assignedUserId);

  if (isLoading) {
    return <div className="animate-pulse h-10 bg-gray-200 rounded" />;
  }

  return (
    <div className="space-y-2">
      <label className="label flex items-center gap-2">
        <UserCircleIcon className="h-4 w-4 text-gray-400" />
        Ditugaskan Kepada
      </label>

      {disabled && assignedUser ? (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {assignedUser.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium">{assignedUser.displayName}</span>
        </div>
      ) : disabled ? (
        <p className="text-sm text-gray-500 p-2">Belum ditugaskan</p>
      ) : (
        <select
          value={assignedUserId || ''}
          onChange={(e) => onAssign?.(e.target.value || undefined)}
          className="input"
          disabled={disabled}
        >
          <option value="">Tiada (Belum ditugaskan)</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName} ({user.role})
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
