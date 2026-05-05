const groups = [
  { key: 'buyer', title: 'Member Account', desc: 'Sign up + KYC mock' },
  { key: 'seller', title: 'Seller Account', desc: 'KYC + Accept mock' },
  { key: 'admin', title: 'Admin Account', desc: 'Platform staff' },
]

export default function LoginPage({ users, onLogin }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
        <div className="w-full rounded-3xl border border-amber-300/25 bg-slate-950/80 p-6 backdrop-blur-xl md:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300">Auction Platform V2</p>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">Demo Login Portal</h1>
          <p className="mt-3 text-slate-300">Chọn tài khoản demo để truy cập đúng hệ thống theo role.</p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {groups.map((group) => (
              <section key={group.key} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">{group.title}</p>
                <p className="mt-1 text-sm text-slate-300">{group.desc}</p>
                <div className="mt-4 space-y-2">
                  {users.filter((u) => u.role === group.key).map((u) => (
                    <button key={u.id} onClick={() => onLogin(u.id)} className="w-full rounded-xl border border-white/15 bg-slate-950/80 px-3 py-3 text-left hover:border-amber-300/55">
                      <p className="font-semibold text-white">{u.name}</p>
                      <p className="text-xs text-slate-300">{u.role.toUpperCase()} • {u.memberLevelOverride || u.sellerTier || 'STAFF'}</p>
                      <span className="mt-2 inline-flex rounded-lg bg-amber-300/20 px-2 py-1 text-[11px] font-bold text-amber-100">Login</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
