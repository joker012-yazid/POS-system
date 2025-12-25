import { useState, useEffect } from 'react';
import { reportService, type DailySummary, type MonthlySummary } from './reportService';
import { formatMoney } from '@/lib/money';

type ReportType = 'daily' | 'monthly';

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (reportType === 'daily') {
          const data = await reportService.getDailySummaries(14);
          setDailySummaries(data);
        } else {
          const data = await reportService.getMonthlySummaries(12);
          setMonthlySummaries(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reportType]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Laporan</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-2 rounded ${
              reportType === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 rounded ${
              reportType === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bulanan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">Memuatkan...</div>
      ) : reportType === 'daily' ? (
        <DailyReportTable data={dailySummaries} />
      ) : (
        <MonthlyReportTable data={monthlySummaries} />
      )}
    </div>
  );
}

function DailyReportTable({ data }: { data: DailySummary[] }) {
  if (data.length === 0) {
    return <p className="text-gray-500">Tiada data</p>;
  }

  const totals = data.reduce(
    (acc, d) => ({
      jobsCreated: acc.jobsCreated + d.jobsCreated,
      jobsClosed: acc.jobsClosed + d.jobsClosed,
      invoicesCreated: acc.invoicesCreated + d.invoicesCreated,
      invoicesPaid: acc.invoicesPaid + d.invoicesPaid,
      totalSales: acc.totalSales + d.totalSales,
      paymentsReceived: acc.paymentsReceived + d.paymentsReceived,
    }),
    { jobsCreated: 0, jobsClosed: 0, invoicesCreated: 0, invoicesPaid: 0, totalSales: 0, paymentsReceived: 0 }
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Tarikh
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Job Baru
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Job Tutup
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Invois Baru
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Invois Bayar
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Jualan
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Bayaran Terima
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map(row => (
            <tr key={row.date} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {formatDate(row.date)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700">
                {row.jobsCreated}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700">
                {row.jobsClosed}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700">
                {row.invoicesCreated}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700">
                {row.invoicesPaid}
              </td>
              <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                {formatMoney(row.totalSales)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-blue-600 font-medium">
                {formatMoney(row.paymentsReceived)}
              </td>
            </tr>
          ))}
          {/* Totals row */}
          <tr className="bg-gray-100 font-semibold">
            <td className="px-4 py-3 text-sm text-gray-900">Jumlah</td>
            <td className="px-4 py-3 text-sm text-right">{totals.jobsCreated}</td>
            <td className="px-4 py-3 text-sm text-right">{totals.jobsClosed}</td>
            <td className="px-4 py-3 text-sm text-right">{totals.invoicesCreated}</td>
            <td className="px-4 py-3 text-sm text-right">{totals.invoicesPaid}</td>
            <td className="px-4 py-3 text-sm text-right text-green-600">
              {formatMoney(totals.totalSales)}
            </td>
            <td className="px-4 py-3 text-sm text-right text-blue-600">
              {formatMoney(totals.paymentsReceived)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function MonthlyReportTable({ data }: { data: MonthlySummary[] }) {
  if (data.length === 0) {
    return <p className="text-gray-500">Tiada data</p>;
  }

  const totals = data.reduce(
    (acc, d) => ({
      totalJobs: acc.totalJobs + d.totalJobs,
      totalInvoices: acc.totalInvoices + d.totalInvoices,
      totalSales: acc.totalSales + d.totalSales,
      totalPayments: acc.totalPayments + d.totalPayments,
    }),
    { totalJobs: 0, totalInvoices: 0, totalSales: 0, totalPayments: 0 }
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Bulan
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Jumlah Job
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Jumlah Invois
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Jualan
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Bayaran
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Purata/Job
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map(row => (
            <tr key={row.month} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {formatMonth(row.month)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700">
                {row.totalJobs}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700">
                {row.totalInvoices}
              </td>
              <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                {formatMoney(row.totalSales)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-blue-600 font-medium">
                {formatMoney(row.totalPayments)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700">
                {formatMoney(row.averageJobValue)}
              </td>
            </tr>
          ))}
          {/* Totals row */}
          <tr className="bg-gray-100 font-semibold">
            <td className="px-4 py-3 text-sm text-gray-900">Jumlah</td>
            <td className="px-4 py-3 text-sm text-right">{totals.totalJobs}</td>
            <td className="px-4 py-3 text-sm text-right">{totals.totalInvoices}</td>
            <td className="px-4 py-3 text-sm text-right text-green-600">
              {formatMoney(totals.totalSales)}
            </td>
            <td className="px-4 py-3 text-sm text-right text-blue-600">
              {formatMoney(totals.totalPayments)}
            </td>
            <td className="px-4 py-3 text-sm text-right text-gray-500">-</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ms-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('ms-MY', {
    month: 'long',
    year: 'numeric',
  });
}
