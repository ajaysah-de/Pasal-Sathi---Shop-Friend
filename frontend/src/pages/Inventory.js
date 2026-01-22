import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, Plus, Filter, Package, AlertTriangle, 
  ChevronRight, X
} from 'lucide-react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, LOCATIONS } from '../lib/utils';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Inventory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getAuthHeader } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStock, setShowLowStock] = useState(searchParams.get('filter') === 'low-stock');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, search, selectedCategory, showLowStock]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`, getAuthHeader());
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name_en.toLowerCase().includes(searchLower) ||
        p.name_np?.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (showLowStock) {
      filtered = filtered.filter(p => p.quantity <= p.low_stock_threshold);
    }
    
    setFilteredProducts(filtered);
  };

  const handleProductClick = (product) => {
    navigate(`/inventory/${product.id}`);
  };

  const categories = [
    { id: 'all', name_en: 'All Items', name_np: 'सबै' },
    ...Object.entries(CATEGORIES).map(([id, cat]) => ({ id, ...cat }))
  ];

  return (
    <Layout>
      <div className="space-y-4 animate-fadeIn" data-testid="inventory-page">
        {/* Search Bar */}
        <div className="search-bar">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products... / खोज्नुहोस्..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
            data-testid="search-input"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              data-testid={`category-${cat.id}`}
            >
              <span className="font-nepali">{cat.name_np}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showLowStock 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : 'bg-gray-100 text-gray-600'
            }`}
            data-testid="low-stock-filter"
          >
            <AlertTriangle className="w-4 h-4" />
            Low Stock Only
          </button>
          
          <span className="text-sm text-gray-500">
            {filteredProducts.length} items
          </span>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loader"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={handleProductClick}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">
              {search || selectedCategory !== 'all' ? 'No matching products' : 'No products yet'}
            </h3>
            <p className="text-gray-500 mb-4 font-nepali">
              {search || selectedCategory !== 'all' ? 'Try different search or filter' : 'सामान थप्न सुरु गर्नुहोस्'}
            </p>
            {!search && selectedCategory === 'all' && (
              <button
                onClick={() => navigate('/inventory/add')}
                className="px-6 py-3 bg-[#8B0000] text-white rounded-xl font-medium"
              >
                Add First Product
              </button>
            )}
          </div>
        )}

        {/* FAB - Add Product */}
        <button
          onClick={() => navigate('/inventory/add')}
          className="fab"
          data-testid="add-product-fab"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </Layout>
  );
}
