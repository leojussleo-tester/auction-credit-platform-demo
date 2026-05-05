import { useMemo, useState } from 'react'

const groups = [
  { key: 'member', title: 'Member Demo', subtitle: 'Bidding + Wallet', description: 'Use member demo accounts for normal bidding and withdrawal flows.' },
  { key: 'seller', title: 'Seller Demo', subtitle: 'Seller Mode + Wallet', description: 'Seller can access member pages plus seller tools.' },
  { key: 'admin', title: 'Admin Demo', subtitle: 'Admin System', description: 'Admin can control users, rooms, and withdrawal approvals.' },
]

function DemoAccountCard({ user, onFill }) {
  return (
    <button
      type="button"
      onClick={() => onFill(user)}
      className="flex min-h-[168px] w-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-left transition hover:-translate-y-0.5 hover:border-auction-gold/60 hover:bg-auction-gold/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-white">{user.name}</p>
          <p className="mt-1 text-sm text-slate-300">{user.email}</p>
        </div>
        <span className="rounded-full border border-auction-gold/40 bg-auction-gold/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-auction-gold">{user.role.toUpperCase()}</span>
      </div>
      <span className="mt-4 inline-flex self-start rounded-xl bg-auction-gold px-4 py-2 text-sm font-black text-black">Fill demo account</span>
    </button>
  )
}

export default function LoginPage({ users, onLogin, onRegister }) {
  const [tab, setTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ account: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', accountType: 'member', shopName: '', phone: '', bankInfo: '' })

  const groupedUsers = useMemo(() => groups.map((group) => ({ ...group, users: users.filter((user) => user.role === group.key) })), [users])

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(226,184,90,.24),transparent_32%),radial-gradient(circle_at_85%_5%,rgba(52,211,153,.13),transparent_28%),linear-gradient(135deg,#040507,#0b1020_55%,#06070b)]" />
      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 md:px-5 md:py-10">
        <div className="w-full rounded-[2rem] border border-auction-gold/25 bg-black/55 p-5 shadow-luxury backdrop-blur-2xl md:p-8">
          <h1 className="text-3xl font-black md:text-5xl">Auction Platform Authentication</h1>
          <div className="mt-6 inline-flex rounded-2xl border border-white/10 bg-black/40 p-1">
            <button className={`rounded-xl px-4 py-2 font-bold ${tab === 'login' ? 'bg-auction-gold text-black' : 'text-white'}`} onClick={() => setTab('login')}>Login</button>
            <button className={`rounded-xl px-4 py-2 font-bold ${tab === 'register' ? 'bg-auction-gold text-black' : 'text-white'}`} onClick={() => setTab('register')}>Register</button>
          </div>

          {tab === 'login' ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_1fr]">
              <form className="glass-card p-5" onSubmit={(e) => { e.preventDefault(); onLogin(loginForm) }}>
                <label><span className="label">Account / Email</span><input className="field" value={loginForm.account} onChange={(e) => setLoginForm((p) => ({ ...p, account: e.target.value }))} /></label>
                <label className="mt-4"><span className="label">Password</span><input type="password" className="field" value={loginForm.password} onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))} /></label>
                <button className="btn-primary mt-5 w-full" type="submit">Login</button>
              </form>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                {groupedUsers.map((group) => (
                  <section key={group.key} className="rounded-2xl border border-white/10 bg-slate-950/75 p-4">
                    <h3 className="text-lg font-black">{group.title}</h3>
                    <p className="min-h-[42px] text-sm text-slate-400">{group.description}</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-1">{group.users.map((user) => <DemoAccountCard key={user.id} user={user} onFill={(u) => setLoginForm({ account: u.email, password: u.password || 'demo123' })} />)}</div>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <form className="mt-6 glass-card p-5" onSubmit={(e) => { e.preventDefault(); onRegister(registerForm) }}>
              <div className="grid gap-4 md:grid-cols-2">
                <label><span className="label">Full name</span><input className="field" value={registerForm.fullName} onChange={(e) => setRegisterForm((p) => ({ ...p, fullName: e.target.value }))} /></label>
                <label><span className="label">Email / username</span><input className="field" value={registerForm.email} onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))} /></label>
                <label><span className="label">Password</span><input type="password" className="field" value={registerForm.password} onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))} /></label>
                <label><span className="label">Confirm password</span><input type="password" className="field" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm((p) => ({ ...p, confirmPassword: e.target.value }))} /></label>
                <label><span className="label">Account type</span><select className="field" value={registerForm.accountType} onChange={(e) => setRegisterForm((p) => ({ ...p, accountType: e.target.value }))}><option value="member">Member</option><option value="seller">Seller</option></select></label>
              </div>
              {registerForm.accountType === 'seller' ? <div className="mt-4 grid gap-4 md:grid-cols-3"><label><span className="label">Shop name</span><input className="field" value={registerForm.shopName} onChange={(e) => setRegisterForm((p) => ({ ...p, shopName: e.target.value }))} /></label><label><span className="label">Phone number</span><input className="field" value={registerForm.phone} onChange={(e) => setRegisterForm((p) => ({ ...p, phone: e.target.value }))} /></label><label><span className="label">Bank account info</span><input className="field" value={registerForm.bankInfo} onChange={(e) => setRegisterForm((p) => ({ ...p, bankInfo: e.target.value }))} /></label></div> : null}
              <button className="btn-primary mt-5" type="submit">Register</button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
