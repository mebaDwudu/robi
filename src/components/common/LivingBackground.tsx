import React from 'react';

/**
 * LivingBackground
 * Light yellow & pink mix background gradient with warm tropical fruit market ambiance:
 * - Soft sunny lemon/cream yellow (#fffbeb, #fef3c7) blending into pastel blossom pink (#fdf2f8, #fff1f2)
 * - Subtle ambient fruit glow orbs for depth and warmth
 */
export const LivingBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none -z-10 ${className}`}
      style={{ zIndex: -10 }}
      aria-hidden="true"
    >
      {/* Light yellow and pink mix background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 30%, #fdf2f8 70%, #fff1f2 100%)',
        }}
      />
      {/* Soft ambient glow orbs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-60 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #fde68a 0%, rgba(253, 230, 138, 0) 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full opacity-50 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #fbcfe8 0%, rgba(251, 207, 232, 0) 70%)' }}
      />
      <div
        className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #fed7aa 0%, rgba(254, 215, 170, 0) 70%)' }}
      />
    </div>
  );
};
