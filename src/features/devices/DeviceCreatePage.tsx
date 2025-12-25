import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { createDevice } from './deviceService';
import { getCustomers } from '@/features/customers/customerService';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { getErrorMessage } from '@/lib/errors';
import type { Customer } from '@/services/storage/types';

const DEVICE_TYPES = ['Laptop', 'Desktop', 'Printer', 'Monitor', 'Tablet', 'Phone', 'Others'];

export function DeviceCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const preselectedCustomerId = searchParams.get('customerId');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    customerId: preselectedCustomerId || '',
    type: 'Laptop',
    brand: '',
    model: '',
    serialNumber: '',
    accessoriesReceived: '',
    complaint: '',
    passwordNote: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const data = await getCustomers();
    setCustomers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      addToast('error', 'Sila pilih pelanggan');
      return;
    }

    setIsSubmitting(true);

    try {
      const device = await createDevice(
        {
          customerId: formData.customerId,
          type: formData.type,
          brand: formData.brand || undefined,
          model: formData.model || undefined,
          serialNumber: formData.serialNumber || undefined,
          accessoriesReceived: formData.accessoriesReceived || undefined,
          complaint: formData.complaint || undefined,
          passwordNote: formData.passwordNote || undefined,
        },
        user!.id
      );

      addToast('success', 'Peranti berjaya ditambah');
      navigate(`/devices/${device.id}`);
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
        <h1 className="text-2xl font-bold text-gray-900">Tambah Peranti</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label htmlFor="customerId" className="label">
            Pelanggan <span className="text-red-500">*</span>
          </label>
          <select
            id="customerId"
            required
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            className="input mt-1"
          >
            <option value="">Pilih pelanggan</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.phone}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="label">
              Jenis Peranti <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input mt-1"
            >
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="serialNumber" className="label">No. Siri</label>
            <input
              type="text"
              id="serialNumber"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="input mt-1"
              placeholder="S/N"
            />
          </div>

          <div>
            <label htmlFor="brand" className="label">Jenama</label>
            <input
              type="text"
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="input mt-1"
              placeholder="cth: Dell, HP, Asus"
            />
          </div>

          <div>
            <label htmlFor="model" className="label">Model</label>
            <input
              type="text"
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="input mt-1"
              placeholder="cth: Inspiron 15"
            />
          </div>
        </div>

        <div>
          <label htmlFor="accessoriesReceived" className="label">Aksesori Diterima</label>
          <input
            type="text"
            id="accessoriesReceived"
            value={formData.accessoriesReceived}
            onChange={(e) => setFormData({ ...formData, accessoriesReceived: e.target.value })}
            className="input mt-1"
            placeholder="cth: Charger, bag"
          />
        </div>

        <div>
          <label htmlFor="complaint" className="label">Aduan / Masalah</label>
          <textarea
            id="complaint"
            rows={3}
            value={formData.complaint}
            onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
            className="input mt-1"
            placeholder="Terangkan masalah..."
          />
        </div>

        <div>
          <label htmlFor="passwordNote" className="label">
            Nota Password (Opt-in)
            <span className="text-xs text-gray-400 ml-2">Untuk rujukan sahaja</span>
          </label>
          <input
            type="text"
            id="passwordNote"
            value={formData.passwordNote}
            onChange={(e) => setFormData({ ...formData, passwordNote: e.target.value })}
            className="input mt-1"
            placeholder="Jika perlu untuk diagnosis"
          />
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
