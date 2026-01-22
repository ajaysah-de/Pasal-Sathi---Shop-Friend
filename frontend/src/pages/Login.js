import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { isSetup, login, setupShop, loading } = useAuth();
  const navigate = useNavigate();
  
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shopNameNp, setShopNameNp] = useState('');
  const [shopNameEn, setShopNameEn] = useState('');
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isSetup]);

  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pinValue = pin.join('');
    
    if (pinValue.length < 4) {
      toast.error('Please enter at least 4 digits / कम्तिमा ४ अंक हाल्नुहोस्');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isSetup) {
        await login(pinValue);
        toast.success('Welcome back! / स्वागत छ!');
      } else {
        if (!shopNameEn.trim()) {
          toast.error('Please enter shop name / पसलको नाम हाल्नुहोस्');
          setIsSubmitting(false);
          return;
        }
        await setupShop(pinValue, shopNameNp || shopNameEn, shopNameEn);
        toast.success('Shop setup complete! / पसल सेटअप सम्पन्न!');
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Invalid PIN / गलत PIN');
      setPin(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F5]">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F5] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center animate-fadeIn">
        <div className="w-20 h-20 bg-[#8B0000] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Store className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-[#8B0000] font-nepali">पसल साथी</h1>
        <p className="text-gray-500 mt-1">Pasal Sathi - Shop Friend</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm animate-slideUp">
        {/* Setup fields (only show if not setup) */}
        {isSetup === false && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shop Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={shopNameEn}
                onChange={(e) => setShopNameEn(e.target.value)}
                placeholder="My Utensil Shop"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
                data-testid="shop-name-en-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                पसलको नाम (नेपाली)
              </label>
              <input
                type="text"
                value={shopNameNp}
                onChange={(e) => setShopNameNp(e.target.value)}
                placeholder="मेरो भाँडा पसल"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] font-nepali"
                data-testid="shop-name-np-input"
              />
            </div>
          </div>
        )}

        {/* PIN Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Lock className="w-4 h-4" />
              {isSetup ? 'Enter PIN / PIN हाल्नुहोस्' : 'Create PIN (4-6 digits) / PIN बनाउनुहोस्'}
            </label>
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="flex justify-center gap-2">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`pin-input ${digit ? 'filled' : ''}`}
                data-testid={`pin-input-${index}`}
              />
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-[#8B0000] text-white text-lg font-semibold rounded-xl 
                     hover:bg-[#6B0000] active:scale-95 transition-all disabled:opacity-50"
          data-testid="login-submit-btn"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </span>
          ) : isSetup ? (
            'Open Shop / पसल खोल्नुहोस्'
          ) : (
            'Start Setup / सेटअप सुरु गर्नुहोस्'
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-sm text-gray-400 text-center">
        Simple shop management for Nepal
        <br />
        <span className="font-nepali">नेपालको लागि सरल पसल व्यवस्थापन</span>
      </p>
    </div>
  );
}
