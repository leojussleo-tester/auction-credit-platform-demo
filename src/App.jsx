import { useEffect, useMemo, useState } from 'react'
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
import { DEMO_ACCOUNTS } from './data/demoAccounts'

const SESSION_KEY = 'auction-auth-session'

const roleOf = (u) => (u?.role === 'buyer' ? 'member' : u?.role)
function getRoute() { return window.location.hash.replace('#', '') || '/' }
function useHashRoute() { const [route, setRoute] = useState(getRoute()); useEffect(() => { const onHashChange = () => setRoute(getRoute()); window.addEventListener('hashchange', onHashChange); return () => window.removeEventListener('hashchange', onHashChange) }, []); return route }

function Router({ onLogout }) {
  const route = useHashRoute(); const roomMatch = route.match(/^\/room\/(.+)$/); const { currentUser } = useAuction(); const role = roleOf(currentUser)
  let page = <Home />
  if (role !== 'admin' && route === '/account') page = <AccountKYC />
  if (role !== 'admin' && route === '/wallet') page = <Wallet />
  if (route === '/bid' && role !== 'admin') page = <BidPage />
  if (roomMatch && role !== 'admin') page = <BidRoom roomId={roomMatch[1]} />
  if (route === '/seller') page = role === 'seller' ? <SellerDashboard /> : <Home />
  if (route === '/admin') page = role === 'admin' ? <AdminDashboard /> : <Home />
  return <Layout route={route} onLogout={onLogout}>{page}</Layout>
}

function AuthGate() {
  const { setCurrentUser, registerUser } = useAuction()
  const [sessionUserId, setSessionUserId] = useState(() => sessionStorage.getItem(SESSION_KEY) || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const loginUsers = useMemo(() => DEMO_ACCOUNTS.map((u) => ({ ...u, role: roleOf(u), password: 'demo123' })), [])

  function handleLogin(form) {
    const account = (form.account || '').trim().toLowerCase()
    const found = loginUsers.find((u) => u.email.toLowerCase() === account || u.name.toLowerCase() === account)
    if (!found || form.password !== found.password) return setMessage('Invalid account/email or password.')
    setLoading(true)
    setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, found.id)
      setCurrentUser(found.id)
      setSessionUserId(found.id)
      setMessage('')
      setLoading(false)
      window.location.hash = '#/'
    }, 500)
  }

  function handleRegister(form) {
    if (!form.fullName || !form.email || !form.password) return setMessage('Please fill all required fields.')
    if (form.password !== form.confirmPassword) return setMessage('Confirm password does not match.')
    const id = `u-${form.accountType}-${Date.now()}`
    const account = {
      id, role: form.accountType, name: form.fullName, email: form.email, password: form.password,
      phone: form.phone || '', shopName: form.shopName || '', bankInfo: form.bankInfo || '',
      kycStatus: 'Pending', sellerEnabled: form.accountType === 'seller' ? false : false,
      sellerApprovalStatus: form.accountType === 'seller' ? 'Pending' : undefined,
      memberLevelOverride: 'Classic', score: 0, winsPaid: 0, totalWonValue: 0, failedPayments: [], seriousFailedPayments: 0,
      wallet: { available: 0, pending: 0 }, transactions: [], winHistory: [],
    }
    registerUser(account)
    setMessage('Registered successfully. Please login with your new account.')
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY)
    setSessionUserId('')
    window.location.hash = '#/'
  }

  useEffect(() => { if (sessionUserId) setCurrentUser(sessionUserId) }, [sessionUserId, setCurrentUser])

  if (loading) return <LoadingScreen />
  if (!sessionUserId) return <><LoginPage users={loginUsers} onLogin={handleLogin} onRegister={handleRegister} />{message ? <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-black/80 px-4 py-2 text-sm text-white">{message}</div> : null}</>
  return <Router onLogout={handleLogout} />
}

export default function App() { return <AuctionProvider><AuthGate /></AuctionProvider> }
