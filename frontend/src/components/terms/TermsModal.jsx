import { X } from 'lucide-react';

function TermsModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-canvas shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-indigo/10 px-6 py-4">
          <h2 className="font-display text-xl text-indigo">{title}</h2>
          <button className="text-muted transition hover:text-clay" onClick={onClose} aria-label="Close terms">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export default TermsModal;