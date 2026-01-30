import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Save,
  Trash2,
  Package,
  MapPin,
  IndianRupee,
  Hash,
  AlertTriangle,
  Truck,
  Languages,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatNPR } from "../lib/utils";
import { toast } from "sonner";
import romanizeToNepali from "../lib/romanization";

const API_BASE = process.env.REACT_APP_BACKEND_URL?.replace(/\/$/, "") || "";
const API = `${API_BASE}/api`;

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAuthHeader } = useAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  const [form, setForm] = useState({
    name_en: "",
    name_np: "",
    category: "",
    location: "",
    cost_price: "",
    selling_price: "",
    quantity: "",
    quantity_type: "exact",
    low_stock_threshold: "5",
    supplier_id: "",
  });

  useEffect(() => {
    fetchData();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [suppliersRes, categoriesRes, locationsRes] = await Promise.all([
        axios.get(`${API}/suppliers`, getAuthHeader()),
        axios.get(`${API}/categories`, getAuthHeader()),
        axios.get(`${API}/locations`, getAuthHeader()),
      ]);
      setSuppliers(suppliersRes.data);
      setCategories(categoriesRes.data);
      setLocations(locationsRes.data);

      // Set default category and location if not editing
      if (
        !isEdit &&
        categoriesRes.data.length > 0 &&
        locationsRes.data.length > 0
      ) {
        setForm((prev) => ({
          ...prev,
          category: categoriesRes.data[0].id,
          location: locationsRes.data[0].id,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to load form data");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API}/suppliers`, getAuthHeader());
      setSuppliers(res.data);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${API}/products/${id}`, getAuthHeader());
      const p = res.data;
      setForm({
        name_en: p.name_en,
        name_np: p.name_np || "",
        category: p.category,
        location: p.location,
        cost_price: p.cost_price?.toString() || "",
        selling_price: p.selling_price.toString(),
        quantity: p.quantity.toString(),
        quantity_type: p.quantity_type,
        low_stock_threshold: p.low_stock_threshold.toString(),
        supplier_id: p.supplier_id || "",
      });
    } catch (err) {
      toast.error("Product not found");
      navigate("/inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const calculateMargin = () => {
    const cost = parseFloat(form.cost_price) || 0;
    const sell = parseFloat(form.selling_price) || 0;
    if (cost === 0 || sell === 0) return null;
    return (((sell - cost) / cost) * 100).toFixed(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name_en.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.selling_price || parseFloat(form.selling_price) <= 0) {
      toast.error("Valid selling price is required");
      return;
    }

    setSaving(true);

    const payload = {
      name_en: form.name_en.trim(),
      name_np: form.name_np.trim(),
      category: form.category,
      location: form.location,
      cost_price: parseFloat(form.cost_price) || 0,
      selling_price: parseFloat(form.selling_price),
      quantity: parseInt(form.quantity) || 0,
      quantity_type: form.quantity_type,
      low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
      supplier_id: form.supplier_id || null,
    };

    try {
      if (isEdit) {
        await axios.put(`${API}/products/${id}`, payload, getAuthHeader());
        toast.success("Product updated! / सामान अपडेट भयो!");
      } else {
        await axios.post(`${API}/products`, payload, getAuthHeader());
        toast.success("Product added! / सामान थपियो!");
      }
      navigate("/inventory");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this product? / यो सामान मेटाउने?")) return;

    try {
      await axios.delete(`${API}/products/${id}`, getAuthHeader());
      toast.success("Product deleted");
      navigate("/inventory");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  // Romanization - Convert romanized text to Nepali
  const handleConvertToNepali = () => {
    const romanized = form.name_en.trim();
    if (!romanized) {
      toast.error("Enter romanized text first (e.g., 'steel thali')");
      return;
    }
    
    const nepali = romanizeToNepali(romanized);
    if (nepali) {
      setForm(prev => ({ ...prev, name_np: nepali }));
      toast.success(`Converted: ${nepali}`);
    } else {
      toast.error("Could not convert. Try typing manually.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F5] flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  const margin = calculateMargin();

  return (
    <div className="min-h-screen bg-[#F9F9F5]" data-testid="product-form-page">
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
              <h1 className="text-lg font-semibold">
                {isEdit ? "Edit Product" : "Add Product"}
              </h1>
              <p className="text-xs text-gray-500 font-nepali">
                {isEdit ? "सामान सम्पादन" : "नयाँ सामान"}
              </p>
            </div>
          </div>

          {isEdit && (
            <button
              onClick={handleDelete}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full"
              data-testid="delete-btn"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-24">
        {/* Product Name */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-[#8B0000]" />
            Product Name / सामानको नाम
          </h3>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">
              English Name * (or type romanized: steel thali)
            </label>
            <input
              type="text"
              value={form.name_en}
              onChange={(e) => handleChange("name_en", e.target.value)}
              placeholder="Steel Plate Large (or: steel thali thulo)"
              className="w-full h-12 px-4 border border-gray-300 rounded-xl"
              data-testid="name-en-input"
            />
            <p className="text-xs text-gray-400 mt-1">
              💡 Type in romanized Nepali and click convert (e.g., "thali" → "थाली")
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block font-nepali">
              नेपाली नाम
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.name_np}
                onChange={(e) => handleChange("name_np", e.target.value)}
                placeholder="स्टिल थाली ठूलो"
                className="flex-1 h-12 px-4 border border-gray-300 rounded-xl font-nepali"
                data-testid="name-np-input"
              />
              <button
                type="button"
                onClick={handleConvertToNepali}
                className="px-4 h-12 bg-blue-500 text-white rounded-xl hover:bg-blue-600 flex items-center gap-2 shrink-0"
                title="Convert romanized text to Nepali"
              >
                <Languages className="w-4 h-4" />
                <span className="text-sm font-medium">Convert</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Click "Convert" to change romanized text to Nepali script
            </p>
          </div>
        </div>

        {/* Category & Location */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#8B0000]" />
            Category & Location / वर्ग र स्थान
          </h3>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">
              Category / वर्ग
            </label>
            <select
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl bg-white"
              data-testid="category-select"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name_en} / {cat.name_np}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">
              Location / स्थान
            </label>
            <select
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl bg-white"
              data-testid="location-select"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name_en} / {loc.name_np}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-[#8B0000]" />
            Pricing / मूल्य
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Cost Price / खरिद मूल्य
              </label>
              <input
                type="number"
                value={form.cost_price}
                onChange={(e) => handleChange("cost_price", e.target.value)}
                placeholder="0"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
                data-testid="cost-price-input"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Selling Price * / बिक्री मूल्य
              </label>
              <input
                type="number"
                value={form.selling_price}
                onChange={(e) => handleChange("selling_price", e.target.value)}
                placeholder="0"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
                data-testid="selling-price-input"
              />
            </div>
          </div>

          {margin !== null && (
            <div
              className={`text-sm p-2 rounded-lg ${parseFloat(margin) >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
            >
              Margin / नाफा: {margin}%
            </div>
          )}
        </div>

        {/* Stock */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Hash className="w-5 h-5 text-[#8B0000]" />
            Stock / स्टक
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Current Stock
              </label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                placeholder="0"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
                data-testid="quantity-input"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Low Stock Alert
              </label>
              <input
                type="number"
                value={form.low_stock_threshold}
                onChange={(e) =>
                  handleChange("low_stock_threshold", e.target.value)
                }
                placeholder="5"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
                data-testid="threshold-input"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-2 block">
              Count Type / गणना प्रकार
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChange("quantity_type", "exact")}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  form.quantity_type === "exact"
                    ? "bg-[#8B0000] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
                data-testid="qty-type-exact"
              >
                Exact / सही
              </button>
              <button
                type="button"
                onClick={() => handleChange("quantity_type", "approximate")}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  form.quantity_type === "approximate"
                    ? "bg-[#8B0000] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
                data-testid="qty-type-approx"
              >
                ~Approx / अनुमानित
              </button>
            </div>
          </div>
        </div>

        {/* Supplier */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#8B0000]" />
            Supplier / आपूर्तिकर्ता
          </h3>

          <select
            value={form.supplier_id}
            onChange={(e) => handleChange("supplier_id", e.target.value)}
            className="w-full h-12 px-4 border border-gray-300 rounded-xl bg-white"
            data-testid="supplier-select"
          >
            <option value="">No Supplier / आपूर्तिकर्ता छैन</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="w-full h-14 bg-[#8B0000] text-white text-lg font-semibold rounded-xl 
                       hover:bg-[#6B0000] active:scale-95 transition-all disabled:opacity-50
                       flex items-center justify-center gap-2"
            data-testid="save-btn"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isEdit
                  ? "Update Product / अपडेट गर्नु"
                  : "Add Product / थप्नुहोस्"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
