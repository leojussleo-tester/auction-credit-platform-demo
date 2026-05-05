import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import LoginPage from './components/LoginPage'
import LoadingScreen from './components/LoadingScreen'
import { AuctionProvider, useAuction } from './context/AuctionContext'
import Home from './pages/Home'
import AccountKYC from './pages/AccountKYC'
import Wallet from './pages/Wallet'
import BidPage from './pages/BidPage'
import BidRoom from './pages/BidRoom'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'

const AUTH_KEY = 'auction-auth-session'
const getRoute = () => window.location.hash.replace('#', '') || '/'

function useHashRoute() {
  const [route, setRoute] = useState(getRoute())
  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return route
}

function Router({ onLogout }) {
  const route = useHashRoute()
  const roomMatch = route.match(/^\/room\/(.+)$/)
  const { currentUser } = useAuction()
  const role = currentUser?.role
  let page = <Home />
  if (role !== 'admin' && route === '/account') page = <AccountKYC />
  if (role !== 'admin' && route === '/wallet') page = <Wallet />
  if (route === '/bid') page = <BidPage />
  if (roomMatch) page = <BidRoom roomId={roomMatch[1]} />
  if (route === '/seller') page = role === 'seller' ? <SellerDashboard /> : <Home />
  if (route === '/admin') page = role === 'admin' ? <AdminDashboard /> : <Home />
  return <Layout route={route} onLogout={onLogout}>{page}</Layout>
}

function AuthGate() {
  const { state, setCurrentUser, registerAccount } = useAuction()
  const [selectedUserId, setSelectedUserId] = useState(() => {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return ''
    try { return JSON.parse(raw).userId || '' } catch { return '' }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedUserId) return
    localStorage.setItem(AUTH_KEY, JSON.stringify({ userId: selectedUserId, loginAt: new Date().toISOString() }))
    setCurrentUser(selectedUserId)
  }, [selectedUserId, setCurrentUser])

  function handleLogin({ login, password }) {
    const normalized = (login || '').trim().toLowerCase()
    const user = state.users.find((u) => u.email.toLowerCase() === normalized || (u.username || '').toLowerCase() === normalized)
    if (!user) return { ok: false, message: 'Không tìm thấy tài khoản.' }
    if ((user.password || '') !== password) return { ok: false, message: 'Sai mật khẩu.' }
    setLoading(true)
    setTimeout(() => {
      setCurrentUser(user.id)
      setSelectedUserId(user.id)
      setLoading(false)
      window.location.hash = '#/'
    }, 600)
    return { ok: true }
  }

  function handleRegister(form) {
    const login = (form.login || '').trim()
    if (!form.name || !login || !form.password) return { ok: false, message: 'Vui lòng nhập đủ thông tin bắt buộc.' }
    if (form.password !== form.confirmPassword) return { ok: false, message: 'Xác nhận mật khẩu không khớp.' }
    if (form.role === 'seller' && (!form.shopName || !form.phone || !form.bankAccount)) return { ok: false, message: 'Seller cần shop name, phone và bank account.' }

    const isEmail = login.includes('@')
    const payload = {
      role: form.role,
      name: form.name.trim(),
      username: isEmail ? login.split('@')[0] : login,
      email: isEmail ? login : `${login}@local.demo`,
      login,
      password: form.password,
      shopName: form.shopName,
      phone: form.phone,
      bankAccount: form.bankAccount,
    }

    const result = registerAccount(payload)
    if (!result.ok) return { ok: false, message: result.message }
    setSelectedUserId(result.userId)
    window.location.hash = '#/'
    return { ok: true }
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_KEY)
    setSelectedUserId('')
    window.location.hash = '#/'
  }

  if (loading) return <LoadingScreen />
  if (!selectedUserId) return <LoginPage users={state.users} onLogin={handleLogin} onRegister={handleRegister} />
  return <Router onLogout={handleLogout} />
}

export default function App() {
  return <AuctionProvider><AuthGate /></AuctionProvider>
}
