import Badge from './Badge'
import { useAuction } from '../context/AuctionContext'
import { money } from '../utils/policies'

function roleLabel(role) {
  if (role === 'admin') return 'ADMIN'
  if (role === 'seller') return 'SELLER'
  return 'MEMBER'
}

function tierLabel(user, currentMemberLevel) {
  if (user?.role === 'admin') return 'STAFF'
  if (user?.role === 'seller') return user.sellerTier || currentMemberLevel
  return currentMemberLevel
}

export default function Layout({ children, route, onLogout }) {
  const { currentUser, currentMemberLevel, resetDemo } = useAuction()
  const role = currentUser?.role || 'buyer'
  const navItems = [
    { label: 'Home', href: '#/' },
    { label: 'Bid Lobby', href: '#/bid' },
    { label: 'My Wallet', href: '#/wallet' },
    { label: 'My Info', href: '#/account' },
    ...(role === 'seller' ? [{ label: 'Seller Mode', href: '#/seller' }] : []),
    ...(role === 'admin' ? [{ label: 'Admin System', href: '#/admin' }] : []),
  ]

  return (
    <div className="lux-shell">
      <div className="lux-glow -left-24 top-16 h-64 w-64 rounded-full bg-auction-gold/20" />
      <div className="lux-glow -right-12 top-40 h-56 w-56 rounded-full bg-auction-neon/10" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <a href="#/" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-auction-gold/40 bg-auction-gold/20 text-xl shadow-neon">✦</div>
              <div>
                <p className="text-lg font-black tracking-tight text-white">Auction Credit Maison</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-auction-gold">Luxury Fintech Marketplace</p>
              </div>
            </a>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{roleLabel(role)}</Badge>
              <Badge>{tierLabel(currentUser, currentMemberLevel)}</Badge>
              <button onClick={onLogout} className="rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-black text-white hover:border-auction-gold/50">Logout</button>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => {
              const active = item.href === `#${route}` || (route === '/' && item.href === '#/')
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-bold transition duration-300 ${
                    active ? 'bg-auction-gold text-black shadow-neon' : 'text-slate-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </a>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[300px_1fr] lg:px-6">
        <aside className="space-y-4 lg:sticky lg:top-28 lg:h-fit">
          <div className="section-card">
            <p className="label">{roleLabel(role)} Profile</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-auction-gold to-auction-neon text-lg font-black text-black">{currentUser?.name?.slice(0, 1) || 'U'}</div>
              <div><p className="font-black text-white">{currentUser?.name}</p><p className="text-xs text-slate-400">{currentUser?.email}</p></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2"><Badge>{roleLabel(role)}</Badge><Badge>{tierLabel(currentUser, currentMemberLevel)}</Badge><Badge>{currentUser?.kycStatus}</Badge></div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="soft-card p-3"><p className="text-slate-300">Available</p><p className="font-black text-white">{money(currentUser?.wallet?.available)}</p></div>
              <div className="soft-card p-3"><p className="text-slate-300">Pending</p><p className="font-black text-auction-gold">{money(currentUser?.wallet?.pending)}</p></div>
            </div>
            {role === 'admin' ? (
              <div className="mt-4 rounded-2xl border border-auction-gold/25 bg-auction-gold/10 p-4 text-sm leading-6 text-slate-200">
                Staff access: có đủ Bid Lobby, My Wallet, My Info và Admin System để kiểm tra flow như member/seller.
              </div>
            ) : null}
            <button onClick={resetDemo} className="btn-secondary mt-4 w-full">Reset Demo Data</button>
          </div>

          <div className="soft-card p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Core Rule</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Auction Credit là credit nội bộ prototype: dùng để pending khi bid, refund khi outbid, giữ khi thắng và xử lý paid/failed qua Admin.
            </p>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">{children}</section>
      </main>
    </div>
  )
}
