import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { createProduct } from './productService';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { getErrorMessage } from '@/lib/errors';
import { toCents } from '@/lib/money';

export function ProductCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    costPrice: '',
    sellPrice: '',
    stockQty: '0',
    minStockQty: '0',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const product = await createProduct(
        {
          name: formData.name,
          sku: formData.sku || undefined,
          costCents: toCents(parseFloat(formData.costPrice) || 0),
          priceCents: toCents(parseFloat(formData.sellPrice) || 0),
          stockQty: parseInt(formData.stockQty) || 0,
          minStockQty: parseInt(formData.minStockQty) || 0,
        },
        user!.id
      );

      addToast('success', `Produk "${product.name}" berjaya ditambah`);
      navigate(`/products/${product.id}`);
    } catch (error) {
      addToast('error', getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Produk</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label htmlFor="name" className="label">
            Nama Produk <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input mt-1"
            placeholder="Nama produk"
          />
        </div>

        <div>
          <label htmlFor="sku" className="label">
            SKU
          </label>
          <input
            type="text"
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className="input mt-1"
            placeholder="Kod produk (optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="costPrice" className="label">
              Harga Kos (RM)
            </label>
            <input
              type="number"
              id="costPrice"
              min="0"
              step="0.01"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              className="input mt-1"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="sellPrice" className="label">
              Harga Jual (RM) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="sellPrice"
              min="0"
              step="0.01"
              required
              value={formData.sellPrice}
              onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
              className="input mt-1"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="stockQty" className="label">
              Kuantiti Stok
            </label>
            <input
              type="number"
              id="stockQty"
              min="0"
              step="1"
              value={formData.stockQty}
              onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
              className="input mt-1"
            />
          </div>

          <div>
            <label htmlFor="minStockQty" className="label">
              Stok Minimum
            </label>
            <input
              type="number"
              id="minStockQty"
              min="0"
              step="1"
              value={formData.minStockQty}
              onChange={(e) => setFormData({ ...formData, minStockQty: e.target.value })}
              className="input mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">Amaran akan ditunjukkan jika stok di bawah paras ini</p>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Batal
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}
