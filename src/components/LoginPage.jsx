import { useMemo, useState } from 'react'

const groups = [
  { key: 'buyer', title: 'MEMBER', subtitle: 'Classic / Pro / VIP member accounts' },
  { key: 'seller', title: 'SELLER', subtitle: 'Classic / Pro / VIP seller accounts' },
  { key: 'admin', title: 'ADMIN', subtitle: 'Platform admin account' },
]

function tierOf(user) {
  return (user.memberLevelOverride || user.sellerTier || (user.role === 'admin' ? 'STAFF' : 'CLASSIC')).toUpperCase()
}

export default function LoginPage({ users, onLogin, onRegister }) {
  const [tab, setTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ login: '', password: '' })
  const [regForm, setRegForm] = useState({ name: '', login: '', password: '', confirmPassword: '', role: 'buyer', shopName: '', phone: '', bankAccount: '' })
  const [error, setError] = useState('')

  const demoGroups = useMemo(() => groups.map((g) => ({ ...g, users: users.filter((u) => u.role === g.key) })), [users])

  function submitLogin(e) {
    e.preventDefault(); setError('')
    const result = onLogin(loginForm)
    if (!result.ok) setError(result.message)
  }

  function submitRegister(e) {
    e.preventDefault(); setError('')
    const result = onRegister(regForm)
    if (!result.ok) setError(result.message)
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-white px-4 py-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-auction-gold/25 bg-black/55 p-5 shadow-luxury backdrop-blur-2xl md:p-8">
        <h1 className="text-3xl md:text-5xl font-black">Auction Platform Access</h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex gap-2">
              <button onClick={() => setTab('login')} className={`rounded-xl px-4 py-2 font-bold ${tab === 'login' ? 'bg-auction-gold text-black' : 'bg-white/10'}`}>Đăng nhập</button>
              <button onClick={() => setTab('register')} className={`rounded-xl px-4 py-2 font-bold ${tab === 'register' ? 'bg-auction-gold text-black' : 'bg-white/10'}`}>Đăng ký</button>
            </div>
            {tab === 'login' ? (
              <form onSubmit={submitLogin} className="space-y-3">
                <input className="w-full rounded-xl bg-white/10 p-3" placeholder="Tài khoản / email" value={loginForm.login} onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })} />
                <input type="password" className="w-full rounded-xl bg-white/10 p-3" placeholder="Mật khẩu" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                <button className="w-full rounded-xl bg-auction-gold px-4 py-3 font-black text-black">Đăng nhập</button>
              </form>
            ) : (
              <form onSubmit={submitRegister} className="space-y-3">
                <input className="w-full rounded-xl bg-white/10 p-3" placeholder="Họ tên" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
                <input className="w-full rounded-xl bg-white/10 p-3" placeholder="Username hoặc email" value={regForm.login} onChange={(e) => setRegForm({ ...regForm, login: e.target.value })} />
                <input type="password" className="w-full rounded-xl bg-white/10 p-3" placeholder="Mật khẩu" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
                <input type="password" className="w-full rounded-xl bg-white/10 p-3" placeholder="Xác nhận mật khẩu" value={regForm.confirmPassword} onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })} />
                <select className="w-full rounded-xl bg-white/10 p-3" value={regForm.role} onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}>
                  <option value="buyer">Member</option><option value="seller">Seller</option>
                </select>
                {regForm.role === 'seller' && <>
                  <input className="w-full rounded-xl bg-white/10 p-3" placeholder="Shop name" value={regForm.shopName} onChange={(e) => setRegForm({ ...regForm, shopName: e.target.value })} />
                  <input className="w-full rounded-xl bg-white/10 p-3" placeholder="Số điện thoại" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} />
                  <input className="w-full rounded-xl bg-white/10 p-3" placeholder="Bank account" value={regForm.bankAccount} onChange={(e) => setRegForm({ ...regForm, bankAccount: e.target.value })} />
                </>}
                <button className="w-full rounded-xl bg-auction-gold px-4 py-3 font-black text-black">Đăng ký</button>
              </form>
            )}
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          </div>

          <div className="space-y-4">
            {demoGroups.map((group) => (
              <section key={group.key} className="rounded-3xl border border-white/10 bg-slate-950/75 p-4">
                <p className="text-xs font-black tracking-[0.22em] text-auction-gold">{group.title}</p>
                <p className="mb-3 text-sm text-slate-300">{group.subtitle}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.users.map((user) => (
                    <div key={user.id} className="flex min-h-[180px] flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-3">
                      <div>
                        <p className="font-black">{user.name}</p>
                        <p className="text-xs text-slate-300">{user.username} / {user.email}</p>
                        <p className="text-xs text-slate-300 mt-1">Password: <span className="text-auction-gold">{user.password}</span></p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="rounded-full border border-auction-gold/40 px-3 py-1 text-[10px] font-black tracking-[0.16em] text-auction-gold">{tierOf(user)}</span>
                        <button type="button" onClick={() => { setTab('login'); setLoginForm({ login: user.username || user.email, password: user.password }); }} className="rounded-xl bg-auction-gold px-3 py-2 text-xs font-black text-black">Use demo</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
