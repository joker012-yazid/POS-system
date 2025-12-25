import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getStockMovements, getMovementTypeLabel } from './stockService';
import { getProduct } from './productService';
import { db } from '@/services/storage/db';
import { formatDateTime } from '@/lib/time';
import type { StockMovement, Product, User } from '@/services/storage/types';
import { clsx } from 'clsx';

export function StockMovementsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [productData, movementsData] = await Promise.all([
        getProduct(id),
        getStockMovements(id),
      ]);
      setProduct(productData);
      setMovements(movementsData);

      const userIds = [...new Set(movementsData.map((m) => m.createdByUserId))];
      const userMap = new Map<string, User>();
      for (const uid of userIds) {
        const user = await db.users.get(uid);
        if (user) userMap.set(uid, user);
      }
      setUsers(userMap);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/products/${id}`)} className="p-2 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sejarah Stok</h1>
          <p className="text-gray-500">{product.name}</p>
        </div>
      </div>

      {movements.length === 0 ? (
        <div className="text-center py-12 card p-8">
          <p className="text-gray-500">Tiada rekod pergerakan stok</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Masa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kuantiti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sebab
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengguna
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movements.map((movement) => {
                const user = users.get(movement.createdByUserId);
                return (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(movement.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          'inline-flex px-2 py-1 text-xs font-medium rounded',
                          movement.deltaQty > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        )}
                      >
                        {getMovementTypeLabel(movement.type)}
                      </span>
                    </td>
                    <td
                      className={clsx(
                        'px-6 py-4 whitespace-nowrap text-right font-medium',
                        movement.deltaQty > 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {movement.deltaQty > 0 ? '+' : ''}
                      {movement.deltaQty}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {movement.reason || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user?.displayName || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
