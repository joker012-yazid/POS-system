import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { createQuotation } from './quotationService';
import { getCustomers } from '@/features/customers/customerService';
import { getDevicesByCustomer } from '@/features/devices/deviceService';
import { getJob } from '@/features/jobs/jobService';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { getErrorMessage } from '@/lib/errors';
import { formatMoney, toCents, toRinggit } from '@/lib/money';
import { getDefaultValidityDate } from '@/lib/time';
import type { Customer, Device, LineItemType } from '@/services/storage/types';

interface LineItemForm {
  type: LineItemType;
  description: string;
  quantity: number;
  unitPrice: string;
}

export function QuotationCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToast } = useToast();

  const jobId = searchParams.get('jobId');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    deviceId: '',
    validUntil: getDefaultValidityDate(30),
    discountCents: 0,
    taxCents: 0,
  });
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { type: 'service', description: '', quantity: 1, unitPrice: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
    if (jobId) loadJobData();
  }, [jobId]);

  useEffect(() => {
    if (formData.customerId) {
      loadDevices(formData.customerId);
    }
  }, [formData.customerId]);

  const loadCustomers = async () => {
    const data = await getCustomers();
    setCustomers(data);
  };

  const loadDevices = async (customerId: string) => {
    const data = await getDevicesByCustomer(customerId);
    setDevices(data);
  };

  const loadJobData = async () => {
    if (!jobId) return;
    try {
      const job = await getJob(jobId);
      setFormData((prev) => ({
        ...prev,
        customerId: job.customerId,
        deviceId: job.deviceId,
      }));
    } catch {
      // Job not found, continue without pre-fill
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { type: 'service', description: '', quantity: 1, unitPrice: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItemForm, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      const price = toCents(parseFloat(item.unitPrice) || 0);
      return sum + (item.quantity * price);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - formData.discountCents + formData.taxCents;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      addToast('error', 'Sila pilih pelanggan');
      return;
    }

    const validLineItems = lineItems.filter((item) => item.description.trim());
    if (validLineItems.length === 0) {
      addToast('error', 'Sekurang-kurangnya satu item diperlukan');
      return;
    }

    setIsSubmitting(true);

    try {
      const quotation = await createQuotation(
        {
          jobId: jobId || undefined,
          customerId: formData.customerId,
          deviceId: formData.deviceId || undefined,
          validUntil: formData.validUntil || undefined,
          lineItems: validLineItems.map((item) => ({
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitPriceCents: toCents(parseFloat(item.unitPrice) || 0),
          })),
          discountCents: formData.discountCents,
          taxCents: formData.taxCents,
        },
        user!.id
      );

      addToast('success', `Sebutharga ${quotation.quotationNo} berjaya dicipta`);
      navigate(`/quotations/${quotation.id}`);
    } catch (error) {
      addToast('error', getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Sebutharga Baru</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Device */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Maklumat Pelanggan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Pelanggan <span className="text-red-500">*</span></label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value, deviceId: '' })}
                className="input mt-1"
                required
              >
                <option value="">Pilih pelanggan</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Peranti</label>
              <select
                value={formData.deviceId}
                onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                className="input mt-1"
                disabled={!formData.customerId}
              >
                <option value="">Pilih peranti (optional)</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.type} {d.brand && `- ${d.brand}`} {d.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Sah Sehingga</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="input mt-1"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Item</h2>
            <button type="button" onClick={addLineItem} className="btn btn-secondary text-sm">
              <PlusIcon className="h-4 w-4 mr-1" />
              Tambah Item
            </button>
          </div>

          <div className="space-y-4">
            {lineItems.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="label text-xs">Jenis</label>
                    <select
                      value={item.type}
                      onChange={(e) => updateLineItem(idx, 'type', e.target.value as LineItemType)}
                      className="input mt-1 text-sm"
                    >
                      <option value="service">Servis</option>
                      <option value="product">Produk</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="label text-xs">Keterangan</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                      className="input mt-1 text-sm"
                      placeholder="Penerangan item..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label text-xs">Qty</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="input mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Harga (RM)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(idx, 'unitPrice', e.target.value)}
                        className="input mt-1 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeLineItem(idx)}
                  className="p-2 text-red-500 hover:text-red-700"
                  disabled={lineItems.length === 1}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Jumlah</h2>
          <div className="space-y-3 max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-gray-600">Subjumlah</span>
              <span className="font-medium">{formatMoney(calculateSubtotal())}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600">Diskaun</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">RM</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={toRinggit(formData.discountCents)}
                  onChange={(e) => setFormData({ ...formData, discountCents: toCents(parseFloat(e.target.value) || 0) })}
                  className="input w-24 text-right text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600">Cukai</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">RM</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={toRinggit(formData.taxCents)}
                  onChange={(e) => setFormData({ ...formData, taxCents: toCents(parseFloat(e.target.value) || 0) })}
                  className="input w-24 text-right text-sm"
                />
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t text-lg font-bold">
              <span>Jumlah</span>
              <span className="text-primary-600">{formatMoney(calculateTotal())}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Batal
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Mencipta...' : 'Cipta Sebutharga'}
          </button>
        </div>
      </form>
    </div>
  );
}
