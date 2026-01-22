import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, titleNp, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="modal-overlay"
    >
      <div className="modal-content" data-testid="modal-content">
        {/* Header */}
        <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-[#2D2D2D]">{title}</h2>
            {titleNp && <p className="text-sm text-gray-500 font-nepali">{titleNp}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            data-testid="modal-close-btn"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
