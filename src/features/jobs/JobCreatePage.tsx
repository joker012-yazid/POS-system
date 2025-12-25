import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { createJob } from './jobService';
import { getCustomers } from '@/features/customers/customerService';
import { getDevicesByCustomer } from '@/features/devices/deviceService';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { getErrorMessage } from '@/lib/errors';
import type { Customer, Device } from '@/services/storage/types';

export function JobCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const preselectedCustomerId = searchParams.get('customerId');
  const preselectedDeviceId = searchParams.get('deviceId');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [formData, setFormData] = useState({
    customerId: preselectedCustomerId || '',
    deviceId: preselectedDeviceId || '',
    internalNote: '',
    customerNote: '',
    tasks: [] as string[],
  });
  const [newTask, setNewTask] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (formData.customerId) {
      loadDevices(formData.customerId);
    } else {
      setDevices([]);
    }
  }, [formData.customerId]);

  const loadCustomers = async () => {
    const data = await getCustomers();
    setCustomers(data);
  };

  const loadDevices = async (customerId: string) => {
    const data = await getDevicesByCustomer(customerId);
    setDevices(data);
    // If only one device, auto-select
    if (data.length === 1 && !preselectedDeviceId) {
      setFormData((prev) => ({ ...prev, deviceId: data[0].id }));
    }
  };

  const handleAddTask = () => {
    if (newTask.trim()) {
      setFormData((prev) => ({ ...prev, tasks: [...prev.tasks, newTask.trim()] }));
      setNewTask('');
    }
  };

  const handleRemoveTask = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.deviceId) {
      addToast('error', 'Sila pilih pelanggan dan peranti');
      return;
    }

    setIsSubmitting(true);

    try {
      const job = await createJob(
        {
          customerId: formData.customerId,
          deviceId: formData.deviceId,
          internalNote: formData.internalNote || undefined,
          customerNote: formData.customerNote || undefined,
          tasks: formData.tasks.map((title) => ({ title })),
        },
        user!.id
      );

      addToast('success', `Job ${job.jobNo} berjaya dicipta`);
      navigate(`/jobs/${job.id}`);
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
        <h1 className="text-2xl font-bold text-gray-900">Job Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Customer selection */}
        <div>
          <label htmlFor="customerId" className="label">
            Pelanggan <span className="text-red-500">*</span>
          </label>
          <select
            id="customerId"
            required
            value={formData.customerId}
            onChange={(e) =>
              setFormData({ ...formData, customerId: e.target.value, deviceId: '' })
            }
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

        {/* Device selection */}
        <div>
          <label htmlFor="deviceId" className="label">
            Peranti <span className="text-red-500">*</span>
          </label>
          {devices.length === 0 && formData.customerId ? (
            <div className="mt-1 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                Tiada peranti untuk pelanggan ini.{' '}
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/devices/new?customerId=${formData.customerId}`)
                  }
                  className="text-primary-600 underline"
                >
                  Daftarkan peranti baru
                </button>
              </p>
            </div>
          ) : (
            <select
              id="deviceId"
              required
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              className="input mt-1"
              disabled={!formData.customerId}
            >
              <option value="">Pilih peranti</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.type} {d.brand && `- ${d.brand}`} {d.model}
                  {d.serialNumber && ` (${d.serialNumber})`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Tasks */}
        <div>
          <label className="label">Senarai Tugas</label>
          <div className="mt-1 space-y-2">
            {formData.tasks.map((task, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                <span className="flex-1 text-sm">{task}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTask(idx)}
                  className="text-red-500 text-sm"
                >
                  Buang
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Tambah tugas..."
                className="input flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
              />
              <button type="button" onClick={handleAddTask} className="btn btn-secondary">
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customerNote" className="label">
              Nota Pelanggan
              <span className="text-xs text-gray-400 ml-1">(Boleh dicetak)</span>
            </label>
            <textarea
              id="customerNote"
              rows={3}
              value={formData.customerNote}
              onChange={(e) => setFormData({ ...formData, customerNote: e.target.value })}
              className="input mt-1"
              placeholder="Nota untuk pelanggan..."
            />
          </div>

          <div>
            <label htmlFor="internalNote" className="label">
              Nota Dalaman
              <span className="text-xs text-gray-400 ml-1">(Tidak dicetak)</span>
            </label>
            <textarea
              id="internalNote"
              rows={3}
              value={formData.internalNote}
              onChange={(e) => setFormData({ ...formData, internalNote: e.target.value })}
              className="input mt-1"
              placeholder="Nota untuk staf..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Batal
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Mencipta...' : 'Cipta Job'}
          </button>
        </div>
      </form>
    </div>
  );
}
