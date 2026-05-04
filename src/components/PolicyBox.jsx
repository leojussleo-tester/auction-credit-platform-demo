export default function PolicyBox({ title = 'Policy Warning', children, type = 'gold' }) {
  const style = type === 'danger'
    ? 'border-rose-400/30 bg-rose-500/10 text-rose-100'
    : 'border-auction-gold/30 bg-auction-gold/10 text-yellow-50'

  return (
    <div className={`rounded-3xl border p-5 ${style}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1 rounded-full bg-white/10 px-2 py-1 text-xs">!</div>
        <div>
          <p className="font-black uppercase tracking-[0.2em] text-xs">{title}</p>
          <div className="mt-2 text-sm leading-6 text-slate-200">{children}</div>
        </div>
      </div>
    </div>
  )
}
