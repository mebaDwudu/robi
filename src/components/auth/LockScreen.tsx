import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Lock, Store, KeyRound, Check, AlertCircle, ShieldCheck, ShoppingCart, User, Clock } from 'lucide-react';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../utils/security';

export const LockScreen: React.FC = () => {
  const { isLocked, setIsLocked, loginWithPin, staffMembers, settings, formatCurrency, currentShift } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  useEffect(() => {
    if (!isLocked) return;
    const rate = checkRateLimit('lockscreen-auth');
    if (rate.isLocked) {
      setLockoutRemaining(rate.remainingSeconds);
      setError(`Terminal locked for ${rate.remainingSeconds}s due to failed attempts.`);
    }
  }, [isLocked]);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          setError(null);
          return 0;
        }
        setError(`Terminal locked for ${prev - 1}s.`);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (lockoutRemaining > 0) return;
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(null);

      if (newPin.length >= 4) {
        const res = loginWithPin(newPin);
        if (res.success) {
          resetRateLimit('lockscreen-auth');
          setPin('');
        } else {
          const attempt = recordFailedAttempt('lockscreen-auth');
          if (attempt.isLocked) {
            setLockoutRemaining(attempt.remainingSeconds);
            setError(`Account temporarily locked for ${attempt.remainingSeconds}s.`);
          } else {
            setError(`${res.error || 'Incorrect PIN.'} (${attempt.attemptsLeft} tries remaining)`);
          }
          setPin('');
        }
      }
    }
  };

  const handleBackspace = () => {
    if (lockoutRemaining > 0) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutRemaining > 0) return;
    const res = loginWithPin(pin);
    if (res.success) {
      resetRateLimit('lockscreen-auth');
      setPin('');
    } else {
      const attempt = recordFailedAttempt('lockscreen-auth');
      if (attempt.isLocked) {
        setLockoutRemaining(attempt.remainingSeconds);
        setError(`Account temporarily locked for ${attempt.remainingSeconds}s.`);
      } else {
        setError(`${res.error || 'Incorrect PIN.'} (${attempt.attemptsLeft} tries remaining)`);
      }
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 select-none">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-md w-full shadow-2xl p-8 space-y-6 text-center">
        {/* Store Title */}
        <div className="flex items-center justify-center space-x-2 text-emerald-400">
          <Store className="w-6 h-6" />
          <h2 className="text-lg font-black text-white tracking-tight">{settings.storeName}</h2>
        </div>

        {/* Lock Icon */}
        <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Register Terminal Locked</h3>
          <p className="text-xs text-slate-400 mt-1">Enter your Cashier or Boss PIN to resume POS session</p>
        </div>

        {/* Available Staff Profiles quick reference */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
          {staffMembers.map((staff) => (
            <div
              key={staff.id}
              onClick={() => {
                // Quick login helper
                loginWithPin(staff.pin);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-[11px] text-slate-300 flex items-center space-x-1.5 cursor-pointer transition-all hover:scale-105"
              title={`Click to quick unlock as ${staff.name} (PIN: ${staff.pin})`}
            >
              <div className={`w-2 h-2 rounded-full ${staff.role === 'admin' ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
              <span className="font-medium">{staff.name.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-500">({staff.role === 'admin' ? 'Boss' : 'Cashier'})</span>
            </div>
          ))}
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center space-x-3 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                pin.length > idx
                  ? 'bg-emerald-400 scale-125 ring-4 ring-emerald-500/20'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center justify-center space-x-1.5 text-rose-400 text-xs font-bold bg-rose-950/50 p-2.5 rounded-xl border border-rose-800/50">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="w-16 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-white font-black text-xl flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 h-14 rounded-2xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 font-semibold text-xs flex items-center justify-center transition-all cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="w-16 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-white font-black text-xl flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-16 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-6 h-6" />
          </button>
        </div>

        {/* Hint & Switch to Main Login */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="text-[11px] text-slate-400">
            Boss PIN: <span className="font-mono text-indigo-400 font-bold">1234</span> • Cashier 1:{' '}
            <span className="font-mono text-emerald-400 font-bold">1111</span> • Cashier 2:{' '}
            <span className="font-mono text-teal-400 font-bold">2222</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsLocked(false);
              window.location.hash = '#/login';
            }}
            className="text-xs text-slate-400 hover:text-emerald-400 font-medium underline transition-colors cursor-pointer"
          >
            Switch Account / Full Login Screen
          </button>
        </div>
      </div>
    </div>
  );
};
