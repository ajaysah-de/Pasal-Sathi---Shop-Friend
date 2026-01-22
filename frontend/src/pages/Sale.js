import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, ShoppingCart, Plus, Minus, X, Trash2, 
  CreditCard, Banknote, Check, Package
} from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Numpad from '../components/Numpad';
import { useAuth } from '../context/AuthContext';
import { formatNPR, CATEGORIES } from '../lib/utils';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Sale() {
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [numpadValue, setNumpadValue] = useState('');
  const [numpadProduct, setNumpadProduct] = useState(null);
  const [discount, setDiscount] = useState('0');
  const [paymentType, setPaymentType] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      setFilteredProducts(products.filter(p => 
        p.name_en.toLowerCase().includes(searchLower) ||
        p.name_np?.toLowerCase().includes(searchLower)
      ));
    } else {
      setFilteredProducts(products);
    }
  }, [search, products]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`, getAuthHeader());
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + qty, total: (item.quantity + qty) * item.unit_price }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name_en,
        quantity: qty,
        unit_price: product.selling_price,
        total: qty * product.selling_price
      }];
    });
    toast.success(`Added ${product.name_en}`);
  };

  const updateCartQty = (productId, change) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(0, item.quantity + change);
        if (newQty === 0) return null;
        return { ...item, quantity: newQty, total: newQty * item.unit_price };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const openNumpad = (product) => {
    setNumpadProduct(product);
    setNumpadValue('1');
    setShowNumpad(true);
  };

  const handleNumpadConfirm = () => {
    const qty = parseInt(numpadValue) || 1;
    if (numpadProduct) {
      addToCart(numpadProduct, qty);
    }
    setShowNumpad(false);
    setNumpadProduct(null);
    setNumpadValue('');
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty / कार्ट खाली छ');
      return;
    }

    setSubmitting(true);
    
    try {
      await axios.post(`${API}/sales`, {
        items: cart,
        subtotal,
        discount: discountAmount,
        total,
        payment_type: paymentType,
        customer_name: customerName || null
      }, getAuthHeader());
      
      toast.success('Sale recorded! / बिक्री सफल!');
      setCart([]);
      setDiscount('0');
      setCustomerName('');
      setShowCheckout(false);
      fetchProducts(); // Refresh stock
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-4 animate-fadeIn" data-testid="sale-page">
        {/* Search */}
        <div className="search-bar">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search to add... / खोज्नुहोस्..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
            data-testid="sale-search-input"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredProducts.slice(0, 20).map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl p-3 border border-gray-100 cursor-pointer active:scale-95 transition-transform"
                onClick={() => addToCart(product)}
                onContextMenu={(e) => { e.preventDefault(); openNumpad(product); }}
                data-testid={`sale-product-${product.id}`}
              >
                <p className="font-medium text-[#2D2D2D] truncate text-sm">{product.name_en}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400 font-nepali">
                    {CATEGORIES[product.category]?.name_np}
                  </span>
                  <span className="font-bold text-[#8B0000] text-sm">
                    {formatNPR(product.selling_price)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${product.quantity <= product.low_stock_threshold ? 'text-red-500' : 'text-gray-400'}`}>
                    Stock: {product.quantity}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); openNumpad(product); }}
                    className="p-1 bg-gray-100 rounded-lg"
                    data-testid={`qty-btn-${product.id}`}
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="empty-state py-8">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No products found</p>
          </div>
        )}

        {/* Cart Summary - Fixed Bottom */}
        {cart.length > 0 && (
          <div className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-lg border border-gray-200 p-4 z-30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#8B0000]" />
                <span className="font-semibold">{cart.length} items</span>
              </div>
              <span className="text-xl font-bold text-[#8B0000]">{formatNPR(subtotal)}</span>
            </div>
            
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full h-12 bg-[#8B0000] text-white font-semibold rounded-xl active:scale-95 transition-transform"
              data-testid="checkout-btn"
            >
              Checkout / बिल बनाउनुहोस्
            </button>
          </div>
        )}

        {/* Numpad Modal */}
        <Modal 
          isOpen={showNumpad} 
          onClose={() => setShowNumpad(false)}
          title="Enter Quantity"
          titleNp="संख्या हाल्नुहोस्"
        >
          {numpadProduct && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <p className="font-semibold">{numpadProduct.name_en}</p>
              <p className="text-sm text-gray-500">{formatNPR(numpadProduct.selling_price)} each</p>
            </div>
          )}
          <Numpad 
            value={numpadValue}
            onChange={setNumpadValue}
            onConfirm={handleNumpadConfirm}
            maxLength={4}
          />
        </Modal>

        {/* Checkout Modal */}
        <Modal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          title="Checkout"
          titleNp="बिल"
        >
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {cart.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product_name}</p>
                    <p className="text-xs text-gray-500">{formatNPR(item.unit_price)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#8B0000]">{formatNPR(item.total)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateCartQty(item.product_id, -1)}
                        className="p-1 bg-gray-200 rounded-lg"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQty(item.product_id, 1)}
                        className="p-1 bg-gray-200 rounded-lg"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="p-1 text-red-500 ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Discount */}
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Discount / छुट (Rs.)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
                data-testid="discount-input"
              />
            </div>

            {/* Customer Name (for credit) */}
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Customer Name / ग्राहकको नाम</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
                data-testid="customer-name-input"
              />
            </div>

            {/* Payment Type */}
            <div>
              <label className="text-sm text-gray-500 mb-2 block">Payment / भुक्तानी</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentType('cash')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                    paymentType === 'cash'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  data-testid="payment-cash"
                >
                  <Banknote className="w-5 h-5" />
                  Cash / नगद
                </button>
                <button
                  onClick={() => setPaymentType('credit')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
                    paymentType === 'credit'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  data-testid="payment-credit"
                >
                  <CreditCard className="w-5 h-5" />
                  Credit / उधारो
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="bg-[#8B0000] text-white p-4 rounded-xl">
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal</span>
                <span>{formatNPR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm mb-1">
                  <span>Discount</span>
                  <span>-{formatNPR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/20">
                <span>Total / जम्मा</span>
                <span>{formatNPR(total)}</span>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full h-14 bg-green-600 text-white text-lg font-semibold rounded-xl 
                         hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50
                         flex items-center justify-center gap-2"
              data-testid="confirm-sale-btn"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-6 h-6" />
                  Confirm Sale / बिक्री पुष्टि
                </>
              )}
            </button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
