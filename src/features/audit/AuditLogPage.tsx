import { useState, useEffect } from 'react';
import { getAuditEvents, searchAuditEvents } from '@/services/audit/auditService';
import { db } from '@/services/storage/db';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { formatDateTime } from '@/lib/time';
import type { AuditEvent, User } from '@/services/storage/types';

export function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await getAuditEvents(200);
      setEvents(data);

      const userIds = [...new Set(data.map((e) => e.actorUserId))];
      const userMap = new Map<string, User>();
      for (const id of userIds) {
        const user = await db.users.get(id);
        if (user) userMap.set(id, user);
      }
      setUsers(userMap);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchAuditEvents(query, 100);
      setEvents(results);
    } else {
      loadEvents();
    }
  };

  const getActionColor = (action: string): string => {
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATED') || action.includes('CHANGED')) return 'bg-blue-100 text-blue-800';
    if (action.includes('DELETED') || action.includes('CANCELLED')) return 'bg-red-100 text-red-800';
    if (action.includes('PAYMENT') || action.includes('RECEIPT')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>

      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="search"
          placeholder="Cari dalam audit log..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 card p-8">
          <p className="text-gray-500">Tiada rekod audit</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Masa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tindakan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ringkasan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => {
                const user = users.get(event.actorUserId);
                return (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(event.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {user?.displayName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getActionColor(event.action)}`}
                      >
                        {event.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {event.summary}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
