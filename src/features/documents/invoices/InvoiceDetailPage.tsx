import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, PrinterIcon, XMarkIcon, ReceiptPercentIcon } from '@heroicons/react/24/outline';
import { getInvoice, cancelInvoice, getStatusLabel } from './invoiceService';
import { getPaymentsForInvoice } from '@/features/payments/paymentService';
import { getReceiptByInvoice, generateReceipt } from '@/features/documents/receipts/receiptService';
import { PaymentForm } from '@/features/payments/PaymentForm';
import { db } from '@/services/storage/db';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { useConfirm } from '@/components/ConfirmDialog';
import { getErrorMessage } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import { formatDate, formatDateTime } from '@/lib/time';
import type { Invoice, Customer, Device, Payment, Receipt, InvoiceStatus } from '@/services/storage/types';
import { clsx } from 'clsx';

const statusColors: Record<InvoiceStatus, string> = {
  unpaid: 'bg-red-100 text-red-800',
  partially_paid: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    if (id) loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const invoiceData = await getInvoice(id);
      setInvoice(invoiceData);

      const [customerData, paymentsData, receiptData] = await Promise.all([
        db.customers.get(invoiceData.customerId),
        getPaymentsForInvoice(id),
        getReceiptByInvoice(id),
      ]);

      setCustomer(customerData || null);
      setPayments(paymentsData);
      setReceipt(receiptData);

      if (invoiceData.deviceId) {
        const deviceData = await db.devices.get(invoiceData.deviceId);
        setDevice(deviceData || null);
      }
    } catch (error) {
      addToast('error', getErrorMessage(error));
      navigate('/invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentRecorded = () => {
    setShowPaymentForm(false);
    loadInvoice();
  };

  const handleCancel = async () => {
    if (!invoice) return;

    const confirmed = await confirm({
      title: 'Batalkan Invois?',
      message: 'Adakah anda pasti mahu membatalkan invois ini? Tindakan ini tidak boleh dibatalkan.',
      confirmText: 'Ya, Batalkan',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await cancelInvoice(invoice.id, 'Dibatalkan oleh pengguna', user!.id);
        addToast('success', 'Invois berjaya dibatalkan');
        loadInvoice();
      } catch (error) {
        addToast('error', getErrorMessage(error));
      }
    }
  };

  const handleGenerateReceipt = async () => {
    if (!invoice || invoice.status !== 'paid') return;

    try {
      const newReceipt = await generateReceipt(invoice.id, user!.id);
      setReceipt(newReceipt);
      addToast('success', `Resit ${newReceipt.receiptNo} berjaya dijana`);
      navigate(`/receipts/${newReceipt.id}/print`);
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

  if (!invoice) return null;

  const canAcceptPayment = invoice.status === 'unpaid' || invoice.status === 'partially_paid';
  const canCancel = invoice.status !== 'paid' && invoice.status !== 'cancelled';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{invoice.invoiceNo}</h1>
              <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[invoice.status])}>
                {getStatusLabel(invoice.status)}
              </span>
            </div>
            <p className="text-sm text-gray-500">Dicipta {formatDateTime(invoice.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/invoices/${invoice.id}/print`} className="btn btn-secondary">
            <PrinterIcon className="h-4 w-4 mr-2" />
            Cetak
          </Link>
          {invoice.status === 'paid' && (
            receipt ? (
              <Link to={`/receipts/${receipt.id}/print`} className="btn btn-primary">
                <ReceiptPercentIcon className="h-4 w-4 mr-2" />
                Lihat Resit
              </Link>
            ) : (
              <button onClick={handleGenerateReceipt} className="btn btn-primary">
                <ReceiptPercentIcon className="h-4 w-4 mr-2" />
                Jana Resit
              </button>
            )
          )}
          {canCancel && (
            <button onClick={handleCancel} className="btn btn-danger">
              <XMarkIcon className="h-4 w-4 mr-2" />
              Batalkan
            </button>
          )}
        </div>
      </div>

      {/* Payment Section */}
      {canAcceptPayment && (
        <div className="card p-4 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-800">Baki: {formatMoney(invoice.balanceCents)}</p>
              <p className="text-sm text-yellow-700">
                Dibayar: {formatMoney(invoice.amountPaidCents)} dari {formatMoney(invoice.totalCents)}
              </p>
            </div>
            <button onClick={() => setShowPaymentForm(true)} className="btn btn-primary">
              Terima Bayaran
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentForm && invoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowPaymentForm(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-semibold mb-4">Terima Bayaran</h2>
              <PaymentForm
                invoiceId={invoice.id}
                balanceCents={invoice.balanceCents}
                onSuccess={handlePaymentRecorded}
                onCancel={() => setShowPaymentForm(false)}
              />
            </div>
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
                {customer && (
                  <Link to={`/customers/${customer.id}`} className="font-medium text-primary-600 hover:underline">
                    {customer.name}
                  </Link>
                )}
                {customer?.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
              </div>
              {device && (
                <div>
                  <p className="text-sm text-gray-500">Peranti</p>
                  <Link to={`/devices/${device.id}`} className="font-medium text-primary-600 hover:underline">
                    {device.type} {device.brand && `- ${device.brand}`}
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
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3">
                      <p className="font-medium">{item.description}</p>
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
                <span>{formatMoney(invoice.subtotalCents)}</span>
              </div>
              {invoice.discountCents > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Diskaun</span>
                  <span>-{formatMoney(invoice.discountCents)}</span>
                </div>
              )}
              {invoice.taxCents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cukai</span>
                  <span>{formatMoney(invoice.taxCents)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Jumlah</span>
                <span className="text-primary-600">{formatMoney(invoice.totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Payments */}
          {payments.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Sejarah Pembayaran</h2>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{formatMoney(payment.amountCents)}</p>
                      <p className="text-sm text-gray-500">
                        {payment.method === 'cash' ? 'Tunai' : 'Online'}
                        {payment.reference && ` - Ref: ${payment.reference}`}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {formatDateTime(payment.receivedAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Maklumat</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Dicipta</dt>
                <dd>{formatDate(invoice.createdAt)}</dd>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Tarikh Akhir</dt>
                  <dd>{formatDate(invoice.dueDate + 'T00:00:00')}</dd>
                </div>
              )}
              {invoice.quotationId && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Sebutharga</dt>
                  <dd>
                    <Link to={`/quotations/${invoice.quotationId}`} className="text-primary-600 hover:underline">
                      Lihat
                    </Link>
                  </dd>
                </div>
              )}
              {invoice.jobId && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Job</dt>
                  <dd>
                    <Link to={`/jobs/${invoice.jobId}`} className="text-primary-600 hover:underline">
                      Lihat
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {invoice.status === 'cancelled' && (
            <div className="card p-6 bg-red-50">
              <h2 className="text-lg font-semibold mb-2 text-red-800">Dibatalkan</h2>
              <p className="text-sm text-red-700">{invoice.cancelReason}</p>
              <p className="text-xs text-red-600 mt-2">
                {invoice.cancelledAt && formatDateTime(invoice.cancelledAt)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
