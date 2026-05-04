const palette = {
  Classic: 'border-slate-400/30 bg-slate-400/10 text-slate-100',
  Pro: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  VIP: 'border-yellow-300/40 bg-yellow-300/15 text-yellow-100',
  Basic: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
  Live: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
  Upcoming: 'border-blue-300/30 bg-blue-300/10 text-blue-100',
  Ended: 'border-slate-300/30 bg-slate-300/10 text-slate-200',
  Approved: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
  Pending: 'border-yellow-300/30 bg-yellow-300/10 text-yellow-100',
  Rejected: 'border-rose-300/30 bg-rose-300/10 text-rose-100',
  Verified: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
  Paid: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
  Open: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
  default: 'border-white/10 bg-white/10 text-slate-100',
}

export default function Badge({ children, tone, className = '' }) {
  const key = tone || children
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${palette[key] || palette.default} ${className}`}>
      {children}
    </span>
  )
}
