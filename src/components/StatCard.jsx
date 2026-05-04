export default function StatCard({ label, value, hint, accent = false }) {
  return (
    <div className={`soft-card p-5 ${accent ? 'border-auction-gold/30 bg-auction-gold/10' : ''}`}>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-slate-400">{hint}</p> : null}
    </div>
  )
}
