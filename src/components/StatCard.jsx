export default function StatCard({ label, value, hint, accent = false }) {
  return (
    <div className={`soft-card p-4 md:p-5 ${accent ? 'border-amber-300/35 bg-gradient-to-br from-amber-300/15 to-transparent shadow-[0_8px_24px_rgba(230,179,90,0.12)]' : 'bg-gradient-to-br from-slate-900/80 to-slate-950/65'}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300">{label}</p>
      <p className="mt-2 text-xl font-black text-white md:text-2xl">{value}</p>
      {hint ? <p className="mt-1.5 text-xs leading-5 text-slate-300">{hint}</p> : null}
    </div>
  )
}
