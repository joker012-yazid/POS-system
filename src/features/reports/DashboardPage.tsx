import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService, type DashboardStats } from './reportService';
import { formatMoney } from '@/lib/money';
import type { Job, Invoice, Product } from '@/services/storage/types';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, jobs, invoices, products] = await Promise.all([
          reportService.getDashboardStats(),
          reportService.getRecentJobs(5),
          reportService.getUnpaidInvoices(),
          reportService.getLowStockProducts(),
        ]);
        setStats(statsData);
        setRecentJobs(jobs);
        setUnpaidInvoices(invoices.slice(0, 5));
        setLowStockProducts(products.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-6">Memuatkan...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Job Hari Ini"
          value={stats?.jobsToday ?? 0}
          link="/jobs"
          color="blue"
        />
        <StatCard
          title="Job Dalam Proses"
          value={stats?.jobsInProgress ?? 0}
          link="/jobs?status=in_progress"
          color="yellow"
        />
        <StatCard
          title="Invois Belum Bayar"
          value={stats?.unpaidInvoices ?? 0}
          subtitle={formatMoney(stats?.unpaidAmount ?? 0)}
          link="/invoices?status=unpaid"
          color="red"
        />
        <StatCard
          title="Produk Stok Rendah"
          value={stats?.lowStockProducts ?? 0}
          link="/products?low_stock=true"
          color="orange"
        />
      </div>

      {/* Sales Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Jualan Hari Ini</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatMoney(stats?.totalSalesToday ?? 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Jualan Bulan Ini</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatMoney(stats?.totalSalesMonth ?? 0)}
          </p>
        </div>
      </div>

      {/* Recent Jobs & Unpaid Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Job Terkini</h2>
            <Link to="/jobs" className="text-sm text-blue-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="divide-y">
            {recentJobs.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">Tiada job</p>
            ) : (
              recentJobs.map(job => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{job.jobNo}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {job.problemDescription}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Unpaid Invoices */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Invois Belum Bayar</h2>
            <Link to="/invoices" className="text-sm text-blue-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="divide-y">
            {unpaidInvoices.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">Tiada invois belum bayar</p>
            ) : (
              unpaidInvoices.map(inv => (
                <Link
                  key={inv.id}
                  to={`/invoices/${inv.id}`}
                  className="block p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{inv.invoiceNo}</span>
                    <span className="text-red-600 font-medium">
                      {formatMoney(inv.grandTotalCents - inv.paidAmountCents)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Status: {inv.status === 'partially_paid' ? 'Separa Bayar' : 'Belum Bayar'}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-orange-600">Produk Stok Rendah</h2>
            <Link to="/products" className="text-sm text-blue-600 hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="divide-y">
            {lowStockProducts.map(product => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="block p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-orange-600 font-medium">
                    Stok: {product.currentStock} / {product.reorderLevel}
                  </span>
                </div>
                {product.sku && (
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  link: string;
  color: 'blue' | 'yellow' | 'red' | 'orange' | 'green';
}

function StatCard({ title, value, subtitle, link, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    green: 'bg-green-50 border-green-200 text-green-700',
  };

  return (
    <Link
      to={link}
      className={`rounded-lg border p-4 hover:shadow-md transition-shadow ${colorClasses[color]}`}
    >
      <h3 className="text-sm font-medium opacity-80">{title}</h3>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-sm mt-1 opacity-80">{subtitle}</p>}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    received: 'bg-gray-100 text-gray-700',
    diagnose: 'bg-blue-100 text-blue-700',
    quoted: 'bg-purple-100 text-purple-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-green-100 text-green-700',
    closed: 'bg-gray-200 text-gray-600',
  };

  const labels: Record<string, string> = {
    received: 'Diterima',
    diagnose: 'Diagnos',
    quoted: 'Sebutharga',
    in_progress: 'Dalam Proses',
    ready: 'Sedia',
    closed: 'Tutup',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}
