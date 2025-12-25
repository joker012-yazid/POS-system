import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { createUser } from '@/features/auth/authService';
import { useToast } from '@/components/ToastHost';
import { getErrorMessage } from '@/lib/errors';
import type { Role } from '@/services/storage/types';

export function UserCreatePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    role: 'user' as Role,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      addToast('error', 'Kata laluan tidak sepadan');
      return;
    }

    if (formData.password.length < 4) {
      addToast('error', 'Kata laluan mesti sekurang-kurangnya 4 aksara');
      return;
    }

    setIsSubmitting(true);

    try {
      await createUser(
        formData.username,
        formData.displayName,
        formData.password,
        formData.role
      );

      addToast('success', 'Pengguna berjaya ditambah');
      navigate('/users');
    } catch (error) {
      addToast('error', getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Pengguna</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label htmlFor="username" className="label">
            Nama Pengguna <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="username"
            required
            minLength={3}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="input mt-1"
            placeholder="username"
          />
          <p className="mt-1 text-xs text-gray-500">Digunakan untuk log masuk. Tiada ruang kosong.</p>
        </div>

        <div>
          <label htmlFor="displayName" className="label">
            Nama Paparan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="displayName"
            required
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="input mt-1"
            placeholder="Nama penuh"
          />
        </div>

        <div>
          <label htmlFor="role" className="label">
            Peranan <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            className="input mt-1"
          >
            <option value="user">Pengguna</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="label">
              Kata Laluan <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              required
              minLength={4}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input mt-1"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">
              Sahkan Kata Laluan <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input mt-1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Batal
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
