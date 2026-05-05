import { useEffect, useMemo, useState } from 'react'
import Layout from './components/Layout'
import { AuctionProvider, useAuction } from './context/AuctionContext'
import Home from './pages/Home'
import AccountKYC from './pages/AccountKYC'
import Wallet from './pages/Wallet'
import BidPage from './pages/BidPage'
import BidRoom from './pages/BidRoom'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import LoginPage from './components/LoginPage'
import LoadingScreen from './components/LoadingScreen'

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

function Router() {
  const route = useHashRoute()
  const roomMatch = route.match(/^\/room\/(.+)$/)
  const { currentUser } = useAuction()

  let page = <Home />
  if (route === '/account') page = <AccountKYC />
  if (route === '/wallet') page = <Wallet />
  if (route === '/bid') page = <BidPage />
  if (roomMatch) page = <BidRoom roomId={roomMatch[1]} />
  if (route === '/seller' && currentUser?.role === 'seller') page = <SellerDashboard />
  if (route === '/admin' && currentUser?.role === 'admin') page = <AdminDashboard />

  return <Layout route={route}>{page}</Layout>
}

export default function App() {
  const [selectedUserId, setSelectedUserId] = useState(() => localStorage.getItem('auction_login_user_id'))
  const [loading, setLoading] = useState(false)

  const ready = Boolean(selectedUserId)

  useEffect(() => {
    if (selectedUserId) localStorage.setItem('auction_login_user_id', selectedUserId)
    else localStorage.removeItem('auction_login_user_id')
  }, [selectedUserId])

  return (
    <AuctionProvider>
      <AuthGate ready={ready} selectedUserId={selectedUserId} onLogin={setSelectedUserId} loading={loading} setLoading={setLoading} />
    </AuctionProvider>
  )
}

function AuthGate({ ready, selectedUserId, onLogin, loading, setLoading }) {
  const { state, setCurrentUser } = useAuction()

  useEffect(() => {
    if (selectedUserId) setCurrentUser(selectedUserId)
  }, [selectedUserId, setCurrentUser])

  const loginUsers = useMemo(
    () => state.users.filter((u) => ['buyer', 'seller', 'admin'].includes(u.role)),
    [state.users]
  )

  const handleLogin = (id) => {
    setLoading(true)
    setTimeout(() => {
      onLogin(id)
      setCurrentUser(id)
      setLoading(false)
      window.location.hash = '#/'
    }, 1300)
  }

  if (!ready) return loading ? <LoadingScreen /> : <LoginPage users={loginUsers} onLogin={handleLogin} />
  if (loading) return <LoadingScreen />

  return <Router />
}
