import React, { useEffect } from 'react';
interface SlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
const SlideDrawer: React.FC<SlideDrawerProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
}) => {
  // ESC key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  return (
    <>
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Glassmorphism Right Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] md:w-[420px] z-50 bg-[#0b1329]/85 backdrop-blur-2xl border-l border-white/10 shadow-2xl shadow-black/80 flex flex-col transition-transform duration-300 ease-in-out pointer-events-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="bg-primary/10 px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="material-symbols-outlined text-primary text-xl">
                {icon}
              </span>
            )}
            <h3 className="text-content font-bold text-base tracking-wide">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar panel"
            className="p-1.5 rounded-lg text-[#92adc9] hover:text-content hover:bg-white/5 transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {children}
        </div>
        {/* Drawer Footer (Optional) */}
        {footer && (
          <div className="p-4 bg-[#0b1329]/90 border-t border-white/10 shrink-0">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
};
export default SlideDrawer;
