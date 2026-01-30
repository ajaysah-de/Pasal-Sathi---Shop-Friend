import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Settings as SettingsIcon,
  LogOut,
  Users,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Edit2,
  Save,
  X,
  Key,
  Grid3x3,
  Tag,
} from "lucide-react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const API_BASE = process.env.REACT_APP_BACKEND_URL?.replace(/\/$/, "") || "";
const API = `${API_BASE}/api`;

export default function Settings() {
  const navigate = useNavigate();
  const { logout, getAuthHeader, shopName, shopNameEn, userRole } = useAuth();

  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("suppliers"); // suppliers, categories, locations, users
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [categoryForm, setCategoryForm] = useState({
    name_en: "",
    name_np: "",
    icon: "package",
    color: "#6B7280",
  });
  const [locationForm, setLocationForm] = useState({
    name_en: "",
    name_np: "",
  });
  const [userForm, setUserForm] = useState({
    name: "",
    pin: "",
    role: "cashier",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const requests = [
        axios.get(`${API}/suppliers`, getAuthHeader()),
        axios.get(`${API}/categories`, getAuthHeader()),
        axios.get(`${API}/locations`, getAuthHeader()),
      ];
      
      // Only fetch users if owner or manager
      if (userRole === "owner" || userRole === "manager") {
        requests.push(axios.get(`${API}/users`, getAuthHeader()));
      }
      
      const responses = await Promise.all(requests);
      setSuppliers(responses[0].data);
      setCategories(responses[1].data);
      setLocations(responses[2].data);
      
      if (responses[3]) {
        setUsers(responses[3].data);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API}/suppliers`, getAuthHeader());
      setSuppliers(res.data);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierSubmit = async () => {
    if (!supplierForm.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingSupplier) {
        await axios.put(
          `${API}/suppliers/${editingSupplier.id}`,
          supplierForm,
          getAuthHeader(),
        );
        toast.success("Supplier updated!");
      } else {
        await axios.post(`${API}/suppliers`, supplierForm, getAuthHeader());
        toast.success("Supplier added!");
      }
      fetchSuppliers();
      closeSupplierModal();
    } catch (err) {
      toast.error("Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (!window.confirm("Delete this supplier?")) return;

    try {
      await axios.delete(`${API}/suppliers/${supplierId}`, getAuthHeader());
      toast.success("Supplier deleted");
      fetchSuppliers();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const openSupplierModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierForm({
        name: supplier.name,
        phone: supplier.phone || "",
        address: supplier.address || "",
        notes: supplier.notes || "",
      });
    } else {
      setEditingSupplier(null);
      setSupplierForm({ name: "", phone: "", address: "", notes: "" });
    }
    setShowSupplierModal(true);
  };

  const closeSupplierModal = () => {
    setShowSupplierModal(false);
    setEditingSupplier(null);
    setSupplierForm({ name: "", phone: "", address: "", notes: "" });
  };

  // Category Management
  const handleCategorySubmit = async () => {
    if (!categoryForm.name_en.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await axios.put(
          `${API}/categories/${editingCategory.id}`,
          categoryForm,
          getAuthHeader(),
        );
        toast.success("Category updated!");
      } else {
        await axios.post(`${API}/categories`, categoryForm, getAuthHeader());
        toast.success("Category added!");
      }
      fetchData();
      closeCategoryModal();
    } catch (err) {
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Delete this category?")) return;

    try {
      await axios.delete(`${API}/categories/${categoryId}`, getAuthHeader());
      toast.success("Category deleted");
      fetchData();
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error(err.response.data.detail || "Cannot delete category");
      } else {
        toast.error("Failed to delete");
      }
    }
  };

  const openCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name_en: category.name_en,
        name_np: category.name_np || "",
        icon: category.icon || "package",
        color: category.color || "#6B7280",
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name_en: "",
        name_np: "",
        icon: "package",
        color: "#6B7280",
      });
    }
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({
      name_en: "",
      name_np: "",
      icon: "package",
      color: "#6B7280",
    });
  };

  // Location Management
  const handleLocationSubmit = async () => {
    if (!locationForm.name_en.trim()) {
      toast.error("Location name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingLocation) {
        await axios.put(
          `${API}/locations/${editingLocation.id}`,
          locationForm,
          getAuthHeader(),
        );
        toast.success("Location updated!");
      } else {
        await axios.post(`${API}/locations`, locationForm, getAuthHeader());
        toast.success("Location added!");
      }
      fetchData();
      closeLocationModal();
    } catch (err) {
      toast.error("Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm("Delete this location?")) return;

    try {
      await axios.delete(`${API}/locations/${locationId}`, getAuthHeader());
      toast.success("Location deleted");
      fetchData();
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error(err.response.data.detail || "Cannot delete location");
      } else {
        toast.error("Failed to delete");
      }
    }
  };

  const openLocationModal = (location = null) => {
    if (location) {
      setEditingLocation(location);
      setLocationForm({
        name_en: location.name_en,
        name_np: location.name_np || "",
      });
    } else {
      setEditingLocation(null);
      setLocationForm({ name_en: "", name_np: "" });
    }
    setShowLocationModal(true);
  };

  const closeLocationModal = () => {
    setShowLocationModal(false);
    setEditingLocation(null);
    setLocationForm({ name_en: "", name_np: "" });
  };

  // User management functions
  const handleUserSubmit = async () => {
    if (!userForm.name.trim()) {
      toast.error("User name is required");
      return;
    }
    
    if (!editingUser && (!userForm.pin || userForm.pin.length < 4)) {
      toast.error("PIN must be at least 4 digits");
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const payload = { name: userForm.name, role: userForm.role };
        if (userForm.pin) {
          payload.pin = userForm.pin;
        }
        await axios.put(`${API}/users/${editingUser.id}`, payload, getAuthHeader());
        toast.success("User updated");
      } else {
        await axios.post(`${API}/users`, userForm, getAuthHeader());
        toast.success("User created");
      }
      fetchData();
      closeUserModal();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user? They will not be able to login.")) return;

    try {
      await axios.delete(`${API}/users/${userId}`, getAuthHeader());
      toast.success("User deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete user");
    }
  };

  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        pin: "",
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: "", pin: "", role: "cashier" });
    }
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({ name: "", pin: "", role: "cashier" });
  };

  const handleLogout = () => {
    if (window.confirm("Logout from shop? / पसलबाट बाहिर निस्कने?")) {
      logout();
      navigate("/login");
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn" data-testid="settings-page">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold">Settings / सेटिङ</h1>
          <p className="text-sm text-gray-500">Manage your shop</p>
        </div>

        {/* Shop Info */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#8B0000] rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[#2D2D2D] font-nepali">
                {shopName}
              </h2>
              <p className="text-sm text-gray-500">{shopNameEn}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "suppliers"
                ? "bg-white text-[#8B0000] shadow-sm"
                : "text-gray-600"
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            Suppliers
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "categories"
                ? "bg-white text-[#8B0000] shadow-sm"
                : "text-gray-600"
            }`}
          >
            <Tag className="w-4 h-4 inline mr-1" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab("locations")}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === "locations"
                ? "bg-white text-[#8B0000] shadow-sm"
                : "text-gray-600"
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-1" />
            Locations
          </button>
          {(userRole === "owner" || userRole === "manager") && (
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "users"
                  ? "bg-white text-[#8B0000] shadow-sm"
                  : "text-gray-600"
              }`}
            >
              <Key className="w-4 h-4 inline mr-1" />
              Users
            </button>
          )}
        </div>

        {/* Suppliers Section */}
        {activeTab === "suppliers" && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#8B0000]" />
                <h2 className="font-semibold">Suppliers / आपूर्तिकर्ता</h2>
              </div>
              <button
                onClick={() => openSupplierModal()}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#8B0000] text-white rounded-lg text-sm font-medium"
                data-testid="add-supplier-btn"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="loader"></div>
              </div>
            ) : suppliers.length > 0 ? (
              <div className="space-y-2">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    data-testid={`supplier-${supplier.id}`}
                  >
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      {supplier.phone && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {supplier.phone}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openSupplierModal(supplier)}
                        className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No suppliers added yet
              </p>
            )}
          </div>
        )}

        {/* Categories Section */}
        {activeTab === "categories" && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#8B0000]" />
                <h2 className="font-semibold">Categories / वर्ग</h2>
              </div>
              <button
                onClick={() => openCategoryModal()}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#8B0000] text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="loader"></div>
              </div>
            ) : categories.length > 0 ? (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: category.color + "20" }}
                      >
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{category.name_en}</p>
                        <p className="text-sm text-gray-500 font-nepali">
                          {category.name_np}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openCategoryModal(category)}
                        className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No categories added yet
              </p>
            )}
          </div>
        )}

        {/* Locations Section */}
        {activeTab === "locations" && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#8B0000]" />
                <h2 className="font-semibold">Locations / स्थान</h2>
              </div>
              <button
                onClick={() => openLocationModal()}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#8B0000] text-white rounded-lg text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="loader"></div>
              </div>
            ) : locations.length > 0 ? (
              <div className="space-y-2">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium">{location.name_en}</p>
                      <p className="text-sm text-gray-500 font-nepali">
                        {location.name_np}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openLocationModal(location)}
                        className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No locations added yet
              </p>
            )}
          </div>
        )}

        {/* Users Section */}
        {activeTab === "users" && (userRole === "owner" || userRole === "manager") && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#8B0000]" />
                <h2 className="font-semibold">Users / प्रयोगकर्ताहरू</h2>
              </div>
              {userRole === "owner" && (
                <button
                  onClick={() => openUserModal()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#8B0000] text-white rounded-lg text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="loader"></div>
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#8B0000] rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                        <p className="text-xs text-gray-400">
                          {user.is_active ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>
                    {userRole === "owner" && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openUserModal(user)}
                          className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user.role !== "owner" && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No users found
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl font-medium"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
            Logout / बाहिर निस्कनु
          </button>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-gray-400 py-4">
          <p className="font-nepali">पसल साथी</p>
          <p>Pasal Sathi v1.0</p>
          <p>Made for Nepal 🇳🇵</p>
        </div>

        {/* Supplier Modal */}
        <Modal
          isOpen={showSupplierModal}
          onClose={closeSupplierModal}
          title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
          titleNp={editingSupplier ? "सम्पादन गर्नु" : "आपूर्तिकर्ता थप्नु"}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Name / नाम *
              </label>
              <input
                type="text"
                value={supplierForm.name}
                onChange={(e) =>
                  setSupplierForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Supplier Name"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
                data-testid="supplier-name-input"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Phone / फोन
              </label>
              <input
                type="tel"
                value={supplierForm.phone}
                onChange={(e) =>
                  setSupplierForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="9800000000"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
                data-testid="supplier-phone-input"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Address / ठेगाना
              </label>
              <input
                type="text"
                value={supplierForm.address}
                onChange={(e) =>
                  setSupplierForm((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                placeholder="Kalimati, Kathmandu"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
                data-testid="supplier-address-input"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Notes / टिप्पणी
              </label>
              <textarea
                value={supplierForm.notes}
                onChange={(e) =>
                  setSupplierForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Any notes..."
                className="w-full h-24 px-4 py-3 border border-gray-300 rounded-xl resize-none"
                data-testid="supplier-notes-input"
              />
            </div>

            <button
              onClick={handleSupplierSubmit}
              disabled={saving}
              className="w-full h-12 bg-[#8B0000] text-white font-semibold rounded-xl 
                         flex items-center justify-center gap-2"
              data-testid="save-supplier-btn"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingSupplier ? "Update" : "Add Supplier"}
                </>
              )}
            </button>
          </div>
        </Modal>

        {/* Category Modal */}
        <Modal
          isOpen={showCategoryModal}
          onClose={closeCategoryModal}
          title={editingCategory ? "Edit Category" : "Add Category"}
          titleNp={editingCategory ? "सम्पादन गर्नु" : "वर्ग थप्नु"}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Name (English) *
              </label>
              <input
                type="text"
                value={categoryForm.name_en}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    name_en: e.target.value,
                  }))
                }
                placeholder="Steel Utensils"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Name (Nepali) / नाम
              </label>
              <input
                type="text"
                value={categoryForm.name_np}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    name_np: e.target.value,
                  }))
                }
                placeholder="स्टिल भाँडा"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl font-nepali"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Icon</label>
              <select
                value={categoryForm.icon}
                onChange={(e) =>
                  setCategoryForm((prev) => ({ ...prev, icon: e.target.value }))
                }
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
              >
                <option value="package">Package</option>
                <option value="pot-steaming">Pot</option>
                <option value="lamp">Lamp</option>
                <option value="cup-soda">Cup</option>
                <option value="zap">Electric</option>
                <option value="brush">Brush</option>
                <option value="grid-3x3">Grid</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">Color</label>
              <input
                type="color"
                value={categoryForm.color}
                onChange={(e) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    color: e.target.value,
                  }))
                }
                className="w-full h-12 px-2 border border-gray-300 rounded-xl"
              />
            </div>

            <button
              onClick={handleCategorySubmit}
              disabled={saving}
              className="w-full h-12 bg-[#8B0000] text-white font-semibold rounded-xl 
                         flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingCategory ? "Update" : "Add Category"}
                </>
              )}
            </button>
          </div>
        </Modal>

        {/* Location Modal */}
        <Modal
          isOpen={showLocationModal}
          onClose={closeLocationModal}
          title={editingLocation ? "Edit Location" : "Add Location"}
          titleNp={editingLocation ? "सम्पादन गर्नु" : "स्थान थप्नु"}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Name (English) *
              </label>
              <input
                type="text"
                value={locationForm.name_en}
                onChange={(e) =>
                  setLocationForm((prev) => ({
                    ...prev,
                    name_en: e.target.value,
                  }))
                }
                placeholder="Top Shelf"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Name (Nepali) / नाम
              </label>
              <input
                type="text"
                value={locationForm.name_np}
                onChange={(e) =>
                  setLocationForm((prev) => ({
                    ...prev,
                    name_np: e.target.value,
                  }))
                }
                placeholder="माथि शेल्फ"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl font-nepali"
              />
            </div>

            <button
              onClick={handleLocationSubmit}
              disabled={saving}
              className="w-full h-12 bg-[#8B0000] text-white font-semibold rounded-xl 
                         flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingLocation ? "Update" : "Add Location"}
                </>
              )}
            </button>
          </div>
        </Modal>

        {/* User Modal */}
        <Modal
          isOpen={showUserModal}
          onClose={closeUserModal}
          title={editingUser ? "Edit User" : "Add User"}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Name *
              </label>
              <input
                type="text"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="John Doe / जोन"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                PIN {editingUser ? "(leave empty to keep current)" : "*"}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={userForm.pin}
                onChange={(e) =>
                  setUserForm((prev) => ({
                    ...prev,
                    pin: e.target.value.replace(/\D/g, "").slice(0, 6),
                  }))
                }
                placeholder="4-6 digit PIN"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
              />
              <p className="text-xs text-gray-400 mt-1">
                {editingUser 
                  ? "Enter new PIN only if you want to change it"
                  : "4-6 digit PIN for login"}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-1 block">
                Role / भूमिका *
              </label>
              <select
                value={userForm.role}
                onChange={(e) =>
                  setUserForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
              >
                <option value="cashier">Cashier / कर्मचारी</option>
                <option value="manager">Manager / प्रबन्धक</option>
                <option value="owner">Owner / मालिक</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Owner can manage all users. Manager can view users. Cashier has basic access.
              </p>
            </div>

            <button
              onClick={handleUserSubmit}
              disabled={saving}
              className="w-full h-12 bg-[#8B0000] text-white font-semibold rounded-xl 
                         flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingUser ? "Update User" : "Add User"}
                </>
              )}
            </button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
