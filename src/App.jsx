import { useEffect, useMemo, useState } from 'react'
import Layout from './components/Layout'
import LoginPage from './components/LoginPage'
import LoadingScreen from './components/LoadingScreen'
import { AuctionProvider, useAuction } from './context/AuctionContext'
import Home from './pages/Home'
import AccountKYC from './pages/AccountKYC'
import Wallet from './pages/WalletClean'
import BidPage from './pages/BidPage'
import BidRoom from './pages/BidRoom'
import SellerDashboard from './pages/SellerDashboardV2'
import AdminDashboard from './pages/AdminDashboardV2'
import AdminFinanceHistory from './pages/AdminFinanceHistory'

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
  if (route === '/account') page = <AccountKYC />
  if (route === '/wallet') page = <Wallet />
  if (route === '/bid') page = <BidPage />
  if (roomMatch) page = <BidRoom roomId={roomMatch[1]} />
  if (route === '/seller') page = role === 'seller' ? <SellerDashboard /> : <Home />
  if (route === '/admin') page = role === 'admin' ? <AdminDashboard /> : <Home />
  if (route === '/admin-history') page = role === 'admin' ? <AdminFinanceHistory /> : <Home />
  return <Layout route={route} onLogout={onLogout}>{page}</Layout>
}

function AuthGate() {
  const { state, setCurrentUser } = useAuction()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const loginUsers = useMemo(() => state.users, [state.users])
  useEffect(() => { localStorage.removeItem(AUTH_KEY); if (selectedUserId) setCurrentUser(selectedUserId) }, [selectedUserId, setCurrentUser])
  function handleLogin(userId) { setLoading(true); setTimeout(() => { setCurrentUser(userId); setSelectedUserId(userId); setLoading(false); window.location.hash = '#/' }, 800) }
  function handleLogout() { localStorage.removeItem(AUTH_KEY); setSelectedUserId(''); window.location.hash = '#/' }
  if (loading) return <LoadingScreen />
  if (!selectedUserId) return <LoginPage users={loginUsers} onLogin={handleLogin} />
  return <Router onLogout={handleLogout} />
}

export default function App() {
  return <AuctionProvider><AuthGate /></AuctionProvider>
}
