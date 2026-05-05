import { useMemo, useState } from 'react'
import { STORAGE_KEY } from '../data/mockData'

const DEMO_PASS = 'demo123'

const groups = [
  { key: 'buyer', title: 'Member Account', subtitle: 'Sign up + KYC mock', description: 'Classic / Pro / VIP member demo accounts for bidding and wallet flow.' },
  { key: 'seller', title: 'Seller Account', subtitle: 'KYC + Accept mock', description: 'Seller dashboard, product registration, settlement and seller rule flow.' },
  { key: 'admin', title: 'Admin Account', subtitle: 'Platform staff', description: 'Platform controls for rooms, reports, product approvals and wallet requests.' },
]

const blankRegister = { name: '', email: '', pass: '', confirm: '', role: 'buyer', phone: '', shopName: '', bankInfo: '' }

function tierOf(user) {
  return user.memberLevelOverride || user.sellerTier || (user.role === 'admin' ? 'STAFF' : 'CLASSIC')
}

function passOf(user) {
  return user.demoPass || DEMO_PASS
}

function saveRegisteredAccount(account) {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  const users = Array.isArray(saved.users) ? saved.users : []
  const nextState = { ...saved, users: [account, ...users.filter((user) => user.id !== account.id)] }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
}

export default function LoginPage({ users = [], onLogin }) {
  const [tab, setTab] = useState('login')
  const [account, setAccount] = useState('')
  const [pass, setPass] = useState('')
  const [register, setRegister] = useState(blankRegister)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const allUsers = useMemo(() => users || [], [users])

  function clearMessages() {
    setError('')
    setNotice('')
  }

  function fillDemo(user) {
    setTab('login')
    setAccount(user.email)
    setPass(passOf(user))
    setError('')
    setNotice(`Đã điền ${user.email}. Bấm Đăng nhập để vào app.`)
  }

  function submitLogin(event) {
    event.preventDefault()
    clearMessages()
    const normalized = account.trim().toLowerCase()
    const found = allUsers.find((user) => user.email?.toLowerCase() === normalized || user.username?.toLowerCase() === normalized)
    if (!found || passOf(found) !== pass) {
      setError('Sai tài khoản hoặc mật khẩu. Demo password mặc định: demo123')
      return
    }
    onLogin(found.id)
  }

  function setReg(field, value) {
    setRegister((prev) => ({ ...prev, [field]: value }))
  }

  function submitRegister(event) {
    event.preventDefault()
    clearMessages()
    const email = register.email.trim().toLowerCase()
    if (!register.name.trim() || !email || !register.pass) {
      setError('Vui lòng nhập đủ họ tên, tài khoản/email và mật khẩu.')
      return
    }
    if (register.pass.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự.')
      return
    }
    if (register.pass !== register.confirm) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    if (allUsers.some((user) => user.email?.toLowerCase() === email || user.username?.toLowerCase() === email)) {
      setError('Email/tài khoản này đã tồn tại.')
      return
    }
    if (register.role === 'seller' && (!register.shopName.trim() || !register.phone.trim() || !register.bankInfo.trim())) {
      setError('Seller cần nhập shop name, SĐT và bank info.')
      return
    }

    const newUser = {
      id: `u-custom-${Date.now()}`,
      role: register.role,
      name: register.name.trim(),
      email,
      username: email,
      demoPass: register.pass,
      phone: register.phone.trim(),
      shopName: register.shopName.trim(),
      bankInfo: register.bankInfo.trim(),
      kycStatus: 'Pending',
      sellerEnabled: false,
      sellerApprovalStatus: register.role === 'seller' ? 'Pending' : 'Not Seller',
      sellerTier: register.role === 'seller' ? 'Classic' : undefined,
      memberLevelOverride: 'Classic',
      score: 0,
      winsPaid: 0,
      totalWonValue: 0,
      failedPayments: [],
      seriousFailedPayments: 0,
      wallet: { available: 0, pending: 0 },
      winHistory: [],
      transactions: [],
    }

    saveRegisteredAccount(newUser)
    setRegister(blankRegister)
    setAccount(email)
    setPass(newUser.demoPass)
    setTab('login')
    setNotice('Đăng ký thành công. Trang sẽ tải lại để đồng bộ tài khoản mới, sau đó bấm Đăng nhập.')
    setTimeout(() => window.location.reload(), 900)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(226,184,90,.24),transparent_32%),radial-gradient(circle_at_85%_5%,rgba(52,211,153,.13),transparent_28%),linear-gradient(135deg,#040507,#0b1020_55%,#06070b)]" />
      <section className="relative mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full rounded-[2rem] border border-auction-gold/25 bg-black/60 p-4 shadow-luxury backdrop-blur-2xl sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
            <aside className="lg:sticky lg:top-8">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-auction-gold">Auction Platform Login</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">Login required</h1>
              <p className="mt-4 text-base leading-7 text-slate-300">Nhập tài khoản + mật khẩu hoặc dùng demo account. Member, Seller và Admin sẽ mở đúng giao diện theo quyền.</p>
              <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                <button type="button" onClick={() => { setTab('login'); clearMessages() }} className={`rounded-xl px-4 py-3 text-sm font-black transition ${tab === 'login' ? 'bg-auction-gold text-black' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Đăng nhập</button>
                <button type="button" onClick={() => { setTab('register'); clearMessages() }} className={`rounded-xl px-4 py-3 text-sm font-black transition ${tab === 'register' ? 'bg-auction-gold text-black' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Đăng ký</button>
              </div>
              {error ? <div className="mt-4 rounded-2xl border border-rose-400/35 bg-rose-500/10 p-4 text-sm font-bold text-rose-100">{error}</div> : null}
              {notice ? <div className="mt-4 rounded-2xl border border-emerald-300/35 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-100">{notice}</div> : null}
            </aside>

            <section className="space-y-5">
              {tab === 'login' ? (
                <form onSubmit={submitLogin} className="rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-4 shadow-[0_24px_90px_rgba(0,0,0,.32)] sm:p-5">
                  <p className="text-xs font-black uppercase tracking-[0.26em] text-auction-gold">Login Form</p>
                  <h2 className="mt-3 text-3xl font-black text-white">Tài khoản + Mật khẩu</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Demo mặc định: <span className="font-black text-auction-gold">demo123</span></p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label><span className="label">Tài khoản / Email</span><input className="field" value={account} onChange={(event) => setAccount(event.target.value)} placeholder="buyer@demo.local" /></label>
                    <label><span className="label">Mật khẩu</span><input className="field" type="password" value={pass} onChange={(event) => setPass(event.target.value)} placeholder="demo123" /></label>
                  </div>
                  <button className="btn-primary mt-5 w-full" type="submit">Đăng nhập</button>
                </form>
              ) : (
                <form onSubmit={submitRegister} className="rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-4 shadow-[0_24px_90px_rgba(0,0,0,.32)] sm:p-5">
                  <p className="text-xs font-black uppercase tracking-[0.26em] text-auction-gold">Register Form</p>
                  <h2 className="mt-3 text-3xl font-black text-white">Đăng ký Member / Seller</h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="md:col-span-2"><span className="label">Họ tên</span><input className="field" value={register.name} onChange={(event) => setReg('name', event.target.value)} /></label>
                    <label><span className="label">Tài khoản / Email</span><input className="field" value={register.email} onChange={(event) => setReg('email', event.target.value)} /></label>
                    <label><span className="label">Loại tài khoản</span><select className="field" value={register.role} onChange={(event) => setReg('role', event.target.value)}><option value="buyer">Member</option><option value="seller">Seller</option></select></label>
                    <label><span className="label">Mật khẩu</span><input className="field" type="password" value={register.pass} onChange={(event) => setReg('pass', event.target.value)} /></label>
                    <label><span className="label">Xác nhận mật khẩu</span><input className="field" type="password" value={register.confirm} onChange={(event) => setReg('confirm', event.target.value)} /></label>
                    {register.role === 'seller' ? <><label><span className="label">Shop name</span><input className="field" value={register.shopName} onChange={(event) => setReg('shopName', event.target.value)} /></label><label><span className="label">SĐT</span><input className="field" value={register.phone} onChange={(event) => setReg('phone', event.target.value)} /></label><label className="md:col-span-2"><span className="label">Bank info</span><input className="field" value={register.bankInfo} onChange={(event) => setReg('bankInfo', event.target.value)} /></label></> : null}
                  </div>
                  <button className="btn-primary mt-5 w-full" type="submit">Tạo tài khoản</button>
                </form>
              )}

              <div className="grid gap-4 xl:grid-cols-3">
                {groups.map((group) => {
                  const groupUsers = allUsers.filter((user) => user.role === group.key && !user.id?.startsWith('u-custom-'))
                  return (
                    <section key={group.key} className="flex h-full flex-col rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-4 shadow-[0_24px_90px_rgba(0,0,0,.32)] sm:p-5">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-auction-gold">{group.title}</p>
                      <h3 className="mt-3 min-h-[64px] text-2xl font-black text-white">{group.subtitle}</h3>
                      <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-300">{group.description}</p>
                      <div className="mt-5 grid flex-1 gap-3">
                        {groupUsers.map((user) => (
                          <article key={user.id} className="flex min-h-[190px] flex-col justify-between rounded-2xl border border-auction-gold/20 bg-white/[0.055] p-4 text-left">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0"><p className="text-lg font-black text-white">{user.name}</p><p className="mt-1 break-all text-sm text-slate-300">{user.email}</p><p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{group.title.toUpperCase()} · demo123</p></div>
                              <span className="shrink-0 rounded-full border border-auction-gold/40 bg-auction-gold/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-auction-gold">{tierOf(user)}</span>
                            </div>
                            <button type="button" onClick={() => fillDemo(user)} className="mt-4 inline-flex w-fit rounded-xl bg-auction-gold px-4 py-2 text-sm font-black text-black transition hover:brightness-110">Use demo</button>
                          </article>
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}
