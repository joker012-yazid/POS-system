import { useState } from 'react';
import { adjustStock } from './stockService';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { getErrorMessage } from '@/lib/errors';

interface StockAdjustDialogProps {
  productId: string;
  productName: string;
  currentStock: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockAdjustDialog({
  productId,
  productName,
  currentStock,
  onClose,
  onSuccess,
}: StockAdjustDialogProps) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjust'>('in');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      addToast('error', 'Kuantiti mesti lebih dari sifar');
      return;
    }

    if (!reason.trim()) {
      addToast('error', 'Sebab diperlukan');
      return;
    }

    setIsSubmitting(true);

    try {
      await adjustStock(productId, adjustType, qty, reason.trim(), user!.id);
      addToast('success', 'Stok berjaya dilaraskan');
      onSuccess();
    } catch (error) {
      addToast('error', getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNewStock = () => {
    const qty = parseInt(quantity) || 0;
    if (adjustType === 'in') return currentStock + qty;
    if (adjustType === 'out') return Math.max(0, currentStock - qty);
    return qty; // For adjust, it's the absolute new value
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-semibold mb-4">Laraskan Stok: {productName}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-gray-100 rounded-lg text-center">
              <p className="text-sm text-gray-600">Stok Semasa</p>
              <p className="text-2xl font-bold">{currentStock}</p>
            </div>

            <div>
              <label className="label">Jenis Pelarasan</label>
              <div className="mt-1 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="adjustType"
                    value="in"
                    checked={adjustType === 'in'}
                    onChange={() => setAdjustType('in')}
                    className="text-primary-600"
                  />
                  <span>Masuk (+)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="adjustType"
                    value="out"
                    checked={adjustType === 'out'}
                    onChange={() => setAdjustType('out')}
                    className="text-primary-600"
                  />
                  <span>Keluar (-)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="adjustType"
                    value="adjust"
                    checked={adjustType === 'adjust'}
                    onChange={() => setAdjustType('adjust')}
                    className="text-primary-600"
                  />
                  <span>Set Nilai</span>
                </label>
              </div>
            </div>

            <div>
              <label className="label">
                {adjustType === 'adjust' ? 'Kuantiti Baru' : 'Kuantiti'}
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input mt-1"
                required
              />
              {quantity && (
                <p className="mt-1 text-sm text-gray-500">
                  Stok akan menjadi: <strong>{getNewStock()}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="label">Sebab <span className="text-red-500">*</span></label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input mt-1"
                placeholder="Nyatakan sebab pelarasan..."
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Melaraskan...' : 'Laraskan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
