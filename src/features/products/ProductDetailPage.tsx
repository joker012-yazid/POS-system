import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { getProduct, updateProduct } from './productService';
import { adjustStock } from './stockService';
import { StockAdjustDialog } from './StockAdjustDialog';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { getErrorMessage } from '@/lib/errors';
import { formatMoney, toCents, toRinggit } from '@/lib/money';
import { formatDate } from '@/lib/time';
import type { Product } from '@/services/storage/types';
import { clsx } from 'clsx';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    costPrice: '',
    sellPrice: '',
    minStockQty: '',
  });

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await getProduct(id);
      setProduct(data);
      setFormData({
        name: data.name,
        sku: data.sku || '',
        costPrice: toRinggit(data.costCents).toFixed(2),
        sellPrice: toRinggit(data.priceCents).toFixed(2),
        minStockQty: data.minStockQty.toString(),
      });
    } catch (error) {
      addToast('error', getErrorMessage(error));
      navigate('/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const updated = await updateProduct(
        id,
        {
          name: formData.name,
          sku: formData.sku || undefined,
          costCents: toCents(parseFloat(formData.costPrice) || 0),
          priceCents: toCents(parseFloat(formData.sellPrice) || 0),
          minStockQty: parseInt(formData.minStockQty) || 0,
        },
        user!.id
      );
      setProduct(updated);
      setIsEditing(false);
      addToast('success', 'Produk berjaya dikemaskini');
    } catch (error) {
      addToast('error', getErrorMessage(error));
    }
  };

  const handleStockAdjusted = () => {
    setShowAdjust(false);
    loadProduct();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!product) return null;

  const isLowStock = product.stockQty <= product.minStockQty;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/products')} className="p-2 text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            {product.sku && <p className="text-sm text-gray-500 font-mono">SKU: {product.sku}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(!isEditing)} className="btn btn-secondary">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      {/* Stock Alert */}
      {isLowStock && (
        <div className="card p-4 bg-red-50 border-red-200">
          <p className="text-red-700 font-medium">
            Stok rendah! Kuantiti semasa ({product.stockQty}) berada di bawah paras minimum ({product.minStockQty}).
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="card p-6 space-y-4">
              <div>
                <label className="label">Nama</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="label">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="input mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Harga Kos (RM)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="label">Harga Jual (RM)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    className="input mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="label">Stok Minimum</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.minStockQty}
                  onChange={(e) => setFormData({ ...formData, minStockQty: e.target.value })}
                  className="input mt-1"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          ) : (
            <div className="card p-6">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Harga Kos</dt>
                  <dd className="text-lg">{formatMoney(product.costCents)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Harga Jual</dt>
                  <dd className="text-lg font-medium text-primary-600">{formatMoney(product.priceCents)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Margin</dt>
                  <dd className="text-lg text-green-600">
                    {formatMoney(product.priceCents - product.costCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Stok Minimum</dt>
                  <dd className="text-lg">{product.minStockQty}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Dicipta</dt>
                  <dd>{formatDate(product.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Dikemaskini</dt>
                  <dd>{formatDate(product.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Stock sidebar */}
        <div className="space-y-6">
          <div className="card p-6 text-center">
            <p className="text-sm text-gray-500">Stok Semasa</p>
            <p className={clsx('text-4xl font-bold', isLowStock ? 'text-red-600' : 'text-gray-900')}>
              {product.stockQty}
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowAdjust(true)} className="btn btn-primary flex-1">
                Laraskan Stok
              </button>
            </div>
            <Link
              to={`/products/${product.id}/movements`}
              className="mt-2 block text-sm text-primary-600 hover:underline"
            >
              Lihat Sejarah Stok
            </Link>
          </div>
        </div>
      </div>

      {showAdjust && (
        <StockAdjustDialog
          productId={product.id}
          productName={product.name}
          currentStock={product.stockQty}
          onClose={() => setShowAdjust(false)}
          onSuccess={handleStockAdjusted}
        />
      )}
    </div>
  );
}
