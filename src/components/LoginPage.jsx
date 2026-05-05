const groups = [
  {
    key: 'buyer',
    title: 'Member Account',
    subtitle: 'Sign up + KYC mock',
    description: 'Classic / Pro / VIP member demo accounts for bidding and wallet flow.',
  },
  {
    key: 'seller',
    title: 'Seller Account',
    subtitle: 'KYC + Accept mock',
    description: 'Seller dashboard, product registration, settlement and seller rule flow.',
  },
  {
    key: 'admin',
    title: 'Admin Account',
    subtitle: 'Platform staff',
    description: 'Platform controls for rooms, reports, product approvals and wallet requests.',
  },
]

function tierOf(user) {
  return user.memberLevelOverride || user.sellerTier || (user.role === 'admin' ? 'STAFF' : 'CLASSIC')
}

export default function LoginPage({ users, onLogin }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#05070b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(226,184,90,.24),transparent_32%),radial-gradient(circle_at_85%_5%,rgba(52,211,153,.13),transparent_28%),linear-gradient(135deg,#040507,#0b1020_55%,#06070b)]" />
      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-5 py-10">
        <div className="w-full rounded-[2rem] border border-auction-gold/25 bg-black/55 p-5 shadow-luxury backdrop-blur-2xl md:p-9">
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-auction-gold">Auction Platform Login</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-6xl">Choose a demo account</h1>
            <p className="mt-4 text-base leading-7 text-slate-300 md:text-lg">
              Bắt buộc đăng nhập trước khi vào web demo. Mỗi account mở đúng giao diện theo role: Member, Seller hoặc Admin.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {groups.map((group) => {
              const groupUsers = users.filter((user) => user.role === group.key)
              return (
                <section key={group.key} className="rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-5 shadow-[0_24px_90px_rgba(0,0,0,.32)]">
                  <p className="text-xs font-black uppercase tracking-[0.26em] text-auction-gold">{group.title}</p>
                  <h2 className="mt-3 text-2xl font-black text-white">{group.subtitle}</h2>
                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-300">{group.description}</p>

                  <div className="mt-5 space-y-3">
                    {groupUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => onLogin(user.id)}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-left transition hover:-translate-y-0.5 hover:border-auction-gold/60 hover:bg-auction-gold/10"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-white">{user.name}</p>
                            <p className="mt-1 text-sm text-slate-300">{user.email}</p>
                          </div>
                          <span className="rounded-full border border-auction-gold/40 bg-auction-gold/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-auction-gold">
                            {tierOf(user)}
                          </span>
                        </div>
                        <span className="mt-4 inline-flex rounded-xl bg-auction-gold px-4 py-2 text-sm font-black text-black">Login demo</span>
                      </button>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
