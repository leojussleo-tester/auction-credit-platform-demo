import Badge from './Badge'
import { useAuction } from '../context/AuctionContext'
import { money } from '../utils/policies'

export default function Layout({ children, route }) {
  const { currentUser, currentMemberLevel, resetDemo } = useAuction()
  const role = currentUser?.role
  const navItems = [
    { label: 'Home', href: '#/' },
    { label: 'Bid Lobby', href: '#/bid' },
    ...(role !== 'admin' ? [{ label: 'My Wallet', href: '#/wallet' }, { label: 'My Info', href: '#/account' }] : []),
    ...(role === 'seller' ? [{ label: 'Seller Mode', href: '#/seller' }] : []),
    ...(role === 'admin' ? [{ label: 'Admin System', href: '#/admin' }] : []),
  ]

  const logout = () => {
    localStorage.removeItem('auction_login_user_id')
    window.location.reload()
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
          <a href="#/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-auction-gold/40 bg-auction-gold/15 text-xl shadow-neon">⚡</div>
            <div>
              <p className="text-lg font-black tracking-tight text-white">Auction Credit</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-auction-gold">MVP Demo Platform</p>
            </div>
          </a>

          <nav className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {navItems.map((item) => {
              const active = item.href === `#${route}` || (route === '/' && item.href === '#/')
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-bold transition ${
                    active ? 'bg-white text-black' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {item.label}
                </a>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-6">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="glass-card p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Current User</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-auction-gold to-auction-neon text-lg font-black text-black">
                {currentUser?.name?.slice(0, 1) || 'U'}
              </div>
              <div>
                <p className="font-black text-white">{currentUser?.name}</p>
                <p className="text-xs text-slate-400">{currentUser?.email}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{(currentUser?.role || 'member').toUpperCase()}</Badge>
              <Badge>{currentMemberLevel}</Badge>
              <Badge>{currentUser?.kycStatus}</Badge>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-black/25 p-3">
                <p className="text-slate-500">Available</p>
                <p className="font-black text-white">{money(currentUser?.wallet?.available)}</p>
              </div>
              <div className="rounded-2xl bg-black/25 p-3">
                <p className="text-slate-500">Pending</p>
                <p className="font-black text-auction-gold">{money(currentUser?.wallet?.pending)}</p>
              </div>
            </div>
            <button onClick={resetDemo} className="btn-secondary mt-4 w-full">Reset Demo Data</button>
            <button onClick={logout} className="btn-danger mt-3 w-full">Logout</button>
          </div>

          <div className="soft-card p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">Core Rule</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Auction Credit là credit nội bộ prototype: dùng để pending khi bid, refund khi outbid, giữ khi thắng và xử lý paid/failed qua Admin.
            </p>
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </main>
    </div>
  )
}
