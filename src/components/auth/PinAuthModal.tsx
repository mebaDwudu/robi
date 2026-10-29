import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Lock, Shield, KeyRound, Check, AlertCircle, User, X, Clock } from 'lucide-react';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../../utils/security';

interface PinAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const PinAuthModal: React.FC<PinAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Admin Authentication Required',
  description = 'Enter your PIN to unlock management views, cost margins, and reports.',
}) => {
  const { verifyAdminPin, staffMembers, settings } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Check rate limit on open and countdown if locked
  useEffect(() => {
    if (!isOpen) return;
    const rate = checkRateLimit('admin-pin-auth');
    if (rate.isLocked) {
      setLockoutRemaining(rate.remainingSeconds);
      setError(`Too many failed attempts. Locked for ${rate.remainingSeconds}s.`);
    }
  }, [isOpen]);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          setError(null);
          return 0;
        }
        setError(`Too many failed attempts. Locked for ${prev - 1}s.`);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (lockoutRemaining > 0) return;
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(null);

      // Check if valid PIN matched
      if (verifyAdminPin(newPin)) {
        resetRateLimit('admin-pin-auth');
        setTimeout(() => {
          onSuccess();
          onClose();
          setPin('');
        }, 150);
      } else if (newPin.length >= 6) {
        const attempt = recordFailedAttempt('admin-pin-auth');
        if (attempt.isLocked) {
          setLockoutRemaining(attempt.remainingSeconds);
          setError(`Account temporarily locked for ${attempt.remainingSeconds}s due to 5 failed attempts.`);
        } else {
          setError(`Invalid PIN. (${attempt.attemptsLeft} attempts remaining)`);
        }
        setPin('');
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
    if (verifyAdminPin(pin)) {
      resetRateLimit('admin-pin-auth');
      onSuccess();
      onClose();
      setPin('');
    } else {
      const attempt = recordFailedAttempt('admin-pin-auth');
      if (attempt.isLocked) {
        setLockoutRemaining(attempt.remainingSeconds);
        setError(`Account temporarily locked for ${attempt.remainingSeconds}s.`);
      } else {
        setError(`Invalid PIN. (${attempt.attemptsLeft} attempts left)`);
      }
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 text-center relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
          <Shield className="w-7 h-7" />
        </div>

        <div>
          <h3 className="font-black text-slate-900 text-lg tracking-tight">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center space-x-2.5 py-2">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                pin.length > idx
                  ? 'bg-indigo-600 scale-110 ring-4 ring-indigo-100'
                  : 'bg-slate-200 border border-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center justify-center space-x-1.5 text-rose-600 text-xs font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="w-16 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-lg flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs flex items-center justify-center transition-all cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="w-16 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-lg flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-16 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
