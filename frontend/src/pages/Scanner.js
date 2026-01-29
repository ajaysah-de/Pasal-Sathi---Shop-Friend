import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Camera, X, Zap, Brain, RefreshCw, Check, 
  AlertTriangle, Package, ArrowLeft, Image as ImageIcon,
  ScanLine, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { formatNPR, CATEGORIES, LOCATIONS } from '../lib/utils';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Scanner() {
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('smart'); // 'quick' or 'smart'
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedUpdates, setSelectedUpdates] = useState({});

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Could not access camera. Please allow camera permission.');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  // Capture image from camera
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Analyze image with AI
  const analyzeImage = async () => {
    if (!capturedImage) {
      toast.error('Please capture or select an image first');
      return;
    }

    setScanning(true);
    
    try {
      // Extract base64 data (remove data:image/jpeg;base64, prefix)
      const base64Data = capturedImage.split(',')[1];
      
      const res = await axios.post(`${API}/scan/analyze`, {
        image_base64: base64Data,
        mode: mode
      }, getAuthHeader());
      
      setScanResult(res.data);
      setShowResults(true);
      
      // Initialize selected updates
      const updates = {};
      res.data.matched_products.forEach(match => {
        updates[match.product_id] = {
          selected: true,
          new_quantity: match.detected_count
        };
      });
      setSelectedUpdates(updates);
      
      toast.success(`Found ${res.data.total_items_counted} items!`);
    } catch (err) {
      console.error('Scan error:', err);
      toast.error(err.response?.data?.detail || 'Failed to analyze image');
    } finally {
      setScanning(false);
    }
  };

  // Apply stock updates
  const applyUpdates = async () => {
    const updates = Object.entries(selectedUpdates)
      .filter(([_, data]) => data.selected)
      .map(([productId, data]) => ({
        product_id: productId,
        new_quantity: data.new_quantity
      }));
    
    if (updates.length === 0) {
      toast.error('No items selected for update');
      return;
    }

    try {
      await axios.post(`${API}/scan/update-stock`, updates, getAuthHeader());
      toast.success(`Updated ${updates.length} products!`);
      setShowResults(false);
      setScanResult(null);
      setCapturedImage(null);
    } catch (err) {
      toast.error('Failed to update stock');
    }
  };

  // Reset scanner
  const resetScanner = () => {
    setCapturedImage(null);
    setScanResult(null);
    setShowResults(false);
    setSelectedUpdates({});
  };

  const toggleUpdate = (productId) => {
    setSelectedUpdates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selected: !prev[productId]?.selected
      }
    }));
  };

  const updateQuantity = (productId, quantity) => {
    setSelectedUpdates(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        new_quantity: parseInt(quantity) || 0
      }
    }));
  };

  return (
    <div className="min-h-screen bg-[#F9F9F5]" data-testid="scanner-page">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-[#8B0000]" />
                AI Stock Scanner
              </h1>
              <p className="text-xs text-gray-500 font-nepali">AI स्टक स्क्यानर</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Mode Selection */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h3 className="font-semibold mb-3">Scan Mode / स्क्यान मोड</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode('quick')}
              className={`p-4 rounded-xl border-2 transition-all ${
                mode === 'quick' 
                  ? 'border-[#8B0000] bg-red-50' 
                  : 'border-gray-200'
              }`}
              data-testid="mode-quick"
            >
              <Zap className={`w-6 h-6 mx-auto mb-2 ${mode === 'quick' ? 'text-[#8B0000]' : 'text-gray-400'}`} />
              <p className="font-medium">Quick Count</p>
              <p className="text-xs text-gray-500">छिटो गणना</p>
            </button>
            
            <button
              onClick={() => setMode('smart')}
              className={`p-4 rounded-xl border-2 transition-all ${
                mode === 'smart' 
                  ? 'border-[#8B0000] bg-red-50' 
                  : 'border-gray-200'
              }`}
              data-testid="mode-smart"
            >
              <Brain className={`w-6 h-6 mx-auto mb-2 ${mode === 'smart' ? 'text-[#8B0000]' : 'text-gray-400'}`} />
              <p className="font-medium">Smart Scan</p>
              <p className="text-xs text-gray-500">स्मार्ट स्क्यान</p>
            </button>
          </div>
          
          <p className="mt-3 text-sm text-gray-500">
            {mode === 'quick' 
              ? 'Quick count mode: AI counts all visible items fast'
              : 'Smart scan mode: AI identifies, counts, and matches with your inventory'
            }
          </p>
        </div>

        {/* Camera/Image Section */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h3 className="font-semibold mb-3">Capture Image / तस्वीर लिनुहोस्</h3>
          
          {/* Video Preview */}
          {isStreaming && (
            <div className="relative mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-xl bg-black"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={captureImage}
                  className="p-4 bg-[#8B0000] text-white rounded-full shadow-lg active:scale-95 transition-transform"
                  data-testid="capture-btn"
                >
                  <Camera className="w-8 h-8" />
                </button>
                <button
                  onClick={stopCamera}
                  className="p-4 bg-gray-600 text-white rounded-full shadow-lg"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
            </div>
          )}

          {/* Captured Image Preview */}
          {capturedImage && !isStreaming && (
            <div className="relative mb-4">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full rounded-xl"
              />
              <button
                onClick={resetScanner}
                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Action Buttons */}
          {!isStreaming && !capturedImage && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={startCamera}
                className="flex items-center justify-center gap-2 p-4 bg-[#8B0000] text-white rounded-xl font-medium"
                data-testid="open-camera-btn"
              >
                <Camera className="w-5 h-5" />
                Open Camera
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-4 bg-gray-100 text-gray-700 rounded-xl font-medium"
                data-testid="upload-btn"
              >
                <ImageIcon className="w-5 h-5" />
                Upload Photo
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* Analyze Button */}
          {capturedImage && !isStreaming && (
            <button
              onClick={analyzeImage}
              disabled={scanning}
              className="w-full mt-4 p-4 bg-[#8B0000] text-white rounded-xl font-semibold 
                         flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="analyze-btn"
            >
              {scanning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing... / विश्लेषण गर्दै...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Analyze with AI / AI ले विश्लेषण गर्नुहोस्
                </>
              )}
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2">Tips for best results:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Good lighting helps AI count accurately</li>
            <li>• Keep camera steady while taking photo</li>
            <li>• Include all items you want to count in frame</li>
            <li>• राम्रो प्रकाशमा तस्वीर लिनुहोस्</li>
          </ul>
        </div>
      </div>

      {/* Results Modal */}
      <Modal
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        title="Scan Results"
        titleNp="स्क्यान नतिजा"
      >
        {scanResult && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Summary */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <p className="font-bold text-green-800 text-xl">
                    {scanResult.total_items_counted} items found
                  </p>
                  <p className="text-sm text-green-600">{scanResult.scan_notes}</p>
                </div>
              </div>
            </div>

            {/* Detected Items */}
            <div>
              <h4 className="font-semibold mb-2">Detected Items / पत्ता लागेका सामान</h4>
              <div className="space-y-2">
                {scanResult.detected_items.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.name_np && <p className="text-sm text-gray-500 font-nepali">{item.name_np}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span 
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ 
                            backgroundColor: `${CATEGORIES[item.category]?.color}20`, 
                            color: CATEGORIES[item.category]?.color 
                          }}
                        >
                          {CATEGORIES[item.category]?.name_np || item.category}
                        </span>
                        {item.location_hint && (
                          <span className="text-xs text-gray-400">
                            {LOCATIONS[item.location_hint]?.name_np || item.location_hint}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#8B0000]">{item.count}</p>
                      <p className={`text-xs ${
                        item.confidence === 'high' ? 'text-green-600' :
                        item.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.confidence} confidence
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Matched Products - Update Stock */}
            {scanResult.matched_products.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Update Stock / स्टक अपडेट गर्नुहोस्
                </h4>
                <div className="space-y-2">
                  {scanResult.matched_products.map((match) => (
                    <div 
                      key={match.product_id}
                      className={`p-3 rounded-xl border-2 transition-colors ${
                        selectedUpdates[match.product_id]?.selected
                          ? 'border-[#8B0000] bg-red-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedUpdates[match.product_id]?.selected || false}
                          onChange={() => toggleUpdate(match.product_id)}
                          className="w-5 h-5 accent-[#8B0000]"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{match.product_name}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Current: {match.current_stock}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                            <span className={match.difference > 0 ? 'text-green-600' : match.difference < 0 ? 'text-red-600' : 'text-gray-600'}>
                              Scanned: {match.detected_count}
                            </span>
                            {match.difference !== 0 && (
                              <span className={`font-medium ${match.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({match.difference > 0 ? '+' : ''}{match.difference})
                              </span>
                            )}
                          </div>
                        </div>
                        <input
                          type="number"
                          value={selectedUpdates[match.product_id]?.new_quantity ?? match.detected_count}
                          onChange={(e) => updateQuantity(match.product_id, e.target.value)}
                          className="w-20 h-10 text-center border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => setShowResults(false)}
                className="flex-1 p-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
              >
                Close / बन्द
              </button>
              {scanResult.matched_products.length > 0 && (
                <button
                  onClick={applyUpdates}
                  className="flex-1 p-3 bg-[#8B0000] text-white rounded-xl font-medium flex items-center justify-center gap-2"
                  data-testid="apply-updates-btn"
                >
                  <Check className="w-5 h-5" />
                  Update Stock
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
