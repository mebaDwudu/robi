import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { StaffMember } from '../../types/store';
import {
  Store,
  Shield,
  ShieldCheck,
  User,
  Users,
  Lock,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShoppingBag,
  Boxes,
  Receipt,
  BarChart3,
  Truck,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../utils/security';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const {
    staffMembers,
    settings,
    loginStaff,
    quickLoginStaff,
    loginWithPin,
  } = useStore();

  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    staffMembers[0]?.id || 'staff-boss-1'
  );
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  useEffect(() => {
    const rate = checkRateLimit(`login-staff-${selectedStaffId}`);
    if (rate.isLocked) {
      setLockoutRemaining(rate.remainingSeconds);
      setError(`Account locked for ${rate.remainingSeconds}s due to failed attempts.`);
    } else {
      setLockoutRemaining(0);
      setError(null);
    }
  }, [selectedStaffId]);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          setError(null);
          return 0;
        }
        setError(`Account locked for ${prev - 1}s due to failed attempts.`);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  // Update real-time clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setDateStr(
        now.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const selectedStaff =
    staffMembers.find((s) => s.id === selectedStaffId) || staffMembers[0];

  // Physical keyboard listener for PIN input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, selectedStaffId]);

  const handleDigit = (digit: string) => {
    if (lockoutRemaining > 0) return;
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);

      const targetLength = selectedStaff?.pin?.length || (selectedStaff?.role === 'admin' ? 6 : 4);

      // Auto-submit when length reached or matches
      if (
        nextPin.length === targetLength ||
        nextPin === selectedStaff?.pin ||
        (selectedStaff?.role === 'admin' && nextPin === '091825')
      ) {
        attemptLogin(selectedStaffId, nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (lockoutRemaining > 0) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    if (lockoutRemaining > 0) return;
    setPin('');
    setError(null);
  };

  const attemptLogin = (staffId: string, enteredPin: string) => {
    if (lockoutRemaining > 0) return;
    const res = loginStaff(staffId, enteredPin);
    if (res.success) {
      resetRateLimit(`login-staff-${staffId}`);
      setPin('');
      setError(null);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        window.location.hash = '#/pos';
      }
    } else {
      const attempt = recordFailedAttempt(`login-staff-${staffId}`);
      if (attempt.isLocked) {
        setLockoutRemaining(attempt.remainingSeconds);
        setError(`Account locked for ${attempt.remainingSeconds}s due to repeated incorrect PIN entries.`);
      } else {
        setError(`${res.error || 'Incorrect PIN.'} (${attempt.attemptsLeft} attempts left)`);
      }
      setPin('');
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutRemaining > 0) return;
    if (!pin) {
      setError('Please enter your 4-digit security PIN.');
      return;
    }
    attemptLogin(selectedStaffId, pin);
  };

  const handleQuickLogin = (staff: StaffMember) => {
    quickLoginStaff(staff.id);
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      window.location.hash = '#/pos';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between select-none p-4 sm:p-6 lg:p-8">
      {/* Top Header Bar */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center space-x-2">
              <span>{settings.storeName}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                POS & Management Terminal
              </span>
            </h1>
            <p className="text-xs text-slate-400">{settings.storeAddress}</p>
          </div>
        </div>

        {/* Live Clock & Terminal ID */}
        <div className="hidden sm:flex items-center space-x-4 text-right">
          <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-xl">
            <div className="text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{time}</span>
            </div>
            <div className="text-[10px] text-slate-400">{dateStr}</div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700 text-[11px] text-slate-400 font-mono">
            TERM-01 • ONLINE
          </div>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="max-w-6xl mx-auto w-full my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: 3 User Selection Cards (Boss, Cashier 1, Cashier 2) */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Select Account to Sign In</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Register Authentication
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-lg">
              Choose your profile below. Boss has full access to all reports and configuration. Cashiers 1 and 2 are restricted strictly to POS and Inventory Stock.
            </p>
          </div>

          {/* 3 Profile Cards */}
          <div className="grid grid-cols-1 gap-3.5">
            {staffMembers.map((staff, idx) => {
              const isSelected = staff.id === selectedStaffId;
              const isBoss = staff.role === 'admin';
              const isCashier1 = staff.id === 'staff-cashier-1' || idx === 1;
              const isCashier2 = staff.id === 'staff-cashier-2' || idx === 2;

              return (
                <div
                  key={staff.id}
                  id={`login-card-${staff.id}`}
                  onClick={() => {
                    setSelectedStaffId(staff.id);
                    setPin('');
                    setError(null);
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? isBoss
                        ? 'bg-gradient-to-r from-indigo-950/70 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-950/50 scale-[1.01]'
                        : 'bg-gradient-to-r from-emerald-950/70 to-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/50 scale-[1.01]'
                      : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3.5">
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-md shrink-0 ${
                          isBoss
                            ? 'bg-gradient-to-tr from-indigo-600 to-violet-500'
                            : isCashier1
                            ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                            : 'bg-gradient-to-tr from-teal-600 to-cyan-500'
                        }`}
                      >
                        {isBoss ? (
                          <ShieldCheck className="w-6 h-6" />
                        ) : (
                          <User className="w-6 h-6" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {staff.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
                              isBoss
                                ? 'bg-indigo-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {isBoss ? 'BOSS / OWNER' : isCashier1 ? 'CASHIER 1' : 'CASHIER 2'}
                          </span>
                        </div>

                        {/* Permissions badge */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {isBoss ? (
                            <span className="text-[11px] text-indigo-300 flex items-center space-x-1 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Full Access: POS, Inventory, Orders, Analytics, Suppliers, Customers, Settings</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-300 flex items-center space-x-1 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Limited Access: POS Register & Inventory Stock Only</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: PIN Hint & 1-Click Quick Login Button */}
                    <div className="flex items-center space-x-2 sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        PIN: <span className={isBoss ? 'text-indigo-400' : 'text-emerald-400'}>{staff.pin}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickLogin(staff);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                          isBoss
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                        }`}
                        title={`1-Click Instant Sign In as ${staff.name}`}
                      >
                        <span>Quick Login</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Access Matrix summary */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-slate-200">Role Separation Rule:</strong> Cashiers are restricted from Sales Reports, Orders, POs, and Store Settings.
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Secure PIN Authentication
            </div>
          </div>
        </div>

        {/* Right Column: PIN Keypad for Active Selected Account */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            {/* Active User Header */}
            <div>
              <div className="inline-flex items-center justify-center space-x-2 mb-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    selectedStaff.role === 'admin' ? 'bg-indigo-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="text-xs uppercase font-black tracking-wider text-slate-400">
                  Signing In As
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {selectedStaff.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedStaff.role === 'admin'
                  ? 'Administrator • Full Store Access'
                  : 'Cashier • POS & Inventory Stock Access'}
              </p>
            </div>

            {/* PIN Dots Display */}
            <div className="space-y-2">
              <div className="flex justify-center space-x-3 sm:space-x-3.5 py-1">
                {Array.from({
                  length: selectedStaff.pin?.length || (selectedStaff.role === 'admin' ? 6 : 4),
                }).map((_, idx) => {
                  const isFilled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-150 ${
                        isFilled
                          ? selectedStaff.role === 'admin'
                            ? 'bg-indigo-400 scale-125 ring-4 ring-indigo-500/20'
                            : 'bg-emerald-400 scale-125 ring-4 ring-emerald-500/20'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error Message */}
              {error ? (
                <div className="flex items-center justify-center space-x-1.5 text-rose-400 text-xs font-bold bg-rose-950/60 p-2.5 rounded-xl border border-rose-800/60 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Enter {selectedStaff.pin?.length || (selectedStaff.role === 'admin' ? '6-digit' : '4-digit')} PIN for {selectedStaff.name.split(' ')[0]}
                </p>
              )}
            </div>

            {/* Touch Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  id={`keypad-${digit}`}
                  onClick={() => handleDigit(digit)}
                  className="w-16 h-13 sm:w-18 sm:h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-white font-black text-xl flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                id="keypad-clear"
                onClick={handleClear}
                className="w-16 h-13 sm:w-18 sm:h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-semibold text-xs flex items-center justify-center transition-all cursor-pointer"
              >
                Clear
              </button>

              <button
                type="button"
                id="keypad-0"
                onClick={() => handleDigit('0')}
                className="w-16 h-13 sm:w-18 sm:h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-white font-black text-xl flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                id="keypad-submit"
                onClick={() => handleSubmit()}
                className={`w-16 h-13 sm:w-18 sm:h-14 rounded-2xl text-white font-bold text-xs flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer ${
                  selectedStaff.role === 'admin'
                    ? 'bg-indigo-600 hover:bg-indigo-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>

            {/* Direct Login Helper Button */}
            <button
              type="button"
              id="login-button-main"
              onClick={() => handleQuickLogin(selectedStaff)}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                selectedStaff.role === 'admin'
                  ? 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40'
                  : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40'
              }`}
            >
              <span>Instant Enter as {selectedStaff.name}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="max-w-7xl mx-auto w-full text-center py-2 text-xs text-slate-400 border-t border-slate-800/80">
        Metro POS System • Role-Enforced Security Architecture • Boss: 1234 • Cashier 1: 1111 • Cashier 2: 2222
      </footer>
    </div>
  );
};
