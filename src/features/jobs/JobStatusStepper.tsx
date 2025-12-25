import { clsx } from 'clsx';
import { CheckIcon } from '@heroicons/react/24/solid';
import type { JobStatus } from '@/services/storage/types';
import { getStatusOrder, getStatusLabel, getAvailableTransitions } from './jobService';

interface JobStatusStepperProps {
  currentStatus: JobStatus;
  onStatusChange?: (newStatus: JobStatus) => void;
  disabled?: boolean;
}

export function JobStatusStepper({
  currentStatus,
  onStatusChange,
  disabled = false,
}: JobStatusStepperProps) {
  const statuses = getStatusOrder();
  const currentIndex = statuses.indexOf(currentStatus);
  const availableTransitions = getAvailableTransitions(currentStatus);

  return (
    <div className="w-full">
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {statuses.map((status, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = status === currentStatus;
            const isClickable = !disabled && availableTransitions.includes(status);

            return (
              <li
                key={status}
                className={clsx('relative', idx !== statuses.length - 1 && 'flex-1')}
              >
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => isClickable && onStatusChange?.(status)}
                    disabled={!isClickable}
                    className={clsx(
                      'relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors',
                      isCompleted && 'bg-primary-600 text-white',
                      isCurrent && 'bg-primary-600 text-white ring-2 ring-primary-300',
                      !isCompleted && !isCurrent && 'bg-gray-200 text-gray-500',
                      isClickable && !isCompleted && !isCurrent && 'hover:bg-primary-100 cursor-pointer',
                      !isClickable && 'cursor-default'
                    )}
                    title={getStatusLabel(status)}
                  >
                    {isCompleted ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </button>

                  {/* Connector line */}
                  {idx !== statuses.length - 1 && (
                    <div
                      className={clsx(
                        'h-0.5 w-full min-w-[2rem]',
                        idx < currentIndex ? 'bg-primary-600' : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>

                {/* Label */}
                <span
                  className={clsx(
                    'absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs',
                    isCurrent ? 'text-primary-600 font-medium' : 'text-gray-500'
                  )}
                >
                  {getStatusLabel(status)}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

// Compact version for list views
export function JobStatusBadge({ status }: { status: JobStatus }) {
  const colorClasses: Record<JobStatus, string> = {
    received: 'bg-blue-100 text-blue-800',
    diagnose: 'bg-yellow-100 text-yellow-800',
    quoted: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    ready: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClasses[status]
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}
