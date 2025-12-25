import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getQuotations, searchQuotations, getStatusLabel } from './quotationService';
import { db } from '@/services/storage/db';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/time';
import type { Quotation, Customer, QuotationStatus } from '@/services/storage/types';
import { clsx } from 'clsx';

const statusColors: Record<QuotationStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-yellow-100 text-yellow-800',
};

export function QuotationsListPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Map<string, Customer>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    setIsLoading(true);
    try {
      const data = await getQuotations();
      setQuotations(data);

      const customerIds = [...new Set(data.map((q) => q.customerId))];
      const customerMap = new Map<string, Customer>();
      for (const id of customerIds) {
        const customer = await db.customers.get(id);
        if (customer) customerMap.set(id, customer);
      }
      setCustomers(customerMap);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchQuotations(query);
      setQuotations(results);
    } else {
      loadQuotations();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sebutharga</h1>
        <Link to="/quotations/new" className="btn btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Sebutharga Baru
        </Link>
      </div>

      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="search"
          placeholder="Cari no. sebutharga..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        </div>
      ) : quotations.length === 0 ? (
        <div className="text-center py-12 card p-8">
          <p className="text-gray-500">Tiada sebutharga dijumpai</p>
          <Link to="/quotations/new" className="mt-4 btn btn-primary inline-flex">
            Buat Sebutharga Pertama
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. Sebutharga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pelanggan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarikh
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotations.map((quotation) => {
                const customer = customers.get(quotation.customerId);
                return (
                  <tr key={quotation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/quotations/${quotation.id}`}
                        className="text-primary-600 hover:text-primary-700 font-mono font-medium"
                      >
                        {quotation.quotationNo}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {customer?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {formatMoney(quotation.totalCents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          'inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium',
                          statusColors[quotation.status]
                        )}
                      >
                        {getStatusLabel(quotation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(quotation.createdAt)}
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
