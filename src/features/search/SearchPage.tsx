import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchService, type SearchResult } from './searchService';
import { useDebouncedValue } from '@/lib/debounce';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function doSearch() {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchService.search(debouncedQuery);
        setResults(data);
      } finally {
        setLoading(false);
      }
    }
    doSearch();
  }, [debouncedQuery]);

  useEffect(() => {
    if (query) {
      setSearchParams({ q: query });
    } else {
      setSearchParams({});
    }
  }, [query, setSearchParams]);

  const groupedResults = groupByType(results);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Carian</h1>

      <div className="max-w-xl">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari job, pelanggan, peranti, invois, produk..."
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoFocus
        />
      </div>

      {loading && (
        <p className="text-gray-500">Mencari...</p>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-gray-500">Tiada hasil dijumpai untuk "{query}"</p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-6">
          {groupedResults.map(group => (
            <div key={group.type} className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 bg-gray-50 border-b rounded-t-lg">
                <h2 className="font-semibold text-gray-700">
                  {getTypeLabel(group.type)} ({group.items.length})
                </h2>
              </div>
              <div className="divide-y">
                {group.items.map(item => (
                  <Link
                    key={item.id}
                    to={item.url}
                    className="block px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <TypeIcon type={item.type} />
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">{item.subtitle}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && query.length > 0 && query.length < 2 && (
        <p className="text-gray-500">Taipkan sekurang-kurangnya 2 aksara untuk mencari</p>
      )}
    </div>
  );
}

interface GroupedResults {
  type: SearchResult['type'];
  items: SearchResult[];
}

function groupByType(results: SearchResult[]): GroupedResults[] {
  const groups: Record<string, SearchResult[]> = {};

  for (const result of results) {
    if (!groups[result.type]) {
      groups[result.type] = [];
    }
    groups[result.type].push(result);
  }

  const order: SearchResult['type'][] = ['job', 'customer', 'device', 'invoice', 'quotation', 'product'];

  return order
    .filter(type => groups[type]?.length > 0)
    .map(type => ({ type, items: groups[type] }));
}

function getTypeLabel(type: SearchResult['type']): string {
  const labels: Record<SearchResult['type'], string> = {
    job: 'Job Servis',
    customer: 'Pelanggan',
    device: 'Peranti',
    invoice: 'Invois',
    quotation: 'Sebutharga',
    product: 'Produk',
  };
  return labels[type];
}

function TypeIcon({ type }: { type: SearchResult['type'] }) {
  const icons: Record<SearchResult['type'], string> = {
    job: 'J',
    customer: 'P',
    device: 'D',
    invoice: 'I',
    quotation: 'S',
    product: 'R',
  };

  const colors: Record<SearchResult['type'], string> = {
    job: 'bg-blue-100 text-blue-700',
    customer: 'bg-green-100 text-green-700',
    device: 'bg-purple-100 text-purple-700',
    invoice: 'bg-red-100 text-red-700',
    quotation: 'bg-yellow-100 text-yellow-700',
    product: 'bg-orange-100 text-orange-700',
  };

  return (
    <span className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm ${colors[type]}`}>
      {icons[type]}
    </span>
  );
}
