import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { getReceiptWithDetails } from './receiptService';
import { getMethodLabel } from '@/features/payments/paymentService';
import { getCompanyProfile } from '@/features/settings/settingsService';
import { db } from '@/services/storage/db';
import { formatMoney } from '@/lib/money';
import { formatDocumentDate, formatDateTime } from '@/lib/time';
import type { Receipt, Invoice, Payment, Customer, CompanyProfile } from '@/services/storage/types';

export function ReceiptPrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [receiptData, companyData] = await Promise.all([
        getReceiptWithDetails(id),
        getCompanyProfile(),
      ]);
      setReceipt(receiptData.receipt);
      setInvoice(receiptData.invoice);
      setPayments(receiptData.payments);
      setCompany(companyData);

      const customerData = await db.customers.get(receiptData.invoice.customerId);
      setCustomer(customerData || null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!receipt || !invoice) return null;

  return (
    <>
      <div className="no-print mb-6 flex items-center justify-between max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-5 w-5" />
          Kembali
        </button>
        <button onClick={handlePrint} className="btn btn-primary">
          <PrinterIcon className="h-5 w-5 mr-2" />
          Cetak
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 print:p-0 print:max-w-none">
        <div className="print:p-8" style={{ minHeight: '297mm' }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {company?.logoDataUrl && <img src={company.logoDataUrl} alt="Logo" className="h-16 mb-2" />}
              <h1 className="text-xl font-bold">{company?.name || 'Syarikat'}</h1>
              {company?.address && <p className="text-sm text-gray-600">{company.address}</p>}
              {company?.phone && <p className="text-sm text-gray-600">Tel: {company.phone}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-green-600">RESIT</h2>
              <p className="text-lg font-mono mt-2">{receipt.receiptNo}</p>
              <p className="text-sm text-gray-600 mt-1">Tarikh: {formatDocumentDate(receipt.paidAt)}</p>
              <p className="text-sm text-gray-600">Invois: {invoice.invoiceNo}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg print:bg-gray-100">
            <h3 className="font-semibold text-sm text-gray-500 mb-2">DITERIMA DARI:</h3>
            <p className="font-medium text-lg">{customer?.name}</p>
            {customer?.phone && <p className="text-sm">{customer.phone}</p>}
            {customer?.address && <p className="text-sm">{customer.address}</p>}
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <h3 className="font-semibold text-sm text-gray-500 mb-3">ITEM:</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 text-sm font-semibold">Keterangan</th>
                  <th className="text-center py-2 text-sm font-semibold w-20">Qty</th>
                  <th className="text-right py-2 text-sm font-semibold w-28">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{formatMoney(item.lineTotalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subjumlah</span>
                <span>{formatMoney(invoice.subtotalCents)}</span>
              </div>
              {invoice.discountCents > 0 && (
                <div className="flex justify-between py-1 text-red-600">
                  <span>Diskaun</span>
                  <span>-{formatMoney(invoice.discountCents)}</span>
                </div>
              )}
              {invoice.taxCents > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Cukai</span>
                  <span>{formatMoney(invoice.taxCents)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-gray-300 text-lg font-bold">
                <span>JUMLAH</span>
                <span>{formatMoney(invoice.totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="mb-8 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-sm text-green-700 mb-3">PEMBAYARAN DITERIMA:</h3>
            <div className="space-y-2">
              {payments.map((payment) => (
                <div key={payment.id} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{getMethodLabel(payment.method)}</span>
                    {payment.reference && <span className="text-gray-600"> - {payment.reference}</span>}
                    <span className="text-gray-500 ml-2">({formatDateTime(payment.receivedAt)})</span>
                  </div>
                  <span className="font-medium">{formatMoney(payment.amountCents)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-3 border-t border-green-200 text-lg font-bold text-green-700">
              <span>JUMLAH DIBAYAR</span>
              <span>{formatMoney(receipt.totalPaidCents)}</span>
            </div>
          </div>

          {/* Confirmation */}
          <div className="text-center p-6 border-2 border-green-500 rounded-lg bg-green-50">
            <p className="text-xl font-bold text-green-700">BAYARAN TELAH DITERIMA</p>
            <p className="text-sm text-green-600 mt-2">Terima kasih atas pembayaran anda.</p>
          </div>

          <div className="mt-12 pt-6 border-t text-center text-xs text-gray-400">
            <p>Dokumen ini dijana oleh KedaiServis Suite</p>
            <p>Resit ini adalah bukti pembayaran yang sah.</p>
          </div>
        </div>
      </div>
    </>
  );
}
