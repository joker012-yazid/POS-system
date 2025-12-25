import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, DocumentTextIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import {
  getJob,
  updateJobStatus,
  assignJob,
  updateJobTasks,
  toggleJobTask,
  updateJobNotes,
  getStatusLabel,
} from './jobService';
import { JobStatusStepper, JobStatusBadge } from './JobStatusStepper';
import { JobTasksChecklist } from './JobTasksChecklist';
import { JobAssignment } from './JobAssignment';
import { db } from '@/services/storage/db';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { getErrorMessage } from '@/lib/errors';
import { formatDate, formatDateTime } from '@/lib/time';
import type { Job, Customer, Device, JobStatus } from '@/services/storage/types';

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState({ internalNote: '', customerNote: '' });

  useEffect(() => {
    if (id) loadJob();
  }, [id]);

  const loadJob = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const jobData = await getJob(id);
      setJob(jobData);
      setNotes({
        internalNote: jobData.internalNote || '',
        customerNote: jobData.customerNote || '',
      });

      const customerData = await db.customers.get(jobData.customerId);
      setCustomer(customerData || null);

      const deviceData = await db.devices.get(jobData.deviceId);
      setDevice(deviceData || null);
    } catch (error) {
      addToast('error', getErrorMessage(error));
      navigate('/jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!job) return;
    try {
      const updated = await updateJobStatus(job.id, newStatus, user!.id);
      setJob(updated);
      addToast('success', `Status ditukar ke "${getStatusLabel(newStatus)}"`);
    } catch (error) {
      addToast('error', getErrorMessage(error));
    }
  };

  const handleAssign = async (assignedUserId: string | undefined) => {
    if (!job) return;
    try {
      const updated = await assignJob(job.id, assignedUserId, user!.id);
      setJob(updated);
      addToast('success', assignedUserId ? 'Job ditugaskan' : 'Tugasan dibuang');
    } catch (error) {
      addToast('error', getErrorMessage(error));
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!job) return;
    try {
      const updated = await toggleJobTask(job.id, taskId, user!.id);
      setJob(updated);
    } catch (error) {
      addToast('error', getErrorMessage(error));
    }
  };

  const handleUpdateTasks = async (
    tasks: Array<{ id?: string; title: string; isDone?: boolean }>
  ) => {
    if (!job) return;
    try {
      const updated = await updateJobTasks(job.id, tasks, user!.id);
      setJob(updated);
    } catch (error) {
      addToast('error', getErrorMessage(error));
    }
  };

  const handleSaveNotes = async () => {
    if (!job) return;
    try {
      const updated = await updateJobNotes(job.id, notes, user!.id);
      setJob(updated);
      setIsEditingNotes(false);
      addToast('success', 'Nota disimpan');
    } catch (error) {
      addToast('error', getErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!job) return null;

  const isClosed = job.status === 'closed';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/jobs')} className="p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{job.jobNo}</h1>
              <JobStatusBadge status={job.status} />
            </div>
            <p className="text-sm text-gray-500">Dicipta {formatDateTime(job.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/quotations/new?jobId=${job.id}`} className="btn btn-secondary">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Sebutharga
          </Link>
          <Link to={`/invoices/new?jobId=${job.id}`} className="btn btn-primary">
            <DocumentCheckIcon className="h-4 w-4 mr-2" />
            Invois
          </Link>
        </div>
      </div>

      {/* Status Stepper */}
      <div className="card p-6 pb-10">
        <JobStatusStepper
          currentStatus={job.status}
          onStatusChange={handleStatusChange}
          disabled={isClosed}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Device Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Maklumat Pelanggan & Peranti</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Pelanggan</p>
                {customer ? (
                  <Link to={`/customers/${customer.id}`} className="font-medium text-primary-600 hover:underline">
                    {customer.name}
                  </Link>
                ) : (
                  <p className="text-gray-400">-</p>
                )}
                {customer?.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
              </div>
              <div>
                <p className="text-sm text-gray-500">Peranti</p>
                {device ? (
                  <Link to={`/devices/${device.id}`} className="font-medium text-primary-600 hover:underline">
                    {device.type} {device.brand && `- ${device.brand}`} {device.model}
                  </Link>
                ) : (
                  <p className="text-gray-400">-</p>
                )}
                {device?.serialNumber && (
                  <p className="text-sm text-gray-500 font-mono">S/N: {device.serialNumber}</p>
                )}
              </div>
              {device?.complaint && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Aduan</p>
                  <p className="text-gray-700">{device.complaint}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Senarai Tugas</h2>
            <JobTasksChecklist
              tasks={job.tasks}
              onToggleTask={handleToggleTask}
              onUpdateTasks={handleUpdateTasks}
              editable={!isClosed}
            />
          </div>

          {/* Notes */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nota</h2>
              {!isClosed && (
                <button
                  onClick={() => setIsEditingNotes(!isEditingNotes)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {isEditingNotes ? 'Batal' : 'Edit'}
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-4">
                <div>
                  <label className="label">Nota Pelanggan</label>
                  <textarea
                    rows={3}
                    value={notes.customerNote}
                    onChange={(e) => setNotes({ ...notes, customerNote: e.target.value })}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="label">Nota Dalaman</label>
                  <textarea
                    rows={3}
                    value={notes.internalNote}
                    onChange={(e) => setNotes({ ...notes, internalNote: e.target.value })}
                    className="input mt-1"
                  />
                </div>
                <button onClick={handleSaveNotes} className="btn btn-primary">
                  Simpan Nota
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Nota Pelanggan</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{job.customerNote || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nota Dalaman</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{job.internalNote || '-'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment */}
          <div className="card p-6">
            <JobAssignment
              assignedUserId={job.assignedUserId}
              onAssign={handleAssign}
              disabled={isClosed}
            />
          </div>

          {/* Status History */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Sejarah Status</h2>
            <ol className="relative border-l border-gray-200 ml-2 space-y-4">
              {job.statusHistory
                .slice()
                .reverse()
                .map((event, idx) => (
                  <li key={idx} className="ml-4">
                    <div className="absolute w-3 h-3 bg-primary-600 rounded-full -left-1.5 border-2 border-white" />
                    <p className="text-sm font-medium">{getStatusLabel(event.to)}</p>
                    <time className="text-xs text-gray-500">{formatDateTime(event.changedAt)}</time>
                  </li>
                ))}
            </ol>
          </div>

          {/* Quick Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Maklumat</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Dicipta</dt>
                <dd>{formatDate(job.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Dikemaskini</dt>
                <dd>{formatDate(job.updatedAt)}</dd>
              </div>
              {job.closedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Ditutup</dt>
                  <dd>{formatDate(job.closedAt)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
