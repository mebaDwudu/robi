import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Settings,
  Store,
  DollarSign,
  Percent,
  Receipt,
  RotateCcw,
  Download,
  Upload,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Coins,
  Database,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Server,
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  Plus,
  Trash2,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { firebaseConfig } from '../../lib/firebase';
import { StaffMember } from '../../types/store';
import { sanitizeText, sanitizePhone, sanitizeEmail } from '../../utils/sanitize';
import { validateAndReadJSONUpload } from '../../utils/secureUpload';

export const StoreSettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    currentShift,
    openShift,
    closeShift,
    clearAllSalesAndTransactions,
    resetToDemoData,
    exportDataJSON,
    formatCurrency,
    dbStatus,
    isCloudConnected,
    lastSyncedAt,
    products,
    orders,
    customers,
    suppliers,
    purchaseOrders,
    staffMembers,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    currentStaff,
  } = useStore();

  const [formState, setFormState] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);

  // Shift modals
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [actualCashCount, setActualCashCount] = useState<string>('');
  const [shiftNotes, setShiftNotes] = useState('');

  const [isOpenShiftOpen, setIsOpenShiftOpen] = useState(false);
  const [newStartingFloat, setNewStartingFloat] = useState<string>('250.00');

  // Staff Modal
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'admin' | 'cashier'>('cashier');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');

  // Backup restore state
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedStoreName = sanitizeText(formState.storeName, 100);
    const sanitizedAddress = sanitizeText(formState.storeAddress, 250);
    const sanitizedPhone = sanitizePhone(formState.storePhone);
    const sanitizedEmail = sanitizeEmail(formState.storeEmail);
    const sanitizedCurrency = sanitizeText(formState.currency, 10);
    const sanitizedHeader = sanitizeText(formState.receiptHeaderMessage || '', 200);
    const sanitizedFooter = sanitizeText(formState.receiptFooterMessage || '', 200);
    const sanitizedAdminPin = sanitizeText(formState.adminPin || '1234', 10);
    const sanitizedCashierPin = sanitizeText(formState.cashierPin || '0000', 10);

    updateSettings({
      ...formState,
      storeName: sanitizedStoreName || 'Brixton Tropical Fresh POS',
      storeAddress: sanitizedAddress,
      storePhone: sanitizedPhone,
      storeEmail: sanitizedEmail,
      currency: sanitizedCurrency || '£',
      receiptHeaderMessage: sanitizedHeader,
      receiptFooterMessage: sanitizedFooter,
      adminPin: sanitizedAdminPin,
      cashierPin: sanitizedCashierPin,
      taxRatePercent: Number(formState.taxRatePercent) || 0,
      lowStockThresholdDefault: Number(formState.lowStockThresholdDefault) || 5,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResyncDatabase = async () => {
    setIsResyncing(true);
    await resetToDemoData();
    setTimeout(() => setIsResyncing(false), 1000);
  };

  const handleExecuteCloseShift = () => {
    const cashVal = parseFloat(actualCashCount) || 0;
    const cleanNotes = sanitizeText(shiftNotes, 500);
    closeShift(cashVal, cleanNotes);
    setIsCloseShiftOpen(false);
    setActualCashCount('');
    setShiftNotes('');
  };

  const handleExecuteOpenShift = () => {
    const floatVal = parseFloat(newStartingFloat) || 0;
    const cleanNotes = sanitizeText(shiftNotes, 500);
    openShift(floatVal, cleanNotes);
    setIsOpenShiftOpen(false);
    setShiftNotes('');
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(newStaffName, 100);
    const cleanPin = sanitizeText(newStaffPin, 10);
    const cleanEmail = sanitizeEmail(newStaffEmail);

    if (!cleanName || !cleanPin) return;

    addStaffMember({
      name: cleanName,
      role: newStaffRole,
      pin: cleanPin,
      email: cleanEmail || undefined,
      active: true,
    });

    setIsAddStaffOpen(false);
    setNewStaffName('');
    setNewStaffPin('');
    setNewStaffEmail('');
  };

  const handleRestoreFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreMessage(null);
    setRestoreError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be reselected
    e.target.value = '';

    const validation = await validateAndReadJSONUpload(file);
    if (!validation.isValid || !validation.data) {
      setRestoreError(validation.error || 'Invalid backup file');
      return;
    }

    try {
      const data = validation.data;
      if (typeof data !== 'object' || data === null) {
        throw new Error('Backup file must contain a valid JSON object.');
      }
      setRestoreMessage(`Backup "${file.name}" validated successfully (safe, non-executable).`);
      setTimeout(() => setRestoreMessage(null), 5000);
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to read backup file.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            <span>Store Configuration & Administration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage store profile, tax rules, staff roles & PIN permissions, cash drawer shifts, and Cloud Firestore sync.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center space-x-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Store Information & Staff Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Store Info Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Store className="w-5 h-5 text-emerald-600" />
              <span>Store Profile & Tax Identifiers</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Store Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formState.storeName}
                    onChange={(e) => setFormState({ ...formState, storeName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Business Tax ID / EIN</label>
                  <input
                    type="text"
                    value={formState.taxNumber}
                    onChange={(e) => setFormState({ ...formState, taxNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formState.storePhone}
                    onChange={(e) => setFormState({ ...formState, storePhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formState.storeEmail}
                    onChange={(e) => setFormState({ ...formState, storeEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Physical Store Address</label>
                <input
                  type="text"
                  value={formState.storeAddress}
                  onChange={(e) => setFormState({ ...formState, storeAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Financial & Tax Parameters */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Financial, Tax & Register Defaults
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={formState.currencySymbol}
                      onChange={(e) => setFormState({ ...formState, currencySymbol: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-center font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Sales Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formState.taxRatePercent}
                      onChange={(e) => setFormState({ ...formState, taxRatePercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-center font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Default Low Stock Alert</label>
                    <input
                      type="number"
                      min="1"
                      value={formState.lowStockThresholdDefault}
                      onChange={(e) => setFormState({ ...formState, lowStockThresholdDefault: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm text-center font-bold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Storefront Display Preferences */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Customer Storefront Configuration
                </h4>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">
                      Show Prices to Customers in Storefront
                    </span>
                    <p className="text-[11px] text-slate-500 max-w-md">
                      When turned off (disabled), customers will browse catalog items and submit order lists without seeing unit prices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormState({
                        ...formState,
                        showPricesToCustomers: !formState.showPricesToCustomers,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      formState.showPricesToCustomers ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        formState.showPricesToCustomers ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Receipt Messages */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Receipt Header Greeting</label>
                  <input
                    type="text"
                    value={formState.receiptHeaderMessage}
                    onChange={(e) => setFormState({ ...formState, receiptHeaderMessage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Receipt Return Policy Footer</label>
                  <input
                    type="text"
                    value={formState.receiptFooterMessage}
                    onChange={(e) => setFormState({ ...formState, receiptFooterMessage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Save Store Settings
                </button>
              </div>
            </form>
          </div>

          {/* Staff & Role-Based Access Control (RBAC) Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>Staff Roles & Terminal Security PINs</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign Cashier vs Boss Admin roles. Cashiers can only access the POS checkout register.
                </p>
              </div>

              <button
                onClick={() => setIsAddStaffOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer w-fit"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff Member</span>
              </button>
            </div>

            {/* Global Security PINs Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-indigo-900 block mb-1 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Master Boss Admin PIN</span>
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={formState.adminPin || ''}
                  onChange={(e) => setFormState({ ...formState, adminPin: e.target.value.replace(/\D/g, '') })}
                  placeholder="••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400">Used to unlock Financial Reports and Settings.</span>
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-900 block mb-1 flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Default Cashier Quick PIN</span>
                </label>
                <input
                  type="password"
                  maxLength={8}
                  value={formState.cashierPin || ''}
                  onChange={(e) => setFormState({ ...formState, cashierPin: e.target.value.replace(/\D/g, '') })}
                  placeholder="••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400">Used for quick terminal unlocking.</span>
              </div>
            </div>

            {/* Staff Accounts Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Role Privilege</th>
                    <th className="p-3">Login PIN</th>
                    <th className="p-3">Access Restrictions</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffMembers.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center space-x-2">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            staff.role === 'admin' ? 'bg-indigo-500' : 'bg-emerald-500'
                          }`}
                        />
                        <span>{staff.name}</span>
                        {staff.id === currentStaff.id && (
                          <span className="text-[9px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            staff.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {staff.role === 'admin' ? 'Boss / Admin' : 'Cashier'}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        ••••••
                      </td>
                      <td className="p-3 text-slate-500">
                        {staff.role === 'admin' ? (
                          <span className="text-indigo-700 font-semibold">Full Unrestricted Access</span>
                        ) : (
                          <span className="text-amber-700 font-medium">POS Register Only</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {staffMembers.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove staff profile "${staff.name}"?`)) {
                                deleteStaffMember(staff.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove Staff Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Shift Management & Data Reset */}
        <div className="space-y-6">
          {/* Register Shift Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <span>Register Cash Drawer</span>
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  currentShift.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {currentShift.isOpen ? 'Shift Active' : 'Shift Closed'}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Opened At:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(currentShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Starting Float:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(currentShift.startingCash)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cash Sales Recorded:</span>
                <span className="font-semibold text-emerald-700">+{formatCurrency(currentShift.cashSales)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Card & Mobile Sales:</span>
                <span className="font-semibold text-blue-700">+{formatCurrency(currentShift.cardSales + currentShift.mobileSales)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Expected Drawer Cash:</span>
                <span className="text-emerald-700">{formatCurrency(currentShift.expectedCashInDrawer)}</span>
              </div>
            </div>

            {currentShift.isOpen ? (
              <button
                onClick={() => {
                  setActualCashCount(currentShift.expectedCashInDrawer.toString());
                  setIsCloseShiftOpen(true);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>Count Cash & Close Shift</span>
              </button>
            ) : (
              <button
                onClick={() => setIsOpenShiftOpen(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Open New Register Shift</span>
              </button>
            )}
          </div>

          {/* Cloud Firestore Database Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>Cloud Database (Firestore)</span>
              </h3>
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  dbStatus === 'connected'
                    ? 'bg-emerald-100 text-emerald-800'
                    : dbStatus === 'syncing'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {dbStatus === 'connected' && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live & Synced</span>
                  </>
                )}
                {dbStatus === 'syncing' && (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Syncing...</span>
                  </>
                )}
                {dbStatus === 'offline' && <span>Offline Mode</span>}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              All store inventory, orders, staff, customers, and financial shift logs are stored persistently in Google Cloud Firestore in real-time.
            </p>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Project ID:</span>
                <span className="font-mono text-slate-800 font-medium text-[11px] bg-slate-200/60 px-1.5 py-0.5 rounded">
                  {firebaseConfig.projectId}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Database ID:</span>
                <span className="font-mono text-slate-800 font-medium text-[11px] bg-slate-200/60 px-1.5 py-0.5 rounded truncate max-w-[160px]" title={firebaseConfig.firestoreDatabaseId}>
                  {firebaseConfig.firestoreDatabaseId || '(default)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Last Cloud Sync:</span>
                <span className="font-semibold text-slate-800">{lastSyncedAt}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex justify-between text-slate-500 text-[11px]">
                <span>Synced Entities:</span>
                <span className="font-medium text-emerald-700">
                  {products.length} Products • {orders.length} Orders • {staffMembers.length} Staff
                </span>
              </div>
            </div>

            <button
              onClick={handleResyncDatabase}
              disabled={isResyncing}
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isResyncing ? 'animate-spin' : ''}`} />
              <span>{isResyncing ? 'Syncing Cloud Collections...' : 'Push / Sync Sample Dataset to Cloud'}</span>
            </button>
          </div>

          {/* Backup & Demo Data Reset Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Data Backup & Maintenance</h3>

            <p className="text-xs text-slate-500">
              Download your complete inventory, transaction logs, and supplier profiles as a JSON backup or restore default sample catalog items.
            </p>

            <div className="space-y-2">
              <button
                onClick={exportDataJSON}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Download Store Data JSON Backup</span>
              </button>

              <input
                ref={backupInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleRestoreFileSelected}
                className="hidden"
              />

              <button
                onClick={() => backupInputRef.current?.click()}
                className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload & Validate Backup File</span>
              </button>

              {restoreMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-semibold text-emerald-800 flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{restoreMessage}</span>
                </div>
              )}

              {restoreError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] font-semibold text-rose-800 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              <button
                onClick={() => {
                  if (
                    confirm(
                      'Clear all sales history, customer orders, and revenue records? Your product inventory and store settings will remain intact, with £0 total revenue for a clean client start.'
                    )
                  ) {
                    clearAllSalesAndTransactions();
                    alert('All sales history, revenue records, and order transactions have been cleared to £0.00.');
                  }
                }}
                className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4 text-amber-600" />
                <span>Clear All Sales & Revenue Data (Fresh Slate for Client)</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all data back to the default store catalog? Current local changes will be replaced.')) {
                    resetToDemoData();
                  }
                }}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Clean Catalog & Initial State</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 text-base">Add New Staff / Cashier Account</h4>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Role Privilege *</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as 'admin' | 'cashier')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="cashier">Cashier (POS Only)</option>
                    <option value="admin">Boss / Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Login PIN (4 digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value)}
                    placeholder="e.g. 5678"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="alex@store.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {isCloseShiftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-base mb-3">Reconcile & Close Cash Drawer</h4>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Counted Physical Cash in Drawer ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualCashCount}
                  onChange={(e) => setActualCashCount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {actualCashCount && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-600">Discrepancy (Over / Short):</span>
                  <span
                    className={`font-mono font-bold ${
                      parseFloat(actualCashCount) - currentShift.expectedCashInDrawer >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {formatCurrency(parseFloat(actualCashCount) - currentShift.expectedCashInDrawer)}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Shift Notes / Handover</label>
                <textarea
                  rows={2}
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  placeholder="Drawer notes, change notes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCloseShiftOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCloseShift}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Confirm Close Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open Shift Modal */}
      {isOpenShiftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-base mb-3">Open New Cash Register Shift</h4>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Starting Cash Float ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newStartingFloat}
                  onChange={(e) => setNewStartingFloat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Opening Shift Note</label>
                <input
                  type="text"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  placeholder="Morning shift opening float..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpenShiftOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteOpenShift}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  Start Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
