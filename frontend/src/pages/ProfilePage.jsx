import { User, MapPin, Package, Mail, Phone, Edit2, Plus, X, Check, Loader2, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext.jsx';
import { getMyAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '@/services/addresses.js';
import api from '@/services/api.js';

function ProfilePage() {
  const { user, logout, restoreSession } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('info');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    recipientName: '',
    phone: '',
    line1: '',
    line2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
    loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const addrList = await getMyAddresses();
      setAddresses(addrList || []);
    } catch {
      // ignore
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('auth/me', { name, phone });
      await restoreSession();
      setSuccess('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      label: 'Home',
      recipientName: '',
      phone: '',
      line1: '',
      line2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const handleEditAddress = (addr) => {
    setAddressForm({
      label: addr.label || 'Home',
      recipientName: addr.recipientName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || '',
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault || false,
    });
    setEditingAddress(addr._id);
    setShowAddressForm(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (editingAddress) {
        await updateAddress(editingAddress, addressForm);
        setSuccess('Address updated.');
      } else {
        await createAddress(addressForm);
        setSuccess('Address added.');
      }
      resetAddressForm();
      setShowAddressForm(false);
      await loadAddresses();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      await deleteAddress(id);
      await loadAddresses();
      setSuccess('Address deleted.');
    } catch (err) {
      setError('Could not delete address.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      await loadAddresses();
    } catch {
      setError('Could not set default address.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'orders', label: 'My Orders', icon: Package },
  ];

  return (
    <div>
      <div className="border-b border-indigo/10 pb-6">
        <p className="eyebrow text-clay">Account</p>
        <h1 className="mt-2 font-display text-4xl text-indigo">My Profile</h1>
      </div>

      {success && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-2xl border border-clay/20 bg-clay/10 p-4">
          <p className="text-sm font-medium text-clay">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-indigo/10 pb-3 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id ? 'bg-indigo text-canvas' : 'text-muted hover:bg-indigo/5'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
        <button
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-clay hover:bg-clay/5 ml-auto transition"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {/* Personal Info */}
        {activeTab === 'info' && (
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl text-indigo">
                  <User size={20} className="inline mr-2" />
                  Personal Information
                </h2>
                <p className="mt-1 text-sm text-muted">Your name, email, and contact details.</p>
              </div>
              {!editing && (
                <button className="button-secondary text-sm" onClick={() => setEditing(true)}>
                  <Edit2 size={14} className="mr-1" /> Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-medium">Name</label>
                  <input className="form-input mt-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-xs font-medium">Email</label>
                  <input className="form-input mt-2" value={user?.email || ''} disabled placeholder="Email" />
                  <p className="mt-1 text-xs text-muted">Email cannot be changed.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium">Phone</label>
                  <input className="form-input mt-2" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
                </div>
                <div className="flex gap-3">
                  <button className="button-primary" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Save Changes
                  </button>
                  <button className="button-secondary" onClick={() => { setEditing(false); setName(user?.name || ''); setPhone(user?.phone || ''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted">Name</p>
                    <p className="text-sm font-medium mt-1">{user?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Email</p>
                    <p className="text-sm font-medium mt-1 flex items-center gap-2">
                      <Mail size={14} className="text-muted" />
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Phone</p>
                    <p className="text-sm font-medium mt-1 flex items-center gap-2">
                      <Phone size={14} className="text-muted" />
                      {user?.phone || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Role</p>
                    <p className="text-sm font-medium mt-1 capitalize">{user?.role || 'User'}</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Addresses */}
        {activeTab === 'addresses' && (
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl text-indigo">
                  <MapPin size={20} className="inline mr-2" />
                  My Addresses
                </h2>
                <p className="mt-1 text-sm text-muted">Manage your delivery addresses.</p>
              </div>
              {!showAddressForm && (
                <button className="button-secondary text-sm" onClick={() => { resetAddressForm(); setShowAddressForm(true); }}>
                  <Plus size={14} className="mr-1" /> Add New
                </button>
              )}
            </div>

            {showAddressForm ? (
              <form onSubmit={handleAddressSubmit} className="mt-6 space-y-4">
                {editingAddress && (
                  <div className="rounded-xl bg-indigo/5 p-3 text-xs text-indigo">
                    Editing address — save or cancel.
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium">Label</label>
                    <select className="form-input mt-1" value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}>
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Full Name *</label>
                    <input className="form-input mt-1" required value={addressForm.recipientName} onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })} placeholder="Recipient name" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium">Phone *</label>
                    <input className="form-input mt-1" required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="Phone number" />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="accent-indigo" />
                      <span className="text-xs">Set as default</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium">Address Line 1 *</label>
                  <input className="form-input mt-1" required value={addressForm.line1} onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })} placeholder="Street, building, apartment" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium">Address Line 2</label>
                    <input className="form-input mt-1" value={addressForm.line2} onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })} placeholder="Area, landmark" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Landmark</label>
                    <input className="form-input mt-1" value={addressForm.landmark} onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })} placeholder="Nearby landmark" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium">City *</label>
                    <input className="form-input mt-1" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="City" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">State *</label>
                    <input className="form-input mt-1" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} placeholder="State" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Pincode *</label>
                    <input className="form-input mt-1" required value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} placeholder="Pincode" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="button-primary" disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </button>
                  <button type="button" className="button-secondary" onClick={() => { setShowAddressForm(false); resetAddressForm(); }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : loadingAddresses ? (
              <div className="mt-6 flex justify-center py-8">
                <Loader2 className="animate-spin text-indigo" size={24} />
              </div>
            ) : addresses.length === 0 ? (
              <div className="mt-6 rounded-xl bg-sand/50 p-8 text-center">
                <MapPin size={32} className="mx-auto text-muted" />
                <p className="mt-3 text-sm text-muted">No addresses saved yet.</p>
                <button className="button-secondary mt-4" onClick={() => { resetAddressForm(); setShowAddressForm(true); }}>
                  <Plus size={14} className="mr-1" /> Add Your First Address
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {addresses.map((addr) => (
                  <div key={addr._id} className="rounded-xl border border-indigo/10 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{addr.recipientName}</p>
                          <span className="status-pill bg-indigo/10 text-indigo text-[10px]">{addr.label}</span>
                          {addr.isDefault && <span className="status-pill bg-emerald-100 text-emerald-700 text-[10px]">Default</span>}
                        </div>
                        <p className="text-xs text-muted mt-1">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                        {addr.landmark && <p className="text-xs text-muted">{addr.landmark}</p>}
                        <p className="text-xs text-muted">{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-xs text-muted mt-1">Phone: {addr.phone}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button className="text-xs text-indigo hover:underline" onClick={() => handleEditAddress(addr)}>Edit</button>
                        {!addr.isDefault && (
                          <>
                            <button className="text-xs text-indigo hover:underline" onClick={() => handleSetDefault(addr._id)}>Set Default</button>
                            <button className="text-xs text-clay hover:underline" onClick={() => handleDeleteAddress(addr._id)}>Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Orders */}
        {activeTab === 'orders' && (
          <section className="rounded-2xl border border-indigo/10 bg-canvas p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl text-indigo">
                  <Package size={20} className="inline mr-2" />
                  My Orders
                </h2>
                <p className="mt-1 text-sm text-muted">View your order history and track deliveries.</p>
              </div>
              <Link to="/orders" className="button-secondary text-sm">
                View All Orders
              </Link>
            </div>
            <div className="mt-6 rounded-xl bg-sand/50 p-8 text-center">
              <Package size={32} className="mx-auto text-muted" />
              <p className="mt-3 text-sm text-muted">Go to your orders page to see all your orders.</p>
              <Link to="/orders" className="button-primary mt-4 inline-block">
                Go to My Orders
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;