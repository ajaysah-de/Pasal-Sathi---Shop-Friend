import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Package, ShoppingCart, FileText, Settings, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', icon: LayoutGrid, label: 'Home', labelNp: 'होम' },
  { path: '/inventory', icon: Package, label: 'Items', labelNp: 'सामान' },
  { path: '/sale', icon: ShoppingCart, label: 'Sell', labelNp: 'बेच्नु' },
  { path: '/reports', icon: FileText, label: 'Reports', labelNp: 'रिपोर्ट' },
  { path: '/settings', icon: Settings, label: 'Settings', labelNp: 'सेटिङ' },
];

export default function Layout({ children, lowStockCount = 0 }) {
  const location = useLocation();
  const { shopName, shopNameEn } = useAuth();

  return (
    <div className="min-h-screen bg-[#F9F9F5] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#8B0000] font-nepali">{shopName || 'पसल साथी'}</h1>
            <p className="text-xs text-gray-500">{shopNameEn || 'Pasal Sathi'}</p>
          </div>
          
          {lowStockCount > 0 && (
            <NavLink 
              to="/inventory?filter=low-stock" 
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-full text-sm"
              data-testid="low-stock-alert-btn"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{lowStockCount}</span>
            </NavLink>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 bottom-nav z-40" data-testid="bottom-nav">
        <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-4 rounded-xl transition-colors ${
                  isActive 
                    ? 'text-[#8B0000]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-xs mt-1 font-medium">{item.labelNp}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
