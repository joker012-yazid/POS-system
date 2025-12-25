import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, TrashIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { getDevice, updateDevice, deleteDevice } from './deviceService';
import { db } from '@/services/storage/db';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { useConfirm } from '@/components/ConfirmDialog';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/time';
import type { Device, Customer, Job } from '@/services/storage/types';

const DEVICE_TYPES = ['Laptop', 'Desktop', 'Printer', 'Monitor', 'Tablet', 'Phone', 'Others'];

export function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [device, setDevice] = useState<Device | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    accessoriesReceived: '',
    complaint: '',
    passwordNote: '',
  });

  useEffect(() => {
    if (id) loadDevice();
  }, [id]);

  const loadDevice = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const deviceData = await getDevice(id);
      setDevice(deviceData);
      setFormData({
        type: deviceData.type,
        brand: deviceData.brand || '',
        model: deviceData.model || '',
        serialNumber: deviceData.serialNumber || '',
        accessoriesReceived: deviceData.accessoriesReceived || '',
        complaint: deviceData.complaint || '',
        passwordNote: deviceData.passwordNote || '',
      });

      // Load customer
      const customerData = await db.customers.get(deviceData.customerId);
      setCustomer(customerData || null);

      // Load jobs for this device
      const jobsData = await db.jobs.where('deviceId').equals(id).toArray();
      setJobs(jobsData);
    } catch (error) {
      addToast('error', getErrorMessage(error));
      navigate('/devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !device) return;

    try {
      const updated = await updateDevice(id, formData, user!.id);
      setDevice(updated);
      setIsEditing(false);
      addToast('success', 'Peranti berjaya dikemaskini');
    } catch (error) {
      addToast('error', getErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!id || !device) return;

    const confirmed = await confirm({
      title: 'Padam Peranti?',
      message: 'Adakah anda pasti mahu memadam peranti ini?',
      confirmText: 'Padam',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await deleteDevice(id, user!.id);
        addToast('success', 'Peranti berjaya dipadam');
        navigate('/devices');
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

  if (!device) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {device.type} {device.brand && `- ${device.brand}`} {device.model}
            </h1>
            {customer && (
              <Link to={`/customers/${customer.id}`} className="text-sm text-gray-500 hover:text-primary-600">
                {customer.name}
              </Link>
            )}
          </div>
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
              <label className="label">Jenis</label>
              <select
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
              <label className="label">No. Siri</label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="label">Jenama</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="label">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="input mt-1"
              />
            </div>
          </div>
          <div>
            <label className="label">Aksesori</label>
            <input
              type="text"
              value={formData.accessoriesReceived}
              onChange={(e) => setFormData({ ...formData, accessoriesReceived: e.target.value })}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="label">Aduan</label>
            <textarea
              rows={3}
              value={formData.complaint}
              onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
              className="input mt-1"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      ) : (
        <div className="card p-6">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">No. Siri</dt>
              <dd className="text-lg font-mono">{device.serialNumber || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Didaftarkan</dt>
              <dd className="text-lg">{formatDate(device.createdAt)}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm text-gray-500">Aksesori Diterima</dt>
              <dd className="text-lg">{device.accessoriesReceived || '-'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm text-gray-500">Aduan</dt>
              <dd className="text-lg">{device.complaint || '-'}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Jobs Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-5 w-5 text-gray-400" />
            Jobs ({jobs.length})
          </h2>
          <Link to={`/jobs/new?deviceId=${device.id}&customerId=${device.customerId}`} className="btn btn-primary text-sm">
            Buat Job Baru
          </Link>
        </div>

        {jobs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Tiada job untuk peranti ini</p>
        ) : (
          <div className="divide-y">
            {jobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-6 px-6">
                <div>
                  <p className="font-medium">{job.jobNo}</p>
                  <p className="text-sm text-gray-500">{formatDate(job.createdAt)}</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                  {job.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
