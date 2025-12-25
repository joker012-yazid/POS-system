import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { getCustomerWithDevices, updateCustomer, deleteCustomer } from './customerService';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { useConfirm } from '@/components/ConfirmDialog';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/time';
import type { Customer, Device } from '@/services/storage/types';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    if (id) loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const { customer, devices } = await getCustomerWithDevices(id);
      setCustomer(customer);
      setDevices(devices);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
      });
    } catch (error) {
      addToast('error', getErrorMessage(error));
      navigate('/customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !customer) return;

    try {
      const updated = await updateCustomer(
        id,
        {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address || undefined,
        },
        user!.id
      );
      setCustomer(updated);
      setIsEditing(false);
      addToast('success', 'Pelanggan berjaya dikemaskini');
    } catch (error) {
      addToast('error', getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!id || !customer) return;

    const confirmed = await confirm({
      title: 'Padam Pelanggan?',
      message: `Adakah anda pasti mahu memadam pelanggan "${customer.name}"? Tindakan ini tidak boleh dibatalkan.`,
      confirmText: 'Padam',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteCustomer(id, user!.id);
        addToast('success', 'Pelanggan berjaya dipadam');
        navigate('/customers');
      } catch (error) {
        addToast('error', getErrorMessage(error));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/customers')} className="p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(!isEditing)} className="btn btn-secondary">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            <TrashIcon className="h-4 w-4 mr-2" />
            Padam
          </button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} className="card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nama</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="label">Telefon</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="label">Alamat</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      ) : (
        <div className="card p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">Telefon</dt>
              <dd className="text-lg font-medium">{customer.phone}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-lg">{customer.email || '-'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm text-gray-500">Alamat</dt>
              <dd className="text-lg">{customer.address || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Didaftarkan</dt>
              <dd className="text-lg">{formatDate(customer.createdAt)}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Devices Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ComputerDesktopIcon className="h-5 w-5 text-gray-400" />
            Peranti ({devices.length})
          </h2>
          <Link
            to={`/devices/new?customerId=${customer.id}`}
            className="btn btn-primary text-sm"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Tambah Peranti
          </Link>
        </div>

        {devices.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Tiada peranti didaftarkan</p>
        ) : (
          <div className="divide-y">
            {devices.map((device) => (
              <Link
                key={device.id}
                to={`/devices/${device.id}`}
                className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-6 px-6"
              >
                <div>
                  <p className="font-medium">{device.type}</p>
                  <p className="text-sm text-gray-500">
                    {[device.brand, device.model].filter(Boolean).join(' ') || 'Tiada maklumat'}
                  </p>
                </div>
                {device.serialNumber && (
                  <span className="text-sm text-gray-400">S/N: {device.serialNumber}</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
