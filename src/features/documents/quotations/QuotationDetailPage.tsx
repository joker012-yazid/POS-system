import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, PrinterIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import { getQuotation, updateQuotationStatus, getStatusLabel } from './quotationService';
import { db } from '@/services/storage/db';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { useConfirm } from '@/components/ConfirmDialog';
import { getErrorMessage } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import { formatDate, getDaysUntil } from '@/lib/time';
import type { Quotation, Customer, Device, QuotationStatus } from '@/services/storage/types';
import { clsx } from 'clsx';

const statusColors: Record<QuotationStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-yellow-100 text-yellow-800',
};

export function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) loadQuotation();
  }, [id]);

  const loadQuotation = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await getQuotation(id);
      setQuotation(data);

      const customerData = await db.customers.get(data.customerId);
      setCustomer(customerData || null);

      if (data.deviceId) {
        const deviceData = await db.devices.get(data.deviceId);
        setDevice(deviceData || null);
      }
    } catch (error) {
      addToast('error', getErrorMessage(error));
      navigate('/quotations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: QuotationStatus) => {
    if (!quotation) return;

    const statusLabels: Record<QuotationStatus, string> = {
      draft: 'Draf',
      sent: 'Dihantar',
      accepted: 'Diterima',
      rejected: 'Ditolak',
      expired: 'Tamat Tempoh',
    };

    const confirmed = await confirm({
      title: `Tukar Status ke "${statusLabels[newStatus]}"?`,
      message: `Adakah anda pasti mahu menukar status sebutharga ini?`,
      confirmText: 'Ya, Tukar',
      variant: 'info',
    });

    if (confirmed) {
      try {
        const updated = await updateQuotationStatus(quotation.id, newStatus, user!.id);
        setQuotation(updated);
        addToast('success', `Status ditukar ke "${statusLabels[newStatus]}"`);
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

  if (!quotation) return null;

  const daysLeft = quotation.validUntil ? getDaysUntil(quotation.validUntil) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/quotations')} className="p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{quotation.quotationNo}</h1>
              <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[quotation.status])}>
                {getStatusLabel(quotation.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500">Dicipta {formatDate(quotation.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/quotations/${quotation.id}/print`} className="btn btn-secondary">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Cetak
          </Link>
          {quotation.status === 'accepted' && (
            <Link to={`/invoices/new?quotationId=${quotation.id}`} className="btn btn-primary">
              <DocumentCheckIcon className="h-4 w-4 mr-2" />
              Buat Invois
            </Link>
          )}
        </div>
      </div>

      {/* Status Actions */}
      {quotation.status === 'draft' && (
        <div className="card p-4 flex items-center justify-between bg-gray-50">
          <p className="text-sm text-gray-600">Sebutharga dalam status draf. Tukar status selepas dihantar kepada pelanggan.</p>
          <button onClick={() => handleStatusChange('sent')} className="btn btn-primary text-sm">
            Tandakan Dihantar
          </button>
        </div>
      )}

      {quotation.status === 'sent' && (
        <div className="card p-4 flex items-center justify-between bg-blue-50">
          <p className="text-sm text-blue-700">
            Menunggu respons pelanggan.
            {daysLeft !== null && daysLeft > 0 && ` (${daysLeft} hari lagi)`}
            {daysLeft !== null && daysLeft <= 0 && ' (Tamat tempoh)'}
          </p>
          <div className="flex gap-2">
            <button onClick={() => handleStatusChange('accepted')} className="btn btn-primary text-sm">
              Diterima
            </button>
            <button onClick={() => handleStatusChange('rejected')} className="btn btn-secondary text-sm">
              Ditolak
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Maklumat Pelanggan</h2>
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
                {customer?.address && <p className="text-sm text-gray-500">{customer.address}</p>}
              </div>
              {device && (
                <div>
                  <p className="text-sm text-gray-500">Peranti</p>
                  <Link to={`/devices/${device.id}`} className="font-medium text-primary-600 hover:underline">
                    {device.type} {device.brand && `- ${device.brand}`} {device.model}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Item</h2>
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Keterangan</th>
                  <th className="text-center py-2 text-sm font-medium text-gray-500 w-20">Qty</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500 w-28">Harga</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500 w-28">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {quotation.lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-xs text-gray-500">{item.type === 'service' ? 'Servis' : 'Produk'}</p>
                    </td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{formatMoney(item.unitPriceCents)}</td>
                    <td className="py-3 text-right font-medium">{formatMoney(item.lineTotalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 pt-4 border-t space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subjumlah</span>
                <span>{formatMoney(quotation.subtotalCents)}</span>
              </div>
              {quotation.discountCents > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Diskaun</span>
                  <span>-{formatMoney(quotation.discountCents)}</span>
                </div>
              )}
              {quotation.taxCents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cukai</span>
                  <span>{formatMoney(quotation.taxCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Jumlah</span>
                <span className="text-primary-600">{formatMoney(quotation.totalCents)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Maklumat</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Dicipta</dt>
                <dd>{formatDate(quotation.createdAt)}</dd>
              </div>
              {quotation.validUntil && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Sah Sehingga</dt>
                  <dd className={daysLeft !== null && daysLeft <= 0 ? 'text-red-600' : ''}>
                    {formatDate(quotation.validUntil + 'T00:00:00')}
                  </dd>
                </div>
              )}
              {quotation.jobId && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Job Berkaitan</dt>
                  <dd>
                    <Link to={`/jobs/${quotation.jobId}`} className="text-primary-600 hover:underline">
                      Lihat Job
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
