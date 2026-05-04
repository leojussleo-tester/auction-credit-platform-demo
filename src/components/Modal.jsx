export default function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-md">
      <div className="glass-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Confirm Action</p>
            <h3 className="mt-2 text-2xl font-black text-white">{title}</h3>
          </div>
          <button className="btn-secondary !px-3 !py-2" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">{footer}</div> : null}
      </div>
    </div>
  )
}
