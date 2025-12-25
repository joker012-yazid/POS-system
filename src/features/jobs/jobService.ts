import { db, generateId, now } from '@/services/storage/db';
import type { Job, JobStatus, JobTask, JobStatusEvent } from '@/services/storage/types';
import type { JobCreate } from '@/services/storage/schemas';
import { NotFoundError, BusinessRuleError } from '@/lib/errors';
import { logAudit } from '@/services/audit/auditService';
import { generateDocumentNumber } from '@/services/documents/numberingService';

// Valid status transitions
const STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  received: ['diagnose', 'closed'],
  diagnose: ['quoted', 'in_progress', 'closed'],
  quoted: ['in_progress', 'closed'],
  in_progress: ['ready', 'closed'],
  ready: ['closed', 'in_progress'],
  closed: [], // Terminal state
};

const STATUS_LABELS: Record<JobStatus, string> = {
  received: 'Diterima',
  diagnose: 'Diagnosis',
  quoted: 'Sebutharga',
  in_progress: 'Dalam Proses',
  ready: 'Siap',
  closed: 'Selesai',
};

export function getStatusLabel(status: JobStatus): string {
  return STATUS_LABELS[status];
}

export function getStatusOrder(): JobStatus[] {
  return ['received', 'diagnose', 'quoted', 'in_progress', 'ready', 'closed'];
}

/**
 * Get all jobs (newest first)
 */
export async function getJobs(): Promise<Job[]> {
  return db.jobs.orderBy('createdAt').reverse().toArray();
}

/**
 * Get jobs filtered by status
 */
export async function getJobsByStatus(status: JobStatus): Promise<Job[]> {
  return db.jobs.where('status').equals(status).reverse().toArray();
}

/**
 * Get active jobs (not closed)
 */
export async function getActiveJobs(): Promise<Job[]> {
  return db.jobs.filter((j) => j.status !== 'closed' && !j.deletedAt).toArray();
}

/**
 * Search jobs by job number
 */
export async function searchJobs(query: string): Promise<Job[]> {
  const upperQuery = query.toUpperCase();
  return db.jobs
    .filter((j) => j.jobNo.includes(upperQuery) && !j.deletedAt)
    .toArray();
}

/**
 * Get job by ID
 */
export async function getJob(id: string): Promise<Job> {
  const job = await db.jobs.get(id);
  if (!job) throw new NotFoundError('Job', id);
  return job;
}

/**
 * Get job by job number
 */
export async function getJobByNumber(jobNo: string): Promise<Job | null> {
  return db.jobs.where('jobNo').equals(jobNo).first() || null;
}

/**
 * Create a new job
 */
export async function createJob(data: JobCreate, userId: string): Promise<Job> {
  const timestamp = now();
  const jobNo = await generateDocumentNumber('job');

  // Create initial tasks
  const tasks: JobTask[] = (data.tasks || []).map((t, idx) => ({
    id: generateId(),
    title: t.title,
    isDone: false,
    order: idx,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  const job: Job = {
    id: generateId(),
    jobNo,
    customerId: data.customerId,
    deviceId: data.deviceId,
    status: 'received',
    assignedUserId: data.assignedUserId,
    tasks,
    internalNote: data.internalNote,
    customerNote: data.customerNote,
    laborCents: 0,
    partsCents: 0,
    discountCents: 0,
    taxCents: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    statusHistory: [
      {
        to: 'received',
        changedAt: timestamp,
        changedByUserId: userId,
      },
    ],
  };

  await db.jobs.add(job);

  await logAudit({
    actorUserId: userId,
    action: 'JOB_CREATED',
    entityType: 'Job',
    entityId: job.id,
    summary: `Job baru: ${jobNo}`,
    metadata: { jobNo, customerId: data.customerId, deviceId: data.deviceId },
  });

  return job;
}

/**
 * Update job status
 */
export async function updateJobStatus(
  id: string,
  newStatus: JobStatus,
  userId: string
): Promise<Job> {
  const job = await getJob(id);

  // Check valid transition
  const allowedTransitions = STATUS_TRANSITIONS[job.status];
  if (!allowedTransitions.includes(newStatus)) {
    throw new BusinessRuleError(
      `Tidak boleh tukar status dari "${getStatusLabel(job.status)}" ke "${getStatusLabel(newStatus)}"`
    );
  }

  const timestamp = now();
  const statusEvent: JobStatusEvent = {
    from: job.status,
    to: newStatus,
    changedAt: timestamp,
    changedByUserId: userId,
  };

  const updated: Job = {
    ...job,
    status: newStatus,
    statusHistory: [...job.statusHistory, statusEvent],
    updatedAt: timestamp,
    closedAt: newStatus === 'closed' ? timestamp : job.closedAt,
  };

  await db.jobs.put(updated);

  await logAudit({
    actorUserId: userId,
    action: 'JOB_STATUS_CHANGED',
    entityType: 'Job',
    entityId: id,
    summary: `Status job ${job.jobNo} ditukar: ${getStatusLabel(job.status)} -> ${getStatusLabel(newStatus)}`,
    metadata: { from: job.status, to: newStatus },
  });

  return updated;
}

/**
 * Assign job to user
 */
export async function assignJob(
  id: string,
  assignedUserId: string | undefined,
  userId: string
): Promise<Job> {
  const job = await getJob(id);

  const updated: Job = {
    ...job,
    assignedUserId,
    updatedAt: now(),
  };

  await db.jobs.put(updated);

  await logAudit({
    actorUserId: userId,
    action: 'JOB_ASSIGNED',
    entityType: 'Job',
    entityId: id,
    summary: assignedUserId
      ? `Job ${job.jobNo} ditugaskan`
      : `Job ${job.jobNo} tugasan dibuang`,
    metadata: { assignedUserId },
  });

  return updated;
}

/**
 * Update job tasks
 */
export async function updateJobTasks(
  id: string,
  tasks: Array<{ id?: string; title: string; isDone?: boolean }>,
  userId: string
): Promise<Job> {
  const job = await getJob(id);
  const timestamp = now();

  const updatedTasks: JobTask[] = tasks.map((t, idx) => {
    const existing = t.id ? job.tasks.find((jt) => jt.id === t.id) : null;
    return {
      id: t.id || generateId(),
      title: t.title,
      isDone: t.isDone ?? existing?.isDone ?? false,
      order: idx,
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp,
    };
  });

  const updated: Job = {
    ...job,
    tasks: updatedTasks,
    updatedAt: timestamp,
  };

  await db.jobs.put(updated);

  return updated;
}

/**
 * Toggle task completion
 */
export async function toggleJobTask(
  jobId: string,
  taskId: string,
  userId: string
): Promise<Job> {
  const job = await getJob(jobId);
  const timestamp = now();

  const updatedTasks = job.tasks.map((t) =>
    t.id === taskId ? { ...t, isDone: !t.isDone, updatedAt: timestamp } : t
  );

  const updated: Job = {
    ...job,
    tasks: updatedTasks,
    updatedAt: timestamp,
  };

  await db.jobs.put(updated);

  return updated;
}

/**
 * Update job notes
 */
export async function updateJobNotes(
  id: string,
  notes: { internalNote?: string; customerNote?: string },
  userId: string
): Promise<Job> {
  const job = await getJob(id);

  const updated: Job = {
    ...job,
    internalNote: notes.internalNote ?? job.internalNote,
    customerNote: notes.customerNote ?? job.customerNote,
    updatedAt: now(),
  };

  await db.jobs.put(updated);

  await logAudit({
    actorUserId: userId,
    action: 'JOB_UPDATED',
    entityType: 'Job',
    entityId: id,
    summary: `Nota job ${job.jobNo} dikemaskini`,
  });

  return updated;
}

/**
 * Update job costs
 */
export async function updateJobCosts(
  id: string,
  costs: {
    laborCents?: number;
    partsCents?: number;
    discountCents?: number;
    taxCents?: number;
  },
  userId: string
): Promise<Job> {
  const job = await getJob(id);

  const updated: Job = {
    ...job,
    laborCents: costs.laborCents ?? job.laborCents,
    partsCents: costs.partsCents ?? job.partsCents,
    discountCents: costs.discountCents ?? job.discountCents,
    taxCents: costs.taxCents ?? job.taxCents,
    updatedAt: now(),
  };

  await db.jobs.put(updated);

  return updated;
}

/**
 * Get jobs for today
 */
export async function getTodayJobs(): Promise<Job[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return db.jobs
    .filter((j) => {
      const created = new Date(j.createdAt);
      return created >= today && created < tomorrow;
    })
    .toArray();
}

/**
 * Get available statuses for transition from current status
 */
export function getAvailableTransitions(currentStatus: JobStatus): JobStatus[] {
  return STATUS_TRANSITIONS[currentStatus];
}
