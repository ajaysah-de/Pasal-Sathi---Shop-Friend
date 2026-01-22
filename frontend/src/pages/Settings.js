import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Settings as SettingsIcon, LogOut, Users, Plus, 
  Trash2, Phone, MapPin, Edit2, Save, X, Key
} from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Settings() {
  const navigate = useNavigate();
  const { logout, getAuthHeader, shopName, shopNameEn } = useAuth();
  
  const [suppliers, setSuppliers] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API}/suppliers`, getAuthHeader());
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierSubmit = async () => {
    if (!supplierForm.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    setSaving(true);
    try {
      if (editingSupplier) {
        await axios.put(`${API}/suppliers/${editingSupplier.id}`, supplierForm, getAuthHeader());
        toast.success('Supplier updated!');
      } else {
        await axios.post(`${API}/suppliers`, supplierForm, getAuthHeader());
        toast.success('Supplier added!');
      }
      fetchSuppliers();
      closeSupplierModal();
    } catch (err) {
      toast.error('Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (!window.confirm('Delete this supplier?')) return;
    
    try {
      await axios.delete(`${API}/suppliers/${supplierId}`, getAuthHeader());
      toast.success('Supplier deleted');
      fetchSuppliers();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const openSupplierModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierForm({
        name: supplier.name,
        phone: supplier.phone || '',
        address: supplier.address || '',
        notes: supplier.notes || ''
      });
    } else {
      setEditingSupplier(null);
      setSupplierForm({ name: '', phone: '', address: '', notes: '' });
    }
    setShowSupplierModal(true);
  };

  const closeSupplierModal = () => {
    setShowSupplierModal(false);
    setEditingSupplier(null);
    setSupplierForm({ name: '', phone: '', address: '', notes: '' });
  };

  const handleLogout = () => {
    if (window.confirm('Logout from shop? / पसलबाट बाहिर निस्कने?')) {
      logout();
      navigate('/login');
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
              <h2 className="font-semibold text-[#2D2D2D] font-nepali">{shopName}</h2>
              <p className="text-sm text-gray-500">{shopNameEn}</p>
            </div>
          </div>
        </div>

        {/* Suppliers Section */}
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
            <p className="text-center text-gray-500 py-4">No suppliers added yet</p>
          )}
        </div>

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
          title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
          titleNp={editingSupplier ? 'सम्पादन गर्नु' : 'आपूर्तिकर्ता थप्नु'}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Name / नाम *</label>
              <input
                type="text"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Supplier Name"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
                data-testid="supplier-name-input"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Phone / फोन</label>
              <input
                type="tel"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="9800000000"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
                data-testid="supplier-phone-input"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Address / ठेगाना</label>
              <input
                type="text"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Kalimati, Kathmandu"
                className="w-full h-12 px-4 border border-gray-300 rounded-xl"
                data-testid="supplier-address-input"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Notes / टिप्पणी</label>
              <textarea
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, notes: e.target.value }))}
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
                  {editingSupplier ? 'Update' : 'Add Supplier'}
                </>
              )}
            </button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
