import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { sanitizeText, sanitizeEmail } from '../../utils/sanitize';
import { X, Star, CheckCircle2, Send } from 'lucide-react';

interface CustomerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProductId?: string;
}

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  isOpen,
  onClose,
  preselectedProductId,
}) => {
  const { addFeedback, products } = useStore();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lock mobile viewport scrolling completely when open so background never moves
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      const prevPosition = document.body.style.position;
      const prevTop = document.body.style.top;
      const prevWidth = document.body.style.width;
      const prevOverflow = document.body.style.overflow;

      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = prevPosition;
        document.body.style.top = prevTop;
        document.body.style.width = prevWidth;
        document.body.style.overflow = prevOverflow;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg('Please enter your feedback.');
      return;
    }

    const cleanName = sanitizeText(customerName, 80) || 'Customer';
    const cleanEmail = email.trim() ? sanitizeEmail(email) : undefined;
    const cleanComment = sanitizeText(comment, 600);
    const selectedProduct = preselectedProductId ? products.find((p) => p.id === preselectedProductId) : undefined;

    addFeedback({
      customerName: cleanName,
      customerContact: cleanEmail,
      rating,
      category: 'General',
      productId: selectedProduct?.id,
      productName: selectedProduct?.name,
      comment: cleanComment,
    });

    setIsSubmitted(true);
    setErrorMsg(null);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setRating(5);
    setCustomerName('');
    setEmail('');
    setComment('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/35 backdrop-blur-xs overscroll-none touch-none"
      onClick={handleResetAndClose}
    >
      <div
        className="w-full max-w-md bg-[#FAF7F2] border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-900 flex flex-col touch-pan-y overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Clean Header matching page aesthetic */}
        <div className="px-5 py-4 border-b border-slate-200/80 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
              ★
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                Customer Feedback
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Top Fruit & Veg • Pitch 18 Brixton
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isSubmitted ? (
          <div className="p-6 text-center space-y-3 bg-white">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">Thank You!</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Your feedback has been received. We appreciate your support for Pitch 18 Brixton Market.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 bg-[#FAF7F2]">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Clean 5-Star Rating */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Rating
              </span>
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const activeVal = hoverRating || rating;
                  const isFilled = starVal <= activeVal;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(starVal)}
                      className="p-1 rounded-lg transition-transform hover:scale-115 focus:outline-hidden cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name and Email in simple clean rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Feedback Message */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Feedback *
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about our fruits, vegetables, or service..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 resize-none"
              />
            </div>

            {/* Submit buttons */}
            <div className="pt-1 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>Submit</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
