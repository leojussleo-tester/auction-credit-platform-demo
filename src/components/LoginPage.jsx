export default function LoginPage({ users, onLogin }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
        <div className="grid w-full gap-6 rounded-3xl border border-amber-300/20 bg-white/5 p-6 backdrop-blur-xl md:grid-cols-2 md:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Auction Platform V2</p>
            <h1 className="mt-3 text-4xl font-black">Luxury Collector Marketplace</h1>
            <p className="mt-4 text-slate-300">Chọn tài khoản demo để vào đúng dashboard MEMBER / SELLER / ADMIN.</p>
          </div>
          <div className="space-y-3">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => onLogin(u.id)}
                className="w-full rounded-2xl border border-white/15 bg-black/30 p-4 text-left transition hover:border-amber-300/60 hover:bg-white/10"
              >
                <p className="font-bold">{u.name}</p>
                <p className="text-xs text-slate-400">{u.role.toUpperCase()} • {u.memberLevelOverride || u.sellerTier || 'STAFF'}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
