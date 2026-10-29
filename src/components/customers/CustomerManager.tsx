import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types/store';
import { sanitizeText, sanitizePhone, sanitizeEmail } from '../../utils/sanitize';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  DollarSign,
  ShoppingBag,
  Edit2,
  X,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const CustomerManager: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, orders, formatCurrency } =
    useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email || '');
    setNotes(customer.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name, 100);
    const cleanPhone = sanitizePhone(phone);
    const cleanEmail = sanitizeEmail(email);
    const cleanNotes = sanitizeText(notes, 500);

    if (!cleanName || !cleanPhone) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail || undefined,
        notes: cleanNotes || undefined,
      });
    } else {
      addCustomer({
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail || undefined,
        notes: cleanNotes || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
    }
  };

  const handleConfirmClearAll = () => {
    customers.forEach((c) => deleteCustomer(c.id));
    setIsClearAllModalOpen(false);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        (c.email && c.email.toLowerCase().includes(term));

      const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [customers, searchTerm, tierFilter]);

  const totalPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);
  const totalCustomerSpend = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 bg-emerald-50/30 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-slate-950 tracking-tight">
            Customers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage profiles and loyalty points
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {customers.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Clean customer list"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clean</span>
            </button>
          )}

          <button
            id="add-customer-main-btn"
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Accounts
            </span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-950">{customers.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Profiles</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Spent
            </span>
            <DollarSign className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-xl font-black text-slate-950">{formatCurrency(totalCustomerSpend)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total value</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Points
            </span>
          </div>
          <p className="text-xl font-black text-amber-600">{totalPoints.toLocaleString()} pts</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              VIP
            </span>
          </div>
          <p className="text-xl font-black text-purple-600">
            {customers.filter((c) => c.tier === 'VIP' || c.tier === 'Gold').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tier members</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, phone number, email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="all">All Loyalty Tiers</option>
              <option value="VIP">VIP</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Regular">Regular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No customer profiles found</h3>
          <p className="text-xs text-slate-400">
            {searchTerm ? 'Try adjusting your search query.' : 'Customer history is clean.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            return (
              <div
                key={customer.id}
                className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-200 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{customer.name}</h4>
                      <span
                        className={`inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-extrabold uppercase ${
                          customer.tier === 'VIP'
                            ? 'bg-purple-100 text-purple-800'
                            : customer.tier === 'Gold'
                            ? 'bg-amber-100 text-amber-800'
                            : customer.tier === 'Silver'
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {customer.tier || 'Regular'} Tier
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(customer)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCustomerToDelete(customer)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 mt-2.5">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] font-medium">{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] text-slate-500 truncate">
                          {customer.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {customer.notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl mt-2 italic border border-slate-100">
                      "{customer.notes}"
                    </p>
                  )}
                </div>

                {/* Stats Footer */}
                <div className="pt-2.5 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Spent
                    </span>
                    <span className="font-extrabold text-slate-900 text-xs">
                      {formatCurrency(customer.totalSpent || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Orders
                    </span>
                    <span className="font-extrabold text-slate-900 text-xs">
                      {customer.totalOrders || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Points
                    </span>
                    <span className="font-extrabold text-amber-600 text-xs">
                      {customer.loyaltyPoints || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-black text-slate-900 text-sm">
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Gonzalez"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7700 900077"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria@example.com"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Special Notes / Preferences
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferred produce, delivery preferences, box notes..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {editingCustomer ? 'Update Profile' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Customer Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h4 className="font-black text-slate-900 text-sm">Delete Customer Profile</h4>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">{customerToDelete.name}</strong>? This will remove their saved account profile and points history.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Customer Accounts Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-black text-slate-900 text-sm">Clean All Customer History?</h4>
            </div>
            <p className="text-xs text-slate-600">
              This will erase all customer profiles and loyalty history, leaving the customer accounts list clean and fresh.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Clean All History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
