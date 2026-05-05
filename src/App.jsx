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

const AUTH_KEY = 'auction_platform_login_v2_user_id'

function getRoute() {
  const hash = window.location.hash.replace('#', '')
  return hash || '/'
}

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
  const { setCurrentUser } = useAuction()
  const [selectedUserId, setSelectedUserId] = useState(() => localStorage.getItem(AUTH_KEY) || '')
  const [loading, setLoading] = useState(false)

  const loginUsers = useMemo(() => DEMO_ACCOUNTS, [])

  useEffect(() => {
    if (!selectedUserId) return
    localStorage.setItem(AUTH_KEY, selectedUserId)
    setCurrentUser(selectedUserId)
  }, [selectedUserId, setCurrentUser])

  function handleLogin(userId) {
    setLoading(true)
    setTimeout(() => {
      setCurrentUser(userId)
      setSelectedUserId(userId)
      setLoading(false)
      window.location.hash = '#/'
    }, 1200)
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_KEY)
    setSelectedUserId('')
    window.location.hash = '#/'
  }

  if (loading) return <LoadingScreen />
  if (!selectedUserId) return <LoginPage users={loginUsers} onLogin={handleLogin} />

  return <Router onLogout={handleLogout} />
}

export default function App() {
  return (
    <AuctionProvider>
      <AuthGate />
    </AuctionProvider>
  )
}
