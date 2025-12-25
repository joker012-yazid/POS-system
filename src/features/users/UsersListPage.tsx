import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { getAllUsers, toggleUserActive, resetPassword } from '@/features/auth/authService';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { useConfirm } from '@/components/ConfirmDialog';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/time';
import type { User } from '@/services/storage/types';
import { clsx } from 'clsx';

export function UsersListPage() {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    if (user.id === currentUser?.id) {
      addToast('error', 'Anda tidak boleh menyahaktifkan diri sendiri');
      return;
    }

    const confirmed = await confirm({
      title: user.isActive ? 'Nyahaktifkan Pengguna?' : 'Aktifkan Pengguna?',
      message: user.isActive
        ? `Pengguna "${user.displayName}" tidak akan dapat log masuk.`
        : `Pengguna "${user.displayName}" akan dapat log masuk semula.`,
      confirmText: user.isActive ? 'Nyahaktifkan' : 'Aktifkan',
      variant: user.isActive ? 'warning' : 'info',
    });

    if (confirmed) {
      try {
        await toggleUserActive(userId);
        addToast('success', `Pengguna berjaya ${user.isActive ? 'dinyahaktifkan' : 'diaktifkan'}`);
        loadUsers();
      } catch (error) {
        addToast('error', getErrorMessage(error));
      }
    }
  };

  const handleResetPassword = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const confirmed = await confirm({
      title: 'Reset Password?',
      message: `Password untuk "${user.displayName}" akan ditukar kepada "password123".`,
      confirmText: 'Reset',
      variant: 'warning',
    });

    if (confirmed) {
      try {
        await resetPassword(userId, 'password123');
        addToast('success', 'Password berjaya ditukar kepada "password123"');
      } catch (error) {
        addToast('error', getErrorMessage(error));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pengguna</h1>
        <Link to="/users/new" className="btn btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Tambah Pengguna
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peranan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Log Masuk Terakhir
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{user.displayName}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={clsx(
                        'inline-flex px-2 py-1 text-xs font-medium rounded',
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Pengguna'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <CheckCircleIcon className="h-4 w-4" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <XCircleIcon className="h-4 w-4" />
                        Tidak Aktif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleToggleActive(user.id)}
                      className="text-primary-600 hover:text-primary-700 mr-4"
                      disabled={user.id === currentUser?.id}
                    >
                      {user.isActive ? 'Nyahaktif' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => handleResetPassword(user.id)}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
