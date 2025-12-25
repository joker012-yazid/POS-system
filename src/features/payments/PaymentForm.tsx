import { useState } from 'react';
import { recordPayment, getMethodLabel } from './paymentService';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { getErrorMessage } from '@/lib/errors';
import { formatMoney, toCents, toRinggit } from '@/lib/money';
import type { PaymentMethod } from '@/services/storage/types';

interface PaymentFormProps {
  invoiceId: string;
  balanceCents: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({ invoiceId, balanceCents, onSuccess, onCancel }: PaymentFormProps) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    method: 'cash' as PaymentMethod,
    amount: toRinggit(balanceCents).toFixed(2),
    reference: '',
    provider: '',
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const amountCents = toCents(parseFloat(formData.amount) || 0);

      await recordPayment(
        {
          invoiceId,
          method: formData.method,
          amountCents,
          reference: formData.reference || undefined,
          provider: formData.provider || undefined,
          note: formData.note || undefined,
        },
        user!.id
      );

      addToast('success', `Pembayaran ${formatMoney(amountCents)} berjaya direkodkan`);
      onSuccess();
    } catch (error) {
      addToast('error', getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const payFullAmount = () => {
    setFormData((prev) => ({ ...prev, amount: toRinggit(balanceCents).toFixed(2) }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-gray-100 rounded-lg text-center">
        <p className="text-sm text-gray-600">Baki Belum Dibayar</p>
        <p className="text-2xl font-bold text-primary-600">{formatMoney(balanceCents)}</p>
      </div>

      <div>
        <label className="label">Kaedah Pembayaran</label>
        <div className="mt-1 flex gap-4">
          {(['cash', 'online'] as PaymentMethod[]).map((method) => (
            <label key={method} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="method"
                value={method}
                checked={formData.method === method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as PaymentMethod })}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span>{getMethodLabel(method)}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="label">Jumlah (RM)</label>
          <button type="button" onClick={payFullAmount} className="text-xs text-primary-600 hover:underline">
            Bayar Penuh
          </button>
        </div>
        <input
          type="number"
          min="0.01"
          step="0.01"
          max={toRinggit(balanceCents)}
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="input mt-1"
          required
        />
      </div>

      {formData.method === 'online' && (
        <>
          <div>
            <label className="label">
              No. Rujukan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="input mt-1"
              placeholder="cth: TRX123456"
              required
            />
          </div>

          <div>
            <label className="label">Provider/Bank</label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="input mt-1"
              placeholder="cth: Maybank, Touch n Go"
            />
          </div>
        </>
      )}

      <div>
        <label className="label">Nota (optional)</label>
        <textarea
          rows={2}
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          className="input mt-1"
          placeholder="Nota tambahan..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isSubmitting}>
          Batal
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Merekod...' : 'Rekod Bayaran'}
        </button>
      </div>
    </form>
  );
}
