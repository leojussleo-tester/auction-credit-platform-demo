import { useMemo, useState } from 'react'

const groups = [
  { key: 'buyer', title: 'Member Account' },
  { key: 'seller', title: 'Seller Account' },
  { key: 'admin', title: 'Admin Account' },
]

export default function LoginPage({ users, onLogin, onRegister }) {
  const [activeTab, setActiveTab] = useState('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', accountType: 'member', shopName: '', phone: '', bankInfo: '',
  })
  const [error, setError] = useState('')

  const demoUsers = useMemo(() => users.filter((user) => ['buyer', 'seller', 'admin'].includes(user.role)), [users])

  function submitLogin(event) {
    event.preventDefault()
    setError('')
    const email = loginForm.email.trim().toLowerCase()
    const user = users.find((item) => item.email.toLowerCase() === email)
    if (!user) return setError('Không tìm thấy tài khoản.')
    const password = user.password || 'demo123'
    if (loginForm.password !== password) return setError('Sai mật khẩu.')
    onLogin(user.id)
  }

  function fillDemoAccount(user) {
    setLoginForm({ email: user.email, password: user.password || 'demo123' })
    setActiveTab('login')
    setError('')
  }

  function submitRegister(event) {
    event.preventDefault()
    setError('')
    if (registerForm.password !== registerForm.confirmPassword) return setError('Mật khẩu xác nhận không khớp.')
    if (registerForm.accountType === 'seller' && (!registerForm.shopName || !registerForm.phone || !registerForm.bankInfo)) {
      return setError('Seller cần nhập Shop name, SĐT và Bank info.')
    }
    const result = onRegister({
      name: registerForm.name.trim(),
      email: registerForm.email.trim(),
      password: registerForm.password,
      accountType: registerForm.accountType === 'seller' ? 'seller' : 'member',
      shopName: registerForm.shopName.trim(),
      phone: registerForm.phone.trim(),
      bankInfo: registerForm.bankInfo.trim(),
    })
    if (!result.ok) return setError(result.message || 'Đăng ký thất bại.')
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070b] text-white">
      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-5 py-10">
        <div className="w-full rounded-[2rem] border border-auction-gold/25 bg-black/55 p-5 shadow-luxury backdrop-blur-2xl md:p-9">
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Auction Platform</h1>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setActiveTab('login')} className={`rounded-xl px-4 py-2 font-black ${activeTab === 'login' ? 'bg-auction-gold text-black' : 'bg-white/10 text-white'}`}>Đăng nhập</button>
            <button onClick={() => setActiveTab('register')} className={`rounded-xl px-4 py-2 font-black ${activeTab === 'register' ? 'bg-auction-gold text-black' : 'bg-white/10 text-white'}`}>Đăng ký</button>
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={submitLogin} className="mt-6 max-w-xl space-y-4">
              <input className="w-full rounded-xl border border-white/20 bg-white/5 p-3" placeholder="Tài khoản / Email" value={loginForm.email} onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))} />
              <input type="password" className="w-full rounded-xl border border-white/20 bg-white/5 p-3" placeholder="Mật khẩu" value={loginForm.password} onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))} />
              <button type="submit" className="rounded-xl bg-auction-gold px-5 py-3 font-black text-black">Đăng nhập</button>
            </form>
          ) : (
            <form onSubmit={submitRegister} className="mt-6 grid max-w-3xl gap-3 md:grid-cols-2">
              <input className="rounded-xl border border-white/20 bg-white/5 p-3" placeholder="Họ tên" value={registerForm.name} onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))} />
              <input className="rounded-xl border border-white/20 bg-white/5 p-3" placeholder="Email" value={registerForm.email} onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))} />
              <input type="password" className="rounded-xl border border-white/20 bg-white/5 p-3" placeholder="Mật khẩu" value={registerForm.password} onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))} />
              <input type="password" className="rounded-xl border border-white/20 bg-white/5 p-3" placeholder="Xác nhận mật khẩu" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
              <select className="rounded-xl border border-white/20 bg-white/5 p-3" value={registerForm.accountType} onChange={(e) => setRegisterForm((prev) => ({ ...prev, accountType: e.target.value }))}>
                <option value="member">Member</option>
                <option value="seller">Seller</option>
              </select>
              {registerForm.accountType === 'seller' && (
                <>
                  <input className="rounded-xl border border-white/20 bg-white/5 p-3" placeholder="Shop name" value={registerForm.shopName} onChange={(e) => setRegisterForm((prev) => ({ ...prev, shopName: e.target.value }))} />
                  <input className="rounded-xl border border-white/20 bg-white/5 p-3" placeholder="SĐT" value={registerForm.phone} onChange={(e) => setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))} />
                  <input className="rounded-xl border border-white/20 bg-white/5 p-3 md:col-span-2" placeholder="Bank info" value={registerForm.bankInfo} onChange={(e) => setRegisterForm((prev) => ({ ...prev, bankInfo: e.target.value }))} />
                </>
              )}
              <button type="submit" className="rounded-xl bg-auction-gold px-5 py-3 font-black text-black md:col-span-2">Tạo tài khoản</button>
            </form>
          )}

          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {groups.map((group) => (
              <section key={group.key} className="rounded-2xl border border-white/10 bg-slate-950/75 p-4">
                <h2 className="text-lg font-black">{group.title}</h2>
                <div className="mt-3 space-y-2">
                  {demoUsers.filter((user) => user.role === group.key).map((user) => (
                    <button key={user.id} onClick={() => fillDemoAccount(user)} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left">
                      <p className="font-bold">{user.name}</p>
                      <p className="text-sm text-slate-300">{user.email}</p>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
