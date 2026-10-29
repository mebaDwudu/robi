import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Lock, ArrowRight, ArrowLeft, AlertCircle, Eye, EyeOff, Delete } from 'lucide-react';

interface AdminPinPageProps {
  onSuccess: () => void;
  onBackToHome: () => void;
}

export const AdminPinPage: React.FC<AdminPinPageProps> = ({
  onSuccess,
  onBackToHome,
}) => {
  const { loginAdminWithPin } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showMaskToggle, setShowMaskToggle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const result = loginAdminWithPin(pin);
    if (result.success) {
      onSuccess();
    } else {
      setError('Incorrect PIN. Access denied.');
      setPin('');
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      if (nextPin === '091825' || nextPin.length === 6) {
        setIsSubmitting(true);
        const result = loginAdminWithPin(nextPin);
        if (result.success) {
          onSuccess();
          return;
        } else {
          if (nextPin.length === 6) {
            setError('Incorrect PIN. Access denied.');
            setPin('');
            setIsSubmitting(false);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <main
      id="admin-pin-page"
      aria-label="Admin Access Verification"
      className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-emerald-500 selection:text-white relative"
    >
      {/* Top Left Navigation Link */}
      <div className="w-full max-w-sm sm:max-w-md mb-3 flex items-center justify-between">
        <button
          type="button"
          id="btn-back-home-top"
          onClick={onBackToHome}
          className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center space-x-1.5 transition-colors cursor-pointer py-1.5 px-2.5 rounded-xl hover:bg-emerald-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Store</span>
        </button>
      </div>

      {/* Centered Admin PIN Card */}
      <div className="w-full max-w-sm sm:max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-md shadow-slate-200/60 space-y-6">
        {/* Header with Lock Icon */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100/90 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto shadow-2xs">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Admin Access
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Enter your PIN to continue
            </p>
          </div>
        </div>

        {/* PIN Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Masked PIN Input and Bullet Display */}
          <div className="space-y-3">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                id="admin-pin-input"
                type={showMaskToggle ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPin(val);
                  setError(null);
                  if (val === '091825' || val.length === 6) {
                    setIsSubmitting(true);
                    const result = loginAdminWithPin(val);
                    if (result.success) {
                      onSuccess();
                    } else {
                      if (val.length === 6) {
                        setError('Incorrect PIN. Access denied.');
                        setPin('');
                        setIsSubmitting(false);
                      } else {
                        setIsSubmitting(false);
                      }
                    }
                  }
                }}
                placeholder="••••••"
                autoComplete="off"
                className="w-full h-14 px-4 text-center text-2xl font-mono tracking-widest bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 rounded-2xl outline-none transition-all placeholder:text-slate-400 font-bold"
                aria-label="Admin PIN"
              />

              {pin.length > 0 && (
                <button
                  type="button"
                  id="btn-toggle-mask"
                  onClick={() => setShowMaskToggle(!showMaskToggle)}
                  className="absolute right-3.5 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                  title={showMaskToggle ? 'Hide PIN characters' : 'Show PIN characters'}
                >
                  {showMaskToggle ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            {/* Error Message Alert */}
            {error && (
              <div
                id="admin-pin-error"
                className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 animate-in fade-in slide-in-from-top-1"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Tactile Numeric Keypad for Mobile & Touch Screens */}
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                id={`btn-pin-${digit}`}
                onClick={() => handleKeypadPress(digit)}
                className="h-12 sm:h-13 bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-slate-800 font-extrabold text-lg sm:text-xl rounded-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              id="btn-pin-clear"
              onClick={handleClear}
              className="h-12 sm:h-13 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-700 font-bold text-xs rounded-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
            >
              Clear
            </button>

            <button
              type="button"
              id="btn-pin-0"
              onClick={() => handleKeypadPress('0')}
              className="h-12 sm:h-13 bg-slate-50 hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-slate-800 font-extrabold text-lg sm:text-xl rounded-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
            >
              0
            </button>

            <button
              type="button"
              id="btn-pin-backspace"
              onClick={handleBackspace}
              className="h-12 sm:h-13 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-sm rounded-2xl transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              title="Delete"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="submit"
              id="btn-pin-continue"
              disabled={isSubmitting || pin.length === 0}
              className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer ${
                pin.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-600/20 active:scale-[0.99]'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              id="btn-pin-back-home"
              onClick={onBackToHome}
              className="w-full py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-center"
            >
              Back to Home
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};
