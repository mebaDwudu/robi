import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Star,
  MessageSquare,
  Trash2,
  Clock,
  Phone,
  Mail,
  Edit3,
  CheckCircle2,
} from 'lucide-react';

export const CustomerFeedbackView: React.FC = () => {
  const { feedbacks, updateFeedbackStatus, deleteFeedback } = useStore();
  const [adminNoteInput, setAdminNoteInput] = useState<{ [id: string]: string }>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const handleSaveNote = (feedbackId: string) => {
    const note = adminNoteInput[feedbackId] ?? '';
    updateFeedbackStatus(feedbackId, 'reviewed', note);
    setEditingNoteId(null);
  };

  return (
    <div className="space-y-4">
      {/* Minimal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Feedback</h2>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            {feedbacks.length}
          </span>
        </div>
      </div>

      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-700">No feedback yet</h3>
          <p className="text-xs text-slate-400">Customer feedback will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                fb.status === 'new'
                  ? 'bg-emerald-50/30 border-emerald-200 shadow-2xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Card Header: Customer + Rating */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {fb.customerName || 'Anonymous Customer'}
                    </span>
                    {fb.status === 'new' && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] uppercase">
                        New
                      </span>
                    )}
                  </div>

                  {fb.customerContact && (
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      {fb.customerContact.includes('@') ? (
                        <Mail className="w-3 h-3 text-slate-400" />
                      ) : (
                        <Phone className="w-3 h-3 text-slate-400" />
                      )}
                      <span className="truncate">{fb.customerContact}</span>
                    </div>
                  )}
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s <= fb.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs font-bold text-slate-700">
                    {fb.rating}.0
                  </span>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(fb.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {fb.productName && (
                  <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {fb.productName}
                  </span>
                )}
              </div>

              {/* Customer Comment */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-800 leading-relaxed font-medium border border-slate-100">
                "{fb.comment}"
              </div>

              {/* Admin Note Section */}
              {fb.adminNote && editingNoteId !== fb.id && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <span className="font-bold text-[10px] uppercase block text-emerald-700">
                    Note:
                  </span>
                  <p className="mt-0.5">{fb.adminNote}</p>
                </div>
              )}

              {editingNoteId === fb.id ? (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    value={adminNoteInput[fb.id] ?? (fb.adminNote || '')}
                    onChange={(e) =>
                      setAdminNoteInput({ ...adminNoteInput, [fb.id]: e.target.value })
                    }
                    placeholder="Internal note..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveNote(fb.id)}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingNoteId(fb.id);
                      setAdminNoteInput({
                        ...adminNoteInput,
                        [fb.id]: fb.adminNote || '',
                      });
                    }}
                    className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-bold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Note</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('Delete this feedback?')) {
                        deleteFeedback(fb.id);
                      }
                    }}
                    className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
