import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  TrendingUp, Package, AlertTriangle, ShoppingCart, 
  Plus, ArrowRight, IndianRupee, Clock, ScanLine, Camera
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { formatNPR, formatTime, CATEGORIES } from '../lib/utils';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [todaySales, setTodaySales] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, salesRes, alertsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, getAuthHeader()),
        axios.get(`${API}/sales/today`, getAuthHeader()),
        axios.get(`${API}/alerts/low-stock`, getAuthHeader())
      ]);
      
      setStats(statsRes.data);
      setTodaySales(salesRes.data);
      setLowStockItems(alertsRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      toast.error('Failed to load dashboard / डाटा लोड गर्न सकिएन');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="loader"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout lowStockCount={lowStockItems.length}>
      <div className="space-y-6 animate-fadeIn" data-testid="dashboard">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="stats-card" data-testid="today-sales-stat">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <IndianRupee className="w-4 h-4 text-green-700" />
              </div>
              <span className="text-sm text-gray-500">Today / आज</span>
            </div>
            <p className="text-2xl font-bold text-[#2D2D2D]">
              {formatNPR(stats?.today_sales || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {stats?.today_count || 0} sales / बिक्री
            </p>
          </div>

          <div className="stats-card" data-testid="week-sales-stat">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-700" />
              </div>
              <span className="text-sm text-gray-500">This Week / हप्ता</span>
            </div>
            <p className="text-2xl font-bold text-[#2D2D2D]">
              {formatNPR(stats?.week_sales || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {stats?.week_count || 0} sales / बिक्री
            </p>
          </div>

          <div className="stats-card" data-testid="products-stat">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-4 h-4 text-purple-700" />
              </div>
              <span className="text-sm text-gray-500">Products / सामान</span>
            </div>
            <p className="text-2xl font-bold text-[#2D2D2D]">
              {stats?.total_products || 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Worth {formatNPR(stats?.inventory_value || 0)}
            </p>
          </div>

          <div 
            className="stats-card cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/inventory?filter=low-stock')}
            data-testid="low-stock-stat"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${lowStockItems.length > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-red-700' : 'text-gray-500'}`} />
              </div>
              <span className="text-sm text-gray-500">Low Stock / कम स्टक</span>
            </div>
            <p className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-[#2D2D2D]'}`}>
              {stats?.low_stock_count || 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">items need restock</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Quick Actions / छिटो कार्य
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/sale')}
              className="quick-action bg-[#8B0000] text-white hover:bg-[#6B0000]"
              data-testid="quick-new-sale"
            >
              <ShoppingCart className="w-6 h-6 mb-2" />
              <span className="font-medium">New Sale / नयाँ बिक्री</span>
            </button>
            
            <button
              onClick={() => navigate('/inventory/add')}
              className="quick-action"
              data-testid="quick-add-product"
            >
              <Plus className="w-6 h-6 mb-2 text-[#8B0000]" />
              <span className="font-medium">Add Item / सामान थप्नु</span>
            </button>
          </div>
        </div>

        {/* AI Scanner Feature - NEW */}
        <div className="bg-gradient-to-r from-[#8B0000] to-[#6B0000] rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Camera className="w-5 h-5" />
                AI Stock Scanner
              </h3>
              <p className="text-sm text-white/80 mt-1">
                Take a photo to count inventory automatically
              </p>
              <p className="text-xs text-white/60 font-nepali mt-1">
                तस्वीर लिएर स्टक गण्नुहोस्
              </p>
            </div>
            <button
              onClick={() => navigate('/scanner')}
              className="px-4 py-3 bg-white text-[#8B0000] rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform"
              data-testid="quick-scanner"
            >
              <ScanLine className="w-5 h-5" />
              Scan Now
            </button>
          </div>
        </div>

        {/* Recent Sales */}
        {todaySales?.recent?.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent Sales / हालको बिक्री</h2>
              <button 
                onClick={() => navigate('/reports')}
                className="flex items-center text-sm text-[#8B0000] font-medium"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="space-y-2">
              {todaySales.recent.slice(0, 3).map((sale) => (
                <div key={sale.id} className="sale-item" data-testid={`recent-sale-${sale.id}`}>
                  <div className="flex-1">
                    <p className="font-medium text-[#2D2D2D]">
                      {sale.items.map(i => i.product_name).join(', ').slice(0, 30)}
                      {sale.items.map(i => i.product_name).join(', ').length > 30 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{formatTime(sale.created_at)}</span>
                      <span className={sale.payment_type === 'cash' ? 'cash-badge' : 'credit-badge'}>
                        {sale.payment_type === 'cash' ? 'Cash / नगद' : 'Credit / उधारो'}
                      </span>
                    </div>
                  </div>
                  <p className="font-bold text-[#8B0000]">{formatNPR(sale.total)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Low Stock Alert / कम स्टक
              </h2>
              <button 
                onClick={() => navigate('/inventory?filter=low-stock')}
                className="flex items-center text-sm text-[#8B0000] font-medium"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {lowStockItems.slice(0, 4).map((product) => (
                <div 
                  key={product.id}
                  className="bg-red-50 border border-red-100 rounded-xl p-3 cursor-pointer"
                  onClick={() => navigate(`/inventory/${product.id}`)}
                  data-testid={`low-stock-item-${product.id}`}
                >
                  <p className="font-medium text-[#2D2D2D] truncate">{product.name_en}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 font-nepali">
                      {CATEGORIES[product.category]?.name_np}
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      {product.quantity} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && stats?.total_products === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">
              No products yet / अझै सामान छैन
            </h3>
            <p className="text-gray-500 mb-4">
              Start by adding your first product
              <br />
              <span className="font-nepali">पहिलो सामान थप्नुहोस्</span>
            </p>
            <button
              onClick={() => navigate('/inventory/add')}
              className="px-6 py-3 bg-[#8B0000] text-white rounded-xl font-medium active:scale-95 transition-transform"
            >
              Add First Product / पहिलो सामान
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
