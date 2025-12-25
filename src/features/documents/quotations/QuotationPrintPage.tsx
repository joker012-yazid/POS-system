import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { getQuotation } from './quotationService';
import { getCompanyProfile } from '@/features/settings/settingsService';
import { db } from '@/services/storage/db';
import { formatMoney } from '@/lib/money';
import { formatDocumentDate } from '@/lib/time';
import type { Quotation, Customer, Device, CompanyProfile } from '@/services/storage/types';

export function QuotationPrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [quotationData, companyData] = await Promise.all([
        getQuotation(id),
        getCompanyProfile(),
      ]);
      setQuotation(quotationData);
      setCompany(companyData);

      const customerData = await db.customers.get(quotationData.customerId);
      setCustomer(customerData || null);

      if (quotationData.deviceId) {
        const deviceData = await db.devices.get(quotationData.deviceId);
        setDevice(deviceData || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!quotation) return null;

  return (
    <>
      {/* Print controls - hidden when printing */}
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

      {/* Printable content */}
      <div className="max-w-4xl mx-auto bg-white p-8 print:p-0 print:max-w-none">
        <div className="print:p-8" style={{ minHeight: '297mm' }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {company?.logoDataUrl && (
                <img src={company.logoDataUrl} alt="Logo" className="h-16 mb-2" />
              )}
              <h1 className="text-xl font-bold">{company?.name || 'Syarikat'}</h1>
              {company?.address && <p className="text-sm text-gray-600">{company.address}</p>}
              {company?.phone && <p className="text-sm text-gray-600">Tel: {company.phone}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-primary-600">SEBUTHARGA</h2>
              <p className="text-lg font-mono mt-2">{quotation.quotationNo}</p>
              <p className="text-sm text-gray-600 mt-1">Tarikh: {formatDocumentDate(quotation.createdAt)}</p>
              {quotation.validUntil && (
                <p className="text-sm text-gray-600">Sah Sehingga: {formatDocumentDate(quotation.validUntil + 'T00:00:00')}</p>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg print:bg-gray-100">
            <h3 className="font-semibold text-sm text-gray-500 mb-2">KEPADA:</h3>
            <p className="font-medium text-lg">{customer?.name}</p>
            {customer?.phone && <p className="text-sm">{customer.phone}</p>}
            {customer?.address && <p className="text-sm">{customer.address}</p>}
            {device && (
              <p className="text-sm mt-2">
                <span className="text-gray-500">Peranti:</span>{' '}
                {device.type} {device.brand} {device.model}
                {device.serialNumber && ` (S/N: ${device.serialNumber})`}
              </p>
            )}
          </div>

          {/* Line Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 text-sm font-semibold">No.</th>
                <th className="text-left py-3 text-sm font-semibold">Keterangan</th>
                <th className="text-center py-3 text-sm font-semibold w-20">Kuantiti</th>
                <th className="text-right py-3 text-sm font-semibold w-28">Harga Seunit</th>
                <th className="text-right py-3 text-sm font-semibold w-28">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {quotation.lineItems.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3 text-sm">{idx + 1}</td>
                  <td className="py-3">
                    <p className="font-medium">{item.description}</p>
                  </td>
                  <td className="py-3 text-center text-sm">{item.quantity}</td>
                  <td className="py-3 text-right text-sm">{formatMoney(item.unitPriceCents)}</td>
                  <td className="py-3 text-right text-sm font-medium">{formatMoney(item.lineTotalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-gray-600">Subjumlah</span>
                <span>{formatMoney(quotation.subtotalCents)}</span>
              </div>
              {quotation.discountCents > 0 && (
                <div className="flex justify-between py-1 text-red-600">
                  <span>Diskaun</span>
                  <span>-{formatMoney(quotation.discountCents)}</span>
                </div>
              )}
              {quotation.taxCents > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Cukai</span>
                  <span>{formatMoney(quotation.taxCents)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-gray-300 text-lg font-bold">
                <span>JUMLAH</span>
                <span>{formatMoney(quotation.totalCents)}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="border-t pt-6 text-sm text-gray-600">
            <h3 className="font-semibold mb-2">Terma & Syarat:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Sebutharga ini sah untuk tempoh yang dinyatakan di atas.</li>
              <li>Harga tertakluk kepada perubahan tanpa notis awal.</li>
              <li>Waranti mengikut terma pengeluar/pembekal.</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-xs text-gray-400">
            <p>Dokumen ini dijana oleh KedaiServis Suite</p>
          </div>
        </div>
      </div>
    </>
  );
}
